/**
 * MemoChain Contract Client
 *
 * Auto-generated typed client for the MemoChain Soroban smart contract.
 * Provides type-safe methods for all contract interactions.
 */

import {
  rpc,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Account,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";

export { scValToNative, nativeToScVal };

export const NETWORK_CONFIG = {
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: Networks.TESTNET,
};

export function createServer() {
  return new rpc.Server(NETWORK_CONFIG.rpcUrl);
}

function getContract(contractId: string) {
  return new Contract(contractId);
}

// ─── Type Definitions ──────────────────────────────────

export interface ScoreEntry {
  player: string;
  score: number;
  time: number;
  moves: number;
}

// ─── Helpers ───────────────────────────────────────────

function toScValString(v: string): xdr.ScVal {
  return nativeToScVal(v, { type: "string" });
}

function toScValU32(v: number): xdr.ScVal {
  return nativeToScVal(v, { type: "u32" });
}

function toScValAddress(v: string): xdr.ScVal {
  return nativeToScVal(v, { type: "address" });
}

async function signWithFreighter(txXdr: string, networkPassphrase: string): Promise<string> {
  const { signTransaction } = await import("@stellar/freighter-api");
  const { signedTxXdr } = await signTransaction(txXdr, { networkPassphrase });
  return signedTxXdr;
}

// ─── Generic Simulate (Read) ──────────────────────────

async function simulateRead(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
): Promise<xdr.ScVal | null> {
  const server = createServer();
  const contract = getContract(contractId);

  const source = new Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "0",
  );

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_CONFIG.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
    return sim.result.retval;
  }
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${(sim as any).error || "unknown"}`);
  }
  return null;
}

// ─── Generic Write ─────────────────────────────────────

async function simulateWrite(
  contractId: string,
  caller: string,
  method: string,
  args: xdr.ScVal[],
): Promise<string> {
  const server = createServer();
  const contract = getContract(contractId);

  const account = await server.getAccount(caller);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_CONFIG.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${(sim as any).error || "unknown"}`);
  }

  const prepared = rpc
    .assembleTransaction(tx, sim)
    .build();

  const signedXdr = await signWithFreighter(prepared.toXDR(), NETWORK_CONFIG.networkPassphrase);
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_CONFIG.networkPassphrase);

  const sendRes = await server.sendTransaction(signedTx);
  if (sendRes.status !== "PENDING") {
    throw new Error(`Send failed: ${sendRes.errorResult ? "check error result" : "unknown"}`);
  }

  let result = await server.getTransaction(sendRes.hash);
  const maxAttempts = 30;
  let attempts = 0;
  while (result.status === "NOT_FOUND" && attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 1000));
    result = await server.getTransaction(sendRes.hash);
    attempts++;
  }
  if (result.status !== "SUCCESS") {
    throw new Error(`Transaction failed: ${result.status}`);
  }
  return result.txHash;
}

// ─── Read Functions ────────────────────────────────────

export async function getScore(
  contractId: string,
  playerAddress: string,
): Promise<ScoreEntry | null> {
  const retval = await simulateRead(contractId, "get_score", [
    toScValAddress(playerAddress),
  ]);
  if (!retval) return null;
  const val: any = scValToNative(retval);
  if (!val) return null;
  return {
    player: val.player,
    score: Number(val.score),
    time: Number(val.time),
    moves: Number(val.moves),
  };
}

export async function getTotalGames(contractId: string): Promise<number> {
  const retval = await simulateRead(contractId, "get_total_games", []);
  if (!retval) return 0;
  return Number(scValToNative(retval));
}

export async function hasBadge(
  contractId: string,
  playerAddress: string,
  badge: string,
): Promise<boolean> {
  const retval = await simulateRead(contractId, "has_badge", [
    toScValAddress(playerAddress),
    toScValString(badge),
  ]);
  if (!retval) return false;
  return Boolean(scValToNative(retval));
}

// ─── Write Functions ───────────────────────────────────

export async function submitScore(
  contractId: string,
  caller: string,
  score: number,
  time: number,
  moves: number,
): Promise<string> {
  return simulateWrite(contractId, caller, "submit_score", [
    toScValAddress(caller),
    toScValU32(score),
    toScValU32(time),
    toScValU32(moves),
  ]);
}

export async function claimBadge(
  contractId: string,
  caller: string,
  badge: string,
): Promise<string> {
  return simulateWrite(contractId, caller, "claim_badge", [
    toScValAddress(caller),
    toScValString(badge),
  ]);
}
