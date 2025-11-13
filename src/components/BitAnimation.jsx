import { useEffect, useRef, useState } from 'react';

import BIT from '../bit';

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
  const [displayedAlert, setDisplayedAlert] = useState(false);

  useEffect(() => {
    let thinkingTimer;

    if (thinking && !displayedAlert) {
      thinkingTimer = setTimeout(() => {
        alert("if Bit takes too long to answer try disabling the LLM!");
        setDisplayedAlert(true);
      }, 8000);
    }

    return () => {
      if (thinkingTimer) {
        clearTimeout(thinkingTimer);
      }
    };
  }, [displayedAlert, thinking]);

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
    return <img className="bit-img no-drag" src={src} alt="bit" draggable={false}
      onDragStart={(e) => e.preventDefault()} loading="eager" />;
  }

  const renderAliveBit = () => {
    if (bitValue === BIT.STATUSES.YES) {
      return <img className="bit-img no-drag" src={bitYes} alt="Bit YES" draggable={false}
        onDragStart={(e) => e.preventDefault()} loading="eager" />;
    } else {
      return <img className="bit-img no-drag" src={bitNo} alt="Bit NO" draggable={false}
        onDragStart={(e) => e.preventDefault()} loading="eager" />;
    }
  };

  return (
    <div className="bit-animation">
      {bitValue === BIT.STATUSES.IDLE ? renderIdleBit() : renderAliveBit()}
    </div>
  );
};

export default BitAnimation;