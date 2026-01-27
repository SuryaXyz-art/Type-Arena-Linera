use linera_sdk::{
    linera_base_types::{AccountOwner, ChainId, CryptoHash, Timestamp},
    views::{MapView, RegisterView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};
use type_arena::{PlayerResult, RoomStatus};

/// Root state for Type Arena application
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct TypeArenaState {
    /// All game rooms indexed by room_id
    pub rooms: MapView<CryptoHash, GameRoom>,
    /// Player statistics indexed by AccountOwner
    pub player_stats: MapView<AccountOwner, PlayerStats>,
    /// Total games played counter
    pub total_games: RegisterView<u64>,
}

/// A game room with all its state
#[derive(Debug, Deserialize, Serialize, Clone, async_graphql::SimpleObject)]
pub struct GameRoom {
    pub room_id: CryptoHash,
    pub host: AccountOwner,
    pub host_chain_id: ChainId,
    pub players: Vec<PlayerInfo>,
    pub status: RoomStatus,
    pub max_players: u8,
    pub total_rounds: u8,
    pub current_round: u8,
    pub current_prompt: Option<String>,
    pub round_start_time: Option<Timestamp>,
    pub round_results: Vec<PlayerResult>,
    pub game_scores: Vec<PlayerScore>,
    pub created_at: Timestamp,
}

impl GameRoom {
    pub fn new(
        room_id: CryptoHash,
        host: AccountOwner,
        host_chain_id: ChainId,
        host_name: String,
        max_players: u8,
        rounds: u8,
        created_at: Timestamp,
    ) -> Self {
        let host_info = PlayerInfo {
            owner: host,
            chain_id: host_chain_id,
            display_name: host_name,
            is_ready: true,
        };
        
        Self {
            room_id,
            host,
            host_chain_id,
            players: vec![host_info],
            status: RoomStatus::Lobby,
            max_players,
            total_rounds: rounds,
            current_round: 0,
            current_prompt: None,
            round_start_time: None,
            round_results: Vec::new(),
            game_scores: vec![PlayerScore {
                player: host,
                total_score: 0,
                rounds_completed: 0,
            }],
            created_at,
        }
    }
    
    pub fn is_full(&self) -> bool {
        self.players.len() >= self.max_players as usize
    }
    
    pub fn has_player(&self, owner: &AccountOwner) -> bool {
        self.players.iter().any(|p| &p.owner == owner)
    }
    
    pub fn get_player_chain(&self, owner: &AccountOwner) -> Option<ChainId> {
        self.players.iter().find(|p| &p.owner == owner).map(|p| p.chain_id)
    }
    
    pub fn all_results_submitted(&self) -> bool {
        self.round_results.len() >= self.players.len()
    }
}

/// Player information in a room
#[derive(Debug, Deserialize, Serialize, Clone, async_graphql::SimpleObject)]
pub struct PlayerInfo {
    pub owner: AccountOwner,
    pub chain_id: ChainId,
    pub display_name: String,
    pub is_ready: bool,
}

/// Player score tracking across rounds
#[derive(Debug, Deserialize, Serialize, Clone, async_graphql::SimpleObject)]
pub struct PlayerScore {
    pub player: AccountOwner,
    pub total_score: u32,
    pub rounds_completed: u8,
}

/// Persistent player statistics
#[derive(Debug, Deserialize, Serialize, Clone, Default, async_graphql::SimpleObject)]
pub struct PlayerStats {
    pub games_played: u32,
    pub games_won: u32,
    pub total_wpm: u64,
    pub total_accuracy: u64,
    pub rounds_played: u32,
    pub best_wpm: u32,
    pub best_accuracy: u32,
}

impl PlayerStats {
    pub fn average_wpm(&self) -> u32 {
        if self.rounds_played == 0 {
            0
        } else {
            (self.total_wpm / self.rounds_played as u64) as u32
        }
    }
    
    pub fn average_accuracy(&self) -> u32 {
        if self.rounds_played == 0 {
            0
        } else {
            (self.total_accuracy / self.rounds_played as u64) as u32
        }
    }
    
    pub fn update_with_result(&mut self, wpm: u32, accuracy: u32) {
        self.rounds_played += 1;
        self.total_wpm += wpm as u64;
        self.total_accuracy += accuracy as u64;
        
        if wpm > self.best_wpm {
            self.best_wpm = wpm;
        }
        if accuracy > self.best_accuracy {
            self.best_accuracy = accuracy;
        }
    }
}
