'use strict';
//Вектор
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error(`Можно прибавлять к вектору только вектор типа Vector`);
    }
    const newX = this.x + vector.x;
    const newY = this.y + vector.y;
    return new Vector(newX, newY);
  }
  times(multiplier) {
    const newX = this.x * multiplier;
    const newY = this.y * multiplier;
    return new Vector(newX, newY);
  }  
}
//Движущийся объект
class Actor {
  constructor(position = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(position instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
      throw new Error(`В конструктор класса Actor пеоредан не Vector`)
    }
    this.pos = position;
    this.size = size;
    this.speed = speed;
  }
  act() {
  }

  get left() {
    return this.pos.x;
  }
  get top() {
    return this.pos.y;
  }
  
  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return `actor`;
  }

  isIntersect(otherActor) {
    if (!(otherActor instanceof Actor)) {
      throw new Error(`В метод не передан движущийся объект типа Actor`)
    }

    if (this === otherActor) {
      return false;
    }

    return this.right > otherActor.left && 
           this.left < otherActor.right && 
           this.top < otherActor.bottom && 
           this.bottom > otherActor.top;
  }
}


//Игровое поле

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid.slice(); 
    this.actors = actors.slice();
    this.player = this.actors.find(actor => actor.type === 'player');
    this.height = this.grid.length;  
    this.width = this.grid.reduce((rez, item) => {
      if (rez > item.length) {
        return rez;
      } else {
        return item.length;
      }
    }, 0);
    this.status = null; 
    this.finishDelay = 1; 
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error(`Не передаетть аргумент или передает не объект Actor в метод`);
    }
    return this.actors.find(actorE1 => actorE1.isIntersect(actor));
  }

  obstacleAt(position, size) {
    if (!(position instanceof Vector) || !(size instanceof Vector)) {
      throw new Error (`Vector не передан в метод obstacleAt`);
    }
    
    const borderLeft = Math.floor(position.x);
    const borderRight = Math.ceil(position.x + size.x);
    const borderTop = Math.floor(position.y);
    const borderBottom = Math.ceil(position.y + size.y);

    if (borderBottom > this.height) {
      return 'lava';
    }

    if (borderLeft < 0 || borderRight > this.width || borderTop < 0) {
      return 'wall';
    }

    for (let y = borderTop; y < borderBottom; y++) {
      for (let x = borderLeft; x < borderRight; x++) {
        const gridLevel = this.grid[y][x];
        if (gridLevel) {
          return gridLevel;
        }
      }
    }
  }

  removeActor(actor) {
    const actorIndex = this.actors.indexOf(actor);
    if (actorIndex !== -1) {
      this.actors.splice(actorIndex, 1);
    }
  }

  noMoreActors(type) {
    return !this.actors.some((actor) => actor.type === type);
  }

  playerTouched(touchedType, actor) {
    if (this.status !== null) {
      return;
    }

    if (['lava', 'fireball'].some((el) => el === touchedType)) {
      return this.status = 'lost';
    }

    if (touchedType === 'coin' && actor.type === 'coin') {
      this.removeActor(actor);
      if (this.noMoreActors('coin')) {
        return this.status = 'won';
      }
    }
  }
}


//Парсер уровня

class LevelParser {
  constructor(dictionaryMovingObjects) {
    this.dictionaryMovingObjects = Object.assign({}, dictionaryMovingObjects);
  }

  actorFromSymbol(letter) {
    return this.dictionaryMovingObjects[letter];
  }

  obstacleFromSymbol(letter) {
    if (letter === 'x') {
      return 'wall';
    }  
    if (letter === '!') {
      return 'lava';
    } 
  }

  createGrid(plan) {
    return plan.map(line => line.split('')).map(line => line.map(line => this.obstacleFromSymbol(line)));
  }

  createActors(plan) {
    return plan.reduce((rez, itemY, y) => {
      itemY.split('').forEach((itemX, x) => {
        const constructor = this.actorFromSymbol(itemX);
        if (typeof constructor === 'function') {
          const actor = new constructor(new Vector(x, y));
          if (actor instanceof Actor) {
            rez.push(actor);
          }
        }
      });
      return rez;
    }, []);
  }

  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}

//шаровая молния
class Fireball extends Actor {
  constructor(position = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(position, new Vector(1, 1), speed);
  }
  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    const nextPos = this.getNextPosition(time);
    if (level.obstacleAt(nextPos, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = nextPos
    }
  }
}


//Горизонтальная шаровая молния

class HorizontalFireball extends Fireball {
  constructor(position = new Vector (0, 0)) {
    super(position, new Vector(2, 0));
  }
}

//Вертикальная шаровая молния
class VerticalFireball extends Fireball {
  constructor(position = new Vector(0, 0)) {
    super(position, new Vector(0, 2));
  }
}

//Огненный дождь
class FireRain extends Fireball {
  constructor(position = new Vector(0, 0)) {
    super(position, new Vector(0, 3));
    this.startPosition = this.pos;
  }

  handleObstacle() {
    this.pos = this.startPosition;
  }
}

//Монета
class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector (0.6, 0.6));
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * (Math.PI * 2);
    this.startPosition = this.pos;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.startPosition.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}


//Игрок
class Player extends Actor {
  constructor(position = new Vector(0, 0)) {
    super(position.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
  }

  get type() {
    return 'player';
  }
}

const actorDict = {

'@' : Player,
'o' : Coin,
'=' : HorizontalFireball,
'|' : VerticalFireball,
'v' : FireRain
};

const parser = new LevelParser(actorDict);

loadLevels()
  .then((res) => {
    runGame(JSON.parse(res), parser, DOMDisplay)
      .then(() => alert('Вы выиграли!'))
  });

