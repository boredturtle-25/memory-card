"use client";

import { useState, useEffect } from "react";
import { getScore, getTotalGames } from "@/hooks/contract";
import { useWallet } from "@/components/ClientLayout";

export default function LeaderboardPage() {
  const { walletAddress } = useWallet();
  const [totalGames, setTotalGames] = useState<number | null>(null);
  const [myScore, setMyScore] = useState<{ score: number; time: number; moves: number } | null>(null);
  const [lookupAddr, setLookupAddr] = useState("");
  const [lookupScore, setLookupScore] = useState<{ score: number; time: number; moves: number } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    getTotalGames().then(setTotalGames).catch(() => setTotalGames(0));
  }, []);

  useEffect(() => {
    if (walletAddress) {
      getScore(walletAddress).then(setMyScore).catch(() => {});
    }
  }, [walletAddress]);

  const handleLookup = async () => {
    if (!lookupAddr) return;
    setLookupLoading(true);
    try {
      const score = await getScore(lookupAddr);
      setLookupScore(score);
    } catch {
      setLookupScore(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Leaderboard</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {totalGames !== null ? `${totalGames.toLocaleString()} games played on-chain` : "Loading..."}
        </p>
      </div>

      <div className="space-y-6">
        {/* My Score */}
        {myScore && (
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-5">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Your Best Score</div>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-indigo-400">{myScore.score}</div>
              <div className="text-sm text-zinc-400">
                {myScore.moves} moves · {formatTime(myScore.time)}
              </div>
            </div>
          </div>
        )}

        {/* Lookup */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">Look Up Player Score</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={lookupAddr}
              onChange={(e) => setLookupAddr(e.target.value)}
              placeholder="Enter Stellar address (G...)"
              className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            />
            <button
              onClick={handleLookup}
              disabled={lookupLoading || !lookupAddr}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {lookupLoading ? "..." : "Look Up"}
            </button>
          </div>

          {lookupScore && (
            <div className="mt-4 bg-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-500 font-mono mb-2">{lookupAddr.slice(0, 8)}...{lookupAddr.slice(-4)}</div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-xs text-zinc-500">Score</span>
                  <div className="text-xl font-bold text-green-400">{lookupScore.score}</div>
                </div>
                <div>
                  <span className="text-xs text-zinc-500">Moves</span>
                  <div className="text-xl font-bold text-zinc-100">{lookupScore.moves}</div>
                </div>
                <div>
                  <span className="text-xs text-zinc-500">Time</span>
                  <div className="text-xl font-bold text-zinc-100">{formatTime(lookupScore.time)}</div>
                </div>
              </div>
            </div>
          )}

          {lookupAddr && !lookupLoading && lookupScore === null && (
            <p className="mt-3 text-xs text-zinc-500">No score found for this address.</p>
          )}
        </div>

        {/* On-Chain Info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-sm text-zinc-400">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-zinc-300 font-medium mb-1">On-Chain Leaderboard</p>
              <p>
                Scores are stored on the Stellar blockchain via the MemoChain smart contract.
                All data is verifiable and immutable. A full ranked leaderboard with pagination
                will be available with the next contract upgrade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
