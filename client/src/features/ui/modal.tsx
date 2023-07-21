import React from 'react';

export const ModalDialog = ({
    heading,
    setShowModal,
    children}) => {

      return (
        <dialog aria-label={heading} className="modal modal-open w-full h-full">
            <form method="dialog" className="modal-box">
                <h3 className="font-bold text-lg text-primary">{heading}</h3>
                <button
                    aria-label={{heading} + 'Close Button'}
                    className="absolute right-2 top-2 bg-base-100 text-primary font-bold"
                    onClick={() => {
                        setShowModal(false);
                      }}
                >
                 ✕
                </button>
                {children}
                </form>
                </dialog>
      );
}