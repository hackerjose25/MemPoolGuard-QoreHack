import { CHAIN_ID, ML_DSA_87_BYTES, MIN_GAS_PRICE, type TxCard } from "../game/engine";
import { short } from "../chain";

const PQC_MAX = 4800;

/** One transaction packet. When `reveal` is set, the faulty field is highlighted. */
export function TxCardView({ card, reveal }: { card: TxCard; reveal?: boolean }) {
  const bad = (f: TxCard["forgery"][]) => (reveal && f.includes(card.forgery) ? " bad" : "");
  const price = card.fee / card.gas;
  const qor = (card.amount / 1e6).toLocaleString("en-US", { maximumFractionDigits: 6 });

  return (
    <div className="packet">
      <div className="packet-head">
        <span className="packet-tag">TX #{String(card.index + 1).padStart(2, "0")}</span>
        <code className="packet-hash">{card.hash.slice(0, 10)}…{card.hash.slice(-6)}</code>
      </div>

      <div className={"field chain" + bad(["wrong-chain", "chain-typo"])}>
        <label>chain_id</label>
        <code className={card.chainId === CHAIN_ID ? "" : "mono-warn"}>{card.chainId}</code>
      </div>

      <div className="field route">
        <label>route</label>
        <div>
          <code>{short(card.from, 8, 5)}</code>
          <span className="arrow" aria-hidden>
            →
          </span>
          <code>{short(card.to, 8, 5)}</code>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>amount</label>
          <b>
            {qor} <small>QOR</small>
          </b>
        </div>
        <div className={"field" + bad(["fee-floor"])}>
          <label>gas price</label>
          <b>
            {price.toFixed(3)} <small>uqor/gas</small>
          </b>
          <small className="sub">
            fee {card.fee.toLocaleString("en-US")} · gas {card.gas.toLocaleString("en-US")} · floor {MIN_GAS_PRICE}
          </small>
        </div>
      </div>

      <div className="field">
        <label>memo</label>
        <span className="memo">{card.memo || <i>empty</i>}</span>
      </div>

      <div className="sigs">
        <div className={"sig" + bad(["classical-len"])}>
          <div className="sig-top">
            <span>secp256k1</span>
            <code>{card.classicalSigBytes} B</code>
          </div>
          <div className="bar classical">
            <i style={{ width: `${Math.min(100, (card.classicalSigBytes / 64) * 100)}%` }} />
          </div>
        </div>
        <div className={"sig" + bad(["no-pqc", "pqc-level", "pqc-truncated"])}>
          <div className="sig-top">
            <span>{card.pqc ? card.pqc.alg : "PQC extension"}</span>
            <code>{card.pqc ? `${card.pqc.bytes.toLocaleString("en-US")} B` : "— missing —"}</code>
          </div>
          <div className={"bar pqc" + (card.pqc ? "" : " empty")}>
            <i style={{ width: `${card.pqc ? (card.pqc.bytes / PQC_MAX) * 100 : 0}%` }} />
            <em style={{ left: `${(ML_DSA_87_BYTES / PQC_MAX) * 100}%` }} title="4,627 B" />
          </div>
        </div>
      </div>

      <div className={"hashes" + bad(["body-hash"])}>
        <div>
          <label>body hash</label>
          <code>{card.bodyHash}</code>
        </div>
        <div>
          <label>signed hash</label>
          <code>{card.signedHash}</code>
        </div>
      </div>
    </div>
  );
}
