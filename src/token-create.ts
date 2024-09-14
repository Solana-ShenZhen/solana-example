// /// 1. create mint account
// /// 2. upload image to decentralized storage or other storage(eg. server, github, link)
// /// 3. upload json file standard format to decentralized storage or other storage (eg. server, github, link)
// /// 4. Metaplex Token Metadata: createMetadataAccountV3, create token metadata account

// import type { AccountMeta, PublicKey } from "@solana/web3.js";

// export async function createMetadataAccountIx(){

// }

// type CreateMetadataAccountV3InstructionAccounts = {
//     metadata: PublicKey;
//     mint: PublicKey;
//     mintAuthority: PublicKey;
//     payer: PublicKey;
//     updateAuthority: PublicKey;
//     systemProgram?: PublicKey;
//     rent?: PublicKey;
//   };

// function createCreateMetadataAccountV3Instruction(
//     accounts: CreateMetadataAccountV3InstructionAccounts,
//     args: CreateMetadataAccountV3InstructionArgs,
//     programId = new web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'),
//   ) {
//     const [data] = CreateMetadataAccountV3Struct.serialize({
//       instructionDiscriminator: createMetadataAccountV3InstructionDiscriminator,
//       ...args,
//     });
//     const keys: AccountMeta[] = [
//       {
//         pubkey: accounts.metadata,
//         isWritable: true,
//         isSigner: false,
//       },
//       {
//         pubkey: accounts.mint,
//         isWritable: false,
//         isSigner: false,
//       },
//       {
//         pubkey: accounts.mintAuthority,
//         isWritable: false,
//         isSigner: true,
//       },
//       {
//         pubkey: accounts.payer,
//         isWritable: true,
//         isSigner: true,
//       },
//       {
//         pubkey: accounts.updateAuthority,
//         isWritable: false,
//         isSigner: false,
//       },
//       {
//         pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
//         isWritable: false,
//         isSigner: false,
//       },
//     ];

//     if (accounts.rent != null) {
//       keys.push({
//         pubkey: accounts.rent,
//         isWritable: false,
//         isSigner: false,
//       });
//     }

//     const ix = new web3.TransactionInstruction({
//       programId,
//       keys,
//       data,
//     });
//     return ix;
//   }
