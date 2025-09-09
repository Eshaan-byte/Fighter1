const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1200;
canvas.height = 600;

const GROUND_Y = canvas.height - 150;  // Move ground up to show full characters
const GRAVITY = 0.8;

class SpriteAnimation {
    constructor(imagePath, frameCount, frameWidth, frameHeight, animSpeed = 0.15) {
        this.image = new Image();
        this.image.src = imagePath;
        this.frameCount = frameCount;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.currentFrame = 0;
        this.animSpeed = animSpeed;
        this.frameTimer = 0;
        this.loaded = false;
        
        this.image.onload = () => {
            this.loaded = true;
            if (!this.frameWidth && this.frameCount) {
                this.frameWidth = Math.floor(this.image.width / this.frameCount);
            }
            if (!this.frameHeight) {
                this.frameHeight = this.image.height;
            }
        };
    }
    
    update() {
        this.frameTimer += this.animSpeed;
        if (this.frameTimer >= 1) {
            this.frameTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
        }
    }
    
    draw(ctx, x, y, scale = 3, flip = false) {
        if (!this.loaded) return;
        
        ctx.save();
        if (flip) {
            ctx.scale(-1, 1);
            x = -x - this.frameWidth * scale;
        }
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            this.image,
            this.currentFrame * this.frameWidth,
            0,
            this.frameWidth,
            this.frameHeight,
            x,
            y,
            this.frameWidth * scale,
            this.frameHeight * scale
        );
        
        ctx.restore();
    }
    
    reset() {
        this.currentFrame = 0;
        this.frameTimer = 0;
    }
    
    isFinished() {
        return this.currentFrame === this.frameCount - 1;
    }
}

class Fighter {
    constructor(x, y, playerNum, character) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 200;  // Increased height to match full sprite
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 6;
        this.jumpPower = 18;
        this.isGrounded = false;
        this.facingRight = playerNum === 1;
        this.health = 100;
        this.maxHealth = 100;
        this.superMeter = 0;
        this.maxSuper = 100;
        this.playerNum = playerNum;
        this.character = character;
        
        this.state = 'idle';
        this.attacking = false;
        this.blocking = false;
        this.currentAttack = 0;
        this.attackCooldown = 0;
        this.hitCooldown = 0;
        this.blockStun = 0;
        this.isHurt = false;
        this.isDead = false;
        this.attackBox = null;
        
        this.comboCount = 0;
        this.comboTimer = 0;
        this.lastHitAttack = 0;
        
        this.animations = {};
        this.currentAnimation = null;
        
