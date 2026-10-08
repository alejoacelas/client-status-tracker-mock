import { useState } from 'react';
import type { StatusKey } from '../data/mock';
import { newId } from '../store';
import { fmtRange } from '../lib/dates';
import { STATUS } from '../lib/status';
import { getPerson, getPortfolio, hrefFor, itemInfo, itemStatus, navigate, projectsDeep, updatesFor, useStore } from '../store';
import { IconCalendar, IconChevronRight, IconSparkle } from '../components/Icons';
import { StatusCard } from '../components/StatusCard';
import { Avatar, FolderIcon, StatusChip } from '../components/ui';

export function ProgressView({ portfolioId }: { portfolioId: string }) {
  const { data, actions } = useStore();
  const pf = getPortfolio(data, portfolioId)!;
  const ref = { type: 'portfolio' as const, id: portfolioId };
  const st = itemStatus(data, ref);
  const updates = updatesFor(data, ref);
  const [latest, ...older] = updates;
  const projs = projectsDeep(data, portfolioId);
  const count = (k: StatusKey) => projs.filter((p) => itemStatus(data, { type: 'project', id: p.id }).status === k).length;
  const info = itemInfo(data, ref)!;
  const owner = getPerson(data, pf.ownerId);
  const [desc, setDesc] = useState<string | null>(null);
  const [showOlder, setShowOlder] = useState(false);
  const subPortfolios = pf.items.filter((i) => i.type === 'portfolio').map((i) => getPortfolio(data, i.id)!).filter(Boolean);

  const goFiltered = (status?: StatusKey) => {
    actions.setView(portfolioId, { filters: status ? [{ id: newId('f'), fieldId: 'status', value: status }] : [] });
    navigate(`/portfolio/${portfolioId}/list`);
  };

  const cards: { n: number; label: string; color?: string; status?: StatusKey }[] = [
    { n: count('on_track'), label: count('on_track') === 1 ? 'Project on track' : 'Projects on track', color: STATUS.on_track.text, status: 'on_track' },
    { n: count('at_risk'), label: count('at_risk') === 1 ? 'Project at risk' : 'Projects at risk', color: '#c68a2a', status: 'at_risk' },
    { n: count('off_track'), label: count('off_track') === 1 ? 'Project off track' : 'Projects off track', color: STATUS.off_track.text, status: 'off_track' },
    { n: projs.length, label: 'Total projects' },
  ];

  return (
    <div className="progress-view">
      <div className="pv-inner">
        <h2 className="pv-headline">
          {st.status ? (
            <>
              This portfolio is <span style={{ color: st.status === 'complete' ? STATUS.on_track.text : STATUS[st.status].text }}>{STATUS[st.status].label.toLowerCase()}</span>.
            </>
          ) : (
            'This portfolio has no recent status.'
          )}
          {' '}
          <IconSparkle size={20} className="pv-sparkle" />
        </h2>
        <div className="pv-counts">
          {cards.map((c) => (
            <button key={c.label} className="pv-count" onClick={() => goFiltered(c.status)}>
              <span className="pv-num" style={{ color: c.n ? c.color : undefined }}>{c.n}</span>
              <span className="pv-label">{c.label}</span>
              <IconChevronRight size={14} className="pv-chev" />
            </button>
          ))}
        </div>
        <div className="pv-cols">
          <div className="pv-main">
            <div className="pv-status-head">
              <h3>Latest status</h3>
              <button className="btn btn-primary sm" onClick={() => navigate(hrefFor.compose(ref).slice(1))}>
                Update status
              </button>
            </div>
            {latest ? (
              <StatusCard u={latest} />
            ) : (
              <div className="empty-card">
                <p>Share a status update to tell everyone how this portfolio is going.</p>
                <button className="btn btn-primary sm" onClick={() => navigate(hrefFor.compose(ref).slice(1))}>Update status</button>
              </div>
            )}
            {older.length > 0 && (
              <div className="pv-older">
                <button className="btn-subtle" onClick={() => setShowOlder(!showOlder)}>
                  {showOlder ? 'Hide' : 'Show'} {older.length} previous update{older.length === 1 ? '' : 's'}
                </button>
                {showOlder && older.map((u) => <StatusCard key={u.id} u={u} compact />)}
              </div>
            )}
          </div>
          <aside className="pv-side">
            <div className="pv-card">
              <h3>About this portfolio</h3>
              <div className="pv-about-row">
                <Avatar person={owner} size={28} />
                <span>{owner?.name ?? 'No owner'}</span>
              </div>
              <div className="pv-about-row">
                <span className="round-icon"><IconCalendar size={14} /></span>
                <span>{fmtRange(info.startDate, info.dueDate) || 'No dates'}</span>
              </div>
              {desc !== null ? (
                <textarea
                  autoFocus
                  className="pv-desc-input"
                  value={desc}
                  rows={4}
                  onChange={(e) => setDesc(e.target.value)}
                  onBlur={() => {
                    actions.setDescription(ref, desc);
                    setDesc(null);
                  }}
                />
              ) : (
                <p className={`pv-desc ${pf.description ? '' : 'placeholder'}`} onClick={() => setDesc(pf.description)}>
                  {pf.description || 'Click to add portfolio description...'}
                </p>
              )}
            </div>
            {subPortfolios.length > 0 && (
              <div className="pv-card">
                <h3>Portfolios in this portfolio</h3>
                <ul className="pv-subs">
                  {subPortfolios.map((sp) => (
                    <li key={sp.id}>
                      <a href={hrefFor.portfolio(sp.id, 'progress')}>
                        <FolderIcon color={sp.color} size={18} />
                        <span className="grow">{sp.name}</span>
                        <StatusChip status={itemStatus(data, { type: 'portfolio', id: sp.id }).status} size="sm" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
