"use client";

import GameBoard from "@/components/GameBoard";
import { useWallet } from "@/components/ClientLayout";

export default function Home() {
  const { walletAddress } = useWallet();

  return (
    <div className="flex-1 flex flex-col items-center py-8 px-4">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          MemoChain
        </h1>
        <p className="mt-3 text-zinc-400 max-w-md">
          Match pairs of cards, compete for the highest score, and earn NFT achievement badges on the Stellar blockchain.
        </p>
      </div>

      {!walletAddress && (
        <div className="mb-6 px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400 flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
          </svg>
          Connect your Freighter wallet to submit scores and earn NFT badges.
        </div>
      )}

      <GameBoard walletAddress={walletAddress} />
    </div>
  );
}
