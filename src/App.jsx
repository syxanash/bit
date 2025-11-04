
import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSound from 'use-sound';
import { Wllama } from '@wllama/wllama';
import wllamaSingle from '@wllama/wllama/src/single-thread/wllama.wasm?url';
import wllamaMulti from '@wllama/wllama/src/multi-thread/wllama.wasm?url';

import yesSound from './assets/sounds/yes.mp3';
import noSound from './assets/sounds/no.mp3';
import beepSound from './assets/sounds/beep.mp3';

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
  const [yesPlay] = useSound(yesSound);
  const [noPlay] = useSound(noSound);
  const [beepPlay] = useSound(beepSound);

  const [bitIdleStatus, setBitIdleStatus] = useState(true);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [inputSubmitted, setInputSubmitted] = useState(false);
  const [inputQuestion, setInputQuestion] = useState(undefined);
  const [bitValue, setBitValue] = useState(undefined);
  const [percentageLoad, setPercentageLoad] = useState(undefined);

  const [messages, setMessages] = useState([
    { role: 'system', content: 'you are a binary answer bot. You can only respond with single word "YES" or "NO". do not provide explanation, punctuation or other text.' },
    { role: 'user', content: 'is the water wet?' },
    { role: 'assistant', content: 'YES' },
    { role: 'user', content: 'is planet earth flat?' },
    { role: 'assistant', content: 'NO' },
  ]);

  const wllamaInstance = useRef(undefined);

  const progressCallback = useCallback(({ loaded, total }) => {
    const progressPercentage = Math.round((loaded / total) * 100);
    setPercentageLoad(progressPercentage);

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
      {
        progressCallback,
        n_ctx: 4096,
        n_batch: 512,
        n_threads: Math.max(1, navigator.hardwareConcurrency || 1),
      }
    )

    setModelLoaded(true);
  }, [progressCallback]);

  useInterval(() => {
    if (modelLoaded)
      setBitIdleStatus(!bitIdleStatus);
  }, 500);

  const askQuestion = useCallback(async () => {
    if (!inputQuestion || !inputQuestion.trim()) return;

    setInputSubmitted(true);

    beepPlay();

    console.log('askQuestion:', inputQuestion)

    const userMsg = { role: 'user', content: inputQuestion };
    const messagesForRequest = [...messages, userMsg];
    setMessages(messagesForRequest);

    const config = {
      seed: 42,
      temp: 0.0,
      top_p: 0.95,
      top_k: 40,
    };

    await wllamaInstance.current.samplingInit(config);

    const options = {
      nPredict: 10,
      sampling: config,
      useCache: true,
      stream: false,
    }

    const response = await wllamaInstance.current.createChatCompletion(messagesForRequest, options);

    console.log('assistant response raw:', response);

    const assistantContent = (response || '').trim();

    const assistantMsg = { role: 'assistant', content: assistantContent };
    setMessages((prev) => [...prev, assistantMsg]);

    const normalized = assistantContent.toUpperCase();
    const firstWord = normalized.split(/\s+/)[0];
    setBitValue(firstWord === 'YES');

    firstWord === 'YES'
      ? yesPlay()
      : noPlay();
    
    setInputSubmitted(false);

    setTimeout(() => {
      setBitValue(undefined);
    }, 800);
  }, [beepPlay, inputQuestion, messages, noPlay, yesPlay])

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
      <button disabled={inputSubmitted} onClick={askQuestion}>Ask</button>
    </React.Fragment>
  }

  return <React.Fragment>
    <button onClick={loadModel}>WAKE UP</button>
    {
      percentageLoad !== undefined
        ? <div>
          <span>Downloading... {percentageLoad}%</span>
        </div>
        : null
    }
  </React.Fragment>
}

export default App;
