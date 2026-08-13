        (function() {
            // ---- Récupération des éléments ----
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            const livesCanvas = document.getElementById('livesCanvas');
            const livesCtx = livesCanvas.getContext('2d');
            const scoreDisplay = document.getElementById('scoreDisplay');
            const highScoreDisplay = document.getElementById('highScoreDisplay');
            const waveDisplay = document.getElementById('waveDisplay');

            const CANVAS_W = 480;
            const CANVAS_H = 640;

            // ---- Paramètres du jeu ----
            const BRICK_ROWS = 8;
            const BRICKS_PER_ROW = 12;
            const BRICK_W = CANVAS_W / BRICKS_PER_ROW; // 40px
            const BRICK_H = 22;
            const BRICK_GAP_Y = 2;
            const BRICKS_START_Y = 20;
            const PADDLE_W = 90;
            const PADDLE_H = 22;
            const PADDLE_Y = CANVAS_H - 45;
            const BALL_RADIUS = 7;
            const BASE_BALL_SPEED = 5.0;
            const MAX_LIVES = 3;

            const ROW_COLORS = [
                '#ffffff', '#ff8800', '#00ffff', '#ff2222',
                '#ffdd00', '#1a3a8a', '#cc44cc', '#00ff44'
            ];
            const ROW_POINTS = [80, 70, 60, 50, 40, 30, 20, 10];

            // ---- État ----
            let score = 0;
            let highScore = 50000;
            let wave = 1;
            let lives = MAX_LIVES;
            let gameState = 'waiting'; // 'waiting' | 'playing' | 'gameover'
            let paddleX = CANVAS_W / 2;
            let ballX = CANVAS_W / 2;
            let ballY = PADDLE_Y - PADDLE_H / 2 - BALL_RADIUS;
            let ballDX = 0;
            let ballDY = 0;
            let currentBallSpeed = BASE_BALL_SPEED;
            let bricks = [];
            let particles = [];
            let prevBallX = ballX;
            let prevBallY = ballY;

            // ---- Initialisation ----
            function initBricks() {
                bricks = [];
                for (let row = 0; row < BRICK_ROWS; row++) {
                    bricks[row] = [];
                    for (let col = 0; col < BRICKS_PER_ROW; col++) {
                        bricks[row][col] = true;
                    }
                }
            }

            function resetBall() {
                ballX = paddleX;
                ballY = PADDLE_Y - PADDLE_H / 2 - BALL_RADIUS - 2;
                ballDX = 0;
                ballDY = 0;
                prevBallX = ballX;
                prevBallY = ballY;
                gameState = 'waiting';
            }

            function launchBall() {
                if (gameState !== 'waiting') return;
                const angle = (Math.random() - 0.5) * (Math.PI / 3);
                ballDX = Math.sin(angle) * currentBallSpeed;
                ballDY = -Math.cos(angle) * currentBallSpeed;
                if (Math.abs(ballDY) < currentBallSpeed * 0.5) {
                    ballDY = -currentBallSpeed * 0.5;
                    const mag = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
                    ballDX = (ballDX / mag) * currentBallSpeed;
                    ballDY = (ballDY / mag) * currentBallSpeed;
                }
                gameState = 'playing';
            }

            function initGame() {
                score = 0;
                wave = 1;
                lives = MAX_LIVES;
                currentBallSpeed = BASE_BALL_SPEED;
                paddleX = CANVAS_W / 2;
                initBricks();
                resetBall();
                particles = [];
                updateHUD();
                gameState = 'waiting';
            }

            function nextWave() {
                wave++;
                currentBallSpeed = BASE_BALL_SPEED * (1 + (wave - 1) * 0.18);
                if (currentBallSpeed > BASE_BALL_SPEED * 3.5) {
                    currentBallSpeed = BASE_BALL_SPEED * 3.5;
                }
                paddleX = CANVAS_W / 2;
                initBricks();
                resetBall();
                particles = [];
                updateHUD();
            }

            function loseLife() {
                lives--;
                updateHUD();
                if (lives <= 0) {
                    gameState = 'gameover';
                    if (score > highScore) {
                        highScore = score;
                        try { localStorage.setItem('arkanoid_highscore', highScore); } catch (e) {}
                    }
                    updateHUD();
                } else {
                    resetBall();
                    particles = [];
                }
            }

            function updateHUD() {
                scoreDisplay.textContent = String(score).padStart(6, '0');
                highScoreDisplay.textContent = String(highScore).padStart(6, '0');
                waveDisplay.textContent = String(wave).padStart(2, '0');
                drawLivesIcons();
            }

            function drawLivesIcons() {
                const lw = livesCanvas.width;
                const lh = livesCanvas.height;
                livesCtx.clearRect(0, 0, lw, lh);
                const iconW = 28;
                const iconH = 14;
                const spacing = 10;
                const totalIcons = Math.min(lives, MAX_LIVES);
                const totalWidth = totalIcons * iconW + (totalIcons - 1) * spacing;
                let startX = (lw - totalWidth) / 2;
                const centerY = lh / 2;
                for (let i = 0; i < totalIcons; i++) {
                    const cx = startX + i * (iconW + spacing) + iconW / 2;
                    drawMiniPaddle(livesCtx, cx, centerY, iconW, iconH);
                }
            }

            function drawMiniPaddle(ctx, cx, cy, w, h) {
                const hw = w / 2;
                const hh = h / 2;
                ctx.beginPath();
                ctx.moveTo(cx - hw + 3, cy - hh);
                ctx.quadraticCurveTo(cx, cy - hh - 2, cx + hw - 3, cy - hh);
                ctx.lineTo(cx + hw - 1, cy + hh - 2);
                ctx.quadraticCurveTo(cx + hw, cy + hh, cx + hw - 2, cy + hh);
                ctx.lineTo(cx - hw + 2, cy + hh);
                ctx.quadraticCurveTo(cx - hw, cy + hh, cx - hw + 1, cy + hh - 2);
                ctx.closePath();
                ctx.fillStyle = '#4488FF';
                ctx.fill();
                ctx.strokeStyle = '#FF4444';
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - hw + 5, cy - hh + 1.5);
                ctx.quadraticCurveTo(cx, cy - hh - 1, cx + hw - 5, cy - hh + 1.5);
                ctx.strokeStyle = '#FFFFFFCC';
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }

            // ---- Particules ----
            function spawnParticles(x, y, color) {
                const count = 10 + Math.floor(Math.random() * 6);
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 1.5 + Math.random() * 3.5;
                    particles.push({
                        x: x,
                        y: y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 18 + Math.floor(Math.random() * 18),
                        maxLife: 36,
                        color: color,
                        size: 1.5 + Math.random() * 2.5
                    });
                }
            }

            function updateParticles() {
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.06;
                    p.life--;
                    if (p.life <= 0) particles.splice(i, 1);
                }
            }

            function drawParticles(ctx) {
                const hexToRgba = (hex, a) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `rgba(${r},${g},${b},${a})`;
                };
                for (const p of particles) {
                    const alpha = p.life / p.maxLife;
                    if (p.color.startsWith('#')) {
                        ctx.fillStyle = hexToRgba(p.color, alpha);
                    } else if (p.color.startsWith('rgb')) {
                        ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
                    } else {
                        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                    }
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // ---- Dessin ----
            function drawBackground(ctx) {
                const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
                grad.addColorStop(0, '#060620');
                grad.addColorStop(0.5, '#0a0a30');
                grad.addColorStop(1, '#050518');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
                ctx.strokeStyle = '#1a1a4a';
                ctx.lineWidth = 0.5;
                const gridSpacing = 30;
                for (let x = gridSpacing; x < CANVAS_W; x += gridSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, CANVAS_H);
                    ctx.stroke();
                }
                for (let y = gridSpacing; y < CANVAS_H; y += gridSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(CANVAS_W, y);
                    ctx.stroke();
                }
                ctx.strokeStyle = '#ff333322';
                ctx.lineWidth = 1;
                ctx.setLineDash([10, 20]);
                ctx.beginPath();
                ctx.moveTo(0, CANVAS_H - 20);
                ctx.lineTo(CANVAS_W, CANVAS_H - 20);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            function drawBricks(ctx) {
                for (let row = 0; row < BRICK_ROWS; row++) {
                    for (let col = 0; col < BRICKS_PER_ROW; col++) {
                        if (!bricks[row][col]) continue;
                        const bx = col * BRICK_W;
                        const by = BRICKS_START_Y + row * (BRICK_H + BRICK_GAP_Y);
                        const color = ROW_COLORS[row];
                        const brickGrad = ctx.createLinearGradient(bx, by, bx, by + BRICK_H);
                        brickGrad.addColorStop(0, color);
                        brickGrad.addColorStop(0.5, color);
                        brickGrad.addColorStop(1, '#00000044');
                        ctx.fillStyle = brickGrad;
                        ctx.fillRect(bx + 0.5, by + 0.5, BRICK_W - 1, BRICK_H - 1);
                        ctx.fillStyle = '#ffffff33';
                        ctx.fillRect(bx + 1, by + 1, BRICK_W - 2, 3);
                        ctx.strokeStyle = '#00000066';
                        ctx.lineWidth = 0.8;
                        ctx.strokeRect(bx + 0.5, by + 0.5, BRICK_W - 1, BRICK_H - 1);
                        ctx.fillStyle = '#ffffff55';
                        ctx.beginPath();
                        ctx.arc(bx + BRICK_W - 6, by + 6, 2.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            function drawPaddle(ctx, x, y) {
                const hw = PADDLE_W / 2;
                const hh = PADDLE_H / 2;
                const cx = x,
                    cy = y;
                ctx.save();
                ctx.shadowColor = '#00ffff88';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.moveTo(cx - hw + 8, cy - hh);
                ctx.quadraticCurveTo(cx, cy - hh - 4, cx + hw - 8, cy - hh);
                ctx.lineTo(cx + hw - 3, cy + hh - 4);
                ctx.quadraticCurveTo(cx + hw + 1, cy + hh, cx + hw - 4, cy + hh + 1);
                ctx.lineTo(cx - hw + 4, cy + hh + 1);
                ctx.quadraticCurveTo(cx - hw - 1, cy + hh, cx - hw + 3, cy + hh - 4);
                ctx.closePath();
                const bodyGrad = ctx.createLinearGradient(cx, cy - hh, cx, cy + hh);
                bodyGrad.addColorStop(0, '#5599FF');
                bodyGrad.addColorStop(0.4, '#3366CC');
                bodyGrad.addColorStop(0.7, '#2244AA');
                bodyGrad.addColorStop(1, '#1A3377');
                ctx.fillStyle = bodyGrad;
                ctx.fill();
                ctx.strokeStyle = '#FF3333';
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.moveTo(cx - hw + 13, cy - hh + 2);
                ctx.quadraticCurveTo(cx, cy - hh - 1, cx + hw - 13, cy - hh + 2);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1.8;
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - hw + 18, cy - hh + 5);
                ctx.quadraticCurveTo(cx, cy - hh + 1.5, cx + hw - 18, cy - hh + 5);
                ctx.strokeStyle = '#FFFFFF88';
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.fillStyle = '#FFFFFF33';
                ctx.beginPath();
                ctx.ellipse(cx, cy - 1, hw * 0.25, hh * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF66';
                ctx.lineWidth = 0.6;
                ctx.stroke();
                const dotColors = ['#FF6666', '#FF4444', '#FF2222'];
                for (let side = -1; side <= 1; side += 2) {
                    for (let d = 0; d < 2; d++) {
                        const dotX = cx + side * (hw - 10 - d * 8);
                        const dotY = cy + hh - 7 + d * 4;
                        ctx.fillStyle = dotColors[d];
                        ctx.beginPath();
                        ctx.arc(dotX, dotY, 2.2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }

            // ---- BALLE PARFAITEMENT NETTE (sans dégradé ni ombre) ----
            function drawBall(ctx, x, y) {
                ctx.beginPath();
                ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.strokeStyle = '#aaaaaa';
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }

            // ---- Collisions ----
            function getBrickBounds(row, col) {
                const bx = col * BRICK_W;
                const by = BRICKS_START_Y + row * (BRICK_H + BRICK_GAP_Y);
                return { left: bx, top: by, right: bx + BRICK_W, bottom: by + BRICK_H };
            }

            function checkBrickCollisions() {
                const ballLeft = ballX - BALL_RADIUS;
                const ballRight = ballX + BALL_RADIUS;
                const ballTop = ballY - BALL_RADIUS;
                const ballBottom = ballY + BALL_RADIUS;
                for (let row = 0; row < BRICK_ROWS; row++) {
                    for (let col = 0; col < BRICKS_PER_ROW; col++) {
                        if (!bricks[row][col]) continue;
                        const b = getBrickBounds(row, col);
                        if (ballRight > b.left && ballLeft < b.right && ballBottom > b.top && ballTop < b.bottom) {
                            const overlapLeft = ballRight - b.left;
                            const overlapRight = b.right - ballLeft;
                            const overlapTop = ballBottom - b.top;
                            const overlapBottom = b.bottom - ballTop;
                            const minOverlapX = Math.min(overlapLeft, overlapRight);
                            const minOverlapY = Math.min(overlapTop, overlapBottom);
                            bricks[row][col] = false;
                            spawnParticles(b.left + BRICK_W / 2, b.top + BRICK_H / 2, ROW_COLORS[row]);
                            score += ROW_POINTS[row];
                            if (score > highScore) {
                                highScore = score;
                                try { localStorage.setItem('arkanoid_highscore', highScore); } catch (e) {}
                            }
                            if (minOverlapX < minOverlapY) {
                                ballDX = -ballDX;
                                ballX = (overlapLeft < overlapRight) ? b.left - BALL_RADIUS : b.right + BALL_RADIUS;
                            } else {
                                ballDY = -ballDY;
                                ballY = (overlapTop < overlapBottom) ? b.top - BALL_RADIUS : b.bottom + BALL_RADIUS;
                            }
                            prevBallX = ballX - ballDX;
                            prevBallY = ballY - ballDY;
                            updateHUD();
                            return true;
                        }
                    }
                }
                return false;
            }

            function allBricksDestroyed() {
                for (let row = 0; row < BRICK_ROWS; row++) {
                    for (let col = 0; col < BRICKS_PER_ROW; col++) {
                        if (bricks[row][col]) return false;
                    }
                }
                return true;
            }

            function checkPaddleCollision() {
                const paddleLeft = paddleX - PADDLE_W / 2;
                const paddleRight = paddleX + PADDLE_W / 2;
                const paddleTop = PADDLE_Y - PADDLE_H / 2;
                const paddleBottom = PADDLE_Y + PADDLE_H / 2;
                if (ballX + BALL_RADIUS > paddleLeft && ballX - BALL_RADIUS < paddleRight &&
                    ballY + BALL_RADIUS >= paddleTop && ballY - BALL_RADIUS <= paddleBottom && ballDY > 0) {
                    if (prevBallY + BALL_RADIUS <= paddleTop + 2) {
                        const hitPos = (ballX - paddleX) / (PADDLE_W / 2);
                        const clampedHit = Math.max(-1, Math.min(1, hitPos));
                        const maxAngle = Math.PI / 3;
                        const bounceAngle = clampedHit * maxAngle;
                        ballDX = Math.sin(bounceAngle) * currentBallSpeed;
                        ballDY = -Math.cos(bounceAngle) * currentBallSpeed;
                        const minVy = currentBallSpeed * 0.4;
                        if (Math.abs(ballDY) < minVy) {
                            ballDY = -minVy;
                            const remainingSpeed = Math.sqrt(Math.max(0, currentBallSpeed * currentBallSpeed - ballDY *
                            ballDY));
                            ballDX = Math.sign(ballDX) * remainingSpeed;
                        }
                        ballY = paddleTop - BALL_RADIUS - 1;
                        prevBallY = ballY;
                        prevBallX = ballX;
                        ballDX += (Math.random() - 0.5) * 0.4;
                        const mag = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
                        ballDX = (ballDX / mag) * currentBallSpeed;
                        ballDY = (ballDY / mag) * currentBallSpeed;
                        return true;
                    }
                }
                return false;
            }

            function checkWallCollisions() {
                if (ballX - BALL_RADIUS <= 0) { ballX = BALL_RADIUS;
                    ballDX = Math.abs(ballDX);
                    prevBallX = ballX - ballDX; }
                if (ballX + BALL_RADIUS >= CANVAS_W) { ballX = CANVAS_W - BALL_RADIUS;
                    ballDX = -Math.abs(ballDX);
                    prevBallX = ballX - ballDX; }
                if (ballY - BALL_RADIUS <= 0) { ballY = BALL_RADIUS;
                    ballDY = Math.abs(ballDY);
                    prevBallY = ballY - ballDY; }
                if (ballY - BALL_RADIUS > CANVAS_H + 10) loseLife();
            }

            // ---- Mise à jour ----
            function update() {
                if (gameState === 'gameover') return;
                if (gameState === 'waiting') {
                    ballX = paddleX;
                    ballY = PADDLE_Y - PADDLE_H / 2 - BALL_RADIUS - 2;
                    prevBallX = ballX;
                    prevBallY = ballY;
                    updateParticles();
                    return;
                }
                prevBallX = ballX;
                prevBallY = ballY;
                ballX += ballDX;
                ballY += ballDY;
                checkWallCollisions();
                if (gameState === 'gameover' || gameState === 'waiting') return;
                checkPaddleCollision();
                const brickHit = checkBrickCollisions();
                if (brickHit && allBricksDestroyed()) nextWave();
                if (Math.abs(ballDY) < 0.3 && gameState === 'playing') {
                    ballDY += (Math.random() - 0.5) * 0.5;
                    const mag = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
                    ballDX = (ballDX / mag) * currentBallSpeed;
                    ballDY = (ballDY / mag) * currentBallSpeed;
                }
                updateParticles();
            }

            // ---- Dessin final ----
            function draw() {
                ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
                drawBackground(ctx);
                drawBricks(ctx);
                drawPaddle(ctx, paddleX, PADDLE_Y);
                drawBall(ctx, ballX, ballY);
                drawParticles(ctx);
                if (gameState === 'gameover') {
                    ctx.fillStyle = '#000000aa';
                    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
                    ctx.fillStyle = '#FF2222';
                    ctx.font = "28px 'Press Start 2P', monospace";
                    ctx.textAlign = 'center';
                    ctx.shadowColor = '#FF0000';
                    ctx.shadowBlur = 20;
                    ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 20);
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = "11px 'Press Start 2P', monospace";
                    ctx.fillText('SCORE: ' + String(score).padStart(6, '0'), CANVAS_W / 2, CANVAS_H / 2 + 25);
                    ctx.fillStyle = '#FFDD44';
                    ctx.font = "10px 'Press Start 2P', monospace";
                    const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
                    ctx.globalAlpha = pulse;
                    ctx.fillText('CLIQUEZ POUR RECOMMENCER', CANVAS_W / 2, CANVAS_H / 2 + 55);
                    ctx.globalAlpha = 1;
                    ctx.textAlign = 'start';
                }
                if (gameState === 'waiting') {
                    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
                    ctx.fillStyle = `rgba(255,255,255,${pulse})`;
                    ctx.font = "11px 'Press Start 2P', monospace";
                    ctx.textAlign = 'center';
                    ctx.fillText('ESPACE ou CLIC', CANVAS_W / 2, PADDLE_Y - PADDLE_H / 2 - 30);
                    ctx.textAlign = 'start';
                }
            }

            function gameLoop() { update();
                draw();
                requestAnimationFrame(gameLoop); }

            // ---- Contrôles clavier ----
            const keys = {};
            window.addEventListener('keydown', (e) => {
                keys[e.key] = true;
                if (e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    if (gameState === 'gameover') initGame();
                    else if (gameState === 'waiting') launchBall();
                }
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
            });
            window.addEventListener('keyup', (e) => { keys[e.key] = false; });

            function processKeyboardInput() {
                if (gameState === 'gameover') return;
                const paddleSpeed = 7;
                if (keys['ArrowLeft'] || keys['Left'] || keys['q'] || keys['Q']) {
                    paddleX -= paddleSpeed;
                    if (paddleX < PADDLE_W / 2) paddleX = PADDLE_W / 2;
                }
                if (keys['ArrowRight'] || keys['Right'] || keys['d'] || keys['D']) {
                    paddleX += paddleSpeed;
                    if (paddleX > CANVAS_W - PADDLE_W / 2) paddleX = CANVAS_W - PADDLE_W / 2;
                }
                requestAnimationFrame(() => processKeyboardInput());
            }
            processKeyboardInput();

            // ---- Souris & tactile ----
            canvas.addEventListener('mousemove', (e) => {
                if (gameState === 'gameover') return;
                const rect = canvas.getBoundingClientRect();
                const scaleX = CANVAS_W / rect.width;
                paddleX = Math.max(PADDLE_W / 2, Math.min(CANVAS_W - PADDLE_W / 2, (e.clientX - rect.left) * scaleX));
            });
            canvas.addEventListener('click', () => {
                if (gameState === 'gameover') initGame();
                else if (gameState === 'waiting') launchBall();
            });
            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (gameState === 'gameover') return;
                const rect = canvas.getBoundingClientRect();
                const scaleX = CANVAS_W / rect.width;
                paddleX = Math.max(PADDLE_W / 2, Math.min(CANVAS_W - PADDLE_W / 2, (e.touches[0].clientX - rect.left) *
                scaleX));
            }, { passive: false });
            canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (gameState === 'gameover') initGame();
                else if (gameState === 'waiting') launchBall();
                const rect = canvas.getBoundingClientRect();
                const scaleX = CANVAS_W / rect.width;
                paddleX = Math.max(PADDLE_W / 2, Math.min(CANVAS_W - PADDLE_W / 2, (e.touches[0].clientX - rect.left) *
                scaleX));
            }, { passive: false });

            // ---- High score & démarrage ----
            function loadHighScore() {
                try {
                    const saved = localStorage.getItem('arkanoid_highscore');
                    if (saved) { const p = parseInt(saved, 10); if (!isNaN(p) && p > 0) highScore = p; }
                } catch (e) {}
            }

            function startGame() {
                loadHighScore();
                initGame();
                updateHUD();
                drawLivesIcons();
                gameLoop();
            }

            // Démarrage
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', startGame);
            } else {
                startGame();
            }
        })();