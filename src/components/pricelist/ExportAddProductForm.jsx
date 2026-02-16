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
        species_type: 'crustacean',
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
        exfactoryprice: '',
        multiplier: '',
        divisor: '1'
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

    // MODIFIED: Calculation functions now convert USD to LKR for costs
    const calculateCostPrice = (purchasePrice, packingCostUSD, labourOverheadUSD, usdRate) => {
        const purchase = parseFloat(purchasePrice) || 0
        const packingUSD = parseFloat(packingCostUSD) || 0
        const labourUSD = parseFloat(labourOverheadUSD) || 0
        const rate = parseFloat(usdRate) || 1
        
        // Convert USD costs to LKR
        const packingLKR = packingUSD * rate
        const labourLKR = labourUSD * rate
        
        return purchase + packingLKR + labourLKR
    }

    const calculateExFactoryPrice = (purchasePrice, packingCostUSD, labourOverheadUSD, profit, usdRate) => {
        const costPrice = calculateCostPrice(purchasePrice, packingCostUSD, labourOverheadUSD, usdRate)
        const profitAmount = parseFloat(profit) || 0
        return (costPrice + profitAmount).toFixed(2)
    }

    const calculateMarginFromProfit = (purchasePrice, profit) => {
        const purchase = parseFloat(purchasePrice) || 0
        const profitAmount = parseFloat(profit) || 0
        const total = purchase + profitAmount
        if (total === 0) return '0.00'
        return ((profitAmount / total) * 100).toFixed(2)
    }

    const calculateProfitFromMargin = (purchasePrice, profitMargin) => {
        const purchase = parseFloat(purchasePrice) || 0
        const margin = parseFloat(profitMargin) || 0
        
        if (margin >= 100) {
            return '0.00'
        }
        
        if (margin === 0) return '0.00'
        
        return ((margin * purchase) / (100 - margin)).toFixed(2)
    }

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

                setNewVariant(prev => ({ ...prev, usdrate: data.rate.toFixed(2) }))
                
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

    useEffect(() => {
        fetchUsdRateFromDB()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl
        }
        return `${API_URL}${imageUrl}`
    }

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
                        species_type: product.species_type || 'crustacean',
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

    // MODIFIED: Updated to use USD rate in calculations
    const handleVariantChange = e => {
        const { name, value } = e.target
        
        if (editingVariant) {
            const updated = { ...editingVariant, [name]: value }
            
            if (name === 'profit') {
                updated.profit_margin = calculateMarginFromProfit(
                    updated.purchasing_price,
                    value
                )
                updated.exfactoryprice = calculateExFactoryPrice(
                    updated.purchasing_price,
                    updated.packing_cost,
                    updated.labour_overhead,
                    value,
                    updated.usdrate
                )
            } else if (name === 'profit_margin') {
                updated.profit = calculateProfitFromMargin(
                    updated.purchasing_price,
                    value
                )
                updated.exfactoryprice = calculateExFactoryPrice(
                    updated.purchasing_price,
                    updated.packing_cost,
                    updated.labour_overhead,
                    updated.profit,
                    updated.usdrate
                )
            }

            if (name === 'purchasing_price' || name === 'packing_cost' || name === 'labour_overhead') {
                updated.exfactoryprice = calculateExFactoryPrice(
                    name === 'purchasing_price' ? value : updated.purchasing_price,
                    name === 'packing_cost' ? value : updated.packing_cost,
                    name === 'labour_overhead' ? value : updated.labour_overhead,
                    updated.profit,
                    updated.usdrate
                )
                
                if (name === 'purchasing_price' && updated.profit) {
                    updated.profit_margin = calculateMarginFromProfit(value, updated.profit)
                }
            }
            
            setEditingVariant(updated)
        } else {
            const updated = { ...newVariant, [name]: value }
            
            if (name === 'profit') {
                updated.profit_margin = calculateMarginFromProfit(
                    updated.purchasing_price,
                    value
                )
                updated.exfactoryprice = calculateExFactoryPrice(
                    updated.purchasing_price,
                    updated.packing_cost,
                    updated.labour_overhead,
                    value,
                    updated.usdrate
                )
            } else if (name === 'profit_margin') {
                updated.profit = calculateProfitFromMargin(
                    updated.purchasing_price,
                    value
                )
                updated.exfactoryprice = calculateExFactoryPrice(
                    updated.purchasing_price,
                    updated.packing_cost,
                    updated.labour_overhead,
                    updated.profit,
                    updated.usdrate
                )
            }

            if (name === 'purchasing_price' || name === 'packing_cost' || name === 'labour_overhead') {
                updated.exfactoryprice = calculateExFactoryPrice(
                    name === 'purchasing_price' ? value : updated.purchasing_price,
                    name === 'packing_cost' ? value : updated.packing_cost,
                    name === 'labour_overhead' ? value : updated.labour_overhead,
                    updated.profit,
                    updated.usdrate
                )
                
                if (name === 'purchasing_price' && updated.profit) {
                    updated.profit_margin = calculateMarginFromProfit(value, updated.profit)
                }
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
            exfactoryprice: parseFloat(newVariant.exfactoryprice),
            multiplier: parseFloat(newVariant.multiplier) || 0,
            divisor: parseFloat(newVariant.divisor) || 1
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
                exfactoryprice: '',
                multiplier: '',
                divisor: '1'
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
                    exfactoryprice: newVariant.exfactoryprice,
                    multiplier: newVariant.multiplier || 0,
                    divisor: newVariant.divisor || 1
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
                exfactoryprice: '',
                multiplier: '',
                divisor: '1'
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
            usdrate: currentUsdRate ? currentUsdRate.toFixed(2) : variant.usdrate,
            profit: variant.profit || '',
            profit_margin: variant.profit_margin || '',
            multiplier: variant.multiplier || '',
            divisor: variant.divisor || '1'
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
                    exfactoryprice: parseFloat(editingVariant.exfactoryprice),
                    multiplier: parseFloat(editingVariant.multiplier) || 0,
                    divisor: parseFloat(editingVariant.divisor) || 1
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
                        exfactoryprice: editingVariant.exfactoryprice,
                        multiplier: editingVariant.multiplier || 0,
                        divisor: editingVariant.divisor || 1
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
            data.append('species_type', form.species_type)
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

                <label className="apf-label">Species Type</label>
                <select
                    className="apf-input"
                    name="species_type"
                    value={form.species_type}
                    onChange={handleChange}
                    required
                >
                    <option value="crustacean">Crustacean</option>
                    <option value="fish">Fish</option>
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
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Ex-Factory (LKR)</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Multiplier</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Divisor</th>
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
                                        <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                            Rs. {parseFloat(variant.exfactoryprice).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', color: '#2196f3' }}>
                                            {variant.multiplier || '-'}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', color: '#2196f3' }}>
                                            {variant.divisor || '-'}
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
                        </div>

                        <div>
                            {/* FIXED: Changed from usdrate to packing_cost and changed label to USD */}
                            <label className="apf-label">Packing Cost (USD)</label>
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

                            <label className="apf-label">Factory Overhead (USD)</label>
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
                        </div>

                        <div style={{
                            gridColumn: '1 / -1',
                            backgroundColor: '#e3f2fd',
                            padding: '15px',
                            borderRadius: '6px',
                            marginTop: '15px',
                            border: '2px solid #2196f3'
                        }}>
                            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#1976d2' }}>
                                ✈️ Air Freight Parameters
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label className="apf-label" style={{ color: '#1976d2' }}>
                                        Multiplier (Gross Weight in kg)
                                    </label>
                                    <input
                                        className="apf-input"
                                        name="multiplier"
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g., 150"
                                        value={editingVariant ? editingVariant.multiplier : newVariant.multiplier}
                                        onChange={handleVariantChange}
                                        onWheel={(e) => e.target.blur()}
                                    />
                                    <small style={{ color: '#666', fontSize: '11px' }}>
                                        Used in freight calculation: (multiplier × rate) / divisor
                                    </small>
                                </div>

                                <div>
                                    <label className="apf-label" style={{ color: '#1976d2' }}>
                                        Divisor
                                    </label>
                                    <input
                                        className="apf-input"
                                        name="divisor"
                                        type="number"
                                        step="0.01"
                                        placeholder="Default: 1"
                                        value={editingVariant ? editingVariant.divisor : newVariant.divisor}
                                        onChange={handleVariantChange}
                                        onWheel={(e) => e.target.blur()}
                                    />
                                    <small style={{ color: '#666', fontSize: '11px' }}>
                                        Default is 1 (usually no division needed)
                                    </small>
                                </div>
                            </div>
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