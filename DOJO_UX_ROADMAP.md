# Dojo UX Improvement Roadmap

This roadmap breaks the proposed Dojo, Session, Arrangement, Library, backup,
and reset improvements into small groups. Each group should be implemented and
reviewed on its own before starting the next one.

## Product model to communicate

- **Dojo:** the complete working environment, saved automatically on the
  current device.
- **Session:** editable musical material made from Parts and modules.
- **Arrangement:** an ordered sequence of captured Session content.
- **Resources:** reusable musical material, initially Custom Tunings and Custom
  Chord Progressions.
- **Dojo Backup:** a portable file containing the complete Dojo.
- Do not use **Set** as a synonym for a backup. A Set has a valid musical
  meaning as a list of songs, whereas the current Set actions operate on the
  complete Dojo. The problem is the inaccurate scope of the label, not a clash
  between Set and Arrangement.

## Group 1: Clarify backup terminology

This is a copy and presentation change. It should not alter the backup format
or persistence behavior.

- Rename **Save the Set** to **Download Dojo Backup**.
- Rename **Recall a Set** to **Restore Dojo Backup**.
- Rename transient copy such as **Reading Saved Set…** to **Reading Backup…**.
- Replace references to the **current Dojo** with **your Dojo**. The application
  does not currently support multiple named Dojos.
- Rename the settings section from **Backups** to **Data & Backups**.
- Add a short explanation: **Everything in your Dojo is saved automatically on
  this device.**
- Use subtitles that state the scope explicitly:
  - Download: **Save a portable copy of your Sessions, Arrangements, personal
    library, and preferences.**
  - Restore: **Replace everything in your Dojo with a backup file.**
- Rename newly downloaded files from `muso-dojo-set-...json` to
  `muso-dojo-backup-...json`. Continue accepting existing backup files.
- Update component and backup tests for the new copy and filename.

### Review checkpoint

- Confirm that the settings dialog remains visually balanced with the longer
  labels and subtitles on desktop and mobile.
- Confirm that users can tell the difference between automatic local saving
  and downloading a portable backup.

## Group 2: Explain Sessions and Arrangements

This group improves first-use comprehension without changing either data
model.

- Add descriptive subtitles to the Library creation actions:
  - **New Session** — **Build and play Parts with instruments, rhythms, and
    backing.**
  - **New Arrangement** — **Sequence captured Sessions into sections.**
- Add brief descriptions beneath the **Sessions** and **Arrangements** section
  headings if the dialog remains easy to scan.
- Replace the empty Arrangement's unexplained disabled **Add First Section**
  button with an instructional empty state when no eligible Session exists:
  - **Arrangements are built from Sessions. Add at least one Part to a Session
    first.**
  - Provide **Open Library** and, where useful, **Create Session** actions.
- When a Session is added to an Arrangement for the first time, explain that
  its content is captured and can later be updated from the Session. Avoid
  implying that it is a continuously live reference.
- Preserve the existing **Changed Since Added** and **Update** behavior.
- Add browser coverage for the empty Arrangement path.

### Review checkpoint

- Start with a new Dojo, create an Arrangement before adding any Parts, and
  verify that the next required action is obvious.
- Verify that a user can explain the Session/Arrangement distinction from the
  Library and empty states alone.

## Group 3: Add a safe Start Fresh action

The primary clean-slate action should reset workspace content while protecting
hard-won reusable resources and preferences.

- Add a danger-area action under **Dojo Settings → Data & Backups** named
  **Start Fresh…**.
- Use this subtitle:
  - **Replace all Sessions and Arrangements with a new empty Session. Your
    Tunings, Progressions, and preferences will remain.**
- On confirmation:
  - Stop all audio playback.
  - Remove all Sessions and Arrangements.
  - Create and activate one new default empty Session, matching the first-run
    experience.
  - Restore the normal Session workspace view.
  - Preserve Custom Tunings, Custom Chord Progressions, theme, note colors, and
    remembered creation preferences.
- Show the actual impact in the confirmation, including Session, Arrangement,
  Tuning, and Progression counts.
- Offer **Download Backup** as a secondary action from the confirmation.
- Use **Cancel** and **Start Fresh** as the final confirmation buttons.
- Add store tests for the preservation boundary and a component test for the
  confirmation copy.

### Review checkpoint

- Verify the destructive action is discoverable but visually separated from
  ordinary appearance settings.
- Verify that personal resources survive and the result feels like a clean
  first-run workspace.

## Group 4: Make the central Library easier to recognize

- Keep Library in the Session and Arrangement overflow menus at every screen
  size.
- Give the Library menu item the subtitle **Sessions, Arrangements, and
  Resources** so its scope is visible before opening it.
- Use the same icon, label, subtitle, dialog, and current-item treatment in
  both workspaces.
- Change the generic Session overflow-button accessible label from **Menu** to
  **Session menu**, matching **Arrangement menu**.
