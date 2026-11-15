import { useEffect, useState } from "react";
import { encodeRunMemo, explain, type Outcome } from "../game/engine";
import {
  EXPLORER,
  RUN_FEE_UQOR,
  SCOREBOARD,
  SEED_MAX_AGE_MS,
  fetchTx,
  liveChainId,
  short,
  verifyRun,
  type RunVerdict,
} from "../chain";
import { GAS_LIMIT, signRun } from "../qorex";
import { CHAIN_ID } from "../game/engine";
import { Checklist } from "../ui/Inspector";
import type { FinishedRun } from "./Play";

type Stage = "idle" | "approving" | "submitted" | "verifying" | "verified" | "rejected" | "error";

export function rankTitle(score: number): string {
  if (score >= 16000) return "Quantum Sentinel";
  if (score >= 10000) return "Lattice Warden";
  if (score >= 5000) return "Hybrid Validator";
  if (score >= 2000) return "Mempool Scout";
  return "Rookie Node";
}

export function Results({
  run,
  address,
  onConnect,
  onReplay,
  onBoard,
}: {
  run: FinishedRun;
  address: string;
  onConnect: () => Promise<void>;
  onReplay: () => void;
  onBoard: () => void;
}) {
  const { state, seed, moves } = run;
  const [stage, setStage] = useState<Stage>("idle");
  const [hash, setHash] = useState("");
  const [verdict, setVerdict] = useState<RunVerdict | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(i);
  }, []);

  // Count-up animation for the final score.
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 1100);
      setShown(Math.round(state.score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [state.score]);

  const outs = state.outcomes;
  const forged = outs.filter((o) => o.card.forgery !== "none");
  const caught = forged.filter((o) => o.correct).length;
  const accuracy = Math.round((outs.filter((o) => o.correct).length / Math.max(1, outs.length)) * 100);
  const mistakes = outs.filter((o) => !o.correct);
  const memo = encodeRunMemo(seed.height, moves, state.score);
  const seedAge = now - new Date(seed.time).getTime();
  const stale = seedAge > SEED_MAX_AGE_MS - 3 * 60 * 1000;

  async function submit() {
    setErr(null);
    try {
      const id = await liveChainId();
      if (id !== CHAIN_ID) throw new Error(`Network is ${id}, not ${CHAIN_ID}. Submission blocked.`);
      setStage("approving");
      const h = await signRun(address, SCOREBOARD, RUN_FEE_UQOR, memo);
      setHash(h);
      setStage("submitted");
      await verify(h);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setStage(/reject/i.test(m) ? "idle" : "error");
      setErr(/reject/i.test(m) ? "You rejected the request in QoreX. Nothing was sent." : m);
    }
  }

  async function verify(h = hash) {
    setStage("verifying");
    setErr(null);
    try {
      for (let i = 0; i < 15; i++) {
        const f = await fetchTx(h);
        if (f !== "pending") {
          const v = await verifyRun(f, address);
          setVerdict(v);
          setStage(v.status === "verified" ? "verified" : "rejected");
          return;
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
      throw new Error("Transaction not indexed yet");
    } catch (e) {
      setStage("error");
      setErr(`Couldn't verify yet (${e instanceof Error ? e.message : e}). Not marked verified. Retry below.`);
    }
  }

  return (
    <div className="results">
      <section className="score-hero">
        <p className="eyebrow">{state.shields > 0 ? "Shift complete" : "Mempool breached"}</p>
        <h1 className="big-score">{shown.toLocaleString("en-US")}</h1>
        <p className="rank">{rankTitle(state.score)}</p>
        <div className="stat-row">
          <div>
            <b>{accuracy}%</b>
            <span>accuracy</span>
          </div>
          <div>
            <b>
              {caught}/{forged.length}
            </b>
            <span>forgeries caught</span>
          </div>
          <div>
            <b>{state.bestStreak}</b>
            <span>best streak</span>
          </div>
          <div>
            <b>{outs.length}</b>
            <span>txs inspected</span>
          </div>
        </div>
        <div className="tape" aria-label="Decision tape">
          {outs.map((o) => (
            <i key={o.card.index} className={o.correct ? "ok" : o.breach ? "breach" : "miss"} title={explain(o)} />
          ))}
        </div>
      </section>

      <section className="panel submit-panel">
        <div className="panel-head">
          <h2>Put this run on-chain</h2>
          <span className="chip">Hybrid-signed · verifiable replay</span>
        </div>
        <ol className="stepper">
          {["Connect QoreX", "Review", "Approve in QoreX", "Verify from chain"].map((s, i) => {
            const at = !address ? 0 : stage === "idle" || stage === "error" ? (hash ? 3 : 1) : stage === "approving" ? 2 : stage === "verified" ? 4 : 3;
            return (
              <li key={s} className={i < at ? "done" : i === at ? "now" : ""}>
                <b>{i < at ? "✓" : i + 1}</b>
                {s}
              </li>
            );
          })}
        </ol>

        {!address ? (
          <div className="submit-body">
            <p>Connect QoreX to sign this run with your hybrid key: secp256k1 + ML-DSA-87.</p>
            <button className="btn primary" onClick={() => onConnect().catch(() => {})}>
              Connect QoreX
            </button>
          </div>
        ) : stage === "verified" && verdict ? (
          <div className="submit-body">
            <div className="verified-banner">
              <span className="seal">✓</span>
              <div>
                <b>Run verified on Diana</b>
                <small>
                  Every check passed. Block #{verdict.facts.height.toLocaleString("en-US")} · fee {verdict.facts.fee}
                </small>
              </div>
            </div>
            <Checklist checks={verdict.checks} />
            <div className="row">
              <button className="btn primary" onClick={onBoard}>
                See leaderboard
              </button>
              <a className="btn ghost" href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer">
                Explorer ↗
              </a>
            </div>
          </div>
        ) : (
          <div className="submit-body">
            <dl className="review">
              <dt>Signer</dt>
              <dd>
                <code>{short(address)}</code>
              </dd>
              <dt>Action</dt>
              <dd>
                Send {RUN_FEE_UQOR} uqor to the scoreboard <code>{short(SCOREBOARD)}</code>
              </dd>
              <dt>Memo</dt>
              <dd>
                <code className="memo-code">{memo}</code>
                <small>
                  Seed block, your {moves.length} moves, and your score. Anyone can replay this to recompute the score.
                </small>
              </dd>
              <dt>Network fee</dt>
              <dd>Gas limit {GAS_LIMIT.toLocaleString("en-US")}. QoreX shows the exact fee before you approve.</dd>
            </dl>
            <p className="notice">
              Testnet only. The memo is public and permanent. It proves that this address signed this run, not who you are. The scoreboard
              address was derived from a hash, so no one holds its key. Your 1 uqor stays there. If this is your first send, QoreX
              also registers your post-quantum key (about 0.09 test QOR).
            </p>
            {stale && <p className="warn">This run's seed block is almost an hour old. Runs must be submitted within 60 minutes, so play a fresh round.</p>}
            {stage === "approving" && <p className="state pulse">Waiting for your approval in QoreX…</p>}
            {(stage === "submitted" || stage === "verifying") && (
              <p className="state pulse">
                Submitted <code>{short(hash, 10, 8)}</code>. Reading it back from Diana and replaying the run…
              </p>
            )}
            {stage === "rejected" && verdict && (
              <>
                <p className="warn">The chain data doesn't match a valid run, so it's not verified.</p>
                <Checklist checks={verdict.checks} />
              </>
            )}
            <div className="row">
              {hash ? (
                stage === "error" && (
                  <button className="btn primary" onClick={() => verify()}>
                    Retry verification
                  </button>
                )
              ) : (
                <button className="btn primary" onClick={submit} disabled={stale || stage === "approving"}>
                  {stage === "approving" ? "Approve in QoreX…" : "Sign & submit run"}
                </button>
              )}
            </div>
          </div>
        )}
        {err && (
          <p className="error" role="alert">
            {err}
          </p>
        )}
      </section>

      {mistakes.length > 0 && (
        <section className="panel">
          <h2>Debrief</h2>
          <ul className="debrief">
            {mistakes.map((o: Outcome) => (
              <li key={o.card.index} className={o.breach ? "breach" : "miss"}>
                <span className="n">#{o.card.index + 1}</span>
                <span>{explain(o)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="row center">
        <button className="btn primary" onClick={onReplay}>
          Play again
        </button>
        <button className="btn ghost" onClick={onBoard}>
          Leaderboard
        </button>
      </div>
    </div>
  );
}
