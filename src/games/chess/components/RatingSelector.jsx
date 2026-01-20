import React, { useState } from 'react';
import { getEloDescription, getEasterEgg, applyEasterEggAdjustment } from '../stockfish/elo-to-settings';

/**
 * Rating selector component with quick options and easter eggs
 */
function RatingSelector({ onStart }) {
  const [selectedOption, setSelectedOption] = useState('custom');
  const [customElo, setCustomElo] = useState(1400);
  const [mode, setMode] = useState('match');
  const [easterEggMessage, setEasterEggMessage] = useState(null);

  const quickOptions = [
    { id: 'beginner', label: "I'm new", elo: 600 },
    { id: 'casual', label: 'Casual', elo: 1000 },
    { id: 'intermediate', label: 'I know what I\'m doing', elo: 1400 },
    { id: 'custom', label: 'Enter rating', elo: null }
  ];

  const aiModes = [
    { id: 'match', label: 'Match my level', description: 'AI plays at your skill level' },
    { id: 'challenge', label: 'Challenge me', description: '+200 ELO difficulty' },
    { id: 'crush', label: 'Crush me', description: 'Full strength Stockfish' },
    { id: 'easy', label: 'Let me win', description: '-200 ELO difficulty' }
  ];

  const handleEloChange = (value) => {
    const elo = parseInt(value);
    setCustomElo(elo);

    // Check for easter eggs
    const easterEgg = getEasterEgg(elo);
    setEasterEggMessage(easterEgg);
  };

  const handleStart = () => {
    let finalElo;

    if (selectedOption === 'custom') {
      finalElo = applyEasterEggAdjustment(customElo);
    } else {
      const option = quickOptions.find(o => o.id === selectedOption);
      finalElo = option.elo;
    }

    onStart(finalElo, mode);
  };

  const getCurrentElo = () => {
    if (selectedOption === 'custom') {
      return customElo;
    }
    const option = quickOptions.find(o => o.id === selectedOption);
    return option?.elo || 1400;
  };

  const currentElo = getCurrentElo();

  return (
    <div className="rating-selector">
      <h2>Choose Your Challenge</h2>

      <div className="quick-options">
        {quickOptions.map(option => (
          <button
            key={option.id}
            className={`quick-option ${selectedOption === option.id ? 'selected' : ''}`}
            onClick={() => setSelectedOption(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {selectedOption === 'custom' && (
        <div className="custom-elo">
          <div className="elo-input-group">
            <label>Your Rating (ELO)</label>
            <input
              type="number"
              min="400"
              max="2800"
              value={customElo}
              onChange={(e) => handleEloChange(e.target.value)}
              className="elo-input"
            />
            <input
              type="range"
              min="400"
              max="2800"
              value={customElo}
              onChange={(e) => handleEloChange(e.target.value)}
              className="elo-slider"
            />
          </div>
          <div className="elo-description">
            {getEloDescription(currentElo)}
          </div>
          {easterEggMessage && (
            <div className="easter-egg-message">
              {easterEggMessage}
            </div>
          )}
        </div>
      )}

      <div className="ai-modes">
        <h3>AI Mode</h3>
        <div className="mode-buttons">
          {aiModes.map(aiMode => (
            <button
              key={aiMode.id}
              className={`mode-button ${mode === aiMode.id ? 'selected' : ''}`}
              onClick={() => setMode(aiMode.id)}
            >
              <div className="mode-label">{aiMode.label}</div>
              <div className="mode-description">{aiMode.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rating-summary">
        <div className="summary-item">
          <span className="summary-label">Your Rating:</span>
          <span className="summary-value">{currentElo}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">AI Mode:</span>
          <span className="summary-value">
            {aiModes.find(m => m.id === mode)?.label}
          </span>
        </div>
      </div>

      <button className="start-game-btn" onClick={handleStart}>
        Start Game
      </button>
    </div>
  );
}

export default RatingSelector;
