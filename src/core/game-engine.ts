import { Grid, Cell, LangtonsAntOptions, Point } from './types';

export class LangtonsAnt {
  private grid: Grid;
  private options: LangtonsAntOptions;
  private generation: number = 0;

  private ants: Array<{ position: Point; direction: number; color: string }> = [];

  constructor(options: LangtonsAntOptions) {
    this.options = options;
    this.grid = this.createEmptyGrid();
    // Initialize ants based on mode
    this.initializeAnts();
  }

  private initializeAnts(): void {
    const antCount = this.options.antCount || 1;
    
    switch (this.options.mode) {
      case 'random':
        this.initializeLangtonsAntWithRandomGrid(antCount);
        break;
      case 'empty':
        this.initializeLangtonsAntEmptyGrid(antCount);
        break;
      case 'contribution':
        // Contribution mode: use GitHub contribution data if available, otherwise simulate contribution pattern
        if (this.options.contributionData && this.options.contributionData.length > 0) {
          this.initializeLangtonsAntWithContributionData(antCount);
        } else {
          // Simulate a contribution-like pattern when no real data available
          this.initializeLangtonsAntWithSimulatedContribution(antCount);
        }
        break;
      case 'auto':
      default:
        // Auto mode: use GitHub contribution data if available, otherwise use random grid
        if (this.options.contributionData && this.options.contributionData.length > 0) {
          this.initializeLangtonsAntWithContributionData(antCount);
        } else {
          // Fallback to random grid when no contribution data available
          this.initializeLangtonsAntWithRandomGrid(-1); // -1 means use ALL brightest cells as ants
        }
        break;
    }
  }

  private createEmptyGrid(): Grid {
    const cells: Cell[][] = [];
    for (let x = 0; x < this.options.width; x++) {
      cells[x] = [];
      for (let y = 0; y < this.options.height; y++) {
        cells[x][y] = {
          x,
          y,
          alive: false,
          age: 0,
          contributionLevel: 0
        };
      }
    }
    return {
      width: this.options.width,
      height: this.options.height,
      cells
    };
  }







  public getGrid(): Grid {
    return this.grid;
  }

  public getGeneration(): number {
    return this.generation;
  }

