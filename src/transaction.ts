import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  TransactionMessage,
  VersionedTransaction,
  type AddressLookupTableAccount,
  type Commitment,
  type Connection,
  type SignatureStatus,
  type TransactionConfirmationStatus,
  type TransactionInstruction,
  type TransactionSignature,
} from "@solana/web3.js";
import { sleep } from "bun";

export async function rpcSimulateTransaction(connection: Connection, testTransaction: VersionedTransaction) {
  const rpcResponse = await connection.simulateTransaction(testTransaction, {
    replaceRecentBlockhash: true,
    commitment: "confirmed", // default is confirmed, it will error due to slow of process
    sigVerify: false,
  });

  console.log(`rpcResponse: ${JSON.stringify(rpcResponse, null, 2)}`);

  return rpcResponse.value.unitsConsumed || null;
}

export async function createAndSendV0Transaction(
  connection: Connection,
  payer: Keypair,
  instructions: TransactionInstruction[],
) {
  const latestBlockhash = await connection.getLatestBlockhash("finalized");

  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToV0Message();
  const transactionV0 = new VersionedTransaction(messageV0);

  transactionV0.sign([payer]);

  const sig = await connection.sendTransaction(transactionV0);

  const confirmation = await confirmTransaction(connection, sig);
  if (confirmation.err) {
    throw new Error("Transaction not confirmed.");
  }
  console.log("🎉 Transaction succesfully confirmed!", "\n", `https://explorer.solana.com/tx/${sig}?cluster=devnet`);
}

export async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  desiredConfirmationStatus: TransactionConfirmationStatus = "confirmed",
  timeout: number = 30_000,
  pollInterval: number = 1_000,
  searchTransactionHistory: boolean = false,
): Promise<SignatureStatus> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const { value: statuses } = await connection.getSignatureStatuses([signature], { searchTransactionHistory });

    if (!statuses || statuses.length === 0) {
      throw new Error("Failed to get signature status");
    }

    const status = statuses[0];

    if (status === null) {
      await sleep(pollInterval);
      continue;
    }

    if (status.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    }

    if (status.confirmationStatus && status.confirmationStatus === desiredConfirmationStatus) {
      return status;
    }

    if (status.confirmationStatus === "finalized") {
      return status;
    }

    await sleep(pollInterval);
  }

  throw new Error(`Transaction confirmation timeout after ${timeout}ms`);
}

export async function isBlockhashExpired(
  connection: Connection,
  lastValidBlockHeight: number,
  commitment: Commitment,
): Promise<boolean> {
  const currentBlockHeight = await connection.getBlockHeight(commitment);
  const blockHeightDifference = currentBlockHeight - lastValidBlockHeight;

  console.log("Block Height Information:");
  console.log("--------------------------------------------");
  console.log(`Current Block Height:        ${currentBlockHeight}`);
  console.log(`Last Valid Block Height:     ${lastValidBlockHeight}`);
  console.log(`Difference:                  ${blockHeightDifference}`);
  console.log("--------------------------------------------");

  return blockHeightDifference > 0;
}

export async function checkTxOnChainAndIsDropped(
  connection: Connection,
  txSignature: TransactionSignature,
  lastValidBlockHeight: number,
  commitment: Commitment,
): Promise<{ success: boolean; message: string }> {
  const startTime = Date.now();

  while (true) {
    const { value: status } = await connection.getSignatureStatus(txSignature);

    if (status) {
      if (status.err) {
        return { success: false, message: `Transaction failed: ${JSON.stringify(status.err)}` };
      }

      if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
        const elapsedTime = (Date.now() - startTime) / 1000;
        console.log(`Transaction Success. Elapsed time: ${elapsedTime.toFixed(2)} seconds.`);
        console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
        return { success: true, message: "Transaction confirmed" };
      }
    }

    const hashExpired = await isBlockhashExpired(connection, lastValidBlockHeight, commitment);

    if (hashExpired) {
      const elapsedTime = (Date.now() - startTime) / 1000;
      console.log(`Blockhash has expired. Elapsed time: ${elapsedTime.toFixed(2)} seconds.`);
      return { success: false, message: "Blockhash has expired" };
    }

    await new Promise(resolve => setTimeout(resolve, 2500)); // Sleep for 2.5 seconds
  }
}
