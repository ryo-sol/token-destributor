use anchor_lang::prelude::*;
use anchor_spl::token::*;
use anchor_spl::associated_token::AssociatedToken;

declare_id!("TDP82b6Vad2W8zxQGfgQ7oDxM6XTpWCg6ncdRjC9Lvx");

#[program]
pub mod token_distributor {
    use super::*;

    pub fn create(
        ctx: Context<CreateAccounts>,
        initial_supply: u64,
        claim_size: u64,
    ) -> Result<()> {

        // initialize token account 
        // we need to do this manally because we need to provide the signature from the pda
        anchor_spl::associated_token::create(CpiContext::new_with_signer(
            ctx.accounts.associated_token_program.to_account_info(),
            anchor_spl::associated_token::Create {
                payer: ctx.accounts.payer.to_account_info(),
                associated_token: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info()
              },
              &[&[
                    "vault".as_bytes(),
                    ctx.accounts.payer.key().as_ref(),
                    ctx.accounts.token_mint.key().as_ref(),
                    &[*ctx.bumps.get("vault").unwrap()],
                ]]))?;
                
                
        // setup vault account
        ctx.accounts.vault.claim_size = claim_size;
        ctx.accounts.vault.mint = ctx.accounts.token_mint.key();
        ctx.accounts.vault.authority = ctx.accounts.payer.key();
        ctx.accounts.vault.bump = *ctx.bumps.get("vault").unwrap();


        // transfer initial supply
        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer_token_account.to_account_info(),
                    to: ctx.accounts.vault_token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            initial_supply,
        )?;

        msg!("Vault {} successfully created!", ctx.accounts.vault.key());
        Ok(())
    }

    pub fn claim(ctx: Context<ClaimAccounts>) -> Result<()> {
        
        msg!("My bump is {} ", ctx.accounts.vault.bump);
        msg!("My key is {} ", ctx.accounts.vault.authority.key());
        msg!("My vault is {} ", ctx.accounts.vault.authority);


        // transfer claim to user account
        let mut amount = ctx.accounts.vault.claim_size;
        // todo: amount = min(claim_size, available_tokens)
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                &[&[
                    "vault".as_bytes(),
                    ctx.accounts.vault.authority.key().as_ref(),
                    ctx.accounts.vault.mint.key().as_ref(),
                    &[ctx.accounts.vault.bump],
                ]],
            ),
            amount,
        )?;

        // store data in claimed account
        // note: we don't really need to do this, it's sufficient to just create the account
        // but I want to write something in there just for fun (and debug purposes)
        let claimed_account = &mut ctx.accounts.user_claimed;
        claimed_account.claimed = true;
        claimed_account.user = ctx.accounts.user.key();
        claimed_account.vault = ctx.accounts.vault.key();

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

    /// CHECK: This is safe because the instruction will fail if the account is already initialized
    /// I wouldn't know how else to do this, init doesn't work becuase I need to provide signer seeds
    #[account(mut)]
    pub vault_token_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimAccounts<'info> {
    pub token_mint: Account<'info, Mint>,
    #[account(mut, token::mint = token_mint, token::authority = user)] 
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(init, space = CLAIMED_ACCOUNT_SIZE, payer = user, seeds = [b"claimed", user.key().as_ref(), vault.key().as_ref()], bump)]
    // to prevent double claim we create this account
    pub user_claimed: Account<'info, ClaimedAccount>,

    #[account(mut, seeds = [b"vault", vault.authority.key().as_ref(), token_mint.key().as_ref()], bump = vault.bump)]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut, token::mint = token_mint, token::authority = vault)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    //pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

static VAULT_ACCOUNT_SIZE: usize = 8 + 8 + 32 + 32 + 1;

#[account]
#[derive(Default)]
pub struct VaultAccount {
    claim_size: u64,
    mint: Pubkey,
    authority: Pubkey,
    bump: u8
}

static CLAIMED_ACCOUNT_SIZE: usize = 8 + 1 + 32 + 32;

#[account]
#[derive(Default)]
pub struct ClaimedAccount {
    claimed: bool,
    user: Pubkey,
    vault: Pubkey,
}
