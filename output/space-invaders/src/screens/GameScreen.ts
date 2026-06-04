import type { Screen } from './Screen';
import type { Game } from '../Game';
import {
  W, H,
  COLS, ROWS, INV_W, INV_H, INV_GAP_X, INV_GAP_Y, INV_STEP, INV_DROP,
  BARRIER_COUNT, LIVES,
  PLAYER_SPEED, BULLET_SPEED, INV_BULLET_SPEED,
  POWERUP_CHANCE,
  UFO_SPEED, UFO_INTERVAL_MIN, UFO_INTERVAL_MAX,
} from '../constants';
import { Player } from '../entities/Player';
import { Invader } from '../entities/Invader';
import { Bullet } from '../entities/Bullet';
import { Barrier } from '../entities/Barrier';
import { PowerUp } from '../entities/PowerUp';
import { ParticleSystem } from '../effects/ParticleSystem';
import type { PowerUpKind } from '../types';

const POWERUP_KINDS: PowerUpKind[] = ['rapidfire', 'doubleshot', 'shield'];

export class GameScreen implements Screen {
  score = 0;
  wave = 1;
  lives = LIVES;

  private player!: Player;
  private invaders: Invader[] = [];
  private playerBullets: Bullet[] = [];
  private invaderBullets: Bullet[] = [];
  private barriers: Barrier[] = [];
  private powerUps: PowerUp[] = [];
  private particles!: ParticleSystem;

  private invDir = 1;
  private invMoveTimer = 0;
  private invMoveInterval = 0.8;
  private invAnimFrame = 0;

  private invShootTimer = 1.5;

  private respawnTimer = 0;
  private transitioning = false;

  private ufoX = 0;
  private ufoDir = 1;
  private ufoActive = false;
  private ufoTimer = UFO_INTERVAL_MIN;

  private keys = new Set<string>();
  private time = 0;
  private stars: Array<{ x: number; y: number; size: number; speed: number }> = [];

