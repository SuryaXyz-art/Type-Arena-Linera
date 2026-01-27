#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;
use async_graphql::{EmptyMutation, EmptySubscription, Object, Request, Response, Schema, SimpleObject};
use linera_sdk::{
    abi::WithServiceAbi,
    linera_base_types::{AccountOwner, CryptoHash},
    views::View,
    Service, ServiceRuntime,
};
use state::{PlayerStats, TypeArenaState};
use type_arena::{RoomStatus, TypeArenaAbi};

pub struct TypeArenaService {
    state: TypeArenaState,
    #[allow(dead_code)]
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(TypeArenaService);

impl WithServiceAbi for TypeArenaService {
    type Abi = TypeArenaAbi;
}

impl Service for TypeArenaService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = TypeArenaState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        TypeArenaService { 
            state, 
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        // Extract room data for the query
        let mut rooms = Vec::new();
        let _ = self.state.rooms.for_each_index_value(|_id, room| {
            let r = room.into_owned();
            rooms.push(RoomInfo {
                room_id: r.room_id.to_string(),
                host: r.host.to_string(),
                player_count: r.players.len() as u32,
                max_players: r.max_players,
                status: format!("{:?}", r.status),
                current_round: r.current_round,
                total_rounds: r.total_rounds,
                current_prompt: r.current_prompt.clone(),
                players: r.players.iter().map(|p| PlayerInfo {
                    owner: p.owner.to_string(),
                    display_name: p.display_name.clone(),
                    is_ready: p.is_ready,
                }).collect(),
                is_joinable: r.status == RoomStatus::Lobby && r.players.len() < r.max_players as usize,
            });
            Ok(())
        }).await;
        
        // Extract player stats for leaderboard
        let mut leaderboard = Vec::new();
        let _ = self.state.player_stats.for_each_index_value(|owner, stats| {
            let s = stats.into_owned();
            if s.games_played > 0 {
                leaderboard.push(LeaderboardEntry {
                    player: owner.to_string(),
                    games_won: s.games_won,
                    games_played: s.games_played,
                    average_wpm: if s.rounds_played > 0 { (s.total_wpm / s.rounds_played as u64) as u32 } else { 0 },
                    average_accuracy: if s.rounds_played > 0 { (s.total_accuracy / s.rounds_played as u64) as u32 } else { 0 },
                    best_wpm: s.best_wpm,
                });
            }
            Ok(())
        }).await;
        
        // Sort leaderboard by games won
        leaderboard.sort_by(|a, b| b.games_won.cmp(&a.games_won));
        leaderboard.truncate(20);
        
        let total_games = *self.state.total_games.get();

        let schema = Schema::build(
            QueryRoot { rooms, leaderboard, total_games },
            EmptyMutation,
            EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}

/// GraphQL Query Root with owned data
struct QueryRoot {
    rooms: Vec<RoomInfo>,
    leaderboard: Vec<LeaderboardEntry>,
    total_games: u64,
}

#[Object]
impl QueryRoot {
    /// Get a specific room by ID
    async fn room(&self, room_id: String) -> Option<&RoomInfo> {
        self.rooms.iter().find(|r| r.room_id == room_id)
    }
    
    /// List all active (lobby) rooms that can be joined
    async fn active_rooms(&self) -> Vec<&RoomInfo> {
        self.rooms.iter().filter(|r| r.is_joinable).collect()
    }
    
    /// List all rooms
    async fn all_rooms(&self) -> &[RoomInfo] {
        &self.rooms
    }
    
    /// Get global leaderboard
    async fn leaderboard(&self, limit: Option<u32>) -> Vec<&LeaderboardEntry> {
        let limit = limit.unwrap_or(10) as usize;
        self.leaderboard.iter().take(limit).collect()
    }
    
    /// Get total games played
    async fn total_games(&self) -> u64 {
        self.total_games
    }
}

/// Room information for GraphQL
#[derive(SimpleObject)]
struct RoomInfo {
    room_id: String,
    host: String,
    player_count: u32,
    max_players: u8,
    status: String,
    current_round: u8,
    total_rounds: u8,
    current_prompt: Option<String>,
    players: Vec<PlayerInfo>,
    is_joinable: bool,
}

/// Player info for GraphQL
#[derive(SimpleObject)]
struct PlayerInfo {
    owner: String,
    display_name: String,
    is_ready: bool,
}

/// Leaderboard entry for GraphQL
#[derive(SimpleObject)]
struct LeaderboardEntry {
    player: String,
    games_won: u32,
    games_played: u32,
    average_wpm: u32,
    average_accuracy: u32,
    best_wpm: u32,
}
