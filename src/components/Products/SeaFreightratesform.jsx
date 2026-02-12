import React, { useState, useEffect } from 'react'
import '../pricelist/AddProductForm.css'

const SeaFreightRatesForm = () => {
    const API_URL = process.env.REACT_APP_API_URL

    const [recalcInfo, setRecalcInfo] = useState(null)

    const [form, setForm] = useState({
        country: '',
        port_code: '',
        port_name: '',
        rate_20ft: '',
        kilos_20ft: '',
        rate_40ft: '',
        kilos_40ft: '',
        date: new Date().toISOString().split('T')[0]
    })

    const [seaRates, setSeaRates] = useState([])
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState(null)

    // Common export destination countries with major seaports
    const countryPortOptions = {
        'United States': [
            { code: 'USLAX', name: 'Port of Los Angeles, California' },
            { code: 'USLGB', name: 'Port of Long Beach, California' },
            { code: 'USNYC', name: 'Port of New York/New Jersey' },
            { code: 'USSAV', name: 'Port of Savannah, Georgia' },
            { code: 'USHOU', name: 'Port of Houston, Texas' },
            { code: 'USSEA', name: 'Port of Seattle, Washington' }
        ],
        'Canada': [
            { code: 'CAVAN', name: 'Port of Vancouver, British Columbia' },
            { code: 'CAMTR', name: 'Port of Montreal, Quebec' },
            { code: 'CATOR', name: 'Port of Toronto, Ontario' }
        ],
        'United Kingdom': [
            { code: 'GBFXT', name: 'Port of Felixstowe' },
            { code: 'GBSOU', name: 'Port of Southampton' },
            { code: 'GBLGP', name: 'Port of London (London Gateway)' }
        ],
        'Germany': [
            { code: 'DEHAM', name: 'Port of Hamburg' },
            { code: 'DEBRE', name: 'Port of Bremerhaven' }
        ],
        'Netherlands': [
            { code: 'NLRTM', name: 'Port of Rotterdam' },
            { code: 'NLAMS', name: 'Port of Amsterdam' }
        ],
        'Belgium': [
            { code: 'BEANR', name: 'Port of Antwerp' }
        ],
        'France': [
            { code: 'FRLRH', name: 'Port of Le Havre' },
            { code: 'FRMRS', name: 'Port of Marseille' }
        ],
        'Spain': [
            { code: 'ESVLC', name: 'Port of Valencia' },
            { code: 'ESALG', name: 'Port of Algeciras' },
            { code: 'ESBCN', name: 'Port of Barcelona' }
        ],
        'Italy': [
            { code: 'ITGOA', name: 'Port of Genoa' },
            { code: 'ITTRS', name: 'Port of Trieste' },
            { code: 'ITCAG', name: 'Port of Cagliari' }
        ],
        'Australia': [
            { code: 'AUSYD', name: 'Port of Sydney, New South Wales' },
            { code: 'AUMEL', name: 'Port of Melbourne, Victoria' },
            { code: 'AUBRI', name: 'Port of Brisbane, Queensland' },
            { code: 'AUFRE', name: 'Port of Fremantle, Western Australia' }
        ],
        'New Zealand': [
            { code: 'NZAKL', name: 'Port of Auckland' },
            { code: 'NZLYT', name: 'Port of Lyttelton (Christchurch)' }
        ],
        'Japan': [
            { code: 'JPTYO', name: 'Port of Tokyo' },
            { code: 'JPOSA', name: 'Port of Osaka' },
            { code: 'JPYOK', name: 'Port of Yokohama' }
        ],
        'South Korea': [
            { code: 'KRINC', name: 'Port of Incheon' },
            { code: 'KRBUS', name: 'Port of Busan' }
        ],
        'China': [
            { code: 'CNSHA', name: 'Port of Shanghai' },
            { code: 'CNSZX', name: 'Port of Shenzhen (Yantian)' },
            { code: 'CNNGB', name: 'Port of Ningbo' },
            { code: 'CNQIN', name: 'Port of Qingdao' }
        ],
        'Hong Kong': [
            { code: 'HKHKG', name: 'Port of Hong Kong' }
        ],
        'Taiwan': [
            { code: 'TWKHH', name: 'Port of Kaohsiung' },
            { code: 'TWTPE', name: 'Port of Taipei' }
        ],
        'Singapore': [
            { code: 'SGSIN', name: 'Port of Singapore' }
        ],
        'Malaysia': [
            { code: 'MYPKG', name: 'Port Klang' },
            { code: 'MYTPP', name: 'Port of Tanjung Pelepas' }
        ],
        'Thailand': [
            { code: 'THBKK', name: 'Port of Bangkok' },
            { code: 'THLCH', name: 'Port of Laem Chabang' }
        ],
        'Vietnam': [
            { code: 'VNSGN', name: 'Port of Ho Chi Minh City (Cat Lai)' },
            { code: 'VNHPH', name: 'Port of Haiphong' },
            { code: 'VNDAD', name: 'Port of Da Nang' }
        ],
        'Philippines': [
            { code: 'PHMNL', name: 'Port of Manila' },
            { code: 'PHCEB', name: 'Port of Cebu' }
        ],
        'Indonesia': [
            { code: 'IDJKT', name: 'Port of Jakarta (Tanjung Priok)' },
            { code: 'IDSUB', name: 'Port of Surabaya' }
        ],
        'India': [
            { code: 'INNSA', name: 'Port of Nhava Sheva (JNPT), Mumbai' },
            { code: 'INMAA', name: 'Port of Chennai' },
            { code: 'INKOC', name: 'Port of Cochin' }
        ],
        'Sri Lanka': [
            { code: 'LKCMB', name: 'Port of Colombo' }
        ],
        'UAE': [
            { code: 'AEDXB', name: 'Port of Jebel Ali, Dubai' },
            { code: 'AEAUH', name: 'Port of Khalifa, Abu Dhabi' }
        ],
        'Saudi Arabia': [
            { code: 'SAJED', name: 'Port of Jeddah' },
            { code: 'SADMM', name: 'Port of Dammam' }
        ],
        'Qatar': [
            { code: 'QADOH', name: 'Port of Doha' },
            { code: 'QAHMD', name: 'Hamad Port' }
        ],
        'South Africa': [
            { code: 'ZADUR', name: 'Port of Durban' },
            { code: 'ZACPT', name: 'Port of Cape Town' }
        ],
        'Brazil': [
            { code: 'BRSSZ', name: 'Port of Santos, São Paulo' },
            { code: 'BRRIO', name: 'Port of Rio de Janeiro' }
        ],
        'Chile': [
            { code: 'CLVAP', name: 'Port of Valparaíso' },
            { code: 'CLSAI', name: 'Port of San Antonio' }
        ]
    }

    const countryOptions = Object.keys(countryPortOptions).sort()

    // Calculate freight per kilo
    const calculateFreightPerKilo = (rate, kilos) => {
        const rateNum = parseFloat(rate) || 0
        const kilosNum = parseFloat(kilos) || 0
        if (kilosNum === 0) return 0
        return (rateNum / kilosNum).toFixed(4)
    }

    // Fetch all sea freight rates
    const fetchSeaRates = async () => {
        try {
            const response = await fetch(`${API_URL}/api/sea-freight-rates`)
            if (response.ok) {
                const data = await response.json()
                setSeaRates(data)
            }
        } catch (err) {
            console.error('Failed to fetch sea freight rates:', err)
        }
    }

    useEffect(() => {
        fetchSeaRates();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (e) => {
        const { name, value } = e.target
        
        // If country changes, reset port fields
        if (name === 'country') {
            setForm(prev => ({ 
                ...prev, 
                [name]: value,
                port_code: '',
                port_name: ''
            }))
        } else if (name === 'port_code') {
            // When port code is typed or selected
            const selectedCountry = form.country
            const ports = countryPortOptions[selectedCountry]
            
            if (ports) {
                const matchedPort = ports.find(
                    port => port.code.toUpperCase() === value.toUpperCase()
                )
                
                if (matchedPort) {
                    // Auto-fill port name if code matches a predefined port
                    setForm(prev => ({
                        ...prev,
                        port_code: matchedPort.code,
                        port_name: matchedPort.name
                    }))
                } else {
                    // Manual entry
                    setForm(prev => ({
                        ...prev,
                        port_code: value.toUpperCase()
                    }))
                }
            } else {
                // No predefined ports for this country
                setForm(prev => ({
                    ...prev,
                    port_code: value.toUpperCase()
                }))
            }
        } else {
            setForm(prev => ({ ...prev, [name]: value }))
        }
        
        setSuccess('')
        setError('')
        setRecalcInfo(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setRecalcInfo(null)
        setLoading(true)

        if (!form.country || !form.port_code || !form.port_name ||
            !form.rate_20ft || !form.rate_40ft || 
            !form.kilos_20ft || !form.kilos_40ft) {
            setError('Please fill all required fields with valid values')
            setLoading(false)
            return
        }

        // Validate all rates and kilos are positive
        if (parseFloat(form.rate_20ft) <= 0 || parseFloat(form.rate_40ft) <= 0 || 
            parseFloat(form.kilos_20ft) <= 0 || parseFloat(form.kilos_40ft) <= 0) {
            setError('All rates and kilos must be greater than 0')
            setLoading(false)
            return
        }

        try {
            const url = editingId 
                ? `${API_URL}/api/sea-freight-rates/${editingId}`
                : `${API_URL}/api/sea-freight-rates`
            
            const method = editingId ? 'PUT' : 'POST'

            const freight_per_kilo_20ft = calculateFreightPerKilo(form.rate_20ft, form.kilos_20ft)
            const freight_per_kilo_40ft = calculateFreightPerKilo(form.rate_40ft, form.kilos_40ft)

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    country: form.country,
                    port_code: form.port_code,
                    port_name: form.port_name,
                    rate_20ft: parseFloat(form.rate_20ft),
                    kilos_20ft: parseFloat(form.kilos_20ft),
                    freight_per_kilo_20ft: parseFloat(freight_per_kilo_20ft),
                    rate_40ft: parseFloat(form.rate_40ft),
                    kilos_40ft: parseFloat(form.kilos_40ft),
                    freight_per_kilo_40ft: parseFloat(freight_per_kilo_40ft),
                    date: form.date
                })
            })

            if (!response.ok) {
            throw new Error(`Failed to ${editingId ? 'update' : 'add'} sea freight rate`)
        }

        const data = await response.json()  // Change this line

        // Show success with recalculation info
        if (data.recalculation) {
            setRecalcInfo(data.recalculation)
            setSuccess(`Sea freight rate ${editingId ? 'updated' : 'added'} successfully! ${data.recalculation.productsUpdated} product${data.recalculation.productsUpdated !== 1 ? 's' : ''} recalculated.`)
        } else {
            setSuccess(`Sea freight rate ${editingId ? 'updated' : 'added'} successfully!`)
        }
        
            
            // Refresh rates list
            await fetchSeaRates()
            
            // Reset form
            setForm({
                country: '',
                port_code: '',
                port_name: '',
                rate_20ft: '',
                kilos_20ft: '',
                rate_40ft: '',
                kilos_40ft: '',
                date: new Date().toISOString().split('T')[0]
            })
            setEditingId(null)

            setTimeout(() => {
                setSuccess('')
                setRecalcInfo(null)
            }, 3000)
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
            port_code: rate.port_code || '',
            port_name: rate.port_name || '',
            rate_20ft: rate.rate_20ft?.toString() || '',
            kilos_20ft: rate.kilos_20ft?.toString() || '',
            rate_40ft: rate.rate_40ft?.toString() || '',
            kilos_40ft: rate.kilos_40ft?.toString() || '',
            date: rate.date ? new Date(rate.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        })
        setEditingId(rate.id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleCancelEdit = () => {
        setForm({
            country: '',
            port_code: '',
            port_name: '',
            rate_20ft: '',
            kilos_20ft: '',
            rate_40ft: '',
            kilos_40ft: '',
            date: new Date().toISOString().split('T')[0]
        })
        setEditingId(null)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this sea freight rate?')) {
            return
        }

        try {
            const response = await fetch(`${API_URL}/api/sea-freight-rates/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete sea freight rate')
            }

            setSuccess('Sea freight rate deleted successfully!')
            await fetchSeaRates()
            setTimeout(() => setSuccess(''), 2000)
        } catch (err) {
            setError(err.message)
            setTimeout(() => setError(''), 3000)
        }
    }

    // Group rates by country and port
    const getLatestRatesByCountryPort = () => {
        const ratesByCountryPort = {}
        seaRates.forEach(rate => {
            const key = `${rate.country}_${rate.port_code}`
            if (!ratesByCountryPort[key] || 
                new Date(rate.updated_at) > new Date(ratesByCountryPort[key].updated_at)) {
                ratesByCountryPort[key] = rate
            }
        })
        return Object.values(ratesByCountryPort).sort((a, b) => {
            const countryCompare = a.country.localeCompare(b.country)
            if (countryCompare !== 0) return countryCompare
            return (a.port_code || '').localeCompare(b.port_code || '')
        })
    }

    return (
        <div className='form-container'>
            <h2>{editingId ? 'Update' : 'Add'} Sea Freight Rate</h2>

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
                            Port Code (e.g., CNSHA, DEHAM)
                        </label>
                        <input
                            className="apf-input"
                            type="text"
                            name="port_code"
                            placeholder="Type port code or select from suggestions"
                            value={form.port_code}
                            onChange={handleChange}
                            list="port-suggestions"
                            required
                            maxLength={6}
                            style={{ textTransform: 'uppercase' }}
                        />
                        {countryPortOptions[form.country] && (
                            <datalist id="port-suggestions">
                                {countryPortOptions[form.country].map(port => (
                                    <option key={port.code} value={port.code}>
                                        {port.name}
                                    </option>
                                ))}
                            </datalist>
                        )}

                        <label className="apf-label" style={{ marginTop: '10px' }}>
                            Port Name
                        </label>
                        <input
                            className="apf-input"
                            type="text"
                            name="port_name"
                            placeholder="Enter full port name"
                            value={form.port_name}
                            onChange={handleChange}
                            required
                        />
                    </>
                )}

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>20ft Container Details</h3>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '15px'
                }}>
                    <div>
                        <label className="apf-label">Rate (USD)</label>
                        <input
                            className="apf-input"
                            type="number"
                            name="rate_20ft"
                            step="0.01"
                            placeholder="e.g., 1500.00"
                            value={form.rate_20ft}
                            onChange={handleChange}
                            required
                            onWheel={(e) => e.target.blur()}
                        />
                    </div>

                    <div>
                        <label className="apf-label">Kilos per Container</label>
                        <input
                            className="apf-input"
                            type="number"
                            name="kilos_20ft"
                            step="0.01"
                            placeholder="e.g., 10000"
                            value={form.kilos_20ft}
                            onChange={handleChange}
                            required
                            onWheel={(e) => e.target.blur()}
                        />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ 
                            padding: '12px', 
                            backgroundColor: 'transparent', 
                            borderRadius: '4px',
                            border: '1px solid #2196f3'
                        }}>
                            <strong>Freight per Kilo (20ft):</strong>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196f3', marginTop: '5px' }}>
                                ${calculateFreightPerKilo(form.rate_20ft, form.kilos_20ft)} USD/kg
                            </div>
                        </div>
                    </div>
                </div>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>40ft Container Details</h3>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '15px'
                }}>
                    <div>
                        <label className="apf-label">Rate (USD)</label>
                        <input
                            className="apf-input"
                            type="number"
                            name="rate_40ft"
                            step="0.01"
                            placeholder="e.g., 2200.00"
                            value={form.rate_40ft}
                            onChange={handleChange}
                            required
                            onWheel={(e) => e.target.blur()}
                        />
                    </div>

                    <div>
                        <label className="apf-label">Kilos per Container</label>
                        <input
                            className="apf-input"
                            type="number"
                            name="kilos_40ft"
                            step="0.01"
                            placeholder="e.g., 20000"
                            value={form.kilos_40ft}
                            onChange={handleChange}
                            required
                            onWheel={(e) => e.target.blur()}
                        />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ 
                            padding: '12px', 
                            backgroundColor: 'transparent', 
                            borderRadius: '4px',
                            border: '1px solid #4caf50'
                        }}>
                            <strong>Freight per Kilo (40ft):</strong>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4caf50', marginTop: '5px' }}>
                                ${calculateFreightPerKilo(form.rate_40ft, form.kilos_40ft)} USD/kg
                            </div>
                        </div>
                    </div>
                </div>

                <label className="apf-label" style={{ marginTop: '20px' }}>Effective Date</label>
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
                        {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Rate' : 'Add Sea Freight Rate')}
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

           {success && (
    <div style={{
        padding: '15px',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '4px',
        color: '#155724',
        marginTop: '15px'
    }}>
        {success}
    </div>
)}

{error && (
    <div style={{
        padding: '15px',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        color: '#721c24',
        marginTop: '15px'
    }}>
        {error}
    </div>
)}

{/* Recalculation Info */}
{recalcInfo && (
    <div style={{
        padding: '12px',
        backgroundColor: '#e3f2fd',
        borderLeft: '4px solid #2196f3',
        borderRadius: '4px',
        marginTop: '15px',
        marginBottom: '15px'
    }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1976d2', marginBottom: '5px' }}>
            🔄 Automatic Recalculation Complete
        </div>
        <div style={{ fontSize: '13px', color: '#424242' }}>
            ✓ Updated {recalcInfo.productsUpdated} product price{recalcInfo.productsUpdated !== 1 ? 's' : ''}
        </div>
        {recalcInfo.errors > 0 && (
            <div style={{ fontSize: '13px', color: '#d32f2f', marginTop: '3px' }}>
                ✗ {recalcInfo.errors} error{recalcInfo.errors !== 1 ? 's' : ''}
            </div>
        )}
    </div>
)}
            {/* Current Rates by Country and Port */}
            {getLatestRatesByCountryPort().length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <h3>Current Sea Freight Rates by Country & Port</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            marginTop: '15px',
                            minWidth: '1000px'
                        }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', minWidth: '120px' }}>
                                        Country
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', minWidth: '200px' }}>
                                        Port
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', minWidth: '100px' }}>
                                        20ft Rate
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', minWidth: '90px' }}>
                                        20ft Kilos
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', minWidth: '100px' }}>
                                        20ft Per Kilo
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', minWidth: '100px' }}>
                                        40ft Rate
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', minWidth: '90px' }}>
                                        40ft Kilos
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', minWidth: '100px' }}>
                                        40ft Per Kilo
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
                                {getLatestRatesByCountryPort().map((rate) => (
                                    <tr key={rate.id}>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                            {rate.country}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            <strong style={{ color: '#2196f3' }}>{rate.port_code}</strong>
                                            {rate.port_name && (
                                                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>
                                                    {rate.port_name}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', color: '#2196f3' }}>
                                            ${parseFloat(rate.rate_20ft).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            {parseFloat(rate.kilos_20ft).toLocaleString()} kg
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#2196f3' }}>
                                            ${parseFloat(rate.freight_per_kilo_20ft || 0).toFixed(4)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', color: '#4caf50' }}>
                                            ${parseFloat(rate.rate_40ft).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            {parseFloat(rate.kilos_40ft).toLocaleString()} kg
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#4caf50' }}>
                                            ${parseFloat(rate.freight_per_kilo_40ft || 0).toFixed(4)}
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
            {seaRates.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <h3>Complete Rate History</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            marginTop: '15px',
                            minWidth: '1100px'
                        }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                        Country
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                        Port
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        20ft Rate
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        20ft Kilos
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        20ft/kg
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        40ft Rate
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        40ft Kilos
                                    </th>
                                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        40ft/kg
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
                                {seaRates.map((rate) => (
                                    <tr key={rate.id}>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {rate.country}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            <strong>{rate.port_code}</strong>
                                            {rate.port_name && (
                                                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                    {rate.port_name}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            ${parseFloat(rate.rate_20ft).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            {parseFloat(rate.kilos_20ft).toLocaleString()} kg
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#2196f3' }}>
                                            ${parseFloat(rate.freight_per_kilo_20ft || 0).toFixed(4)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            ${parseFloat(rate.rate_40ft).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            {parseFloat(rate.kilos_40ft).toLocaleString()} kg
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#4caf50' }}>
                                            ${parseFloat(rate.freight_per_kilo_40ft || 0).toFixed(4)}
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

export default SeaFreightRatesForm