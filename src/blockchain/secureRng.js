/**
 * Secure RNG Client Library
 *
 * Implements commit-reveal protocol for provably fair games.
 *
 * Architecture:
 * 1. Server commits secret (hash) BEFORE blockchain fetch
 * 2. Client fetches blockchain data AFTER commitment
 * 3. Server combines secret + blockchain for RNG (secret hidden)
 * 4. Server reveals secret at game end for verification
 *
 * Security Properties:
 * - Player can't cheat (doesn't know server secret)
 * - Server can't cheat (committed to hash, blockchain anchored)
 * - Fully verifiable after reveal
 * - Preserves blockchain tie-in (uses Ergo block data)
 */

import { getLatestBlock } from './ergo-api';
import CryptoJS from 'crypto-js';

/**
 * Start a secure game session
 *
 * Flow:
 * 1. Server commits secret (returns hash only)
 * 2. Client fetches blockchain data (after commitment)
 * 3. Returns both for game initialization
 *
 * @param {string} gameType - Game type ('backgammon', 'blackjack', etc.)
 * @returns {Promise<{sessionId, secretHash, blockData, timestamp}>}
 */
export async function startSecureGame(gameType) {
  try {
    // Step 1: Request server commitment (server generates secret)
    const startResponse = await fetch('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType })
    });

    if (!startResponse.ok) {
      const error = await startResponse.json();
      throw new Error(error.error || 'Failed to start secure session');
    }

    const { sessionId, secretHash, timestamp } = await startResponse.json();

    // Step 2: NOW fetch blockchain data (after server commitment)
    const blockData = await getLatestBlock();

    // Step 3: Store session data for verification later
    const sessionData = {
      sessionId,
      secretHash,
      gameType,
      blockData,
      commitTimestamp: timestamp,
      purposes: [] // Track all random requests for verification
    };

    localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));

    return {
      sessionId,
      secretHash,
      blockData,
      timestamp
    };
  } catch (error) {
    console.error('Failed to start secure game:', error);
    throw error;
  }
}

/**
 * Get secure random value for specific purpose
 *
 * Combines server secret + blockchain data + purpose string.
 * Server secret remains hidden - client only receives result.
 *
 * @param {string} sessionId - Session ID from startSecureGame
 * @param {string} purpose - Unique purpose string (e.g., 'roll-1', 'shuffle-deck')
 * @returns {Promise<string>} 64-char hex random value
 */
export async function getSecureRandom(sessionId, purpose) {
  try {
    // Retrieve session data from localStorage
    const sessionDataStr = localStorage.getItem(`session_${sessionId}`);

    if (!sessionDataStr) {
      throw new Error('Session not found in local storage');
    }

    const sessionData = JSON.parse(sessionDataStr);

    // Request random from server (server combines secret + blockchain)
    const response = await fetch('/api/game/random', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        blockData: sessionData.blockData,
        purpose
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get random value');
    }

    const { random } = await response.json();

    // Track purpose for verification
    sessionData.purposes.push({ purpose, random });
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));

    return random;
  } catch (error) {
    console.error('Failed to get secure random:', error);
    throw error;
  }
}

/**
 * End session and verify commitment
 *
 * Server reveals secret, client verifies hash matches commitment.
 *
 * @param {string} sessionId - Session ID
 * @param {object} gameData - Final game data to store (optional)
 * @returns {Promise<{verified, serverSecret, blockData, ...}>}
 */
export async function endSecureSession(sessionId, gameData = null) {
  try {
    // Request reveal from server
    const response = await fetch('/api/game/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, gameData })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to end session');
    }

    const revealData = await response.json();
    const { serverSecret, secretHash } = revealData;

    // Verify commitment: SHA256(serverSecret) === secretHash
    const calculatedHash = CryptoJS.SHA256(serverSecret).toString();

    if (calculatedHash !== secretHash) {
      // CRITICAL: Server cheated by changing secret!
      console.error('🚨 VERIFICATION FAILED!');
      console.error('Expected hash:', secretHash);
      console.error('Calculated hash:', calculatedHash);
      throw new Error('🚨 VERIFICATION FAILED! Server changed secret after commitment!');
    }

    // Store revealed data for verification page
    const sessionDataStr = localStorage.getItem(`session_${sessionId}`);
    if (sessionDataStr) {
      const sessionData = JSON.parse(sessionDataStr);
      sessionData.revealed = revealData;
      sessionData.verified = true;
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
    }

    return {
      ...revealData,
      verified: true
    };
  } catch (error) {
    console.error('Failed to end session:', error);
    throw error;
  }
}

/**
 * Verify a random value matches the revealed secret
 * (Used in verification pages to replay game)
 *
 * @param {string} serverSecret - Revealed server secret
 * @param {object} blockData - Blockchain data
 * @param {string} purpose - Purpose string
 * @returns {string} Expected random value (64-char hex)
 */
export function verifyRandomValue(serverSecret, blockData, purpose) {
  // Combine same way server does
  const components = [
    serverSecret,
    blockData.blockHash,
    blockData.txHash || '',
    String(blockData.timestamp || ''),
    String(blockData.txIndex || ''),
    purpose
  ];

  const combinedInput = components.join(':');
  return CryptoJS.SHA256(combinedInput).toString();
}

/**
 * Get session data from localStorage
 *
 * @param {string} sessionId - Session ID
 * @returns {object|null} Session data or null if not found
 */
export function getSessionData(sessionId) {
  const sessionDataStr = localStorage.getItem(`session_${sessionId}`);
  return sessionDataStr ? JSON.parse(sessionDataStr) : null;
}

/**
 * Clear session data from localStorage
 *
 * @param {string} sessionId - Session ID
 */
export function clearSessionData(sessionId) {
  localStorage.removeItem(`session_${sessionId}`);
}
