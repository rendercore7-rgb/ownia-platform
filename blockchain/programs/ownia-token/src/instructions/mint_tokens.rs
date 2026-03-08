use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

use crate::constants::*;
use crate::errors::OwniaError;
use crate::state::ProgramConfig;

/// 관리자 토큰 발행 — 지정 주소에 OWNIA 토큰 민팅
pub fn handle_mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
    require!(amount > 0, OwniaError::ZeroAmount);

    let config = &mut ctx.accounts.config;
    let new_total = config
        .total_minted
        .checked_add(amount)
        .ok_or(OwniaError::MathOverflow)?;
    require!(new_total <= config.max_supply, OwniaError::SupplyExceeded);

    // PDA 서명으로 mint_to CPI
    let seeds = &[MINT_AUTHORITY_SEED, &[ctx.bumps.mint_authority]];
    let signer_seeds = &[&seeds[..]];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    // 상태 업데이트
    config.total_minted = new_total;

    msg!("Minted {} OWNIA tokens to {}", amount, ctx.accounts.destination.key());
    Ok(())
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    /// 관리자만 민팅 가능
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ OwniaError::Unauthorized,
        has_one = mint,
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    /// CHECK: PDA로 검증됨
    #[account(
        seeds = [MINT_AUTHORITY_SEED],
        bump,
    )]
    pub mint_authority: UncheckedAccount<'info>,

    /// 토큰을 받을 대상 토큰 계정
    #[account(
        mut,
        token::mint = mint,
    )]
    pub destination: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
