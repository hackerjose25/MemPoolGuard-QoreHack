// QoreX native provider access (window.qorex.native), per
// https://docs.qorechain.io/qorex/browser-extension/ — feature-detected, never assumed.
import { CHAIN_ID } from "./game/engine";
import { DENOM, MSG_SEND } from "./chain";

export const GAS_LIMIT = 300000;

export interface QorexKey {
  bech32Address: string;
  name?: string;
}

export interface QorexNative {
  capabilities?: string[];
  enable(chainId: string): Promise<void>;
  getKey(chainId: string): Promise<QorexKey>;
  signAndBroadcast(req: {
    chainId: string;
    messages: { typeUrl: string; value: Uint8Array }[];
    memo?: string;
    gasLimit?: number;
  }): Promise<{ txHash: string; code: number; height?: number }>;
}

declare global {
  interface Window {
    qorex?: { native?: QorexNative };
  }
}

export function getQorexNative(): QorexNative | null {
  return window.qorex?.native ?? null;
}

export async function connectQorex(): Promise<string> {
  const p = getQorexNative();
  if (!p) throw new Error("QoreX not detected. Install the QoreX extension and reload.");
  if (!p.capabilities?.includes("signAndBroadcast")) throw new Error("This QoreX version can't sign native transactions. Update QoreX.");
  await p.enable(CHAIN_ID);
  const key = await p.getKey(CHAIN_ID);
  // The SDK is loaded on demand so the game itself stays light.
  const { isValidBech32 } = await import("@qorechain/sdk");
  if (!isValidBech32(key.bech32Address, "qor")) throw new Error("QoreX returned an unexpected address.");
  return key.bech32Address;
}

export async function signRun(from: string, to: string, amount: string, memo: string): Promise<string> {
  const p = getQorexNative();
  if (!p) throw new Error("QoreX disconnected.");
  const res = await p.signAndBroadcast({
    chainId: CHAIN_ID,
    messages: [{ typeUrl: MSG_SEND, value: encodeMsgSend(from, to, amount) }],
    memo,
    gasLimit: GAS_LIMIT,
  });
  if (!/^[0-9A-Fa-f]{64}$/.test(res?.txHash ?? "")) throw new Error("QoreX returned no valid transaction hash.");
  if (res.code !== 0) throw new Error(`Chain rejected the transaction at broadcast (code ${res.code}).`);
  return res.txHash.toUpperCase();
}

// Minimal protobuf encoder for cosmos.bank.v1beta1.MsgSend (byte-identical to cosmjs-types).
function varint(n: number): number[] {
  const out: number[] = [];
  while (n > 0x7f) {
    out.push((n & 0x7f) | 0x80);
    n >>>= 7;
  }
  out.push(n);
  return out;
}
const lenField = (f: number, b: Uint8Array | number[]) => [(f << 3) | 2, ...varint(b.length), ...b];
const utf8 = (s: string) => new TextEncoder().encode(s);

export function encodeMsgSend(from: string, to: string, amount: string, denom = DENOM): Uint8Array {
  const coin = [...lenField(1, utf8(denom)), ...lenField(2, utf8(amount))];
  return new Uint8Array([...lenField(1, utf8(from)), ...lenField(2, utf8(to)), ...lenField(3, coin)]);
}
