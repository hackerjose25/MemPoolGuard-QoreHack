import { useEffect } from "react";
import { EXPLORER, REST, ago, msgLabel, short, type Check, type TxFacts } from "../chain";

export function Checklist({ checks }: { checks: Check[] }) {
  return (
    <ul className="checklist">
      {checks.map((c, i) => (
        <li key={c.label} className={c.ok ? "pass" : "fail"} style={{ animationDelay: `${i * 70}ms` }}>
          <span className="tick" aria-hidden>
            {c.ok ? "✓" : "✕"}
          </span>
          <span className="lbl">{c.label}</span>
          <code className="det">{c.detail}</code>
          <span className="sr-only">{c.ok ? "passed" : "failed"}</span>
        </li>
      ))}
    </ul>
  );
}

/** Modal showing a real Diana transaction and the checks computed from it. */
export function Inspector({ facts, checks, title, onClose }: { facts: TxFacts; checks: Check[]; title: string; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <p className="eyebrow">Live from Diana · block #{facts.height.toLocaleString("en-US")}</p>
        <h3>{title}</h3>
        <code className="hash-full">{facts.hash}</code>
        <div className="facts">
          <div>
            <label>Messages</label>
            <span>{facts.msgTypes.map(msgLabel).join(", ")}</span>
          </div>
          <div>
            <label>Signer</label>
            <code>{short(facts.sender ?? "?")}</code>
          </div>
          <div>
            <label>Algorithm</label>
            <span>{facts.algorithm === "dilithium5" ? "ML-DSA-87 (Dilithium5)" : facts.algorithm ?? "—"}</span>
          </div>
          <div>
            <label>Fee · gas used</label>
            <span>
              {facts.fee} · {Number(facts.gasUsed).toLocaleString("en-US")}
            </span>
          </div>
          <div>
            <label>When</label>
            <span>{ago(facts.time)}</span>
          </div>
          {facts.memo && (
            <div>
              <label>Memo</label>
              <code>{facts.memo}</code>
            </div>
          )}
        </div>
        <div className="sig-compare" aria-label="Signature size comparison">
          <div>
            <span>secp256k1</span>
            <div className="bar classical">
              <i style={{ width: `${(facts.classicalBytes / facts.pqcBytes || 0) * 100}%` }} />
            </div>
            <code>{facts.classicalBytes} B</code>
          </div>
          <div>
            <span>ML-DSA-87</span>
            <div className="bar pqc">
              <i style={{ width: facts.pqcBytes ? "100%" : "0%" }} />
            </div>
            <code>{facts.pqcBytes.toLocaleString("en-US")} B</code>
          </div>
        </div>
        <Checklist checks={checks} />
        <div className="modal-links">
          <a href={`${EXPLORER}/tx/${facts.hash}`} target="_blank" rel="noreferrer">
            Explorer ↗
          </a>
          <a href={`${REST}/cosmos/tx/v1beta1/txs/${facts.hash}`} target="_blank" rel="noreferrer">
            Raw JSON ↗
          </a>
        </div>
      </div>
    </div>
  );
}