        if (character === 'bancho') {
            this.loadBanchoAnimations();
        } else if (character === 'battingGirl') {
            this.loadBattingGirlAnimations();
        } else if (character === 'bruteArms') {
            this.loadBruteArmsAnimations();
        }
    }
    
    loadBanchoAnimations() {
        this.animations = {
            idle: new SpriteAnimation('Bancho_Download Free/Sprite Sheet/Bancho_Idle.png', 7, 100, 100, 0.1),
            walk: new SpriteAnimation('Bancho_Download Free/Sprite Sheet/Bancho_walk.png', 6, 100, 100, 0.15),
            walkBack: new SpriteAnimation('Bancho_Download Free/Sprite Sheet/Bancho_walk.png', 6, 100, 100, 0.1),
            jump: new SpriteAnimation('Bancho_Download Free/Sprite Sheet/Bancho_Jump.png', 10, 100, 100, 0.15),
            attack1: new SpriteAnimation('Bancho_Download Free/Sprite Sheet/Bancho_attack1.png', 9, 100, 100, 0.25),
            attack2: new SpriteAnimation('Bancho_Download Free/Sprite Sheet/Bancho_attack2.png', 11, 100, 100, 0.22),
            attack3: new SpriteAnimation('Bancho_Download Free/Sprite Sheet/Bancho_attack3.png', 10, 100, 100, 0.2),
            hurt: new SpriteAnimation('Bancho_Download Free/Sprite Sheet/Bancho_Hurt.png', 4, 100, 100, 0.15),
            block: new SpriteAnimation('Bancho_Download Free/Sprite Sheet/Bancho_Idle.png', 1, 100, 100, 0.1)
        };
        this.currentAnimation = this.animations.idle;
    }
    
    loadBattingGirlAnimations() {
        this.animations = {
            idle: new SpriteAnimation('BattingGirl_Download Free/Sprite Sheet/BattingGirl_Idle-Sheet.png', 15, 100, 100, 0.08),
            walk: new SpriteAnimation('BattingGirl_Download Free/Sprite Sheet/BattingGirl_Walk-Sheet.png', 6, 100, 100, 0.15),
            walkBack: new SpriteAnimation('BattingGirl_Download Free/Sprite Sheet/BattingGirl_Walk-Sheet.png', 6, 100, 100, 0.1),
            jump: new SpriteAnimation('BattingGirl_Download Free/Sprite Sheet/BattingGirl_Jump-Sheet.png', 8, 100, 100, 0.15),
            attack1: new SpriteAnimation('BattingGirl_Download Free/Sprite Sheet/BattingGirl_attack01-Sheet.png', 5, 110, 100, 0.25),
            attack2: new SpriteAnimation('BattingGirl_Download Free/Sprite Sheet/BattingGirl_attack02-Sheet.png', 8, 110, 100, 0.22),
            attack3: new SpriteAnimation('BattingGirl_Download Free/Sprite Sheet/BattingGirl_attack03-Sheet.png', 11, 110, 100, 0.2),
            hurt: new SpriteAnimation('BattingGirl_Download Free/Sprite Sheet/BattingGirl_Hurt-Sheet.png', 8, 100, 100, 0.12),
            block: new SpriteAnimation('BattingGirl_Download Free/Sprite Sheet/BattingGirl_Idle-Sheet.png', 1, 100, 100, 0.1)
        };
        this.currentAnimation = this.animations.idle;
    }
    
    loadBruteArmsAnimations() {
        this.animations = {
            idle: new SpriteAnimation('BruteArms_FreeDownload/Sprite Sheet/BruteArm_Idle.png', 8, 100, 101, 0.1),
            walk: new SpriteAnimation('BruteArms_FreeDownload/Sprite Sheet/BruteArm_Walk.png', 6, 100, 100, 0.15),
            walkBack: new SpriteAnimation('BruteArms_FreeDownload/Sprite Sheet/BruteArm_Walk.png', 6, 100, 100, 0.1),
            jump: new SpriteAnimation('BruteArms_FreeDownload/Sprite Sheet/BruteArm_Jump.png', 10, 120, 128, 0.15),
            attack1: new SpriteAnimation('BruteArms_FreeDownload/Sprite Sheet/BruteArm_attack01.png', 7, 160, 128, 0.25),
            attack2: new SpriteAnimation('BruteArms_FreeDownload/Sprite Sheet/BruteArm_attack02.png', 5, 160, 128, 0.22),
            attack3: new SpriteAnimation('BruteArms_FreeDownload/Sprite Sheet/BruteArm_attack04.png', 8, 160, 128, 0.2),
            hurt: new SpriteAnimation('BruteArms_FreeDownload/Sprite Sheet/BruteArm_Hurt.png', 8, 160, 128, 0.15),
            block: new SpriteAnimation('BruteArms_FreeDownload/Sprite Sheet/BruteArm_Idle.png', 1, 100, 101, 0.1)
        };
        this.currentAnimation = this.animations.idle;
    }
    
    update(opponent) {
        if (this.isDead) return;
        
        if (!this.isGrounded) {
            this.velocityY += GRAVITY;
        }
        
        if (!this.isHurt && !this.attacking && this.blockStun <= 0) {
            this.x += this.velocityX;
        }
        this.y += this.velocityY;
        
        if (this.y > GROUND_Y) {
            this.y = GROUND_Y;
            this.velocityY = 0;
            this.isGrounded = true;
        }
        
        this.x = Math.max(50, Math.min(canvas.width - 50 - this.width, this.x));
        
        const centerX = this.x + this.width / 2;
        const opponentCenterX = opponent.x + opponent.width / 2;
        this.facingRight = centerX < opponentCenterX;
        
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.hitCooldown > 0) this.hitCooldown--;
        if (this.blockStun > 0) this.blockStun--;
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0) {
                this.comboCount = 0;
                this.lastHitAttack = 0;
            }
        }
        
        if (this.isHurt && this.hitCooldown <= 0) {
            this.isHurt = false;
        }
        
        this.updateAnimation();
        
        if (this.attacking) {
            if (this.currentAnimation.currentFrame === Math.floor(this.currentAnimation.frameCount / 2)) {
                this.createAttackBox();
            }
            
            if (this.currentAnimation.isFinished()) {
                this.attacking = false;
                this.attackBox = null;
                this.currentAnimation.reset();
            }
        }
        
        if (this.attackBox && opponent.hitCooldown <= 0 && !opponent.isDead) {
            if (this.checkAttackCollision(opponent)) {
                this.hitOpponent(opponent);
                this.attackBox = null;
            }
        }
        
        if (this.currentAnimation) {
            this.currentAnimation.update();
        }
    }
    
    updateAnimation() {
        let newState = 'idle';
        
        if (this.isDead) {
            newState = 'hurt';
        } else if (this.isHurt) {
            newState = 'hurt';
        } else if (this.blocking && this.isGrounded) {
            newState = 'block';
        } else if (this.attacking) {
            newState = `attack${this.currentAttack}`;
        } else if (!this.isGrounded) {
            newState = 'jump';
        } else if (Math.abs(this.velocityX) > 0.5) {
            if ((this.velocityX > 0 && !this.facingRight) || (this.velocityX < 0 && this.facingRight)) {
                newState = 'walkBack';
            } else {
                newState = 'walk';
            }
        }
        
        if (newState !== this.state) {
            this.state = newState;
            if (this.animations[newState]) {
                this.currentAnimation = this.animations[newState];
                this.currentAnimation.reset();
            }
        }
    }
    
    move(direction) {
        if (this.isDead || this.isHurt || this.attacking || this.blockStun > 0) return;
        
        if (direction === 'left') {
            this.velocityX = -this.speed;
        } else if (direction === 'right') {
            this.velocityX = this.speed;
        }
    }
    
    stop() {
        if (!this.isHurt && !this.attacking) {
            this.velocityX *= 0.8;
            if (Math.abs(this.velocityX) < 0.1) {
                this.velocityX = 0;
            }
        }
    }
    
    jump() {
        if (this.isDead || this.isHurt || this.blockStun > 0) return;
        
        if (this.isGrounded) {
            this.velocityY = -this.jumpPower;
            this.isGrounded = false;
            this.blocking = false;
        }
    }
    
    attack(attackNum) {
        if (this.isDead || this.isHurt || this.attackCooldown > 0 || this.blocking || this.blockStun > 0) return;
        
        // Removed combo requirements - all attacks work independently
        
        this.attacking = true;
        this.currentAttack = attackNum;
        this.attackCooldown = attackNum === 1 ? 20 : attackNum === 2 ? 25 : 30;
        this.velocityX = 0;
    }
    
    block(isBlocking) {
        if (this.isDead || this.isHurt || this.attacking) return;
        this.blocking = isBlocking && this.isGrounded;
    }
    
    createAttackBox() {
        const reach = this.currentAttack === 1 ? 60 : this.currentAttack === 2 ? 70 : 80;
        const offset = this.facingRight ? this.width : -reach;
        
        this.attackBox = {
            x: this.x + offset,
            y: this.y + 80,  // Adjusted for new character height
            width: reach,
            height: 60
        };
    }
    
    checkAttackCollision(target) {
        if (!this.attackBox || target.isDead) return false;
        
        return this.attackBox.x < target.x + target.width &&
               this.attackBox.x + this.attackBox.width > target.x &&
               this.attackBox.y < target.y + target.height &&
               this.attackBox.y + this.attackBox.height > target.y;
    }
    
    hitOpponent(opponent) {
        const baseDamage = this.currentAttack === 1 ? 5 : this.currentAttack === 2 ? 8 : 12;
        let damage = baseDamage;
        
        if (opponent.blocking) {
            damage = Math.floor(damage * 0.2);
            opponent.blockStun = 15;
            opponent.velocityX = this.facingRight ? 2 : -2;
            this.superMeter = Math.min(this.maxSuper, this.superMeter + 5);
            createHitEffect(opponent.x + opponent.width/2, opponent.y + 50, 'BLOCKED');
        } else {
            opponent.takeDamage(damage);
            
            const knockback = this.facingRight ? 8 : -8;
            opponent.velocityX = knockback;
            if (this.currentAttack === 3) {
                opponent.velocityY = -8;
            }
            
            this.comboCount++;
            this.comboTimer = 60;
            this.lastHitAttack = this.currentAttack;
            this.superMeter = Math.min(this.maxSuper, this.superMeter + 10);
            
            createHitEffect(opponent.x + opponent.width/2, opponent.y + 50, damage);
            
            if (this.comboCount > 1) {
                showCombo(this.comboCount, this.playerNum);
            }
        }
        
        updateUI();
    }
    
    takeDamage(damage) {
        if (this.hitCooldown > 0 || this.isDead) return;
        
        this.health -= damage;
        this.isHurt = true;
        this.hitCooldown = 30;
        this.attacking = false;
        this.blocking = false;
        this.attackBox = null;
        this.comboCount = 0;
        this.lastHitAttack = 0;
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            endRound();
        }
    }
    
    draw(ctx) {
        if (this.currentAnimation) {
            const scale = 3;
            const offsetX = -60;
            // Different offset for BruteArms to keep him on screen
            const offsetY = this.character === 'bruteArms' ? -220 : -180;
            
            this.currentAnimation.draw(
                ctx, 
                this.x + offsetX, 
                this.y + offsetY, 
                scale, 
                !this.facingRight
            );
        }
        
        if (game.debug) {
            ctx.strokeStyle = this.playerNum === 1 ? 'blue' : 'red';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            if (this.attackBox) {
                ctx.strokeStyle = 'yellow';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
            }
        }
    }
    
    reset(x) {
        this.x = x;
        this.y = GROUND_Y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = this.maxHealth;
        this.superMeter = 0;
        this.isHurt = false;
        this.isDead = false;
        this.attacking = false;
        this.blocking = false;
        this.hitCooldown = 0;
        this.attackCooldown = 0;
        this.blockStun = 0;
        this.comboCount = 0;
        this.lastHitAttack = 0;
        this.state = 'idle';
        this.currentAnimation = this.animations.idle;
    }
}

