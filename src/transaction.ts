import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  TransactionMessage,
  VersionedTransaction,
  type AddressLookupTableAccount,
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
