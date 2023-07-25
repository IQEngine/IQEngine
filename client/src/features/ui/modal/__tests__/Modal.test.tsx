import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ModalDialog } from '../Modal';
import React, { useState } from 'react';

describe('Modal component', () => {
  const VisibleModalComponent = () => {
    const [showModal, setShowModal] = useState(true);
    return (
      <p>
      <>
      {showModal &&
        <ModalDialog heading="Test Modal" setShowModal={setShowModal}>
          <div>Modal content</div>
        </ModalDialog>}
      </>
      </p>
    );
  };

  const InvisibleModalComponent = () => {
    const [showModal, setShowModal] = useState(false);
    return (
      <p>
      <>
      {showModal &&
        <ModalDialog heading="Test Modal" setShowModal={setShowModal}>
          <div>Modal content</div>
        </ModalDialog>}
      </>
      </p>
    );
  };

  test('Basic rendering', async () => {
    render(<VisibleModalComponent />);
    const modal = await screen.findByLabelText('Modal')
    expect(modal).toBeInTheDocument();
  });

  test('Basic not rendering', async () => {
    render(<InvisibleModalComponent />);
    const modal = await screen.queryByLabelText('Modal')
    expect(modal).not.toBeInTheDocument();
  });

  test('Modal close button removes modal from DOM', async () => {
    render(<VisibleModalComponent />);
    const modal = await screen.findByLabelText('Modal')
    expect(modal).toBeInTheDocument();
    const closeButton = await screen.findByLabelText('Close');
    await userEvent.click(closeButton);
    expect(modal).not.toBeInTheDocument();
  })
});
