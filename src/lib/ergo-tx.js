/**
 * ===== Module Description ===== //
 * Name: Ergo Transaction Utilities (ergo-lib-wasm-nodejs version)
 * Description: Server-side Ergo wallet management and score submission
 *              using ergo-lib-wasm-nodejs for transaction signing.
 *              This is the WORKING version that correctly signs transactions.
 * Version: 2.0.0
 * Author: CQ (Provably Fair Games)
 * 
 * ===== Why This Module Exists ===== //
 * 
 * The Fleet SDK's wallet signing doesn't work reliably in Node.js.
 * This module uses ergo-lib-wasm-nodejs directly, which is the same
 * library that Nautilus wallet uses internally.
 * 
 * Key difference from Fleet SDK approach:
 * - Fleet SDK: Wallet.fromSeed() → wallet.sign() [BROKEN]
 * - This module: Manual key derivation → Wallet.from_secrets() [WORKS]
 * 
 * ===== What This Module Does ===== //
 * 
 * 1. Derives wallet keys from a 15-word mnemonic using EIP-3 path
 * 2. Fetches UTXOs and blockchain state from public APIs
 * 3. Builds transactions with score data in registers R4-R9
 * 4. Signs transactions using ergo-lib-wasm-nodejs
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
 * ErgoTree:
 *   - The "guarding script" that protects a box
 *   - For simple P2PK (pay-to-public-key) addresses, it encodes the public key
 *   - To spend a box, you must provide a valid signature for its ergoTree
 * 
 * Signing:
 *   - Proves you own the private key corresponding to the input boxes
 *   - The signature covers the entire transaction (can't be modified after)
 *   - ergo-lib-wasm provides the cryptographic primitives
 * 
 * ===== Environment Variables ===== //
 * 
 * ERGO_SERVER_MNEMONIC:
 *   - 15-word BIP39 mnemonic phrase
 *   - Used to derive the private key for signing transactions
 *   - This wallet pays the transaction fees
 *   - Example: "word1 word2 word3 ... word15"
 *   - SECURITY: Never commit this to version control!
 * 
 * ERGO_GAME_ADDRESS:
 *   - Ergo address (starts with "9")
 *   - Receives the score boxes
 *   - You control this wallet separately
 *   - Score boxes accumulate here as a permanent record
 * 
 * ERGO_SERVER_ADDRESS (optional):
 *   - Expected server wallet address for verification
 *   - If set, module will warn if derived address doesn't match
 * 
 * ===== Transaction Cost Breakdown ===== //
 * 
 * Single score submission: ~0.0021 ERG
 *   - 0.001 ERG: Locked in the score box (MIN_BOX_VALUE)
 *   - 0.0011 ERG: Miner fee (MIN_FEE)
 * 
 * Batch submission (3 scores): ~0.0041 ERG
 *   - 0.003 ERG: Locked in 3 score boxes
 *   - 0.0011 ERG: Single miner fee
 *   - Savings vs 3 individual: ~0.0022 ERG (35%)
 * 
 * ===== Installation ===== //
 * 
 * npm install ergo-lib-wasm-nodejs dotenv
 * 
 * Note: ergo-lib-wasm-nodejs is a native module compiled from Rust.
 * It may require additional build tools on some systems.
 */

// ===== Dependencies ===== //

// dotenv: Loads environment variables from .env.local file
// This keeps sensitive data (mnemonic) out of code
import 'dotenv/config';

// ergo-lib-wasm-nodejs: Core Ergo cryptography library
// This is imported dynamically because it's a WASM module
// We'll store the reference after first import
let ergolib = null;


// ===== API Endpoints ===== //
// 
// We use TWO different APIs:
// 
// 1. Explorer API (api.ergoplatform.com)
//    - UTXOs, balances, transaction submission
//    - Higher-level, easier to use
//    - Rate limited but fine for low volume
// 
// 2. Node API (direct node connection)
//    - Block headers for signing context
//    - Required because Explorer API returns headers in wrong format
//    - Using public node; replace with your own for production

const ERGO_EXPLORER = 'https://api.ergoplatform.com/api/v1';
const ERGO_NODE = 'http://213.239.193.208:9053';


// ===== Constants ===== //
//
// MIN_BOX_VALUE: Minimum ERG a box must contain (0.001 ERG = 1,000,000 nanoERG)
//   - Prevents dust attacks (millions of tiny boxes bloating the chain)
//   - This ERG is "locked" in the box until someone spends it
//   - For score boxes, this ERG accumulates in the game wallet
//
// MIN_FEE: Transaction fee paid to miners (0.0011 ERG)
//   - Slightly above absolute minimum for reliable inclusion
//   - Higher fees don't help much on Ergo (unlike Ethereum)

