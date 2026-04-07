export const CODE_SAMPLES = {
  anchorBasic: `
#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let account = &mut ctx.accounts.my_account;
        account.data = data;
        account.authority = ctx.accounts.authority.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + MyAccount::INIT_SPACE
    )]
    pub my_account: Account<'info, MyAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
  `.trim(),

  pdaDerivation: `
let (pda, bump) = Pubkey::find_program_address(
    &[
        b"user-profile",
        authority.key().as_ref(),
    ],
    program_id,
);
  `.trim(),

  splTokenTransfer: `
// SPL Token transfer between token accounts
let cpi_accounts = Transfer {
    from: ctx.accounts.from.to_account_info(),
    to: ctx.accounts.to.to_account_info(),
    authority: ctx.accounts.authority.to_account_info(),
};
let cpi_program = ctx.accounts.token_program.to_account_info();
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
token::transfer(cpi_ctx, amount)?;
  `.trim(),

  cpiExample: `
let cpi_program = ctx.accounts.target_program.to_account_info();
let cpi_accounts = TargetInstruction {
    account: ctx.accounts.shared_account.to_account_info(),
    signer: ctx.accounts.signer.to_account_info(),
};
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
target_program::cpi::do_something(cpi_ctx, data)?;
  `.trim(),

  withSecurityIssue: `
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // missing signer check
    let vault = &mut ctx.accounts.vault;
    vault.balance -= amount;
    Ok(())
}
  `.trim(),
} as const;
