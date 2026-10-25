import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // The h1 must be present
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('displays the Atlas Library title', () => {
    render(<App />);
    expect(screen.getByText('Atlas Library')).toBeInTheDocument();
  });

  it('shows the system status badge', () => {
    render(<App />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('System ready')).toBeInTheDocument();
  });

  it('shows the Phase 1 note', () => {
    render(<App />);
    expect(screen.getByText(/Phase 1/i)).toBeInTheDocument();
  });
});