const MIN_BOX_VALUE = 1000000n;   // 0.001 ERG in nanoERG (BigInt)
const MIN_FEE = 1100000n;         // 0.0011 ERG in nanoERG (BigInt)


// ===== Module Initialization ===== //

/**
 * Load ergo-lib-wasm-nodejs module
 * 
 * Why dynamic import?
 * - ergo-lib is a WebAssembly module compiled from Rust
 * - It needs to be loaded asynchronously
 * - We cache it after first load for performance
 * 
 * This is called automatically by other functions, but you can
 * call it explicitly at app startup to catch errors early.
 * 
 * @returns {Promise<Object>} The ergo-lib module
 */
export async function loadErgoLib() {
  if (!ergolib) {
    ergolib = await import('ergo-lib-wasm-nodejs');
  }
  return ergolib;
}


// ===== Wallet Functions ===== //

/**
 * Derive wallet address and signing keys from mnemonic
 * 
 * ===== How Key Derivation Works ===== //
 * 
 * BIP39/BIP44 is a standard for deriving many keys from one seed:
 * 
 *   Mnemonic (15 words)
 *        │
 *        ▼
 *   Seed (512 bits) ─── Mnemonic.to_seed()
 *        │
 *        ▼
 *   Master Key ──────── ExtSecretKey.derive_master()
 *        │
 *        ▼
 *   Derived Key ─────── derive(path)
 *        │
 *        ├──► Public Key ──► Address (what others see)
 *        │
 *        └──► Secret Key ──► Signs transactions (keep private!)
 * 
 * ===== EIP-3 Derivation Path ===== //
 * 
 * Ergo uses EIP-3 (Ergo Improvement Proposal 3) for key derivation:
 * 
 *   Path: m / 44' / 429' / account' / 0 / index
 *         │    │      │       │      │     │
 *         │    │      │       │      │     └─ Address index (0, 1, 2...)
 *         │    │      │       │      └─────── Change: 0=receive, 1=change
 *         │    │      │       └────────────── Account number (usually 0)
 *         │    │      └────────────────────── Ergo coin type (429)
 *         │    └───────────────────────────── BIP44 purpose
 *         └────────────────────────────────── Master key
 * 
 * DerivationPath.new(0, [0]) creates: m/44'/429'/0'/0/0
 * This is the first address of the first account - what Nautilus uses by default.
 * 
 * @returns {Promise<{address: string, secretKey: Object, ergolib: Object}>}
 */
export async function initServerWallet() {
  const lib = await loadErgoLib();
  
  // Read mnemonic from environment
  const mnemonic = process.env.ERGO_SERVER_MNEMONIC;
  
  if (!mnemonic) {
    throw new Error('ERGO_SERVER_MNEMONIC environment variable not set');
  }
  
  // Validate mnemonic word count
  const words = mnemonic.trim().split(/\s+/);
  if (words.length !== 15 && words.length !== 24) {
    throw new Error(`Invalid mnemonic: expected 15 or 24 words, got ${words.length}`);
  }
  
  // ===== Step 1: Mnemonic → Seed ===== //
  // Convert mnemonic words to 512-bit seed
  // Second parameter is optional passphrase (empty string = none)
  const seed = lib.Mnemonic.to_seed(mnemonic, '');
  
  // ===== Step 2: Seed → Master Key ===== //
  // Derive the master extended secret key
  // "Extended" means it can derive child keys
  const rootSecret = lib.ExtSecretKey.derive_master(seed);
  
  // ===== Step 3: Master → Derived Key ===== //
  // Follow EIP-3 path to get the first address's key
  // DerivationPath.new(account, [address_indices])
  const path = lib.DerivationPath.new(0, new Uint32Array([0]));
  const derivedExtSecret = rootSecret.derive(path);
  
  // ===== Step 4: Extract Usable Keys ===== //
  // Get the public key → address (for receiving/display)
  const address = derivedExtSecret
    .public_key()
    .to_address()
    .to_base58(lib.NetworkPrefix.Mainnet);
  
  // Get the secret key bytes → SecretKey (for signing)
  // dlog = discrete logarithm, the crypto primitive for Ergo signatures
  const secretKeyBytes = derivedExtSecret.secret_key_bytes();
  const secretKey = lib.SecretKey.dlog_from_bytes(secretKeyBytes);
  
  // Optionally verify against expected address
  const expectedAddress = process.env.ERGO_SERVER_ADDRESS;
  if (expectedAddress && address !== expectedAddress) {
    console.warn('⚠ WARNING: Derived address does not match ERGO_SERVER_ADDRESS');
    console.warn(`  Expected: ${expectedAddress}`);
    console.warn(`  Got:      ${address}`);
  }
  
  return { address, secretKey, ergolib: lib };
}

