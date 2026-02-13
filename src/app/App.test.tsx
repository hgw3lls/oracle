import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('Hypnagnosis Oracle v2 shell', () => {
  it('renders shell title and tabs', () => {
    render(<App />);
    expect(screen.getByText('Hypnagnosis Oracle v2')).toBeInTheDocument();
    expect(screen.getByText('WIZARD')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('FRAMES')).toBeInTheDocument();
    expect(screen.getByText('PRESETS')).toBeInTheDocument();
  });
});
