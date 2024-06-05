window.addEventListener("load", () => {
  const canvas = document.getElementById("canvas1");
  const context = canvas.getContext("2d");
  canvas.width = 1920;
  canvas.height = 1080;

  class InputHandler {
    constructor(game) {
      this.game = game;
      window.addEventListener("keydown", (event) => {
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) &&
          this.game.keys.indexOf(event.key) === -1
        ) {
          this.game.keys.push(event.key);
        } else if (event.key === " ") {
          this.game.player.shoot();
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
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.speed = 5;
      this.markedForDeletion = false;
      this.image = document.getElementById("poisionBubble");
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
    IDLE: "idle",
    SWIMMING: "swimming",
    ATTACK: "attack",
  };

  class Player {
    constructor(game) {
      this.game = game;
      this.width = 815;
      this.height = 1001;
      this.startX = 30; // Store the initial x position
      this.x = this.startX;
      this.y = 800;
      this.speedY = 0;
      this.speedX = 0;
      this.maxSpeed = 10;
      this.gravity = 4.5;
      this.projectiles = [];
      this.image = document.getElementById("player");
      this.flipped = false; // Track the flip state
      this.movingLeft = false; // Track if the player is moving left
    
      this.sprites = {
        [PlayerStates.IDLE]: document.getElementById("idleplayer"),
        [PlayerStates.SWIMMING]: document.getElementById("playerSwimming"),
        [PlayerStates.ATTACK]: document.getElementById("playerAttack"),
      };
      // Initial state
      this.state = PlayerStates.IDLE;
      this.image = this.sprites[this.state];
    
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 5;
      this.fps = 10;
      this.frameInterval = 1000 / this.fps;
      this.frameTimer = 0;
      this.attackCooldown = 0;
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
  
      // Prevent moving back beyond the starting position
      this.x += this.speedX;
      if (this.x < this.startX) {
        this.x = this.startX;
      }
  
      const buffer = 150;
  
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
          -this.x - this.width, // Adjust x for flip
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
        this.projectiles.push(
          new ProjectileBubble(this.game, this.x + offsetX, this.y + offsetY)
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
      this.width = 102; // Width of a single frame
      this.height = 140; // Height of a single frame
      this.image = document.getElementById("jellyFish");
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

  class Coin {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.width = 60;
      this.height = 60;
      this.image = document.getElementById("coin");
      this.markedForDeletion = false;
    }

    update() {
      if (
        this.x < this.game.player.x + this.game.player.width &&
        this.x + this.width > this.game.player.x &&
        this.y < this.game.player.y + this.game.player.height &&
        this.y + this.height > this.game.player.y
      ) {
        this.markedForDeletion = true;
        this.game.score++;
      }
    }

    draw(context) {
      context.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  class UI {
    constructor(game) {
      this.game = game;
      this.fontSize = 30;
      this.fontFamily = "Helvetica";
      this.color = "white";
    }

    draw(context) {
      context.save();
      context.fillStyle = this.color;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      context.shadowColor = "black";
      context.font = this.fontSize + "px " + this.fontFamily;
      context.fillText("Score: " + this.game.score, 20, 50);
      context.fillText("Ammo: " + this.game.ammo, 20, 90);
      context.restore();
    }
  }


  class Background {
    constructor(game) {
      this.game = game;
      this.image1 = document.getElementById("layer1");
      this.image2 = document.getElementById("layer2");
      this.width = 1920;
      this.height = 1080;
      this.x1 = 0;
      this.x2 = this.width;
      this.y = 0;
    }
  
    update() {
      const playerSpeedX = this.game.player.speedX;
  
      // Move the backgrounds based on the player's speed, but only if the player can move left
      if (this.game.player.movingLeft && this.game.player.x > this.game.player.startX) {
        this.x1 -= playerSpeedX;
        this.x2 -= playerSpeedX;
      } else if (!this.game.player.movingLeft) {
        this.x1 -= playerSpeedX;
        this.x2 -= playerSpeedX;
      }
  
      // Wrap backgrounds to the right
      if (this.x1 <= -this.width) {
        this.x1 = this.x2 + this.width - playerSpeedX;
      }
      if (this.x2 <= -this.width) {
        this.x2 = this.x1 + this.width - playerSpeedX;
      }
  
      // Wrap backgrounds to the left
      if (this.x1 >= this.width) {
        this.x1 = this.x2 - this.width + playerSpeedX;
      }
      if (this.x2 >= this.width) {
        this.x2 = this.x1 - this.width + playerSpeedX;
      }
    }
  
    draw(context) {
      context.drawImage(this.image1, this.x1, this.y, this.width, this.height);
      context.drawImage(this.image2, this.x2, this.y, this.width, this.height);
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
      this.enemyInterval = 1000;
      this.ammo = 20;
      this.maxAmmo = 50;
      this.ammoTimer = 0;
      this.ammoInterval = 300;
      this.score = 0;
      this.winningScore = 10;
      this.gameOver = false;
      this.coins = [];
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
  
      this.enemies.forEach((enemy) => {
        enemy.update(deltaTime);
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
  
    draw(context) {
      this.background.draw(context);
      this.player.draw(context);
      this.enemies.forEach((enemy) => enemy.draw(context));
      this.ui.draw(context);
      this.coins.forEach((coin) => coin.draw(context));
    }
  
    addEnemy() {
      this.enemies.push(new Jellyfish(this));
    }
  
    addCoin() {
      const x = Math.random() * (this.width - 50);
      const y = Math.random() * (this.height - 50);
      this.coins.push(new Coin(this, x, y));
    }
  }
  
  const game = new Game(canvas.width, canvas.height);
  let lastTime = 0;
  
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    context.clearRect(0, 0, canvas.width, canvas.height);
    game.update(deltaTime);
    game.draw(context);
    requestAnimationFrame(animate);
  }
  
  animate(0);
  
});


