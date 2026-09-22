# kinvas

[kinvas] is an **interactive**, **browser-based** viewer for [KiCad] schematics and boards. Try it at https://nigh.github.io/kinvas/.

https://user-images.githubusercontent.com/250995/233475339-43c89a26-c825-4999-9d0a-7bde690c96ca.mp4

**NOTE**: kinvas is currently in **early alpha**. There will be bugs and missing features. Please take a look at [known issues](#known-issues) and [file an issue] if you run into trouble.

You can also use kinvas on your own websites using the [embedding API]. It's written in modern vanilla [TypeScript] and uses the [Canvas] element and [WebGL] for rendering. You can learn more on the [development page][development documentation].

kinvas is developed by [Thea Flowers](https://thea.codes) with financial support from her [sponsors].

[kinvas]: https://nigh.github.io/kinvas/
[KiCad]: https://kicad.org
[file an issue]: https://github.com/Nigh/kinvas/issues/new/choose
[embedding API]: https://nigh.github.io/kinvas/embedding/
[TypeScript]: https://typescript.dev
[Canvas]: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
[WebGL]: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
[Thea Flowers]: https://thea.codes
[sponsors]: https://github.com/sponsors/theacodes

## Status and roadmap

kinvas is very early in its development and there's a ton of stuff that hasn't been done. The [roadmap] gives an overview of the project status.

[roadmap]: https://nigh.github.io/kinvas/roadmap/

## Known issues

In general, please check the [GitHub issues] page before filing new issues. Some high-level things that we know won't work:

- Any KiCad 5 files; kinvas can only parse files from KiCad 6 and later.
- Some KiCad 7 features might not be fully implemented, such as custom fonts in schematics.
- Browsers other than desktop Chrome, Firefox, and Safari may run into issues, as we aren't currently running automated tests against other browsers. We welcome issues related to browser compatibility, just make sure it hasn't already been reported.

[GitHub issues]: https://github.com/Nigh/kinvas/issues

## FAQ

Take a look at our [FAQ] page for commonly asked questions and answers.

[FAQ]: https://nigh.github.io/kinvas/home/#faq

## License and contributing

kinvas is open source! Please read the [LICENSE](LICENSE.md) file.

Contributions are welcome! Since kinvas is in an early stage, please file an issue before starting work so we can coordinate. Also read the [development documentation].

[development documentation]: https://nigh.github.io/kinvas/development/

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
