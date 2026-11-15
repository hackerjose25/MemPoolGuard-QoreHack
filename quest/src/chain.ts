// Diana REST access. Every "verified" claim in the UI is computed here from
// fresh chain data, and every failure fails closed.
import { CHAIN_ID, parseRunMemo, replay } from "./game/engine";

export const REST = import.meta.env.VITE_QORE_REST_URL ?? "/lcd";
export const EXPLORER = "https://explore.qore.network";
/** Keyless scoreboard address: first 20 bytes of sha256("quantum-quest/mempool-guard/scoreboard/v1"). Nobody holds its key. */
export const SCOREBOARD = import.meta.env.VITE_SCOREBOARD_ADDRESS || "qor1mvtlqsty0aw70cj2zgu3y32hsza0pwnm898m5q";
export const RUN_FEE_UQOR = "1";
export const DENOM = "uqor";
export const MSG_SEND = "/cosmos.bank.v1beta1.MsgSend";
const PQC_EXT = "/qorechain.pqc.v1.PQCHybridSignature";
const PQC_BYTES = 4627;
/** A run's seed block must be at most this old when the run is submitted. */
export const SEED_MAX_AGE_MS = 60 * 60 * 1000;

async function get(path: string): Promise<{ status: number; body: any }> {
  const res = await fetch(`${REST}${path}`, { cache: "no-store" });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, body };
}

