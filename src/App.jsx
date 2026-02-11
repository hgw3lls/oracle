const features = [
  'Deploys automatically to GitHub Pages',
  'Powered by React + Vite',
  'Brutalist visual language: black, white, loud typography',
  'Built to evolve from Python POC to modern frontend',
];

export default function App() {
  return (
    <main className="page">
      <header className="hero block">
        <p className="label">ORACLE // WEB REBUILD</p>
        <h1>PYTHON WAS THE PROOF.<br />THIS IS THE PRODUCT.</h1>
        <p className="lead">
          A no-frills, brutalist React app with a CI/CD pipeline that publishes every push to GitHub Pages.
        </p>
      </header>

      <section className="block grid">
        {features.map((feature) => (
          <article key={feature} className="tile">
            <p>{feature}</p>
          </article>
        ))}
      </section>

      <section className="block cta">
        <h2>MAKE SMALL THINGS SHIP FAST.</h2>
        <p>
          Edit <code>src/App.jsx</code>, push, and your changes deploy through the GitHub Actions workflow.
        </p>
      </section>
    </main>
  );
}
