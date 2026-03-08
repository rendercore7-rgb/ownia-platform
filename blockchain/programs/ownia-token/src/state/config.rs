use anchor_lang::prelude::*;

/// 프로그램 전역 설정 — 토큰 민트, 관리자, 공급량 추적
#[account]
#[derive(InitSpace)]
pub struct ProgramConfig {
    /// 관리자 지갑 (민팅, 베스팅 생성 등 권한)
    pub admin: Pubkey,
    /// OWNIA 토큰 민트 주소
    pub mint: Pubkey,
    /// 최대 공급량 (raw units, decimals 포함)
    pub max_supply: u64,
    /// 현재까지 발행된 총량
    pub total_minted: u64,
    /// 거버넌스 제안 최소 스테이킹량
    pub min_proposal_stake: u64,
    /// 제안 ID 자동 증가 카운터
    pub proposal_count: u64,
    /// PDA bump
    pub bump: u8,
}
