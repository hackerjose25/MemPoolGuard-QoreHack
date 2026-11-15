import { useCallback, useEffect, useState } from "react";
import { CHAIN_ID } from "./game/engine";
import { latestBlock, short, type BlockInfo } from "./chain";
import { connectQorex } from "./qorex";
import { isMuted, setMuted } from "./ui/sfx";
import { Lobby } from "./views/Lobby";
import { Play, type FinishedRun } from "./views/Play";
import { Results } from "./views/Results";
import { Leaderboard } from "./views/Leaderboard";

type View = { name: "lobby" } | { name: "play"; seed: BlockInfo } | { name: "results"; run: FinishedRun } | { name: "board" };

export function App(): JSX.Element {
  const [view, setView] = useState<View>({ name: "lobby" });
  const [head, setHead] = useState<BlockInfo | null>(null);
  const [netErr, setNetErr] = useState(false);
  const [address, setAddress] = useState("");
  const [walletErr, setWalletErr] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [muted, setMute] = useState(isMuted());

  useEffect(() => {
    let alive = true;
    const tick = () =>
      latestBlock()
        .then((b) => alive && (setHead(b), setNetErr(false)))
        .catch(() => alive && setNetErr(true));
    tick();
    const i = setInterval(tick, 4000);
    return () => {
      alive = false;
      clearInterval(i);
    };
  }, []);

  const connect = useCallback(async () => {
    setWalletErr(null);
    setConnecting(true);
    try {
      setAddress(await connectQorex());
    } catch (e) {
      setWalletErr(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setConnecting(false);
    }
  }, []);

  const start = useCallback(async () => {
    setStarting(true);
    try {
      const seed = await latestBlock();
      if (seed.chainId !== CHAIN_ID) throw new Error(`Seed block came from ${seed.chainId}`);
      setView({ name: "play", seed });
    } catch {
      setNetErr(true);
    } finally {
      setStarting(false);
    }
  }, []);

  const finish = useCallback((run: FinishedRun) => setView({ name: "results", run }), []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view.name]);
  const onDiana = head?.chainId === CHAIN_ID && !netErr;

  return (
    <div className={"app" + (view.name === "play" ? " playing" : "")}>
      <div className="bg-grid" aria-hidden />
      <header className="topbar">
        <button className="brand" onClick={() => setView({ name: "lobby" })} aria-label="Mempool Guard home">
          <span className="logo" aria-hidden>
            <svg viewBox="0 0 32 32">
              <path d="M16 2 28 9v14L16 30 4 23V9z" />
              <path d="M16 9l6 3.5v7L16 23l-6-3.5v-7z" />
            </svg>
          </span>
          <span>
            Mempool<b>Guard</b>
          </span>
        </button>
        <nav>
          <button className={view.name === "board" ? "on" : ""} onClick={() => setView({ name: "board" })}>
            Leaderboard
          </button>
        </nav>
        <div className="top-right">
          <div className={"net " + (onDiana ? "ok" : netErr ? "bad" : "")} role="status" title="Live Diana block height">
            <span className="live-dot" />
            {onDiana ? (
              <>
                <span className="hide-sm">Testnet · {CHAIN_ID} ·</span> <code key={head?.height} className="blink">#{head?.height.toLocaleString("en-US")}</code>
              </>
            ) : netErr ? (
              "Diana unreachable"
            ) : (
              "Syncing…"
            )}
          </div>
          <button className="icon" onClick={() => (setMuted(!muted), setMute(!muted))} aria-label={muted ? "Unmute sound" : "Mute sound"}>
            {muted ? "🔇" : "🔊"}
          </button>
          {address ? (
            <span className="wallet on" title={address}>
              <i /> {short(address, 7, 4)}
            </span>
          ) : (
            <button className="wallet" onClick={() => connect().catch(() => {})} disabled={connecting}>
              {connecting ? "Connecting…" : "Connect QoreX"}
            </button>
          )}
        </div>
      </header>
      {walletErr && (
        <div className="toast" role="alert">
          {walletErr}
          <button onClick={() => setWalletErr(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <main className="main">
        {view.name === "lobby" && <Lobby onPlay={start} onBoard={() => setView({ name: "board" })} me={address} starting={starting} />}
        {view.name === "play" && <Play key={view.seed.hash} seed={view.seed} onFinish={finish} onQuit={() => setView({ name: "lobby" })} />}
        {view.name === "results" && (
          <Results run={view.run} address={address} onConnect={connect} onReplay={start} onBoard={() => setView({ name: "board" })} />
        )}
        {view.name === "board" && <Leaderboard me={address} onPlay={start} />}
      </main>

      <footer className="foot">
        <span>Diana testnet only · keys stay in QoreX · no seed phrases, ever</span>
        <span>Scores are verified by replaying the moves from chain data. That proves the score matches the moves, not who played.</span>
      </footer>
    </div>
  );
}