/**
 * Get game wallet address from environment
 * 
 * This is the destination for score boxes.
 * It's a separate wallet that accumulates the permanent score records.
 * 
 * Why separate wallets?
 * - Server wallet: Operational, holds small balance for fees
 * - Game wallet: Archival, accumulates score boxes
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
 * Fetch current blockchain height from Node API
 * 
 * The "height" is the block number of the latest block.
 * We need this to:
 * 1. Build valid transactions (they reference current height)
 * 2. Set the creation height of new boxes
 * 
 * Ergo blocks are mined every ~2 minutes on average.
 * Height increases by 1 with each block.
 * 
 * @returns {Promise<number>} Current block height
 */
export async function getCurrentHeight() {
  const response = await fetch(`${ERGO_NODE}/info`);
  
  if (!response.ok) {
    throw new Error(`Failed to get node info: ${response.status}`);
  }
  
  const data = await response.json();
  return data.fullHeight;
}

/**
 * Fetch UTXOs (unspent boxes) for an address
 * 
 * This is how we find the "coins" available to spend.
 * Each UTXO is a box that:
 * - Belongs to this address (can be spent by its private key)
 * - Has not been spent in any confirmed transaction
 * 
 * ===== Box Structure ===== //
 * 
 * {
 *   boxId: "abc123...",           // Unique 64-char hex identifier
 *   transactionId: "def456...",   // TX that created this box
 *   index: 0,                     // Output index in that TX
 *   value: 1000000000,            // ERG in nanoERG (1 ERG here)
 *   ergoTree: "0008cd...",        // Guarding script (encodes owner)
 *   assets: [...],                // Tokens in this box
 *   additionalRegisters: {        // R4-R9 data
 *     R4: "0e0474657374",         // Serialized register values
 *     ...
 *   },
 *   creationHeight: 1234567       // Block when box was created
 * }
 * 
 * @param {string} address - Ergo address to query
 * @returns {Promise<Array>} Array of box objects
 */
export async function getUtxos(address) {
  const response = await fetch(
    `${ERGO_EXPLORER}/boxes/unspent/byAddress/${address}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch UTXOs: ${response.status}`);
  }
  
  const data = await response.json();
  return data.items || [];
}

/**
 * Get wallet balance in ERG
 * 
 * Convenience function that sums UTXOs.
 * Returns human-readable ERG (not nanoERG).
 * 
 * @param {string} address - Ergo address to query
 * @returns {Promise<number>} Balance in ERG
 */
export async function getBalance(address) {
  const utxos = await getUtxos(address);
  const totalNanoErg = utxos.reduce(
    (sum, box) => sum + BigInt(box.value), 
    0n
  );
  return Number(totalNanoErg) / 1_000_000_000;
}


// ===== State Context Functions ===== //

/**
 * Create ErgoStateContext for transaction signing
 * 
 * ===== What is State Context? ===== //
 * 
 * ErgoStateContext provides blockchain state needed for signing:
 * - Block headers: Recent block info for Sigma protocol proofs
 * - Pre-header: Info about the upcoming block
 * 
 * This is required because Ergo's sigma protocols can reference
 * blockchain state in their proofs (though we don't use this feature
 * for simple P2PK spending).
 * 
 * ===== Why Node API for Headers? ===== //
 * 
 * The Explorer API returns headers in a different format than
 * ergo-lib expects. The Node API's /blocks/lastHeaders endpoint
 * returns the exact format we need.
 * 
 * ===== Critical API Quirk ===== //
 * 
 * BlockHeaders.from_json() expects a JavaScript ARRAY, not a string!
 * BlockHeader.from_json() (singular) expects a JSON STRING!
 * 
 * This inconsistency has caused many developers hours of debugging.
 * 
 * @param {Object} lib - ergo-lib module reference
 * @returns {Promise<{stateContext: Object, currentHeight: number}>}
 */
