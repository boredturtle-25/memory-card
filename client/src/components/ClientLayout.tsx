"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import Navbar from "./Navbar";

interface WalletCtx {
  walletAddress: string | null;
  setWalletAddress: (addr: string | null) => void;
}

const WalletContext = createContext<WalletCtx>({
  walletAddress: null,
  setWalletAddress: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  return (
    <WalletContext.Provider value={{ walletAddress, setWalletAddress }}>
      <Navbar
        walletAddress={walletAddress}
        onConnect={setWalletAddress}
        onDisconnect={() => setWalletAddress(null)}
      />
      <main className="flex-1">
        {children}
      </main>
    </WalletContext.Provider>
  );
}
