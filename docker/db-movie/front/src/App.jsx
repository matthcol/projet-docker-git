import { useState, useEffect } from 'react'
import api from './api'

const th = { padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #ddd', background: '#f0f0f0' }
const td = { padding: '5px 10px', borderBottom: '1px solid #eee' }

// ─── Persons ──────────────────────────────────────────────────────────────────

function Persons() {
  const [list, setList]     = useState([])
  const [form, setForm]     = useState({ name: '', birthdate: '' })
  const [search, setSearch] = useState('')

  useEffect(() => { api.get('/persons').then(setList) }, [])

  const displayed = search
    ? list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : list

  const add = (e) => {
    e.preventDefault()
    api.post('/persons', { name: form.name, birthdate: form.birthdate || null })
      .then(p => {
        setList(prev => [...prev, p].sort((a, b) => a.name.localeCompare(b.name)))
        setForm({ name: '', birthdate: '' })
      })
  }

  const del = (id) => {
    if (!confirm('Supprimer ?')) return
    api.del(`/persons/${id}`).then(() => setList(prev => prev.filter(p => p.id !== id)))
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ marginBottom: 12 }}>Personnes</h2>
      <input placeholder="Filtrer par nom…" value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 12, width: '100%' }} />

      <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 4, marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr><th style={th}>Nom</th><th style={th}>Naissance</th><th style={th}></th></tr></thead>
          <tbody>
            {displayed.map(p => (
              <tr key={p.id}>
                <td style={td}>{p.name}</td>
                <td style={td}>{p.birthdate ?? '—'}</td>
                <td style={td}><button className="danger" onClick={() => del(p.id)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: 8 }}>Ajouter</h3>
      <form onSubmit={add} style={{ display: 'flex', gap: 8 }}>
        <input required placeholder="Nom *" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 1 }} />
        <input type="date" value={form.birthdate}
          onChange={e => setForm(f => ({ ...f, birthdate: e.target.value }))} />
        <button type="submit">Ajouter</button>
      </form>
    </div>
  )
}

// ─── Movies ───────────────────────────────────────────────────────────────────

