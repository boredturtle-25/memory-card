import {
  nativeToScVal,
  scValToNative,
  xdr,
  Address,
  rpc,
  Networks,
} from "@stellar/stellar-sdk";

const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

export const NETWORK_CONFIG = {
  rpcUrl: RPC_URL,
  networkPassphrase: NETWORK_PASSPHRASE,
};

export function createServer() {
  return new rpc.Server(RPC_URL);
}

// ─── ScVal Converters ───────────────────────────────────

export function toScValString(v: string) {
  return nativeToScVal(v, { type: "string" });
}

export function toScValU32(v: number) {
  return nativeToScVal(v, { type: "u32" });
}

export function toScValI128(v: string | number | bigint) {
  return nativeToScVal(v.toString(), { type: "i128" });
}

export function toScValAddress(v: string) {
  return new Address(v).toScVal();
}

export function toScValBool(v: boolean) {
  return nativeToScVal(v);
}

export function toScValSymbol(v: string) {
  return nativeToScVal(v, { type: "symbol" });
}

export function toScValU64(v: string | number) {
  return nativeToScVal(v, { type: "u64" });
}

export function toScValI64(v: string | number) {
  return nativeToScVal(v, { type: "i64" });
}

export function fromScVal(sv: xdr.ScVal): any {
  return scValToNative(sv);
}

// ─── Contract Helpers ───────────────────────────────────

export async function getAccount(server: rpc.Server, pubKey: string) {
  const account = await server.getAccount(pubKey);
  return account;
}

// signAndSend has been migrated to hooks/contract.ts using stellar-sdk v16 API

// ─── Game Logic ────────────────────────────────────────

const EMOJIS = ["🎮", "🚀", "💎", "🔥", "🌈", "⭐", "🎯", "👑"];

export function generateCards(rows: number, cols: number) {
  const totalCards = rows * cols;
  const pairCount = totalCards / 2;
  const selectedEmojis = EMOJIS.slice(0, pairCount);
  const cards = [...selectedEmojis, ...selectedEmojis]
    .sort(() => Math.random() - 0.5)
    .map((emoji, index) => ({ id: index, emoji, isFlipped: false, isMatched: false }));
  return cards;
}

export function calculateScore(moves: number, timeSeconds: number, totalCards: number): number {
  const minMoves = totalCards / 2;
  const maxTime = 300; // 5 minutes max for scoring
  const moveScore = Math.max(0, 1000 - (moves - minMoves) * 100);
  const timeScore = Math.max(0, 1000 - Math.floor(timeSeconds / maxTime * 1000));
  const total = moveScore + timeScore;
  return Math.max(0, total);
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  minScore: number;
}

export const BADGES: BadgeDef[] = [
  { id: "bronze", name: "Bronze", description: "Score 500+ points", icon: "🥉", minScore: 500 },
  { id: "silver", name: "Silver", description: "Score 1000+ points", icon: "🥈", minScore: 1000 },
  { id: "gold", name: "Gold", description: "Score 1500+ points", icon: "🥇", minScore: 1500 },
  { id: "diamond", name: "Diamond", description: "Score 1800+ points", icon: "💎", minScore: 1800 },
];

export function getEarnableBadges(score: number): BadgeDef[] {
  return BADGES.filter((b) => score >= b.minScore);
}
