import { useEffect, useState } from "react";
import { ago, hybridChecks, msgLabel, recentHybridTxs, short, type TxFacts } from "../chain";
import { RULES } from "../game/engine";
import { Inspector } from "../ui/Inspector";
import { TxCardView } from "../ui/TxCardView";
import { generateDeck } from "../game/engine";
import { BoardTable, useLeaderboard } from "./Leaderboard";
import type { RunVerdict } from "../chain";

const demo = generateDeck("DEMO")[3];

export function Lobby({ onPlay, onBoard, me, starting }: { onPlay: () => void; onBoard: () => void; me?: string; starting: boolean }) {
  const [feed, setFeed] = useState<TxFacts[] | null>(null);
  const [feedErr, setFeedErr] = useState(false);
  const [inspect, setInspect] = useState<TxFacts | null>(null);
  const [pickRun, setPickRun] = useState<RunVerdict | null>(null);
  const board = useLeaderboard();

  useEffect(() => {
    let alive = true;
    const load = () =>
      recentHybridTxs(7)
        .then((f) => alive && (setFeed(f), setFeedErr(false)))
        .catch(() => alive && setFeedErr(true));
    load();
    const i = setInterval(load, 12000);
    return () => {
      alive = false;
      clearInterval(i);
    };
  }, []);

  return (
    <div className="lobby">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow glow">Quantum Quest · Diana testnet</p>
          <h1>
            Mempool <span className="grad">Guard</span>
          </h1>
          <p className="lede">
            Q-Day is here. Forged transactions are flooding the mempool, and you are the last validator standing. Inspect each packet,
            approve the real hybrid-signed ones, and reject the forgeries before the timer runs out.
          </p>
          <div className="row">
            <button className="btn primary xl" onClick={onPlay} disabled={starting}>
              {starting ? "Pulling seed from Diana…" : "▶ Start a shift"}
            </button>
            <button className="btn ghost xl" onClick={onBoard}>
              Leaderboard
            </button>
          </div>
          <ul className="hero-points">
            <li>
              <b>40</b> packets · <b>4</b> threat levels · <b>8</b> attack types
            </li>
            <li>No wallet needed to play · QoreX signs your run on-chain</li>
          </ul>
        </div>
        <div className="hero-card" aria-hidden>
          <div className="float">
            <TxCardView card={demo} />
          </div>
          <div className="orbit o1" />
          <div className="orbit o2" />
        </div>
      </section>

      <section className="how">
        {[
          ["01", "Seeded by the chain", "Each shift's deck is generated from the hash of the latest Diana block. Everyone who gets the same block gets the same deck, and nobody can predict it in advance."],
          ["02", "Guard the mempool", "Swipe or press ← → to reject or approve. Combos multiply your points. Three breaches and the network falls."],
          ["03", "Sign it, prove it", "QoreX hybrid-signs your run: secp256k1 + ML-DSA-87. The leaderboard replays your moves from chain data to verify every score."],
        ].map(([n, t, d]) => (
          <article key={n} className="how-card">
            <span className="n">{n}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </article>
        ))}
      </section>

      <section className="split">
        <div className="panel">
          <div className="panel-head">
            <h2>
              <span className="live-dot" /> Live hybrid traffic
            </h2>
            <span className="chip">real Diana txs</span>
          </div>
          <p className="muted small">The latest transactions the chain verified as hybrid post-quantum. Tap one to inspect it with the same checks you use in the game.</p>
          {feedErr && !feed && <p className="error">Diana REST unreachable.</p>}
          {!feed && !feedErr && <div className="skeleton-rows">{Array.from({ length: 5 }, (_, i) => <i key={i} />)}</div>}
          <ul className="feed">
            {feed?.map((f) => (
              <li key={f.hash}>
                <button onClick={() => setInspect(f)}>
                  <span className="pill ok">✓ hybrid</span>
                  <span className="feed-type">{f.msgTypes.map(msgLabel).join(", ")}</span>
                  <code className="feed-hash">{short(f.hash, 6, 4)}</code>
                  <span className="feed-meta">
                    #{f.height.toLocaleString("en-US")} · {ago(f.time)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Top validators</h2>
            <button className="link" onClick={onBoard}>
              View all →
            </button>
          </div>
          {board.err ? (
            <p className="error">Couldn't load scores: {board.err}</p>
          ) : !board.rows ? (
            <div className="skeleton-rows">{Array.from({ length: 4 }, (_, i) => <i key={i} />)}</div>
          ) : (
            <BoardTable rows={board.rows} me={me} limit={5} onPick={setPickRun} />
          )}
        </div>
      </section>

      <section className="panel threats">
        <h2>Threat catalogue</h2>
        <div className="threat-grid">
          {RULES.map((r) => (
            <article key={r.id} className="threat">
              <span className="lvl">L{r.level}</span>
              <h3>{r.title}</h3>
              <p>{r.why}</p>
            </article>
          ))}
        </div>
      </section>

      {inspect && <Inspector facts={inspect} checks={hybridChecks(inspect)} title="Hybrid transaction" onClose={() => setInspect(null)} />}
      {pickRun && <Inspector facts={pickRun.facts} checks={pickRun.checks} title={`Run · ${pickRun.score.toLocaleString("en-US")} pts`} onClose={() => setPickRun(null)} />}
    </div>
  );
}
