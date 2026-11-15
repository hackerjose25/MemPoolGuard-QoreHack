import { useState } from "react";
import { getQorexNative, hasCapability } from "@qorechain/qorex-types";
import "./app.css";

const TESTNET_ID = "qorechain-diana";

type WalletState =
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; address: string; hybridReady: boolean }
  | { status: "error"; message: string };

function shortAddress(address: string): string {
  return `${address.slice(0, 10)}…${address.slice(-6)}`;
}

export function App(): JSX.Element {
  const [wallet, setWallet] = useState<WalletState>({ status: "disconnected" });

  async function connectWallet(): Promise<void> {
    setWallet({ status: "connecting" });
    try {
      const native = getQorexNative();
      if (!native) {
        throw new Error("QoreX was not found. Install or open the QoreX wallet, then try again.");
      }
      await native.enable(TESTNET_ID);
      const key = await native.getKey(TESTNET_ID);
      setWallet({
        status: "connected",
        address: key.bech32Address,
        hybridReady: hasCapability(native, "signAndBroadcast"),
      });
    } catch (error) {
      setWallet({
        status: "error",
        message: error instanceof Error ? error.message : "QoreX connection failed. Please try again.",
      });
    }
  }

  const connected = wallet.status === "connected";

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Quantum Queue home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>quantum<span className="brand-light">queue</span></span>
        </a>
        <div className="topbar-right">
          <span className="network-pill"><span className="live-dot" /> Diana testnet</span>
          {connected ? (
            <button className="wallet-button connected" onClick={() => setWallet({ status: "disconnected" })}>
              <span className="wallet-dot" />{shortAddress(wallet.address)}
            </button>
          ) : (
            <button className="wallet-button" onClick={connectWallet} disabled={wallet.status === "connecting"}>
              {wallet.status === "connecting" ? "Connecting…" : "Connect QoreX"}
              <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>
      </header>

      <section className="intro" id="home">
        <div className="eyebrow"><span className="eyebrow-line" /> ON-CHAIN EVENT CHECK-IN</div>
        <h1>Every arrival,<br /><span>on the record.</span></h1>
        <p className="intro-copy">A simple check-in, backed by a receipt anyone can verify on QoreChain.</p>
        <div className="trust-note">
          <span className="shield-icon" aria-hidden="true">◇</span>
          <span>Wallet signatures prove an address checked in. They don’t prove identity or physical presence.</span>
        </div>
      </section>

      <section className="workspace" aria-labelledby="events-heading">
        <div className="section-heading">
          <div>
            <div className="section-kicker">YOUR WORKSPACE</div>
            <h2 id="events-heading">Events</h2>
          </div>
          <button className="create-button" disabled title="Available after the event registry is deployed">
            <span aria-hidden="true">＋</span> Create event
          </button>
        </div>

        <div className="empty-card">
          <div className="empty-art" aria-hidden="true">
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
            <div className="art-core"><span>Q</span></div>
            <span className="art-star star-one">✳</span><span className="art-star star-two">✦</span>
          </div>
          <div className="empty-label"><span className="status-dot" /> EVENT REGISTRY NOT DEPLOYED</div>
          <h3>Your next event starts here.</h3>
          <p>Connect QoreX on Diana testnet. Event creation will be enabled once the on-chain registry is live.</p>
          {!connected && (
            <button className="empty-connect" onClick={connectWallet} disabled={wallet.status === "connecting"}>
              {wallet.status === "connecting" ? "Connecting to QoreX…" : "Connect QoreX to get started"}
              <span aria-hidden="true">→</span>
            </button>
          )}
          {connected && (
            <div className={`wallet-status ${wallet.hybridReady ? "ready" : "pending"}`}>
              <span className="status-dot" />
              {wallet.hybridReady ? "QoreX connected · hybrid signing available" : "Connected · QoreX signing capability unavailable"}
            </div>
          )}
          {wallet.status === "error" && <p className="wallet-error" role="alert">{wallet.message}</p>}
        </div>
      </section>

      <section className="how-strip" aria-label="How check-in works">
        <div className="how-title">HOW IT WORKS</div>
        <div className="how-step"><span className="step-number">01</span><span>Organizer opens<br />an event</span></div>
        <span className="step-arrow" aria-hidden="true">→</span>
        <div className="how-step"><span className="step-number">02</span><span>Attendee signs<br />with QoreX</span></div>
        <span className="step-arrow" aria-hidden="true">→</span>
        <div className="how-step"><span className="step-number">03</span><span>Receipt is read<br />back from chain</span></div>
      </section>

      <footer className="footer">
        <span>Built for <strong>QoreChain</strong></span>
        <span className="footer-separator">·</span>
        <span>Testnet only</span>
        <span className="footer-right">Public records. Verifiable receipts.</span>
      </footer>
    </main>
  );
}
