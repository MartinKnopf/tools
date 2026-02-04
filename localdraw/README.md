# LocalDraw

A static HTML drawing application using Excalidraw with multi-drawing support and localStorage persistence.

## Features

- **Multiple Drawings**: Create and manage multiple separate drawings
- **localStorage Persistence**: All drawings automatically saved to browser localStorage
- **Auto-save**: Changes are automatically saved with 300ms debounce
- **Drawing Management**: Rename drawings (double-click), delete drawings (× button)
- **Sidebar Navigation**: Easy switching between drawings
- **Full Excalidraw Features**: Complete Excalidraw functionality including:
  - Hand-drawn style shapes and arrows
  - Text and images
  - Real-time collaboration ready
  - Export capabilities
  - Canvas state persistence (zoom, pan, background color)

## Tech Stack

- **React 19** - UI framework
- **Excalidraw** - Drawing canvas component
- **Vite** - Build tool and dev server
- **localStorage** - Client-side persistence

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Opens development server at `http://localhost:5173`

### Build

```bash
pnpm build
```

Outputs production build to `dist/` directory.

### Preview Build

```bash
pnpm preview
```

Preview the production build locally.

## Storage Schema

### Two-tier localStorage design:

1. **`localdraw:drawings`** - Metadata array
   ```json
   [
     { "id": "uuid", "name": "Drawing 1", "createdAt": 1234567890, "updatedAt": 1234567890 }
   ]
   ```

2. **`localdraw:drawing:<id>`** - Scene data per drawing
   ```json
   {
     "elements": [...],
     "appState": {
       "viewBackgroundColor": "#fff",
       "zoom": { "value": 1 },
       "scrollX": 0,
       "scrollY": 0
     },
     "files": {}
   }
   ```

This separation ensures fast sidebar loading without parsing all scene data.

## Implementation Details

- **Key-based remounting**: Uses `key={activeId}` on Excalidraw wrapper to force remount when switching drawings, since Excalidraw only reads `initialData` on mount
- **Flush before switch**: Cancels debounce timer and saves immediately via `excalidrawAPI` before changing active drawing
- **Safe appState persistence**: Only persists safe fields (zoom, scroll, background) to avoid localStorage quota issues
- **Auto-initialization**: Creates first drawing automatically on initial visit

## License

ISC
