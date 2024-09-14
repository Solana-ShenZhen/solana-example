/// 1. create mint account
/// 2. mint to someone wallet (create wallet token account)
/// 3. wallet transfer token
/// 4. freeze token account, transfer suuccess or not

import {
  createFreezeAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  createThawAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, SystemProgram, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

export async function createMintIx(connection: Connection, mintAddress: PublicKey, owner: PublicKey, decimals: number) {
  const rent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  const createMintInstruction = SystemProgram.createAccount({
    fromPubkey: owner,
    newAccountPubkey: mintAddress,
    lamports: rent,
    space: MINT_SIZE,
    programId: TOKEN_PROGRAM_ID,
  });

  const initializeMintIx = createInitializeMint2Instruction(mintAddress, decimals, owner, owner);

  return [createMintInstruction, initializeMintIx];
}

export async function mintToTransaction(
  connection: Connection,
  mint: PublicKey,
  toPubkey: PublicKey,
  payer: Keypair,
  decimals: number,
) {
  const toPubkeyTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, toPubkey);

  const mintToIx = createMintToInstruction(
    mint,
    toPubkeyTokenAccount.address,
    payer.publicKey,
    100 * Math.pow(10, decimals),
  );

  const tx = new Transaction();
  tx.add(mintToIx);

  const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
}

export async function transferTokenTransaction(
  connection: Connection,
  mint: PublicKey,
  from: Keypair,
  to: PublicKey,
  amount: number,
  decimals: number,
) {
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, from, mint, from.publicKey);
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, from, mint, to);

  const transferIx = createTransferInstruction(
    fromTokenAccount.address,
    toTokenAccount.address,
    from.publicKey,
    amount * Math.pow(10, decimals),
  );

  const tx = new Transaction();
  tx.add(transferIx);
  const txSig = await sendAndConfirmTransaction(connection, tx, [from]);
  console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
}

export async function freezeTokenTransaction(
  connection: Connection,
  mint: PublicKey,
  freezePubkey: PublicKey,
  mintOwner: Keypair,
) {
  const freezeAccount = getAssociatedTokenAddressSync(mint, freezePubkey);
  const freezeIx = createFreezeAccountInstruction(freezeAccount, mint, mintOwner.publicKey);

  const tx = new Transaction();
  tx.add(freezeIx);
  const txSig = await sendAndConfirmTransaction(connection, tx, [mintOwner]);
  console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
}

export async function unfreezeTokenTransaction(
  connection: Connection,
  mint: PublicKey,
  unFreezePubkey: PublicKey,
  mintOwner: Keypair,
) {
  const unfreezeAccount = getAssociatedTokenAddressSync(mint, unFreezePubkey);
  const unfreezeIx = createThawAccountInstruction(unfreezeAccount, mint, mintOwner.publicKey);

  const tx = new Transaction();
  tx.add(unfreezeIx);
  const txSig = await sendAndConfirmTransaction(connection, tx, [mintOwner]);
  console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
}
