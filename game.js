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
class Actor{
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

