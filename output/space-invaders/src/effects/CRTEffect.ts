export function drawCRT(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Scanlines
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.globalAlpha = 0.13;
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }

  // Vignette
  ctx.globalAlpha = 1;
  const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.22, w / 2, h / 2, h * 0.88);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.58)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);

  // Occasional flicker
  if (Math.random() < 0.025) {
    ctx.globalAlpha = 0.025;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
  }

  // Horizontal noise line (rare)
  if (Math.random() < 0.008) {
    const ly = Math.random() * h;
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, ly, w, 1);
  }

  ctx.restore();
}
