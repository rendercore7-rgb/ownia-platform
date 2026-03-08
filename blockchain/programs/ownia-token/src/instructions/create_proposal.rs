use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::OwniaError;
use crate::state::{ProgramConfig, Proposal, StakeAccount};

/// 거버넌스 제안 생성 — 최소 스테이킹 이상 보유자만 제안 가능
pub fn handle_create_proposal(
    ctx: Context<CreateProposal>,
    title: String,
    description_uri: String,
    voting_start: i64,
    voting_end: i64,
) -> Result<()> {
    require!(title.len() <= MAX_TITLE_LEN, OwniaError::InvalidVestingParams);
    require!(description_uri.len() <= MAX_URI_LEN, OwniaError::InvalidVestingParams);
    require!(voting_end > voting_start, OwniaError::VotingNotActive);

    let config = &ctx.accounts.config;
    let stake_account = &ctx.accounts.stake_account;

    require!(
        stake_account.staked_amount >= config.min_proposal_stake,
        OwniaError::InsufficientStake
    );

    // 제안 ID 할당
    let config = &mut ctx.accounts.config;
    let proposal_id = config.proposal_count;
    config.proposal_count = config
        .proposal_count
        .checked_add(1)
        .ok_or(OwniaError::MathOverflow)?;

    // 제안 초기화
    let proposal = &mut ctx.accounts.proposal;
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.proposal_id = proposal_id;
    proposal.title = title;
    proposal.description_uri = description_uri;
    proposal.voting_start = voting_start;
    proposal.voting_end = voting_end;
    proposal.votes_for = 0;
    proposal.votes_against = 0;
    proposal.executed = false;
    proposal.bump = ctx.bumps.proposal;

    msg!("Proposal #{} created: {}", proposal_id, proposal.title);
    Ok(())
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(
        seeds = [STAKE_ACCOUNT_SEED, proposer.key().as_ref()],
        bump = stake_account.bump,
        constraint = stake_account.owner == proposer.key() @ OwniaError::Unauthorized,
        constraint = stake_account.owner == proposer.key(),
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        init,
        payer = proposer,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [PROPOSAL_SEED, &config.proposal_count.to_le_bytes()],
        bump,
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}
