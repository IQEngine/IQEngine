import React, { useRef } from 'react';
import { useOnClickOutside } from 'usehooks-ts';


interface ModalProps {
  heading: string;
  setShowModal: any;
  children: any;
  isFullWidth?: boolean;
}
export const ModalDialog = ({
    heading,
    setShowModal,
    children,
    isFullWidth
  }: ModalProps) => {

      const ref = useRef(null);
      useOnClickOutside(ref, () => {
        setShowModal(false)
      });

      const modalBoxStyling = isFullWidth ? "modal-box max-w-full" : "modal-box"

      return (
        <dialog aria-label={'Modal'} className="modal modal-open w-full h-full">
            <div className={modalBoxStyling}>
                <h3 className="font-bold text-lg text-primary">{heading}</h3>
                <button
                    aria-label={'Close'}
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
