# Successional Forest

**▶ [Run it in your browser](https://mte222.github.io/design6197-project1/)**: https://mte222.github.io/design6197-project1/

An emergent animation made for a class on AI, design, and creativity. A grid of cells starts as bare ground with a single patch of grass in the center. Each step, every cell follows a handful of simple rules about spreading, emerging, burning, and recovering. Nothing tells the forest what shape to take, yet distinct patches of grass, shrubs, and trees form, wildfires sweep through, and the land slowly recovers. It's a complex order that emerges from simple rules. An optional crew of firefighters lets you test the "firefighting paradox": putting out every fire lets fuel build up, which can lead to bigger fires later.

## How to run it

Download or clone this repository, then open `index.html` in any web browser. There's nothing to install.

## The rules

The map is a square grid. Every cell is one of: **bare ground, grass/wildflowers, shrub, tree, fire,** or **burned ground**.

**How the grid works**
- "Next to" means the 8 cells touching a cell, including diagonals.
- The edges wrap around: the left edge connects to the right, and the top connects to the bottom, so every cell has exactly 8 neighbors.
- In each step, every cell looks at the map as it was at the start of the step, and then all the changes happen at once.
- If two rules try to change the same cell in the same step, the bigger plant wins: fire beats tree, tree beats shrub, shrub beats grass.
- When a rule says a cell "spreads", the cell picks one random neighbor each step and rolls the dice once for it.

**Grass**
- The map starts with grass in the center cell and bare ground everywhere else.
- Grass has a chance to spread to a neighboring cell, as long as that cell isn't a shrub, tree, fire, or burned ground.
- Shrubs and trees also have a chance to spread grass onto neighboring bare ground. This happens separately from their own spreading.

**Shrubs**
- A shrub can occasionally emerge from a grass cell, but only if no shrub, tree, or fire is next to it.
- A shrub has a chance to spread into a neighboring cell, as long as that cell isn't a tree, fire, bare ground, or burned ground.

**Trees**
- A tree can occasionally emerge from a shrub cell, but only if no tree or fire is next to it.
- A tree has a chance to spread into a neighboring cell, but only if that cell is a shrub.

**Fire**
- A shrub or tree can rarely catch fire on its own. The more shrubs and trees next to it, the more likely it is to ignite, so dense forest burns more easily. Grass never catches fire on its own.
- Each step, a burning cell makes two separate rolls:
  - **Going out:** a chance that the fire goes out.
  - **Spreading:** it picks one neighbor that can burn (grass, shrub, or tree) and has a chance to set it on fire. Grass has its own, separate chance of catching.
- A fire can go out, spread, do both, or do neither in the same step.

**Recovery**
- When a grass fire goes out, the cell goes straight back to bare ground.
- When a shrub or tree fire goes out, the cell becomes burned ground. Nothing can grow on or spread into burned ground.
- Burned ground has a chance each step to turn back into bare ground, and the whole cycle can start again.

**Fuel buildup**
- Every shrub and tree keeps a count of how many steps it has gone without burning. A shrub that grows into a tree keeps its count.
- After enough steps without burning, the cell becomes **heavy fuel**. It still looks and acts like a normal shrub or tree until a fire reaches it.
- Fire burning in heavy fuel is harder to stop: it is less likely to go out.
- Fire spreading from or into heavy fuel is much more likely to catch.
- Only a fire that goes out on its own resets the count. A fire put out by firefighters does not, so the fuel stays heavy.

**Firefighters**
- When the Firefighting button is on, a crew of firefighters (blue squares) enters at random spots on the edge of the map.
- Each firefighter heads for the nearest fire that no other firefighter has claimed, moving faster than fire can spread. When there are no fires, they wander randomly.
- A firefighter puts out every fire in a small square around it. Each cell goes back to what it was before it caught fire (grass, shrub, or tree).
- Firefighters walk on top of the map. They don't replace the cells underneath.

The exact chances and firefighter settings are in `settings.js`.

## Colors

| Color | Meaning |
|---|---|
| Tan | Bare ground |
| Light green | Grass / wildflowers |
| Medium green | Shrub |
| Dark green | Tree |
| Orange-red | Fire |
| Charcoal | Burned ground |
| Blue | Firefighter |

Heavy fuel isn't shown on the map. It only appears in the numbers and the graph.

## Controls

- **Play / Pause:** start or stop the animation.
- **Step:** move forward exactly one step.
- **Reset:** start over from a single grass cell. This also turns firefighting off and clears the graph.
- **Firefighting:** turn the firefighter crew on or off. It's bold with a dark outline when on.
- **Speed:** how many steps per second the animation runs (1 to 30).
- **Step counter:** how many steps have happened since the last reset.
- **Readout (above the map):** what percentage of the map each cell type covers, plus the share that is heavy fuel.
- **Graph (beside the map):** the Tree % (green) and Heavy fuel % (purple) over the whole run since Reset.

## Saved versions

The project has a few earlier versions saved in Git as tags (named bookmarks):

- **`v1-stable`**: the forest before any firefighting. It has the grass, shrub, tree, fire, and recovery rules, with wrap-around edges.
- **`v2-firefighting`**: adds fuel buildup and the first, manual firefighting, where you drag a brush to spray water from a limited tank.
- **`v3-climate`**: adds a Dry / Normal / Wet climate setting that changes how fast fuel builds up, still with manual firefighting.
- **`v4-firefighters`**: replaces the manual brush with the automatic firefighter crew. It still has the climate setting and adds fire-size numbers (number of fires, average size, biggest).

The current version (the `main` branch) is `v4-firefighters` with the climate setting and fire-size numbers removed, prepared for presentation.
