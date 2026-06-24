#![no_std]
#![allow(deprecated)]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol};

#[contracttype]
pub enum DataKey {
    Score(Address),
    Badge(Address, String),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScoreEntry {
    pub player: Address,
    pub score: u32,
    pub time: u32,
    pub moves: u32,
}

const TOTAL_GAMES: Symbol = symbol_short!("total_g");

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn init(env: Env) {
        if env.storage().instance().has(&TOTAL_GAMES) {
            panic!("already initialized");
        }
        env.storage().instance().set(&TOTAL_GAMES, &0u32);
    }

    /// Submit a game score. Only stores the player's best score.
    pub fn submit_score(env: Env, player: Address, score: u32, time: u32, moves: u32) {
        player.require_auth();
        let key = DataKey::Score(player.clone());
        let entry = ScoreEntry { player: player.clone(), score, time, moves };
        let existing = env.storage().persistent().get::<_, ScoreEntry>(&key);
        if existing.is_none() || score > existing.unwrap().score {
            env.storage().persistent().set(&key, &entry);
        }
        let total: u32 = env.storage().instance().get(&TOTAL_GAMES).unwrap_or(0);
        env.storage().instance().set(&TOTAL_GAMES, &(total + 1));
        env.events().publish((symbol_short!("score"),), (entry,));
    }

    /// Get a player's best score entry.
    pub fn get_score(env: Env, player: Address) -> Option<ScoreEntry> {
        env.storage().persistent().get(&DataKey::Score(player))
    }

    /// Get total number of games played.
    pub fn get_total_games(env: Env) -> u32 {
        env.storage().instance().get(&TOTAL_GAMES).unwrap_or(0)
    }

    /// Claim an achievement badge.
    pub fn claim_badge(env: Env, player: Address, badge: String) {
        player.require_auth();
        let key = DataKey::Badge(player.clone(), badge.clone());
        if env.storage().persistent().has(&key) {
            panic!("badge already claimed");
        }
        env.storage().persistent().set(&key, &true);
        env.events().publish((symbol_short!("badge"),), (player, badge));
    }

    /// Check if a player has a specific badge.
    pub fn has_badge(env: Env, player: Address, badge: String) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Badge(player, badge))
            .unwrap_or(false)
    }
}

mod test;
