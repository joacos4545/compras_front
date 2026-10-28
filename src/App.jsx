import { useEffect, useRef, useState } from 'react'
import { api } from './api.js'

const emptyDraft = { name: '', quantity: '1', unit: '', note: '', unit_price: '' }

function money(value) {
  return `Bs ${Number(value).toFixed(2)}`
}

export default function App() {
  const [items, setItems] = useState([])
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const formRef = useRef(null)

  useEffect(() => {
    api.list()
      .then(setItems)
      .catch((failure) => setError(failure.message))
      .finally(() => setLoading(false))
  }, [])

  const pending = items.filter((item) => !item.is_purchased).length
  const knownTotal = items.reduce((sum, item) => sum + (item.total === null ? 0 : Number(item.total)), 0)
  const missingPrices = items.some((item) => item.unit_price === null)

  function change(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function resetForm() {
    setDraft(emptyDraft)
    setEditingId(null)
  }

  function edit(item) {
    setEditingId(item.id)
    setDraft({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || '',
      note: item.note || '',
      unit_price: item.unit_price ?? '',
    })
    setError('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function save(event) {
    event.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      name: draft.name.trim(),
      quantity: draft.quantity,
      unit: draft.unit.trim() || null,
      note: draft.note.trim() || null,
      unit_price: draft.unit_price === '' ? null : draft.unit_price,
    }

    try {
      if (editingId === null) {
        const created = await api.create(payload)
        setItems((current) => [...current, created])
      } else {
        const updated = await api.update(editingId, payload)
        setItems((current) => current.map((item) => item.id === editingId ? updated : item))
      }
      resetForm()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggle(item) {
    setBusyId(item.id)
    setError('')
    try {
      const updated = await api.update(item.id, { is_purchased: !item.is_purchased })
      setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusyId(null)
    }
  }

  async function remove(item) {
    if (!window.confirm(`¿Eliminar “${item.name}” de la lista?`)) return
    setBusyId(item.id)
    setError('')
    try {
      await api.remove(item.id)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      if (editingId === item.id) resetForm()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="brand"><span className="brand-icon" aria-hidden="true">✳</span> Compras</div>
        <div className="header-caption">Tu lista de todos los días</div>
      </header>

      <main className="layout">
        <section className="intro" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">LISTA DE COMPRAS</p>
            <h1 id="page-title">Todo lo que necesitas,<br /><em>en un solo lugar.</em></h1>
            <p className="intro-copy">Agrega productos, anota sus precios y marca lo que ya compraste.</p>
          </div>
          <div className="summary" aria-label="Resumen de la lista">
            <div><strong>{pending}</strong><span>pendientes</span></div>
            <div className="summary-divider" />
            <div><strong>{money(knownTotal)}</strong><span>total con precios</span></div>
          </div>
        </section>

        {error && <div className="error" role="alert">{error}</div>}

        <div className="content-grid">
          <section className="panel form-panel" ref={formRef} aria-labelledby="form-title">
            <div className="panel-heading">
              <span className="panel-kicker">{editingId === null ? 'NUEVO PRODUCTO' : 'EDITAR PRODUCTO'}</span>
              <h2 id="form-title">{editingId === null ? 'Agregar a la lista' : 'Actualizar producto'}</h2>
              <p>Los campos con * son obligatorios.</p>
            </div>

            <form onSubmit={save}>
              <label htmlFor="name">Producto *</label>
              <input id="name" value={draft.name} onChange={(event) => change('name', event.target.value)} placeholder="Ej. Palta" maxLength={120} required />

              <div className="field-row">
                <div>
                  <label htmlFor="quantity">Cantidad *</label>
                  <input id="quantity" type="number" min="0.001" step="0.001" value={draft.quantity} onChange={(event) => change('quantity', event.target.value)} required />
                </div>
                <div>
                  <label htmlFor="unit">Unidad de medida</label>
                  <input id="unit" value={draft.unit} onChange={(event) => change('unit', event.target.value)} placeholder="Ej. unidad, kg" maxLength={20} />
                </div>
              </div>

              <label htmlFor="unit-price">Precio por unidad (Bs)</label>
              <input id="unit-price" type="number" min="0" step="0.01" value={draft.unit_price} onChange={(event) => change('unit_price', event.target.value)} placeholder="0.00" />

              <label htmlFor="note">Nota</label>
              <textarea id="note" rows="3" value={draft.note} onChange={(event) => change('note', event.target.value)} placeholder="Marca, tamaño u otro detalle" maxLength={500} />

              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Guardando…' : editingId === null ? 'Agregar producto' : 'Guardar cambios'}</button>
                {editingId !== null && <button className="text-button" type="button" onClick={resetForm}>Cancelar</button>}
              </div>
            </form>
          </section>

          <section className="panel list-panel" aria-labelledby="list-title">
            <div className="list-heading">
              <div>
                <span className="panel-kicker">MI LISTA</span>
                <h2 id="list-title">Productos <span className="count">{items.length}</span></h2>
              </div>
              <span className="list-hint">Marca lo que ya compraste</span>
            </div>

            {loading ? (
              <p className="empty-state">Cargando productos…</p>
            ) : items.length === 0 ? (
              <div className="empty-state"><span aria-hidden="true">🛒</span><strong>Tu lista está vacía</strong><p>Agrega tu primer producto usando el formulario.</p></div>
            ) : (
              <ul className="item-list">
                {items.map((item) => (
                  <li className={`item ${item.is_purchased ? 'purchased' : ''}`} key={item.id}>
                    <label className="check-wrap">
                      <input type="checkbox" checked={item.is_purchased} disabled={busyId === item.id} onChange={() => toggle(item)} aria-label={`Marcar ${item.name} como ${item.is_purchased ? 'pendiente' : 'comprado'}`} />
                      <span className="custom-check" aria-hidden="true">✓</span>
                    </label>
                    <div className="item-main">
                      <strong>{item.name}</strong>
                      <span>{item.quantity} {item.unit || 'unidad(es)'}{item.note ? ` · ${item.note}` : ''}</span>
                    </div>
                    <div className="item-price">
                      <strong>{item.total === null ? 'Sin precio' : money(item.total)}</strong>
                      {item.unit_price !== null && <span>{money(item.unit_price)} / {item.unit || 'unidad'}</span>}
                    </div>
                    <div className="item-actions">
                      <button type="button" onClick={() => edit(item)} disabled={busyId === item.id} aria-label={`Editar ${item.name}`}>Editar</button>
                      <button type="button" onClick={() => remove(item)} disabled={busyId === item.id} aria-label={`Eliminar ${item.name}`}>Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {missingPrices && items.length > 0 && <p className="total-note">El total incluye solo productos con precio registrado.</p>}
          </section>
        </div>
      </main>
    </div>
  )
}

