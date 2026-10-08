import type { ReactNode } from 'react';
import { I } from '../icons';
import { setUI } from '../ui';
import { cx } from '../util';

export function Topbar({ left, tabs, right }: { left: ReactNode; tabs?: { id: string; label: string; href: string; active: boolean; icon?: ReactNode }[]; right?: ReactNode }) {
  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" aria-label="Open sidebar" onClick={() => setUI({ sidebarOpen: true })}>
        <I.menu size={16} />
      </button>
      <div className="crumbs">{left}</div>
      {tabs && (
        <div className="tabs" role="tablist">
          {tabs.map((t) => (
            <a key={t.id} href={t.href} className={cx('tab', t.active && 'active')} role="tab" aria-selected={t.active}>
              {t.icon}
              {t.label}
            </a>
          ))}
        </div>
      )}
      <div className="topbar-spacer" />
      <div className="topbar-right">{right}</div>
    </header>
  );
}
