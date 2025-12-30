import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './AddCustomerForm.css'

const AddCustomerForm = () => {
  const API_URL = process.env.REACT_APP_API_URL
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [form, setForm] = useState({
    cus_name: '',
    company_name: '',
    phone: '',
    address: '',
    email: '',
    country: '',
    airport: '',
    image: null,
    existing_image_url: null
  })

  const [preview, setPreview] = useState(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Helper function to get the correct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null
    // If it's already a full URL (from Supabase), use it directly
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    // Otherwise, prepend API_URL (for old local uploads)
    return `${API_URL}${imageUrl}`
  }

  // Fetch customer data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      setLoading(true)
      fetch(`${API_URL}/api/customerlist/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch customer')
          return res.json()
        })
        .then(customer => {
          setForm({
            cus_name: customer.cus_name,
            company_name: customer.company_name || '',
            phone: customer.phone || '',
            address: customer.address || '',
            email: customer.email || '',
            country: customer.country || '',
            airport: customer.airport || '',
            image: null,
            existing_image_url: customer.image_url
          })

          if (customer.image_url) {
            setPreview(getImageUrl(customer.image_url))
          }

          setLoading(false)
        })
        .catch(err => {
          setError(err.message)
          setLoading(false)
        })
    }
  }, [id, isEditMode, API_URL])

  const handleChange = e => {
    const { name, value, files } = e.target

    if (name === 'image') {
      const file = files[0]
      setForm(prev => ({ ...prev, image: file }))
      setPreview(file ? URL.createObjectURL(file) : null)
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }

    setSuccess('')
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const data = new FormData()
      data.append('cus_name', form.cus_name)
      data.append('company_name', form.company_name)
      data.append('phone', form.phone)
      data.append('email', form.email)
      data.append('address', form.address)
      data.append('country', form.country)
      data.append('airport', form.airport)

      if (form.image) {
        data.append('image', form.image)
      } else if (form.existing_image_url) {
        data.append('existing_image_url', form.existing_image_url)
      }

      const url = isEditMode
        ? `${API_URL}/api/customerlist/upload/${id}`
        : `${API_URL}/api/customerlist/upload`

      const method = isEditMode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        body: data
      })

      if (!res.ok) throw new Error(`Failed to ${isEditMode ? 'update' : 'add'} customer`)

      setSuccess(`Customer ${isEditMode ? 'updated' : 'added'} successfully!`)

      setTimeout(() => {
        navigate('/customerlist')
      }, 1500)

    } catch (err) {
      console.error(err)
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    }
  }

  if (loading) {
    return <div className="form-container"><p>Loading...</p></div>
  }

  return (
    <div className='form-container'>
      <h2>{isEditMode ? 'Edit Local Customer' : 'Add Local Customer'}</h2>
      <form onSubmit={handleSubmit} className="apf-container">
        <label className="apf-label">Customer Name</label>
        <input
          className="apf-input"
          name="cus_name"
          placeholder="Customer Name"
          value={form.cus_name}
          onChange={handleChange}
          required
        />

        <label className="apf-label">Company Name</label>
        <textarea
          className="apf-input"
          name="company_name"
          placeholder="company_name"
          value={form.company_name}
          onChange={handleChange}
          rows="3"
        />

        <label className="apf-label">Phone Number</label>
        <input
          className="apf-input"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
        />

        <label className="apf-label">Address</label>
        <input
          className="apf-input"
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}

        />

        <label className="apf-label">Email</label>
        <input
          className="apf-input"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}

        />

        <label className="apf-label">Country</label>
        <input
          className="apf-input"
          name="country"
          placeholder="Country"
          value={form.country}
          onChange={handleChange}
          required
        />

        <label className="apf-label">Airport</label>
        <input
          className="apf-input"
          name="airport"
          placeholder="Airport"
          value={form.airport}
          onChange={handleChange}
          disabled
        />

        <label className="apf-label">Profile Picture</label>
        <input
          className="apf-input"
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
        />

        {preview && (
          <img src={preview} alt="preview" style={{ width: '120px', marginTop: '10px', borderRadius: '6px' }} />
        )}

        <br /><br />

        <button type="submit" className="apf-btn">
          {isEditMode ? 'Update Customer' : 'Add Customer'}
        </button>

        <button
          type="button"
          className="cancel-btn"
          onClick={() => navigate('/customerlist')}
        >
          Cancel
        </button>
      </form>

      {success && <div className="apf-success">{success}</div>}
      {error && <div className="apf-error">{error}</div>}
    </div>
  )
}

export default AddCustomerForm