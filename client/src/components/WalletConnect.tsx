"use client";

import { useEffect, useState } from "react";
import { connectWallet, getWalletAddress } from "@/hooks/contract";

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

export default function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    getWalletAddress().then((addr) => {
      if (addr) {
        setAddress(addr);
        onConnect(addr);
      }
    });
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const addr = await connectWallet();
      if (addr) {
        setAddress(addr);
        onConnect(addr);
      }
    } catch (err) {
      console.error("Failed to connect wallet", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAddress(null);
    onDisconnect();
  };

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-green-400 font-mono">
            {address.slice(0, 4)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
    >
      {isConnecting ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-9-9" strokeLinecap="round" />
            <path d="M21 3l-9 9" strokeLinecap="round" />
            <path d="M21 3h-6" strokeLinecap="round" />
            <path d="M21 3v6" strokeLinecap="round" />
          </svg>
          Connect Wallet
        </>
      )}
    </button>
  );
}
