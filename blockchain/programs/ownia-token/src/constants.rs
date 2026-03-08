/// OWNIA Token 프로그램 상수 정의

/// 토큰 메타데이터
pub const TOKEN_NAME: &str = "OWNIA";
pub const TOKEN_SYMBOL: &str = "OWNIA";
pub const TOKEN_URI: &str = "https://owniacity.com/token-metadata.json";
pub const TOKEN_DECIMALS: u8 = 9;

/// 최대 공급량: 10억 OWNIA (decimals 9)
pub const MAX_SUPPLY: u64 = 1_000_000_000 * 10u64.pow(TOKEN_DECIMALS as u32);

/// PDA Seeds
pub const CONFIG_SEED: &[u8] = b"config";
pub const MINT_AUTHORITY_SEED: &[u8] = b"mint_authority";
pub const VESTING_SEED: &[u8] = b"vesting";
pub const VESTING_VAULT_SEED: &[u8] = b"vesting_vault";
pub const STAKE_POOL_SEED: &[u8] = b"stake_pool";
pub const POOL_VAULT_SEED: &[u8] = b"pool_vault";
pub const REWARD_VAULT_SEED: &[u8] = b"reward_vault";
pub const STAKE_ACCOUNT_SEED: &[u8] = b"stake";
pub const PROPOSAL_SEED: &[u8] = b"proposal";
pub const VOTE_RECORD_SEED: &[u8] = b"vote";

/// 거버넌스 기본값
pub const DEFAULT_MIN_PROPOSAL_STAKE: u64 = 10_000 * 10u64.pow(TOKEN_DECIMALS as u32); // 10,000 OWNIA
pub const MAX_TITLE_LEN: usize = 64;
pub const MAX_URI_LEN: usize = 200;

/// 연간 초 수 (보상 계산용)
pub const SECONDS_PER_YEAR: u64 = 365 * 24 * 60 * 60;
