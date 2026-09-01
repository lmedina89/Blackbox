# BLACKBOX — v0.1.0 First Boot Foundation

A mobile-friendly browser game foundation built with HTML, CSS and vanilla JavaScript.

## Core architecture

- Data-driven missions/content
- Explicit centralized game state
- Event bus for cross-system communication
- Versioned saves with migration hooks
- Simulated hosts/filesystems/network state
- Registered terminal commands instead of a giant switch statement
- Separate desktop, BLACKBOX, systems, UI, content and persistence layers

## First playable loop

1. Create an alias.
2. Explore desktop apps.
3. Read the job email.
4. Browse NightWire and discover ARCHIVES-01.
5. Launch BLACKBOX.
6. Use `scan`.
7. `connect ARCHIVES-01`
8. `cd /archive`
9. `ls`
10. `cat employees.db`
11. Mission completes and pays 250 credits.
12. Return to the desktop and visit ByteBarn for upgrades.

## Run locally

Because this project uses ES modules, run it through a tiny local web server rather than opening `index.html` directly.

Python:
`python -m http.server 8000`

Then open:
`http://localhost:8000`

It is also suitable for GitHub Pages.

## Save model

- SAVE_VERSION: 1
- WORLD_SCHEMA: 1

Browser saves use localStorage. Migration hooks already exist in `js/core/migrations.js`.

## Design rule

Systems contain rules.
Data contains the world.
UI displays state.
Events connect systems.
Saves preserve state.
