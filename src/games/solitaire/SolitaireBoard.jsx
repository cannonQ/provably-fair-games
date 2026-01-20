/**
 * SolitaireBoard Component
 * 
 * Main layout component that arranges stock, waste, foundations, and tableau.
 * Handles all card interactions and move validation.
 */

import React from 'react';
import TableauColumn from './TableauColumn';
import FoundationPile from './FoundationPile';
import StockPile from './StockPile';
import {
  canPlaceOnTableau,
  canPlaceOnFoundation,
  getMovableSequence
} from './gameLogic';

export default function SolitaireBoard({ state, dispatch }) {
  const { tableau, stock, waste, foundations, selectedCards } = state;

  // Check if selected cards can be placed on a tableau column
  const isValidTableauTarget = (columnIndex) => {
    if (!selectedCards || !selectedCards.cards || selectedCards.cards.length === 0) return false;
    const targetColumn = tableau[columnIndex];
    return canPlaceOnTableau(selectedCards.cards[0], targetColumn);
  };

  // Check if selected card can be placed on a foundation
  const isValidFoundationTarget = (suit) => {
    if (!selectedCards || !selectedCards.cards || selectedCards.cards.length !== 1) return false;
    const card = selectedCards.cards[0];
    const foundationPile = foundations[suit];
    if (!foundationPile) return false;
    return canPlaceOnFoundation(card, foundationPile, suit);
  };

  // Draw card from stock to waste
  const handleDraw = () => {
    dispatch({ type: 'DRAW_FROM_STOCK' });
  };

  // Recycle waste back to stock
  const handleRecycle = () => {
    dispatch({ type: 'RECYCLE_STOCK' });
  };

  // Select top waste card
  const handleWasteSelect = () => {
    if (waste.length === 0) return;

    const topCard = waste[waste.length - 1];

    // If already selected, try auto-move to foundation
    if (selectedCards?.source?.type === 'waste') {
      const targetSuit = topCard.suit;
      const foundationPile = foundations[targetSuit];
      
      if (foundationPile && canPlaceOnFoundation(topCard, foundationPile, targetSuit)) {
        dispatch({ type: 'MOVE_TO_FOUNDATION', payload: { suit: targetSuit } });
        return;
      }
      dispatch({ type: 'CLEAR_SELECTION' });
      return;
    }

    dispatch({
      type: 'SELECT_CARDS',
      payload: { cards: [topCard], source: { type: 'waste' } }
    });
  };

  // Handle tableau card click
  const handleTableauClick = (cardIndex, columnIndex) => {
    const column = tableau[columnIndex];

    // Clicking empty column or placeholder
    if (cardIndex === -1 || column.length === 0) {
      if (selectedCards && isValidTableauTarget(columnIndex)) {
        dispatch({ type: 'MOVE_TO_TABLEAU', payload: { targetIndex: columnIndex } });
      }
      return;
    }

    const clickedCard = column[cardIndex];

    // Can't interact with face-down cards
    if (!clickedCard.faceUp) return;

    // If we have a selection
    if (selectedCards) {
      // Clicking on valid drop target
      if (isValidTableauTarget(columnIndex)) {
        dispatch({ type: 'MOVE_TO_TABLEAU', payload: { targetIndex: columnIndex } });
        return;
      }

      // Clicking same selection - try auto-move to foundation or deselect
      if (selectedCards.source.type === 'tableau' && selectedCards.source.index === columnIndex) {
        const topCard = column[column.length - 1];
        const foundationPile = foundations[topCard.suit];
        
        if (cardIndex === column.length - 1 && foundationPile && canPlaceOnFoundation(topCard, foundationPile, topCard.suit)) {
          dispatch({
            type: 'SELECT_CARDS',
            payload: { cards: [topCard], source: { type: 'tableau', index: columnIndex } }
          });
          dispatch({ type: 'MOVE_TO_FOUNDATION', payload: { suit: topCard.suit } });
          return;
        }
        dispatch({ type: 'CLEAR_SELECTION' });
        return;
      }
    }

    // Select cards from this position to end of column
    const sequence = getMovableSequence(column, cardIndex);
    if (sequence) {
      dispatch({
        type: 'SELECT_CARDS',
        payload: { cards: sequence, source: { type: 'tableau', index: columnIndex } }
      });
    }
  };

  // Handle foundation click
  const handleFoundationDrop = (suit) => {
    if (selectedCards && isValidFoundationTarget(suit)) {
      dispatch({ type: 'MOVE_TO_FOUNDATION', payload: { suit } });
    }
  };

  // Auto-flip face-down cards after moves
  React.useEffect(() => {
    tableau.forEach((column, index) => {
      if (column.length > 0) {
        const topCard = column[column.length - 1];
        if (!topCard.faceUp) {
          dispatch({ type: 'FLIP_CARD', payload: { columnIndex: index } });
        }
      }
    });
  }, [tableau, dispatch]);

  return (
    <div style={{ padding: '10px', maxWidth: '650px', margin: '0 auto' }}>
      {/* Top Row: Stock/Waste and Foundations */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '25px',
        gap: '10px'
      }}>
        {/* Stock and Waste */}
        <StockPile
          stock={stock}
          waste={waste}
          onDrawClick={handleDraw}
          onRecycleClick={handleRecycle}
          onWasteCardClick={handleWasteSelect}
          selectedCards={selectedCards}
        />

        {/* Foundations */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {['hearts', 'diamonds', 'clubs', 'spades'].map(suit => (
            <FoundationPile
              key={suit}
              cards={foundations[suit]}
              suit={suit}
              onDrop={handleFoundationDrop}
              isValidDropTarget={isValidFoundationTarget(suit)}
            />
          ))}
        </div>
      </div>

      {/* Tableau Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '4px'
      }}>
        {tableau.map((column, index) => (
          <TableauColumn
            key={index}
            cards={column}
            columnIndex={index}
            onCardClick={handleTableauClick}
            selectedCards={selectedCards}
            isValidDropTarget={isValidTableauTarget(index)}
          />
        ))}
      </div>
    </div>
  );
}
