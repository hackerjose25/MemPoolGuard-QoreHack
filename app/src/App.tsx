import { useMemo, useState, type FormEvent } from "react";
import { getQorexNative, hasCapability, qorexSignAndBroadcast } from "@qorechain/qorex-types";
import { QRCodeSVG } from "qrcode.react";
import "./app.css";

const CHAIN_ID = "qorechain-diana";
const REST = import.meta.env.VITE_QORE_REST_URL || "/lcd";
const MEMO_PREFIX = "QPROOF/1:";
const SELF_SEND_UQOR = "1";
const EXPLORER = "https://explore.qore.network";

type WalletState =
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; address: string; hybridReady: boolean }
  | { status: "error"; message: string };

type ChainReceipt = {
  txHash: string;
  signer: string;
  memo: string;
  digest: string;
  height: string;
  timestamp?: string;
  hybridVerified: boolean;
  signatureBytes: number;
};

type TxResponse = {
  code?: number;
  txhash?: string;
  height?: string;
  timestamp?: string;
  events?: Array<{ type?: string; attributes?: Array<{ key?: string; value?: string }> }>;
};

type TxBody = {
  memo?: string;
  messages?: Array<Record<string, unknown>>;
  extension_options?: Array<Record<string, unknown>>;
  non_critical_extension_options?: Array<Record<string, unknown>>;
};

type TxLookup = { tx?: { body?: TxBody; signatures?: string[] }; tx_response?: TxResponse };

