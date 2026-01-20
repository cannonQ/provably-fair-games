import React from 'react';

/**
 * Move history component displaying algebraic notation
 */
function MoveHistory({ moves, currentMoveIndex, onMoveClick }) {
  // Group moves by pairs (white, black)
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || null,
      whiteIndex: i,
      blackIndex: i + 1
    });
  }

  return (
    <div className="move-history">
      <h3>Move History</h3>
      <div className="move-list">
        {movePairs.length === 0 ? (
          <div className="no-moves">No moves yet</div>
        ) : (
          movePairs.map((pair, index) => (
            <div key={index} className="move-pair">
              <span className="move-number">{pair.number}.</span>
              <span
                className={`move-item ${currentMoveIndex === pair.whiteIndex ? 'current' : ''}`}
                onClick={() => onMoveClick && onMoveClick(pair.whiteIndex)}
              >
                {pair.white}
              </span>
              {pair.black && (
                <span
                  className={`move-item ${currentMoveIndex === pair.blackIndex ? 'current' : ''}`}
                  onClick={() => onMoveClick && onMoveClick(pair.blackIndex)}
                >
                  {pair.black}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MoveHistory;
