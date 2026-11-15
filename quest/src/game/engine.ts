// Mempool Guard — deterministic game engine.
//
// The whole run is a pure function of (seed, moves). The seed is the hash of a
// real Diana block; the moves are the player's decisions. Anyone can replay a
// submitted run from the on-chain memo and recompute the exact score, so the
// leaderboard needs no contract and cannot be padded with an invented score.
// (Replay proves the score matches the moves — not that a human made them.)

export type Move = "A" | "R" | "T"; // approve, reject, timed out
export type Forgery =
  | "none"
  | "wrong-chain"
  | "chain-typo"
  | "no-pqc"
  | "pqc-level"
  | "pqc-truncated"
  | "classical-len"
  | "body-hash"
  | "fee-floor";

export interface TxCard {
  index: number;
  level: number;
  hash: string;
  chainId: string;
  from: string;
  to: string;
  amount: number; // uqor
  memo: string;
  gas: number;
  fee: number; // uqor
  classicalSigBytes: number;
  pqc: { alg: string; bytes: number } | null;
  bodyHash: string;
  signedHash: string;
  forgery: Forgery;
  timeMs: number;
}

export const MAX_CARDS = 40;
export const START_SHIELDS = 3;
export const CHAIN_ID = "qorechain-diana";
export const ML_DSA_87_BYTES = 4627;
export const SECP256K1_SIG_BYTES = 64;
export const MIN_GAS_PRICE = 0.1;

export interface Rule {
  id: Forgery;
  level: number;
  title: string;
  check: string;
  why: string;
  subtle: boolean;
}

export const RULES: Rule[] = [
  { id: "wrong-chain", level: 1, title: "Wrong network", check: `Chain ID must be ${CHAIN_ID}`, why: "A signature for another chain must never be replayed here.", subtle: false },
  { id: "no-pqc", level: 1, title: "No post-quantum signature", check: "PQCHybridSignature extension must be present", why: "Classical-only signatures fall to a quantum attacker. QoreChain refuses them.", subtle: false },
  { id: "pqc-level", level: 2, title: "Wrong ML-DSA level", check: `ML-DSA-87 signature is exactly ${ML_DSA_87_BYTES.toLocaleString("en-US")} bytes`, why: "2,420 B is ML-DSA-44 and 3,309 B is ML-DSA-65. Those are lower security levels than the chain requires.", subtle: false },
  { id: "classical-len", level: 2, title: "Malformed classical sig", check: `secp256k1 signature is exactly ${SECP256K1_SIG_BYTES} bytes`, why: "Hybrid means both halves must be valid. A broken classical half fails the whole tx.", subtle: false },
  { id: "chain-typo", level: 3, title: "Look-alike chain ID", check: "Read the chain ID letter by letter", why: "Phishing chains use near-identical IDs to collect signatures.", subtle: true },
  { id: "fee-floor", level: 3, title: "Fee below floor", check: `Gas price must be ≥ ${MIN_GAS_PRICE} uqor/gas`, why: "Validators reject transactions that pay below the network minimum.", subtle: true },
  { id: "pqc-truncated", level: 4, title: "Truncated PQC signature", check: `Off by even one byte from ${ML_DSA_87_BYTES.toLocaleString("en-US")} = forged`, why: "An attacker who strips or pads bytes produces a signature that cannot verify.", subtle: true },
  { id: "body-hash", level: 4, title: "Tampered body", check: "Signed hash must equal body hash", why: "If the body changed after signing, the signature covers a different transaction.", subtle: true },
];

export function levelFor(index: number): number {
  if (index < 6) return 1;
  if (index < 14) return 2;
  if (index < 24) return 3;
  return 4;
}

export function timeFor(index: number): number {
  return Math.max(3800, 9000 - index * 170);
}

