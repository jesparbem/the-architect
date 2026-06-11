import type { Screen } from './Screen';
import type { Game } from '../Game';
import { W, H } from '../constants';

export class PauseScreen implements Screen {
  constructor(private game: Game) {}

  onEnter(): void {
    window.addEventListener('keydown', this.onKey);
  }

  onExit(): void {
    window.removeEventListener('keydown', this.onKey);
  }

  private onKey = (e: KeyboardEvent): void => {
    if (e.key === 'p' || e.key === 'P' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      this.game.goto('game');
    }
    if (e.key === 'm' || e.key === 'M') {
      this.game.goto('menu');
    }
  };

  update(_dt: number): void {}

  draw(ctx: CanvasRenderingContext2D): void {
    // Dark overlay — game is drawn underneath by Game.ts loop
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.textAlign = 'center';

    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 68px monospace';
    ctx.fillText('PAUSED', W / 2, H / 2 - 30);

    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#00ff88';
    ctx.font = '22px monospace';
    ctx.fillText('P / SPACE — RESUME', W / 2, H / 2 + 42);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#555';
    ctx.font = '18px monospace';
    ctx.fillText('M — MAIN MENU', W / 2, H / 2 + 78);
    ctx.restore();
  }
}
