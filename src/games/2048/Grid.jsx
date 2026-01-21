/**
 * 2048 Grid Component - 4x4 game grid with tiles
 * @module Grid
 *
 * Mobile-optimized with:
 * - Rounded corners matching reference design
 * - Responsive sizing
 * - Dark theme colors
 */

import React from 'react';
import Tile from './Tile';

/**
 * Grid component for 2048 game
 */
const Grid = ({ grid, newTiles = new Set(), mergedTiles = new Set() }) => {
  // Container style - responsive square with rounded corners
  const containerStyle = {
    width: '100%',
    maxWidth: '400px',
    aspectRatio: '1 / 1',
    margin: '0 auto',
    padding: 'clamp(8px, 2vw, 12px)',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    boxSizing: 'border-box'
  };

  // Grid wrapper style
  const gridWrapperStyle = {
    position: 'relative',
    width: '100%',
    height: '100%'
  };

  // Background grid style - CSS Grid for empty cells
  const backgroundGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridTemplateRows: 'repeat(4, 1fr)',
    gap: 'clamp(6px, 1.5vw, 10px)',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0
  };

  // Empty cell style
  const emptyCellStyle = {
    backgroundColor: '#334155',
    borderRadius: '8px'
  };

  // Tile layer style - absolute positioning for tiles
  const tileLayerStyle = {
    position: 'absolute',
    top: '3px',
    left: '3px',
    right: '3px',
    bottom: '3px'
  };

  // Collect all non-zero tiles for rendering
  const tiles = [];
  if (grid) {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = grid[row][col];
        if (cell && cell.value > 0) {
          tiles.push({
            ...cell,
            row,
            col,
            isNew: newTiles.has(cell.id),
            isMerged: mergedTiles.has(cell.id) || cell.merged
          });
        }
      }
    }
  }

  return (
    <div style={containerStyle}>
      <div style={gridWrapperStyle}>
        {/* Background grid with empty cells */}
        <div style={backgroundGridStyle}>
          {Array.from({ length: 16 }).map((_, index) => (
            <div key={index} style={emptyCellStyle} />
          ))}
        </div>

        {/* Tile layer with actual game tiles */}
        <div style={tileLayerStyle}>
          {tiles.map((tile) => (
            <Tile
              key={tile.id}
              value={tile.value}
              row={tile.row}
              col={tile.col}
              isNew={tile.isNew}
              isMerged={tile.isMerged}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Grid;