async function createStateContext(lib) {
  // Fetch last 10 block headers from Node API
  const headersResp = await fetch(`${ERGO_NODE}/blocks/lastHeaders/10`);
  
  if (!headersResp.ok) {
    throw new Error(`Failed to fetch block headers: ${headersResp.status}`);
  }
  
  const headersData = await headersResp.json();
  
  // ===== Parse Block Headers ===== //
  // CRITICAL: Pass the array directly, NOT JSON.stringify(headersData)
  const blockHeaders = lib.BlockHeaders.from_json(headersData);
  
  // ===== Create Pre-Header ===== //
  // Pre-header is derived from the latest block header
  // CRITICAL: This one DOES need JSON.stringify()
  const latestHeader = lib.BlockHeader.from_json(
    JSON.stringify(headersData[0])
  );
  const preHeader = lib.PreHeader.from_block_header(latestHeader);
  
  // ===== Create State Context ===== //
  // Different ergo-lib versions have different constructor signatures
  // v0.28.0+ requires Parameters as third argument
  let stateContext;

  // Debug: Log available exports to understand the API
  const libKeys = Object.keys(lib).filter(k => k.toLowerCase().includes('param') || k.toLowerCase().includes('network'));
  console.log('Available lib exports (param/network related):', libKeys);

  // Try to get Parameters - different versions have different APIs
  let parameters = null;

  // Method 1: Check for NetworkParameters (some versions use this)
  if (lib.NetworkParameters) {
    console.log('Found NetworkParameters, methods:', Object.keys(lib.NetworkParameters));
    if (typeof lib.NetworkParameters.mainnet === 'function') {
      parameters = lib.NetworkParameters.mainnet();
    }
  }

  // Method 2: Check Parameters class
  if (!parameters && lib.Parameters) {
    console.log('Found Parameters, checking methods...');
    console.log('Parameters static keys:', Object.keys(lib.Parameters));
    console.log('Parameters prototype:', lib.Parameters.prototype ? Object.keys(lib.Parameters.prototype) : 'none');

    // Try various known method names
    const methodsToTry = ['defaultMainnetParameters', 'mainnetParameters', 'default', 'mainnet'];
    for (const method of methodsToTry) {
      if (typeof lib.Parameters[method] === 'function') {
        console.log(`Trying Parameters.${method}()`);
        try {
          parameters = lib.Parameters[method]();
          console.log('Success with', method);
          break;
        } catch (e) {
          console.log(`Parameters.${method}() failed:`, e.message);
        }
      }
    }

    // Try constructor if no static method worked
    if (!parameters) {
      try {
        parameters = new lib.Parameters();
        console.log('Success with new Parameters()');
      } catch (e) {
        console.log('new Parameters() failed:', e.message);
      }
    }
  }

  // Method 3: Check if ErgoStateContext can be created without Parameters (older API)
  try {
    if (parameters) {
      console.log('Creating ErgoStateContext with Parameters');
      stateContext = new lib.ErgoStateContext(preHeader, blockHeaders, parameters);
    } else {
      console.log('Creating ErgoStateContext without Parameters (2-arg)');
      stateContext = new lib.ErgoStateContext(preHeader, blockHeaders);
    }
  } catch (err) {
    console.error('ErgoStateContext creation failed:', err.message);
    // Last resort: try to find any way to create state context
    console.error('Full lib keys:', Object.keys(lib).slice(0, 50));
    throw err;
  }
  
  return { stateContext, currentHeight: headersData[0].height };
}


// ===== Transaction Building ===== //

/**
 * Build an unsigned transaction for posting a score
 * 
 * ===== Transaction Structure ===== //
 * 
 *   INPUTS                           OUTPUTS
 *   ┌─────────────────────┐         ┌─────────────────────┐
 *   │ Server Wallet UTXO  │         │ Score Box           │
 *   │                     │         │ • 0.001 ERG         │
 *   │ Value: X ERG        │ ──────► │ • R4-R9: score data │
 *   │                     │         │ • To: game wallet   │
 *   │                     │         ├─────────────────────┤
 *   │                     │         │ Change Box          │
 *   │                     │         │ • X - 0.0021 ERG    │
 *   │                     │         │ • To: server wallet │
 *   │                     │         ├─────────────────────┤
 *   │                     │         │ Miner Fee           │
 *   │                     │         │ • 0.0011 ERG        │
 *   └─────────────────────┘         └─────────────────────┘
 * 
 * ===== Register Encoding ===== //
 * 
 * Score data is stored in registers R4-R9:
 * 
 *   R4: game       (string → Coll[Byte])  "solitaire"
 *   R5: rank       (string → Coll[Byte])  "1st", "2nd", "3rd"
 *   R6: gameId     (string → Coll[Byte])  "SOL-1234567-abc123"
 *   R7: score      (number → Long)         42000
 *   R8: timeSeconds(number → Long)         180
 *   R9: playerName|date (string → Coll[Byte])  "Alice|2024-01-15"
 * 
 * Why combine player and date in R9?
 * - Only 6 registers available (R4-R9)
 * - Date is fixed-length, easy to parse
 * - Pipe separator is unambiguous
 * 
 * @param {Object} lib - ergo-lib module reference
 * @param {string} senderAddress - Server wallet address
 * @param {string} recipientAddress - Game wallet address  
 * @param {Array} inputBoxes - UTXOs to spend
 * @param {number} currentHeight - Current blockchain height
 * @param {Object} scoreData - Score information to encode
 * @returns {Object} Unsigned transaction as JSON
 */