- Keep Library visually grouped with other Dojo-level navigation rather than
  the actions that edit the current Session or Arrangement.

### Review checkpoint

- Verify that users understand what Library contains after opening the menu.
- Confirm that Library occupies the same predictable location in Session and
  Arrangement menus at every supported width.

## Group 5: Bring reusable musical resources into Library

This group makes the Dojo's contents visible as one coherent system.

- Keep **Library** as the single umbrella for all saved musical content. Do not
  place a second **My Library** inside it.
- Add **Resources** as a peer section alongside **Sessions** and
  **Arrangements**.
- Prefer **Resources** over **My Resources**. Sessions, Arrangements, Tunings,
  and Progressions all belong to the user already, so adding **My** to only one
  category would create an unnecessary distinction.
- Add entries for:
  - **My Tunings**, with a saved-item count.
  - **My Progressions**, with a saved-item count.
- Allow users to create, rename/edit, duplicate, and delete these resources
  without first opening an Instrument or Add to Session flow.
- Keep the existing contextual **My Tunings** and **My Progressions** pickers.
  They remain the best place to choose a resource while doing musical work.
- Refactor the resource dialogs to support two explicit modes:
  - **Choose mode:** selecting an item applies it to the current context.
  - **Manage mode:** selecting or opening an item manages it without applying
    it to an Instrument or Session draft.
- Do not move these resources into Dojo Settings. They are user-created musical
  content, not preferences.
- Add component tests for both dialog modes and the Library counts.

### Review checkpoint

- Verify that Tunings and Progressions are easy to find without knowing which
  creation dialog previously contained them.
- Verify that managing a resource globally cannot accidentally change the
  active Session or Instrument.

## Group 6: Show backup contents before restoring

- After reading a backup, show a restore summary containing:
  - Export date.
  - Number of Sessions and Arrangements.
  - Number of Custom Tunings and Custom Chord Progressions.
  - A clear statement that preferences will also be replaced.
- Change the confirmation question to **Restore this Dojo backup?**
- Use **Cancel** and **Restore Backup** as the final actions.
- Keep restore as a complete replacement operation.
- Add tests for summary counts, cancellation, invalid files, and successful
  replacement.

### Review checkpoint

- Verify that a user can predict exactly what will be replaced before
  confirming.

## Group 7: Import personal resources from a backup

This solves the problem of replacing the whole Dojo merely to recover one old
Tuning or Progression.

- Add **Import from Backup…** as a separate action from **Restore Dojo
  Backup**.
- Initially support importing Custom Tunings and Custom Chord Progressions.
- Show available resources with individual selection controls.
- Preserve everything already in the active Dojo.
- Resolve name collisions explicitly:
  - **Keep Both** creates a uniquely named copy.
  - **Skip** leaves the existing item unchanged.
- Report how many resources were imported or skipped.
- Consider importing Sessions and Arrangements only as a later extension. They
  require careful ID remapping and source-Session handling and should not make
  the first resource-import release unnecessarily large.
- Add parser, merge, collision, component, and persistence tests.

### Review checkpoint

- Verify that one old Tuning or Progression can be recovered without changing
  Sessions, Arrangements, appearance, or other personal resources.

## Group 8: Optional full data erase

Implement this only if user feedback demonstrates a need beyond **Start
Fresh**.

- Add **Erase All Dojo Data…** as a separate, more destructive action.
- Explain that it removes Sessions, Arrangements, Tunings, Progressions, and
  preferences before returning to the first-run state.
- Never label this action simply **Reset Dojo**.
- Require a stronger confirmation than **Start Fresh** and offer **Download
  Backup** before erasure.
- Test the complete deletion boundary, initial Session recreation, and local
  persistence.

### Review checkpoint

- Verify that **Start Fresh** and **Erase All Dojo Data** cannot be mistaken for
  one another.

## Group 9: Dialog handoff and accessibility polish

- Review Menu → Library and Menu → Dojo Settings transitions.
- Ensure an outgoing dialog loses modal semantics and focus ownership before
  the incoming dialog becomes active.
- Avoid exposing two active dialogs or duplicate **Close dialog** controls
  during the transition.
- Verify Escape behavior, focus return, page-scroll locking, reduced-motion
  behavior, and screen-reader labels.
- Add focused browser coverage for dialog-to-dialog handoffs.

## Recommended delivery order

1. Clarify backup terminology.
2. Explain Sessions and Arrangements.
3. Add **Start Fresh**.
4. Make Library easier to recognize.
5. Add reusable resources to Library.
6. Show backup contents before restoring.
7. Import personal resources from a backup.
8. Decide whether full data erasure is needed.
9. Complete dialog and accessibility polish.

After every group, review the result at desktop and phone widths before moving
on. Avoid combining Groups 3, 5, and 7 into one release; each changes a
different part of the user's mental model and deserves a separate inspection.