  public isExtinct(): boolean {
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        if (this.grid.cells[x][y].alive) {
          return false;
        }
      }
    }
    return true;
  }

  public getCellsAsPoints(): Point[] {
    const points: Point[] = [];
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        if (this.grid.cells[x][y].alive) {
          points.push({ x, y });
        }
      }
    }
    return points;
  }

  public simulate(generations?: number): Grid[] {
    return this.simulateLangtonsAnt();
  }



  public initializeLangtonsAntWithRandomGrid(requestedAntCount: number = 1): number {
    // Clear existing ants
    this.ants = [];

    // Define the brightest green for ants and darker shades for paths
    const antColor = '#00FF00'; // Brightest green for ants
    const secondAntColor = '#39d353'; // Second brightest - also treated as ants
    const darkerGreenShades = ['#0e4429', '#006d32', '#26a641']; // Darker green shades (removed #39d353)
    
    // Initialize the entire grid as empty first
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        this.grid.cells[x][y].alive = false;
        this.grid.cells[x][y].age = 0;
        this.grid.cells[x][y].contributionLevel = 0;
        this.grid.cells[x][y].color = '#161b22'; // Default dark background
      }
    }

    // Populate a percentage of the grid with random darker green shades and second ant color
    const populationDensity = 0.25; // 25% of grid will have colored cells
    const secondAntCells: Array<{x: number, y: number}> = [];
    
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        if (Math.random() < populationDensity) {
          // 80% chance for darker green shades, 20% chance for second ant color
          if (Math.random() < 0.8) {
            const randomShade = darkerGreenShades[Math.floor(Math.random() * darkerGreenShades.length)];
            this.grid.cells[x][y].alive = true;
            this.grid.cells[x][y].contributionLevel = darkerGreenShades.indexOf(randomShade) + 1;
            this.grid.cells[x][y].color = randomShade;
          } else {
            // Place second ant color cells
            this.grid.cells[x][y].alive = true;
            this.grid.cells[x][y].contributionLevel = 4; // Second ant level
            this.grid.cells[x][y].color = secondAntColor;
            secondAntCells.push({x, y});
          }
        }
      }
    }

    // For auto mode, if requestedAntCount is -1, use ALL second ant color cells as primary ants
    const finalAntCount = requestedAntCount === -1 ? secondAntCells.length : requestedAntCount;

    // If we don't have enough second ant color cells and we need a specific count, add more
    if (requestedAntCount !== -1) {
      while (secondAntCells.length < finalAntCount && secondAntCells.length < this.grid.width * this.grid.height) {
        const x = Math.floor(Math.random() * this.grid.width);
        const y = Math.floor(Math.random() * this.grid.height);
        
        // Only add if not already second ant color and not already in the list
        if (this.grid.cells[x][y].color !== secondAntColor && 
            !secondAntCells.some(cell => cell.x === x && cell.y === y)) {
          this.grid.cells[x][y].alive = true;
          this.grid.cells[x][y].contributionLevel = 4; // Second ant level
          this.grid.cells[x][y].color = secondAntColor;
          secondAntCells.push({x, y});
        }
      }
    }

    // Place primary ants on all available second ant color cells (or up to the requested count)
    const antsToPlace = requestedAntCount === -1 ? secondAntCells.length : Math.min(finalAntCount, secondAntCells.length);
    const shuffledSecondAntCells = secondAntCells.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < antsToPlace; i++) {
      const cell = shuffledSecondAntCells[i];
      
      // Create the ant
      const ant = {
        position: { x: cell.x, y: cell.y },
        direction: Math.floor(Math.random() * 4), // Random initial direction (0-3)
        color: antColor
      };
      
      this.ants.push(ant);

      // Set the ant's position on the grid (upgrade to brightest green)
      this.grid.cells[cell.x][cell.y].alive = true;
      this.grid.cells[cell.x][cell.y].contributionLevel = 5; // Brightest level for ants
      this.grid.cells[cell.x][cell.y].color = antColor;
    }
    
    // If we still don't have enough spots for all ants (only when specific count requested), place remaining ants randomly
    if (requestedAntCount !== -1) {
      for (let i = this.ants.length; i < finalAntCount; i++) {
        let antX: number, antY: number;
        let validPosition = false;
        
        // Find a position that doesn't conflict with other ants
        do {
          antX = Math.floor(Math.random() * this.grid.width);
          antY = Math.floor(Math.random() * this.grid.height);
          validPosition = !this.ants.some(ant => ant.position.x === antX && ant.position.y === antY);
        } while (!validPosition);

        // Create the ant
        const ant = {
          position: { x: antX, y: antY },
          direction: Math.floor(Math.random() * 4), // Random initial direction
          color: antColor
        };
        
        this.ants.push(ant);

        // Set the ant's initial position on the grid
        this.grid.cells[antX][antY].alive = true;
        this.grid.cells[antX][antY].contributionLevel = 5; // Brightest level
        this.grid.cells[antX][antY].color = antColor;
      }
    }

    return this.ants.length; // Return actual number of ants created
  }

  public initializeLangtonsAntEmptyGrid(antCount: number = 1): void {
    // Clear existing ants
    this.ants = [];

    // Define the brightest green for ants
    const antColor = '#00FF00'; // Brightest green for ants
    
    // Initialize the entire grid as completely empty
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        this.grid.cells[x][y].alive = false;
        this.grid.cells[x][y].age = 0;
        this.grid.cells[x][y].contributionLevel = 0; // Completely empty
        this.grid.cells[x][y].color = '#161b22'; // Default dark background
      }
    }

    // Place ants starting from the center of the grid
    const centerX = Math.floor(this.grid.width / 2);
    const centerY = Math.floor(this.grid.height / 2);
    
    for (let i = 0; i < antCount; i++) {
      let antX: number, antY: number;
      
      if (i === 0) {
        // First ant always starts at the center
        antX = centerX;
        antY = centerY;
      } else {
        // Additional ants (if any) placed at random positions that don't conflict
        let validPosition = false;
        do {
          antX = Math.floor(Math.random() * this.grid.width);
          antY = Math.floor(Math.random() * this.grid.height);
          validPosition = !this.ants.some(ant => ant.position.x === antX && ant.position.y === antY);
        } while (!validPosition);
      }

      // Create the ant
      const ant = {
        position: { x: antX, y: antY },
        direction: Math.floor(Math.random() * 4), // Random initial direction
        color: antColor
      };
      
      this.ants.push(ant);

      // Set the ant's initial position on the grid - but keep contributionLevel at 0
      // This means when the ant moves, this cell will return to completely empty
      this.grid.cells[antX][antY].alive = true;
      this.grid.cells[antX][antY].contributionLevel = 0; // Keep as empty so it returns to black when ant moves
      this.grid.cells[antX][antY].color = antColor;
    }
  }

  public simulateLangtonsAnt(): Grid[] {
    const grids: Grid[] = [];

    // Capture the initial state with ants in their starting positions
    grids.push(JSON.parse(JSON.stringify(this.grid)));

    for (let gen = 0; gen < this.options.generations; gen++) {
      // First, clear all ant positions from the grid to reveal underlying cell states
      for (const ant of this.ants) {
        const cell = this.grid.cells[ant.position.x][ant.position.y];
        // If this cell only contains an ant (brightest green), restore it to proper state
        if (cell.color === ant.color) {
          // Check if this position had a previous state stored or should be empty
          const hasUnderlyingState = (cell.contributionLevel || 0) > 0 && (cell.contributionLevel || 0) < 5;
          if (hasUnderlyingState) {
            // Restore to underlying colored state
            if ((cell.contributionLevel || 0) === 4) {
              // Restore second ant color
              cell.color = '#39d353';
            } else {
              // Restore regular darker green shade
              const darkerGreenShades = ['#0e4429', '#006d32', '#26a641'];
              cell.color = darkerGreenShades[(cell.contributionLevel || 1) - 1] || darkerGreenShades[0];
            }
            cell.alive = true;
          } else {
            // Restore to empty black
            cell.color = '#161b22';
            cell.alive = false;
            cell.contributionLevel = 0;
          }
        }
      }

      // Convert any #39d353 cells to primary ants
      for (let x = 0; x < this.grid.width; x++) {
        for (let y = 0; y < this.grid.height; y++) {
          const cell = this.grid.cells[x][y];
          if (cell.color === '#39d353') {
            // Convert to primary ant
            cell.color = '#00FF00';
            cell.contributionLevel = 5;
            
            // Add as ant if not already tracked
            const existingAnt = this.ants.find(ant => ant.position.x === x && ant.position.y === y);
            if (!existingAnt) {
              this.ants.push({
                position: { x, y },
                direction: Math.floor(Math.random() * 4),
                color: '#00FF00'
              });
            }
          }
        }
      }

      // Process each ant sequentially
      for (const ant of this.ants) {
        const { x, y } = ant.position;
        const cell = this.grid.cells[x][y];

        // Determine the actual state of the cell (ignoring ant presence)
        const isEmptyBlackCell = !cell.color || cell.color === '#161b22';
        const isSecondAntCell = cell.color === '#39d353';
        const isCellColored = !isEmptyBlackCell;

        // Store the underlying state before ant arrives
        let underlyingState = 0; // 0 = empty, 1-3 = colored levels, 4 = second ant color
        if (isCellColored) {
          if (isSecondAntCell) {
            underlyingState = 4; // Second ant color level
          } else {
            const darkerGreenShades = ['#0e4429', '#006d32', '#26a641'];
            underlyingState = darkerGreenShades.indexOf(cell.color as string) + 1;
            if (underlyingState === 0) underlyingState = 1; // fallback
          }
        }

        // Langton's Ant rules:
        // If on colored square: turn clockwise (right), flip to empty black
        // If on empty black square: turn counterclockwise (left), flip to colored
        if (isCellColored) {
          // Turn clockwise (right) on colored cell
          ant.direction = (ant.direction + 1) % 4;
          // Flip to empty black - no underlying state
          cell.alive = false;
          cell.color = '#161b22';
          cell.contributionLevel = 0;
        } else {
          // Turn counterclockwise (left) on empty black cell
          ant.direction = (ant.direction + 3) % 4; // +3 is equivalent to -1 (counterclockwise)
          // Flip to colored - store underlying state
          const darkerGreenShades = ['#0e4429', '#006d32', '#26a641'];
          const randomShade = darkerGreenShades[Math.floor(Math.random() * darkerGreenShades.length)];
          cell.alive = true;
          cell.color = randomShade;
          cell.contributionLevel = darkerGreenShades.indexOf(randomShade) + 1;
        }

        // Move the ant forward in its current direction
        switch (ant.direction) {
          case 0: ant.position.y = (y - 1 + this.grid.height) % this.grid.height; break; // Up
          case 1: ant.position.x = (x + 1) % this.grid.width; break; // Right
          case 2: ant.position.y = (y + 1) % this.grid.height; break; // Down
          case 3: ant.position.x = (x - 1 + this.grid.width) % this.grid.width; break; // Left
        }
      }

      // After all ants have moved, place them on the grid
      for (const ant of this.ants) {
        const newCell = this.grid.cells[ant.position.x][ant.position.y];
        // Store underlying state if the cell was colored
        if (newCell.color !== '#161b22' && newCell.color !== ant.color) {
          // This cell has an underlying color that we need to preserve
          if (newCell.color === '#39d353') {
            // Second ant color - store as level 4
            newCell.contributionLevel = 4;
          } else {
            const darkerGreenShades = ['#0e4429', '#006d32', '#26a641'];
            const colorIndex = darkerGreenShades.indexOf(newCell.color as string);
            if (colorIndex !== -1) {
              newCell.contributionLevel = colorIndex + 1; // Store underlying state
            }
          }
        }
        // Place ant (brightest green) on top
        newCell.alive = true;
        newCell.color = ant.color;
        // For empty mode, keep contributionLevel as 0 for cells that were originally empty
        // For other modes, set to 5 only if no underlying state exists
        if ((newCell.contributionLevel || 0) === 0) {
          // Keep contributionLevel as 0 - this means when ant moves, cell returns to empty black
          // This is correct behavior for both empty mode and newly created trail cells
        }
      }

      grids.push(JSON.parse(JSON.stringify(this.grid)));
    }

    return grids;
  }

  public initializeLangtonsAntWithContributionData(requestedAntCount: number = 1): number {
    // Clear existing ants
    this.ants = [];

    console.log(`📊 Initializing grid with real GitHub contribution data...`);

    const contributionData = this.options.contributionData!;
    const antColor = '#00FF00'; // Brightest green for ants

    // Initialize the entire grid as empty first
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        this.grid.cells[x][y].alive = false;
        this.grid.cells[x][y].age = 0;
        this.grid.cells[x][y].contributionLevel = 0;
        this.grid.cells[x][y].color = '#161b22'; // Default dark background
      }
    }

    // Map GitHub contribution levels to colors
    const contributionColors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
    const highestLevel = Math.max(...contributionData.map(c => c.level));
    const brightestCells: Array<{x: number, y: number}> = [];

    // Apply contribution data to grid
    for (const contribution of contributionData) {
      const { x, y, level } = contribution;
      
      // Ensure coordinates are within grid bounds
      if (x >= 0 && x < this.grid.width && y >= 0 && y < this.grid.height) {
        const cell = this.grid.cells[x][y];
        
        if (level > 0) {
          cell.alive = true;
          cell.contributionLevel = Math.min(level, 4); // Cap at level 4
          cell.color = contributionColors[Math.min(level, 4)];
          
          // Track cells with highest contribution level for ant placement
          if (level === highestLevel && level > 0) {
            brightestCells.push({x, y});
          }
        }
      }
    }

    console.log(`✅ Applied ${contributionData.length} contribution data points`);
    console.log(`🎯 Found ${brightestCells.length} cells with highest contribution level (${highestLevel})`);

    // Place ants on brightest cells
    const finalAntCount = requestedAntCount === -1 ? brightestCells.length : requestedAntCount;
    const antsToPlace = Math.min(finalAntCount, brightestCells.length);
    const shuffledBrightestCells = brightestCells.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < antsToPlace; i++) {
      const cell = shuffledBrightestCells[i];
      
      // Create the ant
      const ant = {
        position: { x: cell.x, y: cell.y },
        direction: Math.floor(Math.random() * 4), // Random initial direction (0-3)
        color: antColor
      };
      
      this.ants.push(ant);

      // Set the ant's position on the grid (upgrade to brightest green)
      this.grid.cells[cell.x][cell.y].alive = true;
      this.grid.cells[cell.x][cell.y].contributionLevel = 5; // Brightest level for ants
      this.grid.cells[cell.x][cell.y].color = antColor;
    }
    
    // If we still don't have enough ants and specific count was requested, place remaining randomly
    if (requestedAntCount !== -1 && this.ants.length < finalAntCount) {
      for (let i = this.ants.length; i < finalAntCount; i++) {
        let antX: number, antY: number;
        let validPosition = false;
        
        // Find a position that doesn't conflict with other ants
        do {
          antX = Math.floor(Math.random() * this.grid.width);
          antY = Math.floor(Math.random() * this.grid.height);
          validPosition = !this.ants.some(ant => ant.position.x === antX && ant.position.y === antY);
        } while (!validPosition);

        // Create the ant
        const ant = {
          position: { x: antX, y: antY },
          direction: Math.floor(Math.random() * 4), // Random initial direction
          color: antColor
        };
        
        this.ants.push(ant);

        // Set the ant's initial position on the grid
        this.grid.cells[antX][antY].alive = true;
        this.grid.cells[antX][antY].contributionLevel = 5; // Brightest level
        this.grid.cells[antX][antY].color = antColor;
      }
    }

    console.log(`🐜 Placed ${this.ants.length} ants on the grid`);
    return this.ants.length; // Return actual number of ants created
  }

  public initializeLangtonsAntWithSimulatedContribution(requestedAntCount: number = 1): number {
    // Clear existing ants
    this.ants = [];

    console.log(`🎨 Initializing grid with simulated contribution pattern...`);

    const antColor = '#00FF00'; // Brightest green for ants

    // Initialize the entire grid as empty first
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        this.grid.cells[x][y].alive = false;
        this.grid.cells[x][y].age = 0;
        this.grid.cells[x][y].contributionLevel = 0;
        this.grid.cells[x][y].color = '#161b22'; // Default dark background
      }
    }

    // Create a realistic contribution-like pattern
    const contributionColors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
    const brightestCells: Array<{x: number, y: number}> = [];

    // Simulate a more realistic GitHub contribution pattern
    // GitHub contribution graphs typically have:
    // - More activity in recent weeks
    // - Some sparse activity throughout
    // - Occasional streaks of higher activity
    
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        let level = 0;
        
        // Create contribution-like pattern with some randomness
        const baseActivity = Math.random();
        
        // Recent weeks (right side) have higher activity
        const recencyBonus = (x / this.grid.width) * 0.3;
        
        // Weekdays vs weekends pattern (middle weekdays more active)
        const weekdayBonus = y >= 1 && y <= 5 ? 0.2 : 0;
        
        // Create some streaks
        const streakBonus = Math.sin(x * 0.5) > 0.5 ? 0.3 : 0;
        
        const totalActivity = baseActivity + recencyBonus + weekdayBonus + streakBonus;
        
        if (totalActivity > 0.8) {
          level = 4; // Highest activity
          brightestCells.push({x, y});
        } else if (totalActivity > 0.6) {
          level = 3;
        } else if (totalActivity > 0.4) {
          level = 2;
        } else if (totalActivity > 0.25) {
          level = 1;
        }
        
        if (level > 0) {
          const cell = this.grid.cells[x][y];
          cell.alive = true;
          cell.contributionLevel = level;
          cell.color = contributionColors[level];
        }
      }
    }

    console.log(`✅ Created simulated contribution pattern with ${brightestCells.length} high-activity cells`);

    // Place ants on brightest cells
    const finalAntCount = requestedAntCount === -1 ? brightestCells.length : requestedAntCount;
    const antsToPlace = Math.min(finalAntCount, brightestCells.length);
    const shuffledBrightestCells = brightestCells.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < antsToPlace; i++) {
      const cell = shuffledBrightestCells[i];
      
      // Create the ant
      const ant = {
        position: { x: cell.x, y: cell.y },
        direction: Math.floor(Math.random() * 4), // Random initial direction (0-3)
        color: antColor
      };
      
      this.ants.push(ant);

      // Set the ant's position on the grid (upgrade to brightest green)
      this.grid.cells[cell.x][cell.y].alive = true;
      this.grid.cells[cell.x][cell.y].contributionLevel = 5; // Brightest level for ants
      this.grid.cells[cell.x][cell.y].color = antColor;
    }
    
    // If we still don't have enough ants and specific count was requested, place remaining randomly
    if (requestedAntCount !== -1 && this.ants.length < finalAntCount) {
      for (let i = this.ants.length; i < finalAntCount; i++) {
        let antX: number, antY: number;
        let validPosition = false;
        
        // Find a position that doesn't conflict with other ants
        do {
          antX = Math.floor(Math.random() * this.grid.width);
          antY = Math.floor(Math.random() * this.grid.height);
          validPosition = !this.ants.some(ant => ant.position.x === antX && ant.position.y === antY);
        } while (!validPosition);

        // Create the ant
        const ant = {
          position: { x: antX, y: antY },
          direction: Math.floor(Math.random() * 4), // Random initial direction
          color: antColor
        };
        
        this.ants.push(ant);

        // Set the ant's initial position on the grid
        this.grid.cells[antX][antY].alive = true;
        this.grid.cells[antX][antY].contributionLevel = 5; // Brightest level
        this.grid.cells[antX][antY].color = antColor;
      }
    }

    console.log(`🐜 Placed ${this.ants.length} ants on the simulated contribution grid`);
    return this.ants.length; // Return actual number of ants created
  }
}
