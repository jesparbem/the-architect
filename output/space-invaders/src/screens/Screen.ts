export interface Screen {
  onEnter(): void;
  onExit?(): void;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}
