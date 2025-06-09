import { LangtonsAnt } from './game-engine';
import { createSvg, createStaticSvg, createShowcaseSvg } from '../renderers/svg-renderer';
import { createGif } from '../renderers/gif-renderer';
import { getPalette } from '../renderers/color-palettes';
import { LangtonsAntOptions, DrawOptions, AnimationOptions, Grid } from './types';
import { getGitHubUserContribution } from '../github/api-client';

export interface GenerateOptions {
  githubToken: string;
  palette?: string;
  colorAlive?: string;
  colorDead?: string;
  colorBorder?: string;
  generations?: number;
  frameDuration?: number;
  pattern?: 'langtons-ant';
  initialDisplayDuration?: number;  // How long to show initial pattern
  showProgressBar?: boolean;        // Show progress bar during animation
  antCount?: number;                // Number of ants for Langton's ant simulation
  langtonsAntMode?: 'random' | 'empty' | 'auto' | 'contribution'; // Mode for Langton's ant initialization
}

export interface OutputConfig {
  filename: string;
  format: 'svg' | 'gif';
  options: GenerateOptions;
}

export interface LangtonsAntResult {
  initialGrid: Grid;
  animationGrids: Grid[];
}

export async function generateSingleLangtonsAnt(
  username: string,
  options: GenerateOptions,
  width: number,
  height: number
): Promise<LangtonsAntResult> {
  // Determine if this is intended to be contribution-based
  const isContributionMode = options.langtonsAntMode === 'contribution' || 
    (options.langtonsAntMode === 'auto' && options.githubToken);
  
  // Fetch GitHub contribution data if token is provided and this is contribution-based
  let contributionData = undefined;
  let useRealContributionData = false;
  
  if (options.githubToken && isContributionMode) {
    try {
      console.log(`📊 Fetching GitHub contribution data for ${username}...`);
      contributionData = await getGitHubUserContribution(username, {
        githubToken: options.githubToken
      });
      console.log(`✅ Retrieved ${contributionData.length} contribution data points`);
      useRealContributionData = true;
    } catch (error) {
      console.warn(`⚠️ Failed to fetch GitHub contribution data: ${error}`);
      console.warn(`   Falling back to simulated contribution pattern`);
    }
  }
  
  // If this is contribution mode but no real data, set flag to simulate contribution pattern
  if (isContributionMode && !contributionData) {
    useRealContributionData = false;
    console.log(`🎨 Generating simulated contribution pattern...`);
  }

  // Configure Langton's Ant simulation
  const gameOptions: LangtonsAntOptions = {
    width,
    height,
    generations: options.generations || 50,
    antCount: options.antCount || 1,
    mode: options.langtonsAntMode || 'auto',
    contributionData, // Pass the contribution data to the game engine
    useRealContributionData // Flag to indicate if we have real data or should simulate
  };

  // Create Langton's Ant instance
  const game = new LangtonsAnt(gameOptions);

  // Get initial grid state
  const initialGrid = JSON.parse(JSON.stringify(game.getGrid()));

  // Simulate Langton's Ant
  const animationGrids = game.simulate();

  return {
    initialGrid,
    animationGrids
  };
}



export async function generateLangtonsAnt(
  username: string,
  outputs: (OutputConfig | null)[],
  baseOptions: GenerateOptions
): Promise<(string | Buffer | undefined)[]> {
  console.log('🐜 Generating Langton\'s Ant animation...');
  
  let width = 53; // Standard GitHub contribution graph width
  let height = 7;  // Standard GitHub contribution graph height
  
  // Generate outputs
  const results: (string | Buffer | undefined)[] = [];
  
  for (let i = 0; i < outputs.length; i++) {
    const output = outputs[i];
    if (!output) {
      results.push(undefined);
      continue;
    }
    
    const options = { ...baseOptions, ...output.options };
    
    // Generate simulation for this specific output
    console.log(`🧬 Running simulation for output ${i + 1} (pattern: ${options.pattern || 'langtons-ant'})...`);
    
    let result: LangtonsAntResult;
    result = await generateSingleLangtonsAnt(username, options, width, height);
    
    const grids = result.animationGrids;
    console.log(`✨ Generated ${grids.length} generations for output ${i + 1}`);
    
    // Get draw options
    let drawOptions = getPalette(options.palette || 'github-dark');
    
    // Override colors if specified
    if (options.colorAlive) drawOptions.colorAlive = options.colorAlive;
    if (options.colorDead) drawOptions.colorDead = options.colorDead;
    if (options.colorBorder) drawOptions.colorBorder = options.colorBorder;
    
    const animationOptions: AnimationOptions = {
      frameDuration: options.frameDuration || 100,
      generations: grids.length,
      initialDisplayDuration: options.initialDisplayDuration,
      showProgressBar: options.showProgressBar
    };
    
    try {
      switch (output.format) {
        case 'svg':
          console.log(`🎨 Creating SVG (output ${i + 1})...`);
          // Use enhanced SVG with initial display timing if specified
          const useEnhancedTiming = options.initialDisplayDuration;
          const svg = useEnhancedTiming 
            ? createShowcaseSvg(grids, drawOptions, animationOptions)
            : createSvg(grids, drawOptions, animationOptions);
          results.push(svg);
          break;
          
        case 'gif':
          console.log(`🎬 Creating GIF (output ${i + 1})...`);
          const gif = await createGif(grids, drawOptions, animationOptions);
          results.push(gif);
          break;
          
        default:
          console.warn(`⚠️ Unknown format: ${output.format}`);
          results.push(undefined);
      }
    } catch (error) {
      console.error(`❌ Error creating ${output.format}:`, error);
      results.push(undefined);
    }
  }
  
  return results;
}
