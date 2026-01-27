#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
    linera_base_types::{AccountOwner, ChainId, CryptoHash, Timestamp},
};
use linera_base::crypto::{BcsHashable, CryptoHash as CryptoHashGen};
use serde::{Deserialize, Serialize};
use state::{GameRoom, PlayerInfo, PlayerScore, PlayerStats, TypeArenaState};
use type_arena::{Message, Operation, PlayerResult, RoomStatus, TypeArenaAbi, WORD_BANK};

/// Wrapper for generating deterministic random hashes
#[derive(Serialize, Deserialize)]
struct SeedWrapper(Vec<u8>);

impl<'de> BcsHashable<'de> for SeedWrapper {}

pub struct TypeArenaContract {
    state: TypeArenaState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(TypeArenaContract);

impl WithContractAbi for TypeArenaContract {
    type Abi = TypeArenaAbi;
}

impl Contract for TypeArenaContract {
    type Message = Message;
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = TypeArenaState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        TypeArenaContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: ()) {
        // Nothing to initialize
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::CreateRoom { room_id, max_players, rounds } => {
                self.create_room(room_id, max_players, rounds).await;
            }
            Operation::JoinRoom { room_id, host_chain_id, player_name } => {
                self.join_room(room_id, host_chain_id, player_name).await;
            }
            Operation::StartGame { room_id } => {
                self.start_game(room_id).await;
            }
            Operation::SubmitResult { room_id, host_chain_id, wpm, accuracy, time_ms } => {
                self.submit_result(room_id, host_chain_id, wpm, accuracy, time_ms).await;
            }
            Operation::LeaveRoom { room_id, host_chain_id } => {
                self.leave_room(room_id, host_chain_id).await;
            }
        }
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::PlayerJoined { room_id, player, player_chain_id, player_name } => {
                self.handle_player_joined(room_id, player, player_chain_id, player_name).await;
            }
            Message::GameStarted { room_id, prompt, round, start_time } => {
                self.handle_game_started(room_id, prompt, round, start_time).await;
            }
            Message::ResultSubmitted { room_id, player, wpm, accuracy, time_ms } => {
                self.handle_result_submitted(room_id, player, wpm, accuracy, time_ms).await;
            }
            Message::RoundEnded { room_id, round, results, next_prompt } => {
                self.handle_round_ended(room_id, round, results, next_prompt).await;
            }
            Message::GameEnded { room_id, final_standings, winner } => {
                self.handle_game_ended(room_id, final_standings, winner).await;
            }
            Message::PlayerLeft { room_id, player } => {
                self.handle_player_left(room_id, player).await;
            }
            Message::SyncState { room_id, state_bytes } => {
                self.handle_sync_state(room_id, state_bytes).await;
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl TypeArenaContract {
    /// Create a new game room (executed on host chain)
    async fn create_room(&mut self, room_id: CryptoHash, max_players: u8, rounds: u8) {
        assert!(max_players >= 2 && max_players <= 8, "Invalid player count (2-8)");
        assert!(rounds >= 1 && rounds <= 10, "Invalid round count (1-10)");
        
        let existing = self.state.rooms.get(&room_id).await.expect("Failed to get room");
        assert!(existing.is_none(), "Room already exists");
        
        let host = self.runtime.authenticated_signer().expect("No authenticated signer");
        let host_chain_id = self.runtime.chain_id();
        let created_at = self.runtime.system_time();
        
        // Generate a display name from the owner
        let host_name = format!("Player_{}", &host.to_string()[..8]);
        
        let room = GameRoom::new(
            room_id,
            host,
            host_chain_id,
            host_name,
            max_players,
            rounds,
            created_at,
        );
        
        self.state.rooms.insert(&room_id, room).expect("Failed to insert room");
    }
    
    /// Join a room (sends message to host chain)
    async fn join_room(&mut self, room_id: CryptoHash, host_chain_id: ChainId, player_name: String) {
        let player = self.runtime.authenticated_signer().expect("No authenticated signer");
        let player_chain_id = self.runtime.chain_id();
        
        // Send join request to host chain
        let message = Message::PlayerJoined {
            room_id,
            player,
            player_chain_id,
            player_name,
        };
        
        self.runtime
            .prepare_message(message)
            .send_to(host_chain_id);
    }
    
    /// Start the game (host only)
    async fn start_game(&mut self, room_id: CryptoHash) {
        let mut room = self.state.rooms.get(&room_id).await
            .expect("Failed to get room")
            .expect("Room not found");
        
        let caller = self.runtime.authenticated_signer().expect("No authenticated signer");
        assert!(room.host == caller, "Only host can start game");
        assert!(room.status == RoomStatus::Lobby, "Game already started");
        assert!(room.players.len() >= 2, "Need at least 2 players");
        
        // Start first round
        room.status = RoomStatus::InProgress;
        room.current_round = 1;
        room.round_results.clear();
        
        let prompt = self.get_random_prompt();
        let start_time = self.runtime.system_time();
        room.current_prompt = Some(prompt.clone());
        room.round_start_time = Some(start_time);
        
        // Broadcast game start to all players
        let message = Message::GameStarted {
            room_id,
            prompt: prompt.clone(),
            round: 1,
            start_time,
        };
        
        for player_info in &room.players {
            if player_info.chain_id != self.runtime.chain_id() {
                self.runtime
                    .prepare_message(message.clone())
                    .send_to(player_info.chain_id);
            }
        }
        
        self.state.rooms.insert(&room_id, room).expect("Failed to update room");
    }
    
    /// Submit typing result (sends to host if not on host chain)
    async fn submit_result(&mut self, room_id: CryptoHash, host_chain_id: ChainId, wpm: u32, accuracy: u32, time_ms: u64) {
        let player = self.runtime.authenticated_signer().expect("No authenticated signer");
        
        if self.runtime.chain_id() == host_chain_id {
            // We're on the host chain, process directly
            self.process_result(room_id, player, wpm, accuracy, time_ms).await;
        } else {
            // Send result to host chain
            let message = Message::ResultSubmitted {
                room_id,
                player,
                wpm,
                accuracy,
                time_ms,
            };
            
            self.runtime
                .prepare_message(message)
                .send_to(host_chain_id);
        }
    }
    
    /// Leave a room
    async fn leave_room(&mut self, room_id: CryptoHash, host_chain_id: ChainId) {
        let player = self.runtime.authenticated_signer().expect("No authenticated signer");
        
        let message = Message::PlayerLeft {
            room_id,
            player,
        };
        
        self.runtime
            .prepare_message(message)
            .send_to(host_chain_id);
    }
    
    // === Message Handlers (executed on receiving chain) ===
    
    async fn handle_player_joined(&mut self, room_id: CryptoHash, player: AccountOwner, player_chain_id: ChainId, player_name: String) {
        let mut room = match self.state.rooms.get(&room_id).await.expect("Failed to get room") {
            Some(r) => r,
            None => return, // Room doesn't exist on this chain
        };
        
        // Validate join
        if room.is_full() || room.status != RoomStatus::Lobby || room.has_player(&player) {
            return;
        }
        
        // Add player
        let player_info = PlayerInfo {
            owner: player,
            chain_id: player_chain_id,
            display_name: player_name,
            is_ready: true,
        };
        room.players.push(player_info);
        room.game_scores.push(PlayerScore {
            player,
            total_score: 0,
            rounds_completed: 0,
        });
        
        // Sync state to all players
        self.broadcast_state_sync(&room).await;
        
        self.state.rooms.insert(&room_id, room).expect("Failed to update room");
    }
    
    async fn handle_game_started(&mut self, room_id: CryptoHash, prompt: String, round: u8, start_time: Timestamp) {
        // Create or update room on player's chain
        if let Some(mut room) = self.state.rooms.get(&room_id).await.expect("Failed to get room") {
            room.status = RoomStatus::InProgress;
            room.current_round = round;
            room.current_prompt = Some(prompt);
            room.round_start_time = Some(start_time);
            room.round_results.clear();
            self.state.rooms.insert(&room_id, room).expect("Failed to update room");
        }
    }
    
    async fn handle_result_submitted(&mut self, room_id: CryptoHash, player: AccountOwner, wpm: u32, accuracy: u32, time_ms: u64) {
        // Only process on host chain
        self.process_result(room_id, player, wpm, accuracy, time_ms).await;
    }
    
    async fn process_result(&mut self, room_id: CryptoHash, player: AccountOwner, wpm: u32, accuracy: u32, time_ms: u64) {
        let mut room = match self.state.rooms.get(&room_id).await.expect("Failed to get room") {
            Some(r) => r,
            None => return,
        };
        
        if room.status != RoomStatus::InProgress {
            return;
        }
        
        // Check if player already submitted
        if room.round_results.iter().any(|r| r.player == player) {
            return;
        }
        
        // Get player name
        let player_name = room.players.iter()
            .find(|p| p.owner == player)
            .map(|p| p.display_name.clone())
            .unwrap_or_else(|| "Unknown".to_string());
        
        let score = PlayerResult::calculate_score(wpm, accuracy);
        
        let result = PlayerResult {
            player,
            player_name,
            wpm,
            accuracy,
            time_ms,
            score,
        };
        
        room.round_results.push(result);
        
        // Update player's game score
        if let Some(game_score) = room.game_scores.iter_mut().find(|s| s.player == player) {
            game_score.total_score += score;
            game_score.rounds_completed += 1;
        }
        
        // Update player stats
        let mut stats = self.state.player_stats.get(&player).await
            .expect("Failed to get stats")
            .unwrap_or_default();
        stats.update_with_result(wpm, accuracy);
        self.state.player_stats.insert(&player, stats).expect("Failed to update stats");
        
        // Check if all players submitted
        if room.all_results_submitted() {
            self.end_round(&mut room).await;
        }
        
        self.state.rooms.insert(&room_id, room).expect("Failed to update room");
    }
    
    async fn end_round(&mut self, room: &mut GameRoom) {
        let results = room.round_results.clone();
        
        if room.current_round >= room.total_rounds {
            // Game over
            room.status = RoomStatus::Finished;
            
            // Find winner (highest total score)
            let winner = room.game_scores.iter()
                .max_by_key(|s| s.total_score)
                .map(|s| s.player)
                .expect("No winner found");
            
            // Update winner stats
            if let Some(mut stats) = self.state.player_stats.get(&winner).await.expect("Failed to get stats") {
                stats.games_won += 1;
                self.state.player_stats.insert(&winner, stats).expect("Failed to update stats");
            }
            
            // Update all player game counts
            for player_info in &room.players {
                if let Some(mut stats) = self.state.player_stats.get(&player_info.owner).await.expect("Failed to get stats") {
                    stats.games_played += 1;
                    self.state.player_stats.insert(&player_info.owner, stats).expect("Failed to update stats");
                }
            }
            
            // Increment total games
            let total = self.state.total_games.get();
            self.state.total_games.set(*total + 1);
            
            // Broadcast game end
            let final_standings: Vec<PlayerResult> = room.game_scores.iter().map(|s| {
                PlayerResult {
                    player: s.player,
                    player_name: room.players.iter()
                        .find(|p| p.owner == s.player)
                        .map(|p| p.display_name.clone())
                        .unwrap_or_default(),
                    wpm: 0,
                    accuracy: 0,
                    time_ms: 0,
                    score: s.total_score,
                }
            }).collect();
            
            let message = Message::GameEnded {
                room_id: room.room_id,
                final_standings,
                winner,
            };
            
            for player_info in &room.players {
                if player_info.chain_id != self.runtime.chain_id() {
                    self.runtime
                        .prepare_message(message.clone())
                        .send_to(player_info.chain_id);
                }
            }
        } else {
            // Next round
            room.current_round += 1;
            room.round_results.clear();
            
            let next_prompt = self.get_random_prompt();
            room.current_prompt = Some(next_prompt.clone());
            room.round_start_time = Some(self.runtime.system_time());
            
            let message = Message::RoundEnded {
                room_id: room.room_id,
                round: room.current_round - 1,
                results,
                next_prompt: Some(next_prompt),
            };
            
            for player_info in &room.players {
                if player_info.chain_id != self.runtime.chain_id() {
                    self.runtime
                        .prepare_message(message.clone())
                        .send_to(player_info.chain_id);
                }
            }
        }
    }
    
    async fn handle_round_ended(&mut self, room_id: CryptoHash, _round: u8, _results: Vec<PlayerResult>, next_prompt: Option<String>) {
        if let Some(mut room) = self.state.rooms.get(&room_id).await.expect("Failed to get room") {
            room.current_round += 1;
            room.round_results.clear();
            room.current_prompt = next_prompt;
            room.round_start_time = Some(self.runtime.system_time());
            self.state.rooms.insert(&room_id, room).expect("Failed to update room");
        }
    }
    
    async fn handle_game_ended(&mut self, room_id: CryptoHash, _final_standings: Vec<PlayerResult>, _winner: AccountOwner) {
        if let Some(mut room) = self.state.rooms.get(&room_id).await.expect("Failed to get room") {
            room.status = RoomStatus::Finished;
            self.state.rooms.insert(&room_id, room).expect("Failed to update room");
        }
    }
    
    async fn handle_player_left(&mut self, room_id: CryptoHash, player: AccountOwner) {
        if let Some(mut room) = self.state.rooms.get(&room_id).await.expect("Failed to get room") {
            room.players.retain(|p| p.owner != player);
            room.game_scores.retain(|s| s.player != player);
            
            // Broadcast state sync
            self.broadcast_state_sync(&room).await;
            
            self.state.rooms.insert(&room_id, room).expect("Failed to update room");
        }
    }
    
    async fn handle_sync_state(&mut self, room_id: CryptoHash, state_bytes: Vec<u8>) {
        if let Ok(state) = bcs::from_bytes::<GameRoom>(&state_bytes) {
            self.state.rooms.insert(&room_id, state).expect("Failed to sync room state");
        }
    }
    
    async fn broadcast_state_sync(&mut self, room: &GameRoom) {
        let state_bytes = bcs::to_bytes(room).expect("Failed to serialize room");
        let message = Message::SyncState {
            room_id: room.room_id,
            state_bytes,
        };
        
        for player_info in &room.players {
            if player_info.chain_id != self.runtime.chain_id() {
                self.runtime
                    .prepare_message(message.clone())
                    .send_to(player_info.chain_id);
            }
        }
    }
    
    fn get_random_prompt(&mut self) -> String {
        // Generate deterministic but unpredictable prompt selection
        let data = (
            self.runtime.chain_id(),
            self.runtime.system_time(),
            self.runtime.block_height(),
        );
        let bytes = bcs::to_bytes(&data).expect("Serialization failed");
        let seed = SeedWrapper(bytes);
        let hash = CryptoHashGen::new(&seed);
        let index = (hash.as_bytes()[0] as usize) % WORD_BANK.len();
        WORD_BANK[index].to_string()
    }
}
