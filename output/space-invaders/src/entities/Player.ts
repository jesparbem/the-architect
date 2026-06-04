import { SHOOT_COOLDOWN, POWERUP_DURATION } from '../constants';
import type { PowerUpKind } from '../types';

export class Player {
  x: number;
  y: number;
  readonly halfW = 20;
  readonly halfH = 12;

  alive = true;
  shootCooldown = 0;
  shootCooldownMax = SHOOT_COOLDOWN;

  shield = false;
  doubleShot = false;
  rapidFire = false;

  private powerUpTimers = new Map<PowerUpKind, number>();

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  applyPowerUp(kind: PowerUpKind): void {
    this.powerUpTimers.set(kind, POWERUP_DURATION);
    if (kind === 'shield') this.shield = true;
    if (kind === 'doubleshot') this.doubleShot = true;
    if (kind === 'rapidfire') {
      this.rapidFire = true;
      this.shootCooldownMax = SHOOT_COOLDOWN * 0.3;
    }
  }

  getPowerUpTimers(): ReadonlyMap<PowerUpKind, number> {
    return this.powerUpTimers;
  }

  update(dt: number): void {
    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    for (const [kind, t] of this.powerUpTimers) {
      const nt = t - dt;
      if (nt <= 0) {
        this.powerUpTimers.delete(kind);
        if (kind === 'shield') this.shield = false;
        if (kind === 'doubleshot') this.doubleShot = false;
        if (kind === 'rapidfire') {
          this.rapidFire = false;
          this.shootCooldownMax = SHOOT_COOLDOWN;
        }
      } else {
        this.powerUpTimers.set(kind, nt);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    if (!this.alive) return;
    const x = this.x;
    const y = this.y;
    const color = this.shield ? '#00ffff' : '#00ff88';

    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = this.shield ? 22 : 14;

    // Base platform
    ctx.fillRect(x - 18, y - 6, 36, 14);
    // Cannon barrel
    ctx.fillRect(x - 4, y - 20, 8, 18);
    // Left leg
    ctx.fillRect(x - 22, y + 5, 8, 8);
    // Right leg
    ctx.fillRect(x + 14, y + 5, 8, 8);
    // Notch details
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 10, y - 4, 4, 8);
    ctx.fillRect(x + 6, y - 4, 4, 8);

    if (this.shield) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 18;
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(time * 6);
      ctx.beginPath();
      ctx.arc(x, y, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}
