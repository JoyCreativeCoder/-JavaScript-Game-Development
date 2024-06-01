window.addEventListener('load', () => {
    const canvas = document.getElementById('canvas1');
    const context = canvas.getContext('2d');
    canvas.width = 1920;
    canvas.height = 1080;

    class InputHandler {
        constructor(game) {
            this.game = game;
            window.addEventListener('keydown', (event) => {
                if ((event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') && this.game.keys.indexOf(event.key) === -1) {
                    this.game.keys.push(event.key);
                } else if (event.key === ' ') {
                    this.game.player.shoot();
                }
            });

            window.addEventListener('keyup', (event) => {
                if (this.game.keys.indexOf(event.key) > -1) {
                    this.game.keys.splice(this.game.keys.indexOf(event.key), 1);
                }
            });
        }
    }

    class ProjectileBubble {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.speed = 5;
            this.markedForDeletion = false;
            this.image = document.getElementById('poisionBubble');
            this.width = 60; 
            this.height = 60;
        }

        update() {
            this.x += this.speed;
            if (this.x > this.game.width) {
                this.markedForDeletion = true;
            }
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    const PlayerStates = {
        IDLE: 'idle',
        SWIMMING: 'swimming',
        ATTACK: 'attack'
    };

    class Player {
        constructor(game) {
            this.game = game;
            this.width = 815;
            this.height = 1001;
            this.x = 350; 
            this.y = 800;
            this.speedY = 0;
            this.speedX = 0;
            this.maxSpeed = 10;
            this.projectiles = [];
            this.image = document.getElementById('player');
    
            this.sprites = {
                [PlayerStates.IDLE]: document.getElementById('idleplayer'),
                [PlayerStates.SWIMMING]: document.getElementById('playerSwimming'),
                [PlayerStates.ATTACK]: document.getElementById('playerAttack')
            };
            // Initial state
            this.state = PlayerStates.IDLE;
            this.image = this.sprites[this.state];

            this.frameX = 0;  // Current frame in the sprite sheet (X coordinate)
            this.frameY = 0;  // Current frame in the sprite sheet (Y coordinate)
            this.maxFrame = 5;  // Number of frames in the sprite sheet (assuming a single row)
            this.fps = 10;
            this.frameInterval = 1000 / this.fps;
            this.frameTimer = 0;
            this.attackCooldown = 0; // Cooldown to transition from attack to other states
        }

        setState(state) {
            if (this.state !== state) {
                this.state = state;
                this.image = this.sprites[this.state];
                this.frameX = 0;
                this.frameTimer = 0;
                switch (state) {
                    case PlayerStates.IDLE:
                        this.maxFrame = 15;
                        break;
                    case PlayerStates.SWIMMING:
                        this.maxFrame = 5;
                        break;
                    case PlayerStates.ATTACK:
                        this.maxFrame = 6;
                        this.attackCooldown = 500; 
                        break;
                }
            }
        }

        update(deltaTime) {
            // Movement logic
            if (this.game.keys.includes('ArrowUp')) {
                this.speedY = -this.maxSpeed;
            } else if (this.game.keys.includes('ArrowDown')) {
                this.speedY = this.maxSpeed;
            } else {
                this.speedY = 0;
            }

            if (this.game.keys.includes('ArrowLeft')) {
                this.speedX = -this.maxSpeed;
            } else if (this.game.keys.includes('ArrowRight')) {
                this.speedX = this.maxSpeed;
            } else {
                this.speedX = 0;
            }

            this.y += this.speedY;
            this.x += this.speedX;

            if (this.x < 0) this.x = 0;
            if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
            if (this.y < 0) this.y = 0;
            if (this.y + this.height > this.game.height) this.y = this.game.height - this.height;

            this.projectiles.forEach(projectile => projectile.update());
            this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

            // updating the frame
            if (this.frameTimer > this.frameInterval) {
                if (this.frameX < this.maxFrame - 1) {
                    this.frameX++;
                } else {
                    this.frameX = 0;
                }
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }

            if (this.attackCooldown > 0) {
                this.attackCooldown -= deltaTime;
                if (this.attackCooldown <= 0) {
                    this.setState(PlayerStates.IDLE);
                }
            } else {
                if (this.game.keys.includes('ArrowLeft') || this.game.keys.includes('ArrowRight')) {
                    this.setState(PlayerStates.SWIMMING);
                } else {
                    this.setState(PlayerStates.IDLE);
                }
            }
            // this.game.keys.includes('ArrowUp') || this.game.keys.includes('ArrowDown') ||
        }

        draw(context) {
            context.drawImage(
                this.image,
                this.frameX * this.width,
                this.frameY * this.height,
                this.width,
                this.height,
                this.x,
                this.y,
                this.width,
                this.height
            );

            this.projectiles.forEach(projectile => projectile.draw(context));
        }

        shoot() {
            if (this.game.ammo > 0) {
                const offsetX = this.width * 0.75; 
                const offsetY = this.height * 0.5; 
                this.projectiles.push(new ProjectileBubble(this.game, this.x + offsetX, this.y + offsetY));
                this.game.ammo--;
                this.setState(PlayerStates.ATTACK);
            }
        }
    }

    class Enemy {
        constructor(game) {
            this.game = game;
            this.x = this.game.width;
            this.speedX = Math.random() * -1.5 - 0.5;
            this.markedForDeletion = false;
            this.width = 500;
            this.height = 500;
            this.y = Math.random() * (this.game.height - this.height);
        }

        update() {
            this.x += this.speedX;
            if (this.x + this.width < 0) {
                this.markedForDeletion = true;
            }
        }

        draw(context) {
            context.fillStyle = 'red';
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    class Jellyfish extends Enemy {
        constructor(game) {
            super(game);
            this.width = 102; // Width of a single frame
            this.height = 140; // Height of a single frame
            this.image = document.getElementById('jellyFish');
            this.frameX = 0;
            this.maxFrame = 3; // Total number of frames - 1 (4 frames total)
            this.frameTimer = 0;
            this.frameInterval = 1000 / 10; // Adjust the speed of the animation (10 FPS)
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
        }

        update(deltaTime) {
            super.update(deltaTime);
            // Handle frame animation
            if (this.frameTimer > this.frameInterval) {
                if (this.frameX < this.maxFrame) {
                    this.frameX++;
                } else {
                    this.frameX = 0;
                }
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
        }

        draw(context) {
            context.drawImage(
                this.image,
                this.frameX * this.width,
                0, 
                this.width,
                this.height, 
                this.x, 
                this.y, 
                this.width, 
                this.height 
            );
        }
    }

    class Layer {
        constructor(game, image, speedModifier) {
            this.game = game;
            this.image = image;
            this.speedModifier = speedModifier;
            this.width = 1920;
            this.height = 1080;
            this.x = 0;
            this.y = 0;
        }

        update() {
            this.x -= this.game.speed * this.speedModifier;
            if (this.x <= -this.width) {
                this.x = 0;
            }
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y);
            context.drawImage(this.image, this.x + this.width, this.y);
            if (this.x < 0) {
                context.drawImage(this.image, this.x + this.width * 2, this.y);
            }
        }
    }

    class Background {}

    class UI {}

    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.background = new Background(this);
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.enemyTimer = 0;
            this.enemyInterval = 1000;
            this.keys = [];
            this.enemies = [];
            this.ammo = 100;
            this.gameOver = false;
            this.speed = 2;
        }

        update(deltaTime) {
            this.player.update(deltaTime);
            this.enemies.forEach(enemy => {
                enemy.update(deltaTime);
                this.player.projectiles.forEach(projectile => {
                    if (this.checkCollision(projectile, enemy)) {
                        projectile.markedForDeletion = true;
                        enemy.markedForDeletion = true;
                    }
                });
            });
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

            if (this.enemyTimer > this.enemyInterval && !this.gameOver) {
                this.addEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }
        }

        draw(context) {
            this.player.draw(context);
            this.enemies.forEach(enemy => enemy.draw(context));
        }

        addEnemy() {
            this.enemies.push(new Jellyfish(this));
        }

        checkCollision(circle, rect) {
            const distX = Math.abs(circle.x - rect.x - rect.width / 2);
            const distY = Math.abs(circle.y - rect.y - rect.height / 2);

            if (distX > (rect.width / 2 + circle.radius) || distY > (rect.height / 2 + circle.radius)) {
                return false;
            }

            if (distX <= (rect.width / 2) || distY <= (rect.height / 2)) {
                return true;
            }

            const dx = distX - rect.width / 2;
            const dy = distY - rect.height / 2;
            return (dx * dx + dy * dy <= (circle.radius * circle.radius));
        }
    }

    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;

    function animate(timestamp) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        context.clearRect(0, 0, canvas.width, canvas.height);
        game.update(deltaTime);
        game.draw(context);
        requestAnimationFrame(animate);
    }

    animate(0);
});
