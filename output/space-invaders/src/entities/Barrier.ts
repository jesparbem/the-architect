const BS = 8; // block size in pixels
const COLS = 8;
const ROWS = 5;

// 1 = solid block, 0 = empty
const SHAPE: number[][] = [
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 0, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
];

export class Barrier {
  x: number;
  y: number;
  private blocks: boolean[][];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.blocks = SHAPE.map(row => row.map(v => v === 1));
  }

  hitTest(bx: number, by: number): boolean {
    const ox = bx - (this.x - (COLS * BS) / 2);
    const oy = by - (this.y - (ROWS * BS) / 2);
    const col = Math.floor(ox / BS);
    const row = Math.floor(oy / BS);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
    if (this.blocks[row][col]) {
      this.blocks[row][col] = false;
      // Chip adjacent blocks for blast effect
      if (col > 0 && Math.random() < 0.5) this.blocks[row][col - 1] = false;
      if (col < COLS - 1 && Math.random() < 0.5) this.blocks[row][col + 1] = false;
      if (row > 0 && Math.random() < 0.3) this.blocks[row - 1][col] = false;
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#00ff44';
    ctx.shadowColor = '#00ff44';
    ctx.shadowBlur = 7;
    const ox = this.x - (COLS * BS) / 2;
    const oy = this.y - (ROWS * BS) / 2;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.blocks[r][c]) {
          ctx.fillRect(ox + c * BS, oy + r * BS, BS - 1, BS - 1);
        }
      }
    }
    ctx.restore();
  }
}
