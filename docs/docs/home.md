# kinvas

[kinvas] is an **interactive**, **browser-based** viewer for [KiCad] schematics and boards. Try it at [nigh.github.io/kinvas](https://nigh.github.io/kinvas/).

<video src="https://user-images.githubusercontent.com/250995/233475339-43c89a26-c825-4999-9d0a-7bde690c96ca.mp4" controls="true"></video>

!!! warning

    kinvas is currently in **early alpha**. There will be bugs and missing features. Please review [known issues](#known-issues) and [file an issue] if you encounter trouble.

You can also use kinvas on your own websites through the [embedding API](embedding.md). It is written in modern vanilla [TypeScript] and uses the [Canvas] element and [WebGL] for rendering.

kinvas is developed by [Thea Flowers](https://thea.codes) with financial support from her [sponsors].

[kinvas]: https://nigh.github.io/kinvas/
[KiCad]: https://kicad.org
[file an issue]: https://github.com/Nigh/kinvas/issues/new/choose
[TypeScript]: https://typescript.dev
[Canvas]: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
[WebGL]: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
[Thea Flowers]: https://thea.codes
[sponsors]: https://github.com/sponsors/theacodes

## Known issues

In general, please check the [GitHub issues] page before filing new issues. Some high-level things that we known won't work:

- Any KiCad 5 files; kinvas can only parse files from KiCad 6 and later.
- Some KiCad 7 features might not be fully implemented, such as custom fonts in schematics.
- Browsers other than desktop Chrome, Firefox, and Safari may run into issues, as we aren't currently running automated tests against other browsers. We welcome issues related to browser compatibility, just make sure it hasn't already been reported.

[GitHub issues]: https://github.com/Nigh/kinvas/issues

## FAQ

> Will you add this feature that's very important to me?

Maybe, maybe not. Check the non-goals in the [roadmap](roadmap.md), then search [GitHub issues]. Please keep in mind that kinvas is intentionally limited in scope.

> Can I use kinvas on my own site?

Yes, but, it's all very early stages. See [embedding](embedding.md) for more details.

> Do I need a plugin to show files in kinvas?

No. kinvas reads KiCad files directly.

> Are you going to support KiCad 7 features? Custom fonts?

Yes. I'm actively working on bringing kinvas up to parity with KiCad 7, including custom fonts. KiCad 7 files should parse and load, but kinvas may not render some features correctly.

> Will kinvas support something like [InteractiveHtmlBom]?

Yes. kinvas will eventually provide an "Assembly guide" mode without extra KiCad plugins.

[InteractiveHtmlBom]: https://github.com/openscopeproject/InteractiveHtmlBom

> Why isn't kinvas on NPM?

kinvas developer APIs for embedding and parsing are not stable enough to publish yet.

> Why don't you support KiCad 5 files?

KiCad 5 files are a completely different format from V6 and onwards. Implementing parsers for that format would take a lot of time and I'm not interested in doing it.

> Why didn't you use [x] library/framework?

kinvas avoids runtime dependencies so embedded pages do not inherit conflicting libraries.

> Will you port all of KiCad to the browser?

No. kinvas is read-only and is not a suitable base for a browser-based editor.

> How can I help?

- **Try it out**: Test projects, schematics, and boards with kinvas and report issues.
- **Contribute code**: Since kinvas is still early in development, file an issue before starting work.
- **Sponsor**: This project is lead by a single person financially supported through [sponsors].

## Contributing

Contributions are welcome! Since kinvas is in an early stage, please file an issue before starting work so we can coordinate. Also read the [development documentation](development.md).

## License

kinvas is open source and published under the permissive MIT license. Read the [license](license.md) for details.

## Community projects

Projects built on kinvas:

- [KiSite](https://github.com/hmcty/kisite): A static site generator for KiCad projects

Projects with overlapping functionality:

- [KiRi](https://github.com/leoheck/kiri): Visual diff tool for schematics and layouts
- [ecad-viewer](https://github.com/Huaqiu-Electronics/ecad-viewer): Fork of kinvas
- [KiCAD-PRISM](https://github.com/krishna-swaroop/KiCAD-Prism): Cloud-based KiCad workspace, built on `ecad-viewer`
- [InteractiveHtmlBom](https://github.com/openscopeproject/interactivehtmlbom): Plugin to visualize KiCad BOM and assembly instructions

## Special thanks

kinvas would not be possible without the financial support of our [sponsors]. The following people and organizations provided significant support:

- [PartsBox](https://partsbox.com/)
- [Blues](https://blues.io/)
- [Tim Ansell](https://github.com/mithro)
- [Jeremy Gordon](https://github.com/jeremysf)
- [James Neal](https://github.com/jamesneal)

& donations and support from the following individuals:

- [@timonsku](https://github.com/timonsku)
- [@todbot](https://github.com/todbot)
- [@friggeri](https://github.com/friggeri)
- [@voidmar](https://github.com/voidmar)
- [@casundra](https://github.com/casundra)
- [@ntpopgetdope](https://github.com/ntpopgetdope)
- [@ehughes](https://github.com/ehughes)
- [@guru](https://github.com/guru)
- [@jamesneal](https://github.com/jamesneal)
- [@calithameridi](https://github.com/calithameridi)
- [@forsyth](https://github.com/forsyth)
- [@mattimo](https://github.com/mattimo)
- [@mzollin](https://github.com/mzollin)
