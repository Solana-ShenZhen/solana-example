import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import resolve from "resolve-dir";

export function loadKeypair(jsonPath: string): Keypair {
  return Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(resolve(jsonPath)).toString())));
}