function Movies({ persons }) {
  const [list, setList]     = useState([])
  const [form, setForm]     = useState({ title: '', year: '', duration: '', director_id: '', pg: '', poster_uri: '' })
  const [search, setSearch] = useState({ title: '', year: '' })

  useEffect(() => { api.get('/movies').then(setList) }, [])

  const doSearch = () => {
    const p = new URLSearchParams()
    if (search.title) p.set('title', search.title)
    if (search.year)  p.set('year',  search.year)
    api.get(`/search?${p}`).then(r => setList(r.movies || []))
  }

  const reset = () => {
    setSearch({ title: '', year: '' })
    api.get('/movies').then(setList)
  }

  const add = (e) => {
    e.preventDefault()
    api.post('/movies', {
      title:       form.title,
      year:        parseInt(form.year),
      duration:    form.duration    ? parseInt(form.duration)    : null,
      director_id: form.director_id ? parseInt(form.director_id) : null,
      pg:          form.pg          || null,
      poster_uri:  form.poster_uri  || null,
    }).then(m => {
      setList(prev => [...prev, m].sort((a, b) => a.title.localeCompare(b.title)))
      setForm({ title: '', year: '', duration: '', director_id: '', pg: '', poster_uri: '' })
    })
  }

  const del = (id) => {
    if (!confirm('Supprimer ?')) return
    api.del(`/movies/${id}`).then(() => setList(prev => prev.filter(m => m.id !== id)))
  }

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Films</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Titre (partie)…" value={search.title}
          onChange={e => setSearch(s => ({ ...s, title: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && doSearch()} />
        <input placeholder="Année" type="number" style={{ width: 90 }} value={search.year}
          onChange={e => setSearch(s => ({ ...s, year: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && doSearch()} />
        <button onClick={doSearch}>Chercher</button>
        <button onClick={reset} style={{ background: '#888', borderColor: '#888' }}>Reset</button>
      </div>

      <div style={{ maxHeight: 350, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 4, marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr>
            <th style={th}>Titre</th><th style={th}>Année</th>
            <th style={th}>Réalisateur</th><th style={th}>PG</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {list.map(m => (
              <tr key={m.id}>
                <td style={td}>{m.title}</td>
                <td style={td}>{m.year}</td>
                <td style={td}>{m.director_name ?? '—'}</td>
                <td style={td}>{m.pg ?? '—'}</td>
                <td style={td}><button className="danger" onClick={() => del(m.id)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: 8 }}>Ajouter un film</h3>
      <form onSubmit={add} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 600 }}>
        <input required placeholder="Titre *" value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ gridColumn: '1/-1' }} />
        <input required placeholder="Année *" type="number" value={form.year}
          onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
        <input placeholder="Durée (min)" type="number" value={form.duration}
          onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
        <select value={form.director_id} onChange={e => setForm(f => ({ ...f, director_id: e.target.value }))}>
          <option value="">— Réalisateur —</option>
          {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input placeholder="Classification (PG, R…)" value={form.pg}
          onChange={e => setForm(f => ({ ...f, pg: e.target.value }))} />
        <input placeholder="URL affiche" value={form.poster_uri}
          onChange={e => setForm(f => ({ ...f, poster_uri: e.target.value }))} style={{ gridColumn: '1/-1' }} />
        <button type="submit" style={{ gridColumn: '1/-1' }}>Ajouter</button>
      </form>
    </div>
  )
}

// ─── Search ───────────────────────────────────────────────────────────────────

function Search() {
  const [q, setQ]           = useState({ name: '', title: '', year: '' })
  const [results, setResults] = useState(null)

  const doSearch = (e) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (q.name)  p.set('name',  q.name)
    if (q.title) p.set('title', q.title)
    if (q.year)  p.set('year',  q.year)
    api.get(`/search?${p}`).then(setResults)
  }

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Recherche multi-critère</h2>
      <form onSubmit={doSearch} style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <input placeholder="Nom personne (partie)…" value={q.name}
          onChange={e => setQ(q => ({ ...q, name: e.target.value }))} />
        <input placeholder="Titre film (partie)…" value={q.title}
          onChange={e => setQ(q => ({ ...q, title: e.target.value }))} />
        <input placeholder="Année exacte" type="number" style={{ width: 110 }} value={q.year}
          onChange={e => setQ(q => ({ ...q, year: e.target.value }))} />
        <button type="submit">Rechercher</button>
      </form>

      {results && (
        <>
          {results.persons?.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 8 }}>Personnes ({results.persons.length})</h3>
              <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr><th style={th}>Nom</th><th style={th}>Naissance</th></tr></thead>
                <tbody>{results.persons.map(p => (
                  <tr key={p.id}><td style={td}>{p.name}</td><td style={td}>{p.birthdate ?? '—'}</td></tr>
                ))}</tbody>
              </table>
            </section>
          )}
          {results.movies?.length > 0 && (
            <section>
              <h3 style={{ marginBottom: 8 }}>Films ({results.movies.length})</h3>
              <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>
                  <th style={th}>Titre</th><th style={th}>Année</th>
                  <th style={th}>Réalisateur</th><th style={th}>PG</th>
                </tr></thead>
                <tbody>{results.movies.map(m => (
                  <tr key={m.id}>
                    <td style={td}>{m.title}</td>
                    <td style={td}>{m.year}</td>
                    <td style={td}>{m.director_name ?? '—'}</td>
                    <td style={td}>{m.pg ?? '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </section>
          )}
          {!results.persons?.length && !results.movies?.length && (
            <p style={{ color: '#888' }}>Aucun résultat.</p>
          )}
        </>
      )}
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

const TABS = ['Films', 'Personnes', 'Recherche']

export default function App() {
  const [tab, setTab]       = useState('Films')
  const [persons, setPersons] = useState([])

  useEffect(() => { api.get('/persons').then(setPersons) }, [])

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginBottom: 16, fontSize: 22 }}>Movies DB</h1>
      <nav style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: tab === t ? '#333' : '#e0e0e0', color: tab === t ? '#fff' : '#333', borderColor: tab === t ? '#333' : '#ccc' }}>
            {t}
          </button>
        ))}
      </nav>
      {tab === 'Films'     && <Movies persons={persons} />}
      {tab === 'Personnes' && <Persons />}
      {tab === 'Recherche' && <Search />}
    </div>
  )
}
