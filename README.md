# Rebasta
[![npm](https://img.shields.io/npm/v/rebasta.svg?style=flat-square)](https://www.npmjs.com/package/rebasta)
[![npm](https://img.shields.io/npm/l/rebasta.svg?style=flat-square)](https://www.npmjs.com/package/rebasta)

Duplication detection tool (copy-paste detector) for programming languages, support different type of programming languages like javascript, jsx, typescript, html, java, c, swift, php, go, python and [other 150 languages...](docs/FORMATS.md)


## Installation

```
npm install -g rebasta
```
or

```
yarn global add rebasta
```

## Usage

```
  Usage: rebasta [options] <path>

  Rebasta is clone detection tool (copy/paste detector), support 100+ programming languages. Developed by Andrey Kucherenko.
  Example usage: rebasta -t 10 /path/to/code


  Options:

    -V, --version             output the version number
    -l, --min-lines [number]  min size of duplication in code lines (Default is 5)
    -t, --threshold [number]  threshold for duplication, in case duplications >= threshold basta will exit with error
    -c, --config [string]     path to config file (Default is .rebasta.json in <path>)
    -e, --exclude [string]    glob pattern for files what should be excluded from duplication detection
    -r, --reporter [string]   reporter to use (Default is console)
    -o, --output [string]     reporter to use (Default is ./report/)
    -b, --blame               blame authors of duplications (get information about authors from git)
    -s, --silent              Do not write detection progress and result to a console
    -d, --debug               show debug information(options list and selected files)
    --list                    show list of all supported formats
    --dontSkipComments        don't skip comments
    -h, --help                output usage information
```

If file `.rebasta.json` located in the root of project, values from the file will be used as defaults.
`.rebasta.json` should be correct json file:
```json
{
  "exclude": [
    "**/node_modules/**",
    "**/*.min.js",
    "**/*.!(vue|html)"
  ],
  "path": "./fixtures/",
  "threshold": 10,
  "silent": true
}
```

## License

[The MIT License](LICENSE)
