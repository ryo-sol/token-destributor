import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, TransactionSignature, VersionedTransaction } from '@solana/web3.js';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import { AnchorProvider, Program, Idl, BN} from '@project-serum/anchor';
import idl from "../idl/token_distributor.json";
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";

export const CreateVault: FC = () => {
    const [mintString, setMintString] = useState('');
    const [totalSupplyString, setTotalSupply] = useState('');
    const [claimSizeString, setClaimSize] = useState('');

    const [vaultString, setVaultString] = useState('');
    
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const anchorWallet = useAnchorWallet();
    const provider = new AnchorProvider(connection, anchorWallet, {});

    const programId = new PublicKey("TDP82b6Vad2W8zxQGfgQ7oDxM6XTpWCg6ncdRjC9Lvx");

    // const program = new Program<TokenDistributor>(IDL, programId, provider);
    const program = new Program(idl as Idl, programId, provider);

    const onClick = useCallback(async () => {
        if (!publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Send Transaction: Wallet not connected!`);
            return;
        }

        let signature: TransactionSignature = '';
        try {

            // Create instructions 
            const instructions : TransactionInstruction[] = [];
            
            const mint = new PublicKey(mintString);

            const [vault_pda, _bump] = findProgramAddressSync([Buffer.from("vault"), publicKey.toBytes(), mint.toBytes()], program.programId);
            setVaultString(vault_pda.toBase58());
            
            const ix = await program.methods.create(new BN(totalSupplyString), new BN(claimSizeString))
            .accounts({
            payer: publicKey,
            payerTokenAccount: getAssociatedTokenAddressSync(mint, publicKey),
            tokenMint: mint,
            vault: vault_pda,
            vaultTokenAccount: getAssociatedTokenAddressSync(mint, vault_pda, true),
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId
            })  
            .instruction();

            instructions.push(ix);
            

            // Get the lates block hash to use on our transaction and confirmation
            let latestBlockhash = await connection.getLatestBlockhash()

            // Create a new TransactionMessage with version and compile it to legacy
            const messageLegacy = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: latestBlockhash.blockhash,
                instructions,
            }).compileToLegacyMessage();

            // Create a new VersionedTransacction which supports legacy and v0
            const transation = new VersionedTransaction(messageLegacy)

            // Send transaction and await for signature
            signature = await sendTransaction(transation, connection);

            // Send transaction and await for signature
            await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed');

            console.log(signature);
            notify({ type: 'success', message: 'Transaction successful!', txid: signature });
        } catch (error: any) {
            notify({ type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature });
            console.log('error', `Transaction failed! ${error?.message}`, signature);
            return;
        }
    }, [publicKey, notify, connection, sendTransaction, mintString, totalSupplyString, claimSizeString]);

    return (
        <div className="flex flex-row justify-center">
            <div className="relative group items-center">
                <label >Token Mint:</label>
                <input className="text-black" type="text" id="mintInput" name="mintInput"
                 onChange={e => { setMintString(e.currentTarget.value); }}/>
                 <br></br>
                 <label >Total Supply*:</label>
                 <input className="text-black" type="text" id="supplyInput" name="supplyInput"
                  onChange={e => { setTotalSupply(e.currentTarget.value); }}/>
                  <br></br>
                 <label >Claim Size* (per user)</label>
                 <input className="text-black" type="text" id="claimInput" name="claimInput"
                  onChange={e => { setClaimSize(e.currentTarget.value); }}/>
                  <br></br>
                 <label >* not accounting for decimals (manually add zeros for each decimal of the token)</label>
                 <br></br>
                 <label >Note: ATA for token must exist and contain enough tokens to fund vault</label>
                 <br></br>
            </div>
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                
                    <button
                        className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                        onClick={onClick} disabled={!publicKey}
                    >
                        <div className="hidden group-disabled:block ">
                        Wallet not connected
                        </div>
                         <span className="block group-disabled:hidden" >
                            Create Vault
                        </span>
                    </button>
                   
             </div> 
                {vaultString &&
                <span >Your vault will be at: {vaultString}</span>
                }
        </div>
    );
};
