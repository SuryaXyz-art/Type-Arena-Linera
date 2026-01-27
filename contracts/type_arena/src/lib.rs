use async_graphql::{Enum, InputObject, Request, Response, SimpleObject};
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    graphql::GraphQLMutationRoot,
    linera_base_types::{AccountOwner, ChainId, CryptoHash, Timestamp},
};
use serde::{Deserialize, Serialize};

/// Type Arena Application ABI
pub struct TypeArenaAbi;

impl ContractAbi for TypeArenaAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for TypeArenaAbi {
    type Query = Request;
    type QueryResponse = Response;
}

/// Operations that can be performed on the Type Arena contract
#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    /// Create a new game room
    CreateRoom {
        room_id: CryptoHash,
        max_players: u8,
        rounds: u8,
    },
    /// Join an existing room (sends message to host chain)
    JoinRoom {
        room_id: CryptoHash,
        host_chain_id: ChainId,
        player_name: String,
    },
    /// Start the game (host only)
    StartGame {
        room_id: CryptoHash,
    },
    /// Submit typing result for current round
    SubmitResult {
        room_id: CryptoHash,
        host_chain_id: ChainId,
        wpm: u32,
        accuracy: u32,
        time_ms: u64,
    },
    /// Leave the room
    LeaveRoom {
        room_id: CryptoHash,
        host_chain_id: ChainId,
    },
}

/// Cross-chain messages for multiplayer synchronization
#[derive(Debug, Deserialize, Serialize, Clone)]
pub enum Message {
    /// Player joined notification
    PlayerJoined {
        room_id: CryptoHash,
        player: AccountOwner,
        player_chain_id: ChainId,
        player_name: String,
    },
    /// Game started with prompt
    GameStarted {
        room_id: CryptoHash,
        prompt: String,
        round: u8,
        start_time: Timestamp,
    },
    /// Player submitted their result
    ResultSubmitted {
        room_id: CryptoHash,
        player: AccountOwner,
        wpm: u32,
        accuracy: u32,
        time_ms: u64,
    },
    /// Round ended, new round starting or game over
    RoundEnded {
        room_id: CryptoHash,
        round: u8,
        results: Vec<PlayerResult>,
        next_prompt: Option<String>,
    },
    /// Game ended with final standings
    GameEnded {
        room_id: CryptoHash,
        final_standings: Vec<PlayerResult>,
        winner: AccountOwner,
    },
    /// Player left the room
    PlayerLeft {
        room_id: CryptoHash,
        player: AccountOwner,
    },
    /// Full state sync for new players (serialized room state)
    SyncState {
        room_id: CryptoHash,
        state_bytes: Vec<u8>,
    },
}

/// Room status enum
#[derive(Debug, Deserialize, Serialize, Clone, Copy, PartialEq, Eq, Enum)]
pub enum RoomStatus {
    Lobby,
    InProgress,
    Finished,
}

/// Player result for a round or game
#[derive(Debug, Deserialize, Serialize, Clone, SimpleObject, InputObject)]
#[graphql(input_name = "PlayerResultInput")]
pub struct PlayerResult {
    pub player: AccountOwner,
    pub player_name: String,
    pub wpm: u32,
    pub accuracy: u32,
    pub time_ms: u64,
    pub score: u32,
}

impl PlayerResult {
    pub fn calculate_score(wpm: u32, accuracy: u32) -> u32 {
        // Score = WPM * (accuracy/100)^2
        // This heavily rewards accuracy while still valuing speed
        let accuracy_factor = (accuracy as f64 / 100.0).powi(2);
        (wpm as f64 * accuracy_factor) as u32
    }
}

/// Word bank for typing challenges
pub const WORD_BANK: &[&str] = &[
    "The quick brown fox jumps over the lazy dog near the riverbank.",
    "Blockchain technology enables decentralized applications with trustless consensus.",
    "Linera microchains provide infinite horizontal scalability for web3 applications.",
    "Fast fingers and sharp minds compete in the ultimate typing arena showdown.",
    "Practice makes perfect when it comes to improving your typing speed.",
    "Cross-chain messaging allows real-time synchronization between player chains.",
    "Speed and accuracy are the twin pillars of typing mastery excellence.",
    "The future of gaming lies in decentralized multiplayer experiences.",
    "Every keystroke counts when racing against opponents in real time.",
    "Sub-second finality means your results update instantly across all chains.",
    "Welcome to Type Arena where champions are forged through practice.",
    "Microchains enable each player to have their own dedicated blockchain.",
    "Real-time competition has never been more exciting or accessible.",
    "The clock is ticking and every word matters in this typing race.",
    "Precision typing separates the good players from the great ones.",
];
