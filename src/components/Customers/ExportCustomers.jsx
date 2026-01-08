import React, { useEffect, useState } from 'react';
import './Customers.css'
import { useNavigate } from "react-router-dom";

const ExportCustomers = () => {
  const API_URL = process.env.REACT_APP_API_URL

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = () => {
    fetch(`${API_URL}/api/exportcustomerlist`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(data => {
        setCustomers(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }

  const handleDelete = async (e, cus_id, cus_name) => {
    e.stopPropagation() // Prevent row click when deleting

    if (!window.confirm(`Are you sure you want to delete "${cus_name}"?`)) {
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/exportcustomerlist/${cus_id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete')

      // Refresh the list
      fetchCustomers()
    } catch (err) {
      alert('Error deleting customer: ' + err.message)
    }
  }


  const navigate = useNavigate();

  const navigateForm = () => {
    navigate('/exportcustomerform')
  }

  const navigateEdit = (e, cus_id) => {
    e.stopPropagation() // Prevent row click when editing
    navigate(`/exportcustomerform/${cus_id}`)
  }

  const navigateToDetail = (cus_id) => {
    navigate(`/exportcustomer/${cus_id}`)
  }

  // Helper function to get the correct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return '/images/placeholder-customer.png'
    }
    // If it's already a full URL (from Supabase), use it directly
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    // Otherwise, prepend API_URL (for old local uploads)
    return `${API_URL}${imageUrl}`
  }

  return (
    <div className="pricelist-container">


      <h2>Export Customer List</h2>

      <div className='add-section'>
        <button className='apf-btn' onClick={navigateForm}>+ Add Customer</button>
      </div>

      {loading && <div className="info">Loading...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="pricelist-table">
            <thead>
              <tr>
                <th>Profile Picture</th>
                <th>Customer Name</th>
                <th>Company Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Country</th>
                <th>Airport</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted">No customers found</td>
                </tr>
              )}

              {customers.map(customer => {
                const imgSrc = getImageUrl(customer.image_url)

                return (
                  <tr
                    key={customer.cus_id}
                    className="responsive-row clickable-row"
                    onClick={() => navigateToDetail(customer.cus_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td data-label="Profile">
                      <img src={imgSrc} alt={customer.cus_name} className="thumb" />
                    </td>
                    <td data-label="Customer Name">{customer.cus_name}</td>
                    <td data-label="Company">{customer.company_name || '-'}</td>
                    <td data-label="Phone">{customer.phone || '-'}</td>
                    <td data-label="Email">{customer.email || '-'}</td>
                    <td data-label="Country">{customer.country || '-'}</td>
                    <td data-label="Airport">{customer.airport || '-'}</td>
                    <td data-label="Address">{customer.address || '-'}</td>
                    <td data-label="Actions">
                      <div className="actions-wrapper">
                        <button
                          className="btn-edit"
                          onClick={(e) => navigateEdit(e, customer.cus_id)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={(e) => handleDelete(e, customer.cus_id, customer.cus_name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>

          </table>
        </div>
      )}
    </div>
  );
};

export default ExportCustomers;