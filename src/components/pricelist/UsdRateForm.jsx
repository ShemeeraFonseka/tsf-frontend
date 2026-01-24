import React, { useState, useEffect } from 'react'
import './AddProductForm.css' // Reusing existing styles

const UsdRateForm = () => {
    const API_URL = process.env.REACT_APP_API_URL

    const [form, setForm] = useState({
        rate: '',
        date: new Date().toISOString().split('T')[0] // Today's date
    })

    const [currentRate, setCurrentRate] = useState(null)
    const [rateHistory, setRateHistory] = useState([])
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Fetch current USD rate
    const fetchCurrentRate = async () => {
        try {
            const response = await fetch(`${API_URL}/api/usd-rate`)
            if (response.ok) {
                const data = await response.json()
                setCurrentRate(data)
            }
        } catch (err) {
            console.error('Failed to fetch current rate:', err)
        }
    }

    // Fetch rate history
    const fetchRateHistory = async () => {
        try {
            const response = await fetch(`${API_URL}/api/usd-rate/history`)
            if (response.ok) {
                const data = await response.json()
                setRateHistory(data)
            }
        } catch (err) {
            console.error('Failed to fetch rate history:', err)
        }
    }

    useEffect(() => {
  fetchCurrentRate();
  fetchRateHistory();
}, []); // eslint-disable-line react-hooks/exhaustive-deps


    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        setSuccess('')
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        if (!form.rate || parseFloat(form.rate) <= 0) {
            setError('Please enter a valid USD rate')
            setLoading(false)
            return
        }

        try {
            const response = await fetch(`${API_URL}/api/usd-rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rate: parseFloat(form.rate),
                    date: form.date
                })
            })

            if (!response.ok) {
                throw new Error('Failed to update USD rate')
            }

            const data = await response.json()
            setSuccess('USD rate updated successfully!')
            
            // Refresh current rate and history
            await fetchCurrentRate()
            await fetchRateHistory()
            
            // Reset form
            setForm({
                rate: '',
                date: new Date().toISOString().split('T')[0]
            })

            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.message)
            setTimeout(() => setError(''), 3000)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this rate entry?')) {
            return
        }

        try {
            const response = await fetch(`${API_URL}/api/usd-rate/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete rate')
            }

            setSuccess('Rate entry deleted successfully!')
            await fetchCurrentRate()
            await fetchRateHistory()
            setTimeout(() => setSuccess(''), 2000)
        } catch (err) {
            setError(err.message)
            setTimeout(() => setError(''), 3000)
        }
    }

    return (
        <div className='form-container'>
            <h2>Update USD Exchange Rate</h2>

            {/* Current Rate Display */}
            {currentRate && (
                <div style={{
                    padding: '15px',
                    backgroundColor: '#e8f5e9',
                    borderLeft: '4px solid #4caf50',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#2e7d32' }}>
                        Current USD Rate: Rs. {parseFloat(currentRate.rate).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                        Last updated: {new Date(currentRate.updated_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                    {currentRate.date && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                            Rate date: {new Date(currentRate.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Update Form */}
            <form onSubmit={handleSubmit} className="apf-container">
                <label className="apf-label">USD Rate (LKR)</label>
                <input
                    className="apf-input"
                    type="number"
                    name="rate"
                    step="0.01"
                    placeholder="e.g., 295.50"
                    value={form.rate}
                    onChange={handleChange}
                    required
                    onWheel={(e) => e.target.blur()}
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

                <button 
                    type="submit" 
                    className="apf-btn"
                    disabled={loading}
                    style={{ opacity: loading ? 0.6 : 1 }}
                >
                    {loading ? 'Updating...' : 'Update USD Rate'}
                </button>
            </form>

            {success && <div className="apf-success">{success}</div>}
            {error && <div className="apf-error">{error}</div>}

            {/* Rate History */}
            {rateHistory.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <h3>Rate History</h3>
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        marginTop: '15px'
                    }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                    Rate (LKR)
                                </th>
                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                    Rate Date
                                </th>
                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                    Updated At
                                </th>
                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', width: '100px' }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rateHistory.map((entry, index) => (
                                <tr key={entry.id || index}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                        Rs. {parseFloat(entry.rate).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        {new Date(entry.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        {new Date(entry.updated_at).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        {index !== 0 && ( // Don't allow deleting the current rate
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(entry.id)}
                                                style={{
                                                    padding: '5px 12px',
                                                    cursor: 'pointer',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                        {index === 0 && (
                                            <span style={{ 
                                                color: '#4caf50', 
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                Current
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default UsdRateForm