
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ollama } from 'ollama/browser';

import SystemPrompt from './systemPrompt';

const ollama = new Ollama({ host: '192.168.0.41:11434' });

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
  useInterval(() => {
    setBitIdleStatus(!bitIdleStatus);
  }, 500);

  const [bitIdleStatus, setBitIdleStatus] = useState(true);
  const [inputQuestion, setInputQuestion] = useState(undefined);
  const [bitValue, setBitValue] = useState(undefined);

  const askQuestion = useCallback(async () => {
    const response = await ollama.chat({
      model: 'gemma3:1b',
      messages: [{ role: 'user', content: SystemPrompt.prompt }, { role: 'user', content: inputQuestion }],
      think: false,
      stream: false,
      keep_alive: -1,
      format: SystemPrompt.format
    });

    const payload = JSON.parse(response.message.content);

    setBitValue(payload.bit === 'YES' ? true : false);

    setTimeout(() => {
      setBitValue(undefined);
    }, 800);
  }, [inputQuestion])

  const renderBit = useCallback(() => {
    if (bitValue === undefined) {
      return <img src={`/assets/bit_idle_${bitIdleStatus ? '1' : '2'}.gif`} alt='bit' />
    }

    if (bitValue) {
      return <img src={`/assets/bit_yes.gif`} alt='Bit YES' />
    } else {
      return <img src={`/assets/bit_no.gif`} alt='Bit NO' />
    }
  }, [bitIdleStatus, bitValue]);

  return <React.Fragment>
    {renderBit()}
    <input onChange={(e) => setInputQuestion(e.target.value)}></input>
    <button onClick={askQuestion}>Ask</button>
  </React.Fragment>
}

export default App;
