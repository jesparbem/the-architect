import type { PowerUpKind } from '../types';

const COLORS: Record<PowerUpKind, string> = {
  rapidfire: '#ffff00',
  doubleshot: '#ff8800',
  shield: '#00e5ff',
};

const LABELS: Record<PowerUpKind, string> = {
  rapidfire: 'RAPID',
  doubleshot: '×2',
  shield: 'SHLD',
};

export class PowerUp {
  x: number;
  y: number;
  readonly kind: PowerUpKind;
  alive = true;
  vy = 65;
  private t = 0;

  constructor(x: number, y: number, kind: PowerUpKind) {
    this.x = x;
    this.y = y;
    this.kind = kind;
  }

  update(dt: number): void {
    this.y += this.vy * dt;
    this.t += dt;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const color = COLORS[this.kind];
    const pulse = 0.8 + 0.2 * Math.sin(this.t * 6);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.strokeRect(this.x - 21, this.y - 11, 42, 22);
    ctx.fillStyle = color;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(LABELS[this.kind], this.x, this.y);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
