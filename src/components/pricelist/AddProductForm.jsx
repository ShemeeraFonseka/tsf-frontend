import React, { useState, useEffect } from 'react'
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
        species_type: 'crustacean',
        image: null,
        existing_image_url: null
    })

    const [variants, setVariants] = useState([])
    const [newVariant, setNewVariant] = useState({ size: '', unit: 'kg', purchasing_price: '' })
    const [editingVariant, setEditingVariant] = useState(null)
    const [preview, setPreview] = useState(null)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
        return `${API_URL}${imageUrl}`
    }

    useEffect(() => {
        if (isEditMode) {
            setLoading(true)
            fetch(`${API_URL}/api/productlist/${id}`)
                .then(res => { if (!res.ok) throw new Error('Failed to fetch product'); return res.json() })
                .then(product => {
                    setForm({
                        common_name: product.common_name,
                        scientific_name: product.scientific_name || '',
                        category: product.category || 'live',
                        species_type: product.species_type || 'crustacean',
                        image: null,
                        existing_image_url: product.image_url
                    })
                    if (product.image_url) setPreview(getImageUrl(product.image_url))
                    if (product.variants && Array.isArray(product.variants)) setVariants(product.variants)
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

    const handleVariantChange = e => {
        const { name, value } = e.target
        if (editingVariant) setEditingVariant(prev => ({ ...prev, [name]: value }))
        else setNewVariant(prev => ({ ...prev, [name]: value }))
    }

    const handleAddVariant = async () => {
        if (!newVariant.size || !newVariant.purchasing_price) {
            setError('Please fill in all variant fields')
            setTimeout(() => setError(''), 3000)
            return
        }
        const variantToAdd = { id: Date.now(), size: newVariant.size, unit: newVariant.unit, purchasing_price: parseFloat(newVariant.purchasing_price) }
        if (!isEditMode) {
            setVariants(prev => [...prev, variantToAdd])
            setNewVariant({ size: '', unit: 'kg', purchasing_price: '' })
            setSuccess('Variant added (will be saved with product)')
            setTimeout(() => setSuccess(''), 2000)
            return
        }
        try {
            const res = await fetch(`${API_URL}/api/productlist/${id}/variants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ size: newVariant.size, unit: newVariant.unit, purchasing_price: newVariant.purchasing_price })
            })
            if (!res.ok) throw new Error('Failed to add variant')
            const savedVariant = await res.json()
            setVariants(prev => [...prev, savedVariant])
            setNewVariant({ size: '', unit: 'kg', purchasing_price: '' })
            setSuccess('Variant added successfully!')
            setTimeout(() => setSuccess(''), 2000)
        } catch (err) { setError(err.message); setTimeout(() => setError(''), 3000) }
    }

    const handleEditVariant   = (variant) => setEditingVariant({ ...variant })

    const handleUpdateVariant = async () => {
        if (!editingVariant.size || !editingVariant.purchasing_price) {
            setError('Please fill in all variant fields'); setTimeout(() => setError(''), 3000); return
        }
        if (!isEditMode) {
            setVariants(prev => prev.map(v => v.id === editingVariant.id ? { ...editingVariant, purchasing_price: parseFloat(editingVariant.purchasing_price) } : v))
            setEditingVariant(null); setSuccess('Variant updated'); setTimeout(() => setSuccess(''), 2000); return
        }
        try {
            const res = await fetch(`${API_URL}/api/productlist/${id}/variants/${editingVariant.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ size: editingVariant.size, unit: editingVariant.unit, purchasing_price: editingVariant.purchasing_price })
            })
            if (!res.ok) throw new Error('Failed to update variant')
            const updatedVariant = await res.json()
            setVariants(prev => prev.map(v => v.id === updatedVariant.id ? updatedVariant : v))
            setEditingVariant(null); setSuccess('Variant updated successfully!'); setTimeout(() => setSuccess(''), 2000)
        } catch (err) { setError(err.message); setTimeout(() => setError(''), 3000) }
    }

    const handleDeleteVariant = async (variantId) => {
        if (!window.confirm('Are you sure you want to delete this variant?')) return
        if (!isEditMode) {
            setVariants(prev => prev.filter(v => v.id !== variantId))
            setSuccess('Variant removed'); setTimeout(() => setSuccess(''), 2000); return
        }
        try {
            const res = await fetch(`${API_URL}/api/productlist/${id}/variants/${variantId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete variant')
            setVariants(prev => prev.filter(v => v.id !== variantId))
            setSuccess('Variant deleted successfully!'); setTimeout(() => setSuccess(''), 2000)
        } catch (err) { setError(err.message); setTimeout(() => setError(''), 3000) }
    }

    const handleSubmit = async e => {
        e.preventDefault(); setError(''); setSuccess('')
        try {
            const data = new FormData()
            data.append('common_name', form.common_name)
            data.append('scientific_name', form.scientific_name)
            data.append('category', form.category)
            data.append('species_type', form.species_type)
            data.append('variants', JSON.stringify(variants))
            if (form.image) data.append('image', form.image)
            else if (form.existing_image_url) data.append('existing_image_url', form.existing_image_url)

            const res = await fetch(
                isEditMode ? `${API_URL}/api/productlist/upload/${id}` : `${API_URL}/api/productlist/upload`,
                { method: isEditMode ? 'PUT' : 'POST', body: data }
            )
            if (!res.ok) throw new Error(`Failed to ${isEditMode ? 'update' : 'add'} product`)
            setSuccess(`Product ${isEditMode ? 'updated' : 'added'} successfully!`)
            setTimeout(() => navigate('/productlist'), 1500)
        } catch (err) { console.error(err); setError(err.message); setTimeout(() => setError(''), 3000) }
    }

    if (loading) return <div className="form-container"><p>Loading…</p></div>

    return (
        <div className='form-container'>
            <h2>{isEditMode ? 'Edit Product' : 'Add Product'}</h2>

            <form onSubmit={handleSubmit} className="apf-container">
                {/* ── Basic info ── */}
                <label className="apf-label">Common Name</label>
                <input className="apf-input" name="common_name" placeholder="Common Name" value={form.common_name} onChange={handleChange} required />

                <label className="apf-label">Scientific Name</label>
                <input className="apf-input" name="scientific_name" placeholder="Scientific Name" value={form.scientific_name} onChange={handleChange} />

                <label className="apf-label">Product Condition</label>
                <select className="apf-input" name="category" value={form.category} onChange={handleChange} required>
                    <option value="live">🟢 Live</option>
                    <option value="fresh">💧 Fresh</option>
                    <option value="frozen">❄️ Frozen</option>
                </select>

                <label className="apf-label">Species Type</label>
                <select className="apf-input" name="species_type" value={form.species_type} onChange={handleChange} required>
                    <option value="crustacean">🦞 Crustacean</option>
                    <option value="fish">🐟 Fish</option>
                </select>

                <label className="apf-label">Product Image</label>
                <input className="apf-input" type="file" name="image" accept="image/*" onChange={handleChange} />
                {preview && <img src={preview} alt="preview" className="img-preview" />}

                <hr />

                {/* ── Variants section ── */}
                <h3 style={{ marginBottom: '1rem' }}>Product Variants (Size &amp; Pricing)</h3>

                {variants.length > 0 && (
                    <div className="variants-table-wrap">
                        <table className="variants-table">
                            <thead>
                                <tr>
                                    <th>Size</th>
                                    <th>Unit</th>
                                    <th>Purchase Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variants.map(variant => (
                                    <tr key={variant.id}>
                                        <td>{variant.size}</td>
                                        <td>{variant.unit}</td>
                                        <td className="td-price">Rs.&nbsp;{parseFloat(variant.purchasing_price).toFixed(2)}</td>
                                        <td className="td-actions">
                                            <button type="button" className="tbl-btn-edit"   onClick={() => handleEditVariant(variant)}>Edit</button>
                                            <button type="button" className="tbl-btn-delete" onClick={() => handleDeleteVariant(variant.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Add / Edit variant form ── */}
                <div className="variant-form">
                    <h4>{editingVariant ? 'Edit Variant' : 'Add New Variant'}</h4>
                    <div>
                        <div>
                            <label className="apf-label">Size / Variant</label>
                            <input className="apf-input" name="size" type="text" placeholder="e.g. 100-150g, 2-5 inches"
                                value={editingVariant ? editingVariant.size : newVariant.size} onChange={handleVariantChange} />
                        </div>
                        <div>
                            <label className="apf-label">Unit</label>
                            <select className="apf-input" name="unit" value={editingVariant ? editingVariant.unit : newVariant.unit} onChange={handleVariantChange}>
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="lbs">lbs</option>
                                <option value="pcs">pcs</option>
                            </select>
                        </div>
                        <div>
                            <label className="apf-label">Purchase Price (Rs)</label>
                            <input className="apf-input" name="purchasing_price" type="number" step="0.01" placeholder="0.00"
                                value={editingVariant ? editingVariant.purchasing_price : newVariant.purchasing_price}
                                onChange={handleVariantChange} onWheel={e => e.target.blur()} />
                        </div>

                        <div className="variant-actions">
                            {editingVariant ? (
                                <>
                                    <button type="button" className="vbtn-update" onClick={handleUpdateVariant}>Update</button>
                                    <button type="button" className="vbtn-cancel" onClick={() => setEditingVariant(null)}>Cancel</button>
                                </>
                            ) : (
                                <button type="button" className="vbtn-add" onClick={handleAddVariant}>+ Add Variant</button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Submit / Cancel ── */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <button type="submit" className="apf-btn">{isEditMode ? 'Update Product' : 'Add Product'}</button>
                    <button type="button" className="cancel-btn" onClick={() => navigate('/productlist')}>Cancel</button>
                </div>
            </form>

            {success && <div className="apf-success">{success}</div>}
            {error   && <div className="apf-error">{error}</div>}
        </div>
    )
}

export default AddProductForm