export class TouchControls {
  left = false;
  right = false;
  fire = false;
  fireTaps = 0; // increments on each tap, used by menu/gameover screens

  readonly active: boolean;
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    this.active = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    if (this.active) this.buildUI();
  }

  private buildUI(): void {
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.canvas.style.touchAction = 'none';
    this.canvas.style.flexShrink = '0';

    // Override body for vertical mobile layout
    const body = document.body;
    body.style.flexDirection = 'column';
    body.style.justifyContent = 'flex-start';
    body.style.alignItems = 'center';
    body.style.height = '100dvh';
    body.style.overflow = 'hidden';

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resizeCanvas(), 200));

    // Controls bar
    const bar = document.createElement('div');
    bar.id = 'tc-bar';
    Object.assign(bar.style, {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 18px 12px',
      background: 'rgba(0,0,0,0.92)',
      boxSizing: 'border-box',
      flexShrink: '0',
    });

    // ← → buttons
    const dpad = document.createElement('div');
    Object.assign(dpad.style, { display: 'flex', gap: '12px', alignItems: 'center' });
    dpad.append(
      this.btn('◀', '#00e5ff', () => { this.left = true; }, () => { this.left = false; }),
      this.btn('▶', '#00e5ff', () => { this.right = true; }, () => { this.right = false; }),
    );

    // Pause button
    const pauseBtn = this.btn('⏸', '#ffff00',
      () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true })),
      () => {},
    );
    pauseBtn.style.fontSize = '20px';

    // FIRE button
    const fireBtn = this.btn('FIRE', '#ff3333',
      () => { this.fire = true; this.fireTaps++; },
      () => { this.fire = false; },
      true,
    );

    bar.append(dpad, pauseBtn, fireBtn);
    document.body.append(bar);
  }

  private btn(
    label: string,
    color: string,
    onDown: () => void,
    onUp: () => void,
    big = false,
  ): HTMLButtonElement {
    const b = document.createElement('button');
    b.textContent = label;
    const size = big ? '80px' : '68px';
    Object.assign(b.style, {
      width: size, height: size,
      borderRadius: big ? '50%' : '14px',
      border: `2.5px solid ${color}`,
      background: `${color}1a`,
      color,
      fontSize: big ? '15px' : '26px',
      fontWeight: 'bold',
      fontFamily: 'monospace',
      cursor: 'pointer',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      touchAction: 'manipulation',
      outline: 'none',
      WebkitTapHighlightColor: 'transparent',
      boxShadow: `0 0 10px ${color}44`,
    });

    const dn = (e: Event) => {
      e.preventDefault();
      b.style.background = `${color}44`;
      b.style.boxShadow = `0 0 18px ${color}88`;
      onDown();
    };
    const up = (e: Event) => {
      e.preventDefault();
      b.style.background = `${color}1a`;
      b.style.boxShadow = `0 0 10px ${color}44`;
      onUp();
    };

    b.addEventListener('touchstart', dn, { passive: false });
    b.addEventListener('touchend', up, { passive: false });
    b.addEventListener('touchcancel', up, { passive: false });
    b.addEventListener('mousedown', dn);
    b.addEventListener('mouseup', up);
    b.addEventListener('mouseleave', up);

    return b;
  }

  resizeCanvas(): void {
    if (!this.canvas) return;
    const bar = document.getElementById('tc-bar');
    const barH = bar?.getBoundingClientRect().height ?? 100;
    const availW = window.innerWidth;
    const availH = window.innerHeight - barH;
    const ratio = 900 / 650;
    let w = availW;
    let h = w / ratio;
    if (h > availH) { h = availH; w = h * ratio; }
    this.canvas.style.width = `${Math.floor(w)}px`;
    this.canvas.style.height = `${Math.floor(h)}px`;
  }
}

export const touchControls = new TouchControls();
