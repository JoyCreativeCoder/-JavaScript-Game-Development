window.addEventListener("load", () => {
  const canvas = document.getElementById("canvas1");
  const context = canvas.getContext("2d");
  canvas.width = 1920;
  canvas.height = 1080;

  const openingScreen = document.getElementById("openingScreen");
  const tutorialScreen = document.getElementById("tutorial-container");
  const questContainer = document.getElementById("quest-dialog-container")
  const diedScreen = document.getElementById("died-screen");
  const winScreen = document.getElementById("win-screen");
  const playButton = document.getElementById("playButton");
  const okButton = document.getElementById("okButton");
  const questokButton = document.getElementById("questOkButton");
  const tryAgain = document.getElementById("try-again");
  const replay = document.getElementById('re-play')
  const healthBar = document.getElementById('health-bar');

  const clickSound = document.getElementById("clickSound");
  const backgroundSound = document.getElementById("backgroundSound");
  const swimSound = document.getElementById("swimSound");
  const bubbleSound = document.getElementById("bubbleSound");
  const deadSound = document.getElementById("deadSound");
  const electricShock = document.getElementById("electricShock");
  const winSound = document.getElementById("winSound");

  const soundButton = document.getElementById("sound-button");
  const musicButton = document.getElementById("music-button");
  const controlButton = document.getElementById("control-button");

  let isPaused = true;

  soundButton.addEventListener("click", () => {
    clickSound.play();
  });

  musicButton.addEventListener("click", (e) => {
    backgroundSound.play();
  });

  controlButton.addEventListener("click", () => {
    clickSound.play();
    togglePause();
  });

  playButton.addEventListener("click", () => {
    clickSound.play();
    openingScreen.style.display = "none";
    tutorialScreen.style.display = "block";
    canvas.style.display = "block";
    animate(0);
  });

  okButton.addEventListener("click", () => {
    clickSound.play();
    tutorialScreen.style.display = "none";
    questContainer.style.display = "block";
    questContainer.style.display = "flex";

});

questokButton.addEventListener("click", () => {
  clickSound.play();
  questContainer.style.display = "none";
  togglePause();
});

// restart logic
tryAgain.addEventListener("click", () => {
  clickSound.play();
  diedScreen.style.display = "none";
  resetGame();
});

replay.addEventListener("click", () => {
  clickSound.play();
  winScreen.style.display = "none";
  resetGame();
});

function resetGame() {
    game.reset();
    isPaused = false;
}

  class InputHandler {
    constructor(game) {
      this.game = game;
      window.addEventListener("keydown", (event) => {
          if (
              ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) &&
              this.game.keys.indexOf(event.key) === -1
          ) {
              swimSound.play();
              this.game.keys.push(event.key);
          } else if (event.key === " ") {
              this.game.player.shoot();
              bubbleSound.play();
          } 
      });

      window.addEventListener("keyup", (event) => {
          if (this.game.keys.indexOf(event.key) > -1) {
              this.game.keys.splice(this.game.keys.indexOf(event.key), 1);
          }
      });
  }
  }

  class ProjectileBubble {
    constructor(game, x, y, direction) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.speed = 30;
      this.direction = direction;
      this.markedForDeletion = false;
      this.image = document.getElementById("poisionBubble");
      this.width = 40;
      this.height = 40;
    }

    update() {
      this.x += this.speed * this.direction;
      if (this.x > this.game.width || this.x < 0) {
        this.markedForDeletion = true;
      }
    }

    draw(context) {
      context.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  const PlayerStates = {
    IDLE: "idle",
    SWIMMING: "swimming",
    ATTACK: "attack",
    DEAD: "dead",
  };

  class Player {
    constructor(game) {
      this.game = game;
      this.startX = 300;
      this.x = this.startX;
      this.y = 800;
      this.speedY = 0;
      this.speedX = 0;
      this.maxSpeed = 10;
      this.gravity = 4.5;
      this.projectiles = [];
      this.flipped = false;
      this.movingLeft = false;
      this.collisionCount = 0;
      this.collisionLimit = 4;
      this.lastCollisionTime = 0;
      this.collisionCooldown = 1000; 

      this.maxHealth = 100;
      this.currentHealth = this.maxHealth;
      this.healthReductionPercentage = 20;

      this.sprites = {
        [PlayerStates.IDLE]: {
          image: document.getElementById("idleplayer"),
          width: 150,
          height: 87,
        },
        [PlayerStates.SWIMMING]: {
          image: document.getElementById("playerSwimming"),
          width: 150,
          height: 87,
        },
        [PlayerStates.ATTACK]: {
          image: document.getElementById("playerAttack"),
          width: 150,
          height: 87,
        },
        [PlayerStates.SHOCK]: {
          image: document.getElementById("playerShock"),
          width: 87,
          height: 150,
        },
        [PlayerStates.DEAD]: {
          image: document.getElementById("playerDead"),
          width: 150,
          height: 87,
        },
      };
  
      // Initial state
      this.state = PlayerStates.IDLE;
      this.image = this.sprites[this.state].image;
      this.width = this.sprites[this.state].width;
      this.height = this.sprites[this.state].height;
  
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 17; // Based on IDLE state frames
      this.fps = 10;
      this.frameInterval = 1000 / this.fps;
      this.frameTimer = 0;
      this.attackCooldown = 0;
    }
  
    setState(state) {
      if (this.state !== state) {
        this.state = state;
        this.image = this.sprites[this.state].image;
        this.width = this.sprites[this.state].width;
        this.height = this.sprites[this.state].height;
        this.frameX = 0;
        this.frameTimer = 0;
        switch (state) {
          case PlayerStates.IDLE:
            this.maxFrame = 18;
            break;
          case PlayerStates.SWIMMING:
            this.maxFrame = 5;
            break;
          case PlayerStates.ATTACK:
            this.maxFrame = 6;
            this.attackCooldown = 500;
            break;
          case PlayerStates.SHOCK:
            this.maxFrame = 1;
            break;
          case PlayerStates.DEAD:
            this.maxFrame = 5;
            break;
        }
      }
    }
  
    handleCollision() {
      const currentTime = Date.now();
      if (currentTime - this.lastCollisionTime < this.collisionCooldown) {
          return;
      }
      this.lastCollisionTime = currentTime;

      this.collisionCount++;
      //player life 
      if (this.collisionCount >= this.collisionLimit) {
          healthBar.style.background = 'red';
          healthBar.style.width = '2%';
          this.setState(PlayerStates.DEAD);
          deadSound.play();
          togglePause();
          diedScreen.style.display = "block";
          
      } else {
          this.currentHealth -= this.maxHealth * (this.healthReductionPercentage / 100);
          if (this.currentHealth < 0) this.currentHealth = 0;

          const healthPercentage = (this.currentHealth / this.maxHealth) * 100;
          healthBar.style.width = healthPercentage + '%';
          if (healthPercentage < 25) {
              healthBar.style.background = 'red';
          } else if (healthPercentage < 50) {
              healthBar.style.background = 'yellow';
          } else {
              healthBar.style.background = 'linear-gradient(#b5ff2b, #82c900)';
          }

          this.setState(PlayerStates.SHOCK);
          electricShock.play();
      }
  }
  
    flip() {
      this.flipped = !this.flipped;
    }
  
    update(deltaTime) {
      if (this.game.keys.includes("ArrowUp")) {
        this.speedY = -this.maxSpeed;
      } else if (this.game.keys.includes("ArrowDown")) {
        this.speedY = this.maxSpeed;
      } else {
        this.speedY = 0;
      }
  
      this.movingLeft = false;
  
      if (this.game.keys.includes("ArrowLeft")) {
        this.speedX = -this.maxSpeed;
        if (!this.flipped) this.flip();
        this.movingLeft = true;
      } else if (this.game.keys.includes("ArrowRight")) {
        this.speedX = this.maxSpeed;
        if (this.flipped) this.flip();
      } else {
        this.speedX = 0;
      }
  
      this.speedY += this.gravity;
      this.y += this.speedY;
  
      this.x += this.speedX;
  
      const buffer = 0;
  
      if (this.x < -buffer) this.x = -buffer;
      if (this.x + this.width > this.game.width + buffer)
        this.x = this.game.width + buffer - this.width;
      if (this.y < -2 * buffer) this.y = -2 * buffer;
      if (this.y + this.height > this.game.height + 2 * buffer)
        this.y = this.game.height + 2 * buffer - this.height;
  
      this.projectiles.forEach((projectile) => projectile.update());
      this.projectiles = this.projectiles.filter(
        (projectile) => !projectile.markedForDeletion
      );
  
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
        if (
          this.game.keys.includes("ArrowLeft") ||
          this.game.keys.includes("ArrowRight")
        ) {
          this.setState(PlayerStates.SWIMMING);
        } else {
          this.setState(PlayerStates.IDLE);
        }
      }
  
      if (this.state === PlayerStates.SHOCK) {
        if (this.frameTimer > this.frameInterval * 10) {
          this.setState(PlayerStates.IDLE);
        }
      }
    }
  
    draw(context) {
      context.save();
      if (this.flipped) {
        context.scale(-1, 1);
        context.drawImage(
          this.image,
          this.frameX * this.width,
          this.frameY * this.height,
          this.width,
          this.height,
          -this.x - this.width,
          this.y,
          this.width,
          this.height
        );
      } else {
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
      }
      context.restore();
  
      this.projectiles.forEach((projectile) => projectile.draw(context));
    }
  
    shoot() {
      if (this.game.ammo > 0) {
        const offsetX = this.width * 0.75;
        const offsetY = this.height * 0.5;
        const projectileX = this.flipped ? this.x - offsetX : this.x + offsetX;
        const direction = this.flipped ? -1 : 1;
        this.projectiles.push(
          new ProjectileBubble(
            this.game,
            projectileX,
            this.y + offsetY,
            direction
          )
        );
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
      context.fillStyle = "red";
      context.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  class Jellyfish extends Enemy {
    constructor(game) {
      super(game);
      this.width = 102;
      this.height = 140;
      this.image = document.getElementById("jellyFish");
      this.frameX = 0;
      this.maxFrame = 3;
      this.frameTimer = 0;
      this.frameInterval = 1000 / 10;
  
      const randomSide = Math.random() < 0.5 ? "left" : "right";
      if (randomSide === "left") {
        this.x = -this.width;
        this.speedX = Math.random() * 0.5 + 1; 
      } else {
        this.x = this.game.width;
        this.speedX = Math.random() * -0.5 - 1; 
      }
  
      this.y = Math.random() * (this.game.height - this.height);
      this.speedY = Math.random() * 2 - 1;
    }
  
    update(deltaTime) {
      super.update(deltaTime);
      this.y += this.speedY;
      if (this.y + this.height < 0 || this.y > this.game.height) {
        this.speedY *= -1;
      }
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
      context.fillStyle = "red";
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
  

  const coinSound = document.getElementById("coinSound");

  class Coin {
    constructor(game) {
      this.game = game;
      this.x = Math.random() * this.game.width;
      this.y = this.game.height;
      this.width = 60;
      this.height = 60;
      this.image = document.getElementById("coin");
      this.speed = Math.random() * 1 + 1; 
      this.markedForDeletion = false;
    }

    update() {
      this.y -= this.speed;
      if (this.y + this.height < 0) {
        this.markedForDeletion = true;
      }
      // Check for collision with player
      if (
        this.x < this.game.player.x + this.game.player.width &&
        this.x + this.width > this.game.player.x &&
        this.y < this.game.player.y + this.game.player.height &&
        this.y + this.height > this.game.player.y &&
        this.game.coinCount < 30
      ) {
        this.markedForDeletion = true;
        this.game.score++;
        this.game.coinCount++;
        this.updateCoinLabel();
        coinSound.play();
        if (this.game.coinCount === 30) {
          winScreen.style.display = 'block';
          togglePause();
          winSound.play();
        }
      }
    }

    updateCoinLabel() {
      const coinAmountLabel = document.getElementById("coin-amount-label");
      coinAmountLabel.textContent = `${this.game.coinCount}/30`;
    }

    playMaxCoinSound() {
      const maxCoinSound = document.getElementById("maxCoinSound");
      maxCoinSound.play();
    }

    draw(context) {
      context.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  class UI {
  }

  class Background {
    constructor(game) {
      this.game = game;
      this.image1 = document.getElementById("background1");
      this.image2 = document.getElementById("background2");
      this.width = 1920;
      this.height = 1080;
      this.x1 = 0;
      this.x2 = this.width;
      this.speed = 5;
    }

    update() {
      this.x1 -= this.speed;
      this.x2 -= this.speed;

      // Reset positions to create a seamless scroll
      if (this.x1 <= -this.width) {
        this.x1 = this.width;
      }
      if (this.x2 <= -this.width) {
        this.x2 = this.width;
      }
    }

    draw(context) {
      context.drawImage(this.image1, this.x1, 0, this.width, this.height);
      context.drawImage(this.image2, this.x2, 0, this.width, this.height);
    }
  }

  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.player = new Player(this);
      this.input = new InputHandler(this);
      this.ui = new UI(this);
      this.background = new Background(this);
      this.keys = [];
      this.enemies = [];
      this.enemyTimer = 0;
      this.enemyInterval = 5000;
      this.ammo = 20;
      this.maxAmmo = 50;
      this.ammoTimer = 0;
      this.ammoInterval = 300;
      this.score = 0;
      this.winningScore = 10;
      this.gameOver = false;
      this.coins = [];
      this.coinInterval = 1000;
      this.coinTimer = 0;
      this.coinCount = 0; 
      this.totalCoinsAdded = 0; 
      this.maxEnemiesAtOnce = 2;
    }

    reset() {
      this.player = new Player(this);
      this.keys = [];
      this.enemies = [];
      this.enemyTimer = 0;
      this.ammo = 20;
      this.ammoTimer = 0;
      this.score = 0;
      this.gameOver = false;
      this.coins = [];
      this.coinTimer = 0;
      this.coinCount = 0;
      this.totalCoinsAdded = 0;
      healthBar.style.width = '100%';
      healthBar.style.background = 'linear-gradient(#b5ff2b, #82c900)';
      const coinAmountLabel = document.getElementById("coin-amount-label");
      coinAmountLabel.textContent = "0/30"; 
      animate(0); 
    }
  
    update(deltaTime) {
      this.background.update();
      this.player.update(deltaTime);
      if (this.ammoTimer > this.ammoInterval) {
        if (this.ammo < this.maxAmmo) this.ammo++;
        this.ammoTimer = 0;
      } else {
        this.ammoTimer += deltaTime;
      }
  
      this.coins.forEach((coin) => coin.update(deltaTime));
      this.coins = this.coins.filter((coin) => !coin.markedForDeletion);
  
      if (this.coinTimer > this.coinInterval  && this.coinCount < 30) { 
        this.addCoin();
        this.coinTimer = 0;
      } else {
        this.coinTimer += deltaTime;
      }
  
      this.enemies.forEach((enemy) => {
        enemy.update(deltaTime);
  
        // Check for collision with player
        if (this.checkCollision(this.player, enemy)) {
          this.player.handleCollision();
          // this.player.setState(PlayerStates.SHOCK);
          // electricShock.play();
        } 
        if (
          this.player.projectiles.some(
            (projectile) =>
              projectile.x + projectile.width > enemy.x &&  
              projectile.x < enemy.x + enemy.width &&
              projectile.y + projectile.height > enemy.y &&
              projectile.y < enemy.y + enemy.height
          )
        ) {
          enemy.markedForDeletion = true;
          this.score++;
        }
      });
      this.enemies = this.enemies.filter((enemy) => !enemy.markedForDeletion);
  
      if (this.enemyTimer > this.enemyInterval) {
        this.addEnemy();
        this.enemyTimer = 0;
      } else {
        this.enemyTimer += deltaTime;
      }
    }
  
    checkCollision(rect1, rect2) {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    }
  
    draw(context) {
      this.background.draw(context);
      this.player.draw(context);
      this.enemies.forEach((enemy) => enemy.draw(context));
      this.coins.forEach((coin) => coin.draw(context));
    }
  
    addEnemy() {
      for (let i = 0; i < this.maxEnemiesAtOnce; i++) {
        this.enemies.push(new Jellyfish(this));
      }
    }
  
    addCoin() {
      this.coins.push(new Coin(this));
      this.totalCoinsAdded++; 
    }
  }
  

  const game = new Game(canvas.width, canvas.height);
    function animate(timeStamp) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const deltaTime = timeStamp - lastTime;
      lastTime = timeStamp;
      game.update(deltaTime);
      game.draw(context);
      if (!isPaused) {
          requestAnimationFrame(animate);
      }
  }

  let lastTime = 0;

  function togglePause() {
      isPaused = !isPaused;
      if (!isPaused) {
          requestAnimationFrame(animate);
      }
  }

  function resetGame() {
    game.reset();
    isPaused = false;
    requestAnimationFrame(animate);
  }
});



