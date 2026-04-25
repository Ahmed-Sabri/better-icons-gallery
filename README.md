# better-icons-gallery

A lightweight Node.js script that turns `better-icons` CLI search results into a browsable local SVG gallery.

It helps when a single keyword is too narrow, or when a domain concept needs several related searches such as `mechanical`, `electrical`, and `plumb` for MEP-oriented icon discovery. The script downloads the matching SVGs, stores them in one folder, and rebuilds a clean visual gallery from **all SVG files already present** so repeated runs enrich the same collection instead of overwriting the UI view.[cite:25][cite:3]

## Why this exists

The upstream `better-icons` project provides a CLI for searching and retrieving icons from a very large catalog, including `search`, `get`, JSON output, and common filters such as prefix and limit.[cite:25][cite:31] In practice, many real design and engineering searches need multiple adjacent keywords rather than one perfect term, so this wrapper focuses on the missing convenience layer: **accumulate results across many searches and visualize them instantly in one gallery**.[cite:3]

## Features

- Search icons with the `better-icons` CLI and fetch matching SVG files.[cite:25][cite:31]
- Generate a local `index.html` gallery with a light UI for strong icon contrast.[cite:25]
- Rebuild the gallery from **all SVGs in the target folder**, not just the latest search batch.[cite:3]
- Re-run the script many times against the same folder to grow a themed library, such as MEP, HVAC, security, medical, or finance icon sets.[cite:3]
- Filter icons instantly in the browser by typing part of the icon ID or prefix.[cite:25]
- Copy icon IDs with one click and open the raw SVG file directly from the gallery.[cite:25]
- Support optional CLI passthrough settings such as `--prefix`, `--limit`, `--color`, and `--size` that align with documented `better-icons` usage patterns.[cite:25][cite:31]

## Demo workflow

A common workflow is searching a concept through several related terms into the same output folder.[cite:3]

```bash
node better-icons-gallery.js "mechanical" ./mep-icons --color=#111827 --size=40
node better-icons-gallery.js "electrical" ./mep-icons --color=#111827 --size=40
node better-icons-gallery.js "plumb" ./mep-icons --color=#111827 --size=40
```

After the final run, the generated gallery renders **all SVGs stored in `./mep-icons/svg`**, so the folder behaves like a cumulative icon board rather than a one-query snapshot.[cite:3]

## Screenshots

Add one or two screenshots here after pushing the repository. A good pair would be a wide gallery view and one focused card showing the light preview tile.

```md
![Gallery screenshot](./docs/gallery-light.png)
```

## Installation

### Prerequisites

- Node.js 18+ recommended
- `npx` available in the terminal
- Internet access for resolving and running the `better-icons` package through `npx`.[cite:25]

### Clone

```bash
git clone https://github.com/Ahmed-Sabri/better-icons-gallery.git
cd better-icons-gallery
```

No additional npm install step is required if the script is run directly with a standard Node.js installation and `npx` can resolve `better-icons` on demand.[cite:25]

## Usage

```bash
node better-icons-gallery.js <query> [outDir] [--limit=64] [--prefix=mdi] [--color=#111827] [--size=32]
```

### Examples

```bash
node better-icons-gallery.js HVAC
node better-icons-gallery.js mechanical ./mep-icons
node better-icons-gallery.js electrical ./mep-icons --color=#111827 --size=40
node better-icons-gallery.js plumb ./mep-icons --prefix=mdi
```

### Arguments

| Argument | Required | Description |
|---|---:|---|
| `query` | Yes | Search term passed to `better-icons search`.[cite:25][cite:31] |
| `outDir` | No | Output folder; defaults to `./icons-<slugified-query>`. |
| `--limit` | No | Limits the search result count when the upstream CLI supports it.[cite:25][cite:31] |
| `--prefix` | No | Restricts results to a collection prefix such as `mdi`, `lucide`, or `material-symbols`.[cite:25][cite:31] |
| `--color` | No | Applies a color while fetching each SVG via `better-icons get`.[cite:25][cite:31] |
| `--size` | No | Applies a size while fetching each SVG via `better-icons get`.[cite:25][cite:31] |

## Output structure

Each target folder is organized like this:

```text
mep-icons/
├── index.html
├── icons.json
└── svg/
    ├── mdi__fan.svg
    ├── material-symbols__electrical-services.svg
    └── ...
```

### What each file does

- `svg/` stores all downloaded icon files.
- `index.html` is the generated browser gallery.
- `icons.json` stores a machine-readable listing of the currently rendered icons.

