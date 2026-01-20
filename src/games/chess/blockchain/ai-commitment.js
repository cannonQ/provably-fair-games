import CryptoJS from 'crypto-js';
import { getLatestBlock } from '../../../blockchain/ergo-api';

/**
 * Creates a cryptographic commitment to AI settings
 * This ensures the AI difficulty was set before the game started
 */
export async function createAICommitment(aiSettings, playerSeed) {
  try {
    const block = await getLatestBlock();

    // Sort keys to ensure consistent JSON serialization
    const sortedSettings = {};
    Object.keys(aiSettings).sort().forEach(key => {
      sortedSettings[key] = aiSettings[key];
    });

    const settingsJson = JSON.stringify(sortedSettings);
    const preimage = `${settingsJson}|${block.blockHash}|${playerSeed}`;

    // Create SHA256 hash commitment
    const commitment = CryptoJS.SHA256(preimage).toString();

    return {
      commitment,
      blockHash: block.blockHash,
      blockHeight: block.blockHeight,
      playerSeed,
      timestamp: block.timestamp,
      // Hidden data that will be revealed after the game
      _hidden: {
        aiSettings: sortedSettings,
        preimage
      }
    };
  } catch (error) {
    console.error('Error creating AI commitment:', error);
    throw new Error('Failed to create AI commitment');
  }
}

/**
 * Verifies that the AI settings match the original commitment
 */
export function verifyCommitment(commitment, aiSettings, blockHash, playerSeed) {
  try {
    // Sort keys to ensure consistent JSON serialization
    const sortedSettings = {};
    Object.keys(aiSettings).sort().forEach(key => {
      sortedSettings[key] = aiSettings[key];
    });

    const settingsJson = JSON.stringify(sortedSettings);
    const preimage = `${settingsJson}|${blockHash}|${playerSeed}`;

    // Calculate hash
    const calculatedCommitment = CryptoJS.SHA256(preimage).toString();

    return {
      isValid: calculatedCommitment === commitment,
      calculatedCommitment,
      providedCommitment: commitment,
      preimage
    };
  } catch (error) {
    console.error('Error verifying commitment:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
}

/**
 * Helper to create a simple hash for display
 */
export function sha256(text) {
  return CryptoJS.SHA256(text).toString();
}
