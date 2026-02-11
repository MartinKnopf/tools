# Montag - File Sorting Game

A Windows 98-inspired HTML5 file sorting game with retro pixel art aesthetics. Players drag and drop files into correct folders based on rotating criteria across progressive waves.

## Game Overview

**Montag** challenges players to quickly sort files dumped on a nostalgic desktop interface. Each wave presents files that must be organized into folders based on specific criteria (file type, project, department, etc.). The game features hand-crafted tutorial waves followed by procedurally generated challenges.

### Use Cases

- **Casual Gaming**: Quick, engaging gameplay sessions with progressive difficulty
- **Desktop Nostalgia**: Appeals to users who appreciate retro Windows 98 aesthetics
- **Offline-First PWA**: Works completely offline once cached via service worker
- **Mobile & Desktop**: Fully responsive with touch and mouse support

## Game Features

### Core Mechanics
- **10 File Types**: Each with unique pixel art icons and preview content (images, documents, spreadsheets, music, video, presentations, executables, archives, emails, PDFs)
- **6 Sorting Criteria**: File type, project name, department, decade, priority, client
- **Wave Progression**: 8 hand-crafted tutorial waves, then procedural generation up to 20 files and 6 folders
- **Scoring**: +10 × wave number for correct placement, -5 for errors (floor: 0)
- **Progress Indicator**: Animated coffee cup that drains every 3 waves and refills when empty
- **State Persistence**: Game progress saved to localStorage

### UI/UX
- **Retro Desktop**: Full-viewport teal gradient background with taskbar
- **Window System**: Draggable preview windows with Win98-style chrome
- **Responsive Grid**: Smart file layout adapts to screen size (3-4 columns mobile, more on desktop)
- **Dual Input**: HTML5 drag-and-drop (desktop) + custom touch handlers (mobile)
- **Wave Announcements**: Overlay displays criteria before each wave and completion messages

## Architecture

All code is vanilla JS (ES modules), no build step. The entry point is `index.html` which loads `main.js`.

### File Map

```
montag/
├── index.html              # All CSS (animations, layout, effects) + HTML shell
├── main.js                 # Entry point: init, start menu, context menu,
│                             tray tooltips, volume toggle, settings window,
│                             desktop shortcuts (My Computer, Recycle Bin)
├── engine/
│   ├── state.js            # Shared gameState object, constants, localStorage save/load
│   ├── effects.js          # Central toggle registry — registerEffect/toggleEffect/isEffectEnabled,
│                             persists on/off state to localStorage (montag_effects)
│   ├── ui.js               # DOM rendering (files, folders, windows, desktop shortcuts),
│                             drag-and-drop (mouse + touch, single & multiselect),
│                             file selection (click/Ctrl/Shift/selection rect),
│                             score odometer, taskbar program buttons, file tooltips,
│                             window chrome (minimize/maximize/resize), grid layout
│   ├── icons.js            # All pixel-art drawing functions (drawImageIcon, drawFolderIcon, etc.),
│                             system tray icon variants (active network, green shield, muted volume)
│   ├── waves.js            # Task registry + wave lifecycle (startWave → overlay → spawnItems),
│                             onWaveComplete triggers next wave
│   └── utils.js            # Pure helpers: randomChoice, randomSample, generateId, clamp
└── tasks/
    └── file-sort.js        # The file-sort task (self-registers via registerTask):
                              file type definitions, name generation, wave configs (8 tutorial + procedural),
                              preview generators (image/doc/spreadsheet/music/video/etc.),
                              scoring logic (checkFilePlacement), combo system,
                              visual effects (particles, screen shake, CRT flicker, folder gulp,
                              drop ripple, wrong-drop text, network activity, shield pulse, combo slam,
                              typing animation in previews)
```

### Key Patterns

- **Task system**: `waves.js` holds a task registry. Tasks self-register on import (see `file-sort.js` calling `registerTask`). Each task defines `getWaveConfig`, `getCriteriaText`, and `spawnItems`. Only one task is active at a time (`gameState.activeTask`).
- **Effects system**: `effects.js` is a central registry. Any module can call `registerEffect(name, { enable, disable })` at import time. `main.js` calls `initEffects()` after all modules load, which reads localStorage and enables defaults. All effect-gated code checks `isEffectEnabled(name)` before running. The Settings window (opened from Start menu) lists all effects with checkboxes.
- **Drag-and-drop**: Implemented in `ui.js` with parallel mouse and touch handlers. Supports multiselect drag — when dragging a file that's part of a selection, all selected files move and drop together. The drop callback is pluggable (`setOnDropCallback`), set by the active task.
- **Rendering**: `ui.js` exports `renderFile` and `renderFolder` which create DOM elements with event listeners. The task module passes icon-creation and preview-handler callbacks. Icons are drawn on `<canvas>` elements via functions in `icons.js`.
- **State**: `state.js` exports a single shared `gameState` object mutated by all modules. Score, wave, and time are persisted to localStorage under `montag_state`.
