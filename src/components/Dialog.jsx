import React from 'react';
import './Dialog.css';

import xmarkIcon from '../assets/x-mark.svg';

function Dialog({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="dialog-overlay" onClick={handleBackdropClick}>
      <div className="dialog-container">
        <div className="dialog-close-button" onClick={onClose} aria-label="Close dialog">
          <img src={xmarkIcon} style={{ height: '1.2em' }}alt="Submit" />
        </div>
        <div className="dialog-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Dialog;

