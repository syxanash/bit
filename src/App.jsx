
import React, { useState, useRef, useCallback } from 'react';
import useSound from 'use-sound';
import { Wllama } from '@wllama/wllama';
import wllamaSingle from '@wllama/wllama/src/single-thread/wllama.wasm?url';
import wllamaMulti from '@wllama/wllama/src/multi-thread/wllama.wasm?url';

import BIT_STATUSES from './bit';
import BitAnimation from './components/BitAnimation';
import LoadingScreen from './components/LoadingScreen';

import './App.css';
import './assets/magic/magic.css';

import yesSound from './assets/sounds/yes.mp3';
import superYesSound from './assets/sounds/superYes.mp3';
import noSound from './assets/sounds/no.mp3';
import superNoSound from './assets/sounds/superNo.mp3';
import beepSound from './assets/sounds/beep.mp3';
import errorSound from './assets/sounds/error.mp3';
import arrowIcon from './assets/arrow-turn-down-left.svg';

function App() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [inputSubmitted, setInputSubmitted] = useState(false);
  const [inputQuestion, setInputQuestion] = useState(undefined);
  const [bitValue, setBitValue] = useState(BIT_STATUSES.IDLE);
  const [errorDetected, setErrorDetected] = useState(false);
  const [percentageLoad, setPercentageLoad] = useState(0);

  const inputRef = useRef(null);

  const handleBitClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const animationEnded = useCallback(() => {
    setBitValue(BIT_STATUSES.IDLE);
    setInputSubmitted(false);
    setInputQuestion('');
  }, []);

  const [yesPlay] = useSound(yesSound, { preload: true, onend: animationEnded });
  const [superYesPlay] = useSound(superYesSound, { preload: true, onend: animationEnded });
  const [noPlay] = useSound(noSound, { preload: true, onend: animationEnded });
  const [superNoPlay] = useSound(superNoSound, { preload: true, onend: animationEnded });
  const [errorPlay] = useSound(errorSound, {
    preload: true,
    onend: () => {
      setErrorDetected(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  });
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

    wllamaInstance.current = new Wllama(WLLAMA_CONFIG_PATHS, { allowOffline: false });
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

    console.log('question:', inputQuestion)

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

    console.log('response:', response);

    const assistantContent = (response || '').trim();

    const assistantMsg = { role: 'assistant', content: assistantContent };
    setMessages((prev) => [...prev, assistantMsg]);

    const normalized = assistantContent.toUpperCase();

    switch (normalized) {
      case "LOUD YES":
        setBitValue(BIT_STATUSES.YES);
        superYesPlay();
        break;
      case "LOUD NO":
        setBitValue(BIT_STATUSES.NO);
        superNoPlay();
        break;
      case "YES":
        setBitValue(BIT_STATUSES.YES);
        yesPlay()
        break;
      case "NO":
        setBitValue(BIT_STATUSES.NO);
        noPlay();
        break;
      default:
        setBitValue(BIT_STATUSES.NO);
        errorPlay();
        break;
    }

    beepStop();
  }, [inputQuestion, beepPlay, messages, beepStop, superYesPlay, superNoPlay, yesPlay, noPlay, errorPlay])

  const renderMainScreen = useCallback(() => {
    return <React.Fragment>
      <div className='controls' style={errorDetected ? { display: 'none' } : {}}>
        <input
          ref={inputRef}
          name='question'
          placeholder={inputQuestion === undefined ? 'hello?' : ''}
          className='question-input'
          value={inputQuestion || ''}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !inputSubmitted) {
              askQuestion();
            }
          }}
        ></input>
        <button className='main-button' disabled={inputSubmitted} onClick={askQuestion}>
          <img src={arrowIcon} alt="Submit" />
        </button>
      </div>
      <div className='animation-wrapper' onClick={handleBitClick}>
        <div className={`magictime ${errorDetected ? 'foolishOut' : 'foolishIn'}`}>
          <BitAnimation bitValue={bitValue} thinking={inputSubmitted} />
        </div>
      </div>
    </React.Fragment>
  }, [askQuestion, bitValue, errorDetected, handleBitClick, inputQuestion, inputSubmitted]);

  const renderLoadingScreen = useCallback(() => {
    return <React.Fragment>
      <div className='loading-screen'>
        <div className='loading-button' onClick={loadModel}>
          <LoadingScreen percentage={percentageLoad} />
        </div>
      </div>
    </React.Fragment>
  }, [loadModel, percentageLoad]);

  return <div className='app-container'>
    {modelLoaded ? renderMainScreen() : renderLoadingScreen()}
  </div>
}

export default App;
