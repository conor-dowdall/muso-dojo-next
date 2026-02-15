# Muso Dojo Next - Gemini LLM Context

This document provides context, guidelines, and architectural insights for the "Muso Dojo Next" project. Use this to inform your code generation, refactoring, and design decisions.

## 1. Project Overview

**Muso Dojo Next** is a modern web application for music education, focusing on interactive instruments and music theory. It aims to provide a premium, visually stunning, and highly interactive user experience.

- **Goal**: Create better music students through interactive tools.
- **Current Focus**: Building a robust and flexible interactive Fretboard component.

## 2. Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/) with **React Compiler** (discourage the use of useMemo and useCallback unless necessary).
- **Language**: TypeScript
- **Styling**: **Modern Native CSS** (CSS Modules or Scoped CSS preferred over Tailwind).
  - Use CSS Variables for theming (e.g., `light-dark()` color-scheme).
  - Avoid external styling libraries unless specified (e.g., `shadcn/ui` for generic UI, but custom CSS for instruments).
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio**: [Tone.js](https://tonejs.github.io/)
- **Music Theory**: `@musodojo/music-theory-data` (internal/external package).

## 3. Design Philosophy & Aesthetics

- **_"Premium & Polished"_**: The UI should be high-quality and polished.
- **CSS First**: Utilize modern CSS features like Grid, Flexbox, Container Queries (`container-type`), and logical properties (`margin-inline`, etc.).
- **No Tailwind**: The project has moved _away_ from Tailwind CSS in favor of clean, semantic CSS and CSS variables.

## 4. Key Component: `Fretboard`

The `Fretboard` (`src/components/instruments/fretboard/Fretboard.tsx`) is the centerpiece of the current development.

### Architecture

- **Layout**: Heavily relies on **CSS Grid**.
  - The fretboard uses a multi-layer grid approach where `fingerboard`, `strings`, and `notes` are stacked using `grid-area` or explicit row/column placement within a parent grid.

## 5. Coding Standards

- **pnpm**: Use `pnpm` for package management, and anywhere else you would use `npm` or `yarn`.
- **Components**: Functional components with strict TypeScript typing.
- **React Compiler**: Do NOT use `useMemo` or `useCallback` unless specifically required for library interoperability. Trust the React Compiler to optimize renders.

## 6. Future Roadmap (Context)

- **Rich Text Integration**: The Fretboard will eventually need to work inside `Tiptap` editors. Keep it self-contained.
- **Piano**: A Piano component will be built next. Consider shared logic for "Notes", "Audio", and "Scales".
