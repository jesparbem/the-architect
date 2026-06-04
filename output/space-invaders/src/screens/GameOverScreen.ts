import type { Screen } from './Screen';
import type { Game } from '../Game';
import { W, H } from '../constants';

export class GameOverScreen implements Screen {
  private score = 0;
  private wave = 1;
  private name = '';
  private saved = false;
  private done = false;
  private blink = 0;

  constructor(private game: Game) {}

  setResult(score: number, wave: number): void {
    this.score = score;
    this.wave = wave;
    this.name = '';
    this.saved = false;
    this.done = false;
  }

  onEnter(): void {
    this.game.audio.playGameOver();
    window.addEventListener('keydown', this.onKey);
  }

  onExit(): void {
    window.removeEventListener('keydown', this.onKey);
  }

  private onKey = (e: KeyboardEvent): void => {
    if (this.done) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.game.goto('menu');
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = this.name.trim() || 'ACE';
      if (!this.saved) {
        this.game.addScore({ name: trimmed.slice(0, 10), score: this.score, wave: this.wave });
        this.saved = true;
      }
      this.done = true;
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      this.name = this.name.slice(0, -1);
      return;
    }

    if (e.key.length === 1 && this.name.length < 10) {
      this.name += e.key.toUpperCase();
    }
  };

  update(dt: number): void {
    this.blink += dt;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';

    ctx.shadowColor = '#ff3333';
    ctx.shadowBlur = 35;
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 76px monospace';
    ctx.fillText('GAME OVER', W / 2, 155);

    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#00e5ff';
    ctx.font = '26px monospace';
    ctx.fillText(`SCORE  ${String(this.score).padStart(7, '0')}`, W / 2, 225);
    ctx.fillText(`WAVE   ${this.wave}`, W / 2, 262);

    if (!this.done) {
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffff00';
      ctx.font = '20px monospace';
      ctx.fillText('ENTER YOUR NAME:', W / 2, 335);

      const cursor = Math.sin(this.blink * 5) > 0 ? '_' : ' ';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 34px monospace';
      ctx.fillText(this.name + cursor, W / 2, 390);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#555';
      ctx.font = '15px monospace';
      ctx.fillText('PRESS ENTER TO CONFIRM', W / 2, 440);
    } else {
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#00ff88';
      ctx.font = '22px monospace';
      ctx.fillText(`SAVED AS: ${this.name.trim() || 'ACE'}`, W / 2, 360);

      if (Math.sin(this.blink * 3) > 0) {
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.fillText('PRESS SPACE TO CONTINUE', W / 2, 430);
      }
    }

    ctx.restore();
  }
}
