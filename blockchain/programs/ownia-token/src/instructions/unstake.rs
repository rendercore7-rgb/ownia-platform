use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::OwniaError;
use crate::state::{StakeAccount, StakePool};

/// 토큰 언스테이킹 — 잠금기간 후 스테이킹 토큰 회수 + 보상 수령
pub fn handle_unstake(ctx: Context<Unstake>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let stake_account = &ctx.accounts.stake_account;
    let pool = &ctx.accounts.stake_pool;

    // 잠금기간 확인
    let unlock_time = stake_account
        .stake_timestamp
        .checked_add(pool.lock_duration)
        .ok_or(OwniaError::MathOverflow)?;
    require!(now >= unlock_time, OwniaError::StillLocked);

    let staked_amount = stake_account.staked_amount;
    require!(staked_amount > 0, OwniaError::ZeroAmount);

    // 미수령 보상 계산
    let elapsed = (now - stake_account.last_claim_timestamp) as u64;
    let pending_rewards = staked_amount
        .checked_mul(pool.reward_rate_bps)
        .ok_or(OwniaError::MathOverflow)?
        .checked_mul(elapsed)
        .ok_or(OwniaError::MathOverflow)?
        .checked_div(10_000u64.checked_mul(SECONDS_PER_YEAR).ok_or(OwniaError::MathOverflow)?)
        .ok_or(OwniaError::MathOverflow)?;

    // StakePool PDA 서명
    let pool_bump = pool.bump;
    let seeds = &[STAKE_POOL_SEED, &[pool_bump]];
    let signer_seeds = &[&seeds[..]];

    // 스테이킹 토큰 반환
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.stake_pool.to_account_info(),
            },
            signer_seeds,
        ),
        staked_amount,
    )?;

    // 보상 전송 (보상이 있는 경우)
    if pending_rewards > 0 {
        let reward_balance = ctx.accounts.reward_vault.amount;
        let actual_rewards = pending_rewards.min(reward_balance);

        if actual_rewards > 0 {
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
                actual_rewards,
            )?;
        }
    }

    // 풀 상태 업데이트
    let pool = &mut ctx.accounts.stake_pool;
    pool.total_staked = pool
        .total_staked
        .checked_sub(staked_amount)
        .ok_or(OwniaError::MathOverflow)?;

    // 스테이크 계정 초기화 (close하면 rent SOL 반환)
    let stake_account = &mut ctx.accounts.stake_account;
    stake_account.staked_amount = 0;
    stake_account.last_claim_timestamp = now;

    msg!("Unstaked {} OWNIA + {} rewards", staked_amount, pending_rewards);
    Ok(())
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
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
        address = stake_pool.vault,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

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
