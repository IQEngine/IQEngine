import React from 'react';

interface ModalProps {
  heading: string;
  setShowModal: any;
  children: any;
}
export const ModalDialog = ({
    heading,
    setShowModal,
    children}: ModalProps) => {

      return (
        <dialog aria-label={'Modal Dialog'} className="modal modal-open w-full h-full">
            <div className="modal-box">
                <h3 className="font-bold text-lg text-primary">{heading}</h3>
                <button
                    aria-label={'Close Button'}
                    className="absolute right-2 top-2 bg-base-100 text-primary font-bold"
                    onClick={() => {
                        setShowModal(false);
                      }}
                >
                ✕
                </button>
                {children}
            </div>
        </dialog>
      );
}
