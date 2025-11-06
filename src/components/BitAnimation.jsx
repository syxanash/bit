import { useEffect, useRef, useState } from 'react';

import BIT_STATUSES from '../bit';

import './BitAnimation.css';

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

function BitAnimation({ bitValue, thinking }) {
  const [bitIdleStatus, setBitIdleStatus] = useState(bitValue);

  useEffect(() => {
    const images = [bitIdle1, bitIdle2, bitYes, bitNo];
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useInterval(() => {
    // use functional update to avoid stale closure
    setBitIdleStatus(s => !s);
  }, thinking ? 150 : 1000);

  const renderIdleBit = () => {
    const src = bitIdleStatus ? bitIdle1 : bitIdle2;
    return <img className="bit-img" src={src} alt="bit" loading="eager" />;
  }

  const renderAliveBit = () => {
    if (bitValue === BIT_STATUSES.YES) {
      return <img className="bit-img" src={bitYes} alt="Bit YES" loading="eager" />;
    } else {
      return <img className="bit-img" src={bitNo} alt="Bit NO" loading="eager" />;
    }
  };

  return (
    <div className="bit-animation">
      {bitValue === BIT_STATUSES.IDLE ? renderIdleBit() : renderAliveBit()}
    </div>
  );
};

export default BitAnimation;