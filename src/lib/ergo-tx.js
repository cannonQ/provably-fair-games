/**
 * ===== Module Description ===== //
 * Name: Ergo Transaction Utilities
 * Description: This module handles server wallet management and score submission
 *              to the Ergo blockchain. It uses Fleet SDK to construct transactions
 *              and submits them via public API (no node required).
 * Version: 1.0.0
 * Author: CQ (Provably Fair Games)
 * 
 * ===== What This Module Does ===== //
 * 
 * 1. Initializes a wallet from a 15-word mnemonic phrase
 * 2. Fetches UTXOs (unspent transaction outputs) from the blockchain
 * 3. Builds transactions with score data encoded in registers
 * 4. Signs transactions with the server wallet
 * 5. Submits signed transactions to the Ergo network
 * 
 * ===== Key Concepts ===== //
 * 
 * UTXO Model:
 *   - Ergo uses the UTXO model (like Bitcoin), not accounts (like Ethereum)
 *   - Your "balance" is the sum of all unspent boxes you own
 *   - To spend, you consume existing boxes and create new ones
 *   - Each box can hold ERG, tokens, and data in registers R4-R9
 * 
 * Boxes:
 *   - A "box" is Ergo's term for a UTXO
 *   - Boxes are immutable once created
 *   - Each box has: value (ERG), tokens, registers, and a guarding script
 *   - Minimum box value is ~0.001 ERG (protects against dust spam)
 * 
 * Registers:
 *   - R0-R3 are mandatory (value, script, tokens, creation info)
 *   - R4-R9 are optional and can store arbitrary data
 *   - We use R4-R9 to store score data (game, rank, score, time, etc.)
 *   - Register data is permanently recorded on-chain
 * 
 * Transactions:
 *   - Consume one or more input boxes
 *   - Create one or more output boxes
 *   - Inputs must be signed by their owners
 *   - Sum of inputs must >= sum of outputs + fee
 * 
 * ===== Environment Variables ===== //
 * 
 * ERGO_SERVER_MNEMONIC:
 *   - 15-word BIP39 mnemonic phrase
 *   - Used to derive the private key for signing transactions
 *   - This wallet pays the transaction fees
 *   - Example: "word1 word2 word3 ... word15"
 * 
 * ERGO_GAME_ADDRESS:
 *   - Ergo address (starts with "9")
 *   - Receives the score boxes
 *   - You control this wallet separately
 *   - Score boxes accumulate here as a permanent record
 */

import {
  ErgoAddress,
  OutputBuilder,
  TransactionBuilder,
  RECOMMENDED_MIN_FEE_VALUE,
  SAFE_MIN_BOX_VALUE,
  SColl,
  SByte,
  SLong
} from '@fleet-sdk/core';
import { mnemonicToSeedSync } from 'bip39';
import { Wallet } from '@fleet-sdk/wallet';

// ===== API Endpoints ===== //
// 
// These are public APIs - no node required!
// The Explorer API provides blockchain data (blocks, boxes, transactions)
// We can submit transactions through this API as well
//
// Rate limits apply - fine for low volume (dozens of TXs/day)
// For high volume, you'd run your own node

const ERGO_API = 'https://api.ergoplatform.com/api/v1';

// ===== Constants ===== //
//
// SAFE_MIN_BOX_VALUE: Minimum ERG a box must contain (~0.001 ERG)
//   - Prevents dust attacks (millions of tiny boxes)
//   - This ERG is "locked" in the box until spent
//   - For score boxes, this ERG accumulates in the game wallet
//
// RECOMMENDED_MIN_FEE_VALUE: Standard transaction fee (~0.001 ERG)
//   - Paid to miners for including your TX
//   - Higher fees = faster inclusion (usually not necessary)

const MIN_BOX_VALUE = SAFE_MIN_BOX_VALUE;


// ===== Wallet Functions ===== //

