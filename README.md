# Muso Dojo Web Interface

This is a `Next.js` project created with `pnpm create next-app@latest muso-dojo --typescript --tailwind --eslint`.

This README provides instructions and context for an AI coding assistant to help build and maintain this project.

## Project Goals

The primary goal is to create a reactive, configurable Fretboard Component using React 19.

## Fretboard Component Requirements

The Fretboard component should be highly configurable. Here are the desired features and properties:

### Core Configuration

- **`tuning`**: An array of MIDI numbers representing the tuning of the strings (e.g., `[40, 45, 50, 55, 59, 64]` for EADGBE Standard Guitar Tuning).
- **`instrument`**: Ability to load predefined fretboard configurations for instruments like Mandolin, Violin, or Ukulele. Data for these presets can eventually be moved to `@musodojo/music-theory-data`.
- **`rootNote`**: The root note to be highlighted on the fretboard.
- **`fretRange`**: The starting and ending fret numbers to display.

### Visual Customization

- **`dark or light mode`**: Default to dark mode. Maybe light could be used for printing out fretboard diagrams, so it should be white on black.
- **`showFretLines`**: A boolean to show or hide fret lines (e.g., a violin has no frets, a guitar does).
- **`stringWidths`**: Configurable widths for the strings.
- **`fretWidths`**: Configurable widths for the frets.
- **`showFretLabels`**: A boolean to show fret number labels next to the fretboard.
- **`fretLabelMarkers`**: Configurable markers for specific frets. This should support different styles, for example:
  - **Guitar Style**: `[3, 5, 7, 9, 12, 15, 17, 19, 21, 24]`
  - **Mandolin Style**: `[3, 5, 7, 10, 12, 15, 17, 19, 22, 24]`
- **`fretLabelAreaWidth`**: The width of the area where fret labels are displayed.
- **`backgroundColor`**: Custom background color for the fretboard.
- **`backgroundImage`**: Custom background image for the fretboard.
- **`showInlays`**: A boolean to show fretboard inlays (e.g., custom images or SVGs) in the fret areas, which should scale as the frets get smaller.
- **`noteColors`**: An array of 12 colors to apply to each note.
- **`applyColorsFrom`**: Whether to apply colors starting from 'C' or from the `rootNote`.
- **`CSS Grid Layout`**: use grids and subgrids, if appropriate in the CSS. the `fingerboardArea` area and the `fretLabelArea` could be subgrids.

```ts
// Example code for calculating fret areas using a grid layout with CSS grid, which is scalable by default.
get gridTemplateColumns() {
    if (this.evenFrets) return `repeat(${this.numFrets}, 1fr)`;
    let template = "";
    for (let i = 0; i < this.numFrets; i++)
      template = `${Math.pow(2, i / 12)}fr ${template}`;
    return template;
  }
```

### Interactivity & Audio

- **`audioSource`**: An identifier for which audio sample to play (`Tone.js`).
- **`mode`**: A `play` or `lock` mode where notes can be clicked to be played.
- **`noteDuration`**: How long to play a note when it's clicked.
- **`transpose`**: A value to transpose the played note (e.g., clicking a `C` plays a `B flat`).

### Displaying Musical Data

- **`scale` or `chord`**: A predefined scale or chord from `@musodojo/music-theory-data` to display on the fretboard.

## Technical Stack & Conventions

- **UI Framework**: `Next.js` with `React 19`.
- **Styling**: `Tailwind CSS`. Use the latest CSS techniques to create beautiful and intuitive interfaces.
- **Component Library**: Use `shadcn/ui` components where appropriate.
- **Icons**: Use `Lucide` for icons.
- **Music Theory Data**: Utilize the `@musodojo/music-theory-data` package for music-related data and functions.
- **Audio**: `Tone.js` will be used for audio playback. The implementation should support multiple channels for different instruments (e.g., piano, guitar, violin).
- **Rich Text Editor**: `Tiptap` may be used in the future for lesson-style pages. The Fretboard component should be designed with the idea that it might be wrapped for use within `Tiptap`.

## Future Work

- **Piano Component**: Consider how code and logic can be shared between the Fretboard component and a future Piano component.
- **Data Abstraction**: Move predefined instrument data to `@musodojo/music-theory-data`.
