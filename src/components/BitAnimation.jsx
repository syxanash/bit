import { useEffect, useRef, useState } from 'react';

import bitIdle1 from '../assets/bit_idle_1.gif';
import bitIdle2 from '../assets/bit_idle_2.gif';
import bitYes from '../assets/bit_yes.gif';
import bitNo from '../assets/bit_no.gif';

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

function BitAnimation({ bitValue }) {
  const [bitIdleStatus, setBitIdleStatus] = useState(true);

  useEffect(() => {
    const images = [bitIdle1, bitIdle2, bitYes, bitNo];
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useInterval(() => {
    setBitIdleStatus(!bitIdleStatus);
  }, 500);

  if (bitValue === undefined) {
    const src = bitIdleStatus ? bitIdle1 : bitIdle2;
    return <img src={src} width='60%' alt='bit' loading="eager" />
  }

  if (bitValue) {
    return <img src={bitYes} width='60%' alt='Bit YES' loading="eager" />
  } else {
    return <img src={bitNo} width='60%' alt='Bit NO' loading="eager" />
  }
};

export default BitAnimation;