function buildScoreTransaction(lib, senderAddress, recipientAddress, inputBoxes, currentHeight, scoreData) {
  
  // ===== Convert Input Boxes to ergo-lib Format ===== //
  const inputBoxesErgo = lib.ErgoBoxes.empty();
  for (const box of inputBoxes) {
    inputBoxesErgo.add(lib.ErgoBox.from_json(JSON.stringify(box)));
  }
  
  // ===== Validate Sufficient Funds ===== //
  const totalInput = inputBoxes.reduce(
    (sum, box) => sum + BigInt(box.value), 
    0n
  );
  const requiredAmount = MIN_BOX_VALUE + MIN_FEE;
  
  if (totalInput < requiredAmount) {
    throw new Error(
      `Insufficient funds. Have: ${totalInput} nanoERG, need: ${requiredAmount} nanoERG`
    );
  }
  
  // ===== Build Score Box Output ===== //
  const outputValue = lib.BoxValue.from_i64(
    lib.I64.from_str(MIN_BOX_VALUE.toString())
  );
  const recipientAddr = lib.Address.from_base58(recipientAddress);
  
  const outputBuilder = new lib.ErgoBoxCandidateBuilder(
    outputValue,
    lib.Contract.pay_to_address(recipientAddr),
    currentHeight
  );
  
  // ===== Set Register Values ===== //
  // Each register needs to be encoded in Ergo's serialization format
  
  // R4: Game name (string as byte array)
  // Constant.from_byte_array creates a Coll[Byte] constant
  outputBuilder.set_register_value(
    lib.NonMandatoryRegisterId.R4,
    lib.Constant.from_byte_array(
      Array.from(Buffer.from(scoreData.game, 'utf-8'))
    )
  );
  
  // R5: Rank (string as byte array)
  outputBuilder.set_register_value(
    lib.NonMandatoryRegisterId.R5,
    lib.Constant.from_byte_array(
      Array.from(Buffer.from(scoreData.rank, 'utf-8'))
    )
  );
  
  // R6: Game ID (string as byte array)
  outputBuilder.set_register_value(
    lib.NonMandatoryRegisterId.R6,
    lib.Constant.from_byte_array(
      Array.from(Buffer.from(scoreData.gameId, 'utf-8'))
    )
  );
  
  // R7: Score (as Long integer)
  // Constant.from_i64 creates a Long constant
  outputBuilder.set_register_value(
    lib.NonMandatoryRegisterId.R7,
    lib.Constant.from_i64(
      lib.I64.from_str(scoreData.score.toString())
    )
  );
  
  // R8: Time in seconds (as Long integer)
  outputBuilder.set_register_value(
    lib.NonMandatoryRegisterId.R8,
    lib.Constant.from_i64(
      lib.I64.from_str(scoreData.timeSeconds.toString())
    )
  );
  
  // R9: Player name and date combined (string as byte array)
  const r9Data = `${scoreData.playerName}|${scoreData.date}`;
  outputBuilder.set_register_value(
    lib.NonMandatoryRegisterId.R9,
    lib.Constant.from_byte_array(
      Array.from(Buffer.from(r9Data, 'utf-8'))
    )
  );
  
  // ===== Finalize Output Box ===== //
  const outputBox = outputBuilder.build();
  const outputCandidates = new lib.ErgoBoxCandidates(outputBox);
  
  // ===== Select Input Boxes ===== //
  // SimpleBoxSelector automatically picks boxes to cover the target amount
  const targetBalance = lib.BoxValue.from_i64(
    lib.I64.from_str(requiredAmount.toString())
  );
  const boxSelector = new lib.SimpleBoxSelector();
  const selection = boxSelector.select(
    inputBoxesErgo, 
    targetBalance, 
    new lib.Tokens()  // No tokens needed
  );
  
  // ===== Build Transaction ===== //
  // TxBuilder creates the complete transaction structure:
  // - Uses selected inputs
  // - Adds our output box
  // - Calculates and adds change output
  // - Adds miner fee output
  const changeAddress = lib.Address.from_base58(senderAddress);
  const feeAmount = lib.BoxValue.from_i64(
    lib.I64.from_str(MIN_FEE.toString())
  );
  
  const txBuilder = lib.TxBuilder.new(
    selection,        // Selected input boxes
    outputCandidates, // Our output boxes
    currentHeight,    // For transaction validity
    feeAmount,        // Miner fee
    changeAddress     // Where to send leftover ERG
  );
  
  const unsignedTx = txBuilder.build();
  
  // Return as JSON for signing
  return JSON.parse(unsignedTx.to_json());
}


