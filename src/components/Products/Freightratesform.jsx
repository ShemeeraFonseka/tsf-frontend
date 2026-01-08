import React, { useState, useEffect } from 'react'
import '../pricelist/AddProductForm.css' 

const FreightRatesForm = () => {
    const API_URL = process.env.REACT_APP_API_URL

    const [form, setForm] = useState({
        country: '',
        rate: '',
        date: new Date().toISOString().split('T')[0]
    })

    const [freightRates, setFreightRates] = useState([])
    const [countries, setCountries] = useState([])
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState(null)

    // Common export destination countries
    const countryOptions = [
        'United states',
        'United kingdom',
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
        'South korea',
        'Singapore',
        'Malaysia',
        'Thailand',
        'UAE',
        'Saudi arabia',
        'Qatar',
        'China',
        'Hong kong',
        'New zealand',
        'Maldives',
        'India'
    ].sort()

    // Fetch all freight rates
    const fetchFreightRates = async () => {
        try {
            const response = await fetch(`${API_URL}/api/freight-rates`)
            if (response.ok) {
                const data = await response.json()
                setFreightRates(data)
                
                // Extract unique countries from existing rates
                const uniqueCountries = [...new Set(data.map(rate => rate.country))]
                setCountries(uniqueCountries)
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
        
        // Capitalize first letter for country input
        if (name === 'country') {
            const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
            setForm(prev => ({ ...prev, [name]: capitalizedValue }))
        } else {
            setForm(prev => ({ ...prev, [name]: value }))
        }
        
        setSuccess('')
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        if (!form.country || !form.rate || parseFloat(form.rate) <= 0) {
            setError('Please fill all fields with valid values')
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
                    rate: parseFloat(form.rate),
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
                rate: '',
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
            rate: rate.rate.toString(),
            date: rate.date ? new Date(rate.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        })
        setEditingId(rate.id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleCancelEdit = () => {
        setForm({
            country: '',
            rate: '',
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

                <label className="apf-label">Freight Rate (USD per kg)</label>
                <input
                    className="apf-input"
                    type="number"
                    name="rate"
                    step="0.01"
                    placeholder="e.g., 5.50"
                    value={form.rate}
                    onChange={handleChange}
                    required
                    onWheel={(e) => e.target.blur()}
                />

                <label className="apf-label">Effective Date</label>
                <input
                    className="apf-input"
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                />

                <div style={{ display: 'flex', gap: '10px' }}>
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
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        marginTop: '15px'
                    }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                    Country
                                </th>
                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                    Rate (USD/kg)
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
                            {getLatestRatesByCountry().map((rate) => (
                                <tr key={rate.id}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                        {rate.country}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#2196f3' }}>
                                        ${parseFloat(rate.rate).toFixed(2)}
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
            )}

            {/* Full History */}
            {freightRates.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <h3>Complete Rate History</h3>
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        marginTop: '15px'
                    }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                    Country
                                </th>
                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                    Rate (USD/kg)
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
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        ${parseFloat(rate.rate).toFixed(2)}
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
            )}
        </div>
    )
}

export default FreightRatesForm