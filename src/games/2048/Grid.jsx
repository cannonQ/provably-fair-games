/**
 * 2048 Grid Component - 4x4 game grid with tiles
 * @module Grid
 */

import React from 'react';
import Tile from './Tile';

/**
 * Grid component for 2048 game
 * @param {Object} props - Component props
 * @param {Array<Array<Object>>} props.grid - 4x4 grid of cells
 * @param {Set<number>} props.newTiles - Set of tile IDs to animate as new
 * @param {Set<number>} props.mergedTiles - Set of tile IDs to animate as merged
 */
const Grid = ({ grid, newTiles = new Set(), mergedTiles = new Set() }) => {
  // Container style - responsive square (dark theme)
  const containerStyle = {
    width: '100%',
    maxWidth: '500px',
    aspectRatio: '1 / 1',
    margin: '0 auto',
    padding: '10px',
    backgroundColor: '#2a3a5e',
    borderRadius: '8px',
    boxSizing: 'border-box'
  };

  // Grid wrapper style - holds background cells and tile layer
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
    gap: '10px',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0
  };

  // Empty cell style (dark theme)
  const emptyCellStyle = {
    backgroundColor: '#16213e',
    borderRadius: '6px'
  };

  // Tile layer style - absolute positioning for tiles
  const tileLayerStyle = {
    position: 'absolute',
    top: '5px',
    left: '5px',
    right: '5px',
    bottom: '5px'
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