/**
 * Initialize wallet from mnemonic
 * 
 * How it works:
 * 1. Read 15-word mnemonic from environment variable
 * 2. Convert mnemonic to seed bytes (BIP39 standard)
 * 3. Derive wallet keys from seed (BIP32/BIP44 derivation)
 * 4. Return wallet object and first address
 * 
 * The wallet object can:
 * - Generate addresses (we use index 0)
 * - Sign transactions
 * - Derive child keys
 * 
 * Security note:
 * - Mnemonic = full control of wallet
 * - Never log or expose the mnemonic
 * - Store only in encrypted environment variables
 * 
 * @returns {Promise<{wallet: Wallet, address: string}>}
 */
export async function initServerWallet() {
  // Read mnemonic from environment
  const mnemonic = process.env.ERGO_SERVER_MNEMONIC;
  
  if (!mnemonic) {
    throw new Error('ERGO_SERVER_MNEMONIC environment variable not set');
  }
  
  // Convert mnemonic words to seed bytes
  // This is deterministic - same words always produce same seed
  const seed = mnemonicToSeedSync(mnemonic);
  
  // Create wallet from seed
  // This derives the master private key and can generate child keys
  const wallet = await Wallet.fromSeed(seed);
  
  // Get the first address (index 0)
  // Ergo addresses start with "9" on mainnet
  const address = wallet.getAddress(0).encode();
  
  return { wallet, address };
}

/**
 * Get game wallet address from environment
 * 
 * This is the destination for score boxes.
 * It's a separate wallet that accumulates the permanent score records.
 * 
 * Why separate wallets?
 * - Server wallet: operational, holds small balance for fees
 * - Game wallet: archival, accumulates score boxes
 * - If server wallet compromised, game records are safe
 * - Cleaner accounting and auditing
 * 
 * @returns {string} Ergo address
 */
export function getGameAddress() {
  const address = process.env.ERGO_GAME_ADDRESS;
  
  if (!address) {
    throw new Error('ERGO_GAME_ADDRESS environment variable not set');
  }
  
  return address;
}


// ===== Blockchain Query Functions ===== //

/**
 * Fetch current blockchain height
 * 
 * The "height" is the block number of the latest block.
 * We need this to:
 * 1. Build valid transactions (they reference current height)
 * 2. Set transaction validity window
 * 
 * Ergo blocks are mined every ~2 minutes on average.
 * 
 * @returns {Promise<number>} Current block height
 */
export async function getCurrentHeight() {
  const response = await fetch(`${ERGO_API}/blocks?limit=1`);
  const data = await response.json();
  
  // API returns blocks in descending order, so first item is latest
  return data.items[0].height;
}

/**
 * Fetch UTXOs (unspent boxes) for an address
 * 
 * This is how we find the "coins" available to spend.
 * Each UTXO is a box that:
 * - Belongs to this address (can be spent by its private key)
 * - Has not been spent in any confirmed transaction
 * 
 * The response includes:
 * - boxId: unique identifier for this box
 * - value: amount of ERG in nanoERGs (1 ERG = 1,000,000,000 nanoERG)
 * - assets: array of tokens in the box
 * - additionalRegisters: R4-R9 data
 * 
 * @param {string} address - Ergo address to query
 * @returns {Promise<Array>} Array of box objects
 */
export async function getUtxos(address) {
  const response = await fetch(`${ERGO_API}/boxes/unspent/byAddress/${address}`);
  const data = await response.json();
  
  // Transform API response to Fleet SDK format
  // Fleet SDK expects BigInt for values
  return data.items.map(box => ({
    boxId: box.boxId,
    transactionId: box.transactionId,
    index: box.index,
    ergoTree: box.ergoTree,
    creationHeight: box.creationHeight,
    value: BigInt(box.value),        // Convert to BigInt for SDK
    assets: box.assets || [],
    additionalRegisters: box.additionalRegisters || {}
  }));
}


// ===== Data Encoding Functions ===== //

/**
 * Encode a string for storage in a register
 * 
 * Registers store typed data using Ergo's serialization format.
 * For strings, we use SColl[SByte] - a collection of bytes.
 * 
 * The encoding process:
 * 1. Convert string to UTF-8 bytes
 * 2. Wrap in SColl (Sigma Collection) type
 * 3. Fleet SDK handles the final serialization
 * 
 * When reading back:
 * 1. Decode the SColl[SByte] from the register
 * 2. Convert bytes back to UTF-8 string
 * 
 * @param {string} str - String to encode
 * @returns {SColl<SByte>} Encoded bytes for register
 */
