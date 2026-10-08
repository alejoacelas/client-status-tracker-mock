import { useState } from 'react';
import { hrefFor, itemStatus, navigate, useStore } from '../store';
import { IconColumns, IconList, IconPlus, IconTriangleDown, IconTriangleRight } from '../components/Icons';
import { FolderIcon, StatusChip } from '../components/ui';

export function PortfoliosIndex() {
  const { data, actions } = useStore();
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const starred = data.portfolios.filter((p) => p.starred);
  const sections = [
    { id: 'starred', title: 'Starred portfolios', items: starred },
    { id: 'all', title: 'All portfolios', items: data.portfolios },
  ];
  const count = (id: string) => {
    const p = data.portfolios.find((x) => x.id === id)!;
    const proj = p.items.filter((i) => i.type === 'project').length;
    const port = p.items.filter((i) => i.type === 'portfolio').length;
    return [proj ? `${proj} project${proj === 1 ? '' : 's'}` : '', port ? `${port} portfolio${port === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ') || 'Empty';
  };
  return (
    <div className="page index-page">
      <header className="index-head">
        <h1>Portfolios</h1>
        <button
          className="btn btn-primary sm"
          onClick={() => {
            const id = actions.addPortfolio(data.rootPortfolioId, 'New portfolio');
            navigate(`/portfolio/${id}/list`);
          }}
        >
          <IconPlus size={12} /> Create
        </button>
      </header>
      <div className="index-body">
        {sections.map((s) => (
          <section key={s.id} className="index-section">
            <div className="index-section-head">
              <button className="index-toggle" onClick={() => setCollapsed((c) => ({ ...c, [s.id]: !c[s.id] }))}>
                {collapsed[s.id] ? <IconTriangleRight size={12} /> : <IconTriangleDown size={12} />} {s.title}
              </button>
              {s.id === 'starred' && (
                <button className="icon-btn" aria-label={layout === 'grid' ? 'Show as list' : 'Show as grid'} onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}>
                  {layout === 'grid' ? <IconList /> : <IconColumns />}
                </button>
              )}
            </div>
            {!collapsed[s.id] &&
              (layout === 'grid' ? (
                <div className="folder-grid">
                  {s.items.map((p) => (
                    <a key={p.id} href={hrefFor.portfolio(p.id)} className="folder-tile">
                      <FolderIcon color={p.color} size={92} />
                      <span className="ft-name">{p.name}</span>
                      <span className="ft-sub">{count(p.id)}</span>
                    </a>
                  ))}
                  {s.items.length === 0 && <p className="muted">Star a portfolio to pin it here.</p>}
                </div>
              ) : (
                <ul className="folder-list">
                  {s.items.map((p) => (
                    <li key={p.id}>
                      <a href={hrefFor.portfolio(p.id)}>
                        <FolderIcon color={p.color} size={22} />
                        <span className="grow">{p.name}</span>
                        <span className="muted small">{count(p.id)}</span>
                        <StatusChip status={itemStatus(data, { type: 'portfolio', id: p.id }).status} size="sm" />
                      </a>
                    </li>
                  ))}
                </ul>
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}
