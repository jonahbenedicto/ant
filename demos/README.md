# Demo Files

Example Langton's Ant animations with progress bars and 2-second initial pause.

## Files

- `demo-random.svg` - **Auto mode**: Multiple ants automatically spawned on all brightest green cells from random grid population
- `demo-ant.svg` - **Empty mode**: Single ant starting from the middle of an empty grid

## Demo Modes

### Auto Mode (`demo-random`)
- Populates 25% of the grid with random darker green shades and second-ant color cells
- Uses 3 darker green shades: `#0e4429`, `#006d32`, `#26a641`
- Creates second-ant color cells (`#39d353`) that automatically become primary ants (`#00FF00`)
- Spawns primary ants on all second-ant color cells (variable ant count)
- Shows natural ant behavior with automatic ant generation from second-ant cells

### Empty Mode (`demo-ant`)
- Starts with a completely empty grid
- Places a single ant at the center position
- Clean demonstration of classic Langton's Ant behavior

## Generate

```bash
npm run demo:random   # Auto mode - variable ant count
npm run demo:ant   # Empty mode - single ant
```

## Usage

```markdown
![Single Ant Demo](https://github.com/YOUR_USERNAME/langtons-ant/raw/main/demos/demo-random.svg)
![Single Ant Demo](https://github.com/YOUR_USERNAME/langtons-ant/raw/main/demos/demo-ant.svg)
```
