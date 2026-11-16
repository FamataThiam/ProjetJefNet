// Squelette du fil « Pour vous », comme YouTube : la forme des publications
// apparaît en gris avec un reflet qui glisse, en attendant les vraies données.
function Bloc({ className = '' }) {
  return <div className={`squelette ${className.includes('rounded') ? '' : 'rounded-md'} ${className}`} />
}

function CarteSquelette({ avecImage = true }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* auteur */}
      <div className="flex items-center gap-3">
        <Bloc className="h-11 w-11 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Bloc className="h-3.5 w-2/5" />
          <Bloc className="h-3 w-1/4" />
        </div>
      </div>
      {/* texte */}
      <div className="mt-4 space-y-2">
        <Bloc className="h-3 w-full" />
        <Bloc className="h-3 w-11/12" />
        <Bloc className="h-3 w-3/5" />
      </div>
      {/* image */}
      {avecImage && <Bloc className="mt-4 aspect-video w-full rounded-xl" />}
      {/* actions */}
      <div className="mt-4 flex gap-3">
        <Bloc className="h-8 w-24 rounded-full" />
        <Bloc className="h-8 w-28 rounded-full" />
      </div>
    </article>
  )
}

export default function FilSquelette({ nombre = 3 }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement du fil">
      {/* bandeau des stories */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex shrink-0 flex-col items-center gap-2">
            <Bloc className="h-16 w-16 rounded-full" />
            <Bloc className="h-2.5 w-12" />
          </div>
        ))}
      </div>
      {Array.from({ length: nombre }).map((_, i) => (
        <CarteSquelette key={i} avecImage={i % 3 !== 1} />
      ))}
    </div>
  )
}
