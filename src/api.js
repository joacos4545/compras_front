const baseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch {
    throw new Error('No se pudo conectar con el backend. Comprueba que esté iniciado.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = typeof body?.detail === 'string' ? body.detail : null
    throw new Error(detail || `La solicitud falló (HTTP ${response.status}).`)
  }

  return response.status === 204 ? null : response.json()
}

export const api = {
  list: () => request('/items'),
  create: (item) => request('/items', { method: 'POST', body: JSON.stringify(item) }),
  update: (id, changes) => request(`/items/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  remove: (id) => request(`/items/${id}`, { method: 'DELETE' }),
}

