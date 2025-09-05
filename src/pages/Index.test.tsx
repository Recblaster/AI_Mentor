import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Index from './Index';
import { AuthProvider } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import * as toast from '@/components/ui/use-toast';

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    loading: false,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn(),
  },
}));

// Mock the toast module
const toastSpy = vi.spyOn(toast, 'toast');

describe('Index Page', () => {
  it('should call toast on session creation error', async () => {
    // Arrange
    const insertMock = supabase.from('sessions').insert;
    insertMock.mockRejectedValueOnce(new Error('Test error'));

    render(
      <BrowserRouter>
        <AuthProvider>
          <Index />
        </AuthProvider>
      </BrowserRouter>
    );

    // Act
    const settingsButton = screen.getByTestId('settings-button');
    fireEvent.click(settingsButton);

    const jarvisButton = await screen.findByText('Jarvis');
    fireEvent.click(jarvisButton);

    // Assert
    await vi.waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to create new session. Please try again.',
        variant: 'destructive',
      });
    });
  });
});
