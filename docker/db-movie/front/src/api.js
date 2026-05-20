const BASE = '/api'

const handle = (res) => {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  if (res.status === 204) return null
  return res.json()
}

const api = {
  get:  (path)        => fetch(BASE + path).then(handle),
  post: (path, body)  => fetch(BASE + path, { method: 'POST',   headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handle),
  put:  (path, body)  => fetch(BASE + path, { method: 'PUT',    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handle),
  del:  (path)        => fetch(BASE + path, { method: 'DELETE' }).then(handle),
}

export default api
