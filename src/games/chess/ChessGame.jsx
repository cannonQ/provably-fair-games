import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ChessBoard from './components/ChessBoard';
import RatingSelector from './components/RatingSelector';
import MoveHistory from './components/MoveHistory';
import PromotionModal from './components/PromotionModal';
import GameOverModal from './components/GameOverModal';
import { createGame, makeMove, getGameResult, getMoveHistory, uciToMove } from './engine/chess-logic';
import { determinePlayerColor } from './blockchain/color-assignment';
import { createAICommitment } from './blockchain/ai-commitment';
import { eloToSettings } from './stockfish/elo-to-settings';
import { loadStockfish, unloadStockfish } from './stockfish/stockfish-loader';
import { StockfishInterface } from './stockfish/stockfish-interface';
import './styles/chess.css';

/**
 * Main Chess Game component
 */
function ChessGame() {
  // Game state
  const [gamePhase, setGamePhase] = useState('setup'); // setup, initializing, playing, gameover
  const [game, setGame] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [aiSettings, setAISettings] = useState(null);
  const [colorAssignment, setColorAssignment] = useState(null);
  const [aiCommitment, setAICommitment] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // UI state
  const [promotionData, setPromotionData] = useState(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [flipBoard, setFlipBoard] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [moveCount, setMoveCount] = useState(0); // Used to trigger re-renders after moves

  // Stockfish
  const stockfishRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stockfishRef.current) {
        stockfishRef.current.quit();
      }
      unloadStockfish();
    };
  }, []);

  // Initialize game
  const handleStartGame = async (targetElo, mode) => {
    try {
      setGamePhase('initializing');
      setStatusMessage('Initializing game...');

      // Generate unique game ID
      const timestamp = Date.now();
      const randomHash = Math.random().toString(36).substring(2, 15);
      const newGameId = `chess_${timestamp}_${randomHash}`;
      setGameId(newGameId);
      setStartTime(timestamp);

      // Create new game
      const newGame = createGame();
      setGame(newGame);

      // Determine player color from blockchain
      setStatusMessage('Determining color from blockchain...');
      const colorData = await determinePlayerColor();
      setPlayerColor(colorData.playerColor);
      setColorAssignment(colorData);
      setFlipBoard(colorData.playerColor === 'black');

      // Get AI settings
      const settings = eloToSettings(targetElo, mode);
      setAISettings(settings);

      // Create AI commitment
      setStatusMessage('Creating AI commitment...');
      const commitment = await createAICommitment(settings, colorData.userSeed);
      setAICommitment(commitment);

      // Load Stockfish
      setStatusMessage('Loading chess engine...');
      const worker = await loadStockfish();
      const stockfish = new StockfishInterface(worker);
      await stockfish.init();
      stockfish.setSkillLevel(settings.skillLevel);
      stockfishRef.current = stockfish;

      setGamePhase('playing');
      setStatusMessage('');

      // If AI is white, make first move
      if (colorData.playerColor === 'black') {
        makeAIMove(newGame, stockfish, settings);
      }
    } catch (error) {
      console.error('Error starting game:', error);
      setStatusMessage('Error starting game. Please try again.');
      setGamePhase('setup');
    }
  };

  // Handle player move
  const handleMove = (from, to, promotion = 'q') => {
    if (!game || gamePhase !== 'playing') return;

    const move = makeMove(game, from, to, promotion);
    if (!move) return;

    setLastMove({ from, to });
    setMoveCount(c => c + 1); // Trigger re-render

    // Check if game is over
    const result = getGameResult(game);
    if (result.gameOver) {
      handleGameOver(result);
      return;
    }

    // Make AI move
    if (stockfishRef.current && aiSettings) {
      makeAIMove(game, stockfishRef.current, aiSettings);
    }
  };

  // Make AI move
  const makeAIMove = async (gameInstance, stockfish, settings) => {
    setIsAIThinking(true);
    setStatusMessage('AI is thinking...');

    try {
      const fen = gameInstance.fen();
      const bestMove = await stockfish.getBestMove(fen, {
        moveTime: settings.moveTime,
        depth: settings.depth
      });

      // Apply the move
      const move = uciToMove(gameInstance, bestMove);
      if (move) {
        setLastMove({ from: move.from, to: move.to });
        setMoveCount(c => c + 1); // Trigger re-render

        // Check if game is over
        const result = getGameResult(gameInstance);
        if (result.gameOver) {
          handleGameOver(result);
        }
      }
    } catch (error) {
      console.error('Error making AI move:', error);
      setStatusMessage('AI error. Please refresh the page.');
    } finally {
      setIsAIThinking(false);
      setStatusMessage('');
    }
  };

  // Handle promotion needed
  const handlePromotionNeeded = (from, to) => {
    setPromotionData({ from, to });
  };

  // Handle promotion selection
  const handlePromotionSelect = (piece) => {
    if (promotionData) {
      handleMove(promotionData.from, promotionData.to, piece);
    }
    setPromotionData(null);
  };

  // Handle game over
  const handleGameOver = (result) => {
    setGameResult(result);
    setGamePhase('gameover');
    setShowGameOver(true);
  };

  // New game
  const handleNewGame = () => {
    if (stockfishRef.current) {
      stockfishRef.current.quit();
      stockfishRef.current = null;
    }
    unloadStockfish();

    setGame(null);
    setGameId(null);
    setStartTime(null);
    setPlayerColor(null);
    setAISettings(null);
    setColorAssignment(null);
    setAICommitment(null);
    setLastMove(null);
    setGameResult(null);
    setShowGameOver(false);
    setPromotionData(null);
    setIsAIThinking(false);
    setFlipBoard(false);
    setStatusMessage('');
    setGamePhase('setup');
  };

  // Get game data for verification
  const getGameData = () => {
    if (!game) return null;

    return {
      playerColor,
      aiSettings,
      colorAssignment,
      aiCommitment: aiCommitment ? {
        commitment: aiCommitment.commitment,
        blockHash: aiCommitment.blockHash,
        playerSeed: aiCommitment.playerSeed
      } : null,
      moves: getMoveHistory(game),
      result: gameResult
    };
  };

  // Render based on game phase
  if (gamePhase === 'setup') {
    return (
      <div className="chess-game-container">
        <div className="chess-header">
          <div className="chess-header-left">
            <button className="chess-menu-btn" onClick={() => setShowMenu(!showMenu)}>☰</button>
            <h1>Chess</h1>
            <div className="provably-fair-badge">provably fair</div>
          </div>
        </div>
        {showMenu && (
          <div className="chess-dropdown-menu">
            <Link to="/" onClick={() => setShowMenu(false)}>🏠 Home</Link>
          </div>
        )}
        <RatingSelector onStart={handleStartGame} />
      </div>
    );
  }

  if (gamePhase === 'initializing') {
    return (
      <div className="chess-game-container">
        <div className="chess-header">
          <div className="chess-header-left">
            <h1>Chess</h1>
            <div className="provably-fair-badge">provably fair</div>
          </div>
        </div>
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div className="loading-message">{statusMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chess-game-container">
      <div className="chess-header">
        <div className="chess-header-left">
          <button className="chess-menu-btn" onClick={() => setShowMenu(!showMenu)}>☰</button>
          <h1>Chess</h1>
          <div className="provably-fair-badge">provably fair</div>
        </div>
        <div className="game-info">
          <div className="info-item">
            <span className="info-label">You:</span>
            <span className={`info-value ${playerColor}`}>{playerColor}</span>
          </div>
          <div className="info-item">
            <span className="info-label">AI:</span>
            <span className="info-value">{aiSettings?.targetElo || 'N/A'}</span>
          </div>
        </div>
      </div>

      {showMenu && (
        <div className="chess-dropdown-menu">
          <button onClick={() => { setFlipBoard(!flipBoard); setShowMenu(false); }}>
            🔄 Flip Board
          </button>
          <button onClick={() => { handleNewGame(); setShowMenu(false); }}>
            ↻ New Game
          </button>
          <Link to={gameId ? `/verify/chess/${gameId}` : "/chess"} onClick={() => setShowMenu(false)}>
            ✓ Verify Game
          </Link>
          <Link to="/" onClick={() => setShowMenu(false)}>
            🏠 Home
          </Link>
        </div>
      )}

      <div className="chess-main">
        <div className="chess-board-container">
          {isAIThinking && (
            <div className="ai-thinking-overlay">
              <div className="thinking-message">
                <div className="thinking-spinner" />
                AI is thinking...
              </div>
            </div>
          )}

          {game && (
            <ChessBoard
              game={game}
              playerColor={playerColor}
              onMove={handleMove}
              onPromotionNeeded={handlePromotionNeeded}
              disabled={isAIThinking || gamePhase === 'gameover'}
              lastMove={lastMove}
              flipped={flipBoard}
            />
          )}

          <div className="board-controls">
            <button
              className="control-btn"
              onClick={() => setFlipBoard(!flipBoard)}
            >
              Flip Board
            </button>
            <button
              className="control-btn"
              onClick={handleNewGame}
            >
              New Game
            </button>
          </div>
        </div>

        <div className="chess-sidebar">
          {game && (
            <MoveHistory
              moves={getMoveHistory(game)}
              currentMoveIndex={getMoveHistory(game).length - 1}
            />
          )}
        </div>
      </div>

      {promotionData && (
        <PromotionModal
          color={playerColor}
          onSelect={handlePromotionSelect}
          onCancel={() => setPromotionData(null)}
        />
      )}

      {showGameOver && (
        <GameOverModal
          result={gameResult}
          gameData={getGameData()}
          gameId={gameId}
          gameDuration={startTime ? Date.now() - startTime : 0}
          onNewGame={handleNewGame}
          onClose={() => setShowGameOver(false)}
        />
      )}
    </div>
  );
}

export default ChessGame;
