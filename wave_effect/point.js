// Source: https://youtu.be/LLfhY4eVwDY
export class Point {
  // 웨이브를 선으로 그리는게 아니고 x가 고정 되어있고
  // y의 값만 움직이는 점을 그린다고 생각하자
  constructor(index, x, y) {
    this.x = x;
    this.y = y;
    this.fixedY = y;
    this.speed = 0.05;
    this.cur = index;
    this.max = Math.random() * 100 + 150;
  }

  update() {
    this.cur += this.speed;
    this.y = this.fixedY + Math.sin(this.cur) * this.max;
  }
}
