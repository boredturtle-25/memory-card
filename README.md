# MemoChain — Memory Card Game on Stellar Soroban

A full-stack Web3 memory card game powered by the **Stellar Soroban** blockchain. Players match pairs of cards, compete for high scores, and earn NFT-style achievement badges — all recorded immutably on Stellar testnet.

**Live demo**: Connect your Freighter wallet and play at `http://localhost:3000` (dev)

---

## Table of Contents

- [Project Structure](#project-structure)
- [Smart Contract](#smart-contract)
  - [Functions](#functions)
  - [Data Types](#data-types)
  - [Events](#events)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Contract Setup](#contract-setup)
  - [Client Setup](#client-setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [Game Mechanics](#game-mechanics)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## Project Structure

```
project/
├── contract/                                    # Soroban smart contract workspace
│   ├── Cargo.toml                               # Workspace root (resolver="2", soroban-sdk 25)
│   ├── Cargo.lock
│   ├── contracts/contract/
│   │   ├── Cargo.toml                           # Contract manifest (DO NOT modify)
│   │   └── src/
│   │       ├── lib.rs                           # Contract implementation (78 lines)
│   │       └── test.rs                          # Unit tests (166 lines, 10 test cases)
│   └── README.md
├── client/                                      # Next.js 16 frontend
│   ├── src/
│   │   ├── app/                                 # App Router pages
│   │   │   ├── layout.tsx                       # Root layout (Geist font, global CSS)
│   │   │   ├── page.tsx                         # Home — Play page
│   │   │   ├── dashboard/page.tsx               # Dashboard — stats & badges
│   │   │   ├── leaderboard/page.tsx             # Leaderboard (placeholder)
│   │   │   └── globals.css                      # Tailwind v4 styles
│   │   ├── components/
│   │   │   ├── ClientLayout.tsx                 # Wallet context provider
│   │   │   ├── Navbar.tsx                       # Navigation + Connect Wallet button
│   │   │   ├── WalletConnect.tsx                # Freighter connect/disconnect
│   │   │   ├── GameBoard.tsx                    # Memory card game UI (4×4 grid)
│   │   │   └── Dashboard.tsx                    # Player stats dashboard
│   │   ├── hooks/
│   │   │   └── contract.ts                      # Contract interaction hooks
│   │   └── lib/
│   │       └── utils.ts                         # ScVal helpers, game logic, badge defs
│   ├── packages/contract/
│   │   ├── package.json
│   │   └── src/
│   │       └── index.ts                         # Generated typed contract client
│   ├── package.json                             # @stellar/stellar-sdk, freighter-api
│   └── next.config.ts
├── .gitignore
└── README.md                                    # This file
```

---

## Smart Contract

The contract lives at `contract/contracts/contract/src/lib.rs` and is written in Rust using `soroban-sdk` v25. It is intentionally kept minimal (78 lines of code).

### Functions

| Function | Description | Auth Required |
|---|---|---|
| `init` | Initialize the contract (sets total games to 0). Can only be called once. | No |
| `submit_score` | Submit a game score for a player. Only keeps the **best** score per player. | **Yes** (player) |
| `get_score` | Get a player's best score entry. Returns `Option<ScoreEntry>`. | No |
| `get_total_games` | Get total number of games played across all players. | No |
| `claim_badge` | Claim an achievement badge by name. Cannot claim the same badge twice. | **Yes** (player) |
| `has_badge` | Check if a player has a specific badge. Returns `bool`. | No |

### Data Types

```rust
// Each score submission stores:
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScoreEntry {
    pub player: Address,   // Stellar wallet address
    pub score: u32,        // Computed score (0-2000)
    pub time: u32,         // Game duration in seconds
    pub moves: u32,        // Number of moves made
}
```

**Badges** are stored as persistent storage entries keyed by `(player_address, badge_name)` with a boolean value of `true`.

### Storage Keys

- `DataKey::Score(Address)` — persistent, per-player best score entry
- `DataKey::Badge(Address, String)` — persistent, per-player per-badge flag
- `symbol_short!("total_g")` — instance storage, total games counter

### Events

| Topic | Payload | When |
|---|---|---|
| `score` | `(ScoreEntry,)` | A new score is submitted |
| `badge` | `(Address, String)` — player + badge name | A badge is claimed |

---

## Getting Started

### Prerequisites

| Tool | Version | Installation |
|---|---|---|
| [Rust](https://rustup.rs/) | stable (≥1.81) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| soroban-cli | ≥25 | `cargo install soroban-cli --version 25` |
| [Bun](https://bun.sh/) | ≥1.2 | `curl -fsSL https://bun.sh/install \| bash` |
| [Freighter](https://freighter.app/) | latest | Browser extension |
| wasm-opt | latest | `cargo install wasm-opt` |

### Contract Setup

```bash
cd contract

# Run tests
cargo test

# Build the WASM contract
stellar contract build

# Generate a testnet keypair and fund it
stellar keys generate dev --network testnet --fund

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/contract.wasm \
  --source-account dev \
  --network testnet

# → Outputs: C... (contract address)
```

### Client Setup

```bash
cd client

# Install dependencies
bun install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local and set:
#   NEXT_PUBLIC_CONTRACT_ADDRESS=C...   (from deploy step)
#   NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org

# Start development server
bun run dev
```

Open `http://localhost:3000` in your browser. Connect your Freighter wallet (testnet funded) and start playing!

---

## Testing

### Contract Tests (Rust)

```bash
cd contract
cargo test
```

The test suite (`test.rs`) covers 10 test cases:

| Test | What it verifies |
|---|---|
| `test_init` | Contract initializes with 0 total games |
| `test_init_twice` | Double init panics ("already initialized") |
| `test_submit_score` | Score submission stores correct values |
| `test_submit_score_only_keeps_best` | Lower scores do NOT overwrite higher ones |
| `test_submit_score_updates_best` | Higher scores DO overwrite lower ones |
| `test_get_score_default` | Unregistered player returns `None` |
| `test_claim_and_has_badge` | Badge claim flow works end-to-end |
| `test_multiple_badges` | Player can hold multiple badges |
| `test_badge_already_claimed` | Duplicate badge claim panics |
| `test_different_players_independent_scores` | Players have isolated score state |

### Client Build Check

```bash
cd client
bun run build       # TypeScript + Next.js build
```

---

## Deployment

### Deploy Contract (Testnet)

```bash
cd contract
stellar contract build
stellar keys generate dev --network testnet --fund
stellar contract deploy \
  --wasm target/wasm32v1-none/release/contract.wasm \
  --source-account dev \
  --network testnet
```

Save the resulting `C...` contract address — you'll need it for the client.

### Initialize Contract

```bash
stellar contract invoke \
  --id <CONTRACT_ADDRESS> \
  --source-account dev \
  --network testnet \
  -- init
```

### Bindings (optional, for TypeScript generation)

```bash
cd client
stellar contract bindings typescript \
  --network testnet \
  --contract-id <CONTRACT_ADDRESS> \
  --output-dir packages/contract
```

---

## Game Mechanics

### How Scoring Works

The `calculateScore()` function in `lib/utils.ts` computes:

```
moveScore  = max(0, 1000 - (moves - minMoves) × 100)
timeScore  = max(0, 1000 - floor(timeSeconds / 300 × 1000))
totalScore = moveScore + timeScore
```

- **Minimum moves**: 8 (4×4 grid = 16 cards / 2)
- **Perfect score**: 2000 (8 moves, 0 seconds)
- **Maximum time for points**: 5 minutes

### Achievement Badges

| Badge | Icon | Requirement | On-Chain |
|---|---|---|---|
| Bronze | 🥉 | Score ≥ 500 | ✅ |
| Silver | 🥈 | Score ≥ 1000 | ✅ |
| Gold | 🥇 | Score ≥ 1500 | ✅ |
| Diamond | 💎 | Score ≥ 1800 | ✅ |

Each badge is a unique on-chain record per player. Claiming a badge mints it to your connected wallet.

### How a Game Round Works

1. **Connect** your Freighter wallet (testnet)
2. **Press "Start Game"** — a 4×4 grid of cards appears, shuffled randomly
3. **Match pairs** — click cards to flip them; matching pairs stay revealed
4. **Timer runs** — your time and move count are tracked
5. **Game ends** — when all 8 pairs are matched
6. **Submit score** — your score is recorded on-chain (only best score kept)
7. **Claim badges** — if your score qualifies for any badges you don't already have
8. **View Dashboard** — see your best score, total games, and badge collection

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Stellar Soroban (smart contract platform) |
| **Contract Language** | Rust (`soroban-sdk` v25) |
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Wallet** | Freighter (browser extension) |
| **Blockchain SDK** | `@stellar/stellar-sdk` v16 |
| **Wallet SDK** | `@stellar/freighter-api` v6 |

### Key Dependencies

```
soroban-sdk = "25"          # Contract SDK
@stellar/stellar-sdk = "^16"  # Client SDK
@stellar/freighter-api = "^6" # Wallet integration
next = "16"                   # React framework
tailwindcss = "^4"           # Utility CSS
```

---

## License

MIT
