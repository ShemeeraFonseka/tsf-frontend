import React, { useState, useEffect } from 'react'
import './UsdRateForm.css'

const UsdRateForm = () => {
  const API_URL = process.env.REACT_APP_API_URL

  const [form, setForm] = useState({
    rate: '',
    date: new Date().toISOString().split('T')[0]
  })

  const [currentRate,  setCurrentRate]  = useState(null)
  const [rateHistory,  setRateHistory]  = useState([])
  const [success,      setSuccess]      = useState('')
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [recalcInfo,   setRecalcInfo]   = useState(null)

  /* ── Fetch helpers ── */
  const fetchCurrentRate = async () => {
    try {
      const res = await fetch(`${API_URL}/api/usd-rate`)
      if (res.ok) setCurrentRate(await res.json())
    } catch (e) { console.error('Failed to fetch current rate:', e) }
  }

  const fetchRateHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/usd-rate/history`)
      if (res.ok) setRateHistory(await res.json())
    } catch (e) { console.error('Failed to fetch rate history:', e) }
  }

  /* ── Ex-Factory recalc ── */
  const calculateExFactoryPrice = (purchasePrice, packingCostUSD, labourOverheadUSD, profit, usdRate) => {
    const purchase  = parseFloat(purchasePrice)  || 0
    const packingLKR = (parseFloat(packingCostUSD)      || 0) * (parseFloat(usdRate) || 1)
    const labourLKR  = (parseFloat(labourOverheadUSD)   || 0) * (parseFloat(usdRate) || 1)
    return parseFloat((purchase + packingLKR + labourLKR + (parseFloat(profit) || 0)).toFixed(2))
  }

  const updateExportProductsUsdRate = async (newRate) => {
    try {
      const res = await fetch(`${API_URL}/api/exportproductlist`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const products = await res.json()
      let updatedCount = 0, errorCount = 0

      for (const product of products) {
        if (product.variants?.length > 0) {
          try {
            const updatedVariants = product.variants.map(v => ({
              ...v,
              usdrate: parseFloat(newRate),
              exfactoryprice: calculateExFactoryPrice(v.purchasing_price, v.packing_cost, v.labour_overhead, v.profit, newRate)
            }))
            const fd = new FormData()
            fd.append('common_name', product.common_name)
            fd.append('scientific_name', product.scientific_name || '')
            fd.append('category', product.category)
            fd.append('species_type', product.species_type || 'crustacean')
            fd.append('existing_image_url', product.image_url || '')
            fd.append('variants', JSON.stringify(updatedVariants))
            const upRes = await fetch(`${API_URL}/api/exportproductlist/upload/${product.id}`, { method: 'PUT', body: fd })
            if (upRes.ok) updatedCount++; else errorCount++
          } catch { errorCount++ }
        }
      }
      return { updated: updatedCount, errors: errorCount }
    } catch { return { updated: 0, errors: 0 } }
  }

  useEffect(() => {
    fetchCurrentRate()
    fetchRateHistory()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setSuccess(''); setError(''); setRecalcInfo(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setRecalcInfo(null); setLoading(true)

    if (!form.rate || parseFloat(form.rate) <= 0) {
      setError('Please enter a valid USD rate')
      setLoading(false)
      return
    }

    try {
      const newRate = parseFloat(form.rate)
      const res = await fetch(`${API_URL}/api/usd-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: newRate, date: form.date })
      })
      if (!res.ok) throw new Error('Failed to update USD rate')
      const data = await res.json()

      const exportResult  = await updateExportProductsUsdRate(newRate)
      const totalUpdated  = (data.recalculation?.productsUpdated || 0) + exportResult.updated
      const totalErrors   = (data.recalculation?.errors || 0) + exportResult.errors

      setRecalcInfo({
        customerProductsUpdated: data.recalculation?.productsUpdated || 0,
        exportProductsUpdated:   exportResult.updated,
        totalUpdated,
        errors: totalErrors
      })
      setSuccess(`USD rate updated successfully! ${totalUpdated} item${totalUpdated !== 1 ? 's' : ''} recalculated.`)
      await fetchCurrentRate()
      await fetchRateHistory()
      setForm({ rate: '', date: new Date().toISOString().split('T')[0] })
      setTimeout(() => { setSuccess(''); setRecalcInfo(null) }, 6000)
    } catch (err) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rate entry?')) return
    try {
      const res = await fetch(`${API_URL}/api/usd-rate/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete rate')
      setSuccess('Rate entry deleted successfully!')
      await fetchCurrentRate()
      await fetchRateHistory()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    }
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const fmtDateTime = (d) => new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="usd-page">

      <h2>💱 USD Exchange Rate</h2>

      {/* ── Current Rate Banner ── */}
      {currentRate && (
        <div className="usd-current-rate">
          <div className="rate-value">
            Rs. {parseFloat(currentRate.rate).toFixed(2)} / USD
          </div>
          <div className="rate-meta">
            Last updated: {fmtDateTime(currentRate.updated_at)}
            {currentRate.date && <><br />Rate date: {fmtDate(currentRate.date)}</>}
          </div>
        </div>
      )}

      {/* ── Warning Banner ── */}
      <div className="usd-warning">
        <div className="warning-title">⚠️ Automatic Recalculation</div>
        <ul>
          <li>Updates USD rate in all export product variants</li>
          <li>Recalculates Ex-Factory prices (converts USD packing/overhead costs to LKR)</li>
          <li>Recalculates FOB and CNF prices for all customer products</li>
        </ul>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="apf-container">
        <label className="apf-label">USD Rate (LKR)</label>
        <input
          className="apf-input"
          type="number"
          name="rate"
          step="0.01"
          placeholder="e.g. 295.50"
          value={form.rate}
          onChange={handleChange}
          required
          onWheel={e => e.target.blur()}
        />

        <label className="apf-label">Rate Date (from CBSL)</label>
        <input
          className="apf-input"
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />

        <button type="submit" className="apf-btn" disabled={loading}>
          {loading ? '⏳ Updating & Recalculating…' : 'Update USD Rate'}
        </button>
      </form>

      {/* ── Recalculation Info ── */}
      {recalcInfo && (
        <div className="recalc-panel">
          <div className="recalc-title">🔄 Recalculation Complete</div>

          <div className="recalc-block">
            <div className="recalc-block-label">Customer Products</div>
            <p>✓ Recalculated {recalcInfo.customerProductsUpdated} FOB &amp; CNF price{recalcInfo.customerProductsUpdated !== 1 ? 's' : ''}</p>
          </div>

          <div className="recalc-block">
            <div className="recalc-block-label">Export Products</div>
            <p>✓ Updated USD rate in {recalcInfo.exportProductsUpdated} product{recalcInfo.exportProductsUpdated !== 1 ? 's' : ''}</p>
            <p>✓ Recalculated Ex-Factory prices (USD costs → LKR)</p>
          </div>

          <div className="recalc-total">
            Total: {recalcInfo.totalUpdated} item{recalcInfo.totalUpdated !== 1 ? 's' : ''} updated
          </div>

          {recalcInfo.errors > 0 && (
            <div className="recalc-errors">
              ✗ {recalcInfo.errors} error{recalcInfo.errors !== 1 ? 's' : ''} during recalculation
            </div>
          )}
        </div>
      )}

      {/* ── Rate History ── */}
      {rateHistory.length > 0 && (
        <div className="rate-history-section">
          <h3>Rate History</h3>
          <div className="rate-table-wrap">
            <table className="rate-table">
              <thead>
                <tr>
                  <th>Rate (LKR)</th>
                  <th>Rate Date</th>
                  <th>Updated At</th>
                  <th style={{ textAlign: 'center', width: 110 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rateHistory.map((entry, index) => (
                  <tr key={entry.id || index}>
                    <td className="td-rate">Rs. {parseFloat(entry.rate).toFixed(2)}</td>
                    <td className="td-date">{fmtDate(entry.date)}</td>
                    <td className="td-date">{fmtDateTime(entry.updated_at)}</td>
                    <td className="td-actions">
                      {index === 0 ? (
                        <span className="badge-current">Current</span>
                      ) : (
                        <button
                          type="button"
                          className="tbl-btn-delete"
                          onClick={() => handleDelete(entry.id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Toasts ── */}
      {success && (
        <div className="apf-success">
          {success}
          {recalcInfo?.errors > 0 && (
            <div className="toast-warning">
              ⚠️ {recalcInfo.errors} item{recalcInfo.errors !== 1 ? 's' : ''} had errors
            </div>
          )}
        </div>
      )}
      {error && <div className="apf-error">{error}</div>}

    </div>
  )
}

export default UsdRateForm