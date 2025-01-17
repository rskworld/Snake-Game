$(document).ready(function() {
    // RSK World Snake Game Configuration
    const config = {
        gridSize: 10,  // Smaller grid for more classic feel
        tileCount: 32, // Typical Nokia screen resolution
        gameSpeed: 150, // Slower speed for classic feel
        specialFoodDuration: 5000, // 5 seconds for special food
        colors: {
            background: '#000',
            snake: '#0f0',
            normalFood: '#0f0',
            specialFood: '#f00',  // Red for special food
            powerUp: '#00f'  // Blue for power-ups
        },
        powerUps: {
            invincibility: 5000,  // 5 seconds of invincibility
            speedBoost: 3000      // 3 seconds of speed boost
        }
    };

    // Sound Effect Management
    const sounds = {
        background: $('#backgroundMusic')[0],
        move: $('#moveSound')[0],
        eat: $('#eatSound')[0],
        gameOver: $('#gameOverSound')[0]
    };

    // Enhanced Sound Control Functions
    function playBackgroundMusic() {
        try {
            console.log('Attempting to play background music');
            
            // Ensure audio is not already playing
            if (sounds.background.paused) {
                sounds.background.volume = 0.3;
                sounds.background.loop = true;
                
                sounds.background.play()
                    .then(() => console.log('Background music started successfully'))
                    .catch(error => {
                        console.error('Error playing background music:', error);
                        alert('Music playback blocked. Click "Start Game" to enable sounds.');
                    });
            }
        } catch (error) {
            console.error('Unexpected error in playBackgroundMusic:', error);
        }
    }

    function stopBackgroundMusic() {
        try {
            sounds.background.pause();
            sounds.background.currentTime = 0;
        } catch (error) {
            console.error('Error stopping background music:', error);
        }
    }

    function playMoveSound() {
        try {
            sounds.move.currentTime = 0;
            sounds.move.play().catch(e => console.log('Move sound play error:', e));
        } catch (error) {
            console.error('Error playing move sound:', error);
        }
    }

    function playEatSound() {
        try {
            sounds.eat.currentTime = 0;
            sounds.eat.play().catch(e => console.log('Eat sound play error:', e));
        } catch (error) {
            console.error('Error playing eat sound:', error);
        }
    }

    function playGameOverSound() {
        try {
            stopBackgroundMusic();
            sounds.gameOver.play().catch(e => console.log('Game over sound play error:', e));
        } catch (error) {
            console.error('Error playing game over sound:', error);
        }
    }

    // Sound toggle functionality
    $('#soundToggle').click(function() {
        try {
            const isMuted = sounds.background.muted;
            Object.values(sounds).forEach(sound => {
                sound.muted = !isMuted;
            });
            $(this).text(isMuted ? 'Mute' : 'Unmute');
            
            // Try to play background music if unmuting
            if (!isMuted && sounds.background.paused) {
                playBackgroundMusic();
            }
        } catch (error) {
            console.error('Error toggling sound:', error);
        }
    });

    // Game State Management
    const gameState = {
        snake: [{x: 16, y: 16}],
        food: null,
        specialFood: null,
        powerUp: null,
        direction: {dx: 1, dy: 0},
        score: 0,
        highScore: 0,
        isRunning: false,
        gameInterval: null,
        lastTouchX: null,
        lastTouchY: null,
        specialFoodTimer: null,
        powerUpTimer: null,
        invincible: false,
        speedBoost: false
    };

    // Game Metadata
    const gameMetadata = {
        version: '1.0.0',
        developer: {
            name: 'RSK World',
            website: 'https://rskworld.in',
            email: 'hello@rskworld.in',
            phone: '93305399277'
        }
    };

    // Leaderboard Management with Enhanced Features
    const leaderboardManager = {
        key: 'rskWorldSnakeLeaderboard',
        
        saveScore() {
            try {
                const leaderboard = this.getLeaderboard();
                const playerName = this.getPlayerName();
                
                leaderboard.push({
                    score: gameState.score,
                    date: new Date().toISOString(),
                    playerName: playerName
                });
                
                const sortedLeaderboard = leaderboard
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10);
                
                localStorage.setItem(this.key, JSON.stringify(sortedLeaderboard));
            } catch (error) {
                console.error('Error saving score:', error);
                alert('Failed to save score. Please check your browser settings.');
            }
        },
        
        getLeaderboard() {
            try {
                const leaderboard = localStorage.getItem(this.key);
                return leaderboard ? JSON.parse(leaderboard) : [];
            } catch (error) {
                console.error('Error retrieving leaderboard:', error);
                return [];
            }
        },
        
        getPlayerName() {
            try {
                const savedName = localStorage.getItem('rskWorldPlayerName');
                if (savedName) return savedName;
                
                const playerName = prompt('Enter your name for the leaderboard:') || 'Anonymous';
                localStorage.setItem('rskWorldPlayerName', playerName);
                return playerName;
            } catch (error) {
                console.error('Error getting player name:', error);
                return 'Anonymous';
            }
        }
    };

    // Game Canvas Setup
    const canvas = $('#gameCanvas')[0];
    const ctx = canvas.getContext('2d');
    
    // Responsive canvas sizing
    function resizeCanvas() {
        try {
            const container = $('#game-container');
            const containerWidth = container.width();
            const size = Math.min(containerWidth, window.innerHeight * 0.6);
            
            canvas.width = size;
            canvas.height = size;
            
            // Redraw game state after resize
            drawBackground();
            drawSnake();
            drawFood();
        } catch (error) {
            console.error('Error resizing canvas:', error);
        }
    }

    // Initial canvas setup
    resizeCanvas();
    $(window).on('resize', resizeCanvas);

    // Render Functions
    function drawBackground() {
        ctx.fillStyle = config.colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawSnake() {
        const gridSize = canvas.width / config.tileCount;
        ctx.fillStyle = config.colors.snake;
        
        gameState.snake.forEach((segment, index) => {
            // First segment (head) slightly different
            if (index === 0) {
                ctx.fillRect(
                    segment.x * gridSize, 
                    segment.y * gridSize, 
                    gridSize, 
                    gridSize
                );
            } else {
                // Body segments with small gaps for classic look
                ctx.fillRect(
                    segment.x * gridSize + 1, 
                    segment.y * gridSize + 1, 
                    gridSize - 2, 
                    gridSize - 2
                );
            }
        });
    }

    function drawFood() {
        const gridSize = canvas.width / config.tileCount;
        
        // Normal food
        if (gameState.food) {
            ctx.fillStyle = config.colors.normalFood;
            ctx.fillRect(
                gameState.food.x * gridSize + 2, 
                gameState.food.y * gridSize + 2, 
                gridSize - 4, 
                gridSize - 4
            );
        }

        // Special food
        if (gameState.specialFood) {
            ctx.fillStyle = config.colors.specialFood;
            ctx.fillRect(
                gameState.specialFood.x * gridSize + 1, 
                gameState.specialFood.y * gridSize + 1, 
                gridSize - 2, 
                gridSize - 2
            );
        }

        // Power-up
        if (gameState.powerUp) {
            ctx.fillStyle = config.colors.powerUp;
            ctx.fillRect(
                gameState.powerUp.x * gridSize + 1, 
                gameState.powerUp.y * gridSize + 1, 
                gridSize - 2, 
                gridSize - 2
            );
        }
    }

    function updateScoreDisplay() {
        try {
            $('#scoreDisplay').text(gameState.score);
            
            const leaderboard = leaderboardManager.getLeaderboard();
            const highScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
            $('#highScoreDisplay').text(highScore);
        } catch (error) {
            console.error('Error updating score display:', error);
        }
    }

    // Food Generation
    function generateFood() {
        const gridSize = canvas.width / config.tileCount;
        
        // Normal food generation
        while (true) {
            const newFood = {
                x: Math.floor(Math.random() * config.tileCount),
                y: Math.floor(Math.random() * config.tileCount)
            };

            if (!gameState.snake.some(segment => 
                segment.x === newFood.x && segment.y === newFood.y
            )) {
                gameState.food = newFood;
                break;
            }
        }

        // Special food generation (20% chance)
        if (Math.random() < 0.2 && !gameState.specialFood) {
            while (true) {
                const newSpecialFood = {
                    x: Math.floor(Math.random() * config.tileCount),
                    y: Math.floor(Math.random() * config.tileCount)
                };

                if (!gameState.snake.some(segment => 
                    segment.x === newSpecialFood.x && segment.y === newSpecialFood.y
                ) && newSpecialFood.x !== gameState.food.x && newSpecialFood.y !== gameState.food.y) {
                    gameState.specialFood = newSpecialFood;
                    
                    // Remove special food after duration
                    gameState.specialFoodTimer = setTimeout(() => {
                        gameState.specialFood = null;
                    }, config.specialFoodDuration);
                    break;
                }
            }
        }

        // Power-up generation (10% chance)
        generatePowerUp();
    }

    // Additional Game Mechanics
    function generatePowerUp() {
        // 10% chance of power-up
        if (Math.random() < 0.1 && !gameState.powerUp) {
            while (true) {
                const newPowerUp = {
                    x: Math.floor(Math.random() * config.tileCount),
                    y: Math.floor(Math.random() * config.tileCount),
                    type: Math.random() < 0.5 ? 'invincibility' : 'speedBoost'
                };

                if (!gameState.snake.some(segment => 
                    segment.x === newPowerUp.x && segment.y === newPowerUp.y
                ) && newPowerUp.x !== gameState.food.x && newPowerUp.y !== gameState.food.y) {
                    gameState.powerUp = newPowerUp;
                    
                    // Remove power-up after duration
                    gameState.powerUpTimer = setTimeout(() => {
                        gameState.powerUp = null;
                    }, config.powerUps.invincibility);
                    break;
                }
            }
        }
    }

    function applyPowerUp(type) {
        switch(type) {
            case 'invincibility':
                gameState.invincible = true;
                setTimeout(() => {
                    gameState.invincible = false;
                }, config.powerUps.invincibility);
                break;
            case 'speedBoost':
                gameState.speedBoost = true;
                const originalSpeed = config.gameSpeed;
                config.gameSpeed /= 2; // Double speed
                setTimeout(() => {
                    gameState.speedBoost = false;
                    config.gameSpeed = originalSpeed;
                }, config.powerUps.speedBoost);
                break;
        }
    }

    // Game Logic
    function moveSnake() {
        const gridSize = canvas.width / config.tileCount;
        const head = {
            x: (gameState.snake[0].x + gameState.direction.dx + config.tileCount) % config.tileCount,
            y: (gameState.snake[0].y + gameState.direction.dy + config.tileCount) % config.tileCount
        };

        // Check power-up collision
        if (gameState.powerUp && head.x === gameState.powerUp.x && head.y === gameState.powerUp.y) {
            applyPowerUp(gameState.powerUp.type);
            gameState.powerUp = null;
            clearTimeout(gameState.powerUpTimer);
        }

        // Check normal food collision
        if (gameState.food && head.x === gameState.food.x && head.y === gameState.food.y) {
            gameState.score++;
            playEatSound(); // Play eat sound
            generateFood();
            gameState.snake.push({...gameState.snake[gameState.snake.length - 1]});
        }

        // Check special food collision
        if (gameState.specialFood && head.x === gameState.specialFood.x && head.y === gameState.specialFood.y) {
            gameState.score += 5;  // More points for special food
            playEatSound(); // Play eat sound
            clearTimeout(gameState.specialFoodTimer);
            gameState.specialFood = null;
            gameState.snake.push({...gameState.snake[gameState.snake.length - 1]});
        }

        // Update score display
        updateScoreDisplay();

        // Move snake body
        for (let i = gameState.snake.length - 1; i > 0; i--) {
            gameState.snake[i] = {...gameState.snake[i-1]};
        }

        // Check self-collision
        if (!gameState.invincible) {
            for (let i = 1; i < gameState.snake.length; i++) {
                if (head.x === gameState.snake[i].x && head.y === gameState.snake[i].y) {
                    endGame();
                    return;
                }
            }
        }

        // Update head
        gameState.snake[0] = head;
    }

    function startGame() {
        if (!gameState.isRunning) {
            gameState.isRunning = true;
            gameState.snake = [{x: 16, y: 16}];
            gameState.direction = {dx: 1, dy: 0};
            gameState.score = 0;
            gameState.invincible = false;
            gameState.speedBoost = false;
            
            updateScoreDisplay();
            generateFood();
            
            gameState.gameInterval = setInterval(gameLoop, config.gameSpeed);
            
            // Play background music
            playBackgroundMusic();
            
            // Disable start button during game
            $('#startButton').prop('disabled', true);
            $('#resetButton').prop('disabled', false);
        }
    }

    function endGame() {
        // Play game over sound
        playGameOverSound();
        
        // Save score to leaderboard
        leaderboardManager.saveScore();
        
        // Clear timers
        if (gameState.specialFoodTimer) {
            clearTimeout(gameState.specialFoodTimer);
        }
        if (gameState.powerUpTimer) {
            clearTimeout(gameState.powerUpTimer);
        }
        
        resetGame();
    }

    function resetGame() {
        clearInterval(gameState.gameInterval);
        gameState.isRunning = false;
        
        gameState.snake = [{x: 16, y: 16}];
        gameState.direction = {dx: 1, dy: 0};
        gameState.score = 0;
        gameState.specialFood = null;
        gameState.powerUp = null;
        gameState.invincible = false;
        gameState.speedBoost = false;
        
        updateScoreDisplay();
        drawBackground();
        drawSnake();
        generateFood();
        
        // Stop background music
        stopBackgroundMusic();
        
        // Reset button states
        $('#startButton').prop('disabled', false);
        $('#resetButton').prop('disabled', true);
    }

    // Game Loop
    function gameLoop() {
        moveSnake();
        drawBackground();
        drawSnake();
        drawFood();
    }

    // Touch Controls
    function handleTouchStart(e) {
        if (!gameState.isRunning) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        gameState.lastTouchX = touch.clientX - rect.left;
        gameState.lastTouchY = touch.clientY - rect.top;
    }

    function handleTouchMove(e) {
        if (!gameState.isRunning || !gameState.lastTouchX || !gameState.lastTouchY) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;
        
        const deltaX = currentX - gameState.lastTouchX;
        const deltaY = currentY - gameState.lastTouchY;
        
        // Determine direction based on touch movement
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal movement
            if (deltaX > 0 && gameState.direction.dx !== -1) {
                gameState.direction = {dx: 1, dy: 0};
                playMoveSound(); // Play move sound
            } else if (deltaX < 0 && gameState.direction.dx !== 1) {
                gameState.direction = {dx: -1, dy: 0};
                playMoveSound(); // Play move sound
            }
        } else {
            // Vertical movement
            if (deltaY > 0 && gameState.direction.dy !== -1) {
                gameState.direction = {dx: 0, dy: 1};
                playMoveSound(); // Play move sound
            } else if (deltaY < 0 && gameState.direction.dy !== 1) {
                gameState.direction = {dx: 0, dy: -1};
                playMoveSound(); // Play move sound
            }
        }
        
        // Update last touch position
        gameState.lastTouchX = currentX;
        gameState.lastTouchY = currentY;
        
        // Prevent default to stop scrolling
        e.preventDefault();
    }

    // Keyboard Controls
    $(document).keydown(function(e) {
        if (!gameState.isRunning) return;

        switch(e.key) {
            case 'ArrowUp':    
                if (gameState.direction.dy !== 1)  { 
                    gameState.direction = {dx: 0, dy: -1}; 
                    playMoveSound(); // Play move sound
                } 
                break;
            case 'ArrowDown':  
                if (gameState.direction.dy !== -1) { 
                    gameState.direction = {dx: 0, dy: 1}; 
                    playMoveSound(); // Play move sound
                } 
                break;
            case 'ArrowLeft':  
                if (gameState.direction.dx !== 1)  { 
                    gameState.direction = {dx: -1, dy: 0}; 
                    playMoveSound(); // Play move sound
                } 
                break;
            case 'ArrowRight': 
                if (gameState.direction.dx !== -1) { 
                    gameState.direction = {dx: 1, dy: 0}; 
                    playMoveSound(); // Play move sound
                } 
                break;
        }
    });

    // Touch Event Listeners
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Button Event Listeners
    $('#startButton').click(startGame);
    $('#resetButton').click(resetGame).prop('disabled', true);

    // Leaderboard Display
    function displayLeaderboard() {
        const leaderboard = leaderboardManager.getLeaderboard();
        const leaderboardHtml = leaderboard.map((entry, index) => 
            `<tr>
                <td>${index + 1}</td>
                <td>${entry.playerName}</td>
                <td>${entry.score}</td>
                <td>${new Date(entry.date).toLocaleDateString()}</td>
            </tr>`
        ).join('');

        $('#leaderboardBody').html(leaderboardHtml);
    }

    // Additional UI and Game Information Functions
    function displayGameInfo() {
        $('#gameInfoModal .modal-body').html(`
            <p><strong>Version:</strong> ${gameMetadata.version}</p>
            <p><strong>Developer:</strong> ${gameMetadata.developer.name}</p>
            <p><strong>Website:</strong> <a href="${gameMetadata.developer.website}" target="_blank">${gameMetadata.developer.website}</a></p>
            <p><strong>Contact:</strong> 
                <br>Email: <a href="mailto:${gameMetadata.developer.email}">${gameMetadata.developer.email}</a>
                <br>Phone: ${gameMetadata.developer.phone}
            </p>
        `);
    }

    // Add event listeners for modals
    $('#leaderboardButton').click(displayLeaderboard);
    $('#gameInfoButton').click(displayGameInfo);

    // Initial Setup
    drawBackground();
    drawSnake();
    generateFood();
    updateScoreDisplay();
});