const boardDOM = document.querySelector(".game-container");

// 9x9 grid for small board size
const width = 9;
const height = 9;

const mines = new Array(width * height).fill(null).map(() => {
  // Not sure if there should be a specific number of mines for each board size - might need to adjust this
  const mineProbability = 0.15;
  const isMine = Math.random() < mineProbability;
  return isMine;
});

const createBoardSquares = () => {
  mines.forEach((mine, i) => {
    let square = document.createElement("div");
    square.id = i;
    square.className = "square";
    
    if (mine) {
      square.innerText = "x";
    }
    boardDOM.append(square);
  });
}
createBoardSquares();


const handleClick = e => {
  const targetSquare = e.target;
  e.preventDefault();


  // left click
  if (e.button == 0) {
    // Clicking on a flagged square does nothing
    if (e.target.classList.contains("flag")) {
      return;
    } else if (mines[e.target.id]) {
      targetSquare.classList.add("mine");
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
