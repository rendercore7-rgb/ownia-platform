use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::OwniaError;
use crate::state::VestingSchedule;

/// 베스팅 토큰 수령 — 선형 언락 공식으로 해제된 토큰 수령
pub fn handle_claim_vesting(ctx: Context<ClaimVesting>) -> Result<()> {
    let vesting = &ctx.accounts.vesting_schedule;
    let now = Clock::get()?.unix_timestamp;

    // Cliff 확인
    let cliff_end = vesting
        .start_timestamp
        .checked_add(vesting.cliff_duration)
        .ok_or(OwniaError::MathOverflow)?;
    require!(now >= cliff_end, OwniaError::CliffNotReached);

    // 베스팅된(해제된) 금액 계산
    let vesting_end = vesting
        .start_timestamp
        .checked_add(vesting.total_duration)
        .ok_or(OwniaError::MathOverflow)?;

    let vested_amount = if now >= vesting_end {
        vesting.total_amount
    } else {
        let elapsed = (now - vesting.start_timestamp) as u64;
        let duration = vesting.total_duration as u64;
        vesting
            .total_amount
            .checked_mul(elapsed)
            .ok_or(OwniaError::MathOverflow)?
            .checked_div(duration)
            .ok_or(OwniaError::MathOverflow)?
    };

    let claimable = vested_amount
        .checked_sub(vesting.claimed_amount)
        .ok_or(OwniaError::MathOverflow)?;
    require!(claimable > 0, OwniaError::NothingToClaim);

    // 베스팅 PDA 서명으로 토큰 전송
    let beneficiary_key = ctx.accounts.beneficiary.key();
    let schedule_id = vesting.schedule_id;
    let bump = vesting.bump;
    let seeds = &[
        VESTING_SEED,
        beneficiary_key.as_ref(),
        &[schedule_id],
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.beneficiary_token_account.to_account_info(),
                authority: ctx.accounts.vesting_schedule.to_account_info(),
            },
            signer_seeds,
        ),
        claimable,
    )?;

    // 상태 업데이트
    let vesting = &mut ctx.accounts.vesting_schedule;
    vesting.claimed_amount = vesting
        .claimed_amount
        .checked_add(claimable)
        .ok_or(OwniaError::MathOverflow)?;

    msg!("Claimed {} vested OWNIA tokens", claimable);
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimVesting<'info> {
    /// 수혜자 본인만 수령 가능
    #[account(mut)]
    pub beneficiary: Signer<'info>,

    #[account(
        mut,
        seeds = [VESTING_SEED, beneficiary.key().as_ref(), &[vesting_schedule.schedule_id]],
        bump = vesting_schedule.bump,
        has_one = beneficiary,
        has_one = vault,
    )]
    pub vesting_schedule: Account<'info, VestingSchedule>,

    /// has_one 검증에서 사용: vesting_schedule.vault == vault
    #[account(
        mut,
        token::authority = vesting_schedule,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// 수혜자의 OWNIA 토큰 계정
    #[account(
        mut,
        token::mint = vesting_schedule.mint,
        token::authority = beneficiary,
    )]
    pub beneficiary_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
