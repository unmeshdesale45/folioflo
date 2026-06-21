import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders landing page by default', () => {
    render(<App />);
    expect(screen.getByText(/Welcome to FolioFlo/i)).toBeInTheDocument();
  });
});
