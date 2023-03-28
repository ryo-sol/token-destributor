import * as anchor from "@project-serum/anchor";
import { Program, splitArgsAndCtx } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TokenDistributor } from "./token_distributor"

describe("token-distributor", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TokenDistributor as Program<TokenDistributor>;

  const mint = new PublicKey("TTgkUvnGYwNcqpQXy256NUkbsXxMftxoGhA2D2kBBEh");
  const payer = anchor.getProvider().publicKey;

  it("Is created!", async () => {

    const [vault_pda, _bump] = findProgramAddressSync([Buffer.from("vault"), payer.toBytes(), mint.toBytes()], program.programId);
    
    const tx = await program.methods.create(new anchor.BN(100), new anchor.BN(10))
    .accounts({
      payer: payer,
      payerTokenAccount: getAssociatedTokenAddressSync(mint, payer),
      tokenMint: mint,
      vault: vault_pda,
      vaultTokenAccount: getAssociatedTokenAddressSync(mint, vault_pda, true),
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId
    })  
    .signers([])
    .rpc();
    console.log("Your transaction signature", tx);
  });
});
