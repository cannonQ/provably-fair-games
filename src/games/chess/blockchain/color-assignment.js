import { getLatestBlock } from '../../../blockchain/ergo-api';

/**
 * Determines player color based on blockchain hash
 * Uses block hash + user seed to ensure randomness
 */
export async function determinePlayerColor(userSeed = Date.now()) {
  try {
    const block = await getLatestBlock();

    // Combine block hash and user seed
    const combined = block.blockHash + userSeed.toString();

    // Calculate sum of all character codes
    const sum = combined.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

    // Even = white, Odd = black
    const playerColor = sum % 2 === 0 ? 'white' : 'black';

    return {
      playerColor,
      blockHeight: block.blockHeight,
      blockHash: block.blockHash,
      userSeed,
      sum, // Include for verification
      timestamp: block.timestamp
    };
  } catch (error) {
    console.error('Error determining player color:', error);
    throw new Error('Failed to determine player color from blockchain');
  }
}

/**
 * Verifies that the color assignment was correct
 */
export function verifyColorAssignment(blockHash, userSeed, claimedColor) {
  const combined = blockHash + userSeed.toString();
  const sum = combined.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const expectedColor = sum % 2 === 0 ? 'white' : 'black';

  return {
    isValid: expectedColor === claimedColor,
    expectedColor,
    claimedColor,
    sum
  };
}
