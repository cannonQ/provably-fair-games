import React, { useState } from 'react';
import { verifyColorAssignment } from '../blockchain/color-assignment';
import { verifyCommitment } from '../blockchain/ai-commitment';

/**
 * Verification panel showing blockchain proofs
 */
function VerificationPanel({ gameData }) {
  const [expanded, setExpanded] = useState(false);

  if (!gameData) {
    return null;
  }

  const {
    colorAssignment,
    aiCommitment,
    aiSettings,
    moves,
    result
  } = gameData;

  // Verify color assignment
  const colorVerification = colorAssignment ? verifyColorAssignment(
    colorAssignment.blockHash,
    colorAssignment.userSeed,
    colorAssignment.playerColor
  ) : null;

  // Verify AI commitment
  const commitmentVerification = aiCommitment && aiSettings ? verifyCommitment(
    aiCommitment.commitment,
    aiSettings,
    aiCommitment.blockHash,
    aiCommitment.playerSeed
  ) : null;

  return (
    <div className="verification-panel">
      <button
        className="verification-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="verification-badge">
          {colorVerification?.isValid && commitmentVerification?.isValid ? '✓' : '⚠'}
          Provably Fair
        </span>
        <span className="toggle-icon">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="verification-details">
          <div className="verification-section">
            <h4>Color Assignment Verification</h4>
            {colorAssignment && (
              <>
                <div className="verification-item">
                  <span className="label">Block Height:</span>
                  <span className="value">{colorAssignment.blockHeight}</span>
                </div>
                <div className="verification-item">
                  <span className="label">Block Hash:</span>
                  <span className="value monospace">{colorAssignment.blockHash.substring(0, 16)}...</span>
                </div>
                <div className="verification-item">
                  <span className="label">User Seed:</span>
                  <span className="value">{colorAssignment.userSeed}</span>
                </div>
                <div className="verification-item">
                  <span className="label">Assigned Color:</span>
                  <span className="value">{colorAssignment.playerColor}</span>
                </div>
                <div className="verification-item">
                  <span className="label">Verification:</span>
                  <span className={`value ${colorVerification?.isValid ? 'valid' : 'invalid'}`}>
                    {colorVerification?.isValid ? '✓ Valid' : '✗ Invalid'}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="verification-section">
            <h4>AI Commitment Verification</h4>
            {aiCommitment && (
              <>
                <div className="verification-item">
                  <span className="label">Commitment Hash:</span>
                  <span className="value monospace">{aiCommitment.commitment.substring(0, 16)}...</span>
                </div>
                <div className="verification-item">
                  <span className="label">Block Hash:</span>
                  <span className="value monospace">{aiCommitment.blockHash.substring(0, 16)}...</span>
                </div>
                {aiSettings && (
                  <>
                    <div className="verification-item">
                      <span className="label">AI Skill Level:</span>
                      <span className="value">{aiSettings.skillLevel}</span>
                    </div>
                    <div className="verification-item">
                      <span className="label">Target ELO:</span>
                      <span className="value">{aiSettings.targetElo}</span>
                    </div>
                    <div className="verification-item">
                      <span className="label">Move Time:</span>
                      <span className="value">{aiSettings.moveTime}ms</span>
                    </div>
                  </>
                )}
                <div className="verification-item">
                  <span className="label">Verification:</span>
                  <span className={`value ${commitmentVerification?.isValid ? 'valid' : 'invalid'}`}>
                    {commitmentVerification?.isValid ? '✓ Valid' : '✗ Invalid'}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="verification-section">
            <h4>Game Summary</h4>
            <div className="verification-item">
              <span className="label">Total Moves:</span>
              <span className="value">{moves?.length || 0}</span>
            </div>
            <div className="verification-item">
              <span className="label">Result:</span>
              <span className="value">{result?.result || 'In Progress'}</span>
            </div>
            {result?.reason && (
              <div className="verification-item">
                <span className="label">Reason:</span>
                <span className="value">{result.reason}</span>
              </div>
            )}
          </div>

          <div className="verification-footer">
            <p>
              This game uses Ergo blockchain data to prove fairness.
              Color assignment and AI settings were determined before the game started
              and cannot be manipulated.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerificationPanel;
