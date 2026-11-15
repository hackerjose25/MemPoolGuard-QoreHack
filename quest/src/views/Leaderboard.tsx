import { useEffect, useState } from "react";
import { SCOREBOARD, ago, fetchLeaderboard, short, type RunVerdict } from "../chain";
import { Inspector } from "../ui/Inspector";
import { rankTitle } from "./Results";

export function useLeaderboard() {
  const [rows, setRows] = useState<RunVerdict[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = () => {
    setErr(null);
    fetchLeaderboard()
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  };
  useEffect(load, []);
  return { rows, err, reload: load };
}

/** Best verified run per address, highest first. */
export function ranked(rows: RunVerdict[]): RunVerdict[] {
  const best = new Map<string, RunVerdict>();
  for (const r of rows) {
    if (r.status !== "verified") continue;
    const cur = best.get(r.player);
    if (!cur || r.score > cur.score) best.set(r.player, r);
  }
  return [...best.values()].sort((a, b) => b.score - a.score);
}

export function BoardTable({ rows, me, limit, onPick }: { rows: RunVerdict[]; me?: string; limit?: number; onPick: (r: RunVerdict) => void }) {
  const list = ranked(rows).slice(0, limit);
  if (!list.length) return <p className="empty">No verified runs yet. Yours could be the first on-chain score.</p>;
  return (
    <table className="board">
      <thead>
        <tr>
          <th>#</th>
          <th>Validator</th>
          <th className="num">Score</th>
          <th className="hide-sm">Rank</th>
          <th className="hide-sm">When</th>
          <th aria-label="Proof" />
        </tr>
      </thead>
      <tbody>
        {list.map((r, i) => (
          <tr key={r.facts.hash} className={r.player === me ? "me" : ""} onClick={() => onPick(r)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onPick(r)}>
            <td className={"pos p" + (i + 1)}>{i + 1}</td>
            <td>
              <code>{short(r.player)}</code>
              {r.player === me && <span className="you">you</span>}
            </td>
            <td className="num">
              <b>{r.score.toLocaleString("en-US")}</b>
            </td>
            <td className="hide-sm">{rankTitle(r.score)}</td>
            <td className="hide-sm">{ago(r.facts.time)}</td>
            <td>
              <span className="proof">✓ replayed</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Leaderboard({ me, onPlay }: { me?: string; onPlay: () => void }) {
  const { rows, err, reload } = useLeaderboard();
  const [pick, setPick] = useState<RunVerdict | null>(null);
  const rejected = rows?.filter((r) => r.status === "rejected") ?? [];

  return (
    <div className="board-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">On-chain · no contract</p>
          <h1>Leaderboard</h1>
          <p className="lede">
            Every row is a hybrid-signed Diana transaction sent to the scoreboard <code>{short(SCOREBOARD)}</code>. Your browser re-fetches each
            seed block and replays the moves. A row only appears if the replayed score matches the claimed one.
          </p>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={reload}>
            ↻ Refresh
          </button>
          <button className="btn primary" onClick={onPlay}>
            Play
          </button>
        </div>
      </header>
      <section className="panel">
        {err ? (
          <p className="error">Couldn't load the leaderboard from Diana: {err}</p>
        ) : !rows ? (
          <div className="skeleton-rows">{Array.from({ length: 5 }, (_, i) => <i key={i} />)}</div>
        ) : (
          <BoardTable rows={rows} me={me} onPick={setPick} />
        )}
        {rejected.length > 0 && (
          <p className="muted small">
            {rejected.length} submission{rejected.length > 1 ? "s" : ""} failed verification and {rejected.length > 1 ? "are" : "is"} hidden.
          </p>
        )}
      </section>
      {pick && <Inspector facts={pick.facts} checks={pick.checks} title={`Run by ${short(pick.player)} · ${pick.score.toLocaleString("en-US")} pts`} onClose={() => setPick(null)} />}
    </div>
  );
}
