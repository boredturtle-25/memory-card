"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletConnect from "./WalletConnect";

interface NavbarProps {
  walletAddress: string | null;
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

export default function Navbar({ walletAddress, onConnect, onDisconnect }: NavbarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Play" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  return (
    <nav className="border-b border-rose-800/40 bg-rose-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="font-bold text-lg bg-gradient-to-r from-pink-400 via-rose-400 to-rose-300 bg-clip-text text-transparent">
              MemoChain
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                  pathname === link.href
                    ? "bg-rose-800/60 text-rose-100 font-medium"
                    : "text-rose-400/70 hover:text-rose-200 hover:bg-rose-800/30"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <WalletConnect onConnect={onConnect} onDisconnect={onDisconnect} />
      </div>
    </nav>
  );
}
