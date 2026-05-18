export default function Home() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <div className="brand">GoalTrack Portal</div>
        <nav className="site-nav">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
        <button className="login-button">Login</button>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <span className="eyebrow">Enterprise Edition </span>
          <h1>Goal Setting & Tracking Portal</h1>
          <p>
            Track employee goals, approvals, quarterly achievements, and organizational performance with precision-engineered analytics.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="/login">
              Login to Dashboard
            </a>

            <a className="button secondary" href="#demo">
              View Demo
            </a>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-card">
            <div className="hero-card__top">
              <div className="hero-card__label">Performance Snapshot</div>
              <div className="hero-card__chip">Enterprise</div>
            </div>
            <div className="chart-grid">
              <div className="chart-panel panel-primary">
                <div className="chart-header">
                  <span>Revenue</span>
                  <strong>+24%</strong>
                </div>
                <div className="bar-chart">
                  <span className="bar bar-large" />
                  <span className="bar bar-medium" />
                  <span className="bar bar-small" />
                </div>
              </div>
              <div className="chart-panel panel-secondary">
                <div className="chart-header">
                  <span>Goals Closed</span>
                  <strong>78%</strong>
                </div>
                <div className="mini-chart">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="chart-panel panel-accent">
                <div className="chart-header">
                  <span>Check-ins</span>
                  <strong>92%</strong>
                </div>
                <div className="timeline-chart">
                  <span className="dot dot-active" />
                  <span className="dot" />
                  <span className="dot" />
                  <span className="line" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-section" id="features">
        <div className="section-heading">
          <p className="section-subtitle">Core Performance Features</p>
          <h2>Everything you need to manage enterprise productivity.</h2>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <h3>Goal Management</h3>
            <p>Set SMART goals with hierarchical alignment to company objectives and individual KPIs.</p>
          </article>
          <article className="feature-card">
            <h3>Analytics Dashboard</h3>
            <p>Real-time visualization of team performance, completion rates, and historical growth metrics.</p>
          </article>
          <article className="feature-card">
            <h3>Quarterly Tracking</h3>
            <p>Iterative tracking of achievements with automatic rollovers for long-term projects.</p>
          </article>
          <article className="feature-card">
            <h3>Manager Approvals</h3>
            <p>Streamlined workflow for reviewing, adjusting, and approving individual goal sets.</p>
          </article>
          <article className="feature-card">
            <h3>Audit Logs</h3>
            <p>Complete historical trail of all goal adjustments and approval statuses for compliance.</p>
          </article>
        </div>
      </section>

      <section className="roles-section" id="about">
        <div className="section-heading">
          <p className="section-subtitle">Tailored Experiences</p>
          <h2>Permissions and tools built for every level of the organization.</h2>
        </div>
        <div className="roles-grid">
          <div className="role-card">
            <h3>Employee</h3>
            <p>Personal goal dashboard, achievement updates, and feedback notifications.</p>
          </div>
          <div className="role-card role-card--featured">
            <div className="role-badge">Most Popular</div>
            <h3>Manager</h3>
            <p>Team overview metrics, bulk approval workflows, and one-on-one prep tools.</p>
          </div>
          <div className="role-card">
            <h3>Administrator</h3>
            <p>Org-wide configurations, data export & API logs, and user role management.</p>
          </div>
        </div>
      </section>

      <section className="workflow-section">
        <div className="section-heading">
          <p className="section-subtitle">Seamless Approval Workflow</p>
          <h2>How GoalTrack automates your performance cycle.</h2>
        </div>
        <div className="workflow-grid">
          <div className="workflow-step">
            <div className="workflow-icon">1</div>
            <h4>Employee</h4>
            <p>Drafts quarterly goals and aligns them with key initiatives.</p>
          </div>
          <div className="workflow-step">
            <div className="workflow-icon">2</div>
            <h4>Manager</h4>
            <p>Reviews performance targets, provides feedback, and approves.</p>
          </div>
          <div className="workflow-step">
            <div className="workflow-icon">3</div>
            <h4>HR/Admin</h4>
            <p>Finalizes performance data for organizational reporting.</p>
          </div>
        </div>
      </section>

      <section className="cta-section" id="contact">
        <div>
          <h2>Ready to boost your organizational momentum?</h2>
          <p>Join over 500 enterprise companies using GoalTrack to align their workforce and drive measurable results.</p>
        </div>
        <div className="cta-actions">
          <button className="button primary">Get Started Free</button>
          <button className="button secondary">Talk to Sales</button>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">GoalTrack</div>
        <div className="footer-links">
          <div>
            <p className="footer-title">Product</p>
            <a href="#features">Features</a>
            <a href="#about">Integrations</a>
            <a href="#contact">Pricing</a>
            <a href="#contact">Changelog</a>
          </div>
          <div>
            <p className="footer-title">Support</p>
            <a href="#contact">Documentation</a>
            <a href="#contact">API Reference</a>
            <a href="#contact">Contact Support</a>
            <a href="#contact">SLA</a>
          </div>
          <div>
            <p className="footer-title">Legal</p>
            <a href="#contact">Privacy Policy</a>
            <a href="#contact">Terms of Service</a>
            <a href="#contact">Security Policy</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
