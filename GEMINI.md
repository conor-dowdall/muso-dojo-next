# Muso Dojo Next - Gemini LLM Context

This document provides context, guidelines, and architectural insights for the "Muso Dojo Next" project. Use this to inform your code generation, refactoring, and design decisions.

## 1. Project Overview

**Muso Dojo Next** is a modern web application for music education, focusing on interactive instruments and music theory. It aims to provide a premium, visually stunning, and highly interactive user experience.

- **Goal**: Create better music students through interactive tools.
- **Current Focus**: Building a robust and flexible interactive Fretboard component.

## 2. Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Language**: TypeScript
- **Styling**: **Modern Native CSS** (CSS Modules or Scoped CSS preferred over Tailwind).
  - Use CSS Variables for theming (e.g., `light-dark()` color-scheme).
  - Avoid external styling libraries unless specified (e.g., `shadcn/ui` for generic UI, but custom CSS for instruments).
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio**: [Tone.js](https://tonejs.github.io/)
- **Music Theory**: `@musodojo/music-theory-data` (internal/external package).

## 3. Design Philosophy & Aesthetics

- **_"Premium & Native"_**: The UI should feel substantial, native, and high-quality.
- **Visuals**: Use rich aesthetics, subtle gradients, glassmorphism, and smooth animations. Avoid "generic bootstrap" looks.
- **CSS First**: Utilize modern CSS features like Grid, Flexbox, Container Queries (`container-type`), and logical properties (`margin-inline`, etc.).
- **No Tailwind**: The project has moved _away_ from Tailwind CSS in favor of clean, semantic CSS and CSS variables.

## 4. Key Component: `Fretboard`

The `Fretboard` (`src/components/instruments/fretboard/Fretboard.tsx`) is the centerpiece of the current development.

### Architecture

- **Composition**:
  - `Fretboard` (Main Container)
  - `Fret` (Visual fret background/inlays)
  - `InstrumentString` (String representation)
  - `FretLabel` (Fret numbers)
  - `FretboardNote` (Interactive note overlays)
- **Layout**: Heavily relies on **CSS Grid**.
  - The fretboard uses a multi-layer grid approach where `fingerboard`, `strings`, and `notes` are stacked using `grid-area` or explicit row/column placement within a parent grid.
  - **Columns**: Calculated based on fret spacing rule (Rule of 18) or uniform spacing.
  - **Rows**: Determined by string count.
- **Configuration**:
  - Configs are resolved relationships between "Presets" (defaults) and "Props" (overrides).
  - See `src/utils/fretboard/createFretboardConfig.ts`.

### Specific Patterns

- **Z-Index / Layering**:
  1.  **Background/Frets**: Bottom layer.
  2.  **Strings**: Middle layer.
  3.  **Notes**: Top layer (Interactive).
- **Interactivity**:
  - Notes are toggled via an `onClick` handler in the `notes-container`.
  - **Toggle Logic**: `Off` -> `Large Emphasis` -> `Small Emphasis` -> `Off`.
- **Responsiveness**:
  - Uses `container-type: inline-size` for container queries to adjust layout based on the _component's_ size, not just the viewport.

## 5. Coding Standards

- **Components**: Functional components with strict TypeScript typing.
- **Props**: Use interface definitions (e.g., `FretboardProps` in `@/types/fretboard`).
- **File Structure**:
  - `src/components/instruments/[instrument]/[Component].tsx`
  - `src/utils/[instrument]/[utility].ts`
  - `src/types/[typefile].ts`
- **"Magic Numbers"**: Avoid them. Use calculated values or constants where possible (e.g., fret width calculations).

## 6. Future Roadmap (Context)

- **Rich Text Integration**: The Fretboard will eventually need to work inside `Tiptap` editors. Keep it self-contained.
- **Piano**: A Piano component will be built next. Consider shared logic for "Notes", "Audio", and "Scales".