// ===== Transaction Signing ===== //

/**
 * Sign an unsigned transaction
 * 
 * ===== How Signing Works ===== //
 * 
 * 1. Create a Wallet from our SecretKey
 * 2. Provide the state context (blockchain state)
 * 3. Provide the input boxes (to verify we own them)
 * 4. Wallet produces cryptographic proofs for each input
 * 
 * ===== The "Not Enough Witnesses" Error ===== //
 * 
 * This common error means the wallet doesn't have the private key
 * for one or more input boxes. Causes:
 * 
 * - Wrong mnemonic
 * - Wrong derivation path
 * - Input boxes belong to different address
 * 
 * We avoid this by explicitly deriving the key using EIP-3 path
 * and creating the wallet with Wallet.from_secrets().
 * 
 * ===== Why Not Wallet.from_mnemonic()? ===== //
 * 
 * Wallet.from_mnemonic() uses an internal derivation that may not
 * match EIP-3. By manually deriving the key and using from_secrets(),
 * we guarantee the wallet has the correct key.
 * 
 * @param {Object} lib - ergo-lib module reference
 * @param {Object} secretKey - SecretKey object from initServerWallet
 * @param {Object} unsignedTx - Unsigned transaction JSON
 * @param {Array} inputBoxes - Input box objects from Explorer API
 * @returns {Promise<Object>} Signed transaction as JSON
 */
async function signTransaction(lib, secretKey, unsignedTx, inputBoxes) {
  
  // ===== Create State Context ===== //
  const { stateContext } = await createStateContext(lib);
  
  // ===== Create Wallet from Secret Key ===== //
  // SecretKeys is a collection - we add our single key to it
  const secretKeys = new lib.SecretKeys();
  secretKeys.add(secretKey);
  
  // Wallet.from_secrets creates a wallet that can sign with these keys
  const wallet = lib.Wallet.from_secrets(secretKeys);
  
  // ===== Parse Unsigned Transaction ===== //
  const unsignedTxObj = lib.UnsignedTransaction.from_json(
    JSON.stringify(unsignedTx)
  );
  
  // ===== Convert Input Boxes ===== //
  // ergo-lib needs boxes in its own format
  const inputBoxesErgo = lib.ErgoBoxes.empty();
  for (const box of inputBoxes) {
    inputBoxesErgo.add(lib.ErgoBox.from_json(JSON.stringify(box)));
  }
  
  // Empty data inputs (we don't use these for score transactions)
  const dataBoxesErgo = lib.ErgoBoxes.empty();
  
  // ===== Sign Transaction ===== //
  // This creates cryptographic proofs for each input
  const signedTx = wallet.sign_transaction(
    stateContext,
    unsignedTxObj,
    inputBoxesErgo,
    dataBoxesErgo
  );
  
  return JSON.parse(signedTx.to_json());
}


// ===== Transaction Submission ===== //

/**
 * Submit a signed transaction to the Ergo network
 * 
 * ===== The Submission Process ===== //
 * 
 * 1. Send signed TX to Explorer API's mempool endpoint
 * 2. Node validates the transaction:
 *    - All signatures valid?
 *    - Inputs not already spent?
 *    - Outputs valid (positive values, valid scripts)?
 * 3. If valid, TX enters mempool (pending transactions)
 * 4. Miners include it in next block (~2 minutes)
 * 5. Once in a block, TX is confirmed
 * 
 * The API returns immediately with TX ID (doesn't wait for confirmation).
 * 
 * ===== Possible Failures ===== //
 * 
 * - Invalid signature: Wrong private key, corrupted data
 * - Double spend: Input already spent in another TX
 * - Insufficient funds: Inputs < outputs + fee
 * - Invalid box values: Below minimum or negative
 * - Rate limited: Too many requests to API
 * 
 * @param {Object} signedTx - Signed transaction object
 * @returns {Promise<{id: string}>} Transaction ID
 */