function shortAddress(address: string): string {
  return `${address.slice(0, 10)}…${address.slice(-6)}`;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function varint(value: number): Uint8Array {
  const result: number[] = [];
  let rest = value >>> 0;
  while (rest > 127) {
    result.push((rest & 127) | 128);
    rest >>>= 7;
  }
  result.push(rest);
  return Uint8Array.from(result);
}

function bytesField(field: number, value: Uint8Array): Uint8Array {
  return joinBytes([varint((field << 3) | 2), varint(value.length), value]);
}

function stringField(field: number, value: string): Uint8Array {
  return bytesField(field, new TextEncoder().encode(value));
}

function joinBytes(parts: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function encodeSelfSend(address: string): Uint8Array {
  const coin = joinBytes([stringField(1, "uqor"), stringField(2, SELF_SEND_UQOR)]);
  return joinBytes([stringField(1, address), stringField(2, address), bytesField(3, coin)]);
}

function getEventAttribute(events: TxResponse["events"], eventType: string, key: string): string | undefined {
  return events?.find((event) => event.type === eventType)?.attributes?.find((attribute) => attribute.key === key)?.value;
}

function decodeBase64Bytes(value: string): number {
  try {
    return atob(value).length;
  } catch {
    return 0;
  }
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const candidate = error as { message?: string; code?: number };
    if (candidate.code === 4001 || /rejected|declined|denied by user/i.test(candidate.message || "")) {
      return "The wallet request was declined. No proof was recorded.";
    }
    if (/unsupported chain|wrong network|network mismatch/i.test(candidate.message || "")) {
      return "Switch QoreX to Diana testnet, then reconnect.";
    }
    if (candidate.message) return candidate.message;
  }
  return "Something went wrong. Please try again.";
}

async function getChainId(): Promise<string> {
  const response = await fetch(`${REST}/cosmos/base/tendermint/v1beta1/node_info`);
  if (!response.ok) throw new Error("Could not confirm the network from QoreChain.");
  const data = (await response.json()) as { default_node_info?: { network?: string } };
  return data.default_node_info?.network || "";
}

async function verifyOnChain(txHash: string, expectedDigest?: string, expectedSigner?: string): Promise<ChainReceipt> {
  const activeChain = await getChainId();
  if (activeChain !== CHAIN_ID) throw new Error(`RPC network mismatch: expected ${CHAIN_ID}, got ${activeChain || "unknown"}.`);
  const response = await fetch(`${REST}/cosmos/tx/v1beta1/txs/${encodeURIComponent(txHash)}`);
  if (response.status === 404) throw new Error("Transaction is not indexed yet. Wait a moment and verify again.");
  if (!response.ok) throw new Error("QoreChain could not return this transaction.");
  const result = (await response.json()) as TxLookup;
  const tx = result.tx;
  const txResponse = result.tx_response;
  if (!tx?.body || !txResponse) throw new Error("The chain returned an incomplete transaction record.");
  if (txResponse.code !== 0) throw new Error(`The transaction failed on chain (code ${txResponse.code ?? "unknown"}).`);
  const canonicalHash = (txResponse.txhash || "").toUpperCase();
  if (!canonicalHash || canonicalHash !== txHash.replace(/^0x/i, "").toUpperCase()) {
    throw new Error("The returned transaction hash does not match the requested hash.");
  }
  const memo = tx.body.memo || "";
  if (!memo.startsWith(MEMO_PREFIX)) throw new Error("This transaction is not a ProofStamp record.");
  const digest = memo.slice(MEMO_PREFIX.length).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(digest)) throw new Error("The on-chain proof memo contains an invalid SHA-256 digest.");
  if (expectedDigest && digest !== expectedDigest.toLowerCase()) throw new Error("The on-chain digest does not match this file.");

  const message = tx.body.messages?.[0];
  const messageType = String(message?.["@type"] || message?.typeUrl || "");
  const signer = String(message?.fromAddress || message?.from_address || "");
  const recipient = String(message?.toAddress || message?.to_address || "");
  const amount = message?.amount as Array<{ denom?: string; amount?: string }> | undefined;
  if (!messageType.includes("cosmos.bank.v1beta1.MsgSend") || !signer || signer !== recipient || amount?.[0]?.denom !== "uqor" || amount?.[0]?.amount !== SELF_SEND_UQOR) {
    throw new Error("The chain transaction does not match the expected tiny self-transfer proof format.");
  }
  if (expectedSigner && signer !== expectedSigner) throw new Error("The transaction was submitted by a different wallet address.");

  const extensions = [
    ...(tx.body.extension_options || []),
    ...(tx.body.non_critical_extension_options || []),
  ];
  const hybridExtension = extensions.find((extension) => String(extension["@type"] || "").includes("PQCHybridSignature"));
  const pqcSignature = typeof hybridExtension?.pqc_signature === "string" ? hybridExtension.pqc_signature : "";
  const signatureBytes = decodeBase64Bytes(pqcSignature);
  const verifyStatus = getEventAttribute(txResponse.events, "pqc_hybrid_verify", "status");
  const verifiedAddress = getEventAttribute(txResponse.events, "pqc_hybrid_verify", "address");
  const hybridVerified = signatureBytes === 4627 && verifyStatus === "verified" && (!verifiedAddress || verifiedAddress === signer);
  if (!hybridVerified) throw new Error("The chain did not confirm a valid hybrid signature for this transaction.");

  return {
    txHash: canonicalHash,
    signer,
    memo,
    digest,
    height: txResponse.height || "—",
    timestamp: txResponse.timestamp,
    hybridVerified,
    signatureBytes,
  };
}

