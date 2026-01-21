import React, { useState, useEffect } from 'react'
import '../pricelist/AddProductForm.css' 

const FreightRatesForm = () => {
    const API_URL = process.env.REACT_APP_API_URL

    const [form, setForm] = useState({
        country: '',
        rate_45kg: '',
        rate_100kg: '',
        rate_300kg: '',
        rate_500kg: '',
        date: new Date().toISOString().split('T')[0]
    })

    const [freightRates, setFreightRates] = useState([])
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState(null)

    // Common export destination countries
    const countryOptions = [
        'United States',
        'United Kingdom',
        'Canada',
        'Australia',
        'Germany',
        'France',
        'Italy',
        'Spain',
        'Netherlands',
        'Belgium',
        'Switzerland',
        'Sweden',
        'Norway',
        'Denmark',
        'Japan',
        'South Korea',
        'Singapore',
        'Malaysia',
        'Thailand',
        'UAE',
        'Saudi Arabia',
        'Qatar',
        'China',
        'Hong Kong',
        'New Zealand',
        'Maldives',
        'India',
        'BKK' // Bangkok
    ].sort()

    // Fetch all freight rates
    const fetchFreightRates = async () => {
        try {
            const response = await fetch(`${API_URL}/api/freight-rates`)
            if (response.ok) {
                const data = await response.json()
                setFreightRates(data)
            }
        } catch (err) {
            console.error('Failed to fetch freight rates:', err)
        }
    }

    useEffect(() => {
        fetchFreightRates()
    }, [])

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

        if (!form.country || !form.rate_45kg || !form.rate_100kg || 
            !form.rate_300kg || !form.rate_500kg) {
            setError('Please fill all fields with valid values')
            setLoading(false)
            return
        }

        // Validate all rates are positive
        if (parseFloat(form.rate_45kg) <= 0 || parseFloat(form.rate_100kg) <= 0 || 
            parseFloat(form.rate_300kg) <= 0 || parseFloat(form.rate_500kg) <= 0) {
            setError('All rates must be greater than 0')
            setLoading(false)
            return
        }

        try {
            const url = editingId 
                ? `${API_URL}/api/freight-rates/${editingId}`
                : `${API_URL}/api/freight-rates`
            
            const method = editingId ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    country: form.country,
                    rate_45kg: parseFloat(form.rate_45kg),
                    rate_100kg: parseFloat(form.rate_100kg),
                    rate_300kg: parseFloat(form.rate_300kg),
                    rate_500kg: parseFloat(form.rate_500kg),
                    date: form.date
                })
            })

            if (!response.ok) {
                throw new Error(`Failed to ${editingId ? 'update' : 'add'} freight rate`)
            }

            setSuccess(`Freight rate ${editingId ? 'updated' : 'added'} successfully!`)
            
            // Refresh rates list
            await fetchFreightRates()
            
            // Reset form
            setForm({
                country: '',
                rate_45kg: '',
                rate_100kg: '',
                rate_300kg: '',
                rate_500kg: '',
                date: new Date().toISOString().split('T')[0]
            })
            setEditingId(null)

            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.message)
            setTimeout(() => setError(''), 3000)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (rate) => {
        setForm({
            country: rate.country,
            rate_45kg: rate.rate_45kg?.toString() || '',
            rate_100kg: rate.rate_100kg?.toString() || '',
            rate_300kg: rate.rate_300kg?.toString() || '',
            rate_500kg: rate.rate_500kg?.toString() || '',
            date: rate.date ? new Date(rate.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        })
        setEditingId(rate.id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleCancelEdit = () => {
        setForm({
            country: '',
            rate_45kg: '',
            rate_100kg: '',
            rate_300kg: '',
            rate_500kg: '',
            date: new Date().toISOString().split('T')[0]
        })
        setEditingId(null)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this freight rate?')) {
            return
        }

        try {
            const response = await fetch(`${API_URL}/api/freight-rates/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete freight rate')
            }

            setSuccess('Freight rate deleted successfully!')
            await fetchFreightRates()
            setTimeout(() => setSuccess(''), 2000)
        } catch (err) {
            setError(err.message)
            setTimeout(() => setError(''), 3000)
        }
    }

    // Group rates by country to show latest rate per country
    const getLatestRatesByCountry = () => {
        const ratesByCountry = {}
        freightRates.forEach(rate => {
            if (!ratesByCountry[rate.country] || 
                new Date(rate.updated_at) > new Date(ratesByCountry[rate.country].updated_at)) {
                ratesByCountry[rate.country] = rate
            }
        })
        return Object.values(ratesByCountry).sort((a, b) => a.country.localeCompare(b.country))
    }

    return (
        <div className='form-container'>
            <h2>{editingId ? 'Update' : 'Add'} Freight Rate</h2>

            {/* Add/Edit Form */}
            <form onSubmit={handleSubmit} className="apf-container">
                <label className="apf-label">Country/Destination</label>
                <input
                    className="apf-input"
                    type="text"
                    name="country"
                    placeholder="Type country name (e.g., United States)"
                    value={form.country}
                    onChange={handleChange}
                    list="country-suggestions"
                    required
                    autoComplete="off"
                />
                <datalist id="country-suggestions">
                    {countryOptions.map(country => (
                        <option key={country} value={country} />
                    ))}
                </datalist>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '15px',
                    marginTop: '10px'
                }}>
                    <div>
                        <label className="apf-label">Rate +45kg (USD/kg)</label>
                        <input
                            className="apf-input"
                            type="number"
                            name="rate_45kg"
                            step="0.01"
                            placeholder="e.g., 3.69"
                            value={form.rate_45kg}
                            onChange={handleChange}
                            required
                            onWheel={(e) => e.target.blur()}
                        />
                    </div>

                    <div>
                        <label className="apf-label">Rate +100kg (USD/kg)</label>
                        <input
                            className="apf-input"
                            type="number"
                            name="rate_100kg"
                            step="0.01"
                            placeholder="e.g., 2.61"
                            value={form.rate_100kg}
                            onChange={handleChange}
                            required
                            onWheel={(e) => e.target.blur()}
                        />
                    </div>

                    <div>
                        <label className="apf-label">Rate +300kg (USD/kg)</label>
                        <input
                            className="apf-input"
                            type="number"
                            name="rate_300kg"
                            step="0.01"
                            placeholder="e.g., 1.83"
                            value={form.rate_300kg}
                            onChange={handleChange}
                            required
                            onWheel={(e) => e.target.blur()}
                        />
                    </div>

                    <div>
                        <label className="apf-label">Rate +500kg (USD/kg)</label>
                        <input
                            className="apf-input"
                            type="number"
                            name="rate_500kg"
                            step="0.01"
                            placeholder="e.g., 1.62"
                            value={form.rate_500kg}
                            onChange={handleChange}
                            required
                            onWheel={(e) => e.target.blur()}
                        />
                    </div>
                </div>

                <label className="apf-label" style={{ marginTop: '10px' }}>Effective Date</label>
                <input
                    className="apf-input"
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                />

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button 
                        type="submit" 
                        className="apf-btn"
                        disabled={loading}
                        style={{ opacity: loading ? 0.6 : 1, flex: 1 }}
                    >
                        {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Rate' : 'Add Freight Rate')}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="apf-btn"
                            style={{ 
                                backgroundColor: '#6c757d',
                                flex: 1
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {success && <div className="apf-success">{success}</div>}
            {error && <div className="apf-error">{error}</div>}

            {/* Current Rates by Country */}
            {getLatestRatesByCountry().length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <h3>Current Freight Rates by Country</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            marginTop: '15px',
                            minWidth: '800px'
                        }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', minWidth: '120px' }}>
                                        Country
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', minWidth: '90px' }}>
                                        +45kg
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', minWidth: '90px' }}>
                                        +100kg
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', minWidth: '90px' }}>
                                        +300kg
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', minWidth: '90px' }}>
                                        +500kg
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', minWidth: '100px' }}>
                                        Effective Date
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', width: '150px' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {getLatestRatesByCountry().map((rate) => (
                                    <tr key={rate.id}>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                            {rate.country}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#2196f3' }}>
                                            ${parseFloat(rate.rate_45kg).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#2196f3' }}>
                                            ${parseFloat(rate.rate_100kg).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#2196f3' }}>
                                            ${parseFloat(rate.rate_300kg).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#2196f3' }}>
                                            ${parseFloat(rate.rate_500kg).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {new Date(rate.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(rate)}
                                                style={{
                                                    padding: '5px 12px',
                                                    cursor: 'pointer',
                                                    backgroundColor: '#2196f3',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '13px',
                                                    marginRight: '5px'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(rate.id)}
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Full History */}
            {freightRates.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <h3>Complete Rate History</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            marginTop: '15px',
                            minWidth: '900px'
                        }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                        Country
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        +45kg
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        +100kg
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        +300kg
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        +500kg
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                        Effective Date
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                        Last Updated
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', width: '150px' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {freightRates.map((rate) => (
                                    <tr key={rate.id}>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {rate.country}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            ${parseFloat(rate.rate_45kg).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            ${parseFloat(rate.rate_100kg).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            ${parseFloat(rate.rate_300kg).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            ${parseFloat(rate.rate_500kg).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {new Date(rate.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {new Date(rate.updated_at).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(rate)}
                                                style={{
                                                    padding: '5px 12px',
                                                    cursor: 'pointer',
                                                    backgroundColor: '#2196f3',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '13px',
                                                    marginRight: '5px'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(rate.id)}
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

export default FreightRatesForm