export async function submitTransaction(signedTx) {
  const response = await fetch(
    `${ERGO_EXPLORER}/mempool/transactions/submit`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signedTx)
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transaction submission failed: ${error}`);
  }
  
  return response.json();
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
 *   │ 2. Fetch blockchain state                            │
 *   │    └─► Current height and available UTXOs            │
 *   ├──────────────────────────────────────────────────────┤
 *   │ 3. Build unsigned transaction                        │
 *   │    └─► Creates score box with register data          │
 *   ├──────────────────────────────────────────────────────┤
 *   │ 4. Sign transaction                                  │
 *   │    └─► Proves ownership of input boxes               │
 *   ├──────────────────────────────────────────────────────┤
 *   │ 5. Submit to network                                 │
 *   │    └─► Returns txId, miners will include in block    │
 *   └──────────────────────────────────────────────────────┘
 * 
 * ===== Score Data Format ===== //
 * 
 * {
 *   game: "solitaire",           // Game identifier
 *   rank: "1st",                 // Daily placement
 *   gameId: "SOL-1234567-abc",   // Unique game ID (includes RNG seed)
 *   score: 42000,                // Score value
 *   timeSeconds: 180,            // Completion time
 *   playerName: "Alice",         // Display name
 *   date: "2024-01-15"           // Date string (YYYY-MM-DD)
 * }
 * 
 * @param {Object} scoreData - Score data to post
 * @returns {Promise<string>} Transaction ID
 */
export async function postScoreToChain(scoreData) {
  try {
    // Step 1: Initialize wallet
    const { address, secretKey, ergolib: lib } = await initServerWallet();
    
    console.log(`Server wallet: ${address}`);
    
    // Step 2: Get blockchain state
    const [currentHeight, utxos] = await Promise.all([
      getCurrentHeight(),
      getUtxos(address)
    ]);
    
    console.log(`Current height: ${currentHeight}`);
    console.log(`Available UTXOs: ${utxos.length}`);
    
    if (utxos.length === 0) {
      throw new Error('Server wallet has no UTXOs. Please fund it with ERG.');
    }
    
    // Calculate balance
    const balance = utxos.reduce((sum, box) => sum + BigInt(box.value), 0n);
    console.log(`Balance: ${Number(balance) / 1e9} ERG`);
    
    // Step 3: Build transaction
    const gameAddress = getGameAddress();
    const unsignedTx = buildScoreTransaction(
      lib,
      address,
      gameAddress,
      utxos,
      currentHeight,
      scoreData
    );
    
    console.log(`Transaction built with ${unsignedTx.inputs.length} inputs, ${unsignedTx.outputs.length} outputs`);
    
    // Step 4: Sign transaction
    const signedTx = await signTransaction(lib, secretKey, unsignedTx, utxos);
    
    console.log(`Transaction signed: ${signedTx.id}`);
    
    // Step 5: Submit to network
    const result = await submitTransaction(signedTx);
    
    console.log(`✓ Score posted to chain: ${result.id}`);
    console.log(`  Game: ${scoreData.game}`);
    console.log(`  Rank: ${scoreData.rank}`);
    console.log(`  Score: ${scoreData.score}`);
    console.log(`  Explorer: https://explorer.ergoplatform.com/en/transactions/${result.id}`);
    
    return result.id;
    
  } catch (error) {
    console.error('✗ Failed to post score:', error.message);
    throw error;
  }
}

/**
 * Post multiple scores in a single transaction (batch)
 * 
 * More efficient for daily top 3:
 * - Single transaction fee instead of 3
 * - Single blockchain query
 * - Atomic: all scores posted or none
 * 
 * ===== Transaction Structure for Batch ===== //
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
 * Cost for 3 scores: ~0.0041 ERG
 * - 0.001 ERG × 3 locked in score boxes
 * - 0.0011 ERG miner fee
 * 
 * vs individual: ~0.0063 ERG (0.0021 × 3)
 * Savings: ~35%
 * 
 * @param {Array<Object>} scores - Array of score data objects
 * @returns {Promise<string>} Transaction ID
 */
