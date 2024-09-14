import type { DefaultApi, QuoteGetRequest, QuoteGetSwapModeEnum, QuoteResponse, SwapRequest } from "@jup-ag/api";
import { sendAndConfirmRawTransaction, VersionedTransaction, type PublicKey } from "@solana/web3.js";

// interface QuoteGetRequest {
//   inputMint: string;
//   outputMint: string;
//   amount: number;
//   slippageBps?: number;
//   autoSlippage?: boolean;
//   autoSlippageCollisionUsdValue?: number;
//   computeAutoSlippage?: boolean;
//   maxAutoSlippageBps?: number;
//   swapMode?: QuoteGetSwapModeEnum;
//   dexes?: Array<string>;
//   excludeDexes?: Array<string>;
//   restrictIntermediateTokens?: boolean;
//   onlyDirectRoutes?: boolean;
//   asLegacyTransaction?: boolean;
//   platformFeeBps?: number;
//   maxAccounts?: number;
//   minimizeSlippage?: boolean;
//   preferLiquidDexes?: boolean;
// }
export async function getQuoteFromJupiter({
  jupiterApi,
  inputMint,
  outputMint,
  amount,
}: {
  jupiterApi: DefaultApi;
  inputMint: string;
  outputMint: string;
  amount: number;
}): Promise<QuoteResponse> {
  // https://station.jup.ag/api-v6/get-quote

  const params: QuoteGetRequest = {
    inputMint, // Input token mint address
    outputMint, // Output token mint address
    amount, // The amount to swap, have to factor in the token decimals.
    autoSlippage: true,
    computeAutoSlippage: true,
    swapMode: "ExactIn",
    onlyDirectRoutes: false, // Default is false.
    asLegacyTransaction: false, // Default is false, instead of using versioned transaction.
    minimizeSlippage: true,
  };

  const quote = await jupiterApi.quoteGet(params);

  if (!quote) {
    throw new Error("unable to quote");
  }

  return quote;
}

export async function getSwapTransactionFromJupiter(
  jupiterApi: DefaultApi,
  publicKey: PublicKey,
  quoteResponse: QuoteResponse,
) {
  const swapRequest: SwapRequest = {
    userPublicKey: publicKey.toBase58(),
    useSharedAccounts: true,
    prioritizationFeeLamports: "auto",
    asLegacyTransaction: false,
    dynamicComputeUnitLimit: true,
    skipUserAccountsRpcCalls: true,
    quoteResponse,
  };

  const response = await jupiterApi.swapPost({
    swapRequest,
  });

  const swapTransactionBuf = Buffer.from(response.swapTransaction, "base64");
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  return transaction;
}
