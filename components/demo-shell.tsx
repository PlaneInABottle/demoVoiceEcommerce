'use client';

type DemoShellProps = {
  appName: string;
  agentName: string;
};

export function DemoShell({ appName, agentName }: DemoShellProps) {
  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">MVP demo</p>
          <h1>{appName}</h1>
          <p className="hero-copy">
            Ask the agent for product recommendations, comparisons, and support guidance using
            voice or typed input.
          </p>
        </div>
        <div className="agent-card">
          <span className="agent-card__label">Canonical agent</span>
          <strong>{agentName}</strong>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel transcript-panel">
          <header className="panel__header">
            <h2>Transcript</h2>
            <span className="status-pill">Waiting for session wiring</span>
          </header>
          <div className="empty-state">
            <p>No conversation yet.</p>
            <p>
              Phase 3 will connect this shell to LiveKit sessions and Phase 6 will add realtime
              transcript rendering.
            </p>
          </div>
        </article>

        <article className="panel controls-panel">
          <header className="panel__header">
            <h2>Session controls</h2>
          </header>
          <div className="control-stack">
            <button className="primary-button" type="button" disabled>
              Connect session
            </button>
            <button className="secondary-button" type="button" disabled>
              Disconnect
            </button>
            <p className="helper-copy">
              Secrets stay on the server. The browser will receive only a short-lived participant
              token from <code>/api/token</code>.
            </p>
          </div>
        </article>

        <aside className="panel sidebar-panel">
          <header className="panel__header">
            <h2>Featured products</h2>
          </header>
          <ul className="placeholder-list">
            <li>Noise-cancelling headphones</li>
            <li>Portable speakers</li>
            <li>Mechanical keyboards</li>
            <li>Travel chargers</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
