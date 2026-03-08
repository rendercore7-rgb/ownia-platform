use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::OwniaError;
use crate::state::{ProgramConfig, StakePool};

/// 스테이킹 풀 초기화 — 관리자가 보상률과 잠금기간 설정
pub fn handle_init_stake_pool(
    ctx: Context<InitializeStakePool>,
    reward_rate_bps: u64,
    lock_duration: i64,
) -> Result<()> {
    let pool = &mut ctx.accounts.stake_pool;
    pool.admin = ctx.accounts.admin.key();
    pool.mint = ctx.accounts.mint.key();
    pool.vault = ctx.accounts.pool_vault.key();
    pool.reward_vault = ctx.accounts.reward_vault.key();
    pool.reward_rate_bps = reward_rate_bps;
    pool.total_staked = 0;
    pool.lock_duration = lock_duration;
    pool.bump = ctx.bumps.stake_pool;

    msg!(
        "Stake pool initialized: rate={}bps, lock={}s",
        reward_rate_bps,
        lock_duration
    );
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeStakePool<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ OwniaError::Unauthorized,
        has_one = mint,
    )]
    pub config: Account<'info, ProgramConfig>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = admin,
        space = 8 + StakePool::INIT_SPACE,
        seeds = [STAKE_POOL_SEED],
        bump,
    )]
    pub stake_pool: Account<'info, StakePool>,

    /// 스테이킹된 토큰 보관 볼트
    #[account(
        init,
        payer = admin,
        token::mint = mint,
        token::authority = stake_pool,
        seeds = [POOL_VAULT_SEED],
        bump,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    /// 보상 토큰 보관 볼트
    #[account(
        init,
        payer = admin,
        token::mint = mint,
        token::authority = stake_pool,
        seeds = [REWARD_VAULT_SEED],
        bump,
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
