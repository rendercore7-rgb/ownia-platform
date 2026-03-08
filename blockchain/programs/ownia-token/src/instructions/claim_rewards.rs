use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::OwniaError;
use crate::state::{StakeAccount, StakePool};

/// 스테이킹 보상 수령 — 스테이킹 유지하면서 보상만 수령
pub fn handle_claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let stake_account = &ctx.accounts.stake_account;
    let pool = &ctx.accounts.stake_pool;

    require!(stake_account.staked_amount > 0, OwniaError::ZeroAmount);

    // 보상 계산: staked * rate_bps * elapsed / (10000 * seconds_per_year)
    let elapsed = (now - stake_account.last_claim_timestamp) as u64;
    let pending_rewards = stake_account
        .staked_amount
        .checked_mul(pool.reward_rate_bps)
        .ok_or(OwniaError::MathOverflow)?
        .checked_mul(elapsed)
        .ok_or(OwniaError::MathOverflow)?
        .checked_div(10_000u64.checked_mul(SECONDS_PER_YEAR).ok_or(OwniaError::MathOverflow)?)
        .ok_or(OwniaError::MathOverflow)?;

    require!(pending_rewards > 0, OwniaError::NothingToClaim);

    // 보상 볼트 잔액 확인
    let reward_balance = ctx.accounts.reward_vault.amount;
    require!(
        reward_balance >= pending_rewards,
        OwniaError::InsufficientRewardBalance
    );

    // StakePool PDA 서명으로 보상 전송
    let pool_bump = pool.bump;
    let seeds = &[STAKE_POOL_SEED, &[pool_bump]];
    let signer_seeds = &[&seeds[..]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.reward_vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.stake_pool.to_account_info(),
            },
            signer_seeds,
        ),
        pending_rewards,
    )?;

    // 마지막 수령 시간 업데이트
    let stake_account = &mut ctx.accounts.stake_account;
    stake_account.last_claim_timestamp = now;

    msg!("Claimed {} OWNIA staking rewards", pending_rewards);
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [STAKE_POOL_SEED],
        bump = stake_pool.bump,
    )]
    pub stake_pool: Account<'info, StakePool>,

    #[account(
        mut,
        seeds = [STAKE_ACCOUNT_SEED, user.key().as_ref()],
        bump = stake_account.bump,
        constraint = stake_account.owner == user.key() @ OwniaError::Unauthorized,
        constraint = stake_account.owner == user.key(),
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        address = stake_pool.reward_vault,
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = stake_pool.mint,
        token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
