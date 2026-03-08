use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::OwniaError;
use crate::state::{StakeAccount, StakePool};

/// 토큰 스테이킹 — 사용자가 OWNIA 토큰을 풀에 스테이킹
pub fn handle_stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
    require!(amount > 0, OwniaError::ZeroAmount);

    let now = Clock::get()?.unix_timestamp;

    // 사용자 토큰을 풀 볼트로 전송
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    // 스테이크 계정 업데이트
    let stake_account = &mut ctx.accounts.stake_account;
    stake_account.owner = ctx.accounts.user.key();
    stake_account.pool = ctx.accounts.stake_pool.key();
    stake_account.staked_amount = stake_account
        .staked_amount
        .checked_add(amount)
        .ok_or(OwniaError::MathOverflow)?;
    stake_account.stake_timestamp = now;
    stake_account.last_claim_timestamp = now;
    stake_account.bump = ctx.bumps.stake_account;

    // 풀 총 스테이킹량 업데이트
    let pool = &mut ctx.accounts.stake_pool;
    pool.total_staked = pool
        .total_staked
        .checked_add(amount)
        .ok_or(OwniaError::MathOverflow)?;

    msg!("Staked {} OWNIA tokens", amount);
    Ok(())
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [STAKE_POOL_SEED],
        bump = stake_pool.bump,
    )]
    pub stake_pool: Account<'info, StakePool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [STAKE_ACCOUNT_SEED, user.key().as_ref()],
        bump,
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        address = stake_pool.vault,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = stake_pool.mint,
        token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
