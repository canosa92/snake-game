const board = document.getElementById('board');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const scoreBoard = document.getElementById('scoreBoard');
const finalScore = document.getElementById('finalScore');
const highScoreBoard = document.getElementById('highScoreBoard');
const gameOverSign = document.getElementById('gameOver');
const difficultySelector = document.getElementById('difficulty');

// Game settings
const boardSize = 10;
const squareTypes = {
    emptySquare: 'emptySquare',
    snakeSquare: 'snakeSquare',
    foodSquare: 'foodSquare',
};

// Game state
let snake;
let score;
let currentDirection;
let nextDirection;
let boardSquares;
let emptySquares;
let moveInterval;
let isGameRunning = false;
let highScore = localStorage.getItem('highScore') || 0;
let autoMoveInterval;

// Initialize the game
const initializeGame = () => {
    snake = ['00', '01', '02', '03'];
    score = 0;
    currentDirection = 'ArrowRight';
    nextDirection = null;
    boardSquares = Array.from(Array(boardSize), () => new Array(boardSize).fill(squareTypes.emptySquare));
    board.innerHTML = '';
    emptySquares = [];
    isGameRunning = false;
    clearInterval(autoMoveInterval);
    createBoard();
    updateScore();
    highScoreBoard.innerText = highScore;
};

// Create board
const createBoard = () => {
    board.innerHTML = '';
    emptySquares = [];
    
    boardSquares.forEach((row, rowIndex) => {
        row.forEach((_, columnIndex) => {
            const squareValue = `${rowIndex}${columnIndex}`.padStart(2, '0');
            const squareElement = document.createElement('div');
            squareElement.setAttribute('class', `square ${squareTypes.emptySquare}`);
            squareElement.setAttribute('id', squareValue);
            board.appendChild(squareElement);
            emptySquares.push(squareValue);
        });
    });
};

// Draw square
const drawSquare = (square, type) => {
    const [row, column] = square.split('');
    boardSquares[row][column] = type;
    const squareElement = document.getElementById(square);
    squareElement.setAttribute('class', `square ${type}`);

    if (type === squareTypes.emptySquare) {
        if (!emptySquares.includes(square)) {
            emptySquares.push(square);
        }
    } else {
        const index = emptySquares.indexOf(square);
        if (index !== -1) emptySquares.splice(index, 1);
    }
};

// Draw snake
const drawSnake = () => {
    snake.forEach(square => drawSquare(square, squareTypes.snakeSquare));
};

// Create food
const createFood = () => {
    if (emptySquares.length === 0) return;
    const randomEmptySquare = emptySquares[Math.floor(Math.random() * emptySquares.length)];
    drawSquare(randomEmptySquare, squareTypes.foodSquare);
};

// Automatic movement logic
const calculateAutoMove = () => {
    const head = snake[snake.length - 1];
    const [headRow, headCol] = head.split('').map(Number);
    let foodPos;

    // Find food position
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (boardSquares[row][col] === squareTypes.foodSquare) {
                foodPos = { row, col };
                break;
            }
        }
        if (foodPos) break;
    }

    if (!foodPos) return currentDirection;

    // Decide direction based on food position
    const directions = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    let bestDirection = currentDirection;
    let minDistance = Infinity;

    directions.forEach(direction => {
        if (!isValidDirectionChange(currentDirection, direction)) return;

        let newRow = headRow;
        let newCol = headCol;

        switch (direction) {
            case 'ArrowRight': newCol += 1; break;
            case 'ArrowLeft': newCol -= 1; break;
            case 'ArrowUp': newRow -= 1; break;
            case 'ArrowDown': newRow += 1; break;
        }

        // Check if move is safe
        if (checkWallCollision(newRow, newCol)) return;
        const newSquare = `${newRow}${newCol}`.padStart(2, '0');
        if (snake.includes(newSquare)) return;

        // Calculate distance to food
        const distance = Math.abs(foodPos.row - newRow) + Math.abs(foodPos.col - newCol);
        if (distance < minDistance) {
            minDistance = distance;
            bestDirection = direction;
        }
    });

    return bestDirection;
};

// Start automatic movement
const startAutoMove = () => {
    const difficulty = difficultySelector.value;
    if (difficulty === '300') return; // Easy mode - no auto move

    const autoMoveSpeed = difficulty === '200' ? 500 : 250; // Medium: 500ms, Hard: 250ms
    autoMoveInterval = setInterval(() => {
        if (!isGameRunning || !moveInterval) return;
        nextDirection = calculateAutoMove();
    }, autoMoveSpeed);
};

