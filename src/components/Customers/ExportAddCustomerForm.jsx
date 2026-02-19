import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './AddCustomerForm.css'

const ExportAddCustomerForm = () => {
  const API_URL = process.env.REACT_APP_API_URL
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [form, setForm] = useState({
    cus_name: '', company_name: '', phone: '', address: '',
    email: '', country: '', airport_code: '', airport_name: '',
    image: null, existing_image_url: null
  })

  const [preview, setPreview] = useState(null)
  const [success, setSuccess] = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

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
    'Netherlands': [{ code: 'AMS', name: 'Amsterdam Airport Schiphol' }],
    'Belgium':     [{ code: 'BRU', name: 'Brussels Airport' }],
    'Switzerland': [
      { code: 'ZRH', name: 'Zurich Airport' },
      { code: 'GVA', name: 'Geneva Airport' }
    ],
    'Japan': [
      { code: 'NRT', name: 'Narita International Airport - Tokyo' },
      { code: 'HND', name: 'Tokyo Haneda Airport' },
      { code: 'KIX', name: 'Kansai International Airport - Osaka' }
    ],
    'South Korea': [{ code: 'ICN', name: 'Incheon International Airport - Seoul' }],
    'Singapore':   [{ code: 'SIN', name: 'Singapore Changi Airport' }],
    'UAE': [
      { code: 'DXB', name: 'Dubai International Airport' },
      { code: 'AUH', name: 'Abu Dhabi International Airport' }
    ],
    'China': [
      { code: 'PEK', name: 'Beijing Capital International Airport' },
      { code: 'PVG', name: 'Shanghai Pudong International Airport' },
      { code: 'CAN', name: 'Guangzhou Baiyun International Airport' }
    ],
    'Hong Kong': [{ code: 'HKG', name: 'Hong Kong International Airport' }],
    'India': [
      { code: 'DEL', name: 'Indira Gandhi International Airport - Delhi' },
      { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport - Mumbai' },
      { code: 'BLR', name: 'Kempegowda International Airport - Bangalore' }
    ],
    'Maldives': [{ code: 'MLE', name: 'Velana International Airport - Male' }]
  }

  const countryOptions = Object.keys(countryAirportOptions).sort()

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
    return `${API_URL}${imageUrl}`
  }

  useEffect(() => {
    if (isEditMode) {
      setLoading(true)
      fetch(`${API_URL}/api/exportcustomerlist/${id}`)
        .then(res => { if (!res.ok) throw new Error('Failed to fetch customer'); return res.json() })
        .then(customer => {
          setForm({
            cus_name: customer.cus_name, company_name: customer.company_name || '',
            phone: customer.phone || '', address: customer.address || '',
            email: customer.email || '', country: customer.country || '',
            airport_code: customer.airport_code || '', airport_name: customer.airport_name || '',
            image: null, existing_image_url: customer.image_url
          })
          if (customer.image_url) setPreview(getImageUrl(customer.image_url))
          setLoading(false)
        })
        .catch(err => { setError(err.message); setLoading(false) })
    }
  }, [id, isEditMode, API_URL]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = e => {
    const { name, value, files } = e.target
    if (name === 'image') {
      const file = files[0]
      setForm(prev => ({ ...prev, image: file }))
      setPreview(file ? URL.createObjectURL(file) : null)
    } else if (name === 'country') {
      setForm(prev => ({ ...prev, [name]: value, airport_code: '', airport_name: '' }))
    } else if (name === 'airport_code') {
      const airports = countryAirportOptions[form.country]
      if (airports) {
        const match = airports.find(a => a.code.toUpperCase() === value.toUpperCase())
        setForm(prev => ({
          ...prev,
          airport_code: match ? match.code : value.toUpperCase(),
          airport_name: match ? match.name : prev.airport_name
        }))
      } else {
        setForm(prev => ({ ...prev, airport_code: value.toUpperCase() }))
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
    setSuccess(''); setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSuccess('')
    try {
      const data = new FormData()
      data.append('cus_name',     form.cus_name)
      data.append('company_name', form.company_name)
      data.append('phone',        form.phone)
      data.append('email',        form.email)
      data.append('address',      form.address)
      data.append('country',      form.country)
      data.append('airport_code', form.airport_code)
      data.append('airport_name', form.airport_name)
      if (form.image) data.append('image', form.image)
      else if (form.existing_image_url) data.append('existing_image_url', form.existing_image_url)

      const res = await fetch(
        isEditMode ? `${API_URL}/api/exportcustomerlist/upload/${id}` : `${API_URL}/api/exportcustomerlist/upload`,
        { method: isEditMode ? 'PUT' : 'POST', body: data }
      )
      if (!res.ok) throw new Error(`Failed to ${isEditMode ? 'update' : 'add'} customer`)
      setSuccess(`Customer ${isEditMode ? 'updated' : 'added'} successfully!`)
      setTimeout(() => navigate('/exportcustomerlist'), 1500)
    } catch (err) {
      console.error(err); setError(err.message); setTimeout(() => setError(''), 3000)
    }
  }

  if (loading) return <div className="form-container"><p>Loading…</p></div>

  return (
    <div className='form-container'>
      <h2>{isEditMode ? 'Edit Export Customer' : 'Add Export Customer'}</h2>

      <form onSubmit={handleSubmit} className="apf-container">

        {/* ── Contact info ── */}
        <div className="apf-field">
          <label className="apf-label">Customer Name *</label>
          <input className="apf-input" name="cus_name" placeholder="Full name"
            value={form.cus_name} onChange={handleChange} required />
        </div>

        <div className="apf-field">
          <label className="apf-label">Phone Number</label>
          <input className="apf-input" name="phone" placeholder="+1 000 000 0000"
            value={form.phone} onChange={handleChange} />
        </div>

        <div className="apf-field apf-full">
          <label className="apf-label">Company Name</label>
          <textarea className="apf-input" name="company_name" placeholder="Company or organisation"
            value={form.company_name} onChange={handleChange} rows={2} />
        </div>

        <div className="apf-field">
          <label className="apf-label">Email</label>
          <input className="apf-input" name="email" placeholder="email@example.com"
            value={form.email} onChange={handleChange} />
        </div>

        <div className="apf-field">
          <label className="apf-label">Country *</label>
          <input className="apf-input" name="country" placeholder="Type or select country"
            value={form.country} onChange={handleChange}
            list="country-suggestions" required />
          <datalist id="country-suggestions">
            {countryOptions.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        <div className="apf-field apf-full">
          <label className="apf-label">Address</label>
          <input className="apf-input" name="address" placeholder="Street, city, postal code"
            value={form.address} onChange={handleChange} />
        </div>

        {/* ── Airport panel (conditional) ── */}
        {form.country && (
          <div className="airport-panel">
            <p className="apf-section-title">✈️ Destination Airport</p>

            <div className="apf-field">
              <label className="apf-label">Airport Code</label>
              <input className="apf-input" name="airport_code"
                placeholder="e.g. JFK, LHR, DXB"
                value={form.airport_code} onChange={handleChange}
                list="airport-suggestions" maxLength={5}
                style={{ textTransform: 'uppercase' }} />
              {countryAirportOptions[form.country] && (
                <datalist id="airport-suggestions">
                  {countryAirportOptions[form.country].map(a => (
                    <option key={a.code} value={a.code}>{a.name}</option>
                  ))}
                </datalist>
              )}
            </div>

            <div className="apf-field">
              <label className="apf-label">Airport Name</label>
              <input className="apf-input" name="airport_name"
                placeholder="Full airport name"
                value={form.airport_name} onChange={handleChange} />
            </div>
          </div>
        )}

        <hr />

        {/* ── Profile picture ── */}
        <p className="apf-section-title">Profile Picture</p>
        <div className="apf-field apf-full">
          <label className="apf-label">Upload Image</label>
          <input className="apf-input" type="file" name="image" accept="image/*" onChange={handleChange} />
        </div>
        {preview && <img src={preview} alt="preview" className="img-preview" />}

        {/* ── Actions ── */}
        <div className="apf-btn-row">
          <button type="submit" className="apf-btn">{isEditMode ? 'Update Customer' : 'Add Customer'}</button>
          <button type="button" className="cancel-btn" onClick={() => navigate('/exportcustomerlist')}>Cancel</button>
        </div>
      </form>

      {success && <div className="apf-success">{success}</div>}
      {error   && <div className="apf-error">{error}</div>}
    </div>
  )
}

export default ExportAddCustomerForm