
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface PlayerState {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  xp: number;
  level: number;
  currentChapterId: number;
  inventory: string[];
  unlockedChapters: number[];
  completedChapters: number[];
}

export interface Reward {
  xp: number;
  mana?: number;
  hp?: number;
  item?: string;
}

export interface Chapter {
  id: number;
  title: string;
  difficulty: Difficulty;
  story: string;
  task: string;
  hint: string;
  starterCode: string;
  visual: string;
  tokens: string[];
  reward: Reward;
  validate: (code: string, output: string) => boolean;
}

export interface ExecutionResult {
  output: string;
  success: boolean;
  error?: string;
}

export type Page = 'home' | 'game' | 'about' | 'privacy' | 'terms' | 'docs' | 'contact';
