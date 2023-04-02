import * as anchor from "@project-serum/anchor";
import { Program, splitArgsAndCtx } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccount, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { TokenDistributor } from "./token_distributor"

describe("token-distributor", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TokenDistributor as Program<TokenDistributor>;

  const mint = new PublicKey("TTgkUvnGYwNcqpQXy256NUkbsXxMftxoGhA2D2kBBEh");
  const payer = anchor.getProvider().publicKey;

  const [vault_pda, _bump] = findProgramAddressSync([Buffer.from("vault"), payer.toBytes(), mint.toBytes()], program.programId);

  it("Is created!", async () => {

    
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

  
  it("Is claimed!", async () => {

    const claimer = new Keypair();

    const transferInstr = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: claimer.publicKey,
      lamports: 0.11*LAMPORTS_PER_SOL
    });
    const transaction = new Transaction();
    transaction.add(transferInstr);
    const signature = await anchor.getProvider().sendAndConfirm(transaction);
    console.log("funded wallet", claimer.publicKey.toBase58(), signature);

    await new Promise(_ => setTimeout(_, 1000))

    const [claimed_pda, _bump] = findProgramAddressSync([Buffer.from("claimed"), claimer.publicKey.toBytes(), vault_pda.toBytes()], program.programId);
    const ata = await getOrCreateAssociatedTokenAccount(anchor.getProvider().connection, claimer, mint, claimer.publicKey);

    await new Promise(_ => setTimeout(_, 1000))
    
    const tx = await program.methods.claim()
    .accounts({
      user: claimer.publicKey,
      tokenMint: mint,
      vault: vault_pda,
      vaultTokenAccount: getAssociatedTokenAddressSync(mint, vault_pda, true),
      userClaimed: claimed_pda,
      userTokenAccount: ata.address,//getAssociatedTokenAddressSync(mint, claimer.publicKey),
      tokenProgram: TOKEN_PROGRAM_ID,
      // associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId
    })  
    .signers([claimer])
    .rpc();
    console.log("Your transaction signature", tx);
  });
  
});
