import type { Connection, PublicKey } from "@solana/web3.js";

export async function getAccountSpace(connection: Connection, address: PublicKey) {
  const accountInfo = await connection.getAccountInfo(address);
  return accountInfo?.data.length || 0;
}
