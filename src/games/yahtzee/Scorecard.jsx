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
    flexWrap: 'wrap',
    justifyContent: 'center'
  };

  const sectionStyle = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '2px solid #333',
    overflow: 'hidden',
    minWidth: '280px',
    flex: '1 1 280px',
    maxWidth: '350px'
  };

  const headerStyle = {
    backgroundColor: '#333',
    color: '#fff',
    padding: '10px 15px',
    fontWeight: 'bold',
    fontSize: '16px',
    textAlign: 'center'
  };

  const getRowStyle = (category, isClickable, isSacrifice) => {
    let backgroundColor = 'transparent';
    
    if (isClickable) {
      if (hoveredCategory === category) {
        backgroundColor = isSacrifice ? '#ffccbc' : '#c8e6c9'; // Red-ish or green-ish hover
      } else if (isSacrifice) {
        backgroundColor = '#fff3e0'; // Light orange for sacrifice rows
      } else if (canScore) {
        backgroundColor = '#e8f5e9'; // Light green for good scoring options
      }
    }
    
    return {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 15px',
      borderBottom: '1px solid #ddd',
      backgroundColor,
      cursor: isClickable ? 'pointer' : 'default',
      transition: 'background-color 0.15s ease',
      borderLeft: isClickable ? (isSacrifice ? '4px solid #ff5722' : '4px solid #4caf50') : '4px solid transparent'
    };
  };

  const totalRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    borderBottom: '1px solid #ddd',
    backgroundColor: '#f5f5f5',
    fontWeight: '600'
  };

  const grandTotalStyle = {
    backgroundColor: '#1976d2',
    color: '#fff',
    padding: '15px 20px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    marginTop: '15px',
    width: '100%',
    maxWidth: '720px',
    boxSizing: 'border-box'
  };

  const renderScoreValue = (category) => {
    const scored = scorecard[category];
    const potential = availableScores[category];
    
    // Already scored
    if (scored !== null) {
      return (
        <span style={{ color: '#666', fontWeight: '500' }}>
          {scored}
        </span>
      );
    }
    
    // Can score this turn
    if (canScore && potential !== undefined) {
      if (potential > 0) {
        return (
          <span style={{ color: '#2e7d32', fontWeight: '600' }}>
            +{potential}
          </span>
        );
      } else {
        return (
          <span style={{ color: '#d84315', fontWeight: '600' }}>
            0 (sacrifice)
          </span>
        );
      }
    }
    
    // Not available
    return <span style={{ color: '#ccc' }}>—</span>;
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
        <span style={{ color: isScored ? '#999' : '#333', fontWeight: isClickable ? '500' : 'normal' }}>
          {CATEGORY_DISPLAY_NAMES[category]}
          {isClickable && <span style={{ marginLeft: '8px', fontSize: '12px' }}>← click</span>}
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
        color: '#333'
      }}>
        {activePlayer}'s Scorecard
      </div>

      {/* Sacrifice warning */}
      {mustSacrifice && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '2px solid #f44336',
          borderRadius: '8px',
          padding: '12px 20px',
          marginBottom: '15px',
          maxWidth: '720px',
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}>
          <div style={{ color: '#c62828', fontWeight: 'bold', marginBottom: '4px' }}>
            ⚠️ No scoring options available!
          </div>
          <div style={{ color: '#d32f2f', fontSize: '14px' }}>
            You must sacrifice a category. Click any orange row to take 0 points.
          </div>
        </div>
      )}

      {/* Good options hint */}
      {hasGoodOptions && (
        <div style={{
          backgroundColor: '#e8f5e9',
          border: '2px solid #4caf50',
          borderRadius: '8px',
          padding: '10px 20px',
          marginBottom: '15px',
          maxWidth: '720px',
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center',
          color: '#2e7d32',
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
          
          <div style={{ ...totalRowStyle, backgroundColor: upperBonus > 0 ? '#e8f5e9' : '#fff8e1' }}>
            <span>
              Bonus
              <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                {bonusText}
              </span>
            </span>
            <span style={{ color: upperBonus > 0 ? '#2e7d32' : '#999' }}>
              {upperBonus}
            </span>
          </div>
          
          <div style={{ ...totalRowStyle, fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>
            <span>Upper Total</span>
            <span>{upperTotal}</span>
          </div>
        </div>

        {/* Lower Section */}
        <div style={sectionStyle}>
          <div style={headerStyle}>Lower Section</div>
          
          {LOWER_CATEGORIES.map(renderCategoryRow)}
          
          {/* Yahtzee Bonus */}
          <div style={{ ...totalRowStyle, backgroundColor: scorecard.yahtzeeBonusCount > 0 ? '#fff3e0' : '#f5f5f5' }}>
            <span>
              Yahtzee Bonus
              <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                (+100 each)
              </span>
            </span>
            <span style={{ color: scorecard.yahtzeeBonusCount > 0 ? '#e65100' : '#999' }}>
              {scorecard.yahtzeeBonusCount > 0 
                ? `${scorecard.yahtzeeBonusCount} × 100 = ${scorecard.yahtzeeBonusCount * 100}`
                : '0'
              }
            </span>
          </div>
          
          <div style={{ ...totalRowStyle, fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>
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
