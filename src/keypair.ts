/// 1. 首先生成助记词
/// 2. 根据助记词生成 keypair
/// 3. 根据 keypair 生成 base58 keypair
/// 4. 根据 keypair 得到 public key

import { Keypair } from "@solana/web3.js";
import * as bip39 from "bip39";

export function generateMnemonic() {
  return bip39.generateMnemonic();
}

export function mnemonicToKeypair(mnemonic: string) {
  const seed = bip39.mnemonicToSeedSync(mnemonic, "");
  return Keypair.fromSeed(seed.subarray(0, 32));
}
