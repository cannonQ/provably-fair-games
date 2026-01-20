/**
 * Maps ELO rating to Stockfish engine settings
 * Returns skill level (0-20), move time (ms), and depth
 */
export function eloToSettings(targetElo, mode = 'match') {
  // Apply mode adjustments
  let adjustedElo = targetElo;

  if (mode === 'challenge') {
    adjustedElo = targetElo + 200;
  } else if (mode === 'crush') {
    adjustedElo = 3000; // Max strength
  } else if (mode === 'easy') {
    adjustedElo = targetElo - 200;
  }

  // Clamp to valid range
  adjustedElo = Math.max(400, Math.min(3000, adjustedElo));

  // Map ELO to Stockfish settings
  let settings;

  if (adjustedElo < 600) {
    settings = { skillLevel: 0, moveTime: 50, depth: 1 };
  } else if (adjustedElo < 800) {
    settings = { skillLevel: 3, moveTime: 100, depth: 3 };
  } else if (adjustedElo < 1000) {
    settings = { skillLevel: 6, moveTime: 200, depth: 5 };
  } else if (adjustedElo < 1200) {
    settings = { skillLevel: 9, moveTime: 500, depth: 8 };
  } else if (adjustedElo < 1400) {
    settings = { skillLevel: 12, moveTime: 1000, depth: 10 };
  } else if (adjustedElo < 1600) {
    settings = { skillLevel: 14, moveTime: 1500, depth: 12 };
  } else if (adjustedElo < 1800) {
    settings = { skillLevel: 16, moveTime: 2000, depth: 14 };
  } else if (adjustedElo < 2000) {
    settings = { skillLevel: 18, moveTime: 3000, depth: 16 };
  } else if (adjustedElo < 2200) {
    settings = { skillLevel: 19, moveTime: 5000, depth: 20 };
  } else {
    settings = { skillLevel: 20, moveTime: 10000, depth: null }; // Full strength
  }

  return {
    ...settings,
    targetElo: adjustedElo,
    originalElo: targetElo,
    mode
  };
}

/**
 * Gets descriptive text for ELO rating
 */
export function getEloDescription(elo) {
  if (elo < 600) return 'Beginner';
  if (elo < 1000) return 'Novice';
  if (elo < 1400) return 'Intermediate';
  if (elo < 1800) return 'Advanced';
  if (elo < 2000) return 'Expert';
  if (elo < 2200) return 'Master';
  if (elo < 2400) return 'International Master';
  return 'Grandmaster';
}

/**
 * Easter egg messages for special ELO values
 */
export function getEasterEgg(elo) {
  if (elo === 1337) return "Nice. 😎";
  if (elo === 69 || elo === 420) return "Very mature. Setting to 800.";
  if (elo >= 2800) return "Bold claim! Let's see what you've got 😏";
  return null;
}

/**
 * Adjusts ELO based on easter eggs
 */
export function applyEasterEggAdjustment(elo) {
  if (elo === 69 || elo === 420) return 800;
  return elo;
}
