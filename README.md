# Bit

![clideo_editor_98a9be4e5a044469b5217f6b3ba368fd-ezgif com-optimize](https://github.com/user-attachments/assets/a625fd6b-cd38-4139-b6b7-2eeaefaad864)

## Requirements

Node 22.13

## Setup and Installation

```sh
nvm use
npm i && npm run build
```

then run

```sh
npm run dev
```

## Self-hosting

The app can be freely self hosted anywhere you want as long as you can set up the COOP and COEP HTTP headers. These are required for running WebAssembly in multithreading mode, otherwise the inference will be much slower. See [Wllama's README](https://github.com/ngxson/wllama?tab=readme-ov-file#features)

## External Resources

* STL 3D assets (CC BY 4.0): <https://www.printables.com/model/390903-bit/files>
* Disc STL 3D asset (CC BY 4.0): <https://www.thingiverse.com/thing:6145529>
* large language model used: [LFM2-350M](https://huggingface.co/LiquidAI/LFM2-350M-GGUF)
* Sounds sampled by the movie Tron 1982 _(Disney please don't sue me)_
