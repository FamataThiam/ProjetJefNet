import { useQuery } from '@tanstack/react-query'
import api from '../api/client'


export default function Accueil() {
  const { isPending, isError } = useQuery({
    queryKey: ['ping'],
    queryFn: () => api.get('/ping').then((r) => r.data),
  })

  return (
    <main className="grid min-h-screen place-items-center bg-fond p-6 text-center">
      <div>
        <h1 className="text-4xl font-bold text-jef">JefNet</h1>
        <p className="mt-3 text-sm">
          {isPending ? 'Connexion au serveur…' : isError ? 'Le serveur ne répond pas' : 'Serveur connecté'}
        </p>
      </div>
    </main>
  )
}