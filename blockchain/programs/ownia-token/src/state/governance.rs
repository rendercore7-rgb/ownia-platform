use anchor_lang::prelude::*;

use crate::constants::{MAX_TITLE_LEN, MAX_URI_LEN};

/// 거버넌스 제안
#[account]
#[derive(InitSpace)]
pub struct Proposal {
    /// 제안자 지갑
    pub proposer: Pubkey,
    /// 제안 ID
    pub proposal_id: u64,
    /// 제안 제목 (최대 64자)
    #[max_len(MAX_TITLE_LEN)]
    pub title: String,
    /// 상세 설명 URI (IPFS/Arweave, 최대 200자)
    #[max_len(MAX_URI_LEN)]
    pub description_uri: String,
    /// 투표 시작 타임스탬프
    pub voting_start: i64,
    /// 투표 종료 타임스탬프
    pub voting_end: i64,
    /// 찬성 투표 가중치 합계
    pub votes_for: u64,
    /// 반대 투표 가중치 합계
    pub votes_against: u64,
    /// 실행 여부
    pub executed: bool,
    /// PDA bump
    pub bump: u8,
}

/// 개별 투표 기록 (이중투표 방지)
#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    /// 투표자 지갑
    pub voter: Pubkey,
    /// 대상 제안
    pub proposal: Pubkey,
    /// 찬성(true) / 반대(false)
    pub vote: bool,
    /// 투표 당시 스테이킹 가중치
    pub weight: u64,
    /// PDA bump
    pub bump: u8,
}
