const ROW_COLORS = ['#ff00ff', '#ff00ff', '#00e5ff', '#00e5ff', '#00ff88'];
const ROW_POINTS = [30, 30, 20, 20, 10];

export class Invader {
  x: number;
  y: number;
  col: number;
  row: number;
  alive = true;
  frame = 0;

  constructor(x: number, y: number, col: number, row: number) {
    this.x = x;
    this.y = y;
    this.col = col;
    this.row = row;
  }

  get color(): string { return ROW_COLORS[this.row] ?? '#00ff88'; }
  get points(): number { return ROW_POINTS[this.row] ?? 10; }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;
    const { x, y, row, frame: f } = this;
    const c = this.color;

    ctx.save();
    ctx.fillStyle = c;
    ctx.shadowColor = c;
    ctx.shadowBlur = 10;

    if (row <= 1) {
      // Squid — top rows
      ctx.fillRect(x - 5, y - 11, 10, 8);
      ctx.fillRect(x - 9, y - 3, 18, 8);
      ctx.fillRect(x - 13, y + 5, 5, 4);
      ctx.fillRect(x + 8, y + 5, 5, 4);
      ctx.fillRect(x - 7, y - 13, 3, 4);
      ctx.fillRect(x + 4, y - 13, 3, 4);
      if (f === 0) {
        ctx.fillRect(x - 15, y + 3, 4, 6);
        ctx.fillRect(x + 11, y + 3, 4, 6);
      } else {
        ctx.fillRect(x - 11, y + 6, 4, 6);
        ctx.fillRect(x + 7, y + 6, 4, 6);
      }
    } else if (row <= 3) {
      // Crab — middle rows
      ctx.fillRect(x - 9, y - 9, 18, 6);
      ctx.fillRect(x - 13, y - 3, 26, 8);
      ctx.fillRect(x - 9, y + 5, 5, 4);
      ctx.fillRect(x + 4, y + 5, 5, 4);
      ctx.fillRect(x - 5, y - 13, 3, 5);
      ctx.fillRect(x + 2, y - 13, 3, 5);
      if (f === 0) {
        ctx.fillRect(x - 17, y - 1, 6, 4);
        ctx.fillRect(x + 11, y - 1, 6, 4);
      } else {
        ctx.fillRect(x - 17, y + 3, 6, 4);
        ctx.fillRect(x + 11, y + 3, 6, 4);
      }
    } else {
      // Octopus — bottom row
      ctx.fillRect(x - 7, y - 13, 14, 8);
      ctx.fillRect(x - 11, y - 5, 22, 8);
      ctx.fillRect(x - 14, y + 3, 28, 4);
      ctx.fillRect(x - 9, y + 7, 4, 4);
      ctx.fillRect(x - 1, y + 7, 4, 4);
      ctx.fillRect(x + 5, y + 7, 4, 4);
      if (f === 0) {
        ctx.fillRect(x - 15, y + 1, 4, 6);
        ctx.fillRect(x + 11, y + 1, 4, 6);
      } else {
        ctx.fillRect(x - 11, y + 4, 4, 6);
        ctx.fillRect(x + 7, y + 4, 4, 6);
      }
    }

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 5, y - 7, 3, 3);
    ctx.fillRect(x + 2, y - 7, 3, 3);

    ctx.restore();
  }
}
