import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { generateLangtonsAnt, generateSingleLangtonsAnt, OutputConfig, GenerateOptions } from '../core/pattern-generator';
import { createStaticSvg } from '../renderers/svg-renderer';
import { getPalette } from '../renderers/color-palettes';

interface ParsedOutput {
  filename: string;
  format: 'svg' | 'gif';
  generations?: number;
  frameDuration?: number;
  pattern?: string;
  initialDisplayDuration?: number;
  showProgressBar?: boolean;
}

function parseOutputEntry(entry: string): ParsedOutput | null {
  const match = entry.trim().match(/^(.+\.(svg|gif))(\?(.*))?$/);
  
  if (!match) return null;
  
  const [, filename, format, , queryString] = match;
  const params = new URLSearchParams(queryString || '');
  
  return {
    filename,
    format: format as 'svg' | 'gif',
    generations: params.get('generations') ? parseInt(params.get('generations')!) : undefined,
    frameDuration: params.get('frame-duration') || params.get('frame_duration') || params.get('delay') ? parseInt(params.get('frame-duration') || params.get('frame_duration') || params.get('delay')!) : undefined,
    pattern: params.get('pattern') || undefined,
    initialDisplayDuration: params.get('initial-display-duration') || params.get('initial_display_duration') ? parseInt(params.get('initial-display-duration') || params.get('initial_display_duration')!) : undefined,
    showProgressBar: params.get('show-progress-bar') === 'true' || params.get('show_progress_bar') === 'true'
  };
}

function parseOutputs(lines: string[]): ParsedOutput[] {
  return lines
    .map(line => parseOutputEntry(line))
    .filter((entry): entry is ParsedOutput => entry !== null);
}

async function generateInitialStateImages(
  username: string, 
  outputConfigs: (OutputConfig | null)[], 
  baseOptions: GenerateOptions
): Promise<void> {
  console.log('🌱 Generating initial state images...');
  
  for (let i = 0; i < outputConfigs.length; i++) {
    const config = outputConfigs[i];
    if (!config) continue;
    
    try {
      let width = 53; // Standard GitHub contribution graph width
      let height = 7;  // Standard GitHub contribution graph height
      
      const result = await generateSingleLangtonsAnt(username, config.options, width, height);
      const initialGrid = result.initialGrid;
      
      // Get draw options
      let drawOptions = getPalette(config.options.palette || 'github-dark');
      if (config.options.colorAlive) drawOptions.colorAlive = config.options.colorAlive;
      if (config.options.colorDead) drawOptions.colorDead = config.options.colorDead;
      if (config.options.colorBorder) drawOptions.colorBorder = config.options.colorBorder;
      
      // Create initial state SVG
      const initialStateSvg = createStaticSvg(initialGrid, drawOptions);
      
      // Generate filename for initial state
      const ext = path.extname(config.filename);
      const baseName = config.filename.slice(0, -ext.length);
      const initialStateFilename = `${baseName}-initial${ext}`;
      
      // Ensure directory exists
      const dir = path.dirname(initialStateFilename);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write initial state file
      fs.writeFileSync(initialStateFilename, initialStateSvg, 'utf8');
      console.log(`✅ Created initial state: ${initialStateFilename}`);
      
    } catch (error) {
      console.error(`❌ Error creating initial state for ${config.filename}:`, error);
    }
  }
}

async function main(): Promise<void> {
  try {
    // Get inputs - GitHub Actions converts hyphens to underscores
    const username = core.getInput('github-user-name') || core.getInput('github_user_name') || process.env.GITHUB_REPOSITORY_OWNER;
    const outputLines = core.getMultilineInput('outputs');
    const githubToken = process.env.GITHUB_TOKEN || core.getInput('github-token') || core.getInput('github_token');
    
    console.log(`🔑 GitHub token available: ${githubToken ? 'Yes' : 'No'}`);
    if (githubToken) {
      console.log(`🔑 Token length: ${githubToken.length} characters`);
      console.log(`🔑 Token starts with: ${githubToken.substring(0, 7)}...`);
    }
    
    // Fallback: extract username from repository if not provided
    let finalUsername = username;
    if (!finalUsername && process.env.GITHUB_REPOSITORY) {
      finalUsername = process.env.GITHUB_REPOSITORY.split('/')[0];
    }
    
    if (!finalUsername) {
      throw new Error('github-user-name is required. Please provide a GitHub username or ensure GITHUB_REPOSITORY_OWNER is available.');
    }
    
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable or github-token input is required');
    }
    
    // Parse outputs with fallback
    let parsedOutputs = parseOutputs(outputLines);
    
    // Fallback: if no outputs specified, use default outputs
    if (parsedOutputs.length === 0) {
      console.log('⚠️  No outputs specified, using default outputs');
      const defaultOutputs = [
        'assets/langtons-ant-single.svg?pattern=langtons-ant&generations=60&frame-duration=400',
        'assets/langtons-ant-multi.svg?pattern=langtons-ant&generations=50&frame-duration=400&ant-count=3',
        'assets/langtons-ant-showcase.svg?pattern=langtons-ant&generations=80&frame-duration=400&ant-count=5'
      ];
      parsedOutputs = parseOutputs(defaultOutputs);
    }
    
    if (parsedOutputs.length === 0) {
      throw new Error('Failed to parse any valid outputs');
    }
    
    console.log(`🐜 Generating Langton's Ant for user: ${finalUsername}`);
    console.log(`📁 Outputs: ${parsedOutputs.map(o => o.filename).join(', ')}`);
    
    // Convert to output configs
    const outputConfigs: (OutputConfig | null)[] = parsedOutputs.map(output => ({
      filename: output.filename,
      format: output.format,
      options: {
        githubToken,
        generations: output.generations,
        frameDuration: output.frameDuration,
        pattern: output.pattern as any,
        initialDisplayDuration: output.initialDisplayDuration,
        showProgressBar: output.showProgressBar
      }
    }));
    
    // Base options
    const baseOptions: GenerateOptions = {
      githubToken,
      pattern: 'langtons-ant'
    };
    
    // Generate outputs
    const results = await generateLangtonsAnt(finalUsername, outputConfigs, baseOptions);
    
    // Generate initial state images
    await generateInitialStateImages(finalUsername, outputConfigs, baseOptions);
    
    // Write files
    for (let i = 0; i < outputConfigs.length; i++) {
      const config = outputConfigs[i];
      const result = results[i];
      
      if (config && result) {
        console.log(`💾 Writing ${config.filename}`);
        
        // Ensure directory exists
        const dir = path.dirname(config.filename);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write file
        if (typeof result === 'string') {
          fs.writeFileSync(config.filename, result, 'utf8');
        } else {
          fs.writeFileSync(config.filename, result);
        }
        
        console.log(`✅ Created ${config.filename}`);
      }
    }
    
    console.log('🎉 All outputs generated successfully!');
    
  } catch (error: any) {
    console.error('❌ Action failed:', error.message);
    core.setFailed(error.message);
  }
}

if (require.main === module) {
  main();
}
