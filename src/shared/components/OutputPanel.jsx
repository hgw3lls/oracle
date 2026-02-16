export default function OutputPanel({ title, textOutput, jsonOutput }) {
  const safeText = typeof textOutput === 'string' ? textOutput : '';

  const copyText = async () => {
    await navigator.clipboard.writeText(safeText);
  };

  const copyJson = async () => {
    if (!jsonOutput) return;
    await navigator.clipboard.writeText(JSON.stringify(jsonOutput, null, 2));
  };

  const downloadText = () => {
    const blob = new Blob([safeText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'prompt-output.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section className="output-panel" aria-label={title}>
      <div className="output-panel-header">
        <h3>{title}</h3>
        <div className="output-panel-actions">
          <button type="button" onClick={copyText}>Copy</button>
          <button type="button" onClick={downloadText}>Download .txt</button>
          {jsonOutput ? <button type="button" onClick={copyJson}>Copy JSON</button> : null}
        </div>
      </div>
      <textarea value={safeText} readOnly />
    </section>
  );
}