function encodeString(str) {
  // Convert string to byte array
  const bytes = Buffer.from(str, 'utf-8');
  
  // Wrap as Sigma Collection of Bytes
  // SColl = Sigma Collection, SByte = Sigma Byte type
  return SColl(SByte, [...bytes]);
}


// ===== Transaction Building Functions ===== //

/**
 * Build a transaction that posts score data to the blockchain
 * 
 * Transaction structure:
 * 
 *   INPUTS                          OUTPUTS
 *   ┌─────────────────┐            ┌─────────────────┐
 *   │ Server Wallet   │            │ Score Box       │
 *   │ Box(es)         │ ────────►  │ (to Game Wallet)│
 *   │                 │            │ R4: game        │
 *   │ value: X ERG    │            │ R5: rank        │
 *   └─────────────────┘            │ R6: gameId      │
 *                                  │ R7: score       │
 *                                  │ R8: time        │
 *                                  │ R9: player|date │
 *                                  │ value: 0.001 ERG│
 *                                  └─────────────────┘
 *                                  ┌─────────────────┐
 *                                  │ Change Box      │
 *                                  │ (back to Server)│
 *                                  │ value: X - fee  │
 *                                  │        - 0.001  │
 *                                  └─────────────────┘
 * 
 * The transaction consumes server wallet UTXOs and creates:
 * 1. Score box with data in registers (sent to game wallet)
 * 2. Change box with remaining ERG (back to server wallet)
 * 
 * @param {Object} scoreData - Score information
 * @param {string} scoreData.game - Game type ("solitaire", "yahtzee", etc.)
 * @param {string} scoreData.rank - Rank ("1st", "2nd", "3rd")
 * @param {string} scoreData.gameId - Unique game identifier
 * @param {number} scoreData.score - Score value
 * @param {number} scoreData.timeSeconds - Completion time in seconds
 * @param {string} scoreData.playerName - Player display name
 * @param {string} scoreData.date - Date string (YYYY-MM-DD)
 * @param {Array} inputs - UTXOs to spend (from server wallet)
 * @param {string} changeAddress - Address for leftover ERG (server wallet)
 * @param {number} currentHeight - Current blockchain height
 * @returns {Object} Unsigned transaction
 */
export function buildScoreTx(scoreData, inputs, changeAddress, currentHeight) {
  const { game, rank, gameId, score, timeSeconds, playerName, date } = scoreData;
  const gameAddress = getGameAddress();
  
  // ===== Build the Score Box Output ===== //
  //
  // OutputBuilder creates a new box with:
  // - value: minimum ERG (locked in the box)
  // - address: where the box goes (game wallet)
  // - registers: our score data
  //
  // Register assignments:
  // R4: game type - which game this score is from
  // R5: rank - daily placement (1st, 2nd, 3rd)
  // R6: gameId - unique identifier, includes block height for RNG verification
  // R7: score - the actual score value (as Long integer)
  // R8: timeSeconds - how long the game took (as Long integer)
  // R9: playerName|date - combined string to fit register limit
  //
  // Why combine player and date in R9?
  // - Boxes only have R4-R9 available (6 registers)
  // - We need 7 pieces of data
  // - Pipe separator is easily parsed when reading back
  
  const output = new OutputBuilder(MIN_BOX_VALUE, gameAddress)
    .setAdditionalRegisters({
      R4: encodeString(game),
      R5: encodeString(rank),
      R6: encodeString(gameId),
      R7: SLong(BigInt(score)),           // SLong = Sigma Long (64-bit integer)
      R8: SLong(BigInt(timeSeconds)),
      R9: encodeString(`${playerName}|${date}`)
    });
  
  // ===== Build the Transaction ===== //
  //
  // TransactionBuilder assembles the full transaction:
  // 1. from(inputs) - which boxes to spend
  // 2. to(output) - the score box we're creating
  // 3. sendChangeTo() - where leftover ERG goes
  // 4. payMinFee() - include standard miner fee
  // 5. build() - assemble into unsigned transaction
  //
  // The SDK automatically:
  // - Calculates total input value
  // - Subtracts output value and fee
  // - Creates change output with remainder
  // - Handles box selection if multiple inputs
  
  const unsignedTx = new TransactionBuilder(currentHeight)
    .from(inputs)
    .to(output)
    .sendChangeTo(changeAddress)
    .payMinFee()
    .build();
  
  return unsignedTx;
}

