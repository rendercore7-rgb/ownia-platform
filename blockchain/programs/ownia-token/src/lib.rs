use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("AXpCTxUDCfkGnQ8FZfmv82pihVmQvDpCE16cHA2UTT3t");

#[program]
pub mod ownia_token {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handle_initialize(ctx)
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        instructions::mint_tokens::handle_mint_tokens(ctx, amount)
    }

    pub fn create_vesting_schedule(
        ctx: Context<CreateVesting>,
        total_amount: u64,
        start_timestamp: i64,
        cliff_duration: i64,
        total_duration: i64,
        schedule_id: u8,
    ) -> Result<()> {
        instructions::create_vesting::handle_create_vesting(
            ctx, total_amount, start_timestamp, cliff_duration, total_duration, schedule_id,
        )
    }

    pub fn claim_vesting(ctx: Context<ClaimVesting>) -> Result<()> {
        instructions::claim_vesting::handle_claim_vesting(ctx)
    }

    pub fn initialize_stake_pool(
        ctx: Context<InitializeStakePool>,
        reward_rate_bps: u64,
        lock_duration: i64,
    ) -> Result<()> {
        instructions::initialize_stake_pool::handle_init_stake_pool(ctx, reward_rate_bps, lock_duration)
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        instructions::stake::handle_stake(ctx, amount)
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        instructions::unstake::handle_unstake(ctx)
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        instructions::claim_rewards::handle_claim_rewards(ctx)
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description_uri: String,
        voting_start: i64,
        voting_end: i64,
    ) -> Result<()> {
        instructions::create_proposal::handle_create_proposal(ctx, title, description_uri, voting_start, voting_end)
    }

    pub fn cast_vote(ctx: Context<CastVote>, vote: bool) -> Result<()> {
        instructions::cast_vote::handle_cast_vote(ctx, vote)
    }
}
