import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './AddCustomerForm.css'

const AddCustomerForm = () => {
  const API_URL = process.env.REACT_APP_API_URL
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [form, setForm] = useState({
    cus_name: '', company_name: '', phone: '',
    address: '', email: '', country: '',
    airport: '', image: null, existing_image_url: null
  })

  const [preview, setPreview] = useState(null)
  const [success, setSuccess] = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
    return `${API_URL}${imageUrl}`
  }

  useEffect(() => {
    if (isEditMode) {
      setLoading(true)
      fetch(`${API_URL}/api/customerlist/${id}`)
        .then(res => { if (!res.ok) throw new Error('Failed to fetch customer'); return res.json() })
        .then(customer => {
          setForm({
            cus_name: customer.cus_name, company_name: customer.company_name || '',
            phone: customer.phone || '', address: customer.address || '',
            email: customer.email || '', country: customer.country || '',
            airport: customer.airport || '', image: null,
            existing_image_url: customer.image_url
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
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
    setSuccess(''); setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSuccess('')
    try {
      const data = new FormData()
      data.append('cus_name',      form.cus_name)
      data.append('company_name',  form.company_name)
      data.append('phone',         form.phone)
      data.append('email',         form.email)
      data.append('address',       form.address)
      data.append('country',       form.country)
      data.append('airport',       form.airport)
      if (form.image) data.append('image', form.image)
      else if (form.existing_image_url) data.append('existing_image_url', form.existing_image_url)

      const res = await fetch(
        isEditMode ? `${API_URL}/api/customerlist/upload/${id}` : `${API_URL}/api/customerlist/upload`,
        { method: isEditMode ? 'PUT' : 'POST', body: data }
      )
      if (!res.ok) throw new Error(`Failed to ${isEditMode ? 'update' : 'add'} customer`)
      setSuccess(`Customer ${isEditMode ? 'updated' : 'added'} successfully!`)
      setTimeout(() => navigate('/customerlist'), 1500)
    } catch (err) {
      console.error(err); setError(err.message); setTimeout(() => setError(''), 3000)
    }
  }

  if (loading) return <div className="form-container"><p>Loading…</p></div>

  return (
    <div className='form-container'>
      <h2>{isEditMode ? 'Edit Local Customer' : 'Add Local Customer'}</h2>

      <form onSubmit={handleSubmit} className="apf-container">

        {/* ── Contact info ── */}
        <div className="apf-field">
          <label className="apf-label">Customer Name *</label>
          <input className="apf-input" name="cus_name" placeholder="Full name"
            value={form.cus_name} onChange={handleChange} required />
        </div>

        <div className="apf-field">
          <label className="apf-label">Phone Number</label>
          <input className="apf-input" name="phone" placeholder="+94 77 000 0000"
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
          <input className="apf-input" name="country" placeholder="Country"
            value={form.country} onChange={handleChange} required />
        </div>

        <div className="apf-field apf-full">
          <label className="apf-label">Address</label>
          <input className="apf-input" name="address" placeholder="Street, city, postal code"
            value={form.address} onChange={handleChange} />
        </div>

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
          <button type="button" className="cancel-btn" onClick={() => navigate('/customerlist')}>Cancel</button>
        </div>
      </form>

      {success && <div className="apf-success">{success}</div>}
      {error   && <div className="apf-error">{error}</div>}
    </div>
  )
}

export default AddCustomerForm