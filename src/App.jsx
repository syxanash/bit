
import React, { useState, useRef, useCallback } from 'react';
import useSound from 'use-sound';
import { Wllama } from '@wllama/wllama';
import wllamaSingle from '@wllama/wllama/src/single-thread/wllama.wasm?url';
import wllamaMulti from '@wllama/wllama/src/multi-thread/wllama.wasm?url';

import BitAnimation from './components/BitAnimation';

import yesSound from './assets/sounds/yes.mp3';
import superYesSound from './assets/sounds/superYes.mp3';
import noSound from './assets/sounds/no.mp3';
import superNoSound from './assets/sounds/superNo.mp3';
import beepSound from './assets/sounds/beep.mp3';
import errorSound from './assets/sounds/error.mp3';

function App() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [inputSubmitted, setInputSubmitted] = useState(false);
  const [inputQuestion, setInputQuestion] = useState('');
  const [bitValue, setBitValue] = useState(undefined);
  const [percentageLoad, setPercentageLoad] = useState(undefined);

  const animationEnded = useCallback(() => {
    setBitValue(undefined);
    setInputSubmitted(false);
    setInputQuestion('');
  }, []);

  const [yesPlay] = useSound(yesSound, { preload: true, onend: animationEnded });
  const [superYesPlay] = useSound(superYesSound, { preload: true, onend: animationEnded });
  const [noPlay] = useSound(noSound, { preload: true, onend: animationEnded });
  const [superNoPlay] = useSound(superNoSound, { preload: true, onend: animationEnded });
  const [errorPlay] = useSound(errorSound, { preload: true, onend: () => { animationEnded(); window.location.reload(); } });
  const [beepPlay, { stop: beepStop }] = useSound(beepSound, { preload: true, loop: true });

  const [messages, setMessages] = useState([
    {
      role: 'system', content: `You are a friendly binary answer bot. You can only respond with single word "YES" or "NO". do not provide explanation, punctuation or other text. To emphasize your answer, you can use "LOUD YES" or "LOUD NO".
Examples:
is the water wet?
YES
are you angry at me?
LOUD NO
is the planet earth flat?
NO
are you a bit?
LOUD YES` },
  ]);

  const wllamaInstance = useRef(undefined);

  const progressCallback = useCallback(({ loaded, total }) => {
    const progressPercentage = Math.round((loaded / total) * 100);
    setPercentageLoad(progressPercentage);
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

    switch (normalized) {
      case "LOUD YES":
        setBitValue(true);
        superYesPlay();
        break;
      case "LOUD NO":
        setBitValue(false);
        superNoPlay();
        break;
      case "YES":
        setBitValue(true);
        yesPlay()
        break;
      case "NO":
        setBitValue(false);
        noPlay();
        break;
      default:
        setBitValue(false);
        errorPlay();
        break;
    }

    beepStop();
  }, [inputQuestion, beepPlay, messages, beepStop, superYesPlay, superNoPlay, yesPlay, noPlay, errorPlay])

  const renderMainScreen = useCallback(() => {
    return <React.Fragment>
      <div>
        <BitAnimation bitValue={bitValue} />
      </div>
      <input value={inputQuestion} onChange={(e) => setInputQuestion(e.target.value)}></input>
      <button disabled={inputSubmitted} onClick={askQuestion}>Ask</button>
    </React.Fragment>
  }, [askQuestion, bitValue, inputQuestion, inputSubmitted]);

  const renderLoadingScreen = useCallback(() => {
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
  }, [loadModel, percentageLoad]);

  return <div>
    {modelLoaded ? renderMainScreen() : renderLoadingScreen()}
  </div>
}

export default App;