// --- deterministic PRNG -------------------------------------------------------
function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function rng(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BECH = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const HEX = "0123456789ABCDEF";
const MEMOS = ["", "", "gm diana", "rent split", "faucet refill", "coffee ☕", "invoice #2291", "staking topup", "test 1 2 3", "q-day ready", "hackathon payout", "", "lunch"];
const WRONG_CHAINS = ["qorechain-vladi", "cosmoshub-4", "osmosis-1", "ethereum-1"];
const TYPO_CHAINS = ["qorechain-dlana", "qorechian-diana", "qorechain-diana-1", "q0rechain-diana", "qorechain-dianna", "qorechain_diana"];

export function generateDeck(seed: string, count = MAX_CARDS): TxCard[] {
  const r = rng(`mempool-guard/v1/${seed.toUpperCase()}`);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const str = (alphabet: string, n: number) => Array.from({ length: n }, () => pick(alphabet.split(""))).join("");
  const cards: TxCard[] = [];

  for (let i = 0; i < count; i++) {
    const level = levelFor(i);
    const forged = i === 0 ? false : r() < 0.46;
    const pool = RULES.filter((x) => x.level <= level);
    // Favour the newest rule right after it unlocks, so each level teaches something.
    const fresh = pool.filter((x) => x.level === level);
    const forgery: Forgery = forged ? (fresh.length && r() < 0.45 ? pick(fresh) : pick(pool)).id : "none";

    const gas = 110000 + Math.floor(r() * 190) * 1000;
    const bodyHash = str(HEX, 12);
    const card: TxCard = {
      index: i,
      level,
      hash: str(HEX, 64),
      chainId: CHAIN_ID,
      from: "qor1" + str(BECH, 38),
      to: "qor1" + str(BECH, 38),
      amount: (1 + Math.floor(r() * 2500)) * 1000,
      memo: pick(MEMOS),
      gas,
      fee: Math.ceil(gas * (0.12 + r() * 0.08)),
      classicalSigBytes: SECP256K1_SIG_BYTES,
      pqc: { alg: "ML-DSA-87", bytes: ML_DSA_87_BYTES },
      bodyHash,
      signedHash: bodyHash,
      forgery,
      timeMs: timeFor(i),
    };

    switch (forgery) {
      case "wrong-chain": card.chainId = pick(WRONG_CHAINS); break;
      case "chain-typo": card.chainId = pick(TYPO_CHAINS); break;
      case "no-pqc": card.pqc = null; break;
      case "pqc-level": card.pqc = { alg: "ML-DSA-87", bytes: pick([2420, 3309]) }; break;
      case "pqc-truncated": card.pqc = { alg: "ML-DSA-87", bytes: ML_DSA_87_BYTES + pick([-1, 1, -2, -16]) }; break;
      case "classical-len": card.classicalSigBytes = pick([63, 65, 71, 32]); break;
      case "fee-floor": card.fee = Math.floor(gas * (0.02 + r() * 0.07)); break;
      case "body-hash": {
        const pos = Math.floor(r() * 12);
        const cur = bodyHash[pos];
        const alt = HEX.replace(cur, "")[Math.floor(r() * 15)];
        card.signedHash = bodyHash.slice(0, pos) + alt + bodyHash.slice(pos + 1);
        break;
      }
    }
    cards.push(card);
  }
  return cards;
}

// --- scoring ------------------------------------------------------------------
export interface Outcome {
  card: TxCard;
  move: Move;
  correct: boolean;
  breach: boolean; // forged tx let through
  points: number;
  streak: number;
  multiplier: number;
}

export interface RunState {
  score: number;
  shields: number;
  streak: number;
  bestStreak: number;
  outcomes: Outcome[];
  over: boolean;
}

export function initialState(): RunState {
  return { score: 0, shields: START_SHIELDS, streak: 0, bestStreak: 0, outcomes: [], over: false };
}

export function multiplierFor(streak: number): number {
  return Math.min(5, 1 + Math.floor(streak / 5));
}

export function applyMove(s: RunState, card: TxCard, move: Move): RunState {
  const forged = card.forgery !== "none";
  const correct = (forged && move === "R") || (!forged && move === "A");
  const breach = forged && move !== "R";
  let { score, shields, streak, bestStreak } = s;
  let points = 0;
  if (correct) {
    streak += 1;
    const subtle = RULES.find((x) => x.id === card.forgery)?.subtle ?? false;
    points = (forged ? (subtle ? 200 : 150) : 100) * multiplierFor(streak);
    score += points;
    bestStreak = Math.max(bestStreak, streak);
  } else {
    streak = 0;
    if (breach) shields -= 1;
    else {
      points = -Math.min(50, score);
      score += points;
    }
  }
  const outcomes = [...s.outcomes, { card, move, correct, breach, points, streak, multiplier: multiplierFor(streak) }];
  const over = shields <= 0 || outcomes.length >= MAX_CARDS;
  return { score, shields, streak, bestStreak, outcomes, over };
}

/** Replays a run from its seed and move string. Returns null if the moves are malformed. */
export function replay(seed: string, moves: string): RunState | null {
  if (!/^[ART]{1,40}$/.test(moves)) return null;
  const deck = generateDeck(seed);
  let s = initialState();
  for (let i = 0; i < moves.length; i++) {
    if (s.over) return null; // moves after the run ended
    s = applyMove(s, deck[i], moves[i] as Move);
  }
  return s.over ? s : null; // a submitted run must be finished
}

// --- on-chain memo ------------------------------------------------------------
export const MEMO_PREFIX = "mg1";

export function encodeRunMemo(seedHeight: number, moves: string, score: number): string {
  return `${MEMO_PREFIX}:${seedHeight}:${moves}:${score}`;
}

export function parseRunMemo(memo: string): { height: number; moves: string; score: number } | null {
  const m = /^mg1:(\d{1,12}):([ART]{1,40}):(\d{1,7})$/.exec(memo);
  return m ? { height: Number(m[1]), moves: m[2], score: Number(m[3]) } : null;
}

export function ruleFor(f: Forgery): Rule | undefined {
  return RULES.find((x) => x.id === f);
}

export function explain(o: Outcome): string {
  const rule = ruleFor(o.card.forgery);
  if (o.card.forgery === "none") {
    return o.correct ? "Legit hybrid tx. Approved." : o.move === "T" ? "Timed out on a legit tx." : "That one was legit. Every check passed.";
  }
  const verb = o.correct ? "Caught" : o.move === "T" ? "Slipped through" : "Breach";
  return `${verb}: ${rule?.title}. ${rule?.check}.`;
}
