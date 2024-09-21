import { Keypair } from "@solana/web3.js";
import { generateKeypair, sign } from "./ed25519";
import bs58 from "bs58";

const signer = generateKeypair();

function signMessage(message: string): string {
  const messageBytes = new TextEncoder().encode(message);
  const signature = sign(messageBytes, signer.secretKey);
  return bs58.encode(signature);
}

// Function to generate a random message
function generateRandomMessage(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Benchmark signing 1000 different messages
const startTime = performance.now();

for (let i = 0; i < 10_000; i++) {
  const message = generateRandomMessage();
  const signature = signMessage(message);
  // Uncomment the next line if you want to see each signature (not recommended for performance testing)
  // console.log(`Message ${i + 1}: "${message}" - Signature: ${signature}`);
}

const endTime = performance.now();
const elapsedTime = endTime - startTime;

console.log(`Time taken to sign 10000 messages: ${elapsedTime.toFixed(2)} milliseconds`);
