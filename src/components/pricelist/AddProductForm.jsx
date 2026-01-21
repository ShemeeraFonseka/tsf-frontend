import React, { useState, useEffect, useCallback } from 'react'
import './AddProductForm.css'
import { useParams, useNavigate } from 'react-router-dom'

const AddProductForm = () => {
    const API_URL = process.env.REACT_APP_API_URL
    const { id } = useParams()
    const navigate = useNavigate()
    const isEditMode = !!id

    const [form, setForm] = useState({
        common_name: '',
        scientific_name: '',
        category: 'live',
        image: null,
        existing_image_url: null
    })

    const [variants, setVariants] = useState([])
    const [newVariant, setNewVariant] = useState({
        size: '',
        unit: 'kg',
        purchasing_price: ''
    })
    const [editingVariant, setEditingVariant] = useState(null)

    const [preview, setPreview] = useState(null)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Helper function to get the correct image URL
    const getImageUrl = useCallback((imageUrl) => {
        if (!imageUrl) return null
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl
        }
        return `${API_URL}${imageUrl}`
    }, [API_URL])

    // Fetch product data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            setLoading(true)
            fetch(`${API_URL}/api/productlist/${id}`)
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch product')
                    return res.json()
                })
                .then(product => {
                    setForm({
                        common_name: product.common_name,
                        scientific_name: product.scientific_name || '',
                        category: product.category || 'live',
                        image: null,
                        existing_image_url: product.image_url
                    })

                    if (product.image_url) {
                        setPreview(getImageUrl(product.image_url))
                    }

                    // Load variants from JSON field
                    if (product.variants && Array.isArray(product.variants)) {
                        setVariants(product.variants)
                    }

                    setLoading(false)
                })
                .catch(err => {
                    setError(err.message)
                    setLoading(false)
                })
        }
    }, [id, isEditMode, API_URL, getImageUrl])

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

    const handleVariantChange = e => {
        const { name, value } = e.target
        if (editingVariant) {
            setEditingVariant(prev => ({ ...prev, [name]: value }))
        } else {
            setNewVariant(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleAddVariant = async () => {
        if (!newVariant.size || !newVariant.purchasing_price) {
            setError('Please fill in all variant fields')
            setTimeout(() => setError(''), 3000)
            return
        }

        const variantToAdd = {
            id: Date.now(),
            size: newVariant.size,
            unit: newVariant.unit,
            purchasing_price: parseFloat(newVariant.purchasing_price)
        }

        if (!isEditMode) {
            // Add to local array for new products
            setVariants(prev => [...prev, variantToAdd])
            setNewVariant({ size: '', unit: 'kg', purchasing_price: '' })
            setSuccess('Variant added (will be saved with product)')
            setTimeout(() => setSuccess(''), 2000)
            return
        }

        // For existing products, save to database immediately
        try {
            const res = await fetch(`${API_URL}/api/productlist/${id}/variants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    size: newVariant.size,
                    unit: newVariant.unit,
                    purchasing_price: newVariant.purchasing_price
                })
            })

            if (!res.ok) throw new Error('Failed to add variant')

            const savedVariant = await res.json()
            setVariants(prev => [...prev, savedVariant])
            setNewVariant({ size: '', unit: 'kg', purchasing_price: '' })
            setSuccess('Variant added successfully!')
            setTimeout(() => setSuccess(''), 2000)
        } catch (err) {
            setError(err.message)
            setTimeout(() => setError(''), 3000)
        }
    }

    const handleEditVariant = (variant) => {
        setEditingVariant({ ...variant })
    }

    const handleUpdateVariant = async () => {
        if (!editingVariant.size || !editingVariant.purchasing_price) {
            setError('Please fill in all variant fields')
            setTimeout(() => setError(''), 3000)
            return
        }

        if (!isEditMode) {
            // Update local array for new products
            setVariants(prev =>
                prev.map(v => v.id === editingVariant.id ? {
                    ...editingVariant,
                    size: editingVariant.size,
                    purchasing_price: parseFloat(editingVariant.purchasing_price)
                } : v)
            )
            setEditingVariant(null)
            setSuccess('Variant updated')
            setTimeout(() => setSuccess(''), 2000)
            return
        }

        // For existing products, update in database
        try {
            const res = await fetch(
                `${API_URL}/api/productlist/${id}/variants/${editingVariant.id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        size: editingVariant.size,
                        unit: editingVariant.unit,
                        purchasing_price: editingVariant.purchasing_price
                    })
                }
            )

            if (!res.ok) throw new Error('Failed to update variant')

            const updatedVariant = await res.json()
            setVariants(prev =>
                prev.map(v => v.id === updatedVariant.id ? updatedVariant : v)
            )
            setEditingVariant(null)
            setSuccess('Variant updated successfully!')
            setTimeout(() => setSuccess(''), 2000)
        } catch (err) {
            setError(err.message)
            setTimeout(() => setError(''), 3000)
        }
    }

    const handleDeleteVariant = async (variantId) => {
        if (!window.confirm('Are you sure you want to delete this variant?')) {
            return
        }

        if (!isEditMode) {
            // Remove from local array for new products
            setVariants(prev => prev.filter(v => v.id !== variantId))
            setSuccess('Variant removed')
            setTimeout(() => setSuccess(''), 2000)
            return
        }

        // For existing products, delete from database
        try {
            const res = await fetch(
                `${API_URL}/api/productlist/${id}/variants/${variantId}`,
                {
                    method: 'DELETE'
                }
            )

            if (!res.ok) throw new Error('Failed to delete variant')

            setVariants(prev => prev.filter(v => v.id !== variantId))
            setSuccess('Variant deleted successfully!')
            setTimeout(() => setSuccess(''), 2000)
        } catch (err) {
            setError(err.message)
            setTimeout(() => setError(''), 3000)
        }
    }

    const handleSubmit = async e => {
        e.preventDefault()
        setError('')
        setSuccess('')

        try {
            const data = new FormData()
            data.append('common_name', form.common_name)
            data.append('scientific_name', form.scientific_name)
            data.append('category', form.category)
            data.append('variants', JSON.stringify(variants))

            if (form.image) {
                data.append('image', form.image)
            } else if (form.existing_image_url) {
                data.append('existing_image_url', form.existing_image_url)
            }

            const url = isEditMode
                ? `${API_URL}/api/productlist/upload/${id}`
                : `${API_URL}/api/productlist/upload`

            const method = isEditMode ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                body: data
            })

            if (!res.ok) throw new Error(`Failed to ${isEditMode ? 'update' : 'add'} product`)

            setSuccess(`Product ${isEditMode ? 'updated' : 'added'} successfully!`)

            setTimeout(() => {
                navigate('/productlist')
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
            <h2>{isEditMode ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="apf-container">
                <label className="apf-label">Common Name</label>
                <input
                    className="apf-input"
                    name="common_name"
                    placeholder="Common Name"
                    value={form.common_name}
                    onChange={handleChange}
                    required
                />
                
                <label className="apf-label">Scientific Name</label>
                <input
                    className="apf-input"
                    name="scientific_name"
                    placeholder="Scientific Name"
                    value={form.scientific_name}
                    onChange={handleChange}
                />

                <label className="apf-label">Product Category</label>
                <select
                    className="apf-input"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                >
                    <option value="live">Live</option>
                    <option value="fresh">Fresh</option>
                    <option value="frozen">Frozen</option>
                </select>
                
                <label className="apf-label">Product Image</label>
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

                <hr style={{ margin: '20px 0', width: '100%' }} />

                {/* Variants Section */}
                <h3 style={{ marginTop: '20px' }}>Product Variants (Size & Pricing)</h3>
                
                {/* Variants Table */}
                {variants.length > 0 && (
                    <table className="variants-table" style={{ width: '100%', marginBottom: '20px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Size</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Unit</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Purchase Price</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', width: '150px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variants.map(variant => (
                                <tr key={variant.id}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{variant.size}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{variant.unit}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>Rs.{parseFloat(variant.purchasing_price).toFixed(2)}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleEditVariant(variant)}
                                            style={{ 
                                                marginRight: '5px', 
                                                padding: '5px 10px', 
                                                cursor: 'pointer',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteVariant(variant.id)}
                                            style={{ 
                                                padding: '5px 10px', 
                                                cursor: 'pointer', 
                                                backgroundColor: '#dc3545', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: '4px' 
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Add/Edit Variant Form */}
                <div style={{ padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
                    <h4 style={{ marginTop: 0 }}>{editingVariant ? 'Edit Variant' : 'Add New Variant'}</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                        <div>
                            <label className="apf-label">Size</label>
                            <input
                                className="apf-input"
                                name="size"
                                type="text"
                                step="0.01"
                                placeholder="e.g., 1, 5, 10"
                                value={editingVariant ? editingVariant.size : newVariant.size}
                                onChange={handleVariantChange}
                            />
                        </div>
                        
                        <div>
                            <label className="apf-label">Unit</label>
                            <select
                                className="apf-input"
                                name="unit"
                                value={editingVariant ? editingVariant.unit : newVariant.unit}
                                onChange={handleVariantChange}
                            >
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="lbs">lbs</option>
                                <option value="pcs">pcs</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="apf-label">Purchase Price (Rs)</label>
                            <input
                                className="apf-input"
                                name="purchasing_price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={editingVariant ? editingVariant.purchasing_price : newVariant.purchasing_price}
                                onChange={handleVariantChange}
                            />
                        </div>
                        
                        <div>
                            {editingVariant ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleUpdateVariant}
                                        style={{ 
                                            padding: '8px 16px', 
                                            marginRight: '5px', 
                                            cursor: 'pointer',
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        Update
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingVariant(null)}
                                        style={{ 
                                            padding: '8px 16px', 
                                            cursor: 'pointer',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleAddVariant}
                                    style={{ 
                                        padding: '8px 16px', 
                                        cursor: 'pointer',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px'
                                    }}
                                >
                                    Add Variant
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <br />

                <button type="submit" className="apf-btn">
                    {isEditMode ? 'Update Product' : 'Add Product'}
                </button>

                <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => navigate('/productlist')}
                >
                    Cancel
                </button>
            </form>

            {success && <div className="apf-success">{success}</div>}
            {error && <div className="apf-error">{error}</div>}
        </div>
    )
}

export default AddProductForm