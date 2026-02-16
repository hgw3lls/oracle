import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

describe('HYPNAGNOSIS app shell', () => {
  it('renders mode switch and Oracle by default', () => {
    render(<App />);
    expect(screen.getAllByText('Mode Switch')[0]).toBeInTheDocument();
    expect(screen.getAllByRole('tab', { name: 'Oracle' })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('tab', { name: 'Graphic Notation' })[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Mode:/)[0]).toBeInTheDocument();
    expect(screen.getAllByText('HYPNAGNOSIS Prompt Builder')[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Generate' })[0]).toBeInTheDocument();
    expect(screen.getAllByText('Oracle Output')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Oracle Preset Packs')[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Reset mode state' })[0]).toBeInTheDocument();
  });

  it('keeps Oracle state when switching modes', () => {
    render(<App />);

    const subject = screen.getAllByLabelText('Subject')[0] as HTMLInputElement;
    fireEvent.change(subject, { target: { value: 'Persistent Oracle Subject' } });

    fireEvent.click(screen.getAllByRole('tab', { name: 'Graphic Notation' })[0]);
    expect(screen.getAllByText('Graphic Notation PromptGen')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Master Prompt')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Graphic Notation Preset Packs')[0]).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('tab', { name: 'Oracle' })[0]);
    expect(screen.getAllByLabelText('Subject')[0]).toHaveValue('Persistent Oracle Subject');
  });

  it('restores last selected mode from localStorage', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('tab', { name: 'Graphic Notation' })[0]);
    expect(window.localStorage.getItem('app:mode')).toBe('graphicNotation');
  });
});
