import {
  AddressLookupTableProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  type Connection,
} from "@solana/web3.js";
import { confirmTransaction, createAndSendV0Transaction } from "./transaction";

// 6aBWZLnEAnp1g7GnAz1KDb7vYFeBfggWJpw87EMBQnAw
// 56 -> 5 addresses -> 216 bytes
// 5 * 32 = 160 bytes
export async function createLookupTable(connection: Connection, payer: Keypair) {
  const [lookupTableInstruction, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
    authority: payer.publicKey,
    payer: payer.publicKey,
    recentSlot: await connection.getSlot(),
  });

  console.log(`Lookup table address: ${lookupTableAddress.toBase58()}`);

  await createAndSendV0Transaction(connection, payer, [lookupTableInstruction]);
}

export async function addAddressesToLookupTable(connection: Connection, payer: Keypair, lookupTableAddress: PublicKey) {
  const keysNum = 5;
  const addresses: PublicKey[] = [];
  for (let i = 0; i < keysNum; i++) {
    addresses.push(Keypair.generate().publicKey);
  }

  const addAddressesToLookupTableInstruction = AddressLookupTableProgram.extendLookupTable({
    lookupTable: lookupTableAddress,
    authority: payer.publicKey,
    payer: payer.publicKey,
    addresses,
  });

  await createAndSendV0Transaction(connection, payer, [addAddressesToLookupTableInstruction]);
}

export async function getTableValue(connection: Connection, lookupTableAddress: PublicKey) {
  const lookupTableAccount = await connection.getAddressLookupTable(lookupTableAddress);

  if (!lookupTableAccount.value) {
    throw new Error("Lookup table not found");
  }

  return lookupTableAccount.value;
}

export async function getAddressesInTable(connection: Connection, lookupTableAddress: PublicKey) {
  const lookupTableAccount = await connection.getAddressLookupTable(lookupTableAddress);

  if (!lookupTableAccount.value) {
    throw new Error("Lookup table not found");
  }

  const addresses: string[] = [];

  lookupTableAccount.value.state.addresses.forEach(address => {
    addresses.push(address.toBase58());
  });

  return addresses;
}

export async function compareTxSize(connection: Connection, lookupTableAddress: PublicKey, payer: Keypair) {
  const lookupTable = await getTableValue(connection, lookupTableAddress);
  const addresses = lookupTable.state.addresses;

  const txInstructions: TransactionInstruction[] = [];
  const lamportsAmount = 1;

  addresses.forEach(address => {
    txInstructions.push(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: address,
        lamports: lamportsAmount,
      }),
    );
  });

  const latestBlockhash = await connection.getLatestBlockhash();

  // to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions,
  }).compileToLegacyMessage();
  const transactionLegacy = new VersionedTransaction(messageLegacy);

  // to v0 without lookup table
  const messageV0WithoutLookupTable = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions,
  }).compileToV0Message();
  const transactionV0WithoutLookupTable = new VersionedTransaction(messageV0WithoutLookupTable);

  // to v0 with lookup table
  const messageV0WithLookupTable = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions,
  }).compileToV0Message([lookupTable]);
  const transactionV0WithLookupTable = new VersionedTransaction(messageV0WithLookupTable);

  console.log("Legacy transaction size:", transactionLegacy.serialize().length, "bytes");
  console.log(
    "V0 transaction size without address lookup table: ",
    transactionV0WithoutLookupTable.serialize().length,
    "bytes",
  );
  console.log(
    "V0 transaction size with address lookup table:    ",
    transactionV0WithLookupTable.serialize().length,
    "bytes",
  );
}

// get limit number of addresses to extend lookup table
export async function addLimitAddressesToLookupTable(
  connection: Connection,
  payer: Keypair,
  lookupTableAddress: PublicKey,
) {
  // limit 30 addresses
  const keysNum = 30;
  const addresses: PublicKey[] = [];
  for (let i = 0; i < keysNum; i++) {
    addresses.push(Keypair.generate().publicKey);
  }

  const addAddressesToLookupTableInstruction = AddressLookupTableProgram.extendLookupTable({
    lookupTable: lookupTableAddress,
    authority: payer.publicKey,
    payer: payer.publicKey,
    addresses,
  });

  await createAndSendV0Transaction(connection, payer, [addAddressesToLookupTableInstruction]);
}

// if legacy transaction, transfer amount of accounts limit
export async function getLimitTransferLegacy(connection: Connection, lookupTableAddress: PublicKey, payer: Keypair) {
  const lookupTable = await getTableValue(connection, lookupTableAddress);
  const addresses = lookupTable.state.addresses;

  const txInstructions: TransactionInstruction[] = [];
  const lamportsAmount = 1_000_000;

  const limitNum = 21;

  for (let i = 0; i < limitNum; i++) {
    txInstructions.push(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: addresses[i],
        lamports: lamportsAmount,
      }),
    );
  }

  const latestBlockhash = await connection.getLatestBlockhash();

  // to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions,
  }).compileToLegacyMessage();
  const transactionLegacy = new VersionedTransaction(messageLegacy);

  transactionLegacy.sign([payer]);

  const sig = await connection.sendTransaction(transactionLegacy);

  const confirmation = await confirmTransaction(connection, sig);
  if (confirmation.err) {
    throw new Error("Transaction not confirmed.");
  }
  console.log("🎉 Transaction succesfully confirmed!", "\n", `https://explorer.solana.com/tx/${sig}?cluster=devnet`);
}

// if v0 transaction with lookup table, transfer amount of accounts limit
export async function getLimitTransferV0WithLookupTable(
  connection: Connection,
  lookupTableAddress: PublicKey,
  payer: Keypair,
) {
  const lookupTable = await getTableValue(connection, lookupTableAddress);
  const addresses = lookupTable.state.addresses;

  const txInstructions: TransactionInstruction[] = [];
  const lamportsAmount = 1_000_000;

  const limitNum = 57;

  for (let i = 0; i < limitNum; i++) {
    txInstructions.push(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: addresses[i],
        lamports: lamportsAmount,
      }),
    );
  }

  const latestBlockhash = await connection.getLatestBlockhash();

  // to v0 with lookup table
  const messageV0WithLookupTable = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions,
  }).compileToV0Message([lookupTable]);
  const transactionV0WithLookupTable = new VersionedTransaction(messageV0WithLookupTable);

  transactionV0WithLookupTable.sign([payer]);

  const sig = await connection.sendTransaction(transactionV0WithLookupTable);

  const confirmation = await confirmTransaction(connection, sig);
  if (confirmation.err) {
    throw new Error("Transaction not confirmed.");
  }
  console.log("🎉 Transaction succesfully confirmed!", "\n", `https://explorer.solana.com/tx/${sig}?cluster=devnet`);
}
