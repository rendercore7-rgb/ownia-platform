use anchor_lang::prelude::*;

/// 스테이킹 풀 — 전체 스테이킹 설정 및 상태
#[account]
#[derive(InitSpace)]
pub struct StakePool {
    /// 풀 관리자
    pub admin: Pubkey,
    /// OWNIA 토큰 민트
    pub mint: Pubkey,
    /// 스테이킹된 토큰 보관 볼트
    pub vault: Pubkey,
    /// 보상 토큰 보관 볼트
    pub reward_vault: Pubkey,
    /// 연간 보상률 (basis points, 10000 = 100%)
    pub reward_rate_bps: u64,
    /// 전체 스테이킹된 토큰량
    pub total_staked: u64,
    /// 최소 잠금 기간 (초)
    pub lock_duration: i64,
    /// PDA bump
    pub bump: u8,
}

/// 개별 사용자 스테이킹 계정
#[account]
#[derive(InitSpace)]
pub struct StakeAccount {
    /// 스테이커 지갑
    pub owner: Pubkey,
    /// 속한 스테이킹 풀
    pub pool: Pubkey,
    /// 스테이킹된 토큰량
    pub staked_amount: u64,
    /// 스테이킹 시작 타임스탬프
    pub stake_timestamp: i64,
    /// 마지막 보상 수령 타임스탬프
    pub last_claim_timestamp: i64,
    /// PDA bump
    pub bump: u8,
}
