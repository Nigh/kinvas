# Roadmap

kinvas is very early in its development. The current priority is parsing and rendering, followed by the embedding API.

Here's a non-exhaustive roadmap:

- [x] Core functionality
    - [x] kicad_sch parser
    - [x] kicad_pcb parser
    - [x] kicad_wks parser
    - [x] kicad_pro parser
    - [x] Rendering KiCad 6 schematics
    - [x] Rendering KiCad 6 boards
    - [x] Rendering KiCad 6 text
    - [x] Rendering worksheets
    - [x] Loading hierarchical schematics
    - [x] Rendering KiCad 7 schematics
    - [x] Rendering KiCad 7 boards
    - [x] Rendering KiCad 7 text
    - [ ] Rendering bitmap objects
    - [ ] Rendering custom fonts
- [ ] Viewer functionality
    - [x] Pan/zoom
    - [x] Zoom to page
    - [x] Zoom to selection
    - [x] Cursor position
    - [x] Page information
    - [x] Symbol selection
    - [x] Footprint selection
    - [x] Inspecting selected symbols and footprints
    - [x] Footprint filtering
    - [x] Symbol filtering
    - [x] Board layer selection and visibility
    - [x] Board net selection
    - [x] Board net filtering
    - [x] Board object visibility controls
    - [ ] Board trace selection
    - [ ] Board zone selection
    - [ ] Copy selected item for pasting into KiCad
    - [x] Theming
    - [ ] Onion view
- [x] Standalone web application
    - [x] Project viewer
        - [x] Loading files and projects from GitHub
        - [x] Navigating hierarchical sheets
        - [ ] BOM view
        - [ ] Deep linking
    - [ ] Symbol library browser
    - [ ] Footprint library browser
    - [ ] Assembly guide
    - [ ] Mobile UI
- [ ] Embedding API
    - [x] Non-interactive document embedding
    - [x] Interactive document embedding
    - [ ] Fragment embedding
    - [ ] Deep linking
    - [ ] Footprint embedding
    - [ ] Symbol embedding
    - [ ] Assembly guide embedding
- [ ] Integrations
    - [ ] MkDocs/Python markdown integration
    - [ ] Jupyter integration
    - [ ] Sphinx integration
- [ ] Browser compatibility
    - [x] Chrome
    - [x] Firefox
    - [x] Safari
    - [ ] Chrome (Android)
    - [ ] Firefox mobile
    - [ ] Safari mobile

## Non-goals

kinvas also has specific non-goals. At this time, we won't add:

- Editing of any kind - kinvas is read only and that assumption is baked deeply within the code.
- Offline rendering
- 3D board and component rendering
- Server-side usage
- Comparison/visual diffing
- Specific integrations with front-end frameworks (React, Vue, etc.) - kinvas uses [Web Components] and should work with all web frameworks.

[Web Components]: https://developer.mozilla.org/en-US/docs/Web/API/Web_components
