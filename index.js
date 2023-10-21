const boardDOM = document.querySelector(".game-container");

// 9x9 grid for small board size
const width = 9;
const height = 9;

let squares = new Array(width * height).fill(null);

const setMines = squares => {
  return squares.map(() => {
    // Not sure if there should be a specific number of mines for each board size - might need to adjust this
    const mineProbability = 0.15;
    const isMine = Math.random() < mineProbability;
    return isMine ? "mine" : null;
  });
}
squares = setMines(squares);

// i - width - 1   i - width   i - width + 1
// i - 1              i            i + 1
// i + width - 1   i + width   i + width + 1

// Determine which squares are adjacent to the current square based on its location on the board
const calculateAdjacentSquares = (i) => {
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
    adjacentSquares.push(...[i - width - 1, i - width, i - 1, i + width - 1, i + width, i + width + 1]);
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
    // console.log(adjacentMines)
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
      squares.forEach((square, i) => {
        if (square === "mine") {
          boardSquares[i].classList.add("mine");
        }
      });
      boardDOM.classList.add("game-over");
      boardDOM.removeEventListener("mousedown", handleClick);

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
    } else {
      targetSquare.classList.add("safe");
    }

  // right click
  } else if (e.button == 2) {
    targetSquare.classList.toggle("flag");
  }
}

boardDOM.addEventListener("mousedown", handleClick);
boardDOM.addEventListener("contextmenu", e => e.preventDefault());
