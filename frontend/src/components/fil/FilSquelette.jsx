

export function SqPublication({ photos = 2 }) {
  return (
    <div className="bloc post">
      <div className="post-tete">
        <div className="sq rond" style={{ width: 48, height: 48 }} />
        <div style={{ flex: 1 }}><div className="sq" style={{ height: 14, width: '40%' }} /><div className="sq sq-ligne" style={{ width: '60%' }} /></div>
      </div>
      <div style={{ padding: '0 16px 14px' }}>
        <div className="sq sq-ligne" style={{ width: '95%' }} /><div className="sq sq-ligne" style={{ width: '85%' }} /><div className="sq sq-ligne" style={{ width: '50%' }} />
      </div>
      {photos > 0 && (
        <div className={`medias-fil m${photos}`}>
          {Array.from({ length: photos }, (_, k) => <div key={k} className="sq" style={{ aspectRatio: photos === 1 ? '16/10' : '4/3', borderRadius: 0 }} />)}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px' }}>
        {[1, 2, 3].map((k) => <div key={k} className="sq" style={{ flex: 1, height: 36 }} />)}
      </div>
    </div>
  )
}

export function SqStatuts() {
  return (
    <div className="bloc statuts">
      {Array.from({ length: 6 }, (_, k) => (
        <div key={k} className="statut"><div className="sq rond" style={{ width: 70, height: 70 }} /><div className="sq sq-ligne" style={{ width: '80%', margin: '8px auto 0' }} /></div>
      ))}
    </div>
  )
}

export default function FilSquelette() {
  return (
    <main className="page-fil" aria-busy="true" aria-label="Chargement du fil">
      <aside className="col-g">
        <div className="bloc" style={{ overflow: 'hidden', paddingBottom: 16, textAlign: 'center' }}>
          <div className="sq" style={{ height: 70, borderRadius: 0 }} />
          <div className="sq rond" style={{ width: 72, height: 72, margin: '-36px auto 10px', border: '4px solid var(--fond)' }} />
          <div className="sq" style={{ width: '60%', height: 14, margin: '8px auto 0' }} />
          <div className="sq sq-ligne" style={{ width: '40%', margin: '8px auto 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '18px 14px 0' }}><div className="sq" style={{ height: 38 }} /><div className="sq" style={{ height: 38 }} /></div>
        </div>
        <div className="bloc" style={{ padding: 14 }}>
          {[70, 80, 60, 75].map((l) => <div key={l} className="sq" style={{ height: 16, width: `${l}%`, margin: '6px 0 16px' }} />)}
        </div>
      </aside>

      <section className="col-c">
        <SqStatuts />
        <div className="bloc" style={{ padding: 5, display: 'flex', gap: 4 }}>
          {[1, 0.6, 0.6].map((o, k) => <div key={k} className="sq" style={{ flex: 1, height: 40, borderRadius: 14, opacity: o }} />)}
        </div>
        <SqPublication photos={2} />
        <SqPublication photos={1} />
      </section>

      <aside className="col-d">
        <div className="bloc">
          <div className="sq" style={{ height: 16, width: '60%', marginBottom: 16 }} />
          {[70, 60, 65].map((l) => (
            <div key={l} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              <div className="sq rond" style={{ width: 44, height: 44 }} />
              <div style={{ flex: 1 }}><div className="sq" style={{ height: 12, width: `${l}%` }} /><div className="sq sq-ligne" style={{ width: '45%' }} /></div>
            </div>
          ))}
        </div>
        <div className="bloc"><div className="sq" style={{ height: 16, width: '50%', marginBottom: 14 }} /><div className="sq" style={{ height: 150, borderRadius: 16 }} /></div>
      </aside>
    </main>
  )
}