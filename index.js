const boardDOM = document.querySelector(".game-container");
const bombCounterDOM = document.querySelector(".bomb-counter");

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

const boardSize = "small";
const width = boardSizes[boardSize].width;
const height = boardSizes[boardSize].height;
let bombCounter = boardSizes[boardSize].mines;
bombCounterDOM.innerText = bombCounter.toString().padStart(3, 0);

// Adjust board styles based on the size of the grid
boardDOM.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
boardDOM.style.width = 25 * width + 25 + "px";
boardDOM.style.height = 25 * height + 25 + "px";

const totalMines = boardSizes[boardSize].mines;
let squares = new Array(width * height).fill(null);

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
squares = setMines(squares);

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
squares = calculateAdjacentMines(squares);

const createBoardSquares = (squares) => {
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
createBoardSquares(squares);

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
        ? bombCounter++
        : bombCounter--;
        let newBombText = bombCounter.toString();
        bombCounterDOM.innerText = bombCounter >= 0
          ? newBombText.padStart(3, 0)
          : newBombText.length < 3
            ? newBombText[0] + "0" + newBombText[1]
            : newBombText;
      targetSquare.classList.toggle("flag");
    }
  }
}

const checkWin = boardSquares => {
  // If a square only has the className "square", it hasn't been clicked yet
  const unclickedSquares = boardSquares.filter(square => square.className === "square");
  return unclickedSquares.length === totalMines;
}

const gameOver = (boardSquares, className) => {
  boardDOM.classList.add("game-over");
  boardDOM.removeEventListener("mousedown", handleClick);

  // If the player has won, all mines turn to flags, if they have lost, the mines are revealed
  squares.forEach((square, i) => {
    if (square === "mine") {
      boardSquares[i].classList.add(className);
    }
  });
}

boardDOM.addEventListener("mousedown", handleClick);
boardDOM.addEventListener("contextmenu", e => e.preventDefault());