const game = {
    player1: null,
    player2: null,
    round: 1,
    p1Wins: 0,
    p2Wins: 0,
    roundActive: false,
    gameOver: false,
    debug: false,
    keys: {},
    p1Character: null,
    p2Character: null
};

function initCharacterSelection() {
    const p1Cards = document.querySelectorAll('#p1Select .character-card');
    const p2Cards = document.querySelectorAll('#p2Select .character-card');
    const startButton = document.getElementById('startButton');
    
    p1Cards.forEach(card => {
        card.addEventListener('click', () => {
            p1Cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            game.p1Character = card.dataset.character;
            checkReadyToStart();
        });
    });
    
    p2Cards.forEach(card => {
        card.addEventListener('click', () => {
            p2Cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            game.p2Character = card.dataset.character;
            checkReadyToStart();
        });
    });
    
    startButton.addEventListener('click', () => {
        if (game.p1Character && game.p2Character) {
            startGame();
        }
    });
}

function checkReadyToStart() {
    const startButton = document.getElementById('startButton');
    if (game.p1Character && game.p2Character) {
        startButton.classList.add('ready');
    }
}

function startGame() {
    document.getElementById('characterSelect').classList.add('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');
    
    // Update player names in UI based on selection
    const p1Name = game.p1Character === 'bancho' ? 'BANCHO' : 
                   game.p1Character === 'battingGirl' ? 'BATTING GIRL' : 'BRUTE ARMS';
    const p2Name = game.p2Character === 'bancho' ? 'BANCHO' : 
                   game.p2Character === 'battingGirl' ? 'BATTING GIRL' : 'BRUTE ARMS';
    
    document.querySelector('#ui .player-info:first-child .player-name').textContent = `P1: ${p1Name}`;
    document.querySelector('#ui .player-info:last-child .player-name').textContent = `P2: ${p2Name}`;
    
    init();
}

