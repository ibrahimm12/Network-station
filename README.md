# Network Station Speed

A small, testable network station finder with a Node.js CLI and an interactive browser UI built with HTML, CSS, and JavaScript. Explore assignment coordinates on a coverage map, compare station scores, or analyze a custom location.

## Problem and algorithm

Stations are points in a two-dimensional plane with a reach radius. For a device and station, Euclidean distance is

$$d = \sqrt{(x_d-x_s)^2+(y_d-y_s)^2}$$

If $d \le r$, the station speed is $(r-d)^2$; otherwise its speed is zero. The program reports the eligible station with the greatest positive speed, or reports that no station is within reach. If stations tie, the first one in the station list wins. A station exactly at its reach has speed zero and is not selected, as required by the “highest non-zero speed” rule.

### Network stations

| X | Y | Reach |
|---:|---:|---:|
| 0 | 0 | 9 |
| 20 | 20 | 6 |
| 10 | 0 | 12 |
| 5 | 5 | 13 |
| 99 | 25 | 2 |

### Device locations

`(0, 0)`, `(100, 100)`, `(15, 10)`, `(18, 18)`, `(13, 13)`, and `(25, 99)`.

## Requirements

- Node.js 18 or newer
- No third-party runtime or test dependencies

## Run

### Interactive browser interface

Open `index.html` in a browser. Choose one of the six assignment coordinates or enter a custom X/Y point. The coverage map, best-station result, and comparison table update immediately. The optional minimum-signal slider defaults to zero, preserving the assignment's highest-positive-speed rule; raising it hides matches below that score. Select the speed heading to sort the comparison table.

### Publish with GitHub Pages

The `Publish GitHub Pages` workflow runs the unit tests, packages only the browser files, and deploys them on pushes to `main` (or from **Actions → Publish GitHub Pages → Run workflow**). Once the first workflow run completes, find the live link in its deployment environment or under **Settings → Pages**. The expected URL is `https://<github-user>.github.io/<repository-name>/`.

The repository is intended to remain private for the assignment. GitHub Pages availability for private repositories depends on the account or organization plan. If GitHub reports that Pages is unavailable for this private repository, keep the repository private and use an eligible plan or another static host rather than making it public without authorization.

### Command line

```sh
node NetworkStation.js
```

The program prints one result for each of the six assignment coordinates.

## Test

```sh
node --test
```

The unit tests cover the complete assignment data, distance and speed calculations, best-station selection, out-of-range and exact-reach cases, tie behavior, output formatting, and invalid inputs.

## Design

- `NetworkStation.js` exports the data and pure calculation/formatting functions so they can be reused independently of the command-line entry point.
- `index.html`, `styles.css`, and `app.js` provide the responsive browser experience and map visualization without a framework or runtime dependencies.
- `test/NetworkStation.test.js` uses Node's built-in test runner.
- Input station and device records use `{ x, y }`; stations also contain `reach`.

## Expected output

```text
Best network station for point 0,0 is 0,0 with speed 81.00
No network station within reach for point 100,100
Best network station for point 15,10 is 5,5 with speed 3.31
Best network station for point 18,18 is 20,20 with speed 10.06
Best network station for point 13,13 is 5,5 with speed 2.84
No network station within reach for point 25,99
```

## Optional Azure deployment reference

The supplied [Azure deployment guide](Deploying%20the%20application%20to%20Azure%20using%20Vscode.pdf) describes a Visual Studio website package and legacy Azure PowerShell website cmdlets; those commands do not apply to this static HTML/JavaScript interface. Cloud hosting is optional. If desired, the browser UI can be hosted as a static site on Azure Storage or another static host; no cloud deployment is included here.

## Submission checklist

The original assignment asks for a **private** GitHub or GitLab repository, shared with `ncrecruitment`, and an email to your Nordcloud contact when finished. Do not commit credentials or secrets.

Both the CLI and browser interface can be evaluated locally; no cloud resources are required.
