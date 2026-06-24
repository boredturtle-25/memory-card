#![cfg(test)]
use super::*;
use soroban_sdk::{Env, Address, String};
use soroban_sdk::testutils::Address as _;

#[test]
fn test_init() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    client.init();
    assert_eq!(client.get_total_games(), 0);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_init_twice() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    client.init();
    client.init();
}

#[test]
fn test_submit_score() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    client.init();

    let player = Address::generate(&env);
    client.submit_score(&player, &1000, &120, &20);

    let score = client.get_score(&player).unwrap();
    assert_eq!(score.score, 1000);
    assert_eq!(score.time, 120);
    assert_eq!(score.moves, 20);
    assert_eq!(score.player, player);
    assert_eq!(client.get_total_games(), 1);
}

#[test]
fn test_submit_score_only_keeps_best() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    client.init();

    let player = Address::generate(&env);

    // Submit good score first
    client.submit_score(&player, &1000, &120, &20);
    // Submit worse score — should not overwrite
    client.submit_score(&player, &500, &60, &10);

    let score = client.get_score(&player).unwrap();
    assert_eq!(score.score, 1000); // still best
    assert_eq!(client.get_total_games(), 2);
}

#[test]
fn test_submit_score_updates_best() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    client.init();

    let player = Address::generate(&env);

    // Submit lower score first
    client.submit_score(&player, &500, &60, &10);
    assert_eq!(client.get_score(&player).unwrap().score, 500);

    // Submit better score — should update
    client.submit_score(&player, &1000, &120, &20);
    assert_eq!(client.get_score(&player).unwrap().score, 1000);
}

#[test]
fn test_get_score_default() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    client.init();

    let player = Address::generate(&env);
    let score = client.get_score(&player);
    assert!(score.is_none());
}

#[test]
fn test_claim_and_has_badge() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    client.init();

    let player = Address::generate(&env);
    let badge_name = String::from_str(&env, "gold");

    assert!(!client.has_badge(&player, &badge_name));
    client.claim_badge(&player, &badge_name);
    assert!(client.has_badge(&player, &badge_name));
}

#[test]
fn test_multiple_badges() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    client.init();

    let player = Address::generate(&env);
    let gold = String::from_str(&env, "gold");
    let silver = String::from_str(&env, "silver");
    let bronze = String::from_str(&env, "bronze");

    client.claim_badge(&player, &gold);
    client.claim_badge(&player, &silver);
    client.claim_badge(&player, &bronze);

    assert!(client.has_badge(&player, &gold));
    assert!(client.has_badge(&player, &silver));
    assert!(client.has_badge(&player, &bronze));
}

#[test]
#[should_panic(expected = "badge already claimed")]
fn test_badge_already_claimed() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    client.init();

    let player = Address::generate(&env);
    let badge = String::from_str(&env, "gold");
    client.claim_badge(&player, &badge);
    client.claim_badge(&player, &badge);
}

#[test]
fn test_different_players_independent_scores() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    client.init();

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.submit_score(&alice, &1000, &120, &20);
    client.submit_score(&bob, &2000, &90, &15);

    assert_eq!(client.get_score(&alice).unwrap().score, 1000);
    assert_eq!(client.get_score(&bob).unwrap().score, 2000);
    assert_eq!(client.get_total_games(), 2);
}
