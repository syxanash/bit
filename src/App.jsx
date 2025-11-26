
import React, { useState, useRef, useCallback, useEffect } from 'react';
import useSound from 'use-sound';

import { pipeline, TextStreamer } from "@huggingface/transformers";

import BIT from './bit';
import BitAnimation from './components/BitAnimation';
import LoadingScreen from './components/LoadingScreen';
import Dialog from './components/Dialog';

import './App.css';
import './assets/magic/magic.css';

import yesSound from './assets/sounds/yes.mp3';
import superYesSound from './assets/sounds/superYes.mp3';
import noSound from './assets/sounds/no.mp3';
import superNoSound from './assets/sounds/superNo.mp3';
import beepSound from './assets/sounds/beep.mp3';
import errorSound from './assets/sounds/error.mp3';

import arrowIcon from './assets/arrow-turn-down-left.svg';

const backgrounds = import.meta.glob('./assets/backgrounds/*.jpg', { eager: true, import: 'default' });

function pickRandomBackground(currentBg) {
  const bgArray = Object.values(backgrounds).filter(bg => bg !== currentBg);
  const randomIndex = Math.floor(Math.random() * bgArray.length);
  return bgArray[randomIndex];
}

function App() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [inputSubmitted, setInputSubmitted] = useState(false);
  const [inputQuestion, setInputQuestion] = useState(undefined);
  const [bitValue, setBitValue] = useState(BIT.STATUSES.IDLE);
  const [errorDetected, setErrorDetected] = useState(false);
  const [percentageLoad, setPercentageLoad] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bgImageLoaded, setBgImageLoaded] = useState(false);
  const [randomBG, setRandomBG] = useState(pickRandomBackground());
  const [inferenceEnabled, setInferenceEnabled] = useState(() => {
    const saved = localStorage.getItem('inferenceEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [cacheCleared, setCacheCleared] = useState(false);
  const [showBackground, setShowBackground] = useState(() => {
    const saved = localStorage.getItem('showBackground');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const inputRef = useRef(null);
  const generatorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('showBackground', JSON.stringify(showBackground));
  }, [showBackground]);

  useEffect(() => {
    localStorage.setItem('inferenceEnabled', JSON.stringify(inferenceEnabled));
  }, [inferenceEnabled]);

  const changeBackground = useCallback(() => {
    setRandomBG(prev => pickRandomBackground(prev));
  }, []);

  const handleBitClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const animationEnded = useCallback(() => {
    setBitValue(BIT.STATUSES.IDLE);
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
      role: 'system', content: BIT.SYSTEM_PROMPT
    },
  ]);

  const loadModel = useCallback(async () => {
    setPercentageLoad(1);

    if (!inferenceEnabled) {
      setModelLoaded(true);
      return;
    }

    generatorRef.current = await pipeline(
      "text-generation",
      "onnx-community/LFM2-350M-ONNX",
      {
        dtype: "q4",
        progress_callback: (prog) => {
          if (prog.status === 'progress') {
            setPercentageLoad(prog.progress);
          }
        },
      }
    );

    setModelLoaded(true);
  }, [inferenceEnabled]);

  const askQuestion = useCallback(async () => {
    if (!inputQuestion || !inputQuestion.trim()) return;

    setInputSubmitted(true);
    beepPlay();

    let reply = '';

    if (inferenceEnabled) {
      console.log('question:', inputQuestion)

      const userMsg = { role: 'user', content: inputQuestion };
      const messagesForRequest = [...messages, userMsg];
      setMessages(messagesForRequest);

      const grammar = 'root ::= " "? ("YES" | "NO" | "LOUD YES" | "LOUD NO")';

      const output = await generatorRef.current(messagesForRequest, {
        max_new_tokens: 5,
        do_sample: false,
        grammar: grammar,
        streamer: new TextStreamer(generatorRef.current.tokenizer, { skip_prompt: true, skip_special_tokens: true }),
      });

      const response = output[0].generated_text.at(-1).content;

      console.log('raw response:', response);

      const cleanResponse = response.split('\n').find(line => line.trim().length > 0) || "";
      const assistantContent = cleanResponse.trim();

      const assistantMsg = { role: 'assistant', content: assistantContent };
      setMessages((prev) => [...prev, assistantMsg]);

      reply = assistantContent.toUpperCase();
    } else {
      const answers = ['YES', 'NO', 'LOUD YES', 'LOUD NO'];

      // fake a delay to simulate thinking
      reply = await new Promise((resolve) => {
        setTimeout(() => {
          resolve(answers[Math.floor(Math.random() * answers.length)]);
        }, 2000);
      });
    }

    switch (reply) {
      case "LOUD YES":
        setBitValue(BIT.STATUSES.YES);
        superYesPlay();
        break;
      case "LOUD NO":
        setBitValue(BIT.STATUSES.NO);
        superNoPlay();
        break;
      case "YES":
        setBitValue(BIT.STATUSES.YES);
        yesPlay()
        break;
      case "NO":
        setBitValue(BIT.STATUSES.NO);
        noPlay();
        break;
      default:
        // Even with grammar, it's good to keep a fallback just in case
        console.warn('Unexpected reply:', reply);
        setBitValue(BIT.STATUSES.NO);
        errorPlay();
        break;
    }

    beepStop();
  }, [inputQuestion, beepPlay, inferenceEnabled, beepStop, messages, superYesPlay, superNoPlay, yesPlay, noPlay, errorPlay])
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
          <LoadingScreen percentage={percentageLoad} onDiscLoad={() => {
            const img = new Image();
            img.src = randomBG;
          }} />
        </div>
      </div>
    </React.Fragment>
  }, [loadModel, percentageLoad, randomBG]);

  const randomButtonDescription = inferenceEnabled
    ? `LLM won't be downloaded, Bit will randomly answer yes or no`
    : `Bit will answer using LLM inference`;

  const cacheButtonDescription = cacheCleared
    ? `Cache cleared!`
    : `Delete the cached model`;

  return <div className="app-root">
    <div className="image-container" style={{ display: showBackground ? 'block' : 'none' }}>
      {modelLoaded && (
        <img
          className="actual-image"
          src={randomBG}
          alt="background"
          style={{ display: bgImageLoaded ? 'block' : 'none' }}
          onLoad={() => setBgImageLoaded(true)}
        />
      )}
    </div>
    <div className='app-container'>
      {modelLoaded ? renderMainScreen() : renderLoadingScreen()}
      <button className='dialog-trigger-button' onClick={() => setIsDialogOpen(true)}>
        ?
      </button>
      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <h1>What is this?</h1>
        <p>
          This web experiment is inspired by <a href='https://tron.fandom.com/wiki/Bit'>Bit</a>, the iconic character from <i>Tron</i>.<br />
          The responses are generated by a <a href='https://huggingface.co/LiquidAI/LFM2-350M-GGUF/tree/main'>lightweight LLM</a> (only 229 MB!) running locally directly in your browser using <a href='https://github.com/ngxson/wllama'>Wllama</a>, a WebAssembly binding for llama.cpp. Performance may vary depending on your hardware, faster chips such as Apple Silicon will allow smoother inference.<br /><br />
          You can admire the beauty of those sharp polygons and perhaps use Bit as a rubber ducky, but please don't use it as a therapist...<br /><br />
          Source code available <a href='https://github.com/syxanash/bit'>here</a>. Deep-dive <a href='https://blog.simone.computer/bit-that-weighs-200mb'>blog post here</a>!<br /><br />
          This website is not affiliated with Disney in any way, please don't sue me I just love Tron.
        </p>
        <h2>Settings</h2>
        <div>
          <button className='dialog-button important' disabled={cacheCleared} onClick={() => { console.log('DOESNT WORK'); setCacheCleared(true); }}>Clear cache</button> ({cacheButtonDescription})
          <br />
          <br />
          <button className='dialog-button' onClick={() => setInferenceEnabled(!inferenceEnabled)}>{inferenceEnabled ? 'Disable' : 'Enable'} LLM</button> ({randomButtonDescription})
          <br />
          <h3>Background</h3>
          <button className='dialog-button' onClick={() => setShowBackground(!showBackground)}>{showBackground ? 'Hide' : 'Show'} Background</button>
          <button disabled={!showBackground} className='dialog-button' onClick={changeBackground}>Change Background</button>
        </div>
      </Dialog>
    </div></div>;
}

export default App;
