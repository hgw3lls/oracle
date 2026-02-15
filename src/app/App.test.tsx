import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('HYPNAGNOSIS app shell', () => {
  it('renders key usability controls', () => {
    render(<App />);
    expect(screen.getByText('HYPNAGNOSIS Prompt Builder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Series' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Extract Palette from Image' })).toBeInTheDocument();
    expect(screen.getByText('Output Prompt')).toBeInTheDocument();
  });
});
