import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModalDialog } from '../Modal';
import React, { useState } from 'react';
import userEvent from '@testing-library/user-event';

describe('Modal component', () => {

  const ModalComponent = () => {
    const [showModal, setShowModal] = useState(true);
    return (
      <>
        {/* Render the ModalDialog component with the state */}
        <ModalDialog heading="Test Modal" setShowModal={setShowModal}>
          <div>Modal content</div>
        </ModalDialog>
        {/* Check if the Close Button is present */}
        {showModal && (
          <button
            aria-label="Close Button"
            className="absolute right-2 top-2 bg-base-100 text-primary font-bold"
            onClick={() => {
              setShowModal(false);
            }}
          >
            ✕
          </button>
        )}
      </>
    );
  };

  test('Basic rendering', async () => {
    render(<ModalComponent />); // Render the test component

    expect(screen.getByRole('button', { name: 'Close Button' }));
  });

  test('Close button closes modal', async () => {
    render(<ModalComponent />);
    const user = userEvent.setup();
    expect(screen.getByRole('button', { name: 'Close Button' }));
    await user.click(await screen.findByRole('button', { name: 'Close Button' }));
    expect(screen.getByRole('button', { name: 'Close Button', hidden: true }));
  });
});
