import React, { useEffect, useRef, useState } from 'react';

const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="confirm-overlay">
    <div className="confirm-dialog">
      <p>{message}</p>
      <div className="confirm-actions">
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>Close</button>
      </div>
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, showCloseConfirm = true }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        if (showCloseConfirm) {
          setShowConfirm(true);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, showCloseConfirm]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (showCloseConfirm) {
        setShowConfirm(true);
      } else {
        onClose();
      }
    }
  };

  const handleConfirmClose = () => {
    setShowConfirm(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirm(false);
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-container" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button
            className="modal-close-btn"
            onClick={() => showCloseConfirm ? setShowConfirm(true) : onClose()}
          >
            &times;
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
      {showConfirm && (
        <ConfirmDialog
          message="Do you want to close this popup? Any unsaved changes will be lost."
          onConfirm={handleConfirmClose}
          onCancel={handleCancelClose}
        />
      )}
    </div>
  );
};

export default Modal;
