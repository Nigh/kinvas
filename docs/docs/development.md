# Development

This page provides technical background for those wishing to explore kinvas source code.

## Contributing

Contributions are welcome! Since kinvas is in an early stage, please file an issue before starting work so we can coordinate. Also read our [Code of Conduct].

## Technical overview

kinvas is written in modern vanilla [TypeScript] and uses the [Canvas] element and [WebGL] for rendering. Its user interface uses [Web Components].

kinvas has no runtime dependencies. Everything it needs is bundled, and nothing pollutes the global namespace. This supports easy embedding.

## Source code organization

kinvas source code under `./src` is organized as follows:

- `base` contains generic, widely applicable utilities for working with JavaScript, TypeScript, the DOM, and math. These are the sort of things you'd use across multiple, unrelated projects.
- `kicad` contains the KiCad data layer and text layout implementation. This is where parsers for KiCad files and associated models live.
- `graphics` contains the rendering engine. It handles primitives such as lines, circles, and polygons, with behavior tailored to kinvas.
- `viewers` contains classes that implement viewers for different KiCad documents. Viewers create geometry using "Painters" and manage renderer "Layers". Viewers expose high-level APIs instead of providing a user interface.
- `kc-ui` contains generic, low-level web components used to build the kinvas user interface. For example, `<kc-ui-button>` and `<kc-ui-icon>`.
- `kicanvas` contains the kinvas application and its elements. Elements here implement kinvas functionality, such as `<kc-project-panel>` and `<kc-symbols-panel>`.

[kinvas]: https://nigh.github.io/kinvas/
[TypeScript]: https://typescript.dev
[Canvas]: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
[WebGL]: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
[Web Components]: https://developer.mozilla.org/en-US/docs/Web/API/Web_components
[Code of Conduct]: https://github.com/Nigh/kinvas/blob/main/CODE_OF_CONDUCT.md
