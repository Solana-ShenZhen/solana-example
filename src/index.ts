import {
  ComputeBudgetInstruction,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { loadKeypair } from "./utils";
import bs58 from "bs58";
import {
  AuthorityType,
  createBurnInstruction,
  createCloseAccountInstruction,
  createMint,
  createSetAuthorityInstruction,
  createTransferInstruction,
  getAccount,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  createMintIx,
  freezeTokenTransaction,
  mintToTransaction,
  transferTokenTransaction,
  unfreezeTokenTransaction,
} from "./freeze-token-account";
import { generateMnemonic, mnemonicToKeypair } from "./keypair";
import { createJupiterApiClient } from "@jup-ag/api";
import { getQuoteFromJupiter, getSwapTransactionFromJupiter } from "./jupter";
import { createAndSendV0Transaction, rpcSimulateTransaction } from "./transaction";
import { JitoJsonRpcClient, sendTipsTransaction } from "./jito";
import {
  addAddressesToLookupTable,
  addLimitAddressesToLookupTable,
  compareTxSize,
  createLookupTable,
  getAddressesInTable,
  getLimitTransferLegacy,
  getLimitTransferV0WithLookupTable,
} from "./lookup-table";
import { getAccountSpace } from "./account";
import { decodeMintData, getGlobal, getMintData, getMintDiy } from "./buffer-layout";

async function main() {
  const endpoint = "https://api.mainnet-beta.solana.com";
  const connection = new Connection(endpoint, "confirmed");

  const wallet = loadKeypair("./payer.json");
  const owner = loadKeypair("~/.config/solana/id.json");
  // console.log(keypair.publicKey.toBase58());
  // console.log(owner.publicKey.toBase58());

  const jupApiUrl = "https://quote-api.jup.ag/v6";
  const jupiterApi = createJupiterApiClient({ basePath: jupApiUrl });

  const blockEngineUrl = "https://tokyo.mainnet.block-engine.jito.wtf";
  const jitoClient = new JitoJsonRpcClient(blockEngineUrl);

  // const mintAddress = new PublicKey("EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm");
  // const wifMint = await getMintDiy(connection, mintAddress);
  // console.log(JSON.stringify(wifMint, null, 2));

  const pumpGlobalAddress = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
  const pumpGlobal = await getGlobal(connection, pumpGlobalAddress);
  console.log(JSON.stringify(pumpGlobal, null, 2));
}

await main().catch(console.error);

// await createLookupTable(connection, wallet);
// const lookupTableAddress = new PublicKey("6aBWZLnEAnp1g7GnAz1KDb7vYFeBfggWJpw87EMBQnAw");
// await addAddressesToLookupTable(connection, wallet, lookupTableAddress);

// const addresses = await getAddressesInTable(connection, lookupTableAddress);
// console.log(JSON.stringify(addresses, null, 2));

// await addLimitAddressesToLookupTable(connection, wallet, lookupTableAddress);

// await compareTxSize(connection, lookupTableAddress, wallet);

// await getLimitTransferLegacy(connection, lookupTableAddress, wallet);

// await getLimitTransferV0WithLookupTable(connection, lookupTableAddress, wallet);

// const bundleId = "fc29d3e990c5a0fc2043b6c41d82809d52a212f45e1b11df248eae24f7ec793e";
// const response = await jitoClient.getBundleStatuses([[bundleId]]);
// console.log(JSON.stringify(response, null, 2));

// // send bundle
// // 1. create instruction
// const transferSolIx = SystemProgram.transfer({
//   fromPubkey: wallet.publicKey,
//   toPubkey: owner.publicKey,
//   lamports: 0.1 * LAMPORTS_PER_SOL,
// });

// // 2. create transaction
// const latestBlockhash = await connection.getLatestBlockhash();
// const tx = new Transaction();
// tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
// tx.recentBlockhash = latestBlockhash.blockhash;
// tx.add(transferSolIx);
// tx.sign(wallet);

// // 3. simulate transaction to bs58
// const txBs58 = bs58.encode(tx.serialize());
// console.log(txBs58);

// // 4. bs58 as parameter to sendBundle
// const sendTipsBs58 = await sendTipsTransaction(connection, wallet, 1000);

// const response = await jitoClient.sendBundle([[txBs58, sendTipsBs58]]);
// console.log(JSON.stringify(response, null, 2));

// const mainnetWallet = new PublicKey("GXL27Ww6mE73ggfyXfo3YVdjvu9R379yhiyh7fnK7ffS");
// const inputMint = NATIVE_MINT;
// const outputMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
// const amount = 0.01 * LAMPORTS_PER_SOL;

// // 1. get quote
// const quote = await getQuoteFromJupiter({
//   jupiterApi,
//   inputMint: inputMint.toBase58(),
//   outputMint: outputMint.toBase58(),
//   amount,
// });

// // 2. get swap transaction through quote result
// const swapTransaction = await getSwapTransactionFromJupiter(jupiterApi, mainnetWallet, quote);

// // 3. simulate transaction
// await rpcSimulateTransaction(connection, swapTransaction);

// const mnemonic = generateMnemonic();
// console.log(mnemonic);

// const keypair = mnemonicToKeypair(mnemonic);
// console.log(keypair.publicKey.toBase58());
// console.log(keypair.secretKey);
// console.log(bs58.encode(keypair.secretKey));

// const mint = new Keypair();
// const decimals = 9;
// const createMintIxs = await createMintIx(connection, mint.publicKey, wallet.publicKey, decimals);

// const tx = new Transaction();
// tx.add(...createMintIxs);

// const txSig = await sendAndConfirmTransaction(connection, tx, [wallet, mint]);
// console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

// await mintToTransaction(connection, mint.publicKey, owner.publicKey, wallet, decimals);
// await transferTokenTransaction(connection, mint.publicKey, owner, wallet.publicKey, 10, decimals);

// await freezeTokenTransaction(connection, mint.publicKey, owner.publicKey, wallet);
// await unfreezeTokenTransaction(connection, mint.publicKey, owner.publicKey, wallet);
// await transferTokenTransaction(connection, mint.publicKey, owner, wallet.publicKey, 10, decimals);

// const tokenAccountAddress = new PublicKey("Avrw9mQ4nhmetA7pr2RK1nudSBWYW2nAd1CaduKJiC1p");
//     const mintAccountAddress = new PublicKey("DE5W22V42vi1D7RYeXkG7MqCx3s86qqnqR1rjzVEwEay");

//     let response = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, { programId: TOKEN_PROGRAM_ID });
//     console.log(JSON.stringify(response, null, 2));

// const setAuthorityIx = createSetAuthorityInstruction(mintAccountAddress, owner.publicKey, AuthorityType.MintTokens, null);

// const tx = new Transaction();
// tx.add(setAuthorityIx);
// const txSig = await sendAndConfirmTransaction(connection, tx, [wallet, owner]);
// console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

// const burnIx = createBurnInstruction(tokenAccountAddress, mintAccountAddress, wallet.publicKey, 99 * Math.pow(10, 9));
// const closeAccountIx = createCloseAccountInstruction(tokenAccountAddress, owner.publicKey, wallet.publicKey);

// const tx = new Transaction();
// tx.add(burnIx, closeAccountIx);
// const txSig = await sendAndConfirmTransaction(connection, tx, [wallet]);
// console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

// const burnIx = createBurnInstruction(tokenAccountAddress, mintAccountAddress, wallet.publicKey, 1 * Math.pow(10, 9));

//     const tx = new Transaction();
//     tx.add(burnIx);
//     const txSig = await sendAndConfirmTransaction(connection, tx, [wallet]);
//     console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

// const tokenAccountAddress = new PublicKey("Avrw9mQ4nhmetA7pr2RK1nudSBWYW2nAd1CaduKJiC1p");
// const tokenAccount = await getAccount(connection, tokenAccountAddress);
// console.log(`tokenAccountAddress: ${tokenAccountAddress.toBase58()}`);
// console.log(`tokenAccount owner: ${tokenAccount.owner.toBase58()}`);
// console.log(`tokenAccount amount: ${tokenAccount.amount}`);

// const mintAddress = new PublicKey("8mAKLjGGmjKTnmcXeyr3pr7iX13xXVjJJiL6RujDbSPV");

// const mintAccount = await getMint(connection, mintAddress);
// console.log(`mintAddress: ${mintAddress.toBase58()}`);
// console.log(`mintAccount supply: ${mintAccount.supply}`);
// console.log(`mintAccount decimals: ${mintAccount.decimals}`);
// console.log(`mintAccount mintAuthority: ${mintAccount.mintAuthority ? mintAccount.mintAuthority.toBase58() : null}`);

// const space = 100; // 100 bytes
// const rent = await connection.getMinimumBalanceForRentExemption(space);
// console.log(`rent: ${rent / LAMPORTS_PER_SOL} SOL`);

// const memeprogramId = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
// // const newAccountPubkey = PublicKey.findProgramAddressSync([Buffer.from("example")], memeprogramId)[0];
// const newAccount = new Keypair();

// const createAccountIx = SystemProgram.createAccount({
//     fromPubkey: wallet.publicKey,
//     newAccountPubkey: newAccount.publicKey,
//     lamports: rent,
//     space,
//     programId: memeprogramId,
// });

// const tx = new Transaction();
// tx.add(createAccountIx);

// const txSig = await sendAndConfirmTransaction(connection, tx, [wallet, newAccount]);
// console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

// const bufferArray = [24, 30, 200, 40, 5, 28, 7, 119];
// const buf = Buffer.from(bufferArray);
// const hexBuffer = buf.toString('hex');

// const bufferArray = [24, 30, 200, 40, 5, 28, 7, 119];
// const buf = Buffer.from(bufferArray);
// const hexBuffer = buf.toString('hex');

// console.log(hexBuffer);

// const transferIx = SystemProgram.transfer({
//     fromPubkey: wallet.publicKey,
//     toPubkey: owner.publicKey,
//     lamports: 0.1 * LAMPORTS_PER_SOL,
// });

// const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
//     units: 100_000,
// });

// const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
//     microLamports: 10, // 1 mircroLamports = 10 ^ (-6) lamports
// });

// const tx = new Transaction();
// tx.add(transferIx, computeBudgetIx, computeUnitPriceIx);
// const txSig = await sendAndConfirmTransaction(connection, tx, [wallet]);
// console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

// const memoIx = new TransactionInstruction({
//     keys: [
//         { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
//     ],
//     programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
//     data: Buffer.from("Transfer 0.1 sol to owner", "utf-8"),
// });

// const tx = new Transaction();
// tx.add(transferIx, memoIx);
// const txSig = await sendAndConfirmTransaction(connection, tx, [wallet]);
// console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

// // transfer token
// // 1. mint account
// const mintAddress = await createMint(connection, wallet, wallet.publicKey, null, 9);
// console.log(`mintAddress: ${mintAddress.toBase58()}`);
// // 2. token account, wallet ata, initialize
// const walletTokenAccount = await getOrCreateAssociatedTokenAccount(connection, wallet, mintAddress, wallet.publicKey);
// console.log(`walletTokenAccount: ${walletTokenAccount.address.toBase58()}`);
// // 3. mint account mint token to token account
// const mintToSig = await mintTo(connection, wallet, mintAddress, walletTokenAccount.address, wallet.publicKey, 100 * Math.pow(10, 9));
// console.log(`https://explorer.solana.com/tx/${mintToSig}?cluster=devnet`);
// // 4. transfer wallet token to owner token account
// const ownerTokenAccount = await getOrCreateAssociatedTokenAccount(connection, owner, mintAddress, owner.publicKey);

// const tokenTransferIx = createTransferInstruction(walletTokenAccount.address, ownerTokenAccount.address, wallet.publicKey, 1 * Math.pow(10, 9));
// const tx = new Transaction();
// tx.add(tokenTransferIx);
// const txSig = await sendAndConfirmTransaction(connection, tx, [wallet]);
// console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);}

// 把 keypair or 私钥转化 base58
// console.log(keypair.secretKey.toString());
// console.log(bs58.encode(keypair.secretKey));

// const transferIx = SystemProgram.transfer({
//     fromPubkey: wallet.publicKey,
//     toPubkey: owner.publicKey,
//     lamports: 0.1 * LAMPORTS_PER_SOL,
// });

// const tx = new Transaction();
// tx.add(transferIx);

// const txSig = await sendAndConfirmTransaction(connection, tx, [wallet]);
// console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