Because the gallery is rebuilt from the folder contents, the script can be safely rerun into the same output path without losing older items unless those SVG files are manually removed.[cite:3]

## Multi-keyword searches

The upstream CLI examples publicly document one search term per `search` invocation, so the safest usage is still to run the script multiple times into the same folder for adjacent concepts.[cite:3][cite:25]

Recommended pattern:

```bash
node better-icons-gallery.js "mechanical" ./mep-icons --color=#111827 --size=40
node better-icons-gallery.js "electrical" ./mep-icons --color=#111827 --size=40
node better-icons-gallery.js "plumb" ./mep-icons --color=#111827 --size=40
```

This approach is especially useful for domains where icon authors may label the same idea differently, such as `home`, `house`, `building`, `villa`, or `residence`.[cite:3]

## UI design choices

The generated gallery intentionally uses a light interface because many icon packs return dark or black SVG paths, which become hard to inspect on dark cards. A white preview tile with a subtle border makes the icon silhouette much easier to recognize during browsing and shortlisting.[cite:25]

Other UI choices include:

- Larger preview boxes for easier visual scanning.
- No patterned background behind the SVG preview.
- Instant client-side filtering.
- Quick actions for opening the raw SVG and copying the icon ID.

## How it works

The script follows a simple pipeline:

1. Run `better-icons search <query> --json`.
2. Normalize the returned JSON shape.
3. Extract icon IDs from the result entries.
4. Download each icon through `better-icons get <icon-id>`.
5. Save SVG files into `./svg`.
6. Scan the full `./svg` directory.
7. Rebuild `index.html` from everything in that directory, including files from previous runs.[cite:25][cite:31][cite:3]

That last step is the main difference from a naive implementation and is what makes the tool useful for cumulative searches.[cite:3]

## MCP vs CLI

The upstream project describes advanced capabilities such as `recommend_icons` and `find_similar_icons` in its MCP tooling for AI-agent workflows, while the common public CLI examples focus on `search`, `get`, filtering, and JSON output.[cite:2][cite:3] This repository is a CLI wrapper, so it does **not** directly call MCP-only tools unless an explicit MCP integration layer is added later.[cite:2][cite:11]

In short:

| Capability | Works in this repo now? | Notes |
|---|---:|---|
| `search` | Yes | Uses the documented CLI flow.[cite:25][cite:31] |
| `get` | Yes | Used to download SVGs.[cite:25][cite:31] |
| `--json` | Yes | Used to parse structured search results.[cite:3][cite:31] |
| `recommend_icons` | No | Described as an MCP/agent tool rather than a normal script command.[cite:2][cite:11] |
| `find_similar_icons` | No | Also described under MCP tooling.[cite:2][cite:11] |

## Limitations

- The script depends on the output structure returned by `better-icons search --json`, so if that JSON shape changes in a future version, the normalization logic may need adjustment.[cite:3][cite:31]
- The file-to-ID conversion uses filename conventions, so unusual characters in future icon IDs could require more robust encoding and decoding.
- This is a local static gallery, not a hosted web app or package registry.
- SVG color and size are applied at fetch time, so rerendering with different styling typically means running the script again for new files.[cite:25][cite:31]

## Roadmap ideas

Potential future enhancements:

- Batch keyword mode, for example `--queries="mechanical,electrical,plumb"`
- Grouping by prefix or keyword source
- Sorting controls in the browser UI
- Copy raw SVG markup
- Duplicate detection across renamed files
- Optional local web server command
- Optional MCP integration for icon recommendation and similarity workflows if the repository later adopts an MCP client.[cite:2][cite:11]

## Contributing

Contributions are welcome.

Ideas for pull requests:

- Improve JSON shape compatibility with future `better-icons` releases
- Add tests for filename encoding and ID reconstruction
- Add grouping, sorting, or selection export
- Add optional keyword batching
- Improve accessibility and keyboard shortcuts in the gallery UI

If opening an issue, include:

- The exact command used
- Node.js version
- The generated `icons.json` if relevant
- A screenshot if the issue is visual

## License

Choose and add a license before publishing broadly. MIT is a practical default for a small utility like this.

Example:

```text
MIT License
```

## Acknowledgments

- Thanks to the `better-icons` project for exposing a searchable icon CLI and MCP server over a very large icon catalog.[cite:25]
- This repository builds a small convenience layer on top of that workflow for cumulative local visualization.[cite:3]
