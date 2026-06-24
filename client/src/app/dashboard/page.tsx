"use client";

import Dashboard from "@/components/Dashboard";
import { useWallet } from "@/components/ClientLayout";

export default function DashboardPage() {
  const { walletAddress } = useWallet();

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Your scores, stats, and NFT badge collection</p>
      </div>
      <Dashboard walletAddress={walletAddress} />
    </div>
  );
}