// Check collision with walls
const checkWallCollision = (row, col) => {
    return row < 0 || row >= boardSize || col < 0 || col >= boardSize;
};

// Move snake
const moveSnake = () => {
    const currentHead = snake[snake.length - 1];
    const [row, col] = currentHead.split('').map(Number);
    
    let newRow = row;
    let newCol = col;

    if (nextDirection && isValidDirectionChange(currentDirection, nextDirection)) {
        currentDirection = nextDirection;
        nextDirection = null;
    }

    switch (currentDirection) {
        case 'ArrowRight': newCol += 1; break;
        case 'ArrowLeft': newCol -= 1; break;
        case 'ArrowUp': newRow -= 1; break;
        case 'ArrowDown': newRow += 1; break;
    }

    if (checkWallCollision(newRow, newCol)) {
        gameOver();
        return;
    }

    const newSquare = `${newRow}${newCol}`.padStart(2, '0');

    if (snake.includes(newSquare)) {
        gameOver();
        return;
    }

    if (boardSquares[newRow][newCol] === squareTypes.foodSquare) {
        eatFood();
    } else {
        const tail = snake.shift();
        drawSquare(tail, squareTypes.emptySquare);
    }

    snake.push(newSquare);
    drawSnake();
};

// Handle direction change
const isValidDirectionChange = (current, next) => {
    const invalidPairs = {
        'ArrowUp': 'ArrowDown',
        'ArrowDown': 'ArrowUp',
        'ArrowLeft': 'ArrowRight',
        'ArrowRight': 'ArrowLeft'
    };
    return invalidPairs[current] !== next;
};

const handleDirectionChange = (event) => {
    if (!isGameRunning) return;
    
    const key = event.key;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;
    
    event.preventDefault();

    if (difficultySelector.value === '300') {
        // En modo fácil, mueve la serpiente inmediatamente cuando se presiona una tecla
        if (isValidDirectionChange(currentDirection, key)) {
            currentDirection = key;
            moveSnake();
        }
    } else {
        // En otros modos, solo actualiza la dirección
        nextDirection = key;
    }
};

// Start movement
const startMovement = () => {
    const difficulty = difficultySelector.value;
    if (difficulty !== '300') {
        // Solo inicia el intervalo de movimiento automático si NO está en modo fácil
        moveInterval = setInterval(moveSnake, parseInt(difficulty));
    }
    startAutoMove();
};

// Eat food
const eatFood = () => {
    score++;
    updateScore();
    createFood();
};

// Update score
const updateScore = () => {
    scoreBoard.innerText = score;
    if (finalScore) finalScore.innerText = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreBoard.innerText = highScore;
    }
};

// Game over
const gameOver = () => {
    isGameRunning = false;
    clearInterval(moveInterval);
    clearInterval(autoMoveInterval);
    moveInterval = null;
    gameOverSign.style.display = 'flex';
    startButton.disabled = false;
    pauseButton.disabled = true;
    document.removeEventListener('keydown', handleDirectionChange);
};

// Start game
const startGame = () => {
    initializeGame();
    drawSnake();
    createFood();
    isGameRunning = true;
    gameOverSign.style.display = 'none';
    startButton.disabled = true;
    pauseButton.disabled = false;
    document.addEventListener('keydown', handleDirectionChange);
    startMovement();
};

// Pause game
const togglePause = () => {
    if (!isGameRunning) return;
    
    if (moveInterval) {
        clearInterval(moveInterval);
        clearInterval(autoMoveInterval);
        moveInterval = null;
        pauseButton.innerText = 'Resume';
        document.removeEventListener('keydown', handleDirectionChange);
    } else {
        startMovement();
        pauseButton.innerText = 'Pause';
        document.addEventListener('keydown', handleDirectionChange);
    }
};

// Event listeners
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);
difficultySelector.addEventListener('change', () => {
    if (isGameRunning) {
        // Reinicia el movimiento cuando cambia la dificultad
        clearInterval(moveInterval);
        clearInterval(autoMoveInterval);
        moveInterval = null;
        startMovement();
    }
});

// Initialize the game when the page loads
initializeGame();