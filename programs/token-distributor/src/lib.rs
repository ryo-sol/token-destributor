use anchor_lang::prelude::*;
use anchor_spl::token::*;


declare_id!("TDP82b6Vad2W8zxQGfgQ7oDxM6XTpWCg6ncdRjC9Lvx");

#[program]
pub mod token_distributor {
    use super::*;

    pub fn create(ctx: Context<CreateAccounts>) -> Result<()> {
        Ok(())
    }

    pub fn claim(ctx: Context<ClaimAccounts>) -> Result<()> {
        //ctx.accounts.user_token_account.to_account_info().try_borrow_data().unwrap().
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateAccounts<'info> {
    pub token_mint: Account<'info, Mint>,
    #[account(mut, token::mint = token_mint, token::authority = payer)]
    pub payer_token_account: Account<'info, TokenAccount>,

    #[account(init, space = VAULT_ACCOUNT_SIZE, payer = payer,  seeds = [b"vault", payer.key().as_ref(), token_mint.key().as_ref()], bump)] 
    pub vault: Account<'info, VaultAccount>,
    
    #[account(init_if_needed, payer = payer, token::mint = token_mint, token::authority = vault)]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,

}

#[derive(Accounts)]
pub struct ClaimAccounts<'info> {
    pub token_mint: Account<'info, Mint>,
    #[account(mut, token::mint = token_mint, token::authority = user)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(init, space = CLAIMED_ACCOUNT_SIZE, payer = user, seeds = [b"claimed", user.key().as_ref(), vault.key().as_ref()], bump)] // to prevent double claim we create this account
    pub user_claimed: Account<'info, ClaimedAccount>,
    
    #[account(mut)] 
    pub vault: Account<'info, VaultAccount>,
    
    #[account(mut, token::mint = token_mint, token::authority = vault)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

static VAULT_ACCOUNT_SIZE : usize = 8+8+32+32;

#[account]
#[derive(Default)]
pub struct VaultAccount{
    claim_size: u64,
    mint: Pubkey,
    authority: Pubkey
}

static CLAIMED_ACCOUNT_SIZE : usize = 8+1+32+32;

#[account]
#[derive(Default)]
pub struct ClaimedAccount{
    claimed: bool,
    user: Pubkey,
    vault: Pubkey,
}