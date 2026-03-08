use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::constants::*;
use crate::state::ProgramConfig;

/// 프로그램 초기화 — 토큰 민트 생성 + ProgramConfig PDA
/// 메타데이터(이름/심볼/URI)는 배포 후 별도 트랜잭션으로 생성
pub fn handle_initialize(ctx: Context<Initialize>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.mint = ctx.accounts.mint.key();
    config.max_supply = MAX_SUPPLY;
    config.total_minted = 0;
    config.min_proposal_stake = DEFAULT_MIN_PROPOSAL_STAKE;
    config.proposal_count = 0;
    config.bump = ctx.bumps.config;

    msg!("OWNIA Token initialized: mint={}", ctx.accounts.mint.key());
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// 관리자 (배포자)
    #[account(mut)]
    pub admin: Signer<'info>,

    /// ProgramConfig PDA
    #[account(
        init,
        payer = admin,
        space = 8 + ProgramConfig::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, ProgramConfig>,

    /// OWNIA 토큰 민트 (mint authority = PDA)
    #[account(
        init,
        payer = admin,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority,
    )]
    pub mint: Account<'info, Mint>,

    /// Mint authority PDA (CPI 서명용)
    /// CHECK: PDA seeds로 검증됨
    #[account(
        seeds = [MINT_AUTHORITY_SEED],
        bump,
    )]
    pub mint_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
