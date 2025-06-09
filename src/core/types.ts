export interface Point {
  x: number;
  y: number;
}

export interface Cell extends Point {
  alive: boolean;
  age: number;
  contributionLevel?: number; // 0-5 for Langton's Ant path levels
  color?: string; // Cell color for visualization
}

export interface Grid {
  width: number;
  height: number;
  cells: Cell[][];
}

export interface LangtonsAntOptions {
  width: number;
  height: number;
  generations: number;
  antCount?: number; // Number of ants for simulation
  mode?: 'random' | 'empty' | 'auto' | 'contribution'; // Initialization mode
  contributionData?: ContributionCell[]; // GitHub contribution data for auto mode
  useRealContributionData?: boolean; // Whether we have real GitHub data or should simulate
}

export interface AnimationOptions {
  frameDuration: number;
  generations: number;
  initialDisplayDuration?: number;  // How long to show initial pattern
  showProgressBar?: boolean;        // Show progress bar during animation
}

export interface DrawOptions {
  colorAlive: string;
  colorDead: string;
  colorBorder: string;
  sizeCell: number;
  sizeDot: number;
  sizeDotBorderRadius: number;
  // GitHub contribution level colors (level 0-4)
  contributionColors?: string[];
  dark?: {
    colorAlive: string;
    colorDead: string;
    colorBorder?: string;
    contributionColors?: string[];
  };
}

export interface ContributionCell {
  x: number;
  y: number;
  date: string;
  count: number;
  level: number;
}
