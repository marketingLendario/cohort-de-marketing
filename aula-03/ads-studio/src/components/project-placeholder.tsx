export function ProjectPlaceholder({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="asx-page cms-page">
      <div className="asx-page-head">
        <div>
          <div className="asx-page-head__eyebrow">{eyebrow}</div>
          <h1 className="asx-page-head__title">{title}</h1>
        </div>
      </div>
      <section className="cms-next-action">
        <div className="cms-next-action__copy">
          <p>{description}</p>
        </div>
      </section>
    </div>
  );
}
