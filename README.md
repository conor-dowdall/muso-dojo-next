# Muso Dojo Next

### Interactivity & Audio

- **`audioSource`**: An identifier for which audio sample to play (`Tone.js`).
- **`noteDuration`**: How long to play a note when it's clicked.
- **`transpose`**: A value to transpose the played note (e.g., clicking a `C` plays a `B flat`).

### Displaying Musical Data

- **`scale` or `chord`**: A predefined scale or chord from `@musodojo/music-theory-data` to display on the fretboard.

## Notes

- **UI Framework**: `Next.js` with `React 19`.
- **Styling**: `Modern CSS`. Use the latest CSS techniques to create beautiful and intuitive interfaces.
- **Component Library**: Use `shadcn/ui` components where appropriate.
- **Icons**: Use `Lucide` for icons.
- **Music Theory Data**: Utilize the `@musodojo/music-theory-data` package for music-related data and functions.
- **Audio**: `Tone.js` will be used for audio playback. The implementation should support multiple channels for different instruments (e.g., piano, guitar, violin).
- **Rich Text Editor**: `Tiptap` may be used in the future for lesson-style pages. The Fretboard component should be designed with the idea that it might be wrapped for use within `Tiptap`.
- **Piano Component**: Consider how code and logic can be shared between the Fretboard component and a future Piano component.
