
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wllama } from '@wllama/wllama';
import wllamaSingle from '@wllama/wllama/src/single-thread/wllama.wasm?url';
import wllamaMulti from '@wllama/wllama/src/multi-thread/wllama.wasm?url';
import SystemPrompt from './systemPrompt';

import bitIdle1 from './assets/bit_idle_1.gif';
import bitIdle2 from './assets/bit_idle_2.gif';
import bitYes from './assets/bit_yes.gif';
import bitNo from './assets/bit_no.gif';

function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function App() {
  const [bitIdleStatus, setBitIdleStatus] = useState(true);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [inputQuestion, setInputQuestion] = useState(undefined);
  const [bitValue, setBitValue] = useState(undefined);

  const wllamaInstance = useRef(undefined);

  const progressCallback = useCallback(({ loaded, total }) => {
    // Calculate the progress as a percentage
    const progressPercentage = Math.round((loaded / total) * 100);
    // Log the progress in a user-friendly format
    console.log(`Downloading... ${progressPercentage}%`);
  }, []);

  const loadModel = useCallback(async () => {
    const WLLAMA_CONFIG_PATHS = {
      'single-thread/wllama.wasm': wllamaSingle,
      'multi-thread/wllama.wasm': wllamaMulti,
    };

    wllamaInstance.current = new Wllama(WLLAMA_CONFIG_PATHS);
    await wllamaInstance.current.loadModelFromUrl(
      'https://huggingface.co/LiquidAI/LFM2-350M-GGUF/resolve/main/LFM2-350M-Q4_K_M.gguf',
      { progressCallback }
    )

    setModelLoaded(true);
  }, [progressCallback]);

  useInterval(() => {
    setBitIdleStatus(!bitIdleStatus);
  }, 500);

  const askQuestion = useCallback(async () => {
    console.log(inputQuestion)

    const messages = [
      { role: 'system', content: 'you are a binary answer bot. You can only respond with single word "YES" or "NO". do not provide explanation, punctuation or other text.' },
      { role: 'user', content: 'is the water wet?' },
      { role: 'assistant', content: 'YES' },
      { role: 'user', content: 'is planet earth flat?' },
      { role: 'assitant', content: 'NO' },
      { role: 'user', content: inputQuestion }
    ]

    const options = {
    }

    const response = await wllamaInstance.current.createChatCompletion(messages, options);

    console.log(response);

    setBitValue(response === 'YES');

    setTimeout(() => {
      setBitValue(undefined);
    }, 800);
  }, [inputQuestion])

  const renderBit = useCallback(() => {
    if (bitValue === undefined) {
      const src = bitIdleStatus ? bitIdle1 : bitIdle2;
      return <img src={src} width='60%' alt='bit' />
    }

    if (bitValue) {
      return <img src={bitYes} width='60%' alt='Bit YES' />
    } else {
      return <img src={bitNo} width='60%' alt='Bit NO' />
    }
  }, [bitIdleStatus, bitValue]);

  if (modelLoaded) {
    return <React.Fragment>
      <div>
        {renderBit()}
      </div>
      <input onChange={(e) => setInputQuestion(e.target.value)}></input>
      <button onClick={askQuestion}>Ask</button>
    </React.Fragment>
  }

  return <React.Fragment>
    <button onClick={loadModel}>WAKE UP</button>
  </React.Fragment>
}

export default App;
