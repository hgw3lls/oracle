import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('HYPNAGNOSIS app shell', () => {
  it('renders modern layout controls', () => {
    render(<App />);
    expect(screen.getByText('HYPNAGNOSIS Prompt Builder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Series' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload Palette Image' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply Template' })).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
  });
});
