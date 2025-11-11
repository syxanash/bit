import React, { useCallback, useState } from 'react';

import mainDisc from '../assets/disc/cutout-disc.png';
import ring0 from '../assets/disc/ring-0.png';
import ring1 from '../assets/disc/ring-1.png';
import ring2 from '../assets/disc/ring-2.png';
import ring3 from '../assets/disc/ring-3.png';
import ring4 from '../assets/disc/ring-4.png';
import ring5 from '../assets/disc/ring-5.png';
import applelogo from '../assets/apple-logo.png';

import './LoadingScreen.css';

function LoadingScreen({ percentage }) {
  const [isClicked, setIsClicked] = useState(false);

  const renderInnerRings = useCallback(() => {
    const rings = [ring1, ring2, ring3, ring4, ring5];
    const filledRings = Math.floor((percentage * 5) / 100);

    return rings.slice(0, filledRings).map((ring, index) => (
      <img
        key={`ring-${index}`}
        src={ring}
        alt="Loading Ring"
        className='ring'
      />
    ));
  }, [percentage]);

  return (<React.Fragment>
    <div className='loading-text' style={{ display: percentage > 0 ? 'block' : 'none' }}>
      <span>Loading... {percentage}%</span>
    </div>
    <div className='best-viewed'>
      <span>Best viewed on <img src={applelogo} alt='Apple'></img>Silicon</span>
    </div>
    <div className={`container ${isClicked ? 'clicked' : ''}`}>
      <div
        className='imageWrapper float-animation'
        onMouseDown={() => setIsClicked(true)}
        onClick={() => setIsClicked(true)}
        onMouseUp={() => setIsClicked(false)}
        onMouseLeave={() => setIsClicked(false)}
      >
        <img
          key={`ring-0`}
          src={ring0}
          alt="Loading Ring"
          className='ring'
          style={{ display: percentage > 0 ? 'block' : 'none' }}
        />
        {renderInnerRings()}
        <img src={mainDisc} alt="Main Disc" className='mainDisc' />
      </div>
    </div>
  </React.Fragment>);
}

export default LoadingScreen;