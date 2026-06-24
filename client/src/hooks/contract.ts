"use client";

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

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

function getServer() {
  return new rpc.Server(RPC_URL);
}

function getContract() {
  return new Contract(CONTRACT_ADDRESS);
}

// ─── ScVal Helpers ────────────────────────────────────

function toScValString(v: string): xdr.ScVal {
  return nativeToScVal(v, { type: "string" });
}

function toScValU32(v: number): xdr.ScVal {
  return nativeToScVal(v, { type: "u32" });
}

function toScValAddress(v: string): xdr.ScVal {
  return nativeToScVal(v, { type: "address" });
}

// ─── Wallet Helpers ───────────────────────────────────

export async function connectWallet(): Promise<string | null> {
  try {
    const { requestAccess } = await import("@stellar/freighter-api");
    const res = await requestAccess();
    if (res.error) {
      console.error("Freighter requestAccess error:", res.error);
      return null;
    }
    return res.address || null;
  } catch (err) {
    console.error("Freighter not available — install the Freighter browser extension:", err);
    return null;
  }
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const { getAddress } = await import("@stellar/freighter-api");
    const res = await getAddress();
    if (res.error) {
      return null;
    }
    return res.address || null;
  } catch {
    return null;
  }
}

async function signWithFreighter(txXdr: string): Promise<string> {
  const { signTransaction } = await import("@stellar/freighter-api");
  const { signedTxXdr } = await signTransaction(txXdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  return signedTxXdr;
}

// ─── Generic Simulate (Read) ──────────────────────────

async function simulateRead(
  method: string,
  args: xdr.ScVal[],
): Promise<xdr.ScVal | null> {
  const server = getServer();
  const contract = getContract();

  // Use a placeholder source account for simulation
  const source = new Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "0",
  );

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
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

// ─── Generic Build, Simulate, Sign & Send (Write) ─────

async function simulateWrite(
  caller: string,
  method: string,
  args: xdr.ScVal[],
  signAndSubmit: boolean = true,
): Promise<string> {
  const server = getServer();
  const contract = getContract();

  // Get the real account for sequence number
  const account = await server.getAccount(caller);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${(sim as any).error || "unknown"}`);
  }

  // Assemble the transaction with simulation results
  const prepared = rpc
    .assembleTransaction(tx, sim)
    .build();

  // Sign with Freighter
  const signedXdr = await signWithFreighter(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  // Submit
  const sendRes = await server.sendTransaction(signedTx);
  if (sendRes.status !== "PENDING") {
    throw new Error(`Send failed: ${sendRes.errorResult ? "check error result" : "unknown"}`);
  }

  // Poll for completion
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

// ─── Contract Read Functions ─────────────────────────

export interface ScoreEntry {
  player: string;
  score: number;
  time: number;
  moves: number;
}

export async function getScore(playerAddress: string): Promise<ScoreEntry | null> {
  const retval = await simulateRead("get_score", [toScValAddress(playerAddress)]);
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

export async function getTotalGames(): Promise<number> {
  const retval = await simulateRead("get_total_games", []);
  if (!retval) return 0;
  return Number(scValToNative(retval));
}

export async function hasBadge(playerAddress: string, badge: string): Promise<boolean> {
  const retval = await simulateRead("has_badge", [
    toScValAddress(playerAddress),
    toScValString(badge),
  ]);
  if (!retval) return false;
  return Boolean(scValToNative(retval));
}

// ─── Contract Write Functions ────────────────────────

export async function submitScore(
  caller: string,
  score: number,
  time: number,
  moves: number,
): Promise<string> {
  return simulateWrite(caller, "submit_score", [
    toScValAddress(caller),
    toScValU32(score),
    toScValU32(time),
    toScValU32(moves),
  ]);
}

export async function claimBadge(
  caller: string,
  badge: string,
): Promise<string> {
  return simulateWrite(caller, "claim_badge", [
    toScValAddress(caller),
    toScValString(badge),
  ]);
}
