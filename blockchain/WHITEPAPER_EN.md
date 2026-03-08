# OWNIA Whitepaper

---

## 1. Abstract

OWNIA is an urban social platform that combines **data sovereignty + AI-powered 3D generation + city exploration economy**. It guarantees ownership of user-generated data, enables digital asset creation through AI-powered text-to-3D object generation, and provides economic rewards for city exploration activities.

The OWNIA token serves as the economic backbone of this ecosystem, built as an SPL token on the Solana blockchain.

---

## 2. Vision

> *"Data Sovereignty + AI Magic + Navigation Economy"*

| Core Pillar | Description |
|-------------|-------------|
| **Data Sovereignty** | Users' right to own and trade their own data |
| **AI Magic** | Text-to-3D object generation, AI-powered content creation |
| **Navigation Economy** | Token reward system for city exploration and discovery |

At the intersection of 2026's defining trends — **AI + Blockchain + Metaverse** — OWNIA envisions a platform where users are not mere consumers but **owners and creators of their data**.

---

## 3. Problem Statement

1. **Data Exploitation**: Big tech collects user data for free and monetizes it without compensation
2. **Creation Barriers**: 3D content production requires specialized skills and expensive tools
3. **Disconnected Urban Experience**: Offline activities remain unlinked to the digital economy
4. **Opaque Rewards**: Creator reward systems lack transparency and are centralized

---

## 4. Solution

### 4.1 Data Ownership Layer
- On-chain proof of ownership for user-generated data
- Direct compensation to creators upon data transactions
- Balance between privacy protection and transparency

### 4.2 Text-to-3D AI Engine
- Automatic 3D object generation from text prompts
- NFT minting and trading of generated 3D assets
- OWNIA token payments for AI service usage

### 4.3 City Exploration Economy (Navigation Economy)
- Token rewards for real-world city exploration activities
- Reward system connected to local businesses
- Community-driven city information crowdsourcing

---

## 5. Tokenomics

### 5.1 Specifications

| Item | Value |
|------|-------|
| Token Name | OWNIA |
| Symbol | OWNIA |
| Blockchain | Solana |
| Token Standard | SPL Token |
| Decimals | 9 |
| Total Supply | 1,000,000,000 (1 Billion) |
| Program ID | `AXpCTxUDCfkGnQ8FZfmv82pihVmQvDpCE16cHA2UTT3t` |

### 5.2 Token Allocation

```
Community (30%)        ████████████████████████████████  300,000,000
Staking Rewards (15%)  ████████████████                  150,000,000
Team (15%)             ████████████████                  150,000,000
Development (15%)      ████████████████                  150,000,000
Investors (10%)        ██████████                        100,000,000
Advisors (3%)          ████                               30,000,000
Liquidity (7%)         ████████                           70,000,000
Data Sovereignty (5%)  ██████                             50,000,000
```

### 5.3 Allocation Details

| Category | Share | Amount | Purpose | Lock-up |
|----------|-------|--------|---------|---------|
| **Community** | 30% | 300M | Airdrops, user rewards, ecosystem growth | Phased distribution |
| **Staking Rewards** | 15% | 150M | Staking reward pool | On-chain locked |
| **Team** | 15% | 150M | Team incentives | 12-month cliff + 36-month linear vesting |
| **Development** | 15% | 150M | Tech development, infrastructure, security audits | Phased usage |
| **Investors** | 10% | 100M | Early investor allocation | 6-month cliff + 24-month linear vesting |
| **Advisors** | 3% | 30M | Advisory board compensation | 6-month cliff + 24-month linear vesting |
| **Liquidity** | 7% | 70M | DEX liquidity provision (Raydium, etc.) | Unlocked at TGE |
| **Data Sovereignty** | 5% | 50M | Data sovereignty rewards, 3D creation incentives | Usage-based |

### 5.4 Token Utility

| Use Case | Description |
|----------|-------------|
| **AI Service Payments** | Text-to-3D generation, AI analytics service fees |
| **Data Trading** | Payment medium for user data buying/selling |
| **Staking** | 10% annual rewards through token staking |
| **Governance** | Proposal creation and voting with 10,000+ OWNIA staked |
| **Creator Rewards** | Direct compensation to 3D content creators |
| **Exploration Rewards** | Token payouts for completing exploration missions |

---

## 6. Technical Architecture

### 6.1 Why Solana?

