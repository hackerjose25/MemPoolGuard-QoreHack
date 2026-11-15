import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_CARDS,
  RULES,
  START_SHIELDS,
  applyMove,
  explain,
  generateDeck,
  initialState,
  multiplierFor,
  type Move,
  type Outcome,
  type RunState,
} from "../game/engine";
import type { BlockInfo } from "../chain";
import { TxCardView } from "../ui/TxCardView";
import { sfx } from "../ui/sfx";

export interface FinishedRun {
  seed: BlockInfo;
  moves: string;
  state: RunState;
  startedAt: number;
}

type Phase = "briefing" | "deciding" | "feedback";

export function Play({ seed, onFinish, onQuit }: { seed: BlockInfo; onFinish: (r: FinishedRun) => void; onQuit: () => void }) {
  const deck = useMemo(() => generateDeck(seed.hash), [seed.hash]);
  const [state, setState] = useState<RunState>(initialState);
  const [moves, setMoves] = useState("");
  const [phase, setPhase] = useState<Phase>("briefing");
  const [briefLevel, setBriefLevel] = useState(1);
  const [last, setLast] = useState<Outcome | null>(null);
  const [fly, setFly] = useState<"left" | "right" | null>(null);
  const [drag, setDrag] = useState(0);
  const [shake, setShake] = useState(false);
  const [pop, setPop] = useState<{ id: number; text: string; good: boolean } | null>(null);
  const startedAt = useRef(Date.now());
  const dragStart = useRef<number | null>(null);

  const idx = state.outcomes.length;
  const card = deck[idx];
  const level = card?.level ?? 4;
  // During feedback, keep showing the card that was just judged (not the next one).
  const shown = phase === "feedback" && last ? last.card : card;

  const decide = useCallback(
    (move: Move) => {
      if (phase !== "deciding" || !card) return;
      const next = applyMove(state, card, move);
      const o = next.outcomes[next.outcomes.length - 1];
      setState(next);
      setMoves((m) => m + move);
      setLast(o);
      setPhase("feedback");
      setFly(move === "A" ? "right" : move === "R" ? "left" : null);
      setDrag(0);
      if (o.correct) {
        move === "A" ? sfx.approve() : sfx.reject();
        if (o.streak > 0 && o.streak % 5 === 0) sfx.combo();
        setPop({ id: Date.now(), text: `+${o.points}`, good: true });
      } else {
        sfx.wrong();
        setShake(true);
        setTimeout(() => setShake(false), 450);
        setPop({ id: Date.now(), text: o.breach ? "BREACH" : o.points ? `${o.points}` : "MISS", good: false });
      }
    },
    [phase, card, state],
  );

  // Advance after feedback; show a briefing whenever a new level unlocks.
  useEffect(() => {
    if (phase !== "feedback") return;
    const t = setTimeout(
      () => {
        setFly(null);
        if (state.over) {
          onFinish({ seed, moves, state, startedAt: startedAt.current });
          return;
        }
        const nextCard = deck[state.outcomes.length];
        if (nextCard.level !== last?.card.level) {
          setBriefLevel(nextCard.level);
          setPhase("briefing");
          sfx.level();
        } else setPhase("deciding");
      },
      last?.correct ? 650 : 1500,
    );
    return () => clearTimeout(t);
  }, [phase, state, deck, last, moves, seed, onFinish]);

  // Per-card timer (the visual ring is a CSS animation keyed to the card).
  useEffect(() => {
    if (phase !== "deciding" || !card) return;
    const t = setTimeout(() => decide("T"), card.timeMs);
    const warn = setTimeout(() => sfx.tick(), card.timeMs - 1500);
    return () => {
      clearTimeout(t);
      clearTimeout(warn);
    };
  }, [phase, card, decide]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (phase === "briefing" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setPhase("deciding");
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "r" || k === "x") decide("R");
      if (k === "arrowright" || k === "a" || k === "enter") decide("A");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, decide]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (phase !== "deciding") return;
    dragStart.current = e.clientX;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current !== null) setDrag(e.clientX - dragStart.current);
  };
  const onPointerUp = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (drag > 90) decide("A");
    else if (drag < -90) decide("R");
    else setDrag(0);
  };

  // Scale the card/briefing so the whole play screen fits one viewport, no scrolling.
  const areaRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const area = areaRef.current;
    const fit = fitRef.current;
    if (!area || !fit) return;
    const measure = () => {
      const h = fit.offsetHeight; // offset sizes ignore transforms
      const w = fit.offsetWidth;
      if (!h || !w) return;
      setScale(Math.min(1, (area.clientHeight - 4) / h, area.clientWidth / w));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(area);
    ro.observe(fit);
    measure();
    return () => ro.disconnect();
  }, []);

  const mult = multiplierFor(state.streak);
  const active = RULES.filter((r) => r.level <= level);
  const fresh = RULES.filter((r) => r.level === briefLevel);

  return (
    <div className={"play" + (shake ? " shake" : "")}>
      <div className="hud">
        <div className="hud-item hud-score">
          <label>Score</label>
          <b key={state.score} className="bump">
            {state.score.toLocaleString("en-US")}
          </b>
        </div>
        <div className={"hud-item hud-combo m" + mult}>
          <label>Combo</label>
          <b>×{mult}</b>
          <div className="combo-bar">
            <i style={{ width: `${mult >= 5 ? 100 : ((state.streak % 5) / 5) * 100}%` }} />
          </div>
        </div>
        <div className="hud-item hud-shields" aria-label={`${state.shields} of ${START_SHIELDS} shields left`}>
          <label>Shields</label>
          <div>
            {Array.from({ length: START_SHIELDS }, (_, i) => (
              <span key={i} className={"shield" + (i < state.shields ? "" : " lost")} aria-hidden>
                ⬢
              </span>
            ))}
          </div>
        </div>
        <div className="hud-item hud-level">
          <label>Threat</label>
          <b>L{level}</b>
          <small>
            {Math.min(idx + 1, MAX_CARDS)}/{MAX_CARDS}
          </small>
        </div>
        <div className="hud-progress" aria-hidden>
          <i style={{ width: `${(idx / MAX_CARDS) * 100}%` }} />
        </div>
        <button className="link quit" onClick={onQuit}>
          Abandon
        </button>
      </div>

      <div className="arena">
        <aside className="rulebook" aria-label="Active checks">
          <h4>Validator checklist</h4>
          <ol>
            {active.map((r) => (
              <li key={r.id} className={r.level === level ? "new" : ""}>
                <b>{r.title}</b>
                <span>{r.check}</span>
              </li>
            ))}
          </ol>
          <p className="seed-note">
            Seed: Diana block <code>#{seed.height.toLocaleString("en-US")}</code>
            <br />
            <code>{seed.hash.slice(0, 16)}…</code>
          </p>
        </aside>

        <div className="stage">
          <button className={"side reject" + (drag < -30 ? " lit" : "")} onClick={() => decide("R")} disabled={phase !== "deciding"}>
            <span className="side-icon" aria-hidden>
              ✕
            </span>
            <span>Reject</span>
            <kbd>←</kbd>
          </button>

          <div className="fit-area" ref={areaRef}>
            <div className="fit" ref={fitRef} style={{ transform: `scale(${scale})` }}>
              {pop && (
                <div key={pop.id} className={"pop " + (pop.good ? "good" : "bad")} aria-hidden>
                  {pop.text}
                </div>
              )}

              {phase === "briefing" ? (
                <div className="briefing" role="dialog" aria-label={`Threat level ${briefLevel}`}>
                  <p className="eyebrow">Threat level {briefLevel}</p>
                  <h2>{briefLevel === 1 ? "Mempool is open" : "New attack vectors detected"}</h2>
                  <ul>
                    {fresh.map((r) => (
                      <li key={r.id}>
                        <b>{r.title}</b>
                        <span>{r.check}</span>
                        <small>{r.why}</small>
                      </li>
                    ))}
                  </ul>
                  <button className="btn primary" onClick={() => setPhase("deciding")} autoFocus>
                    {briefLevel === 1 ? "Start guarding" : "Resume"} <kbd>Space</kbd>
                  </button>
                </div>
              ) : (
                shown && (
                  <div
                    key={shown.index}
                    className={"card-wrap" + (fly ? ` fly-${fly}` : "") + (phase === "feedback" && !last?.correct ? " wrong" : "")}
                    style={drag ? { transform: `translateX(${drag}px) rotate(${drag / 25}deg)` } : undefined}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                  >
                    {phase === "deciding" && (
                      <svg className="timer" viewBox="0 0 40 40" aria-hidden>
                        <circle cx="20" cy="20" r="17" />
                        <circle className="run" cx="20" cy="20" r="17" style={{ animationDuration: `${shown.timeMs}ms` }} />
                      </svg>
                    )}
                    <TxCardView card={shown} reveal={phase === "feedback" && !last?.correct} />
                  </div>
                )
              )}

              <div className="feedback" aria-live="assertive">
                {phase === "feedback" && last && <p className={last.correct ? "ok" : "no"}>{explain(last)}</p>}
              </div>
            </div>
          </div>

          <button className={"side approve" + (drag > 30 ? " lit" : "")} onClick={() => decide("A")} disabled={phase !== "deciding"}>
            <span className="side-icon" aria-hidden>
              ✓
            </span>
            <span>Approve</span>
            <kbd>→</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
