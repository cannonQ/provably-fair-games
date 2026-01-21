/**
 * Scorecard Component for Yahtzee
 * Interactive scoring table with upper/lower sections
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  getAvailableScores,
  calculateUpperSum,
  calculateUpperBonus,
  calculateUpperTotal,
  calculateLowerTotal,
  calculateGrandTotal,
  CATEGORY_DISPLAY_NAMES
} from './scoringLogic';

const UPPER_CATEGORIES = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
const LOWER_CATEGORIES = [
  'threeOfAKind', 'fourOfAKind', 'fullHouse',
  'smallStraight', 'largeStraight', 'yahtzee', 'chance'
];

function Scorecard({ scorecard, dice, onScore, canScore, rollsRemaining, activePlayer = 'Player 1' }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const availableScores = canScore ? getAvailableScores(dice, scorecard) : {};
  const upperSum = calculateUpperSum(scorecard);
  const upperBonus = calculateUpperBonus(scorecard);
  const upperTotal = calculateUpperTotal(scorecard);
  const lowerTotal = calculateLowerTotal(scorecard);
  const grandTotal = calculateGrandTotal(scorecard);

  // Check if all available scores are 0 (sacrifice situation)
  // Only show warning after all 3 rolls are used (rollsRemaining === 0)
  const availableValues = Object.values(availableScores);
  const mustSacrifice = canScore && rollsRemaining === 0 && availableValues.length > 0 && availableValues.every(v => v === 0);
  const hasGoodOptions = canScore && availableValues.some(v => v > 0);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
    flexWrap: 'nowrap', // Changed from 'wrap' to keep sections side-by-side
    justifyContent: 'center'
  };

  const sectionStyle = {
    backgroundColor: '#1e293b', // Cypherpunk: dark slate (was white)
    borderRadius: '8px',
    border: '2px solid #334155', // Cypherpunk: slate-700
    overflow: 'hidden',
    minWidth: '300px',
    flex: '1 1 300px',
    maxWidth: '420px' // Wider: increased from 350px for better side-by-side layout
  };

  const headerStyle = {
    backgroundColor: '#0f172a', // Cypherpunk: darker slate (was #333)
    color: '#f1f5f9', // Cypherpunk: slate-100
    padding: '10px 15px',
    fontWeight: 'bold',
    fontSize: '16px',
    textAlign: 'center'
  };

  const getRowStyle = (category, isClickable, isSacrifice) => {
    let backgroundColor = 'transparent';

    if (isClickable) {
      if (hoveredCategory === category) {
        backgroundColor = isSacrifice ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'; // Cypherpunk: red or green hover
      } else if (isSacrifice) {
        backgroundColor = 'rgba(239, 68, 68, 0.1)'; // Cypherpunk: light red for sacrifice rows
      } else if (canScore) {
        backgroundColor = 'rgba(34, 197, 94, 0.1)'; // Cypherpunk: light green for good scoring options
      }
    }

    return {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 15px',
      borderBottom: '1px solid #334155', // Cypherpunk: slate-700 (was #ddd)
      backgroundColor,
      cursor: isClickable ? 'pointer' : 'default',
      transition: 'background-color 0.15s ease',
      borderLeft: isClickable ? (isSacrifice ? '4px solid #ef4444' : '4px solid #22c55e') : '4px solid transparent', // Cypherpunk: red-500 / green-500
      color: '#f1f5f9' // Cypherpunk: slate-100 text
    };
  };

  const totalRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    borderBottom: '1px solid #334155', // Cypherpunk: slate-700
    backgroundColor: '#0f172a', // Cypherpunk: darker slate (was #f5f5f5)
    fontWeight: '600',
    color: '#f1f5f9' // Cypherpunk: slate-100
  };

  const grandTotalStyle = {
    backgroundColor: '#8b5cf6', // Cypherpunk: violet-500 (was blue #1976d2)
    color: '#f1f5f9', // Cypherpunk: slate-100
    padding: '15px 20px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    marginTop: '15px',
    width: '100%',
    maxWidth: '860px', // Wider: increased from 720px to match wider scorecard
    boxSizing: 'border-box',
    border: '2px solid #a78bfa', // Cypherpunk: violet-400 border
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' // Cypherpunk: violet glow
  };

  const renderScoreValue = (category) => {
    const scored = scorecard[category];
    const potential = availableScores[category];

    // Already scored
    if (scored !== null) {
      return (
        <span style={{ color: '#94a3b8', fontWeight: '500' }}> {/* Cypherpunk: slate-400 */}
          {scored}
        </span>
      );
    }

    // Can score this turn
    if (canScore && potential !== undefined) {
      if (potential > 0) {
        return (
          <span style={{ color: '#22c55e', fontWeight: '600' }}> {/* Cypherpunk: green-500 */}
            +{potential}
          </span>
        );
      } else {
        return (
          <span style={{ color: '#ef4444', fontWeight: '600' }}> {/* Cypherpunk: red-500 */}
            0 (sacrifice)
          </span>
        );
      }
    }

    // Not available
    return <span style={{ color: '#64748b' }}>—</span>; {/* Cypherpunk: slate-500 */}
  };

  const handleCategoryClick = (category) => {
    if (scorecard[category] === null && canScore && availableScores[category] !== undefined) {
      onScore(category);
    }
  };

  const renderCategoryRow = (category) => {
    const isScored = scorecard[category] !== null;
    const potential = availableScores[category];
    const isClickable = !isScored && canScore && potential !== undefined;
    const isSacrifice = isClickable && potential === 0;
    
    return (
      <div
        key={category}
        style={getRowStyle(category, isClickable, isSacrifice)}
        onClick={() => handleCategoryClick(category)}
        onMouseEnter={() => setHoveredCategory(category)}
        onMouseLeave={() => setHoveredCategory(null)}
        role={isClickable ? 'button' : 'row'}
        tabIndex={isClickable ? 0 : -1}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
            e.preventDefault();
            handleCategoryClick(category);
          }
        }}
        aria-label={`${CATEGORY_DISPLAY_NAMES[category]}: ${
          isScored ? scorecard[category] : (canScore ? availableScores[category] : 'not available')
        }`}
      >
        <span style={{ color: isScored ? '#94a3b8' : '#f1f5f9', fontWeight: isClickable ? '500' : 'normal' }}> {/* Cypherpunk: slate-400 / slate-100 */}
          {CATEGORY_DISPLAY_NAMES[category]}
          {isClickable && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#94a3b8' }}>← click</span>}
        </span>
        {renderScoreValue(category)}
      </div>
    );
  };

  const bonusNeeded = 63 - upperSum;
  const bonusText = upperBonus > 0 
    ? `+${upperBonus} ✓` 
    : `(${bonusNeeded > 0 ? `${bonusNeeded} more needed` : 'Earned!'})`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Player indicator */}
      <div style={{
        marginBottom: '15px',
        fontSize: '18px',
        fontWeight: '600',
        color: '#f1f5f9' /* Cypherpunk: slate-100 (was #333) */
      }}>
        {activePlayer}'s Scorecard
      </div>

      {/* Sacrifice warning */}
      {mustSacrifice && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)', /* Cypherpunk: red with transparency */
          border: '2px solid #ef4444', /* Cypherpunk: red-500 */
          borderRadius: '8px',
          padding: '12px 20px',
          marginBottom: '15px',
          maxWidth: '860px', // Wider: matches scorecard width
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}>
          <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '4px' }}> {/* Cypherpunk: red-500 */}
            ⚠️ No scoring options available!
          </div>
          <div style={{ color: '#fca5a5', fontSize: '14px' }}> {/* Cypherpunk: red-300 */}
            You must sacrifice a category. Click any red row to take 0 points.
          </div>
        </div>
      )}

      {/* Good options hint */}
      {hasGoodOptions && (
        <div style={{
          backgroundColor: 'rgba(34, 197, 94, 0.15)', /* Cypherpunk: green with transparency */
          border: '2px solid #22c55e', /* Cypherpunk: green-500 */
          borderRadius: '8px',
          padding: '10px 20px',
          marginBottom: '15px',
          maxWidth: '860px', // Wider: matches scorecard width
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center',
          color: '#22c55e', /* Cypherpunk: green-500 */
          fontSize: '14px'
        }}>
          ✓ Click a green row to score points
        </div>
      )}

      <div style={containerStyle}>
        {/* Upper Section */}
        <div style={sectionStyle}>
          <div style={headerStyle}>Upper Section</div>
          
          {UPPER_CATEGORIES.map(renderCategoryRow)}
          
          <div style={totalRowStyle}>
            <span>Subtotal</span>
            <span>{upperSum}</span>
          </div>
          
          <div style={{ ...totalRowStyle, backgroundColor: upperBonus > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(251, 191, 36, 0.15)' }}> {/* Cypherpunk: green / amber tint */}
            <span>
              Bonus
              <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}> {/* Cypherpunk: slate-400 */}
                {bonusText}
              </span>
            </span>
            <span style={{ color: upperBonus > 0 ? '#22c55e' : '#94a3b8' }}> {/* Cypherpunk: green-500 / slate-400 */}
              {upperBonus}
            </span>
          </div>

          <div style={{ ...totalRowStyle, fontWeight: 'bold', backgroundColor: '#8b5cf6', color: '#f1f5f9' }}> {/* Cypherpunk: violet-500 */}
            <span>Upper Total</span>
            <span>{upperTotal}</span>
          </div>
        </div>

        {/* Lower Section */}
        <div style={sectionStyle}>
          <div style={headerStyle}>Lower Section</div>
          
          {LOWER_CATEGORIES.map(renderCategoryRow)}
          
          {/* Yahtzee Bonus */}
          <div style={{ ...totalRowStyle, backgroundColor: scorecard.yahtzeeBonusCount > 0 ? 'rgba(251, 191, 36, 0.15)' : '#0f172a' }}> {/* Cypherpunk: amber tint / darker slate */}
            <span>
              Yahtzee Bonus
              <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}> {/* Cypherpunk: slate-400 */}
                (+100 each)
              </span>
            </span>
            <span style={{ color: scorecard.yahtzeeBonusCount > 0 ? '#fbbf24' : '#94a3b8' }}> {/* Cypherpunk: amber-400 / slate-400 */}
              {scorecard.yahtzeeBonusCount > 0
                ? `${scorecard.yahtzeeBonusCount} × 100 = ${scorecard.yahtzeeBonusCount * 100}`
                : '0'
              }
            </span>
          </div>

          <div style={{ ...totalRowStyle, fontWeight: 'bold', backgroundColor: '#6366f1', color: '#f1f5f9' }}> {/* Cypherpunk: indigo-500 */}
            <span>Lower Total</span>
            <span>{lowerTotal}</span>
          </div>
        </div>
      </div>

      {/* Grand Total */}
      <div style={grandTotalStyle}>
        <span>GRAND TOTAL</span>
        <span>{grandTotal}</span>
      </div>
    </div>
  );
}

Scorecard.propTypes = {
  scorecard: PropTypes.shape({
    ones: PropTypes.number,
    twos: PropTypes.number,
    threes: PropTypes.number,
    fours: PropTypes.number,
    fives: PropTypes.number,
    sixes: PropTypes.number,
    threeOfAKind: PropTypes.number,
    fourOfAKind: PropTypes.number,
    fullHouse: PropTypes.number,
    smallStraight: PropTypes.number,
    largeStraight: PropTypes.number,
    yahtzee: PropTypes.number,
    chance: PropTypes.number,
    yahtzeeBonusCount: PropTypes.number
  }).isRequired,
  dice: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired
    })
  ).isRequired,
  onScore: PropTypes.func.isRequired,
  canScore: PropTypes.bool.isRequired,
  rollsRemaining: PropTypes.number.isRequired,
  activePlayer: PropTypes.string
};

export default Scorecard;
