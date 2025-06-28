import React, { useState, useEffect } from "react";
import "./App.css";

// Replace with correct backend URL or use .env/config if available
const API_ROOT =
  process.env.REACT_APP_API_URL ||
  "https://vscode-internal-0549-beta.beta01.cloud.kavia.ai:3001";

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState("light");

  // Game-related states
  const [board, setBoard] = useState(Array(9).fill(null));
  const [gameId, setGameId] = useState(null);
  const [nextPlayer, setNextPlayer] = useState(null); // 'X' or 'O'
  const [winner, setWinner] = useState(null); // 'X', 'O', 'Tie'
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Game history (list of {id, created_at, winner, moves})
  const [gameHistory, setGameHistory] = useState([]);
  const [selectedHistoryGame, setSelectedHistoryGame] = useState(null);

  // THEME
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // On mount, fetch history (and optionally check for running game)
  useEffect(() => {
    fetchGameHistory();
  }, []);

  // ---------- API Functions ----------
  async function startNewGame(startsAs) {
    setLoading(true);
    setStatusMsg("");
    setWinner(null);
    setNextPlayer(startsAs);

    try {
      const res = await fetch(`${API_ROOT}/games/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_player: startsAs }),
      });
      if (!res.ok) throw new Error("Could not start a new game");
      const data = await res.json();
      setGameId(data.game_id);
      setBoard(Array(9).fill(null));

      setStatusMsg(
        `Game started. You are playing as "${startsAs}".`
      );
      setNextPlayer(startsAs);
      setWinner(null);
    } catch (err) {
      setStatusMsg("Failed to start game: " + err.message);
      setGameId(null);
      setBoard(Array(9).fill(null));
    } finally {
      setLoading(false);
      fetchGameHistory();
      setSelectedHistoryGame(null);
    }
  }

  async function playMove(index) {
    if (
      board[index] ||
      winner ||
      !gameId ||
      loading ||
      selectedHistoryGame
    )
      return;

    setLoading(true);
    setStatusMsg("");

    try {
      const res = await fetch(`${API_ROOT}/games/${gameId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: index }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.detail || "Invalid move");
      }
      const data = await res.json();

      setBoard(data.board); // expects a list of 9 with 'X','O',null
      setNextPlayer(data.next_player);
      setWinner(data.winner); // null, 'X', 'O', or 'Tie'
      setStatusMsg(
        data.winner
          ? data.winner === "Tie"
            ? "It's a tie!"
            : `Player "${data.winner}" wins!`
          : `Next: Player "${data.next_player}"`
      );
      if (data.winner) fetchGameHistory();
    } catch (err) {
      setStatusMsg("Move failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGameHistory() {
    try {
      const res = await fetch(`${API_ROOT}/games/`);
      if (!res.ok) return;
      const history = await res.json();
      setGameHistory(history.reverse()); // show most recent on top
    } catch {
      setGameHistory([]);
    }
  }

  async function fetchHistoryGame(game) {
    setSelectedHistoryGame(game);
    setBoard(game.moves);
    setWinner(game.winner);
    setGameId(null);
    setStatusMsg(
      game.winner
        ? game.winner === "Tie"
          ? "Game was a tie."
          : `Player "${game.winner}" won.`
        : "Reviewing game in progress."
    );
    setNextPlayer(null);
  }

  function handleSquareClick(idx) {
    if (selectedHistoryGame) return;
    playMove(idx);
  }

  function resetToCurrentGame() {
    setSelectedHistoryGame(null);
    if (gameId) {
      // Refresh from backend (optional)
    }
    setStatusMsg("");
  }

  // ---------- UI Components ----------
  function renderSquare(idx) {
    return (
      <button
        className={`ttt-square${
          board[idx] ? " filled" : ""
        }`}
        disabled={
          loading ||
          Boolean(board[idx]) ||
          winner ||
          !gameId ||
          selectedHistoryGame
        }
        aria-label={`Square ${idx + 1}: ${board[idx] || "empty"}`}
        onClick={() => handleSquareClick(idx)}
      >
        {board[idx]}
      </button>
    );
  }

  function renderBoard() {
    return (
      <div className="ttt-board">
        {[0, 1, 2].map((row) => (
          <div className="ttt-board-row" key={row}>
            {[0, 1, 2].map((col) =>
              renderSquare(row * 3 + col)
            )}
          </div>
        ))}
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div className="App" data-theme={theme}>
      <header className="App-header" style={{ minHeight: "100vh" }}>
        {/* Theme Toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        <div className="ttt-main-container">
          {/* Game Card */}
          <div className="ttt-game-card">
            <h1 className="ttt-title">Tic Tac Toe</h1>
            {/* Start New Game Buttons */}
            <div className="ttt-controls">
              <button
                className="ttt-btn ttt-btn-primary"
                onClick={() => startNewGame("X")}
                disabled={loading || (!!gameId && !winner) || selectedHistoryGame}
              >
                New Game as X
              </button>
              <button
                className="ttt-btn ttt-btn-accent"
                onClick={() => startNewGame("O")}
                disabled={loading || (!!gameId && !winner) || selectedHistoryGame}
              >
                New Game as O
              </button>
              {selectedHistoryGame && (
                <button className="ttt-btn" onClick={resetToCurrentGame}>
                  Back to active game
                </button>
              )}
            </div>
            {/* Board */}
            <div className="ttt-board-wrapper">{renderBoard()}</div>

            {/* Game status/winner */}
            <div className="ttt-status-message">
              {statusMsg}
            </div>

            {/* Disabled screen overlay when loading */}
            {loading && (
              <div className="ttt-overlay">
                <div className="ttt-loader" />
              </div>
            )}
          </div>

          {/* History Sidebar/Section */}
          <aside className="ttt-history-sidebar">
            <h2>Game History</h2>
            {gameHistory.length === 0 ? (
              <p className="ttt-history-empty">
                No games played yet.
              </p>
            ) : (
              <ul className="ttt-history-list">
                {gameHistory.map((game, idx) => (
                  <li
                    key={game.id}
                    className={
                      selectedHistoryGame && selectedHistoryGame.id === game.id
                        ? "ttt-history-selected"
                        : ""
                    }
                  >
                    <button
                      className="ttt-history-item"
                      onClick={() => fetchHistoryGame(game)}
                      disabled={!!selectedHistoryGame && selectedHistoryGame.id === game.id}
                    >
                      <span className="ttt-history-date">
                        {new Date(game.created_at).toLocaleString([], {
                          year: "2-digit",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="ttt-history-winner">
                        {game.winner
                          ? game.winner === "Tie"
                            ? "Tie"
                            : `Winner: ${game.winner}`
                          : "In Progress"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </header>
    </div>
  );
}

export default App;
