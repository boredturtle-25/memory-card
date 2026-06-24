"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { generateCards, calculateScore, getEarnableBadges } from "@/lib/utils";
import { submitScore, hasBadge, claimBadge } from "@/hooks/contract";

interface GameBoardProps {
  walletAddress: string | null;
}

export default function GameBoard({ walletAddress }: GameBoardProps) {
  const [cards, setCards] = useState<Array<{ id: number; emoji: string; isFlipped: boolean; isMatched: boolean }>>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [claimingBadge, setClaimingBadge] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isChecking = useRef(false);

  const GRID_SIZE = 4; // 4x4 = 16 cards
  const TOTAL_CARDS = GRID_SIZE * GRID_SIZE;

  const startGame = useCallback(() => {
    setCards(generateCards(GRID_SIZE, GRID_SIZE));
    setFlippedIds([]);
    setMoves(0);
    setMatches(0);
    setTime(0);
    setGameOver(false);
    setFinalScore(0);
    setIsPlaying(true);
    setSubmitted(false);
    setTxHash(null);
    setEarnedBadges([]);
  }, []);

  // Timer
  useEffect(() => {
    if (isPlaying && !gameOver) {
      timerRef.current = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, gameOver]);

  // Check for game over
  useEffect(() => {
    if (isPlaying && matches === TOTAL_CARDS / 2) {
      setIsPlaying(false);
      setGameOver(true);
      const score = calculateScore(moves, time, TOTAL_CARDS);
      setFinalScore(score);
    }
  }, [matches, moves, time, isPlaying, TOTAL_CARDS]);

  // Check existing badges after score is submitted
  useEffect(() => {
    if (submitted && walletAddress) {
      const checkBadges = async () => {
        const score = finalScore;
        const earnable = getEarnableBadges(score);
        const earned: string[] = [];
        for (const badge of earnable) {
          try {
            const alreadyHas = await hasBadge(walletAddress, badge.id);
            if (!alreadyHas) {
              earned.push(badge.id);
            }
          } catch { /* ignore */ }
        }
        setEarnedBadges(earned);
      };
      checkBadges();
    }
  }, [submitted, walletAddress, finalScore]);

  const handleCardClick = (id: number) => {
    if (!isPlaying || gameOver) return;
    if (flippedIds.length === 2) return;
    if (cards[id].isFlipped || cards[id].isMatched) return;

    const newCards = [...cards];
    newCards[id] = { ...newCards[id], isFlipped: true };
    setCards(newCards);

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newFlipped;
      if (newCards[first].emoji === newCards[second].emoji) {
        // Match found
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[first] = { ...updated[first], isMatched: true, isFlipped: true };
            updated[second] = { ...updated[second], isMatched: true, isFlipped: true };
            return updated;
          });
          setMatches((m) => m + 1);
          setFlippedIds([]);
        }, 300);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[first] = { ...updated[first], isFlipped: false };
            updated[second] = { ...updated[second], isFlipped: false };
            return updated;
          });
          setFlippedIds([]);
        }, 800);
      }
    }
  };

  const handleSubmitScore = async () => {
    if (!walletAddress || isSubmitting || submitted) return;
    setIsSubmitting(true);
    try {
      const txHashResult = await submitScore(walletAddress, finalScore, time, moves);
      setTxHash(txHashResult);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Failed to submit score:", err);
      alert("Failed to submit score. Make sure your wallet is connected and has testnet XLM.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimBadge = async (badgeId: string) => {
    if (!walletAddress || claimingBadge) return;
    setClaimingBadge(badgeId);
    try {
      await claimBadge(walletAddress, badgeId);
      setEarnedBadges((prev) => prev.filter((b) => b !== badgeId));
    } catch (err: any) {
      console.error("Failed to claim badge:", err);
    } finally {
      setClaimingBadge(null);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-rose-500 uppercase tracking-wider">Moves</div>
            <div className="text-xl font-bold text-rose-900">{moves}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-rose-500 uppercase tracking-wider">Matches</div>
            <div className="text-xl font-bold text-rose-900">{matches}/{TOTAL_CARDS / 2}</div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-rose-500 uppercase tracking-wider">Time</div>
          <div className={`font-mono text-xl font-bold ${time > 180 ? "text-red-400" : "text-rose-900"}`}>
            {isPlaying || gameOver ? formatTime(time) : "0:00"}
          </div>
        </div>
      </div>

      {/* Game Board */}
      {cards.length > 0 ? (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isFlipped || card.isMatched || gameOver}
              className={`
                w-16 h-16 sm:w-20 sm:h-20 rounded-2xl text-2xl sm:text-3xl
                transition-all duration-300 transform
                ${card.isMatched
                  ? "bg-pink-100 border-pink-300/80 scale-95"
                  : card.isFlipped
                  ? "bg-white border-pink-300/80 rotate-y-0"
                  : "bg-white/60 border-rose-200 hover:border-pink-300/80 hover:bg-rose-50"
                }
                border-2 font-bold shadow-lg
                ${card.isFlipped || card.isMatched ? "" : "hover:scale-105"}
                ${card.isMatched ? "opacity-70" : ""}
                disabled:cursor-default
              `}
            >
              <span className={card.isFlipped || card.isMatched ? "opacity-100" : "opacity-0"}>
                {card.isFlipped || card.isMatched ? card.emoji : "?"}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="w-[352px] sm:w-[368px] h-[352px] sm:h-[368px] flex items-center justify-center">
          <p className="text-rose-500 text-sm">Press Start to begin</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {!isPlaying && !gameOver && (
          <button
            onClick={startGame}
            disabled={!walletAddress}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!walletAddress ? "Connect Wallet to Play" : "Start Game"}
          </button>
        )}
        {isPlaying && (
          <button
          onClick={() => { setIsPlaying(false); setGameOver(true); }}
          className="px-6 py-3 bg-rose-100/80 hover:bg-rose-200/50 text-rose-700 font-medium rounded-xl transition-all duration-200 border border-rose-200"
          >
            End Game
          </button>
        )}
        {gameOver && (
          <button
            onClick={startGame}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/25"
          >
            Play Again
          </button>
        )}
      </div>

      {/* Score / Results */}
      {gameOver && (
        <div className="w-full max-w-md bg-white/80 border border-rose-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-center text-rose-900">Game Complete!</h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-rose-50/80 rounded-xl p-3">
              <div className="text-xs text-rose-500">Score</div>
              <div className="text-xl font-bold text-pink-600">{finalScore}</div>
            </div>
            <div className="bg-rose-50/80 rounded-xl p-3">
              <div className="text-xs text-rose-500">Moves</div>
              <div className="text-xl font-bold text-rose-900">{moves}</div>
            </div>
            <div className="bg-rose-50/80 rounded-xl p-3">
              <div className="text-xs text-rose-500">Time</div>
              <div className="text-xl font-bold text-rose-900">{formatTime(time)}</div>
            </div>
          </div>

          {!submitted && walletAddress && (
            <button
              onClick={handleSubmitScore}
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Submit Score to Stellar
                </>
              )}
            </button>
          )}

          {txHash && (
            <div className="text-center">
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-pink-600 hover:text-pink-500 underline"
              >
                View on Stellar Explorer ↗
              </a>
            </div>
          )}

          {/* Badge claiming */}
          {earnedBadges.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-rose-600/80 text-center">New Badges Available!</div>
              {earnedBadges.map((badgeId) => {
                const badgeDef = [
                  { id: "bronze", name: "Bronze", icon: "🥉" },
                  { id: "silver", name: "Silver", icon: "🥈" },
                  { id: "gold", name: "Gold", icon: "🥇" },
                  { id: "diamond", name: "Diamond", icon: "💎" },
                ].find((b) => b.id === badgeId)!;
                return (
                  <button
                    key={badgeId}
                    onClick={() => handleClaimBadge(badgeId)}
                    disabled={claimingBadge === badgeId}
                    className="w-full py-2 bg-gradient-to-r from-pink-100 to-rose-100 border border-pink-200 hover:from-pink-200 hover:to-rose-200 text-pink-700 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {claimingBadge === badgeId ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <span>{badgeDef.icon}</span>
                    )}
                    Claim {badgeDef.name} Badge (NFT)
                  </button>
                );
              })}
            </div>
          )}

          {!walletAddress && (
            <p className="text-xs text-rose-500 text-center">
              Connect your Freighter wallet to submit scores and earn NFT badges on-chain.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
