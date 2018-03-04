# MI Skin for [osu!](https://osu.ppy.sh/home/)

> MI stands for Material Inspired.

## Downloading

Go to [releases](https://github.com/Bauke/mi-skin/releases) and download the `.osk` file. 

## Developing

### Requirements

* [Node JS](https://nodejs.org/)
* [Yarn](https://yarnpkg.com) or [NPM](https://www.npmjs.com/)

### Installation

>I use Yarn however you can do this all with NPM too. Be aware that some commands are different.

Clone the repository and run `yarn`.

After cloning and installing run `yarn test` to see if [svg-to-png](https://yarnpkg.com/package/svg-to-png) is working correctly. You should get a `test.png` in `/dist`.

To build the skin you can run `yarn build`. This will completely remove `/dist`, build all the files again and copy the `skin.ini` over.

### Workflow

The easiest way I've found to design elements is to use a text editor such as [VS Code](https://code.visualstudio.com/) and install a [SVG Preview](https://marketplace.visualstudio.com/items?itemName=cssho.vscode-svgviewer) extension. Once you're satisfied with what it looks like in the preview you can build the files and copy them over to a folder in `osu!/Skins` and look at it in-game.

Once you're done and want to easily get a folder with all the elements you can run `yarn prod`. This will put `/MI Skin` and all the elements into `/dist/MI Skin`. All that's left to do after is to zip it and rename to `.osk`

## Issues

If you encounter any problems with the skin, developing the skin or want to suggest something to change. [Open an issue](https://github.com/Bauke/mi-skin/issues) or contact me on Discord: `Bauke#7065`

## License

I've chosen for no license as it's an osu! skin and not some revolutionary project. Don't be a fuck and steal elements, that's not cool. I encourage you to mix and match but always give credit where credit is due. Thanks!

## References

* [osu! Skinning Wiki](https://osu.ppy.sh/wiki/Skinning)
* [Skinnable Files Detailed Spreadsheet](https://docs.google.com/spreadsheets/d/1bhnV-CQRMy3Z0npQd9XSoTdkYxz0ew5e648S00qkJZ8/)
* [Material Color Palette](https://material.io/guidelines/style/color.html#color-color-palette)
* [Material Design Icons](https://materialdesignicons.com/)