| Feature | Solana | Ethereum | Benefit for OWNIA |
|---------|--------|----------|-------------------|
| TPS | ~65,000 | ~15 | Real-time reward processing |
| Fees | ~$0.00025 | ~$1-50 | Enables micro-transactions |
| Finality | ~400ms | ~12s | Instant user experience |
| NFT Ecosystem | Strong | Strong | 3D asset NFT minting |

### 6.2 Smart Contract Architecture

Built on the Anchor framework with 10 on-chain instructions:

```
ownia-token (Anchor Program)
├── initialize            — Token mint + program configuration setup
├── mint_tokens           — Admin-only token minting (supply cap enforced)
├── create_vesting        — Vesting schedule creation + token lockup
├── claim_vesting         — Linear unlock claiming after cliff period
├── initialize_stake_pool — Staking pool creation
├── stake                 — Token deposit (additional staking supported)
├── unstake               — Token + reward withdrawal after lock period
├── claim_rewards         — Staking reward claiming
├── create_proposal       — Governance proposal creation (min 10,000 OWNIA)
└── cast_vote             — Stake-weighted voting (double-vote prevention)
```

### 6.3 On-Chain Account Structure

| Account | PDA Seed | Role |
|---------|----------|------|
| `ProgramConfig` | `["config"]` | Global settings, admin, mint address, total minted |
| `VestingSchedule` | `["vesting", beneficiary, id]` | Per-beneficiary vesting information |
| `StakePool` | `["stake_pool"]` | Pool settings, reward rate, total staked |
| `StakeAccount` | `["stake", user]` | Per-user staking information |
| `Proposal` | `["proposal", id]` | Governance proposal content and vote tally |
| `VoteRecord` | `["vote", proposal, voter]` | Double-vote prevention record |

### 6.4 Reward Calculation Formula

```
Annual Reward = staked_amount × reward_rate_bps / 10,000

Real-time Reward = staked_amount × reward_rate_bps × elapsed_seconds
                   ÷ (10,000 × 31,536,000)
```

Default reward rate: **1,000 BPS (10% per annum)**

---

## 7. Governance

| Item | Configuration |
|------|---------------|
| Proposal Eligibility | 10,000+ OWNIA staked |
| Voting Weight | Proportional to staked OWNIA amount |
| Double Voting | Prevented at protocol level via PDA |
| Proposal Structure | Title (64 chars) + Description URI (200 chars) + Voting period |

Matters the community can decide through governance:
- Reward rate adjustments
- New feature introductions
- Partnership approvals
- Ecosystem fund allocation

---

## 8. Roadmap

| Phase | Timeline | Objectives |
|-------|----------|------------|
| **Phase 1 — Foundation** | 2026 Q1 | Token development, smart contracts, Devnet deployment |
| **Phase 2 — Launch** | 2026 Q2 | Mainnet deployment, DEX listing, initial airdrop |
| **Phase 3 — AI Integration** | 2026 Q3 | Text-to-3D engine integration, data trading marketplace |
| **Phase 4 — City Economy** | 2026 Q4 | City exploration rewards, local business partnerships |
| **Phase 5 — Expansion** | 2027 Q1+ | Multi-chain bridge, global city expansion |

---

## 9. Security

- **Anchor Framework**: Automatic account validation and constraint checking
- **PDA-Based Authority**: Program-derived signatures eliminate centralized key risks
- **Hard-Coded Supply Cap**: Minting beyond 1 billion tokens is impossible
- **Admin Privilege Separation**: Minting and vesting restricted to admin only
- **Double Execution Prevention**: PDA initialization blocks duplicate transactions
- **Overflow Protection**: Checked math applied throughout
- **Future Plans**: Third-party security audit prior to Mainnet deployment

---

## 10. Current Development Status

| Item | Status |
|------|--------|
| Smart Contract | Complete (492KB .so) |
| Tests | **11/11 Passing** |
| IDL Generation | Complete (32KB) |
| TypeScript Types | Complete (32KB) |
| Devnet Deployment | Pending |
| Mainnet Deployment | Scheduled for Phase 2 |
| Security Audit | Scheduled for Phase 2 |

---

## 11. Team & Contact

- **Project**: OWNIA — Urban Social Platform
- **Website**: https://owniacity.com
- **Token Metadata**: https://owniacity.com/token-metadata.json

---

*This whitepaper is subject to updates as the project progresses.*
