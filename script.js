window.addEventListener('load', () => {
    const canvas = document.getElementById('canvas1');
    const context = canvas.getContext('2d');
    canvas.width = 1500;
    canvas.height = 500;

class InputHandler {
    constructor(game) {
        this.game = game;
        window.addEventListener('keydown', (e) => {
            if(((e.key === 'ArrowUp') || (e.key === 'ArrowDown'))&& this.game.keys.indexOf(e.key) === -1) {
                this.game.keys.push(e.key);
            }
        })

        window.addEventListener('keyUp', (e) => {
            if(this.game.keys.indexOf(e.key) > -1) {
                this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
            }
        })
    }
}

class Projectile {
    
}

class particle {
    
}

class player {
    constructor(game) {
        this.game = game;
        this.width = 120;
        this.height = 190;
        this.x = 20;
        this.y = 100;
        this.speedY = 0;
        this.maxSpeed = 3;
    }

    update() {
        if(this.game.keys.includes('ArrowUp')) this.speedY = -1;
        else if(this.game.keys.includes('ArrowDown')) this.speedY = 1;
        else this.speedY = 0;
        this.y += this.speedY;
    }

    draw (context) {
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Enemy {
    
}

class Layer {
    
}

class Background {
    
}

class Ui {
    
}

class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.player = new player(this);
        this.input = new InputHandler(this);
        this.keys = [];
    }

    update() {
        this.player.update();
    }
    
    draw(context) {
        this.player.draw(context);
    }

}
const game = new Game(canvas.width, canvas.height);

//animation loop
function animate() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    game.update();
    game.draw(context);
    requestAnimationFrame(animate);
}

animate()

})
