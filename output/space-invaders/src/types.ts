export type ScreenName = 'menu' | 'game' | 'pause' | 'gameover';
export type PowerUpKind = 'rapidfire' | 'doubleshot' | 'shield';

export interface HighScore {
  name: string;
  score: number;
  wave: number;
}
