import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import axios, { type AxiosInstance, AxiosError } from "axios";
import bs58 from "bs58";

const TIPS_ACCOUNTS: string[] = [
  "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
  "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
  "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
  "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
  "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
  "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
];

/**
 * @typedef {Object} JsonRpcRequest
 * @property {string} jsonrpc
 * @property {number} id
 * @property {string} method
 * @property {any[]} params
 */
interface JsonRpcRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: any[];
}

class JitoJsonRpcClient {
  private baseUrl: string;
  private uuid?: string;
  private client: AxiosInstance;

  constructor(baseUrl: string, uuid?: string) {
    this.baseUrl = baseUrl;
    this.uuid = uuid;
    this.client = axios.create({
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  private async sendRequest<T>(endpoint: string, method: string, params?: any[]): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const data: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: 1,
      method,
      params: params || [],
    };

    console.log(`Sending request to: ${url}`);
    console.log(`Request body: ${JSON.stringify(data, null, 2)}`);

    try {
      const response = await this.client.post(url, data);
      // console.log(`Response status: ${response.status}`);
      // console.log(`Response body: ${JSON.stringify(response.data, null, 2)}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`HTTP error: ${error.message}`);
        throw error;
      } else {
        console.error(`Unexpected error: ${error}`);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async getTipAccounts(): Promise<any> {
    const endpoint = "/api/v1/bundles";
    return this.sendRequest(endpoint, "getTipAccounts");
  }

  // in 5 minutes
  async getBundleStatuses(params: any[]): Promise<any> {
    const endpoint = "/api/v1/bundles";
    return this.sendRequest(endpoint, "getBundleStatuses", params);
  }

  // in 5 minutes
  async getInflightBundleStatuses(params: any[]): Promise<any> {
    const endpoint = "/api/v1/bundles";
    return this.sendRequest(endpoint, "getInflightBundleStatuses", params);
  }

  async sendBundle(params: any[]): Promise<any> {
    const endpoint = "/api/v1/bundles";
    return this.sendRequest(endpoint, "sendBundle", params);
  }

  async sendTxn(params: any[], bundleOnly = false): Promise<any> {
    let endpoint = "/transactions";
    const queryParams: string[] = [];

    if (bundleOnly) {
      queryParams.push("bundleOnly=true");
    }

    if (this.uuid) {
      queryParams.push(`uuid=${this.uuid}`);
    }

    if (queryParams.length > 0) {
      endpoint += `?${queryParams.join("&")}`;
    }

    return this.sendRequest(endpoint, "sendTransaction", params);
  }

  static prettify(value: any): string {
    return JSON.stringify(value, null, 2);
  }
}

// tips unit lamport
export async function sendTipsTransaction(connection: Connection, payer: Keypair, tips: number) {
  const transferIx = SystemProgram.transfer({
    fromPubkey: payer.publicKey,
    toPubkey: new PublicKey(TIPS_ACCOUNTS[0]),
    lamports: tips,
  });

  const tx = new Transaction();
  tx.add(transferIx);
  const latestBlockhash = await connection.getLatestBlockhash();
  tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);

  const txBs58 = bs58.encode(tx.serialize());

  return txBs58;
}

export { JitoJsonRpcClient };
