"use client";

import { useCallback, useEffect, useState } from "react";
import { getScore, getTotalGames, hasBadge } from "@/hooks/contract";
import { BADGES } from "@/lib/utils";

interface DashboardProps {
  walletAddress: string | null;
}

export default function Dashboard({ walletAddress }: DashboardProps) {
  const [bestScore, setBestScore] = useState<{ score: number; time: number; moves: number } | null>(null);
  const [totalGames, setTotalGames] = useState<number>(0);
  const [ownedBadges, setOwnedBadges] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [scoreResult, total, bronze, silver, gold, diamond] = await Promise.all([
        getScore(walletAddress!),
        getTotalGames(),
        hasBadge(walletAddress!, "bronze"),
        hasBadge(walletAddress!, "silver"),
        hasBadge(walletAddress!, "gold"),
        hasBadge(walletAddress!, "diamond"),
      ]);

      if (scoreResult) {
        setBestScore(scoreResult);
      }
      setTotalGames(total);

      const owned: string[] = [];
      if (bronze) owned.push("bronze");
      if (silver) owned.push("silver");
      if (gold) owned.push("gold");
      if (diamond) owned.push("diamond");
      setOwnedBadges(owned);
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) {
      setIsLoading(false);
      return;
    }
    loadData();
  }, [walletAddress, refreshTrigger, loadData]);

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-rose-500">
        <span className="text-6xl mb-4">🔗</span>
        <p className="text-lg">Connect your Freighter wallet to view your dashboard</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-pink-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={() => setRefreshTrigger((n) => n + 1)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-rose-100/80 hover:bg-rose-200/50 text-rose-700 text-sm rounded-xl transition-all duration-200 border border-rose-200 disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 border border-rose-200 rounded-2xl p-6">
          <div className="text-xs text-rose-500 uppercase tracking-wider mb-1">Best Score</div>
          <div className="text-3xl font-bold text-pink-600">
            {bestScore ? bestScore.score : "—"}
          </div>
          {bestScore && (
            <div className="text-xs text-rose-500 mt-1">
              {bestScore.moves} moves · {Math.floor(bestScore.time / 60)}:{String(bestScore.time % 60).padStart(2, "0")}
            </div>
          )}
        </div>

        <div className="bg-white/80 border border-rose-200 rounded-2xl p-6">
          <div className="text-xs text-rose-500 uppercase tracking-wider mb-1">Games Played</div>
          <div className="text-3xl font-bold text-rose-600">{totalGames}</div>
        </div>

        <div className="bg-white/80 border border-rose-200 rounded-2xl p-6">
          <div className="text-xs text-rose-500 uppercase tracking-wider mb-1">Badges Earned</div>
          <div className="text-3xl font-bold text-pink-600">{ownedBadges.length}/{BADGES.length}</div>
        </div>
      </div>

      {/* Badge Gallery */}
      <div>
        <h3 className="text-lg font-semibold text-rose-900 mb-4">Achievement Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {BADGES.map((badge) => {
            const isOwned = ownedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`bg-white/80 border rounded-2xl p-5 text-center transition-all duration-200 ${
                  isOwned
                    ? "border-pink-300 bg-pink-50"
                    : "border-rose-200 opacity-50"
                }`}
              >
                <div className={`text-4xl mb-2 ${isOwned ? "" : "grayscale"}`}>
                  {badge.icon}
                </div>
                <div className={`font-semibold text-sm ${isOwned ? "text-rose-900" : "text-rose-500"}`}>
                  {badge.name}
                </div>
                <div className="text-xs text-rose-500 mt-1">{badge.description}</div>
                {isOwned && (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-pink-600">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Minted On-Chain
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Wallet Info */}
      <div className="bg-white/80 border border-rose-200 rounded-2xl p-5">
        <div className="text-xs text-rose-500 uppercase tracking-wider mb-2">Wallet</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pink-500" />
          <span className="text-sm font-mono text-rose-700">{walletAddress}</span>
        </div>
        <p className="text-xs text-rose-400 mt-2">
          All scores and badges are stored on the Stellar blockchain
        </p>
      </div>
    </div>
  );
}
