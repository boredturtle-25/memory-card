"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import { useWallet } from "@/components/ClientLayout";

export default function DashboardPage() {
  const { walletAddress } = useWallet();
  // Force Dashboard to remount on each page visit so it fetches fresh data.
  const [mountKey] = useState(() => Math.random());

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-rose-900">Dashboard</h1>
          <p className="text-rose-500 text-sm mt-1">Your scores, stats, and NFT badge collection</p>
        </div>
      </div>
      <Dashboard key={mountKey} walletAddress={walletAddress} />
    </div>
  );
}
