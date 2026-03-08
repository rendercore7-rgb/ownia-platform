use anchor_lang::prelude::*;

/// 베스팅 스케줄 — 팀/투자자/어드바이저별 토큰 잠금 및 선형 해제
#[account]
#[derive(InitSpace)]
pub struct VestingSchedule {
    /// 수혜자 지갑 주소
    pub beneficiary: Pubkey,
    /// 토큰 민트 주소
    pub mint: Pubkey,
    /// 잠긴 토큰을 보관하는 볼트 토큰 계정
    pub vault: Pubkey,
    /// 총 베스팅 토큰량 (raw units)
    pub total_amount: u64,
    /// 이미 수령한 토큰량
    pub claimed_amount: u64,
    /// 베스팅 시작 타임스탬프 (Unix epoch)
    pub start_timestamp: i64,
    /// Cliff 기간 (초) — 이 기간 전에는 수령 불가
    pub cliff_duration: i64,
    /// 전체 베스팅 기간 (초) — 이 기간 후 전액 해제
    pub total_duration: i64,
    /// 스케줄 ID (같은 수혜자에 여러 스케줄 허용)
    pub schedule_id: u8,
    /// 취소 여부
    pub revoked: bool,
    /// PDA bump
    pub bump: u8,
}
