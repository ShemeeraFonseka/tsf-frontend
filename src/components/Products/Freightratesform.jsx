import React, { useState, useEffect } from 'react'
import '../pricelist/AddProductForm.css' 

const FreightRatesForm = () => {
    const API_URL = process.env.REACT_APP_API_URL

    const [form, setForm] = useState({
        country: '',
        airport_code: '',
        airport_name: '',
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

    // Common export destination countries with major airports
    const countryAirportOptions = {
        'United States': [
            { code: 'JFK', name: 'John F. Kennedy International Airport - New York' },
            { code: 'LAX', name: 'Los Angeles International Airport' },
            { code: 'ORD', name: "O'Hare International Airport - Chicago" },
            { code: 'MIA', name: 'Miami International Airport' },
            { code: 'SFO', name: 'San Francisco International Airport' },
            { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport' }
        ],
        'United Kingdom': [
            { code: 'LHR', name: 'London Heathrow Airport' },
            { code: 'LGW', name: 'London Gatwick Airport' },
            { code: 'MAN', name: 'Manchester Airport' }
        ],
        'Canada': [
            { code: 'YYZ', name: 'Toronto Pearson International Airport' },
            { code: 'YVR', name: 'Vancouver International Airport' },
            { code: 'YUL', name: 'Montreal-Pierre Elliott Trudeau International Airport' }
        ],
        'Australia': [
            { code: 'SYD', name: 'Sydney Kingsford Smith Airport' },
            { code: 'MEL', name: 'Melbourne Airport' },
            { code: 'BNE', name: 'Brisbane Airport' },
            { code: 'PER', name: 'Perth Airport' }
        ],
        'Germany': [
            { code: 'FRA', name: 'Frankfurt Airport' },
            { code: 'MUC', name: 'Munich Airport' },
            { code: 'BER', name: 'Berlin Brandenburg Airport' }
        ],
        'France': [
            { code: 'CDG', name: 'Charles de Gaulle Airport - Paris' },
            { code: 'ORY', name: 'Orly Airport - Paris' },
            { code: 'LYS', name: 'Lyon-Saint Exupéry Airport' }
        ],
        'Italy': [
            { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino Airport - Rome' },
            { code: 'MXP', name: 'Milan Malpensa Airport' }
        ],
        'Spain': [
            { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas Airport' },
            { code: 'BCN', name: 'Barcelona-El Prat Airport' }
        ],
        'Netherlands': [
            { code: 'AMS', name: 'Amsterdam Airport Schiphol' }
        ],
        'Belgium': [
            { code: 'BRU', name: 'Brussels Airport' }
        ],
        'Switzerland': [
            { code: 'ZRH', name: 'Zurich Airport' },
            { code: 'GVA', name: 'Geneva Airport' }
        ],
        'Sweden': [
            { code: 'ARN', name: 'Stockholm Arlanda Airport' }
        ],
        'Norway': [
            { code: 'OSL', name: 'Oslo Airport' }
        ],
        'Denmark': [
            { code: 'CPH', name: 'Copenhagen Airport' }
        ],
        'Japan': [
            { code: 'NRT', name: 'Narita International Airport - Tokyo' },
            { code: 'HND', name: 'Tokyo Haneda Airport' },
            { code: 'KIX', name: 'Kansai International Airport - Osaka' }
        ],
        'South Korea': [
            { code: 'ICN', name: 'Incheon International Airport - Seoul' }
        ],
        'Singapore': [
            { code: 'SIN', name: 'Singapore Changi Airport' }
        ],
        'Malaysia': [
            { code: 'KUL', name: 'Kuala Lumpur International Airport' }
        ],
        'Thailand': [
            { code: 'BKK', name: 'Suvarnabhumi Airport - Bangkok' },
            { code: 'DMK', name: 'Don Mueang International Airport - Bangkok' }
        ],
        'UAE': [
            { code: 'DXB', name: 'Dubai International Airport' },
            { code: 'AUH', name: 'Abu Dhabi International Airport' }
        ],
        'Saudi Arabia': [
            { code: 'RUH', name: 'King Khalid International Airport - Riyadh' },
            { code: 'JED', name: 'King Abdulaziz International Airport - Jeddah' }
        ],
        'Qatar': [
            { code: 'DOH', name: 'Hamad International Airport - Doha' }
        ],
        'China': [
            { code: 'PEK', name: 'Beijing Capital International Airport' },
            { code: 'PVG', name: 'Shanghai Pudong International Airport' },
            { code: 'CAN', name: 'Guangzhou Baiyun International Airport' }
        ],
        'Hong Kong': [
            { code: 'HKG', name: 'Hong Kong International Airport' }
        ],
        'New Zealand': [
            { code: 'AKL', name: 'Auckland Airport' },
            { code: 'CHC', name: 'Christchurch International Airport' }
        ],
        'Maldives': [
            { code: 'MLE', name: 'Velana International Airport - Male' }
        ],
        'India': [
            { code: 'DEL', name: 'Indira Gandhi International Airport - Delhi' },
            { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport - Mumbai' },
            { code: 'BLR', name: 'Kempegowda International Airport - Bangalore' }
        ]
    }

    const countryOptions = Object.keys(countryAirportOptions).sort()

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
        fetchFreightRates();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (e) => {
        const { name, value } = e.target
        
        // If country changes, reset airport fields
        if (name === 'country') {
            setForm(prev => ({ 
                ...prev, 
                [name]: value,
                airport_code: '',
                airport_name: ''
            }))
        } else if (name === 'airport_code') {
            // When airport code is typed or selected
            const selectedCountry = form.country
            const airports = countryAirportOptions[selectedCountry]
            
            if (airports) {
                const matchedAirport = airports.find(
                    airport => airport.code.toUpperCase() === value.toUpperCase()
                )
                
                if (matchedAirport) {
                    // Auto-fill airport name if code matches a predefined airport
                    setForm(prev => ({
                        ...prev,
                        airport_code: matchedAirport.code,
                        airport_name: matchedAirport.name
                    }))
                } else {
                    // Manual entry
                    setForm(prev => ({
                        ...prev,
                        airport_code: value.toUpperCase()
                    }))
                }
            } else {
                // No predefined airports for this country
                setForm(prev => ({
                    ...prev,
                    airport_code: value.toUpperCase()
                }))
            }
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

        if (!form.country || !form.airport_code || !form.airport_name ||
            !form.rate_45kg || !form.rate_100kg || 
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
                    airport_code: form.airport_code,
                    airport_name: form.airport_name,
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
                airport_code: '',
                airport_name: '',
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
            airport_code: rate.airport_code || '',
            airport_name: rate.airport_name || '',
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
            airport_code: '',
            airport_name: '',
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

    // Group rates by country and airport
    const getLatestRatesByCountryAirport = () => {
        const ratesByCountryAirport = {}
        freightRates.forEach(rate => {
            const key = `${rate.country}_${rate.airport_code}`
            if (!ratesByCountryAirport[key] || 
                new Date(rate.updated_at) > new Date(ratesByCountryAirport[key].updated_at)) {
                ratesByCountryAirport[key] = rate
            }
        })
        return Object.values(ratesByCountryAirport).sort((a, b) => {
            const countryCompare = a.country.localeCompare(b.country)
            if (countryCompare !== 0) return countryCompare
            return (a.airport_code || '').localeCompare(b.airport_code || '')
        })
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
                    placeholder="Type country name or select from suggestions"
                    value={form.country}
                    onChange={handleChange}
                    list="country-suggestions"
                    required
                />
                <datalist id="country-suggestions">
                    {countryOptions.map(country => (
                        <option key={country} value={country} />
                    ))}
                </datalist>

                {form.country && (
                    <>
                        <label className="apf-label" style={{ marginTop: '10px' }}>
                            Airport Code (e.g., JFK, LHR)
                        </label>
                        <input
                            className="apf-input"
                            type="text"
                            name="airport_code"
                            placeholder="Type airport code or select from suggestions"
                            value={form.airport_code}
                            onChange={handleChange}
                            list="airport-suggestions"
                            required
                            maxLength={5}
                            style={{ textTransform: 'uppercase' }}
                        />
                        {countryAirportOptions[form.country] && (
                            <datalist id="airport-suggestions">
                                {countryAirportOptions[form.country].map(airport => (
                                    <option key={airport.code} value={airport.code}>
                                        {airport.name}
                                    </option>
                                ))}
                            </datalist>
                        )}

                        <label className="apf-label" style={{ marginTop: '10px' }}>
                            Airport Name
                        </label>
                        <input
                            className="apf-input"
                            type="text"
                            name="airport_name"
                            placeholder="Enter full airport name"
                            value={form.airport_name}
                            onChange={handleChange}
                            required
                        />
                    </>
                )}

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

            {/* Current Rates by Country and Airport */}
            {getLatestRatesByCountryAirport().length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <h3>Current Freight Rates by Country & Airport</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            marginTop: '15px',
                            minWidth: '900px'
                        }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', minWidth: '120px' }}>
                                        Country
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', minWidth: '200px' }}>
                                        Airport
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
                                {getLatestRatesByCountryAirport().map((rate) => (
                                    <tr key={rate.id}>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                            {rate.country}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            <strong style={{ color: '#2196f3' }}>{rate.airport_code}</strong>
                                            {rate.airport_name && (
                                                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>
                                                    {rate.airport_name}
                                                </div>
                                            )}
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
                            minWidth: '1000px'
                        }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                        Country
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                        Airport
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
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            <strong>{rate.airport_code}</strong>
                                            {rate.airport_name && (
                                                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                    {rate.airport_name}
                                                </div>
                                            )}
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