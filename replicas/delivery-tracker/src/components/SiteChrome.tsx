import { useState } from 'react';
import { agency, projects } from '../data';
import { MenuIcon } from './Icons';

const NAV = ['Our work', 'Services', 'Studio', 'Tracker', 'Contact'];

/** Placeholder brand mark: plain text in a tilted tile, no logo. */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <a className={`brand${compact ? ' brand--compact' : ''}`} href="#/" aria-label={`${agency.name} home`}>
      <span className="brand__tile">
        <span>FS</span>
      </span>
      <span className="brand__text">
        Fieldwork
        <br />
        Studio
      </span>
    </a>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <button type="button" className="site-header__menu" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <MenuIcon />
        </button>
        <BrandMark />
        <nav className="site-nav" aria-label="Main">
          {NAV.map((item) => (
            <a key={item} href={item === 'Tracker' ? '#/' : undefined} className={`site-nav__item${item === 'Tracker' ? ' is-active' : ''}`}>
              {item}
            </a>
          ))}
        </nav>
        <div className="site-header__right">
          <a className="site-header__signin">
            Client sign in
            <br />& see all projects
          </a>
          <a className="site-header__projects" href="#/">
            <span className="site-header__badge">{projects.length}</span>
            <svg viewBox="0 0 30 24" width="30" height="24" aria-hidden="true">
              <path d="M2 4a2 2 0 012-2h7l3 3h12a2 2 0 012 2v13a2 2 0 01-2 2H4a2 2 0 01-2-2z" fill="none" stroke="currentColor" strokeWidth="2.4" />
            </svg>
            <span>Projects</span>
          </a>
        </div>
      </div>
      {open && (
        <nav className="site-drawer" aria-label="Mobile">
          {NAV.map((item) => (
            <a key={item} href={item === 'Tracker' ? '#/' : undefined} onClick={() => setOpen(false)} className={item === 'Tracker' ? 'is-active' : ''}>
              {item}
            </a>
          ))}
          <a onClick={() => setOpen(false)}>Client sign in</a>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <ul>
          <li>About us</li>
          <li>Careers</li>
          <li>Privacy</li>
          <li>Terms of use</li>
          <li>Accessibility</li>
          <li>Contact</li>
        </ul>
        <p>
          © 2026 {agency.name}. Internal design reference with mock data. {agency.trackerName}® is a placeholder name.
        </p>
      </div>
    </footer>
  );
}