function init() {
    game.player1 = new Fighter(200, GROUND_Y, 1, game.p1Character || 'bancho');
    game.player2 = new Fighter(canvas.width - 280, GROUND_Y, 2, game.p2Character || 'battingGirl');
    
    startRound();
    gameLoop();
}

function startRound() {
    game.player1.reset(200);
    game.player2.reset(canvas.width - 280);
    
    updateUI();
    showAnnouncement(`ROUND ${game.round}`);
    
    setTimeout(() => {
        showAnnouncement('FIGHT!');
        game.roundActive = true;
        setTimeout(() => {
            hideAnnouncement();
        }, 500);
    }, 1500);
}

function endRound() {
    if (!game.roundActive) return;
    game.roundActive = false;
    
    const winner = game.player1.health > 0 ? 1 : 2;
    
    if (winner === 1) {
        game.p1Wins++;
        showAnnouncement('PLAYER 1 WINS!');
    } else {
        game.p2Wins++;
        showAnnouncement('PLAYER 2 WINS!');
    }
    
    updateWinDots();
    
    if (game.p1Wins >= 2 || game.p2Wins >= 2) {
        setTimeout(() => {
            const champion = game.p1Wins >= 2 ? 'PLAYER 1' : 'PLAYER 2';
            showAnnouncement(`${champion} IS THE CHAMPION!`);
            game.gameOver = true;
            
            setTimeout(() => {
                if (confirm('Play again?')) {
                    resetGame();
                }
            }, 2000);
        }, 2000);
    } else {
        game.round++;
        setTimeout(() => {
            startRound();
        }, 2000);
    }
}

function resetGame() {
    game.round = 1;
    game.p1Wins = 0;
    game.p2Wins = 0;
    game.gameOver = false;
    
    document.querySelectorAll('.win-dot').forEach(dot => {
        dot.classList.remove('won');
    });
    
    startRound();
}