function b64ToHex(b64: string): string {
  return Array.from(atob(b64), (c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export interface BlockInfo {
  height: number;
  hash: string;
  time: string;
  txs: number;
  chainId: string;
}

function toBlock(body: any): BlockInfo {
  const h = body?.block?.header;
  const id = body?.block_id?.hash;
  if (!h || typeof id !== "string") throw new Error("Malformed block response");
  return { height: Number(h.height), hash: b64ToHex(id), time: h.time, txs: body.block.data?.txs?.length ?? 0, chainId: h.chain_id };
}

export async function latestBlock(): Promise<BlockInfo> {
  const { status, body } = await get("/cosmos/base/tendermint/v1beta1/blocks/latest");
  if (status !== 200) throw new Error(`Diana REST HTTP ${status}`);
  return toBlock(body);
}

const blockCache = new Map<number, BlockInfo>();
export async function blockAt(height: number): Promise<BlockInfo> {
  const hit = blockCache.get(height);
  if (hit) return hit;
  const { status, body } = await get(`/cosmos/base/tendermint/v1beta1/blocks/${height}`);
  if (status !== 200) throw new Error(body?.message ?? `HTTP ${status}`);
  const b = toBlock(body);
  blockCache.set(height, b);
  return b;
}

export async function liveChainId(): Promise<string> {
  const { status, body } = await get("/cosmos/base/tendermint/v1beta1/node_info");
  const id = body?.default_node_info?.network;
  if (status !== 200 || typeof id !== "string") throw new Error("Could not read chain ID");
  return id;
}

// --- transaction analysis -----------------------------------------------------
export interface Check {
  label: string;
  ok: boolean;
  detail: string;
}

export interface TxFacts {
  hash: string;
  height: number;
  time: string;
  code: number;
  msgTypes: string[];
  memo: string;
  sender?: string;
  pqcBytes: number;
  classicalBytes: number;
  hybridStatus: string | null;
  algorithm: string | null;
  fee: string;
  gasUsed: string;
  raw: { tx: any; r: any };
}

function b64Len(s: unknown): number {
  if (typeof s !== "string") return 0;
  try {
    return atob(s).length;
  } catch {
    return 0;
  }
}

export function factsOf(tx: any, r: any): TxFacts {
  const exts = [...(tx?.body?.extension_options ?? []), ...(tx?.body?.non_critical_extension_options ?? [])];
  const pqc = exts.find((e: any) => e?.["@type"] === PQC_EXT);
  const ev = (r?.events ?? []).find((e: any) => e?.type === "pqc_hybrid_verify");
  const attr = (k: string) => ev?.attributes?.find((a: any) => a?.key === k)?.value ?? null;
  const msgs = tx?.body?.messages ?? [];
  return {
    hash: String(r?.txhash ?? "").toUpperCase(),
    height: Number(r?.height ?? 0),
    time: r?.timestamp ?? "",
    code: Number(r?.code ?? -1),
    msgTypes: msgs.map((m: any) => String(m?.["@type"] ?? "?")),
    memo: tx?.body?.memo ?? "",
    sender: msgs[0]?.from_address ?? attr("address") ?? undefined,
    pqcBytes: b64Len(pqc?.pqc_signature),
    classicalBytes: b64Len(tx?.signatures?.[0]),
    hybridStatus: attr("status"),
    algorithm: attr("algorithm_id"),
    fee: (tx?.auth_info?.fee?.amount ?? []).map((c: any) => `${c.amount} ${c.denom}`).join(", ") || "0",
    gasUsed: r?.gas_used ?? "?",
    raw: { tx, r },
  };
}

export function hybridChecks(f: TxFacts): Check[] {
  return [
    { label: "Executed successfully", ok: f.code === 0, detail: `code ${f.code}` },
    { label: "Classical secp256k1 signature", ok: f.classicalBytes === 64, detail: `${f.classicalBytes} B` },
    { label: "ML-DSA-87 signature attached", ok: f.pqcBytes === PQC_BYTES, detail: f.pqcBytes ? `${f.pqcBytes.toLocaleString("en-US")} B` : "missing" },
    { label: "Chain verdict pqc_hybrid_verify", ok: f.hybridStatus === "verified", detail: f.hybridStatus ?? "event missing" },
  ];
}

export async function fetchTx(hash: string): Promise<TxFacts | "pending"> {
  const { status, body } = await get(`/cosmos/tx/v1beta1/txs/${hash}`);
  if (status === 404 || (status !== 200 && /not found/i.test(JSON.stringify(body ?? "")))) return "pending";
  if (status !== 200 || !body?.tx_response) throw new Error(`Diana REST HTTP ${status}`);
  return factsOf(body.tx, body.tx_response);
}

// --- run verification (used for your own submission and every leaderboard row)
export interface RunVerdict {
  status: "verified" | "rejected";
  checks: Check[];
  player: string;
  score: number;
  moves: string;
  seedHeight: number;
  facts: TxFacts;
}

export async function verifyRun(f: TxFacts, expectedPlayer?: string): Promise<RunVerdict> {
  const checks: Check[] = [];
  const add = (label: string, ok: boolean, detail: string) => checks.push({ label, ok, detail });
  const tx = f.raw.tx;
  const msgs = tx?.body?.messages ?? [];
  const m = msgs[0];
  const coin = m?.amount?.[0];
  const player = m?.from_address ?? "";

  checks.push(...hybridChecks(f));
  add(
    "Run entry: 1 uqor → scoreboard",
    msgs.length === 1 && m?.["@type"] === MSG_SEND && m?.to_address === SCOREBOARD && m?.amount?.length === 1 && coin?.denom === DENOM && coin?.amount === RUN_FEE_UQOR,
    `${coin?.amount ?? "?"} ${coin?.denom ?? ""}`,
  );
  if (expectedPlayer) add("Signed by your address", player === expectedPlayer, short(player));

  const run = parseRunMemo(f.memo);
  if (!run) {
    add("Run memo well-formed", false, JSON.stringify(f.memo).slice(0, 40));
    return { status: "rejected", checks, player, score: 0, moves: "", seedHeight: 0, facts: f };
  }

  try {
    const seed = await blockAt(run.height);
    const age = new Date(f.time).getTime() - new Date(seed.time).getTime();
    add("Seed block is real & fresh", seed.chainId === CHAIN_ID && age >= 0 && age <= SEED_MAX_AGE_MS, `#${run.height} · ${Math.round(age / 60000)} min before submit`);
    const replayed = replay(seed.hash, run.moves);
    add("Replay reproduces score", !!replayed && replayed.score === run.score, replayed ? `replayed ${replayed.score} · claimed ${run.score}` : "invalid move sequence");
  } catch (e) {
    add("Seed block readable", false, e instanceof Error ? e.message : String(e));
  }

  return {
    status: checks.every((c) => c.ok) ? "verified" : "rejected",
    checks,
    player,
    score: run.score,
    moves: run.moves,
    seedHeight: run.height,
    facts: f,
  };
}

export async function fetchLeaderboard(): Promise<RunVerdict[]> {
  const q = encodeURIComponent(`transfer.recipient='${SCOREBOARD}'`);
  const { status, body } = await get(`/cosmos/tx/v1beta1/txs?query=${q}&order_by=ORDER_BY_DESC&page=1&limit=100`);
  if (status !== 200) throw new Error(`Diana REST HTTP ${status}`);
  const rs: any[] = body?.tx_responses ?? [];
  const txs: any[] = body?.txs ?? [];
  return Promise.all(rs.map((r, i) => verifyRun(factsOf(txs[i], r))));
}

export async function recentHybridTxs(limit = 8): Promise<TxFacts[]> {
  const q = encodeURIComponent("pqc_hybrid_verify.status='verified'");
  const { status, body } = await get(`/cosmos/tx/v1beta1/txs?query=${q}&order_by=ORDER_BY_DESC&page=1&limit=${limit}`);
  if (status !== 200) throw new Error(`Diana REST HTTP ${status}`);
  const rs: any[] = body?.tx_responses ?? [];
  return rs.map((r, i) => factsOf(body.txs[i], r));
}

export function short(a: string, head = 9, tail = 6): string {
  return a && a.length > head + tail + 1 ? `${a.slice(0, head)}…${a.slice(-tail)}` : a;
}

export function msgLabel(t: string): string {
  return t.split(".").pop()?.replace(/^Msg/, "") ?? t;
}

export function ago(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
