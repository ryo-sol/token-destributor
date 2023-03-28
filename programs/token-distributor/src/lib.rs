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
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateAccounts<'info> {
    pub token_mint: Account<'info, Mint>,
    #[account(mut, token::mint = token_mint, token::authority = payer)]
    pub payer_token_account: Account<'info, TokenAccount>,

    #[account(mut, seeds = [b"vault", payer.key().as_ref(), token_mint.key().as_ref()], bump)] 
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

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}


#[account]
#[derive(Default)]
pub struct VaultAccount{
    data: u64,
    mint: Pubkey
}