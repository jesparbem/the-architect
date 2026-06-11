import { W, H } from './constants';
import { AudioEngine } from './audio/AudioEngine';
import { drawCRT } from './effects/CRTEffect';
import { MenuScreen } from './screens/MenuScreen';
import { GameScreen } from './screens/GameScreen';
import { PauseScreen } from './screens/PauseScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import type { Screen } from './screens/Screen';
import type { ScreenName, HighScore } from './types';

export class Game {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly audio: AudioEngine;

  highScores: HighScore[] = [];

  private screens = new Map<ScreenName, Screen>();
  private current!: Screen;
  private currentName: ScreenName = 'menu';
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext('2d')!;
    this.audio = new AudioEngine();

    this.loadScores();

    const menu = new MenuScreen(this);
    const game = new GameScreen(this);
    const pause = new PauseScreen(this);
    const over = new GameOverScreen(this);

    this.screens.set('menu', menu);
    this.screens.set('game', game);
    this.screens.set('pause', pause);
    this.screens.set('gameover', over);

    this.current = menu;
    this.currentName = 'menu';
    menu.onEnter();
  }

  goto(name: ScreenName): void {
    this.current.onExit?.();
    this.currentName = name;
    const next = this.screens.get(name)!;
    this.current = next;
    next.onEnter();
  }

  endGame(score: number, wave: number): void {
    (this.screens.get('gameover') as GameOverScreen).setResult(score, wave);
    this.goto('gameover');
  }

  start(): void {
    requestAnimationFrame(this.loop.bind(this));
  }

  private loop(ts: number): void {
    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;

    const { ctx } = this;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    this.current.update(dt);

    // Pause draws the game underneath before its overlay
    if (this.currentName === 'pause') {
      (this.screens.get('game') as GameScreen).draw(ctx);
    }
    this.current.draw(ctx);

    drawCRT(ctx, W, H);

    requestAnimationFrame(this.loop.bind(this));
  }

  addScore(score: HighScore): void {
    this.highScores.push(score);
    this.highScores.sort((a, b) => b.score - a.score);
    this.highScores = this.highScores.slice(0, 10);
    this.saveScores();
  }

  private loadScores(): void {
    try {
      const raw = localStorage.getItem('si_neon_scores');
      if (raw) this.highScores = JSON.parse(raw) as HighScore[];
    } catch (_) {}
  }

  private saveScores(): void {
    try {
      localStorage.setItem('si_neon_scores', JSON.stringify(this.highScores));
    } catch (_) {}
  }
}
