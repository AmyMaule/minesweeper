const boardContainerDOM = document.querySelector(".board-container");
const boardDOM = document.querySelector(".game-container");
const flagCounterDOM = document.querySelector(".flag-counter");
const timerDOM = document.querySelector(".timer");
const newGameBtn = document.querySelector(".btn-new-game");
const sizeBtns = [...document.querySelectorAll(".btn-size")];
let flagCounter, isPlaying, timer, playInterval, width, height, totalMines, squares;
let boardSize = "small";

const boardSizes = {
  small: {
    width: 9,
    height: 9,
    mines: 10
  },
  medium: {
    width: 16,
    height: 16,
    mines: 40
  },
  // should this be 30x16 or 16x30?
  large: {
    width: 30,
    height: 16,
    mines: 99
  }
}

const setMines = squares => {
  let mineLocations = [];
  while (mineLocations.length !== totalMines) {
    const newMineLocation  = Math.floor(Math.random() * squares.length);
    if (!mineLocations.includes(newMineLocation)) {
      mineLocations.push(newMineLocation);
      squares[newMineLocation] = "mine";
    }
  }
  return squares;
}

// Determine which squares are adjacent to the current square based on its location on the board
const calculateAdjacentSquares = (i) => {
  // i - width - 1   i - width   i - width + 1
  // i - 1              i            i + 1
  // i + width - 1   i + width   i + width + 1

  // if in top row, dont do 0, 1, 2         i < width
  // if on left edge, dont do 0, 3, 6       i % width === 0
  // if on right edge, dont do 2, 5, 8      i % width === width - 1
  // if on bottom, dont do 6, 7, 8          i > (width * height) - width - 1

  const topRow = i < width;
  const leftEdge = i % width === 0;
  const rightEdge =  i % width === width - 1;
  const bottomRow = i > (width * height) - width - 1;

  const adjacentSquares = [];
  if (topRow && !leftEdge && !rightEdge) {
    adjacentSquares.push(...[i - 1, i + 1, i + width - 1, i + width, i + width + 1]);
  } else if (bottomRow && !leftEdge && !rightEdge) {
    adjacentSquares.push(...[i - width - 1, i - width, i - width + 1, i - 1, i + 1]);
  } else if (leftEdge && !topRow && !bottomRow) {
    adjacentSquares.push(...[i - width, i - width + 1, i + 1, i + width, i + width + 1]);
  } else if (rightEdge && !topRow && !bottomRow) {
    adjacentSquares.push(...[i - width - 1, i - width, i - 1, i + width - 1, i + width]);
  } else if (topRow && leftEdge) {
    adjacentSquares.push(...[i + 1, i + width, i + width + 1]);
  } else if (topRow && rightEdge) {
    adjacentSquares.push(...[i - 1, i + width - 1, i + width]);
  } else if (bottomRow && leftEdge) {
    adjacentSquares.push(...[i - width, i - width + 1, i + 1]);
  } else if (bottomRow && rightEdge) {
    adjacentSquares.push(...[i - width - 1, i - width, i - 1]);
  } else {
    adjacentSquares.push(...[i - width - 1, i - width, i - width + 1, i - 1, i + 1, i + width - 1, i + width, i + width + 1]);
  }
  return adjacentSquares;
}

const calculateAdjacentMines = squares => {
  return squares.map((square, i) => {
    if (square === "mine") return "mine";

    const adjacentSquares = calculateAdjacentSquares(i);
    
    let adjacentMines = 0;

    adjacentSquares.forEach(adjacentSquare => {
      if (squares[adjacentSquare] === "mine") {
        adjacentMines++;
      }
    });
    return adjacentMines || null;
  });
}

const createBoardSquares = (squares) => {
  boardDOM.innerHTML = "";
  squares.forEach((square, i) => {
    let squareDOM = document.createElement("div");
    squareDOM.id = i;
    squareDOM.className = "square";
    
    if (square === "mine") {
      squareDOM.innerText = ".";
    }
    boardDOM.append(squareDOM);
  });
}

// Recursively check adjacent squares and mark blank squares as safe
const revealBlankSquares = id => {
  const boardSquares = [...boardDOM.childNodes];  
  const clickedSquareType = squares[id];
  const adjacentSquares = calculateAdjacentSquares(Number(id));

  if (!clickedSquareType && !boardSquares[id].classList.contains("flag")) {
    boardSquares[id].classList.add("safe");
  }

  adjacentSquares.forEach(adjacentSquareID => {
    if (typeof squares[adjacentSquareID] === "number" && !boardSquares[adjacentSquareID].classList.contains("flag")) {
      boardSquares[adjacentSquareID].classList.add("safe", `square-${squares[adjacentSquareID]}`);
      boardSquares[adjacentSquareID].innerText = squares[adjacentSquareID];
    } else if (!squares[adjacentSquareID] && !boardSquares[adjacentSquareID].classList.contains("safe") && !boardSquares[adjacentSquareID].classList.contains("flag")) {
      revealBlankSquares(adjacentSquareID);
    }
  });
}

