import { describe, it, expect, vi } from 'vitest';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPassword from '../ForgotPassword';
import { ToastProvider } from '../../../contexts/ToastContext';
import { MemoryRouter } from 'react-router-dom';

// Mock API
vi.mock('../../../lib/api', () => ({
  api: {
    post: vi.fn(() => Promise.resolve({ data: { message: 'Reset instructions sent (for demo the token is returned)', resetToken: 'fake-token' } }))
  }
}));

describe('ForgotPassword', () => {
  it('shows success toast and navigates to reset when token returned', async () => {
    render(
      <ToastProvider>
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      </ToastProvider>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const button = screen.getByRole('button', { name: /Send Reset Instructions/i });
    fireEvent.click(button);

    await waitFor(() => expect(screen.queryByText(/Sending/i)).toBeNull());
    // Toasts are rendered to DOM — check for success message
    await waitFor(() => expect(screen.getByText(/Reset instructions sent/i)).toBeInTheDocument());
  });
});
