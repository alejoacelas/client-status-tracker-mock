export function NotReplicated({ title, text }: { title: string; text: string }) {
  return (
    <div className="not-replicated">
      <div className="nr-art" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      <a className="btn btn-secondary" href="#/portfolio/all-clients/list">
        Go to All clients
      </a>
    </div>
  );
}
