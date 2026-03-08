use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

use crate::constants::*;
use crate::errors::OwniaError;
use crate::state::{ProgramConfig, VestingSchedule};

/// 베스팅 스케줄 생성 — 관리자가 수혜자별 토큰 잠금 스케줄 설정
pub fn handle_create_vesting(
    ctx: Context<CreateVesting>,
    total_amount: u64,
    start_timestamp: i64,
    cliff_duration: i64,
    total_duration: i64,
    schedule_id: u8,
) -> Result<()> {
    require!(total_amount > 0, OwniaError::ZeroAmount);
    require!(
        cliff_duration >= 0 && total_duration > 0 && cliff_duration <= total_duration,
        OwniaError::InvalidVestingParams
    );

    // 공급량 확인 및 민팅
    let config = &mut ctx.accounts.config;
    let new_total = config
        .total_minted
        .checked_add(total_amount)
        .ok_or(OwniaError::MathOverflow)?;
    require!(new_total <= config.max_supply, OwniaError::SupplyExceeded);

    // 베스팅 볼트에 토큰 민팅
    let mint_seeds = &[MINT_AUTHORITY_SEED, &[ctx.bumps.mint_authority]];
    let signer_seeds = &[&mint_seeds[..]];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.vesting_vault.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            signer_seeds,
        ),
        total_amount,
    )?;

    config.total_minted = new_total;

    // 베스팅 스케줄 초기화
    let vesting = &mut ctx.accounts.vesting_schedule;
    vesting.beneficiary = ctx.accounts.beneficiary.key();
    vesting.mint = ctx.accounts.mint.key();
    vesting.vault = ctx.accounts.vesting_vault.key();
    vesting.total_amount = total_amount;
    vesting.claimed_amount = 0;
    vesting.start_timestamp = start_timestamp;
    vesting.cliff_duration = cliff_duration;
    vesting.total_duration = total_duration;
    vesting.schedule_id = schedule_id;
    vesting.revoked = false;
    vesting.bump = ctx.bumps.vesting_schedule;

    msg!(
        "Vesting created: {} tokens for {}, cliff={}s, duration={}s",
        total_amount,
        ctx.accounts.beneficiary.key(),
        cliff_duration,
        total_duration
    );
    Ok(())
}

#[derive(Accounts)]
#[instruction(total_amount: u64, start_timestamp: i64, cliff_duration: i64, total_duration: i64, schedule_id: u8)]
pub struct CreateVesting<'info> {
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

    /// 수혜자 (서명 불필요 — 관리자가 대신 생성)
    /// CHECK: 어떤 공개키든 수혜자로 지정 가능
    pub beneficiary: UncheckedAccount<'info>,

    /// 베스팅 스케줄 PDA
    #[account(
        init,
        payer = admin,
        space = 8 + VestingSchedule::INIT_SPACE,
        seeds = [VESTING_SEED, beneficiary.key().as_ref(), &[schedule_id]],
        bump,
    )]
    pub vesting_schedule: Account<'info, VestingSchedule>,

    /// 잠긴 토큰 보관 볼트
    #[account(
        init,
        payer = admin,
        token::mint = mint,
        token::authority = vesting_schedule,
        seeds = [VESTING_VAULT_SEED, vesting_schedule.key().as_ref()],
        bump,
    )]
    pub vesting_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
