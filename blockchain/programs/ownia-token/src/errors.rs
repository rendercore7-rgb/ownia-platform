use anchor_lang::prelude::*;

/// OWNIA Token 프로그램 커스텀 에러 코드
#[error_code]
pub enum OwniaError {
    /// 최대 공급량 초과
    #[msg("Minting would exceed the maximum supply")]
    SupplyExceeded,

    /// 관리자 권한 없음
    #[msg("Only the admin can perform this action")]
    Unauthorized,

    /// 베스팅 cliff 기간 미경과
    #[msg("Cliff period has not passed yet")]
    CliffNotReached,

    /// 수령 가능 토큰 없음
    #[msg("No tokens available to claim")]
    NothingToClaim,

    /// 스테이킹 잠금 기간 미경과
    #[msg("Tokens are still locked in the staking period")]
    StillLocked,

    /// 스테이킹 금액 부족 (거버넌스 제안)
    #[msg("Insufficient staked amount to create a proposal")]
    InsufficientStake,

    /// 투표 기간 아님
    #[msg("Voting is not active for this proposal")]
    VotingNotActive,

    /// 이미 투표함
    #[msg("Already voted on this proposal")]
    AlreadyVoted,

    /// 금액 0 불가
    #[msg("Amount must be greater than zero")]
    ZeroAmount,

    /// 산술 오버플로
    #[msg("Arithmetic overflow occurred")]
    MathOverflow,

    /// 잘못된 베스팅 파라미터
    #[msg("Invalid vesting parameters")]
    InvalidVestingParams,

    /// 제안 이미 실행됨
    #[msg("Proposal has already been executed")]
    ProposalAlreadyExecuted,

    /// 보상 볼트 잔액 부족
    #[msg("Insufficient reward vault balance")]
    InsufficientRewardBalance,
}
