import React from 'react';

interface ModalProps {
  heading: string;
  setShowModal: (showModal: boolean) => boolean;
  children: any;
}
export const ModalDialog = ({
    heading,
    setShowModal,
    children}: ModalProps) => {

      return (
        <dialog aria-label={'Modal Dialog'} className="modal modal-open w-full h-full">
            <form method="dialog" className="modal-box">
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
            </form>
        </dialog>
      );
}
