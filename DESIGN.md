# HoloNews design system

## Direction

HoloNews is a transmission broadsheet inside a HoloSuite device. The surrounding shell uses HoloSuite's dark cyan instrumentation. The publication surface uses paper, ink, editorial hierarchy, and restrained signal color. The contrast makes the Reader feel like an artifact from the campaign world instead of another command dashboard.

The Editorial Manager stays in Operate mode. It uses the same shell, but it favors dense lists, clear state labels, and a persistent workspace over theatrical presentation.

## Typography

- `Newsreader` carries publication names, headlines, decks, and article prose.
- `Space Grotesk` carries navigation, controls, metadata, tables, and the Editorial Manager.
- Article prose uses a 1.65 line height and a maximum width of 70 characters.
- Numeric metrics use tabular figures.

## Color tokens

- `--hsn-shell`: deep blue-black around the device.
- `--hsn-paper`: warm mineral paper for Classic Newspaper.
- `--hsn-ink`: near-black editorial ink.
- `--hsn-signal`: oxblood for urgent or selected editorial state.
- `--hsn-cyan`: inherited HoloSuite interaction color.
- Semantic success, warning, and danger colors appear only for state.

## Shape and depth

The Reader uses square editorial rules and small radii. The shell uses HoloSuite's compact radius. Panels use either a border or a soft shadow, never both. Pills are reserved for badges and status labels.

## Reader composition

The first viewport establishes the publication name, issue identity, one decisive headline, and one image area. Secondary stories follow as an editorial grid. At phone widths the grid becomes a reading sequence without shrinking type below 16 px.

The signature interaction is the paper-to-article transition: selecting a headline moves the masthead into a compact rail while the story opens in place. Reduced-motion mode replaces movement with an immediate state change.

## Editorial Manager composition

A compact navigation rail, a list or canvas workspace, and a contextual inspector form a stable three-part layout on desktop. Below 800 px the rail becomes a horizontal scroller and the inspector moves below the workspace.

## Themes

Classic Newspaper, Modern News, Corporate, Military Bulletin, Underground, Tabloid, and Sci-Fi Terminal change publication tokens. Both Modern News and Tabloid are supported because the planning document names them in separate theme lists. Themes do not change control semantics, focus states, or the HoloSuite shell.

## Interaction states

All controls define default, hover, focus-visible, active, disabled, loading, and error states. Destructive actions require a Foundry confirmation dialog. Empty states teach the next available action.
