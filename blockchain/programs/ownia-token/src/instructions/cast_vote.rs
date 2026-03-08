use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::OwniaError;
use crate::state::{Proposal, StakeAccount, VoteRecord};

/// 투표 — 스테이킹 수량 기반 가중 투표 (이중투표 방지)
pub fn handle_cast_vote(ctx: Context<CastVote>, vote: bool) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let proposal = &ctx.accounts.proposal;

    // 투표 기간 확인
    require!(
        now >= proposal.voting_start && now < proposal.voting_end,
        OwniaError::VotingNotActive
    );
    require!(!proposal.executed, OwniaError::ProposalAlreadyExecuted);

    let stake_account = &ctx.accounts.stake_account;
    let weight = stake_account.staked_amount;
    require!(weight > 0, OwniaError::InsufficientStake);

    // 투표 기록 생성 (PDA unique → 이중투표 자동 방지)
    let vote_record = &mut ctx.accounts.vote_record;
    vote_record.voter = ctx.accounts.voter.key();
    vote_record.proposal = ctx.accounts.proposal.key();
    vote_record.vote = vote;
    vote_record.weight = weight;
    vote_record.bump = ctx.bumps.vote_record;

    // 제안 투표 집계 업데이트
    let proposal = &mut ctx.accounts.proposal;
    if vote {
        proposal.votes_for = proposal
            .votes_for
            .checked_add(weight)
            .ok_or(OwniaError::MathOverflow)?;
    } else {
        proposal.votes_against = proposal
            .votes_against
            .checked_add(weight)
            .ok_or(OwniaError::MathOverflow)?;
    }

    msg!(
        "Vote cast on proposal #{}: {} (weight={})",
        proposal.proposal_id,
        if vote { "FOR" } else { "AGAINST" },
        weight
    );
    Ok(())
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        seeds = [STAKE_ACCOUNT_SEED, voter.key().as_ref()],
        bump = stake_account.bump,
        constraint = stake_account.owner == voter.key() @ OwniaError::Unauthorized,
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [PROPOSAL_SEED, &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump,
    )]
    pub proposal: Account<'info, Proposal>,

    /// VoteRecord PDA — init이므로 이미 투표했으면 자동 실패
    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [VOTE_RECORD_SEED, proposal.key().as_ref(), voter.key().as_ref()],
        bump,
    )]
    pub vote_record: Account<'info, VoteRecord>,

    pub system_program: Program<'info, System>,
}
