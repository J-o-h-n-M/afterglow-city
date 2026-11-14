# Afterglow City

**A dreamy city at dusk you can fly through, right in your browser.**

Glowing towers with a little room behind every window, traffic streaming over the bridges, a river that mirrors the skyline,
an elevated train, a ferris wheel, a blimp and searchlights sweeping the clouds.
And all of it is made by code: no images, no 3D models, no sound files. The whole city fits in **one ~126 KB HTML file**.

> **Based on [Abyssal Garden](https://github.com/Noniv/abyssal-garden) by Maksymilian Dendura**, a dreamy underwater
> world built the same way. Afterglow City takes its idea, its single-file WebGPU approach and the shape of its menu and
> build script, and turns them into a city. See [Credits](#credits).

## Try it

**Play it in your browser: [j-o-h-n-m.github.io/afterglow-city](https://j-o-h-n-m.github.io/afterglow-city/)** (Chrome or Edge on a desktop computer).

Or run it offline:

1. Download [`index.html`](index.html).
2. Open it in **Chrome** or **Edge** on a desktop computer.
3. Wait a moment while the city is built, then press **Enter the city** and start flying.

Nothing to install, and it works offline. It needs a browser with **WebGPU**.

> Some browsers block WebGPU pages opened straight from disk. If the page stays blank, serve the folder instead,
> for example with `python -m http.server`, and open `http://localhost:8000`.

## What's out there

- **Close to 10,000 buildings**: a downtown of setback skyscrapers with LED crowns, spires and blinking aircraft lights, and lower brick, concrete and glass neighbourhoods around it
- **Windows you can look into**: every window traces a tiny room (ceiling lamp, back wall, furniture, blinds), and the lights switch on and off as the evening goes on
- **Shop fronts and neon**: lit storefronts with glowing sign bands, blade signs that spell themselves out, animated rooftop billboards
- **Traffic**: about 9,000 cars and buses driving their lanes, climbing the bridges, headlights towards you and tail lights away
- **A river** with live reflections of the city, embankment promenades, eight girder bridges and a suspension bridge strung with lights
- **An elevated train** looping round downtown, a **ferris wheel** with colour-cycling lights, a **blimp** with a video screen, **searchlights**
- **A park** with winding paths, lamps and a pond
- **Dusk, night and dawn**, and **rain** that soaks the streets until they shine
- **A soundscape** made up as you listen: city rumble, passing cars, wind up high, rain, soft lo-fi chords and chimes, the odd horn or siren

## Controls

| | Keyboard & mouse |
|---|---|
| Look around | Move the mouse |
| Fly | `W` `A` `S` `D` |
| Down / up | `Q` / `E` |
| Faster | Hold `Shift` |
| Jump to a viewpoint | `1` to `6` |
| Time of day | `T` (dusk → night → dawn) |
| Rain on / off | `R` |
| Menu | `Esc` |
| Sound on / off | `M` |
| Performance stats | `H` |
| Detail level | **Low**, **Medium** or **High** in the menu (reloads the page) |

Buildings are solid: you glide along their walls instead of flying through them. You speed up the higher you fly.

**On a touchscreen:** hold one finger down to fly forward and slide it to steer; a second finger goes faster. The `≡` button opens the menu. (Touch support is experimental.)

## Detail levels

Every level is the same city, built with less in it:

| Level | What it is |
|---|---|
| **High** | Everything: 4× anti-aliasing, river and street reflections, dense traffic, lamps every 30 m |
| **Medium** | Fewer cars, lamps, trees and rooftop details |
| **Low** | No anti-aliasing or reflections, a third of the traffic, lamps every 60 m, lower starting resolution |

The resolution adapts while you fly to keep things near 60 fps, and the browser remembers what your device settled on,
plus your detail level, time of day and weather. If a start crashes, the next one drops a level.
On an RTX-class desktop GPU, High runs well above 100 fps at 1080p.

## How it works

- The street grid, blocks, lots and buildings are generated from a seeded random generator, so everyone gets the same city.
- Everything is drawn with **WebGPU** directly: no engine or 3D library. Every box, cylinder, sphere and cone in the city is an
  instance in a single storage buffer (~160,000 of them), drawn with a handful of instanced draw calls.
- Everything that moves (cars, trains, the wheel, the blimp, searchlights) is animated in the vertex shader, so the CPU does almost nothing per frame.
- Window lights, the rooms behind them, road markings, paving and neon are all computed per pixel; distant facades fade to an average so they don't shimmer.
- Street-lamp light pools and ambient occlusion are baked into a ground texture when the page opens.
- The river and wet streets use a mirrored render pass; bloom and ACES tone mapping finish the frame.
- The sound is synthesized live with the Web Audio API.

## Make it your own

The readable source is in [`source`](source). To rebuild `index.html` you only need [Node.js](https://nodejs.org) 18 or newer, with no packages to install:

```bash
cd source
node build.mjs          # writes ../index.html
node build.mjs --min    # smaller: squeezes the shaders (and minifies the JS if esbuild is installed)
```

| File | What's inside |
|---|---|
| [`source/src/world.js`](source/src/world.js) | The city layout: streets, blocks, towers, the river and bridges, park, traffic, train, ferris wheel, blimp, baked ground light. **A good place to start.** |
| [`source/src/shaders.js`](source/src/shaders.js) | The look (WGSL): sky, fog, windows and rooms, wet asphalt, water, neon, light sprites, rain, bloom, tone mapping |
| [`source/src/main.js`](source/src/main.js) | The camera and controls, time-of-day presets, menu, viewpoints, resolution scaling |
| [`source/src/renderer.js`](source/src/renderer.js) | The WebGPU renderer: pipelines, render targets, the reflection pass and the bloom chain |
| [`source/src/audio.js`](source/src/audio.js) | The soundscape |
| [`source/src/quality.js`](source/src/quality.js) | The detail levels and what is remembered between visits |
| [`source/src/math.js`](source/src/math.js) | Noise, random numbers, matrices and the meshes |
| [`source/template.html`](source/template.html) | The page around the city: loading bar, menu and styles |

Some easy first tweaks:

- **Sky and light colours:** the `TIMES` presets near the top of `main.js` (dusk, night, dawn)
- **Skyline:** `skylineAt()` in `world.js` sets where the city grows tall and how tall
- **Traffic density:** `carGap` per detail level in `quality.js`
- **Flying speed:** search for `150 : 28` in `main.js` (fast : normal)
- **Bloom strength:** the `0.1` passed to the composite pass in `renderer.js`

## Credits

This project exists because of **[Abyssal Garden](https://github.com/Noniv/abyssal-garden)** by Maksymilian Dendura (MIT).
From it come:

- the concept: a whole explorable world generated by code, with no assets, in one HTML file rendered with raw WebGPU
- the structure of the build: source files concatenated into one async function inside a page template, plus the WGSL minifier (`source/build.mjs`)
- the layout of the menu page: loading bar, blurred live scene behind the menu, detail-level row, list of controls (`source/template.html`)
- the overall feature set: viewpoints on `1`–`6`, Low/Medium/High detail levels with crash fallback, adaptive resolution, a synthesized soundscape

The city itself (layout, buildings, traffic, river, shaders, renderer, audio) is new code. Go and swim through the original too.

## License

[MIT](LICENSE): free to use, change and share. The LICENSE file also carries Abyssal Garden's MIT notice for the parts adapted from it.
