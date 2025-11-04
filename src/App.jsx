
import React, { useState, useRef, useCallback } from 'react';
import useSound from 'use-sound';
import { Wllama } from '@wllama/wllama';
import wllamaSingle from '@wllama/wllama/src/single-thread/wllama.wasm?url';
import wllamaMulti from '@wllama/wllama/src/multi-thread/wllama.wasm?url';

import BitAnimation from './components/BitAnimation';

import yesSound from './assets/sounds/yes.mp3';
import noSound from './assets/sounds/no.mp3';
import beepSound from './assets/sounds/beep.mp3';

function App() {
  const [yesPlay] = useSound(yesSound, { preload: true });
  const [noPlay] = useSound(noSound, { preload: true });
  const [beepPlay, { stop: beepStop }] = useSound(beepSound, { preload: true, loop: true });

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

    beepStop();

    setTimeout(() => {
      setBitValue(undefined);
    }, 800);
  }, [beepPlay, inputQuestion, messages, noPlay, beepStop, yesPlay])

  const renderBit = useCallback(() => {
    return (
      <BitAnimation
        bitValue={bitValue}
      />
    );
  }, [bitValue]);

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
