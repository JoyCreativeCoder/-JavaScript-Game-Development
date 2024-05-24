window.addEventListener('load', () => {
    const canvas = document.getElementById('canvas1');
    const context = canvas.getContext('2d');
    canvas.width = 1920;
    canvas.height = 1080;

    class InputHandler {
      constructor(game) {
        this.game = game;   
        window.addEventListener('keydown', (event) => {
            if((event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') && this.game.keys.indexOf(event.key) === -1) {
                this.game.keys.push(event.key);
            } else if(event.key === ' ') {
                this.game.player.shoot();
            }

        });

        window.addEventListener('keyup', (event) => {
            if(this.game.keys.indexOf(event.key) > -1) {
                this.game.keys.splice(this.game.keys.indexOf(event.key), 1);
            }
        })
      }
    }

    class ProjectileBubble  {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.radius = 10;
            this.speed = 5;
            this.markedForDeletion = false;
        }

        update() {
            this.x += this.speed;
            if(this.x > this.game.width * 0.8){
                this.markedForDeletion = true;
            }
        }

        draw(context) {
            context.fillStyle = 'rgba(173, 216, 230, 0.8)';
            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            context.fill();
        }
    }

    class Particle {

    }

    class Player {
        constructor(game) {
            this.game = game;
            this.width = 120;
            this.height = 100;
            this.x = 50; 
            this.y = 100;
            this.speedY = 0;
            this.speedX = 0;
            this.maxSpeed = 5;
            this.ProjectileBubble = [];
        }

        update() {
            if(this.game.keys.includes('ArrowUp')) {
                this.speedY = -this.maxSpeed;
            } else if(this.game.keys.includes('ArrowDown')) {
                this.speedY = this.maxSpeed;
            } else if(this.game.keys.includes('ArrowLeft')) {
                this.speedX = -this.maxSpeed;
            } else if(this.game.keys.includes('ArrowRight')) {
                this.speedX = this.maxSpeed;
            }  else {
                this.speedY = 0;
                this.speedX = 0;
            }
           
            this.y += this.speedY;
            this.x += this.speedX;

            if (this.x < 0) this.x = 0;
            if (this.x + this.width > this.game.width ) this.x = this.game.width - this.width;
            if (this.y < 0) this.y = 0;
            if (this.y + this.height > this.game.height) this.y = this.game.height - this.height;

            this.ProjectileBubble.forEach(projectile => {
                projectile.update();
            })
            this.ProjectileBubble = this.ProjectileBubble.filter(projectile => !projectile.markedForDeletion);
        }

        draw(context) {
            context.fillStyle = '#FFD700';
            context.fillRect(this.x, this.y, this.width, this.height);
            this.ProjectileBubble.forEach(projectile => {
                projectile.draw(context );
            })
        }

        shoot() {
            if(this.game.ammo > 0) {
                this.ProjectileBubble.push(new ProjectileBubble(this.game, this.x , this.y ));
                this.game.ammo--;
            }
        }
    }

    class Enemy {
        costructor(game) {
            this.game = game;
            this.x = this.game.width;
        }
    }

    class Layer {
        
    }

    class Background {
        
    }

    class UI {
        
    }

    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.player = new Player(this);
            this.input = new InputHandler(this)
            this.keys = [];
            this.ammo = 100;
        }

        update() {
            this.player.update();
        }

        draw(context) {
            this.player.draw(context)
        }
    }

    const game = new Game(canvas.width, canvas.height); 

    function animate() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        game.update();
        game.draw(context);
        requestAnimationFrame(animate)
    }
    animate()
});