function handleInput() {
    if (!game.roundActive || game.gameOver) return;
    
    // Player 1 controls
    if (game.keys['a']) {
        game.player1.move('left');
    } else if (game.keys['d']) {
        game.player1.move('right');
    } else {
        game.player1.stop();
    }
    
    if (game.keys['w']) {
        game.player1.jump();
    }
    
    game.player1.block(game.keys[' ']);
    
    if (game.keys['f']) {
        game.player1.attack(1);
    } else if (game.keys['g']) {
        game.player1.attack(2);
    } else if (game.keys['h']) {
        game.player1.attack(3);
    }
    
    // Player 2 controls
    if (game.keys['arrowleft']) {
        game.player2.move('left');
    } else if (game.keys['arrowright']) {
        game.player2.move('right');
    } else {
        game.player2.stop();
    }
    
    if (game.keys['arrowup']) {
        game.player2.jump();
    }
    
    game.player2.block(game.keys['arrowdown']);  // Changed to Down Arrow for blocking
    
    // New attack controls for Player 2
    if (game.keys['enter']) {
        game.player2.attack(1);
    } else if (game.keys['shift']) {
        game.player2.attack(2);
    } else if (game.keys['delete']) {
        game.player2.attack(3);
    }
}

function update() {
    handleInput();
    
    if (game.player1 && game.player2) {
        game.player1.update(game.player2);
        game.player2.update(game.player1);
    }
}

function draw() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e3c72');
    gradient.addColorStop(0.5, '#2a5298');
    gradient.addColorStop(1, '#3d5a80');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Main floor platform
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(0, GROUND_Y + 120, canvas.width, canvas.height - GROUND_Y - 120);
    
    // Floor surface
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(0, GROUND_Y + 120, canvas.width, 8);
    
    // Floor highlight line
    ctx.fillStyle = '#666';
    ctx.fillRect(0, GROUND_Y + 120, canvas.width, 2);
    
    // Add grid pattern on floor
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, GROUND_Y + 128);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    
    // Draw shadow under characters
    if (game.player1 && game.player1.isGrounded) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.ellipse(game.player1.x + 40, GROUND_Y + 122, 40, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (game.player2 && game.player2.isGrounded) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.ellipse(game.player2.x + 40, GROUND_Y + 122, 40, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (game.player1) game.player1.draw(ctx);
    if (game.player2) game.player2.draw(ctx);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    if (game.player1) {
        document.getElementById('p1Health').style.width = `${(game.player1.health / game.player1.maxHealth) * 100}%`;
        document.getElementById('p1Super').style.width = `${(game.player1.superMeter / game.player1.maxSuper) * 100}%`;
    }
    
    if (game.player2) {
        document.getElementById('p2Health').style.width = `${(game.player2.health / game.player2.maxHealth) * 100}%`;
        document.getElementById('p2Super').style.width = `${(game.player2.superMeter / game.player2.maxSuper) * 100}%`;
    }
    
    document.getElementById('roundNumber').textContent = game.round;
}

function updateWinDots() {
    if (game.p1Wins >= 1) document.getElementById('p1Win1').classList.add('won');
    if (game.p1Wins >= 2) document.getElementById('p1Win2').classList.add('won');
    if (game.p2Wins >= 1) document.getElementById('p2Win1').classList.add('won');
    if (game.p2Wins >= 2) document.getElementById('p2Win2').classList.add('won');
}

function showAnnouncement(text) {
    const ann = document.getElementById('announcement');
    ann.textContent = text;
    ann.style.display = 'block';
}

function hideAnnouncement() {
    document.getElementById('announcement').style.display = 'none';
}

function showCombo(count, player) {
    const combo = document.getElementById('combo');
    combo.textContent = `${count} HIT COMBO!`;
    combo.style.display = 'block';
    combo.style.left = player === 1 ? '200px' : 'auto';
    combo.style.right = player === 2 ? '200px' : 'auto';
    combo.style.top = '200px';
    
    setTimeout(() => {
        combo.style.display = 'none';
    }, 1500);
}

function createHitEffect(x, y, text) {
    const effect = document.createElement('div');
    effect.className = 'hit-effect';
    effect.textContent = text;
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    document.getElementById('gameContainer').appendChild(effect);
    
    setTimeout(() => {
        effect.remove();
    }, 1000);
}

window.addEventListener('keydown', (e) => {
    e.preventDefault();
    game.keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    e.preventDefault();
    game.keys[e.key.toLowerCase()] = false;
});

window.addEventListener('load', initCharacterSelection);