import { useMemo } from 'react';
import { CURRENT_USER_ID, initiatives } from '../data/mock';
import { Glyph, I } from '../icons';
import { useStore } from '../store';
import { href } from '../ui';
import { dayKey, dayLabel } from '../util';
import { Topbar } from '../components/Topbar';
import { UpdateItem } from '../components/UpdateItem';

export function PulsePage({ route }: { route: string[] }) {
  const s = useStore((s) => s);
  const tab = route[1] === 'popular' ? 'popular' : route[1] === 'recent' ? 'recent' : 'forme';
  const list = useMemo(() => {
    let ups = [...s.updates];
    if (tab === 'forme')
      ups = ups.filter((u) => {
        if (u.initiativeId) return true;
        const p = s.projects.find((x) => x.id === u.projectId);
        return p && (p.memberIds.includes(CURRENT_USER_ID) || s.favorites.includes(p.id));
      });
    if (tab === 'popular') {
      const score = (u: (typeof ups)[number]) => u.reactions.reduce((n, r) => n + r.userIds.length, 0) + u.comments.length * 2;
      return ups.sort((a, b) => score(b) - score(a) || b.createdAt.localeCompare(a.createdAt)).slice(0, 15);
    }
    return ups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [s, tab]);

  let last = '';
  return (
    <>
      <Topbar
        left={<><I.pulse size={16} style={{ color: 'var(--text-tertiary)' }} /><span className="crumb-title">Pulse</span></>}
        tabs={[
          { id: 'forme', label: 'For me', href: href('pulse'), active: tab === 'forme' },
          { id: 'popular', label: 'Popular', href: href('pulse/popular'), active: tab === 'popular' },
          { id: 'recent', label: 'Recent', href: href('pulse/recent'), active: tab === 'recent' },
        ]}
      />
      <div className="scroll">
        <div className="pulse-wrap">
          {list.map((u) => {
            const k = dayKey(u.createdAt);
            const sep = tab !== 'popular' && k !== last ? <div className="day-sep">{dayLabel(u.createdAt)}</div> : null;
            last = k;
            const p = u.projectId ? s.projects.find((x) => x.id === u.projectId) : undefined;
            const i = u.initiativeId ? initiatives.find((x) => x.id === u.initiativeId) : undefined;
            const title = p ? (
              <a className="feed-item-title" href={href(`project/${p.id}/overview`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Glyph name={p.icon} color={p.color} />{p.name}</a>
            ) : i ? (
              <a className="feed-item-title" href={href(`initiative/${i.id}/overview`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Glyph name={i.icon} color={i.color} />{i.name}</a>
            ) : null;
            return (
              <div key={u.id}>
                {sep}
                <UpdateItem u={u} variant="pulse" title={title} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function PlaceholderPage({ title, icon, text }: { title: string; icon: JSX.Element; text: string }) {
  return (
    <>
      <Topbar left={<>{icon}<span className="crumb-title">{title}</span></>} />
      <div className="scroll">
        <div className="empty">
          <h3>{title}</h3>
          {text}
          <div style={{ marginTop: 16 }}><a className="btn btn-secondary" href={href('pulse')}>Open Pulse</a></div>
        </div>
      </div>
    </>
  );
}
