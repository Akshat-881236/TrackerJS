/**
 * ANH Offline Engagement Engine — track_id_100.115.js
 * 
 * Lightweight offline gaming system for Akshat Network Hub
 * Provides:
 * - Automatic offline detection and engagement
 * - Fully client-side mini-game with canvas rendering
 * - Local score persistence and high-score tracking
 * - Touch and keyboard controls
 * - Graceful reconnection handling
 * - Zero external dependencies
 * 
 * Architecture: Pure client-side, Canvas-based, Memory-optimized
 * 
 * @version 2.0.0
 * @author ANH Offline Team
 * @license MIT
 */

(function (global) {
  'use strict';

  // ============================================================================
  // 1. CONFIGURATION & CONSTANTS
  // ============================================================================

  const CONFIG = {
    OFFLINE_TIMEOUT: 3000, // 3 seconds before showing game
    RECONNECT_CHECK_INTERVAL: 1000, // Check connection every 1 second
    GAME_WIDTH: 400,
    GAME_HEIGHT: 600,
    GAME_FPS: 60,
    FRAME_INTERVAL: 1000 / 60,
    STORAGE_KEY_HIGH_SCORE: 'ANH_OFFLINE_HIGH_SCORE',
    STORAGE_KEY_STATS: 'ANH_OFFLINE_STATS',
    STORAGE_KEY_LAST_SCORE: 'ANH_OFFLINE_LAST_SCORE',
    GRAVITY: 0.6,
    PLAYER_SPEED: 5,
    OBSTACLE_SPEED: 4,
    SPAWN_RATE: 60,
    INITIAL_DIFFICULTY: 1,
    DIFFICULTY_INCREMENT: 0.0005
  };

  // ============================================================================
  // 2. UTILITY FUNCTIONS
  // ============================================================================

  function log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[ANH Offline ${timestamp}] ${message}`, data || '');
  }

  function logError(message, error = null) {
    console.error(`[ANH Offline ERROR] ${message}`, error || '');
  }

  function getStorage(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  function setStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      logError('Failed to set storage', e);
      return false;
    }
  }

  function isOnline() {
    return navigator.onLine;
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function removeElement(el) {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  // ============================================================================
  // 3. OFFLINE DETECTION ENGINE
  // ============================================================================

  class OfflineDetectionEngine {
    constructor() {
      this.isOffline = !isOnline();
      this.offlineStartTime = null;
      this.reconnectTimer = null;
    }

    initialize() {
      window.addEventListener('online', () => this._handleOnline());
      window.addEventListener('offline', () => this._handleOffline());

      this.connectivityCheckInterval = setInterval(() => {
        this._checkConnectivity();
      }, CONFIG.RECONNECT_CHECK_INTERVAL);

      if (!isOnline()) {
        this._handleOffline();
      }

      log('Offline detection engine initialized');
    }

    _handleOffline() {
      if (!this.isOffline) {
        this.isOffline = true;
        this.offlineStartTime = Date.now();
        log('Offline state detected');
      }
    }

    _handleOnline() {
      if (this.isOffline) {
        this.isOffline = false;
        this.offlineStartTime = null;
        log('Online state restored');
      }
    }

    _checkConnectivity() {
      if (isOnline()) {
        this._handleOnline();
      } else {
        this._handleOffline();
      }
    }

    getOfflineDuration() {
      if (!this.isOffline) return 0;
      return Date.now() - (this.offlineStartTime || Date.now());
    }

    shouldShowGame() {
      return this.isOffline && this.getOfflineDuration() > CONFIG.OFFLINE_TIMEOUT;
    }

    destroy() {
      if (this.connectivityCheckInterval) {
        clearInterval(this.connectivityCheckInterval);
      }
    }
  }

  // ============================================================================
  // 4. GAME ENGINE
  // ============================================================================

  class OfflineGameEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.gameRunning = false;
      this.gamePaused = false;
      this.score = 0;
      this.highScore = getStorage(CONFIG.STORAGE_KEY_HIGH_SCORE, 0);
      this.difficulty = CONFIG.INITIAL_DIFFICULTY;
      this.frameCount = 0;
      this.lastFrameTime = 0;
      this.animationFrameId = null;

      this.player = {
        x: CONFIG.GAME_WIDTH / 2 - 15,
        y: CONFIG.GAME_HEIGHT - 80,
        width: 30,
        height: 30,
        velocityX: 0,
        velocityY: 0
      };

      this.obstacles = [];
      this.particles = [];
      this.collectedItems = 0;
      this.keys = {};
      this.touches = {};
    }

    initializeCanvas(canvasElement) {
      this.canvas = canvasElement;
      this.ctx = this.canvas.getContext('2d', { alpha: false });

      this._resizeCanvas();
      window.addEventListener('resize', () => this._resizeCanvas());
    }

    _resizeCanvas() {
      const container = this.canvas.parentElement;
      const width = Math.min(CONFIG.GAME_WIDTH, container.clientWidth - 20);
      const aspectRatio = CONFIG.GAME_HEIGHT / CONFIG.GAME_WIDTH;
      const height = width * aspectRatio;

      this.canvas.width = width;
      this.canvas.height = height;

      this.scaleX = width / CONFIG.GAME_WIDTH;
      this.scaleY = height / CONFIG.GAME_HEIGHT;
    }

    start() {
      this.gameRunning = true;
      this.gamePaused = false;
      this.score = 0;
      this.difficulty = CONFIG.INITIAL_DIFFICULTY;
      this.frameCount = 0;
      this.obstacles = [];
      this.particles = [];
      this.collectedItems = 0;
      this.gameStartTime = Date.now();

      this.player.x = CONFIG.GAME_WIDTH / 2 - 15;
      this.player.y = CONFIG.GAME_HEIGHT - 80;
      this.player.velocityX = 0;
      this.player.velocityY = 0;

      this._attachInputHandlers();
      this._gameLoop();

      log('Game started');
    }

    stop() {
      this.gameRunning = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this._detachInputHandlers();
    }

    pause() {
      this.gamePaused = !this.gamePaused;
    }

    _gameLoop() {
      const now = performance.now();
      const deltaTime = now - this.lastFrameTime;

      if (deltaTime >= CONFIG.FRAME_INTERVAL) {
        if (!this.gamePaused) {
          this.update(deltaTime);
        }
        this.render();
        this.lastFrameTime = now;
      }

      if (this.gameRunning) {
        this.animationFrameId = requestAnimationFrame(() => this._gameLoop());
      }
    }

    update(deltaTime) {
      this.frameCount++;

      this._updatePlayer();

      if (this.frameCount % Math.max(30, CONFIG.SPAWN_RATE - Math.floor(this.difficulty * 10)) === 0) {
        this._spawnObstacle();
      }

      this._updateObstacles();
      this._updateParticles();
      this._checkCollisions();

      this.difficulty += CONFIG.DIFFICULTY_INCREMENT;

      if (this.player.y + this.player.height > CONFIG.GAME_HEIGHT) {
        this._gameOver();
      }
    }

    _updatePlayer() {
      if (this.keys['ArrowLeft'] || this.keys['a']) {
        this.player.velocityX = -CONFIG.PLAYER_SPEED;
      } else if (this.keys['ArrowRight'] || this.keys['d']) {
        this.player.velocityX = CONFIG.PLAYER_SPEED;
      } else {
        this.player.velocityX *= 0.9;
      }

      this.player.velocityY += CONFIG.GRAVITY;

      this.player.x += this.player.velocityX;
      this.player.y += this.player.velocityY;

      this.player.x = clamp(
        this.player.x,
        0,
        CONFIG.GAME_WIDTH - this.player.width
      );

      if (this.player.y + this.player.height >= CONFIG.GAME_HEIGHT - 20) {
        this.player.y = CONFIG.GAME_HEIGHT - 20 - this.player.height;
        this.player.velocityY = 0;
      }
    }

    _spawnObstacle() {
      const type = Math.random() > 0.3 ? 'spike' : 'coin';
      const obstacle = {
        x: randomInt(10, CONFIG.GAME_WIDTH - 10),
        y: -30,
        width: 30,
        height: 30,
        velocityY: CONFIG.OBSTACLE_SPEED + (this.difficulty * 0.5),
        type: type,
        collected: false
      };

      this.obstacles.push(obstacle);
    }

    _updateObstacles() {
      this.obstacles.forEach((obstacle, index) => {
        obstacle.y += obstacle.velocityY;

        if (obstacle.y > CONFIG.GAME_HEIGHT) {
          this.obstacles.splice(index, 1);
          if (obstacle.type === 'spike') {
            this.score += 10;
          }
        }
      });
    }

    _updateParticles() {
      this.particles = this.particles.filter(particle => {
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.velocityY += 0.2;
        particle.life--;
        return particle.life > 0;
      });
    }

    _checkCollisions() {
      this.obstacles.forEach((obstacle, index) => {
        if (this._isColliding(this.player, obstacle)) {
          if (obstacle.type === 'spike') {
            this._gameOver();
          } else if (obstacle.type === 'coin') {
            if (!obstacle.collected) {
              this._collectCoin(obstacle);
              this.obstacles.splice(index, 1);
            }
          }
        }
      });
    }

    _isColliding(rect1, rect2) {
      return rect1.x < rect2.x + rect2.width &&
             rect1.x + rect1.width > rect2.x &&
             rect1.y < rect2.y + rect2.height &&
             rect1.y + rect1.height > rect2.y;
    }

    _collectCoin(coin) {
      this.score += 25;
      this.collectedItems++;
      coin.collected = true;

      for (let i = 0; i < 5; i++) {
        this.particles.push({
          x: coin.x,
          y: coin.y,
          velocityX: (Math.random() - 0.5) * 4,
          velocityY: (Math.random() - 0.5) * 4 - 2,
          life: 20,
          color: '#FFD700'
        });
      }
    }

    _gameOver() {
      this.gameRunning = false;

      if (this.score > this.highScore) {
        this.highScore = this.score;
        setStorage(CONFIG.STORAGE_KEY_HIGH_SCORE, this.highScore);
      }

      const stats = getStorage(CONFIG.STORAGE_KEY_STATS, {
        gamesPlayed: 0,
        totalScore: 0,
        totalPlayTime: 0
      });

      stats.gamesPlayed++;
      stats.totalScore += this.score;
      stats.totalPlayTime += (Date.now() - (this.gameStartTime || Date.now())) / 1000;
      setStorage(CONFIG.STORAGE_KEY_STATS, stats);
      setStorage(CONFIG.STORAGE_KEY_LAST_SCORE, this.score);

      log('Game over', { score: this.score, highScore: this.highScore });
    }

    render() {
      this.ctx.fillStyle = '#0a0e27';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.save();
      this.ctx.scale(this.scaleX, this.scaleY);

      this._drawBackground();
      this._drawPlayer();
      this._drawObstacles();
      this._drawParticles();
      this._drawUI();

      this.ctx.restore();
    }

    _drawBackground() {
      this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
      this.ctx.lineWidth = 1;

      for (let i = 0; i <= CONFIG.GAME_WIDTH; i += 40) {
        this.ctx.beginPath();
        this.ctx.moveTo(i, 0);
        this.ctx.lineTo(i, CONFIG.GAME_HEIGHT);
        this.ctx.stroke();
      }

      for (let i = 0; i <= CONFIG.GAME_HEIGHT; i += 40) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, i);
        this.ctx.lineTo(CONFIG.GAME_WIDTH, i);
        this.ctx.stroke();
      }

      this.ctx.fillStyle = '#667eea';
      this.ctx.fillRect(0, CONFIG.GAME_HEIGHT - 20, CONFIG.GAME_WIDTH, 20);
    }

    _drawPlayer() {
      this.ctx.fillStyle = '#764ba2';
      this.ctx.shadowColor = 'rgba(118, 75, 162, 0.8)';
      this.ctx.shadowBlur = 10;

      this.ctx.beginPath();
      this.ctx.arc(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        this.player.width / 2,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      this.ctx.shadowColor = 'transparent';

      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(this.player.x + 8, this.player.y + 8, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(this.player.x + 22, this.player.y + 8, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    _drawObstacles() {
      this.obstacles.forEach(obstacle => {
        if (obstacle.type === 'spike') {
          this.ctx.fillStyle = '#FF6B6B';
          this.ctx.shadowColor = 'rgba(255, 107, 107, 0.8)';
          this.ctx.shadowBlur = 8;

          this.ctx.beginPath();
          this.ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
          this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
          this.ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
          this.ctx.closePath();
          this.ctx.fill();
        } else if (obstacle.type === 'coin') {
          this.ctx.fillStyle = '#FFD700';
          this.ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
          this.ctx.shadowBlur = 10;

          this.ctx.beginPath();
          this.ctx.arc(
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height / 2,
            obstacle.width / 2,
            0,
            Math.PI * 2
          );
          this.ctx.fill();

          this.ctx.strokeStyle = '#FFA500';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
        }

        this.ctx.shadowColor = 'transparent';
      });
    }

    _drawParticles() {
      this.particles.forEach(particle => {
        this.ctx.fillStyle = particle.color || '#667eea';
        this.ctx.globalAlpha = particle.life / 20;

        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
      });

      this.ctx.globalAlpha = 1;
    }

    _drawUI() {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 24px "Arial", sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`Score: ${this.score}`, 20, 40);

      this.ctx.font = '16px "Arial", sans-serif';
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText(`High: ${this.highScore}`, 20, 70);

      this.ctx.fillStyle = '#667eea';
      this.ctx.font = '12px "Arial", sans-serif';
      this.ctx.fillText(`Difficulty: ${this.difficulty.toFixed(1)}x`, 20, 90);

      if (this.gamePaused) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 48px "Arial", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2);
      }
    }

    _attachInputHandlers() {
      this.keyDownHandler = (e) => {
        this.keys[e.key] = true;

        if (e.key === ' ') {
          this.pause();
          e.preventDefault();
        }
      };

      this.keyUpHandler = (e) => {
        this.keys[e.key] = false;
      };

      this.touchStartHandler = (e) => {
        const touches = e.touches;
        for (let touch of touches) {
          const canvasRect = this.canvas.getBoundingClientRect();
          const touchX = touch.clientX - canvasRect.left;
          const x = touchX / this.scaleX;

          if (x < CONFIG.GAME_WIDTH / 2) {
            this.keys['ArrowLeft'] = true;
          } else {
            this.keys['ArrowRight'] = true;
          }
        }
      };

      this.touchEndHandler = (e) => {
        this.keys['ArrowLeft'] = false;
        this.keys['ArrowRight'] = false;
      };

      window.addEventListener('keydown', this.keyDownHandler);
      window.addEventListener('keyup', this.keyUpHandler);
      this.canvas.addEventListener('touchstart', this.touchStartHandler);
      this.canvas.addEventListener('touchend', this.touchEndHandler);
    }

    _detachInputHandlers() {
      window.removeEventListener('keydown', this.keyDownHandler);
      window.removeEventListener('keyup', this.keyUpHandler);
      this.canvas.removeEventListener('touchstart', this.touchStartHandler);
      this.canvas.removeEventListener('touchend', this.touchEndHandler);
    }
  }

  // ============================================================================
  // 5. OFFLINE RUNTIME UI INJECTOR (IMPROVED)
  // ============================================================================

  class OfflineRuntimeUiInjector {
    constructor() {
      this.containerElement = null;
      this.gameEngine = null;
      this.isInjected = false;
    }

    injectOfflineRuntime() {
      if (this.isInjected) return;

      try {
        this.containerElement = document.createElement('div');
        this.containerElement.id = 'anh-offline-runtime';
        this.containerElement.className = 'anh-offline-runtime';

        this.containerElement.innerHTML = `
          <div class="anh-offline-wrapper">
            <div class="anh-offline-card">
              <!-- Header -->
              <div class="anh-offline-header">
                <div class="anh-offline-header-content">
                  <div class="anh-offline-logo">📡</div>
                  <div class="anh-offline-title-section">
                    <h1 class="anh-offline-title">Offline Mode</h1>
                    <p class="anh-offline-subtitle">Stay Connected With Learning</p>
                  </div>
                </div>
              </div>

              <!-- Game Canvas -->
              <div class="anh-offline-game-container">
                <canvas id="anh-game-canvas"></canvas>
              </div>

              <!-- Stats Row -->
              <div class="anh-offline-stats">
                <div class="anh-stat-box">
                  <span class="anh-stat-label">SCORE</span>
                  <span class="anh-stat-value" id="anh-display-score">0</span>
                </div>
                <div class="anh-stat-divider"></div>
                <div class="anh-stat-box">
                  <span class="anh-stat-label">HIGH SCORE</span>
                  <span class="anh-stat-value" id="anh-display-high">0</span>
                </div>
              </div>

              <!-- Control Buttons -->
              <div class="anh-offline-controls">
                <button id="anh-game-start" class="anh-game-button anh-button-primary">
                  <span class="anh-button-icon">▶</span> Start Game
                </button>
                <button id="anh-game-pause" class="anh-game-button anh-button-secondary" disabled>
                  <span class="anh-button-icon">⏸</span> Pause
                </button>
                <button id="anh-game-restart" class="anh-game-button anh-button-secondary">
                  <span class="anh-button-icon">↻</span> Restart
                </button>
              </div>

              <!-- Instructions -->
              <div class="anh-offline-instructions">
                <h3 class="anh-instructions-title">How to Play</h3>
                <div class="anh-instructions-grid">
                  <div class="anh-instruction-item">
                    <div class="anh-instruction-icon">⌨️</div>
                    <p>Arrow Keys or A/D to Move</p>
                  </div>
                  <div class="anh-instruction-item">
                    <div class="anh-instruction-icon">📱</div>
                    <p>Touch left/right to control</p>
                  </div>
                  <div class="anh-instruction-item">
                    <div class="anh-instruction-icon">⏸️</div>
                    <p>SPACE to Pause</p>
                  </div>
                  <div class="anh-instruction-item">
                    <div class="anh-instruction-icon">🎯</div>
                    <p>Collect coins, avoid spikes</p>
                  </div>
                </div>
              </div>

              <!-- Connection Status -->
              <div class="anh-offline-footer">
                <div class="anh-connection-monitor">
                  <span class="anh-connection-indicator" id="anh-connection-status">🔴</span>
                  <span class="anh-connection-text" id="anh-connection-text">Offline</span>
                </div>
                <p class="anh-offline-branding">Akshat Network Hub • Offline Runtime</p>
              </div>
            </div>
          </div>
        `;

        this._attachStyles();
        document.body.appendChild(this.containerElement);

        this.gameEngine = new OfflineGameEngine();
        const canvas = document.getElementById('anh-game-canvas');
        this.gameEngine.initializeCanvas(canvas);

        this._attachControlHandlers();
        this._startScoreUpdater();

        this.isInjected = true;
        log('Offline runtime UI injected');

      } catch (e) {
        logError('Failed to inject offline runtime UI', e);
      }
    }

    removeOfflineRuntime() {
      try {
        if (this.gameEngine) {
          this.gameEngine.stop();
        }

        removeElement(this.containerElement);
        this.containerElement = null;
        this.gameEngine = null;
        this.isInjected = false;

        log('Offline runtime UI removed');
      } catch (e) {
        logError('Failed to remove offline runtime UI', e);
      }
    }

    updateConnectionStatus() {
      try {
        const indicator = document.getElementById('anh-connection-status');
        const text = document.getElementById('anh-connection-text');

        if (indicator && text) {
          if (isOnline()) {
            indicator.textContent = '🟢';
            text.textContent = 'Online';
            text.style.color = '#4ade80';
          } else {
            indicator.textContent = '🔴';
            text.textContent = 'Offline';
            text.style.color = '#FF6B6B';
          }
        }
      } catch (e) {
        // Silent fail
      }
    }

    _startScoreUpdater() {
      this.scoreUpdateInterval = setInterval(() => {
        try {
          const scoreEl = document.getElementById('anh-display-score');
          const highEl = document.getElementById('anh-display-high');

          if (scoreEl && this.gameEngine) {
            scoreEl.textContent = this.gameEngine.score;
          }

          if (highEl && this.gameEngine) {
            highEl.textContent = this.gameEngine.highScore;
          }
        } catch (e) {
          // Silent fail
        }
      }, 100);
    }

    _attachControlHandlers() {
      try {
        const startBtn = document.getElementById('anh-game-start');
        const pauseBtn = document.getElementById('anh-game-pause');
        const restartBtn = document.getElementById('anh-game-restart');

        if (startBtn) {
          startBtn.addEventListener('click', () => {
            this.gameEngine.gameStartTime = Date.now();
            this.gameEngine.start();
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            pauseBtn.textContent = '⏸ Pause';
          });
        }

        if (pauseBtn) {
          pauseBtn.addEventListener('click', () => {
            this.gameEngine.pause();
            pauseBtn.textContent = this.gameEngine.gamePaused ? '▶ Resume' : '⏸ Pause';
          });
        }

        if (restartBtn) {
          restartBtn.addEventListener('click', () => {
            this.gameEngine.stop();
            this.gameEngine.start();
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            pauseBtn.textContent = '⏸ Pause';
          });
        }
      } catch (e) {
        logError('Failed to attach control handlers', e);
      }
    }

    _attachStyles() {
      if (document.getElementById('anh-offline-styles')) return;

      const style = document.createElement('style');
      style.id = 'anh-offline-styles';
      style.textContent = `
        * {
          -webkit-tap-highlight-color: transparent;
        }

        .anh-offline-runtime {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: linear-gradient(135deg, #0a0e27 0%, #1a0e35 100%);
          z-index: 999998;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 20px;
          animation: fadeIn 0.3s ease-out;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-overflow-scrolling: touch;  /* ✓ Smooth scrolling on iOS */
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .anh-offline-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;  /* ✓ Add this */
          justify-content: flex-start;
          align-items: center;
          min-height: 100%;
          padding: 20px 0;
        }

        .anh-offline-card {
          background: rgba(20, 20, 40, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(102, 126, 234, 0.4);
          border-radius: 20px;
          padding: 32px;
          max-width: 700px;
          width: 100%;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.6),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
          margin: 0 auto;  /* ✓ Center the card */
        }

        /* Header */
        .anh-offline-header {
          margin-bottom: 28px;
        }

        .anh-offline-header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .anh-offline-logo {
          font-size: 48px;
          animation: float 3s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .anh-offline-title-section {
          flex: 1;
        }

        .anh-offline-title {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }

        .anh-offline-subtitle {
          margin: 6px 0 0 0;
          font-size: 14px;
          color: #888;
          font-weight: 500;
        }

        /* Game Container */
        .anh-offline-game-container {
          margin: 24px 0;
          background: linear-gradient(135deg, rgba(10, 14, 39, 0.8) 0%, rgba(26, 14, 53, 0.8) 100%);
          border: 2px solid rgba(102, 126, 234, 0.3);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        #anh-game-canvas {
          display: block;
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          background: #0a0e27;
        }

        /* Stats */
        .anh-offline-stats {
          display: flex;
          gap: 0;
          margin-bottom: 24px;
          background: rgba(102, 126, 234, 0.08);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }

        .anh-stat-box {
          flex: 1;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .anh-stat-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #888;
          text-transform: uppercase;
        }

        .anh-stat-value {
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .anh-stat-divider {
          width: 1px;
          background: rgba(102, 126, 234, 0.2);
        }

        /* Controls */
        .anh-offline-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .anh-game-button {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 140px;
          justify-content: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .anh-button-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .anh-button-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
        }

        .anh-button-secondary {
          background: rgba(102, 126, 234, 0.15);
          color: #667eea;
          border: 1px solid rgba(102, 126, 234, 0.3);
        }

        .anh-button-secondary:hover:not(:disabled) {
          background: rgba(102, 126, 234, 0.25);
          border-color: rgba(102, 126, 234, 0.5);
          transform: translateY(-2px);
        }

        .anh-game-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .anh-button-icon {
          font-size: 16px;
        }

        /* Instructions */
        .anh-offline-instructions {
          background: rgba(102, 126, 234, 0.08);
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .anh-instructions-title {
          margin: 0 0 16px 0;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #667eea;
        }

        .anh-instructions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .anh-instruction-item {
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          background: rgba(10, 14, 39, 0.5);
          border: 1px solid rgba(102, 126, 234, 0.15);
        }

        .anh-instruction-icon {
          font-size: 24px;
          margin-bottom: 8px;
          display: block;
        }

        .anh-instruction-item p {
          margin: 0;
          font-size: 12px;
          color: #888;
          line-height: 1.4;
        }

        /* Footer */
        .anh-offline-footer {
          text-align: center;
          border-top: 1px solid rgba(102, 126, 234, 0.2);
          padding-top: 20px;
        }

        .anh-connection-monitor {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .anh-connection-indicator {
          font-size: 12px;
          animation: blink 1.5s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .anh-connection-text {
          font-size: 13px;
          font-weight: 600;
          color: #FF6B6B;
        }

        .anh-offline-branding {
          margin: 0;
          font-size: 11px;
          color: #666;
          letter-spacing: 0.5px;
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .anh-offline-card {
            padding: 20px;
            border-radius: 16px;
          }

          .anh-offline-header-content {
            gap: 12px;
          }

          .anh-offline-logo {
            font-size: 36px;
          }

          .anh-offline-title {
            font-size: 22px;
          }

          .anh-offline-subtitle {
            font-size: 12px;
          }

          .anh-offline-controls {
            flex-direction: column;
          }

          .anh-game-button {
            min-width: unset;
            width: 100%;
          }

          .anh-instructions-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .anh-instruction-item {
            padding: 8px;
          }

          .anh-instruction-icon {
            font-size: 20px;
          }

          .anh-instruction-item p {
            font-size: 11px;
          }

          .anh-offline-game-container {
            padding: 12px;
          }

          .anh-stat-box {
            padding: 12px;
          }

          .anh-stat-value {
            font-size: 18px;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .anh-offline-logo {
            animation: none;
          }

          .anh-connection-indicator {
            animation: none;
            opacity: 1;
          }

          .anh-game-button:hover:not(:disabled) {
            transform: none;
          }

          .anh-offline-runtime {
            animation: none;
          }
        }

        /* Fix 4: Mobile responsive - Add padding adjustment */
        @media (max-width: 640px) {
          .anh-offline-runtime {
            padding: 12px;  /* ✓ Reduce padding on mobile */
          }
        
          .anh-offline-card {
            padding: 20px;
            border-radius: 16px;
            margin: 0;  /* ✓ Reset margin */
          }
        
          .anh-offline-wrapper {
            padding: 12px 0;  /* ✓ Reduce wrapper padding */
          }
        }
        
        /* Fix 5: Prevent content jumping - add scroll behavior */
        html {
          scroll-behavior: smooth;  /* ✓ Add to HTML selector */
        }
        
        /* Fix 6: Ensure canvas doesn't cause layout shift */
        #anh-game-canvas {
          display: block;
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          background: #0a0e27;
          margin: 0 auto;  /* ✓ Center canvas */
        }
        
        /* Fix 7: Improve button wrapping on smaller screens */
        @media (max-width: 480px) {
          .anh-offline-controls {
            flex-direction: column;
            gap: 10px;
          }
        
          .anh-game-button {
            min-width: unset;
            width: 100%;
            padding: 12px 16px;  /* ✓ Slightly less padding */
          }
        
          .anh-instructions-grid {
            grid-template-columns: 1fr;  /* ✓ Single column on very small screens */
            gap: 8px;
          }
        }
      `;

      document.head.appendChild(style);
    }
  }

  // ============================================================================
  // 6. MAIN ORCHESTRATOR
  // ============================================================================

  class ANHOfflineEngine {
    constructor() {
      this.offlineDetection = new OfflineDetectionEngine();
      this.uiInjector = new OfflineRuntimeUiInjector();
      this.isGameActive = false;
      this.gameShowTimer = null;
    }

    initialize() {
      try {
        log('=== ANH Offline Engine v2.0.0 Initializing ===');

        this.offlineDetection.initialize();
        this._monitorOfflineState();

        log('=== ANH Offline Engine Ready ===');

      } catch (error) {
        logError('Fatal error during initialization', error);
      }
    }

    _monitorOfflineState() {
      const checkInterval = setInterval(() => {
        try {
          if (this.offlineDetection.shouldShowGame()) {
            if (!this.isGameActive) {
              this._showOfflineGame();
            }
          } else if (this.offlineDetection.isOffline === false && this.isGameActive) {
            this._hideOfflineGame();
          }

          if (this.isGameActive) {
            this.uiInjector.updateConnectionStatus();
          }
        } catch (e) {
          logError('Error in offline state monitor', e);
        }
      }, 500);

      window.addEventListener('beforeunload', () => {
        clearInterval(checkInterval);
        this.offlineDetection.destroy();
      });
    }

    _showOfflineGame() {
      try {
        this.uiInjector.injectOfflineRuntime();
        this.isGameActive = true;
        log('Offline game activated');
      } catch (e) {
        logError('Failed to show offline game', e);
      }
    }

    _hideOfflineGame() {
      try {
        this.uiInjector.removeOfflineRuntime();
        this.isGameActive = false;
        log('Offline game deactivated, connection restored');
      } catch (e) {
        logError('Failed to hide offline game', e);
      }
    }
  }

  // ============================================================================
  // 7. BOOTSTRAP & INITIALIZATION
  // ============================================================================

  function bootstrap() {
    const engine = new ANHOfflineEngine();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        engine.initialize();
      });
    } else {
      engine.initialize();
    }
  }

  bootstrap();

})(window);