export function App(): JSX.Element {
  const [wallet, setWallet] = useState<WalletState>({ status: "disconnected" });
  const [showConnectHelp, setShowConnectHelp] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [digest, setDigest] = useState("");
  const [hashing, setHashing] = useState(false);
  const [action, setAction] = useState<"idle" | "submitting" | "confirming">("idle");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<ChainReceipt | null>(null);
  const [lookupHash, setLookupHash] = useState("");
  const [lookupFile, setLookupFile] = useState<File | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookedUpReceipt, setLookedUpReceipt] = useState<ChainReceipt | null>(null);

  const appUrl = useMemo(() => new URL(window.location.pathname, window.location.origin).toString(), []);
  const connected = wallet.status === "connected";

  async function connectWallet(): Promise<void> {
    const native = getQorexNative();
    if (!native) {
      setShowConnectHelp(true);
      return;
    }
    setWallet({ status: "connecting" });
    setError("");
    try {
      await native.enable(CHAIN_ID);
      const key = await native.getKey(CHAIN_ID);
      setWallet({ status: "connected", address: key.bech32Address, hybridReady: hasCapability(native, "signAndBroadcast") });
    } catch (connectError) {
      setWallet({ status: "error", message: errorMessage(connectError) });
    }
  }

  async function chooseFile(nextFile: File | null): Promise<void> {
    setFile(nextFile);
    setDigest("");
    setReceipt(null);
    setError("");
    if (!nextFile) return;
    setHashing(true);
    try {
      const bytes = await nextFile.arrayBuffer();
      const hash = await crypto.subtle.digest("SHA-256", bytes);
      setDigest(bytesToHex(new Uint8Array(hash)));
    } catch {
      setError("This browser could not hash the selected file. Try a recent version of Chrome or Edge.");
    } finally {
      setHashing(false);
    }
  }

  async function recordProof(): Promise<void> {
    if (wallet.status !== "connected" || !digest) return;
    const native = getQorexNative();
    if (!native || !hasCapability(native, "signAndBroadcast")) {
      setError("Update and unlock QoreX, then reconnect to enable hybrid signing.");
      return;
    }
    setError("");
    setAction("submitting");
    try {
      const result = await qorexSignAndBroadcast({
        chainId: CHAIN_ID,
        messages: [{ typeUrl: "/cosmos.bank.v1beta1.MsgSend", value: encodeSelfSend(wallet.address) }],
        memo: `${MEMO_PREFIX}${digest}`,
      });
      if (result.code !== 0) throw new Error(`QoreChain rejected the transaction (code ${result.code}).`);
      if (result.shield !== "shielded" && result.shield !== "pending") {
        throw new Error(`QoreX reported signature status “${result.shield}”. The proof will not be shown as verified.`);
      }
      setAction("confirming");
      let lastError: unknown;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        try {
          const verified = await verifyOnChain(result.txHash, digest, wallet.address);
          setReceipt(verified);
          setAction("idle");
          return;
        } catch (verificationError) {
          lastError = verificationError;
          if (verificationError instanceof Error && !/not indexed yet|could not return/i.test(verificationError.message)) throw verificationError;
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
        }
      }
      setError(lastError instanceof Error ? lastError.message : "The transaction was submitted, but confirmation is still pending. Copy its hash and verify again shortly.");
    } catch (transactionError) {
      setError(errorMessage(transactionError));
    } finally {
      setAction("idle");
    }
  }

  async function verifyReceipt(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLookupError("");
    setLookedUpReceipt(null);
    const cleaned = lookupHash.trim().replace(/^0x/i, "");
    if (!/^[0-9a-fA-F]{64}$/.test(cleaned)) {
      setLookupError("Enter a 64-character transaction hash.");
      return;
    }
    setLookupBusy(true);
    try {
      let expectedDigest: string | undefined;
      if (lookupFile) {
        const fileHash = await crypto.subtle.digest("SHA-256", await lookupFile.arrayBuffer());
        expectedDigest = bytesToHex(new Uint8Array(fileHash));
      }
      setLookedUpReceipt(await verifyOnChain(cleaned, expectedDigest));
    } catch (verificationError) {
      setLookupError(errorMessage(verificationError));
    } finally {
      setLookupBusy(false);
    }
  }

  async function copyReceipt(value: ChainReceipt): Promise<void> {
    const text = JSON.stringify({ chainId: CHAIN_ID, txHash: value.txHash, address: value.signer, sha256: value.digest, height: value.height }, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Clipboard access failed. You can still copy the transaction hash below.");
    }
  }

  return (
    <main className="shell proof-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="ProofStamp home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span>proof<span className="brand-light">stamp</span></span></a>
        <div className="topbar-right">
          <span className="network-pill"><span className="live-dot" /> Diana testnet</span>
          {connected ? <button className="wallet-button connected" onClick={() => setWallet({ status: "disconnected" })}><span className="wallet-dot" />{shortAddress(wallet.address)}</button> : <button className="wallet-button" onClick={connectWallet} disabled={wallet.status === "connecting"}>{wallet.status === "connecting" ? "Connecting…" : "Connect QoreX"}<span aria-hidden="true">↗</span></button>}
        </div>
      </header>

      <section className="intro" id="home">
        <div className="eyebrow"><span className="eyebrow-line" /> FILE PROOF · PUBLIC TIMESTAMP</div>
        <h1>Prove what<br /><span>you had, when.</span></h1>
        <p className="intro-copy">Create a SHA-256 fingerprint of a file and record it in a QoreChain transaction. Verify the receipt from chain data at any time.</p>
        <div className="trust-note"><span className="shield-icon" aria-hidden="true">◇</span><span>Your file stays in this browser. Only its hash and a public wallet address go on-chain. A hash proves a matching file existed by that time, not who created it.</span></div>
      </section>

      <section className="proof-grid" aria-label="Record and verify a proof">
        <article className="proof-card record-card">
          <div className="card-kicker">01 · RECORD A FILE</div>
          <h2>Stamp a fingerprint</h2>
          <p className="card-copy">Choose a file. Its SHA-256 hash is calculated locally and never uploaded.</p>
          <label className={`file-drop ${file ? "has-file" : ""}`}>
            <input type="file" onChange={(event) => void chooseFile(event.target.files?.[0] || null)} />
            <span className="file-icon" aria-hidden="true">{file ? "✓" : "＋"}</span>
            <span className="file-label">{file ? file.name : "Choose a file to fingerprint"}</span>
            <span className="file-hint">Any file · processed on your device only</span>
          </label>
          {hashing && <div className="inline-status">Calculating SHA-256…</div>}
          {digest && <div className="digest-box"><span>SHA-256</span><code>{digest}</code></div>}
          <div className="public-note"><strong>What goes on-chain</strong><span>A short proof tag, the 64-character file hash, your public address, and a tiny 1 uqor self-transfer. QoreX will show the network fee before you approve.</span></div>
          {!connected && <button className="primary-action" onClick={connectWallet} disabled={wallet.status === "connecting"}>{wallet.status === "connecting" ? "Connecting…" : "Connect QoreX to continue"}<span>→</span></button>}
          {connected && <button className="primary-action" onClick={() => void recordProof()} disabled={!digest || hashing || action !== "idle" || !wallet.hybridReady}>{action === "submitting" ? "Waiting for wallet approval…" : action === "confirming" ? "Checking chain confirmation…" : "Record hybrid-signed proof"}<span>→</span></button>}
          {connected && !wallet.hybridReady && <p className="inline-error">This QoreX version does not offer hybrid signing. Update the extension and reconnect.</p>}
          {wallet.status === "error" && <p className="inline-error" role="alert">{wallet.message}</p>}
          {error && <p className="inline-error" role="alert">{error}</p>}
        </article>

        <article className="proof-card verify-card">
          <div className="card-kicker">02 · VERIFY A RECEIPT</div>
          <h2>Check a proof</h2>
          <p className="card-copy">Paste a transaction hash. We fetch the record directly from Diana testnet and check its memo and hybrid-signature verdict.</p>
          <form className="verify-form" onSubmit={(event) => void verifyReceipt(event)}>
            <label htmlFor="tx-hash">Transaction hash</label>
            <input id="tx-hash" value={lookupHash} onChange={(event) => setLookupHash(event.target.value)} placeholder="64-character hash" spellCheck={false} autoComplete="off" />
            <label className="verify-file-label">Optional: compare with a file<input type="file" onChange={(event) => setLookupFile(event.target.files?.[0] || null)} /><span>{lookupFile?.name || "Choose the file to check"}</span></label>
            <button className="secondary-action" disabled={lookupBusy}>{lookupBusy ? "Checking chain…" : "Verify on chain"}<span>↗</span></button>
          </form>
          {lookupError && <p className="inline-error" role="alert">{lookupError}</p>}
          {lookedUpReceipt && <ReceiptCard receipt={lookedUpReceipt} onCopy={() => void copyReceipt(lookedUpReceipt)} />}
          {!lookedUpReceipt && <div className="verify-empty"><span className="verify-mark">✓</span><span>Fresh chain data only</span><span>Explorer links and browser text aren’t treated as proof by themselves.</span></div>}
        </article>
      </section>

      {receipt && <section className="result-section"><div className="card-kicker">PROOF RECORDED · TESTNET</div><h2>Your on-chain receipt</h2><ReceiptCard receipt={receipt} onCopy={() => void copyReceipt(receipt)} /><button className="text-button" onClick={() => setLookupHash(receipt.txHash)}>Copy hash into verifier ↓</button></section>}

      <section className="how-strip" aria-label="How ProofStamp works">
        <div className="how-title">HOW IT WORKS</div>
        <div className="how-step"><span className="step-number">01</span><span>Hash stays<br />in your browser</span></div><span className="step-arrow" aria-hidden="true">→</span>
        <div className="how-step"><span className="step-number">02</span><span>QoreX hybrid<br />signs the record</span></div><span className="step-arrow" aria-hidden="true">→</span>
        <div className="how-step"><span className="step-number">03</span><span>Chain data<br />confirms the proof</span></div>
      </section>

      <footer className="footer"><span>Built for <strong>QoreChain</strong></span><span className="footer-separator">·</span><span>Diana testnet only</span><span className="footer-right">Public and durable records</span></footer>

      {showConnectHelp && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowConnectHelp(false); }}><section className="connect-modal" role="dialog" aria-modal="true" aria-labelledby="connect-title"><button className="modal-close" onClick={() => setShowConnectHelp(false)} aria-label="Close dialog">×</button><div className="modal-kicker"><span className="live-dot" /> QOREX CONNECTION</div><h2 id="connect-title">Open ProofStamp in QoreX</h2><p className="modal-intro">To sign from your laptop, install and unlock QoreX in this browser. On mobile, open this public HTTPS page inside QoreX’s dApp browser.</p><div className="qr-frame"><QRCodeSVG value={appUrl} size={212} level="M" marginSize={2} aria-label="QR code for ProofStamp" /></div><div className="scan-status warning"><span className="status-dot" /> A localhost link only opens on this computer. Deploy to public HTTPS before scanning from a phone.</div><a className="extension-link" href="https://chromewebstore.google.com/detail/qorex/cflpnggbnnifibblifgbeobogdpfjpcg" target="_blank" rel="noreferrer">Get QoreX for Chrome or Edge ↗</a></section></div>}
    </main>
  );
}

function ReceiptCard({ receipt, onCopy }: { receipt: ChainReceipt; onCopy: () => void }): JSX.Element {
  return <div className="receipt-card"><div className="receipt-status"><span className="status-dot" />HYBRID SIGNATURE VERIFIED ON CHAIN</div><div className="receipt-row"><span>File SHA-256</span><code>{receipt.digest}</code></div><div className="receipt-row"><span>Recorded by</span><code>{shortAddress(receipt.signer)}</code></div><div className="receipt-row"><span>Block</span><code>{receipt.height}</code></div><div className="receipt-row"><span>PQC signature</span><code>ML-DSA-87 · {receipt.signatureBytes.toLocaleString()} bytes</code></div><div className="receipt-row tx-row"><span>Transaction</span><code>{receipt.txHash}</code></div><div className="receipt-actions"><a href={EXPLORER} target="_blank" rel="noreferrer">Open explorer and search hash ↗</a><button onClick={onCopy}>Copy receipt</button></div></div>;
}
