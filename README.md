# ant
Generates Langton's Ant simulations from a GitHub user's contributions and outputs a screen capture as an animated SVG.

![Langton's Ant Animation](./demos/demo-random.svg)

## Quick Start with GitHub Actions

### 1. Fork This Repository
Fork this repository to your GitHub account to get your own copy.

### 2. Enable Repository Permissions
1. Go to your forked repository's **Settings** → **Actions** → **General**
2. Under "Workflow permissions", select **"Read and write permissions"**
3. Check **"Allow GitHub Actions to create and approve pull requests"**
4. Click **Save**

### 3. Enable Actions
1. Go to the **Actions** tab in your forked repository
2. Click **"I understand my workflows, go ahead and enable them"**

### 4. Generate Animations
The workflow will automatically run daily, or you can trigger it manually:

1. Go to **Actions** → **Generate Langton's Ant Animations**
2. Click **"Run workflow"**
3. Choose your options:
   - **Asset Type**:
     - `contribution` - Animation based on your GitHub contribution graph (default)
     - `random` - Demo with random grid and auto-spawned ants
     - `ant` - Demo with two ants on an empty grid
     - `all` - Generate all three asset types in one run
   - **Number of generations**: How many steps the simulation runs (default: 60)
   - **Animation speed**: Milliseconds per frame (default: 800ms)
   - **Initial display time**: Time to show pattern before animation starts (default: 3000ms)
   - **Show progress bar**: Whether to display a progress bar below the animation (default: true)
4. Click **"Run workflow"**

Generated animations will appear in the `assets/` folder and can be used in your README:

```markdown
![Langton's Ant](https://github.com/YOUR_USERNAME/langtons-ant/raw/main/assets/langtons-ant-contribution.svg)
```

### 5. Available Asset Types

- **`contribution`**: Uses your GitHub contribution data to create a unique Langton's Ant pattern. When no GitHub token is available, generates a realistic simulated contribution pattern with activity patterns similar to GitHub's contribution graph.
- **`random`**: Generates a demo with a random starting grid and automatic ant spawning  
- **`ant`**: Creates a clean demo with exactly two ants on an empty grid
- **`all`**: Generates all three asset types in one workflow run for a complete set

> **Want more customization?** Use the CLI directly for full control over all parameters!

## CLI Usage

For local development or custom usage:

```bash
# Install and build
npm install && npm run build

# Set up GitHub token (required for real contribution data)
# Create .env file with:
# GITHUB_TOKEN=your_github_token_here
# GITHUB_USERNAME=your_github_username

# Generate with real GitHub contribution data
node dist/cli/command-line.js -u YOUR_USERNAME -o contribution.svg --pattern langtons-ant --langtons-ant-mode contribution

# Generate single ant animation (auto mode - uses contribution data if token available)
node dist/cli/command-line.js -u YOUR_USERNAME -o langtons-ant.svg --pattern langtons-ant

# Generate two ant animation
node dist/cli/command-line.js -u YOUR_USERNAME -o two-ants.svg --pattern langtons-ant --ant-count 2
```

### Getting a GitHub Token

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Select scope: **`read:user`**
4. Copy the token and add to your `.env` file

## Usage Options

**Required:**
- `-u, --username` - GitHub username
- `-o, --output` - Output file (.svg or .gif)

**Optional:**
- `--pattern` - Pattern type: `langtons-ant` (default)
- `--ant-count` - Number of ants for Langton's Ant simulation (default: 1)
- `--langtons-ant-mode` - Ant initialization mode: `random`, `empty`, `auto`, `contribution` (default: random)
  - `random`: Spawn ants on random positions
  - `empty`: Spawn ants on empty grid
  - `auto`: Use GitHub contribution data with auto-spawned ants
  - `contribution`: Use real GitHub contribution data or simulate realistic contribution patterns
- `--generations` - Number of generations (default: 50)
- `--frame-duration` - Animation speed in ms (default: 100)
- `--github-token` - GitHub token for contribution data
- `--initial-display-duration` - Time to show initial pattern (ms)
- `--show-progress-bar` - Add progress bar below animation
- `--no-cleanup` - Skip cleaning assets folder (useful for batch operations)

## Features

- **Multiple Ants**: Support for 1 or more ants running simultaneously
- **Random Initial States**: Each ant starts at a random position
- **Beautiful Visualizations**: Brightest green (`#00FF00`) for ants, 3 darker green shades for paths
- **Automatic Ant Generation**: Second-ant color cells (`#39d353`) automatically become primary ants
- **Custom Colors**: Each cell gets a random darker green shade for visual variety
- **Fast Animations**: Optimized SVG and GIF generation
- **GitHub Integration**: Contribution mode uses real GitHub data when available, with intelligent fallback to simulated contribution patterns
- **Batch Operations**: `--no-cleanup` flag allows generating multiple assets without file conflicts
