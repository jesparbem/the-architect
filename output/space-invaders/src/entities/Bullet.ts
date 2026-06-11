export class Bullet {
  x: number;
  y: number;
  vy: number;
  alive = true;
  readonly isPlayer: boolean;

  constructor(x: number, y: number, vy: number, isPlayer: boolean) {
    this.x = x;
    this.y = y;
    this.vy = vy;
    this.isPlayer = isPlayer;
  }

  update(dt: number): void {
    this.y += this.vy * dt;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    if (this.isPlayer) {
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 10;
      ctx.fillRect(this.x - 2, this.y - 10, 4, 20);
    } else {
      ctx.fillStyle = '#ff3333';
      ctx.shadowColor = '#ff3333';
      ctx.shadowBlur = 8;
      // Zigzag invader bolt
      ctx.fillRect(this.x - 1, this.y - 8, 3, 5);
      ctx.fillRect(this.x - 3, this.y - 3, 3, 5);
      ctx.fillRect(this.x, this.y + 2, 3, 5);
    }
    ctx.restore();
  }
}
