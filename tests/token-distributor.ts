import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TokenDistributor } from "../target/types/token_distributor";

describe("token-distributor", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TokenDistributor as Program<TokenDistributor>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