/**
 * Submit a signed transaction to the Ergo network
 * 
 * The submission process:
 * 1. Send signed TX to the mempool (pending transactions)
 * 2. Miners pick it up and include in a block
 * 3. Once in a block, it's confirmed (typically 1-2 minutes)
 * 
 * The API returns the transaction ID (txId) immediately.
 * This doesn't mean it's confirmed - just accepted to mempool.
 * 
 * Possible failures:
 * - Invalid signature (wrong private key)
 * - Double spend (inputs already spent)
 * - Insufficient funds (inputs < outputs + fee)
 * - Rate limited (too many requests)
 * 
 * @param {Object} signedTx - Signed transaction object
 * @returns {Promise<string>} Transaction ID
 */
export async function submitTx(signedTx) {
  const response = await fetch(`${ERGO_API}/mempool/transactions/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedTx)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TX submission failed: ${error}`);
  }
  
  const data = await response.json();
  return data.id;
}


// ===== Main Entry Points ===== //

/**
 * Post a single score to the Ergo blockchain
 * 
 * This is the main function for submitting one score.
 * It orchestrates the full flow:
 * 
 *   ┌──────────────────────────────────────────────────────┐
 *   │ 1. Initialize wallet from mnemonic                   │
 *   │    └─► Derives private key for signing               │
 *   ├──────────────────────────────────────────────────────┤
 *   │ 2. Fetch current height and UTXOs (parallel)         │
 *   │    └─► Need both to build valid transaction          │
 *   ├──────────────────────────────────────────────────────┤
 *   │ 3. Validate balance                                  │
 *   │    └─► Must have enough for box value + fee          │
 *   ├──────────────────────────────────────────────────────┤
 *   │ 4. Build unsigned transaction                        │
 *   │    └─► Creates score box with register data          │
 *   ├──────────────────────────────────────────────────────┤
 *   │ 5. Sign transaction                                  │
 *   │    └─► Proves ownership of input boxes               │
 *   ├──────────────────────────────────────────────────────┤
 *   │ 6. Submit to network                                 │
 *   │    └─► Returns txId, miners will include in block    │
 *   └──────────────────────────────────────────────────────┘
 * 
 * Cost per submission: ~0.002 ERG
 * - 0.001 ERG locked in score box
 * - 0.001 ERG miner fee
 * 
 * @param {Object} scoreData - Score data to post
 * @returns {Promise<string>} Transaction ID
 */
export async function postScoreToChain(scoreData) {
  try {
    // Step 1: Initialize wallet
    const { wallet, address } = await initServerWallet();
    
    // Step 2: Get blockchain state (parallel for speed)
    const [currentHeight, utxos] = await Promise.all([
      getCurrentHeight(),
      getUtxos(address)
    ]);
    
    // Check we have UTXOs to spend
    if (utxos.length === 0) {
      throw new Error('Server wallet has no UTXOs. Please fund it with ERG.');
    }
    
    // Step 3: Validate balance
    // Sum up all UTXO values
    const totalBalance = utxos.reduce((sum, box) => sum + box.value, 0n);
    const requiredAmount = MIN_BOX_VALUE + RECOMMENDED_MIN_FEE_VALUE;
    
    if (totalBalance < requiredAmount) {
      throw new Error(
        `Insufficient balance. Have: ${totalBalance} nanoERG, need: ${requiredAmount} nanoERG`
      );
    }
    
    // Step 4: Build transaction
    const unsignedTx = buildScoreTx(scoreData, utxos, address, currentHeight);
    
    // Step 5: Sign transaction
    // This proves we own the input boxes
    // The signature is verified by all nodes before accepting the TX
    const signedTx = await wallet.sign(unsignedTx);
    
    // Step 6: Submit to network
    const txId = await submitTx(signedTx);
    
    console.log(`✓ Score posted to chain: ${txId}`);
    console.log(`  Game: ${scoreData.game}, Rank: ${scoreData.rank}, Score: ${scoreData.score}`);
    
    return txId;
    
  } catch (error) {
    console.error('✗ Failed to post score to chain:', error.message);
    throw error;
  }
}