export async function postScoresBatch(scores) {
  try {
    // Initialize wallet
    const { address, secretKey, ergolib: lib } = await initServerWallet();
    
    // Get blockchain state
    const [currentHeight, utxos] = await Promise.all([
      getCurrentHeight(),
      getUtxos(address)
    ]);
    
    if (utxos.length === 0) {
      throw new Error('Server wallet has no UTXOs. Please fund it with ERG.');
    }
    
    // Validate sufficient funds for all scores
    const totalInput = utxos.reduce((sum, box) => sum + BigInt(box.value), 0n);
    const requiredAmount = MIN_BOX_VALUE * BigInt(scores.length) + MIN_FEE;
    
    if (totalInput < requiredAmount) {
      throw new Error(
        `Insufficient funds for ${scores.length} scores. ` +
        `Have: ${totalInput} nanoERG, need: ${requiredAmount} nanoERG`
      );
    }
    
    const gameAddress = getGameAddress();
    const recipientAddr = lib.Address.from_base58(gameAddress);
    const changeAddress = lib.Address.from_base58(address);
    
    // Convert input boxes
    const inputBoxesErgo = lib.ErgoBoxes.empty();
    for (const box of utxos) {
      inputBoxesErgo.add(lib.ErgoBox.from_json(JSON.stringify(box)));
    }
    
    // Build output box for each score
    const outputBoxes = [];
    
    for (const scoreData of scores) {
      const outputValue = lib.BoxValue.from_i64(
        lib.I64.from_str(MIN_BOX_VALUE.toString())
      );
      
      const builder = new lib.ErgoBoxCandidateBuilder(
        outputValue,
        lib.Contract.pay_to_address(recipientAddr),
        currentHeight
      );
      
      // Set registers
      builder.set_register_value(
        lib.NonMandatoryRegisterId.R4,
        lib.Constant.from_byte_array(
          Array.from(Buffer.from(scoreData.game, 'utf-8'))
        )
      );
      builder.set_register_value(
        lib.NonMandatoryRegisterId.R5,
        lib.Constant.from_byte_array(
          Array.from(Buffer.from(scoreData.rank, 'utf-8'))
        )
      );
      builder.set_register_value(
        lib.NonMandatoryRegisterId.R6,
        lib.Constant.from_byte_array(
          Array.from(Buffer.from(scoreData.gameId, 'utf-8'))
        )
      );
      builder.set_register_value(
        lib.NonMandatoryRegisterId.R7,
        lib.Constant.from_i64(lib.I64.from_str(scoreData.score.toString()))
      );
      builder.set_register_value(
        lib.NonMandatoryRegisterId.R8,
        lib.Constant.from_i64(lib.I64.from_str(scoreData.timeSeconds.toString()))
      );
      builder.set_register_value(
        lib.NonMandatoryRegisterId.R9,
        lib.Constant.from_byte_array(
          Array.from(Buffer.from(`${scoreData.playerName}|${scoreData.date}`, 'utf-8'))
        )
      );
      
      outputBoxes.push(builder.build());
    }
    
    // Create output candidates with all score boxes
    // Note: ErgoBoxCandidates takes first box in constructor, add rest with .add()
    const outputCandidates = new lib.ErgoBoxCandidates(outputBoxes[0]);
    for (let i = 1; i < outputBoxes.length; i++) {
      outputCandidates.add(outputBoxes[i]);
    }
    
    // Select inputs
    const targetBalance = lib.BoxValue.from_i64(
      lib.I64.from_str(requiredAmount.toString())
    );
    const boxSelector = new lib.SimpleBoxSelector();
    const selection = boxSelector.select(
      inputBoxesErgo, 
      targetBalance, 
      new lib.Tokens()
    );
    
    // Build transaction
    const feeAmount = lib.BoxValue.from_i64(
      lib.I64.from_str(MIN_FEE.toString())
    );
    
    const txBuilder = lib.TxBuilder.new(
      selection,
      outputCandidates,
      currentHeight,
      feeAmount,
      changeAddress
    );
    
    const unsignedTx = JSON.parse(txBuilder.build().to_json());
    
    // Sign
    const signedTx = await signTransaction(lib, secretKey, unsignedTx, utxos);
    
    // Submit
    const result = await submitTransaction(signedTx);
    
    console.log(`✓ Batch posted to chain: ${result.id}`);
    console.log(`  Scores: ${scores.length}`);
    scores.forEach(s => console.log(`    ${s.rank}: ${s.playerName} - ${s.score}`));
    
    return result.id;
    
  } catch (error) {
    console.error('✗ Failed to post batch:', error.message);
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
  // Initialization
  loadErgoLib,
  initServerWallet,
  getGameAddress,
  
  // Blockchain queries
  getCurrentHeight,
  getUtxos,
  getBalance,
  
  // Transaction operations
  submitTransaction,
  postScoreToChain,
  postScoresBatch
};
