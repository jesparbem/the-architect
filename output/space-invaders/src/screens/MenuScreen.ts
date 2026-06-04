import type { Screen } from './Screen';
import type { Game } from '../Game';
import { W, H } from '../constants';
import { touchControls } from '../input/TouchControls';

export class MenuScreen implements Screen {
  private blink = 0;
  private showScores = false;
  private lastFireTaps = 0;
  private stars: Array<{ x: number; y: number; size: number; speed: number }> = [];

  constructor(private game: Game) {
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: 0.5 + Math.random() * 2,
        speed: 15 + Math.random() * 35,
      });
    }
  }

  onEnter(): void {
    this.showScores = false;
    this.lastFireTaps = touchControls.fireTaps;
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('touchstart', this.onAnyTouch);
  }

  onExit(): void {
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('touchstart', this.onAnyTouch);
  }

  private onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (this.showScores) {
        this.showScores = false;
      } else {
        this.game.audio.resume();
        this.game.goto('game');
      }
    }
    if (e.key === 'h' || e.key === 'H') {
      this.showScores = !this.showScores;
    }
  };

  private onAnyTouch = (): void => {
    if (this.showScores) {
      this.showScores = false;
    } else {
      this.game.audio.resume();
      this.game.goto('game');
    }
  };

  update(dt: number): void {
    this.blink += dt;
    for (const s of this.stars) {
      s.y += s.speed * dt;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    }
    // FIRE button as "start / continue"
    if (touchControls.fireTaps > this.lastFireTaps) {
      this.lastFireTaps = touchControls.fireTaps;
      if (this.showScores) {
        this.showScores = false;
      } else {
        this.game.audio.resume();
        this.game.goto('game');
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#fff';
    for (const s of this.stars) {
      ctx.globalAlpha = 0.3 + Math.random() * 0.3;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (this.showScores) this.drawScores(ctx);
    else this.drawMenu(ctx);
  }

  private drawMenu(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';

    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#ff00ff';
    ctx.font = 'bold 78px monospace';
    ctx.fillText('SPACE', W / 2, 175);
    ctx.fillText('INVADERS', W / 2, 265);

    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#00e5ff';
    ctx.font = '22px monospace';
    ctx.fillText('— NEON EDITION —', W / 2, 308);

    if (Math.sin(this.blink * 3) > 0) {
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#00ff88';
      ctx.font = '22px monospace';
      const prompt = touchControls.active ? 'TAP TO START' : 'PRESS SPACE TO START';
      ctx.fillText(prompt, W / 2, 390);
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#666';
    ctx.font = '15px monospace';
    if (touchControls.active) {
      ctx.fillText('◀ ▶ MOVE   FIRE SHOOT   ⏸ PAUSE', W / 2, 450);
    } else {
      ctx.fillText('H — HIGH SCORES', W / 2, 440);
      ctx.fillText('← → MOVE   SPACE FIRE   P PAUSE', W / 2, 465);
    }

    // Score table
    const entries: [string, string][] = [
      ['#ff0088', '??? PTS (UFO)'],
      ['#ff00ff', ' 30 PTS'],
      ['#00e5ff', ' 20 PTS'],
      ['#00ff88', ' 10 PTS'],
    ];
    entries.forEach(([c, pts], i) => {
      const y = 505 + i * 32;
      ctx.fillStyle = c;
      ctx.shadowColor = c;
      ctx.shadowBlur = 8;
      ctx.fillRect(W / 2 - 130, y - 10, 24, 16);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#aaa';
      ctx.font = '15px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`= ${pts}`, W / 2 - 98, y + 3);
    });

    ctx.restore();
  }

  private drawScores(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';

    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 42px monospace';
    ctx.fillText('HIGH SCORES', W / 2, 115);

    const scores = this.game.highScores;
    if (scores.length === 0) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#555';
      ctx.font = '20px monospace';
      ctx.fillText('NO SCORES YET. PLAY TO SET ONE!', W / 2, 300);
    } else {
      scores.slice(0, 8).forEach((s, i) => {
        const y = 175 + i * 44;
        const c = i === 0 ? '#ffff00' : i < 3 ? '#00e5ff' : '#888';
        ctx.fillStyle = c;
        ctx.shadowColor = c;
        ctx.shadowBlur = i === 0 ? 18 : 0;
        ctx.font = i === 0 ? 'bold 22px monospace' : '20px monospace';
        const rank = `${i + 1}.`.padEnd(3);
        const name = s.name.padEnd(12);
        const score = String(s.score).padStart(7, '0');
        ctx.fillText(`${rank} ${name} ${score}  W${s.wave}`, W / 2, y);
      });
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#555';
    ctx.font = '16px monospace';
    const backPrompt = touchControls.active ? 'TAP FIRE TO RETURN' : 'PRESS SPACE TO RETURN';
    ctx.fillText(backPrompt, W / 2, 570);
    ctx.restore();
  }
}
