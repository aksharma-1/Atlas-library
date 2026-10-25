import './App.css';

/**
 * App — Root component (Phase 1 placeholder).
 *
 * This will be replaced with the authenticated shell, routing,
 * and layout components in Phase 2.
 */
function App() {
  return (
    <div className="app-root">
      <div className="hero-card">
        <div className="logo-wrap">
          <span className="logo-icon" aria-hidden="true">
            📚
          </span>
        </div>
        <h1 className="app-title">Atlas Library</h1>
        <p className="app-subtitle">Management System</p>
        <div className="status-badge" role="status" aria-label="System status: ready">
          <span className="status-dot" aria-hidden="true" />
          <span>System ready</span>
        </div>
        <p className="phase-note">Phase 1 — Foundation complete</p>
      </div>
    </div>
  );
}

export default App;
