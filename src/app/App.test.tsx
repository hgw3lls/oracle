import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

describe('HYPNAGNOSIS app shell', () => {
  it('renders mode switch and Oracle by default', () => {
    render(<App />);
    expect(screen.getAllByText('Mode Switch')[0]).toBeInTheDocument();
    expect(screen.getAllByRole('tab', { name: 'Oracle' })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('tab', { name: 'Graphic Notation' })[0]).toBeInTheDocument();
    expect(screen.getAllByText('HYPNAGNOSIS Prompt Builder')[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Generate' })[0]).toBeInTheDocument();
  });

  it('keeps Oracle state when switching modes', () => {
    render(<App />);

    const oracleSection = document.querySelector('section[aria-hidden="false"]') as HTMLElement;
    const subject = within(oracleSection).getByLabelText('Subject') as HTMLInputElement;
    fireEvent.change(subject, { target: { value: 'Persistent Oracle Subject' } });

    fireEvent.click(screen.getAllByRole('tab', { name: 'Graphic Notation' })[0]);
    expect(screen.getAllByText('Graphic Notation builder (coming online)')[0]).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('tab', { name: 'Oracle' })[0]);
    const visibleOracleSection = document.querySelector('section[aria-hidden="false"]') as HTMLElement;
    expect(within(visibleOracleSection).getByLabelText('Subject')).toHaveValue('Persistent Oracle Subject');
  });
});
