# IT team atlas

- File: `team-atlas.png`, 1254 × 1254 RGBA, transparent background.
- Generated with the built-in OpenAI image generation tool during TeamWorld development (September 2026), at the user's request for IT-themed characters.
- Original generated PNG copied without raster editing. Rendering uses measured frame crops in `src/game/it-avatar.ts`.
- Four fictional character concepts: developer, designer, engineer, product planner. NPC variations are fictional game avatars, not portraits of named real mentors.
- This image is not part of the Pixel Frog / Tiny Swords CC0 asset set. No third-party logo or photographic mentor likeness was used.
- Prompt requested 1024 × 1024; actual tool output was 1254 × 1254. Runtime metadata uses actual dimensions.

## Generation prompt

Use case: stylized-concept. Asset type: production-ready transparent pixel-art animation sprite atlas for a cozy top-down web RPG.
Create ONE square 1024x1024 PNG sprite sheet with genuinely TRANSPARENT alpha background. EXACT grid: 4 columns x 4 rows, each cell 256x256. NO grid lines, NO labels, NO text, NO background scene, NO floor shadows.
Each row is one consistent cute adult IT team adventurer, squat chibi proportions, dark pixel outline, limited rich earthy palette, chunky crisp pixel clusters comparable to 48px game sprites scaled up nearest-neighbor. Three-quarter view facing down-right in EVERY cell.
Row 1: developer with dark short hair, forest green hoodie, chunky headphones, small closed laptop tucked under one arm.
Row 2: designer with brown bob hair, purple beret and purple jacket, drawing tablet and stylus.
Row 3: engineer with warm dark skin, curly hair, orange utility vest, tiny blue robot held at side.
Row 4: product planner with brown swept hair, blue jacket, tablet and yellow sticky-note board.
Columns animation: 1 standing idle neutral; 2 idle slight breathe; 3 walking left leg forward; 4 walking right leg forward. Preserve identical identity, size and accessories across each row. Feet and arms change subtly for clean looping, no rotation.
CRITICAL coordinates: each sprite exactly centered horizontally within its 256px cell, baseline feet at y=200 within cell, top of head around y=60. Character INCLUDING accessories fits x=65..195, y=60..200 inside its cell. Generous transparent padding all around. No pixels from one sprite cross cell boundaries. All 16 figures rendered same 140px height. No antialiased blurry painting, no medieval weapons or armor, no logos, no watermark. Output is a usable game atlas, not a showcase poster.