const handleClick = e => {
  if (e.target.classList.contains("game-container")) return;

  if (!isPlaying) {
    isPlaying = true;
    startPlay();
  }
  const targetSquare = e.target;
  const clickedSquareType = squares[e.target.id];
  e.preventDefault();
  if (!targetSquare.classList.contains("square")) return;
  const boardSquares = [...boardDOM.childNodes];

  // left click
  if (e.button == 0) {
    // Clicking on a flagged square does nothing
    if (targetSquare.classList.contains("flag")) {
      return;
    } else if (clickedSquareType === "mine") {
      targetSquare.classList.add("killer-mine");
      gameOver(boardSquares, "mine");

      // REMOVE AFTER TESTING
      boardSquares.forEach((square, i) => {
        if (square.classList.contains("mine")) {
          boardSquares[i].innerText = "";
        }
      })
      // Remove above after testing

    } else if (typeof clickedSquareType === "number") {
      const currentSquare = Number(targetSquare.id);
      boardSquares[currentSquare].classList.add("safe", `square-${clickedSquareType}`);
      boardSquares[currentSquare].innerText = clickedSquareType;
      if (checkWin(boardSquares)) {
        gameOver(boardSquares, "flag");
      };
    } else {
      // If square is blank, check surrounding squares around to see which others can be opened up
      revealBlankSquares(targetSquare.id);
      if (checkWin(boardSquares)) {
        gameOver(boardSquares, "flag");
      };
    }

  // right click
  } else if (e.button == 2) {
    if (!targetSquare.classList.contains("safe")) {
      targetSquare.classList.contains("flag")
        ? flagCounter++
        : flagCounter--;
      setNumberInnerText(flagCounterDOM, flagCounter);
      targetSquare.classList.toggle("flag");
    }
  }
}

// Ensure minimum of 3 characters for clock and bomb counter
const setNumberInnerText = (node, value) => {
  let numberText = value.toString();
  node.innerText = value >= 0
  ? numberText.padStart(3, 0)
  : numberText.length < 3
    ? numberText[0] + "0" + numberText[1]
    : numberText;
}

const checkWin = boardSquares => {
  // If a square only has the className "square", it hasn't been clicked yet
  const unclickedSquares = boardSquares.filter(square => square.className === "square");
  return unclickedSquares.length === totalMines;
}

const gameOver = (boardSquares, className) => {
  isPlaying = false;
  clearInterval(playInterval)
  boardDOM.classList.add("game-over");
  boardDOM.removeEventListener("mousedown", handleClick);

  // If the player has won, all mines turn to flags, if they have lost, the mines are revealed
  squares.forEach((square, i) => {
    if (square === "mine") {
      // If a square already contains a flag, it should stay as is
      if (boardSquares[i].classList.contains("flag")) {
        return;
      } else {
        boardSquares[i].classList.add(className);
      }
    } else {
      // Safe flagged squares were flagged but do not contain mines
      if (boardSquares[i].classList.contains("flag")) {
        boardSquares[i].classList.remove("flag");
        boardSquares[i].classList.add("safe", "safe-flagged");
      }
    }
  });
}

const startPlay = () => {
  clearInterval(playInterval);
  timerDOM.innerHTML = "000";

  if (isPlaying) {
    playInterval = setInterval(() => {
      timer++;
      setNumberInnerText(timerDOM, timer);
    }, 1000);
  }
}

const setupGame = () => {
  boardDOM.classList.remove("game-over");
  clearInterval(playInterval);
  isPlaying = false;
  timer = 0;
  timerDOM.innerHTML = "000";

  // Set board size
  width = boardSizes[boardSize].width;
  height = boardSizes[boardSize].height;

  // Adjust board styles based on the size of the grid
  boardDOM.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
  boardDOM.style.width = 25 * width + 25 + "px";
  boardDOM.style.height = 25 * height + 25 + "px";
  boardContainerDOM.style.width = 25 * width + 25 + "px";
  totalMines = boardSizes[boardSize].mines;

  // Set number of available flags
  flagCounter = boardSizes[boardSize].mines;
  flagCounterDOM.innerText = flagCounter.toString().padStart(3, 0);

  // Setup game board with mines and mine-counting squares
  squares = new Array(width * height).fill(null);
  squares = setMines(squares);
  squares = calculateAdjacentMines(squares);
  createBoardSquares(squares);

  boardDOM.addEventListener("mousedown", handleClick);
}

const selectGameSize = e => {
  boardSize = e.target.innerText;
  setupGame();
}

boardDOM.addEventListener("contextmenu", e => e.preventDefault());
newGameBtn.addEventListener("click", setupGame);
sizeBtns.forEach(btn => btn.addEventListener("click", selectGameSize));

setupGame();