/**
 * Post multiple scores in a single transaction (batch)
 * 
 * More efficient for daily top 3:
 * - Single transaction fee instead of 3
 * - Single blockchain lookup
 * - Atomic: all scores posted or none
 * 
 * Transaction structure for 3 scores:
 * 
 *   INPUTS                          OUTPUTS
 *   ┌─────────────────┐            ┌─────────────────┐
 *   │ Server Wallet   │            │ Score Box #1    │
 *   │ UTXOs           │            │ (1st place)     │
 *   │                 │ ────────►  ├─────────────────┤
 *   │                 │            │ Score Box #2    │
 *   │                 │            │ (2nd place)     │
 *   │                 │            ├─────────────────┤
 *   │                 │            │ Score Box #3    │
 *   │                 │            │ (3rd place)     │
 *   │                 │            ├─────────────────┤
 *   │                 │            │ Change Box      │
 *   └─────────────────┘            └─────────────────┘
 * 
 * Cost for 3 scores: ~0.004 ERG
 * - 0.001 ERG × 3 locked in score boxes
 * - 0.001 ERG miner fee
 * 
 * vs individual submissions: ~0.006 ERG (0.002 × 3)
 * Savings: ~33% on fees
 * 
 * @param {Array<Object>} scores - Array of score data objects
 * @returns {Promise<string>} Transaction ID
 */
export async function postScoresBatch(scores) {
  try {
    // Initialize wallet and fetch state
    const { wallet, address } = await initServerWallet();
    const [currentHeight, utxos] = await Promise.all([
      getCurrentHeight(),
      getUtxos(address)
    ]);
    
    if (utxos.length === 0) {
      throw new Error('Server wallet has no UTXOs. Please fund it with ERG.');
    }
    
    const gameAddress = getGameAddress();
    
    // Build output box for each score
    const outputs = scores.map(scoreData => {
      const { game, rank, gameId, score, timeSeconds, playerName, date } = scoreData;
      
      return new OutputBuilder(MIN_BOX_VALUE, gameAddress)
        .setAdditionalRegisters({
          R4: encodeString(game),
          R5: encodeString(rank),
          R6: encodeString(gameId),
          R7: SLong(BigInt(score)),
          R8: SLong(BigInt(timeSeconds)),
          R9: encodeString(`${playerName}|${date}`)
        });
    });
    
    // Build transaction with all outputs
    let txBuilder = new TransactionBuilder(currentHeight)
      .from(utxos)
      .sendChangeTo(address)
      .payMinFee();
    
    // Add each score box as an output
    outputs.forEach(output => {
      txBuilder = txBuilder.to(output);
    });
    
    const unsignedTx = txBuilder.build();
    const signedTx = await wallet.sign(unsignedTx);
    const txId = await submitTx(signedTx);
    
    console.log(`✓ Batch posted to chain: ${txId}`);
    console.log(`  Scores: ${scores.length}`);
    scores.forEach(s => console.log(`    ${s.rank}: ${s.playerName} - ${s.score}`));
    
    return txId;
    
  } catch (error) {
    console.error('✗ Failed to post batch scores to chain:', error.message);
    throw error;
  }
}


// ===== Module Exports ===== //
//
// Default export for convenient importing:
//   import ergoTx from './ergo-tx.js';
//   await ergoTx.postScoreToChain(data);
//
// Named exports for selective importing:
//   import { postScoreToChain, postScoresBatch } from './ergo-tx.js';

export default {
  initServerWallet,
  getGameAddress,
  getCurrentHeight,
  getUtxos,
  buildScoreTx,
  submitTx,
  postScoreToChain,
  postScoresBatch
};
