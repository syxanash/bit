# Bit

<img src='https://github.com/user-attachments/assets/c3003fbe-0e31-404e-8409-bd7811f86a8a' height='250px' alt='bit'/><br />

Introducing [Bit](https://tron.fandom.com/wiki/Bit), just like in the movies but it runs entirely in your browser. It can only say _YES_ and _NO_ unless prompt injected in that case it'll simply run away...

![blog](https://raw.githubusercontent.com/syxanash/awesome-web-desktops/refs/heads/main/assets/notebook.png)[ Blog Post](https://blog.simone.computer/bit-that-weighs-200mb)

## Requirements

Node 22.13

## Setup and Installation

```sh
nvm use && npm i && npm run build
```

then run

```sh
npm run dev
```

## Self-hosting

The app can be freely self hosted anywhere you want as long as you can set up the COOP and COEP HTTP headers. These are required for running WebAssembly in multithreading mode, otherwise the inference will be much slower. See [Wllama's README](https://github.com/ngxson/wllama?tab=readme-ov-file#features)

You can experiment with other models as long as they're in gguf format. Just modify the constant `MODEL_URL` in `bit.js`.

## External Resources

* Main Bit STL 3D assets (CC BY 4.0): <https://www.printables.com/model/390903-bit/files>
* Disc STL 3D asset (CC BY 4.0): <https://www.thingiverse.com/thing:6145529>
* large language model used: [LFM2-350M](https://huggingface.co/LiquidAI/LFM2-350M-GGUF)
* Sounds sampled by the movie Tron 1982 _(Disney please don't sue me)_
