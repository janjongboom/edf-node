# TypeScript EDF+ parser

Parser for the [EDF+](http://www.edfplus.info/specs/edf.html) data format, written in TypeScript. Based on [edf-node](https://github.com/korob93/edf-node) by Dmitry Vorobev. It parses both data and annotations files, see the [test](test/) folder.

## Conversion of EDF+ files to Edge Impulse

An example script that transforms EDF+ files (plus annotations) to the Edge Impulse Data Acquisition format is listed in [test/edge-impulse.ts](test/edge-impulse.ts). Use it via:

```
$ tsc -p . && node build/test/edge-impulse.js
$ edge-impulse-uploader out/sleep-stage-*
```