  constructor(private game: Game) {
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: 0.5 + Math.random() * 1.5,
        speed: 8 + Math.random() * 18,
      });
    }
  }

  onEnter(): void {
    this.fullReset();
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  onExit(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.game.audio.stopMarch();
    this.keys.clear();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.key);
    if (e.key === ' ' || e.key === 'ArrowUp') e.preventDefault();
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      e.preventDefault();
      this.game.goto('pause');
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key);
  };

  private fullReset(): void {
    this.score = 0;
    this.wave = 1;
    this.lives = LIVES;
    this.transitioning = false;
    this.playerBullets = [];
    this.invaderBullets = [];
    this.powerUps = [];
    this.particles = new ParticleSystem();
    this.player = new Player(W / 2, 578);
    this.spawnWave();
    this.spawnBarriers();
    this.invDir = 1;
    this.invMoveTimer = 0;
    this.invShootTimer = 1.5;
    this.ufoActive = false;
    this.ufoTimer = UFO_INTERVAL_MIN + Math.random() * (UFO_INTERVAL_MAX - UFO_INTERVAL_MIN);
    this.syncMarch();
  }

  private spawnWave(): void {
    this.invaders = [];
    const totalW = COLS * (INV_W + INV_GAP_X) - INV_GAP_X;
    const startX = (W - totalW) / 2 + INV_W / 2;
    const startY = 72;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.invaders.push(new Invader(
          startX + c * (INV_W + INV_GAP_X),
          startY + r * (INV_H + INV_GAP_Y),
          c, r,
        ));
      }
    }
    this.invDir = 1;
    this.invMoveInterval = Math.max(0.08, 0.8 - (this.wave - 1) * 0.07);
  }

  private spawnBarriers(): void {
    this.barriers = [];
    const spacing = W / (BARRIER_COUNT + 1);
    for (let i = 0; i < BARRIER_COUNT; i++) {
      this.barriers.push(new Barrier(spacing * (i + 1), 510));
    }
  }

  private syncMarch(): void {
    const alive = this.invaders.filter(i => i.alive).length;
    const interval = Math.max(0.05, this.invMoveInterval * (alive / (COLS * ROWS)));
    this.game.audio.startMarch(Math.round(interval * 1000));
  }

  update(dt: number): void {
    this.time += dt;

    for (const s of this.stars) {
      s.y += s.speed * dt;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    }

    this.particles.update(dt);

    if (!this.player.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0 && !this.transitioning) {
        if (this.lives <= 0) {
          this.transitioning = true;
          this.game.endGame(this.score, this.wave);
        } else {
          this.player = new Player(W / 2, 578);
          this.invaderBullets = [];
          this.syncMarch();
        }
      }
      return;
    }

    this.handleInput(dt);
    this.player.update(dt);
    this.updateInvaders(dt);
    this.updateBullets(dt);
    this.updatePowerUps(dt);
    this.updateUFO(dt);
    this.checkCollisions();

    // Check invaders reached player line
    const lowest = this.invaders
      .filter(i => i.alive)
      .reduce((m, inv) => Math.max(m, inv.y), 0);
    if (lowest >= 545) {
      this.lives = 0;
      this.killPlayer();
    }

    // Wave clear
    if (!this.transitioning && this.invaders.every(i => !i.alive)) {
      this.transitioning = true;
      this.game.audio.playLevelUp();
      setTimeout(() => {
        this.wave++;
        this.playerBullets = [];
        this.invaderBullets = [];
        this.powerUps = [];
        this.player = new Player(W / 2, 578);
        this.spawnWave();
        this.spawnBarriers();
        this.transitioning = false;
        this.syncMarch();
      }, 1500);
    }
  }

  private handleInput(dt: number): void {
    const p = this.player;
    const left = this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A');
    const right = this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('D');
    if (left) p.x = Math.max(p.halfW + 2, p.x - PLAYER_SPEED * dt);
    if (right) p.x = Math.min(W - p.halfW - 2, p.x + PLAYER_SPEED * dt);

    const shoot = this.keys.has(' ') || this.keys.has('ArrowUp');
    if (shoot && p.shootCooldown <= 0) {
      p.shootCooldown = p.shootCooldownMax;
      this.playerBullets.push(new Bullet(p.x, p.y - 20, -BULLET_SPEED, true));
      if (p.doubleShot) {
        this.playerBullets.push(new Bullet(p.x - 14, p.y - 14, -BULLET_SPEED, true));
        this.playerBullets.push(new Bullet(p.x + 14, p.y - 14, -BULLET_SPEED, true));
      }
      this.game.audio.playShoot();
    }
  }

  private updateInvaders(dt: number): void {
    this.invMoveTimer += dt;
    const alive = this.invaders.filter(i => i.alive);
    if (alive.length === 0) return;

    const speedFactor = alive.length / (COLS * ROWS);
    const interval = Math.max(0.05, this.invMoveInterval * speedFactor);

    if (this.invMoveTimer < interval) return;
    this.invMoveTimer = 0;
    this.invAnimFrame ^= 1;

    const step = INV_STEP * this.invDir;
    let hitEdge = false;
    for (const inv of alive) {
      const nx = inv.x + step;
      if (nx < 28 || nx > W - 28) { hitEdge = true; break; }
    }

    if (hitEdge) {
      for (const inv of alive) inv.y += INV_DROP;
      this.invDir *= -1;
    } else {
      for (const inv of alive) inv.x += step;
    }

    for (const inv of alive) inv.frame = this.invAnimFrame;
    this.syncMarch();
  }

  private updateBullets(dt: number): void {
    this.invShootTimer -= dt;
    if (this.invShootTimer <= 0) {
      this.invaderShoot();
      const base = Math.max(0.4, 1.8 - (this.wave - 1) * 0.12);
      this.invShootTimer = base * (0.4 + Math.random() * 0.8);
    }

    for (const b of this.playerBullets) b.update(dt);
    for (const b of this.invaderBullets) b.update(dt);
    this.playerBullets = this.playerBullets.filter(b => b.alive && b.y > -20);
    this.invaderBullets = this.invaderBullets.filter(b => b.alive && b.y < H + 20);
  }

  private invaderShoot(): void {
    const alive = this.invaders.filter(i => i.alive);
    if (alive.length === 0) return;
    // Bottom-most invader in a random column
    const colMap = new Map<number, Invader>();
    for (const inv of alive) {
      const ex = colMap.get(inv.col);
      if (!ex || inv.y > ex.y) colMap.set(inv.col, inv);
    }
    const shooters = [...colMap.values()];
    const shooter = shooters[Math.floor(Math.random() * shooters.length)];
    if (shooter) {
      this.invaderBullets.push(new Bullet(shooter.x, shooter.y + 14, INV_BULLET_SPEED, false));
      this.game.audio.playInvaderShoot();
    }
  }

  private updatePowerUps(dt: number): void {
    for (const pu of this.powerUps) if (pu.alive) pu.update(dt);
    this.powerUps = this.powerUps.filter(pu => pu.alive && pu.y < H);
  }

  private updateUFO(dt: number): void {
    this.ufoTimer -= dt;
    if (!this.ufoActive && this.ufoTimer <= 0) {
      this.ufoActive = true;
      this.ufoDir = Math.random() < 0.5 ? 1 : -1;
      this.ufoX = this.ufoDir > 0 ? -40 : W + 40;
      this.ufoTimer = UFO_INTERVAL_MIN + Math.random() * (UFO_INTERVAL_MAX - UFO_INTERVAL_MIN);
    }
    if (this.ufoActive) {
      this.ufoX += UFO_SPEED * this.ufoDir * dt;
      if (this.ufoX < -60 || this.ufoX > W + 60) this.ufoActive = false;
    }
  }

  private checkCollisions(): void {
    // Player bullets → invaders
    for (const b of this.playerBullets) {
      if (!b.alive) continue;
      for (const inv of this.invaders) {
        if (!inv.alive) continue;
        if (Math.abs(b.x - inv.x) < 18 && Math.abs(b.y - inv.y) < 14) {
          b.alive = false;
          inv.alive = false;
          this.score += inv.points * this.wave;
          this.particles.emit(inv.x, inv.y, inv.color, 12, 160);
          this.game.audio.playExplosion(false);
          if (Math.random() < POWERUP_CHANCE) {
            const kind = POWERUP_KINDS[Math.floor(Math.random() * POWERUP_KINDS.length)];
            this.powerUps.push(new PowerUp(inv.x, inv.y, kind));
          }
          break;
        }
      }
      // → UFO
      if (this.ufoActive && Math.abs(b.x - this.ufoX) < 22 && Math.abs(b.y - 38) < 14) {
        b.alive = false;
        this.ufoActive = false;
        const bonus = (Math.floor(Math.random() * 6) + 1) * 50;
        this.score += bonus * this.wave;
        this.particles.emit(this.ufoX, 38, '#ff0088', 20, 200);
        this.game.audio.playExplosion(true);
      }
      // → barriers
      for (const bar of this.barriers) {
        if (!b.alive) break;
        if (bar.hitTest(b.x, b.y)) { b.alive = false; break; }
      }
    }

    // Invader bullets → barriers
    for (const b of this.invaderBullets) {
      if (!b.alive) continue;
      for (const bar of this.barriers) {
        if (bar.hitTest(b.x, b.y)) { b.alive = false; break; }
      }
    }

    // Invader bullets → player
    if (this.player.alive && !this.player.shield) {
      for (const b of this.invaderBullets) {
        if (!b.alive) continue;
        if (Math.abs(b.x - this.player.x) < 20 && Math.abs(b.y - this.player.y) < 15) {
          b.alive = false;
          this.killPlayer();
          break;
        }
      }
    }

    // Power-ups → player
    for (const pu of this.powerUps) {
      if (!pu.alive) continue;
      if (Math.abs(pu.x - this.player.x) < 30 && Math.abs(pu.y - this.player.y) < 22) {
        pu.alive = false;
        this.player.applyPowerUp(pu.kind);
        this.game.audio.playPowerUp();
        this.particles.emit(this.player.x, this.player.y, '#ffff00', 14, 100);
      }
    }
  }

  private killPlayer(): void {
    this.player.alive = false;
    this.lives--;
    this.respawnTimer = 2.2;
    this.particles.emit(this.player.x, this.player.y, '#00ff88', 24, 210);
    this.game.audio.playPlayerDeath();
    this.game.audio.stopMarch();
  }

  // Called by PauseScreen which needs to draw game underneath
  draw(ctx: CanvasRenderingContext2D): void {
    // Stars
    ctx.save();
    ctx.fillStyle = '#fff';
    for (const s of this.stars) {
      ctx.globalAlpha = 0.3 + Math.random() * 0.2;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Ground line
    ctx.save();
    ctx.strokeStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 608);
    ctx.lineTo(W, 608);
    ctx.stroke();
    ctx.restore();

    for (const bar of this.barriers) bar.draw(ctx);
    if (this.ufoActive) this.drawUFO(ctx);
    for (const inv of this.invaders) inv.draw(ctx);
    for (const b of this.playerBullets) b.draw(ctx);
    for (const b of this.invaderBullets) b.draw(ctx);
    for (const pu of this.powerUps) pu.draw(ctx);
    this.player.draw(ctx, this.time);
    this.particles.draw(ctx);
    this.drawHUD(ctx);
  }

  private drawUFO(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#ff0088';
    ctx.shadowColor = '#ff0088';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.ellipse(this.ufoX, 40, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(this.ufoX, 32, 11, 10, 0, Math.PI, 0);
    ctx.fill();
    // Windows
    ctx.fillStyle = '#ffccff';
    ctx.shadowBlur = 4;
    for (let i = -8; i <= 8; i += 8) {
      ctx.beginPath();
      ctx.arc(this.ufoX + i, 40, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = 'bold 18px monospace';

    // Score
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.fillText(`SCORE: ${String(this.score).padStart(7, '0')}`, 16, 30);

    // Wave
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.fillText(`WAVE ${this.wave}`, W / 2, 30);

    // Lives
    ctx.textAlign = 'right';
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.fillText('LIVES', W - 110, 30);
    for (let i = 0; i < this.lives; i++) {
      const lx = W - 95 + i * 30;
      ctx.fillRect(lx, 16, 20, 13);
    }

    // Power-up timers
    let puX = 16;
    const PUCOLORS: Record<string, string> = {
      rapidfire: '#ffff00',
      doubleshot: '#ff8800',
      shield: '#00e5ff',
    };
    const PULABELS: Record<string, string> = {
      rapidfire: 'RAPID',
      doubleshot: '×2',
      shield: 'SHLD',
    };
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    for (const [kind, t] of this.player.getPowerUpTimers()) {
      const c = PUCOLORS[kind] ?? '#fff';
      ctx.fillStyle = c;
      ctx.shadowColor = c;
      ctx.shadowBlur = 8;
      ctx.fillText(`${PULABELS[kind] ?? kind} ${t.toFixed(1)}s`, puX, H - 16);
      puX += 110;
    }

    ctx.restore();
  }
}
