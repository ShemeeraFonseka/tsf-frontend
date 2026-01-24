import React, { useState, useEffect } from 'react'
import './AddProductForm.css'
import { useParams, useNavigate } from 'react-router-dom'

const ExportAddProductForm = () => {
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
        unit: '',
        purchasing_price: '',
        usdrate: '',
        packing_cost: '',
        labour_overhead: '',
        profit: '',
        profit_margin: '',
        exfactoryprice: ''
    })
    const [editingVariant, setEditingVariant] = useState(null)

    // State for USD rate from database
    const [currentUsdRate, setCurrentUsdRate] = useState(null)
    const [rateLastUpdated, setRateLastUpdated] = useState(null)
    const [loadingRate, setLoadingRate] = useState(false)

    const [preview, setPreview] = useState(null)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Calculate Cost Price (without profit)
    const calculateCostPrice = (purchasePrice, packingCost, labourOverhead) => {
        const purchase = parseFloat(purchasePrice) || 0
        const packing = parseFloat(packingCost) || 0
        const labour = parseFloat(labourOverhead) || 0
        return purchase + packing + labour
    }

    // Calculate Ex-Factory Price (cost + profit)
    const calculateExFactoryPrice = (purchasePrice, packingCost, labourOverhead, profit) => {
        const costPrice = calculateCostPrice(purchasePrice, packingCost, labourOverhead)
        const profitAmount = parseFloat(profit) || 0
        return (costPrice + profitAmount).toFixed(2)
    }

    // Calculate Profit from Margin percentage
    const calculateProfitFromMargin = (purchasePrice, packingCost, labourOverhead, profitMargin) => {
        const costPrice = calculateCostPrice(purchasePrice, packingCost, labourOverhead)
        const margin = parseFloat(profitMargin) || 0
        return ((costPrice * margin) / 100).toFixed(2)
    }

    // Calculate Profit Margin from Profit amount
    const calculateMarginFromProfit = (purchasePrice, packingCost, labourOverhead, profit) => {
        const costPrice = calculateCostPrice(purchasePrice, packingCost, labourOverhead)
        const profitAmount = parseFloat(profit) || 0
        if (costPrice === 0) return '0.00'
        return ((profitAmount / costPrice) * 100).toFixed(2)
    }

    // Fetch USD rate from database
    const fetchUsdRateFromDB = async () => {
        setLoadingRate(true)
        try {
            const response = await fetch(`${API_URL}/api/usd-rate`)

            if (!response.ok) {
                throw new Error('Failed to fetch USD rate from database')
            }

            const data = await response.json()

            if (data.rate) {
                setCurrentUsdRate(data.rate)
                setRateLastUpdated(data.updated_at || data.updatedAt)

                // Auto-populate the USD rate field for new variants
                setNewVariant(prev => ({ ...prev, usdrate: data.rate.toFixed(2) }))
                
                // Also update editing variant's USD rate if it's being edited
                if (editingVariant) {
                    setEditingVariant(prev => ({ ...prev, usdrate: data.rate.toFixed(2) }))
                }
            } else {
                throw new Error('USD rate not found in database')
            }
        } catch (err) {
            console.error('USD rate fetch error:', err)
            setError('Failed to fetch USD rate. Please enter manually.')
            setTimeout(() => setError(''), 4000)
        } finally {
            setLoadingRate(false)
        }
    }

    // Fetch USD rate on component mount
    useEffect(() => {
        fetchUsdRateFromDB()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Helper function to get the correct image URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl
        }
        return `${API_URL}${imageUrl}`
    }

    // Fetch product data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            setLoading(true)
            fetch(`${API_URL}/api/exportproductlist/${id}`)
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

        setSuccess('')
        setError('')
    }

    const handleVariantChange = e => {
        const { name, value } = e.target
        
        if (editingVariant) {
            const updated = { ...editingVariant, [name]: value }
            
            // Handle profit and profit_margin calculations
            if (name === 'profit') {
                // When profit changes, calculate margin and ex-factory price
                updated.profit_margin = calculateMarginFromProfit(
                    updated.purchasing_price,
                    updated.packing_cost,
                    updated.labour_overhead,
                    value
                )
                updated.exfactoryprice = calculateExFactoryPrice(
                    updated.purchasing_price,
                    updated.packing_cost,
                    updated.labour_overhead,
                    value
                )
            } else if (name === 'profit_margin') {
                // When margin changes, calculate profit and ex-factory price
                updated.profit = calculateProfitFromMargin(
                    updated.purchasing_price,
                    updated.packing_cost,
                    updated.labour_overhead,
                    value
                )
                updated.exfactoryprice = calculateExFactoryPrice(
                    updated.purchasing_price,
                    updated.packing_cost,
                    updated.labour_overhead,
                    updated.profit
                )
            }

            // Recalculate when cost components change
            if (name === 'purchasing_price' || name === 'packing_cost' || name === 'labour_overhead') {
                if (updated.profit) {
                    // If profit is set, recalculate margin
                    updated.profit_margin = calculateMarginFromProfit(
                        name === 'purchasing_price' ? value : updated.purchasing_price,
                        name === 'packing_cost' ? value : updated.packing_cost,
                        name === 'labour_overhead' ? value : updated.labour_overhead,
                        updated.profit
                    )
                } else if (updated.profit_margin) {
                    // If margin is set, recalculate profit
                    updated.profit = calculateProfitFromMargin(
                        name === 'purchasing_price' ? value : updated.purchasing_price,
                        name === 'packing_cost' ? value : updated.packing_cost,
                        name === 'labour_overhead' ? value : updated.labour_overhead,
                        updated.profit_margin
                    )
                }
                // Always recalculate ex-factory price
                updated.exfactoryprice = calculateExFactoryPrice(
                    name === 'purchasing_price' ? value : updated.purchasing_price,
                    name === 'packing_cost' ? value : updated.packing_cost,
                    name === 'labour_overhead' ? value : updated.labour_overhead,
                    updated.profit
                )
            }
            
            setEditingVariant(updated)
        } else {
            const updated = { ...newVariant, [name]: value }
            
            // Handle profit and profit_margin calculations
            if (name === 'profit') {
                // When profit changes, calculate margin and ex-factory price
                updated.profit_margin = calculateMarginFromProfit(
                    updated.purchasing_price,
                    updated.packing_cost,
                    updated.labour_overhead,
                    value
                )
                updated.exfactoryprice = calculateExFactoryPrice(
                    updated.purchasing_price,
                    updated.packing_cost,
                    updated.labour_overhead,
                    value
                )
            } else if (name === 'profit_margin') {
                // When margin changes, calculate profit and ex-factory price
                updated.profit = calculateProfitFromMargin(
                    updated.purchasing_price,
                    updated.packing_cost,
                    updated.labour_overhead,
                    value
                )
                updated.exfactoryprice = calculateExFactoryPrice(
                    updated.purchasing_price,
                    updated.packing_cost,
                    updated.labour_overhead,
                    updated.profit
                )
            }

            // Recalculate when cost components change
            if (name === 'purchasing_price' || name === 'packing_cost' || name === 'labour_overhead') {
                if (updated.profit) {
                    // If profit is set, recalculate margin
                    updated.profit_margin = calculateMarginFromProfit(
                        name === 'purchasing_price' ? value : updated.purchasing_price,
                        name === 'packing_cost' ? value : updated.packing_cost,
                        name === 'labour_overhead' ? value : updated.labour_overhead,
                        updated.profit
                    )
                } else if (updated.profit_margin) {
                    // If margin is set, recalculate profit
                    updated.profit = calculateProfitFromMargin(
                        name === 'purchasing_price' ? value : updated.purchasing_price,
                        name === 'packing_cost' ? value : updated.packing_cost,
                        name === 'labour_overhead' ? value : updated.labour_overhead,
                        updated.profit_margin
                    )
                }
                // Always recalculate ex-factory price
                updated.exfactoryprice = calculateExFactoryPrice(
                    name === 'purchasing_price' ? value : updated.purchasing_price,
                    name === 'packing_cost' ? value : updated.packing_cost,
                    name === 'labour_overhead' ? value : updated.labour_overhead,
                    updated.profit
                )
            }
            
            setNewVariant(updated)
        }
    }

    const handleAddVariant = async () => {
        if (!newVariant.size || !newVariant.purchasing_price) {
            setError('Please fill in size and purchase price')
            setTimeout(() => setError(''), 3000)
            return
        }

        const variantToAdd = {
            id: Date.now(),
            size: newVariant.size,
            unit: newVariant.unit,
            purchasing_price: parseFloat(newVariant.purchasing_price),
            usdrate: parseFloat(newVariant.usdrate),
            packing_cost: parseFloat(newVariant.packing_cost) || 0,
            labour_overhead: parseFloat(newVariant.labour_overhead) || 0,
            profit: parseFloat(newVariant.profit) || 0,
            profit_margin: parseFloat(newVariant.profit_margin) || 0,
            exfactoryprice: parseFloat(newVariant.exfactoryprice)
        }

        if (!isEditMode) {
            setVariants(prev => [...prev, variantToAdd])
            setNewVariant({
                size: '',
                unit: 'kg',
                purchasing_price: '',
                usdrate: currentUsdRate ? currentUsdRate.toFixed(2) : '',
                packing_cost: '',
                labour_overhead: '',
                profit: '',
                profit_margin: '',
                exfactoryprice: ''
            })
            setSuccess('Variant added (will be saved with product)')
            setTimeout(() => setSuccess(''), 2000)
            return
        }

        try {
            const res = await fetch(`${API_URL}/api/exportproductlist/${id}/variants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    size: newVariant.size,
                    unit: newVariant.unit,
                    purchasing_price: newVariant.purchasing_price,
                    usdrate: newVariant.usdrate,
                    packing_cost: newVariant.packing_cost || 0,
                    labour_overhead: newVariant.labour_overhead || 0,
                    profit: newVariant.profit || 0,
                    profit_margin: newVariant.profit_margin || 0,
                    exfactoryprice: newVariant.exfactoryprice
                })
            })

            if (!res.ok) throw new Error('Failed to add variant')

            const savedVariant = await res.json()
            setVariants(prev => [...prev, savedVariant])
            setNewVariant({
                size: '',
                unit: 'kg',
                purchasing_price: '',
                usdrate: currentUsdRate ? currentUsdRate.toFixed(2) : '',
                packing_cost: '',
                labour_overhead: '',
                profit: '',
                profit_margin: '',
                exfactoryprice: ''
            })
            setSuccess('Variant added successfully!')
            setTimeout(() => setSuccess(''), 2000)
        } catch (err) {
            setError(err.message)
            setTimeout(() => setError(''), 3000)
        }
    }

    const handleEditVariant = (variant) => {
        setEditingVariant({ 
            ...variant,
            // Use current USD rate from DB when editing
            usdrate: currentUsdRate ? currentUsdRate.toFixed(2) : variant.usdrate,
            profit: variant.profit || '',
            profit_margin: variant.profit_margin || ''
        })
    }

    const handleUpdateVariant = async () => {
        if (!editingVariant.size || !editingVariant.purchasing_price) {
            setError('Please fill in size and purchase price')
            setTimeout(() => setError(''), 3000)
            return
        }

        if (!isEditMode) {
            setVariants(prev =>
                prev.map(v => v.id === editingVariant.id ? {
                    ...editingVariant,
                    size: editingVariant.size,
                    purchasing_price: parseFloat(editingVariant.purchasing_price),
                    usdrate: parseFloat(editingVariant.usdrate),
                    packing_cost: parseFloat(editingVariant.packing_cost) || 0,
                    labour_overhead: parseFloat(editingVariant.labour_overhead) || 0,
                    profit: parseFloat(editingVariant.profit) || 0,
                    profit_margin: parseFloat(editingVariant.profit_margin) || 0,
                    exfactoryprice: parseFloat(editingVariant.exfactoryprice)
                } : v)
            )
            setEditingVariant(null)
            setSuccess('Variant updated')
            setTimeout(() => setSuccess(''), 2000)
            return
        }

        try {
            const res = await fetch(
                `${API_URL}/api/exportproductlist/${id}/variants/${editingVariant.id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        size: editingVariant.size,
                        unit: editingVariant.unit,
                        purchasing_price: editingVariant.purchasing_price,
                        usdrate: editingVariant.usdrate,
                        packing_cost: editingVariant.packing_cost || 0,
                        labour_overhead: editingVariant.labour_overhead || 0,
                        profit: editingVariant.profit || 0,
                        profit_margin: editingVariant.profit_margin || 0,
                        exfactoryprice: editingVariant.exfactoryprice
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
            setVariants(prev => prev.filter(v => v.id !== variantId))
            setSuccess('Variant removed')
            setTimeout(() => setSuccess(''), 2000)
            return
        }

        try {
            const res = await fetch(
                `${API_URL}/api/exportproductlist/${id}/variants/${variantId}`,
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
                ? `${API_URL}/api/exportproductlist/upload/${id}`
                : `${API_URL}/api/exportproductlist/upload`

            const method = isEditMode ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                body: data
            })

            if (!res.ok) throw new Error(`Failed to ${isEditMode ? 'update' : 'add'} product`)

            setSuccess(`Product ${isEditMode ? 'updated' : 'added'} successfully!`)

            setTimeout(() => {
                navigate('/exportproductlist')
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

            {/* Display current USD rate from database */}
            {currentUsdRate && (
                <div style={{
                    padding: '12px 15px',
                    backgroundColor: '#e3f2fd',
                    borderLeft: '4px solid #2196f3',
                    borderRadius: '4px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1976d2' }}>
                            Current USD Rate: Rs. {currentUsdRate.toFixed(2)}
                        </div>
                        {rateLastUpdated && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                Last updated: {new Date(rateLastUpdated).toLocaleString()}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={fetchUsdRateFromDB}
                        disabled={loadingRate}
                        style={{
                            padding: '6px 16px',
                            cursor: loadingRate ? 'not-allowed' : 'pointer',
                            backgroundColor: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: '500',
                            opacity: loadingRate ? 0.6 : 1
                        }}
                    >
                        {loadingRate ? 'Refreshing...' : '🔄 Refresh Rate'}
                    </button>
                </div>
            )}

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

                <label className="apf-label">Category</label>
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

                <h3 style={{ marginTop: '20px' }}>Product Variants (Size & Pricing)</h3>
                <br />
                {variants.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="variants-table" style={{ width: '100%', marginBottom: '20px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Size</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Unit</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Purchase (LKR)</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Packing</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Labour</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Profit (LKR)</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Margin (%)</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Ex-Factory (LKR)</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Ex-Factory (USD)</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', width: '150px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variants.map(variant => (
                                    <tr key={variant.id}>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{variant.size}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{variant.unit}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            Rs. {parseFloat(variant.purchasing_price).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            Rs. {parseFloat(variant.packing_cost || 0).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            Rs. {parseFloat(variant.labour_overhead || 0).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', color: '#2e7d32' }}>
                                            Rs. {parseFloat(variant.profit || 0).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', color: '#2e7d32' }}>
                                            {parseFloat(variant.profit_margin || 0).toFixed(2)}%
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                            Rs. {parseFloat(variant.exfactoryprice).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', color: '#1976d2', fontWeight: '500' }}>
                                            $ {(parseFloat(variant.exfactoryprice) / parseFloat(variant.usdrate)).toFixed(2)}
                                        </td>
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
                    </div>
                )}

                <div className='variant-form'>
                    <h4 style={{ marginTop: 0 }}>{editingVariant ? 'Edit Variant' : 'Add New Variant'}</h4>
                    <br />
                    <div>
                        <div>
                            <label className="apf-label">Size</label>
                            <input
                                className="apf-input"
                                name="size"
                                type="text"
                                placeholder="e.g., 1-1.4, 5-10, 10+"
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
                                <option value="">Select Unit</option>
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="lbs">lbs</option>
                                <option value="pcs">pcs</option>
                            </select>
                        </div>

                        <div>
                            <label className="apf-label">
                                USD Rate
                                {currentUsdRate && (
                                    <span style={{ fontSize: '11px', color: '#2196f3', marginLeft: '5px', fontWeight: 'bold' }}>
                                        (Current: {currentUsdRate.toFixed(2)})
                                    </span>
                                )}
                            </label>
                            <input
                                className="apf-input"
                                name="usdrate"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={editingVariant ? editingVariant.usdrate : newVariant.usdrate}
                                disabled
                                onWheel={(e) => e.target.blur()}
                            />
                        </div>

                        <div>
                            <label className="apf-label">Purchase Price (LKR)</label>
                            <input
                                className="apf-input"
                                name="purchasing_price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={editingVariant ? editingVariant.purchasing_price : newVariant.purchasing_price}
                                onChange={handleVariantChange}
                                onWheel={(e) => e.target.blur()}
                            />

                            <label className="apf-label">Purchase Price (USD)</label>
                            <input
                                className="apf-input"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={
                                    editingVariant
                                        ? (editingVariant.purchasing_price && editingVariant.usdrate
                                            ? (parseFloat(editingVariant.purchasing_price) / parseFloat(editingVariant.usdrate)).toFixed(2)
                                            : '0.00')
                                        : (newVariant.purchasing_price && newVariant.usdrate
                                            ? (parseFloat(newVariant.purchasing_price) / parseFloat(newVariant.usdrate)).toFixed(2)
                                            : '0.00')
                                }
                                disabled
                                onWheel={(e) => e.target.blur()}
                            />
                        </div>

                        <div>
                            <label className="apf-label">Packing Cost (LKR)</label>
                            <input
                                className="apf-input"
                                name="packing_cost"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={editingVariant ? editingVariant.packing_cost : newVariant.packing_cost}
                                onChange={handleVariantChange}
                                onWheel={(e) => e.target.blur()}
                            />

                            <label className="apf-label">Labour Overhead (LKR)</label>
                            <input
                                className="apf-input"
                                name="labour_overhead"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={editingVariant ? editingVariant.labour_overhead : newVariant.labour_overhead}
                                onChange={handleVariantChange}
                                onWheel={(e) => e.target.blur()}
                            />
                        </div>

                        <div>
                            <label className="apf-label">Profit (LKR)</label>
                            <input
                                className="apf-input"
                                name="profit"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={editingVariant ? editingVariant.profit : newVariant.profit}
                                onChange={handleVariantChange}
                                onWheel={(e) => e.target.blur()}
                            />

                            <label className="apf-label">Profit Margin (%)</label>
                            <input
                                className="apf-input"
                                name="profit_margin"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={editingVariant ? editingVariant.profit_margin : newVariant.profit_margin}
                                onChange={handleVariantChange}
                                onWheel={(e) => e.target.blur()}
                            />
                        </div>

                        <div>
                            <label className="apf-label">
                                Ex-Factory Price (LKR)
                                <span style={{ fontSize: '11px', color: '#666', marginLeft: '5px' }}>
                                    (Auto-calculated)
                                </span>
                            </label>
                            <input
                                className="apf-input"
                                name="exfactoryprice"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={editingVariant ? editingVariant.exfactoryprice : newVariant.exfactoryprice}
                                disabled
                                onWheel={(e) => e.target.blur()}
                            />

                            <label className="apf-label">Ex-Factory Price (USD)</label>
                            <input
                                className="apf-input"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={
                                    editingVariant
                                        ? (editingVariant.exfactoryprice && editingVariant.usdrate
                                            ? (parseFloat(editingVariant.exfactoryprice) / parseFloat(editingVariant.usdrate)).toFixed(2)
                                            : '0.00')
                                        : (newVariant.exfactoryprice && newVariant.usdrate
                                            ? (parseFloat(newVariant.exfactoryprice) / parseFloat(newVariant.usdrate)).toFixed(2)
                                            : '0.00')
                                }
                                disabled
                                onWheel={(e) => e.target.blur()}
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
                    onClick={() => navigate('/exportproductlist')}
                >
                    Cancel
                </button>
            </form>

            {success && <div className="apf-success">{success}</div>}
            {error && <div className="apf-error">{error}</div>}
        </div>
    )
}

export default ExportAddProductForm