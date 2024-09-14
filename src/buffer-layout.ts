import { bool, publicKey, struct, u32, u64, u8 } from "@coral-xyz/borsh";
import type { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

// 1. get mint accounfinfo data
export async function getMintData(connection: Connection, mint: PublicKey) {
  const accountInfo = await connection.getAccountInfo(mint);
  return accountInfo?.data;
}

// 2. mint data structure
export interface RawMint {
  mintAuthorityOption: 1 | 0;
  mintAuthority: PublicKey;
  supply: bigint;
  decimals: number;
  isInitialized: boolean;
  freezeAuthorityOption: 1 | 0;
  freezeAuthority: PublicKey;
}
export const MintLayout = struct<RawMint>([
  u32("mintAuthorityOption"),
  publicKey("mintAuthority"),
  u64("supply"),
  u8("decimals"),
  bool("isInitialized"),
  u32("freezeAuthorityOption"),
  publicKey("freezeAuthority"),
]);

// 3. deserialize data according to mint data structure
export function decodeMintData(data: Buffer): RawMint {
  return MintLayout.decode(data);
}

export interface Mint {
  address: PublicKey;
  mintAuthority: PublicKey | null;
  supply: string;
  decimals: number;
  isInitialized: boolean;
  freezeAuthority: PublicKey | null;
}
export async function getMintDiy(connection: Connection, mint: PublicKey): Promise<Mint> {
  const mintData = await getMintData(connection, mint);
  const rawMint = decodeMintData(mintData!);

  return {
    address: mint,
    mintAuthority: rawMint.mintAuthorityOption === 1 ? rawMint.mintAuthority : null,
    supply: rawMint.supply.toString(),
    decimals: rawMint.decimals,
    isInitialized: rawMint.isInitialized,
    freezeAuthority: rawMint.freezeAuthorityOption === 1 ? rawMint.freezeAuthority : null,
  };
}

export async function getPumpGlobalData(connection: Connection, global: PublicKey) {
  const accountInfo = await connection.getAccountInfo(global);
  return accountInfo?.data;
}

export interface RawGlobal {
  discriminator: bigint;
  initialized: boolean;
  authority: PublicKey;
  feeRecipient: PublicKey;
  initialVirtualTokenReserves: bigint;
  initialVirtualSolReserves: bigint;
  initialRealTokenReserves: bigint;
  tokenTotalSupply: bigint;
  feeBasisPoints: bigint;
}
export const GlobalLayout = struct<RawGlobal>([
  u64("discriminator"),
  bool("initialized"),
  publicKey("authority"),
  publicKey("feeRecipient"),
  u64("initialVirtualTokenReserves"),
  u64("initialVirtualSolReserves"),
  u64("initialRealTokenReserves"),
  u64("tokenTotalSupply"),
  u64("feeBasisPoints"),
]);

export function decodeGlobalData(data: Buffer): RawGlobal {
  return GlobalLayout.decode(data);
}

export interface Global {
  address: PublicKey;
  authority: PublicKey;
  feeRecipient: PublicKey;
  initialVirtualTokenReserves: string;
  initialVirtualSolReserves: string;
  initialRealTokenReserves: string;
  tokenTotalSupply: string;
  feeBasisPoints: string;
}

export async function getGlobal(connection: Connection, global: PublicKey): Promise<Global> {
  const globalData = await getPumpGlobalData(connection, global);
  const rawGlobal = decodeGlobalData(globalData!);
  return {
    address: global,
    authority: rawGlobal.authority,
    feeRecipient: rawGlobal.feeRecipient,
    initialRealTokenReserves: rawGlobal.initialRealTokenReserves.toString(),
    initialVirtualSolReserves: rawGlobal.initialVirtualSolReserves.toString(),
    initialVirtualTokenReserves: rawGlobal.initialVirtualTokenReserves.toString(),
    tokenTotalSupply: rawGlobal.tokenTotalSupply.toString(),
    feeBasisPoints: rawGlobal.feeBasisPoints.toString(),
  };
}
