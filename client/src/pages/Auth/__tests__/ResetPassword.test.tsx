import { describe, it, expect, vi } from 'vitest';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPassword from '../ResetPassword';
import { ToastProvider } from '../../../contexts/ToastContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../lib/api', () => ({
  api: {
    post: vi.fn((path) => {
      if (path === '/auth/reset-password') {
        return Promise.resolve({ data: { message: 'Password reset successful' } });
      }
      return Promise.resolve({ data: {} });
    })
  }
}));

describe('ResetPassword', () => {
  it('resets password and shows success toast', async () => {
    // Provide token via query param in router
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/reset-password?token=abc123"]}>
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: 'newpassword' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'newpassword' } });

    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

    await waitFor(() => expect(screen.getByText(/Password reset successful/i)).toBeInTheDocument());
  });
});
