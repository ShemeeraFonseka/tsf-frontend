import React, { useState, useEffect } from 'react'
import './AddProductForm.css'

const UsdRateForm = () => {
    const API_URL = process.env.REACT_APP_API_URL

    const [form, setForm] = useState({
        rate: '',
        date: new Date().toISOString().split('T')[0]
    })

    const [currentRate, setCurrentRate] = useState(null)
    const [rateHistory, setRateHistory] = useState([])
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [recalcInfo, setRecalcInfo] = useState(null)

    const fetchCurrentRate = async () => {
        try {
            const response = await fetch(`${API_URL}/api/usd-rate`)
            if (response.ok) {
                const data = await response.json()
                setCurrentRate(data)
            }
        } catch (err) {
            console.error('Failed to fetch current rate:', err)
        }
    }

    const fetchRateHistory = async () => {
        try {
            const response = await fetch(`${API_URL}/api/usd-rate/history`)
            if (response.ok) {
                const data = await response.json()
                setRateHistory(data)
            }
        } catch (err) {
            console.error('Failed to fetch rate history:', err)
        }
    }

    // Function to recalculate Ex-Factory price with USD-based costs
    const calculateExFactoryPrice = (purchasePrice, packingCostUSD, labourOverheadUSD, profit, usdRate) => {
        const purchase = parseFloat(purchasePrice) || 0
        const packingUSD = parseFloat(packingCostUSD) || 0
        const labourUSD = parseFloat(labourOverheadUSD) || 0
        const profitAmount = parseFloat(profit) || 0
        const rate = parseFloat(usdRate) || 1
        
        // Convert USD costs to LKR
        const packingLKR = packingUSD * rate
        const labourLKR = labourUSD * rate
        
        const costPrice = purchase + packingLKR + labourLKR
        return parseFloat((costPrice + profitAmount).toFixed(2))
    }

    // Enhanced function to update USD rate AND recalculate Ex-Factory prices
    const updateExportProductsUsdRate = async (newRate) => {
        try {
            // Fetch all export products
            const response = await fetch(`${API_URL}/api/exportproductlist`)
            if (!response.ok) throw new Error('Failed to fetch products')
            
            const products = await response.json()
            
            let updatedCount = 0
            let errorCount = 0

            // Update each product's variants
            for (const product of products) {
                if (product.variants && product.variants.length > 0) {
                    try {
                        // Update each variant with new USD rate and recalculate Ex-Factory price
                        const updatedVariants = product.variants.map(variant => {
                            // Recalculate Ex-Factory price with existing values and new USD rate
                            const newExFactoryPrice = calculateExFactoryPrice(
                                variant.purchasing_price,
                                variant.packing_cost,
                                variant.labour_overhead,
                                variant.profit,
                                newRate  // Pass the new USD rate
                            )

                            return {
                                ...variant,
                                usdrate: parseFloat(newRate),
                                exfactoryprice: newExFactoryPrice
                            }
                        })

                        // Update the product using FormData (same as the form)
                        const formData = new FormData()
                        formData.append('common_name', product.common_name)
                        formData.append('scientific_name', product.scientific_name || '')
                        formData.append('category', product.category)
                        formData.append('species_type', product.species_type || 'crustacean')
                        formData.append('existing_image_url', product.image_url || '')
                        formData.append('variants', JSON.stringify(updatedVariants))

                        const updateResponse = await fetch(
                            `${API_URL}/api/exportproductlist/upload/${product.id}`,
                            {
                                method: 'PUT',
                                body: formData
                            }
                        )

                        if (updateResponse.ok) {
                            updatedCount++
                        } else {
                            errorCount++
                            const errorData = await updateResponse.json()
                            console.error(`Failed to update product ${product.id}:`, errorData)
                        }
                    } catch (err) {
                        console.error(`Error updating product ${product.id}:`, err)
                        errorCount++
                    }
                }
            }

            console.log(`Export products updated: ${updatedCount} success, ${errorCount} errors`)
            return { updated: updatedCount, errors: errorCount }
        } catch (err) {
            console.error('Error updating export products:', err)
            return { updated: 0, errors: 0 }
        }
    }

    useEffect(() => {
        fetchCurrentRate();
        fetchRateHistory();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
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

        if (!form.rate || parseFloat(form.rate) <= 0) {
            setError('Please enter a valid USD rate')
            setLoading(false)
            return
        }

        try {
            const newRate = parseFloat(form.rate)

            // Step 1: Update USD rate in database (this triggers customer product recalculation)
            const response = await fetch(`${API_URL}/api/usd-rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rate: newRate,
                    date: form.date
                })
            })

            if (!response.ok) {
                throw new Error('Failed to update USD rate')
            }

            const data = await response.json()
            
            // Step 2: Update export products with new USD rate and recalculate Ex-Factory prices
            const exportProductsResult = await updateExportProductsUsdRate(newRate)
            
            // Show success with recalculation info
            const totalUpdated = (data.recalculation?.productsUpdated || 0) + exportProductsResult.updated
            const totalErrors = (data.recalculation?.errors || 0) + exportProductsResult.errors
            
            setRecalcInfo({
                customerProductsUpdated: data.recalculation?.productsUpdated || 0,
                exportProductsUpdated: exportProductsResult.updated,
                totalUpdated: totalUpdated,
                errors: totalErrors
            })
            
            setSuccess(`USD rate updated successfully! ${totalUpdated} item${totalUpdated !== 1 ? 's' : ''} recalculated.`)
            
            await fetchCurrentRate()
            await fetchRateHistory()
            
            setForm({
                rate: '',
                date: new Date().toISOString().split('T')[0]
            })

            setTimeout(() => {
                setSuccess('')
                setRecalcInfo(null)
            }, 6000)
        } catch (err) {
            setError(err.message)
            setTimeout(() => setError(''), 3000)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this rate entry?')) {
            return
        }

        try {
            const response = await fetch(`${API_URL}/api/usd-rate/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete rate')
            }

            setSuccess('Rate entry deleted successfully!')
            await fetchCurrentRate()
            await fetchRateHistory()
            setTimeout(() => setSuccess(''), 2000)
        } catch (err) {
            setError(err.message)
            setTimeout(() => setError(''), 3000)
        }
    }

    return (
        <div className='form-container'>
            <h2>Update USD Exchange Rate</h2>

            {/* Current Rate Display */}
            {currentRate && (
                <div style={{
                    padding: '15px',
                    backgroundColor: '#e8f5e9',
                    borderLeft: '4px solid #4caf50',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#2e7d32' }}>
                        Current USD Rate: Rs. {parseFloat(currentRate.rate).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                        Last updated: {new Date(currentRate.updated_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                    {currentRate.date && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                            Rate date: {new Date(currentRate.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Warning Banner */}
            <div style={{
                padding: '15px',
                backgroundColor: '#fff3e0',
                borderLeft: '4px solid #ff9800',
                borderRadius: '4px',
                marginBottom: '20px'
            }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#e65100', marginBottom: '8px' }}>
                    ⚠️ Important: Automatic Recalculation
                </div>
                <div style={{ fontSize: '13px', color: '#5d4037', lineHeight: '1.5' }}>
                    Updating the USD rate will automatically:
                    <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
                        <li>Update USD rate in all export product variants</li>
                        <li>Recalculate Ex-Factory prices (converts USD packing/overhead costs to LKR)</li>
                        <li>Recalculate FOB and CNF prices for all customer products</li>
                    </ul>
                </div>
            </div>

            {/* Update Form */}
            <form onSubmit={handleSubmit} className="apf-container">
                <label className="apf-label">USD Rate (LKR)</label>
                <input
                    className="apf-input"
                    type="number"
                    name="rate"
                    step="0.01"
                    placeholder="e.g., 295.50"
                    value={form.rate}
                    onChange={handleChange}
                    required
                    onWheel={(e) => e.target.blur()}
                />

                <label className="apf-label">Rate Date (from CBSL)</label>
                <input
                    className="apf-input"
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                />

                <button 
                    type="submit" 
                    className="apf-btn"
                    disabled={loading}
                    style={{ opacity: loading ? 0.6 : 1 }}
                >
                    {loading ? 'Updating & Recalculating...' : 'Update USD Rate'}
                </button>
            </form>

            {success && (
                <div className="apf-success">
                    {success}
                    {recalcInfo && recalcInfo.errors > 0 && (
                        <div style={{ 
                            marginTop: '8px', 
                            fontSize: '13px', 
                            color: '#ff9800' 
                        }}>
                            ⚠️ {recalcInfo.errors} item{recalcInfo.errors !== 1 ? 's' : ''} had errors during recalculation
                        </div>
                    )}
                </div>
            )}
            {error && <div className="apf-error">{error}</div>}

            {/* Enhanced Recalculation Info */}
            {recalcInfo && (
                <div style={{
                    padding: '15px',
                    backgroundColor: '#e3f2fd',
                    borderLeft: '4px solid #2196f3',
                    borderRadius: '4px',
                    marginTop: '15px',
                    marginBottom: '15px'
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1976d2', marginBottom: '12px' }}>
                        🔄 Automatic Recalculation Complete
                    </div>
                    
                    {/* Customer Products */}
                    <div style={{ 
                        fontSize: '13px', 
                        color: '#424242', 
                        marginBottom: '8px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #90caf9'
                    }}>
                        <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '4px' }}>
                            Customer Products:
                        </div>
                        <div style={{ paddingLeft: '10px' }}>
                            ✓ Recalculated {recalcInfo.customerProductsUpdated} FOB & CNF price{recalcInfo.customerProductsUpdated !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Export Products */}
                    <div style={{ 
                        fontSize: '13px', 
                        color: '#424242', 
                        marginBottom: '8px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #90caf9'
                    }}>
                        <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '4px' }}>
                            Export Products:
                        </div>
                        <div style={{ paddingLeft: '10px' }}>
                            ✓ Updated USD rate in {recalcInfo.exportProductsUpdated} product{recalcInfo.exportProductsUpdated !== 1 ? 's' : ''}
                        </div>
                        <div style={{ paddingLeft: '10px' }}>
                            ✓ Recalculated Ex-Factory prices (USD costs converted to LKR)
                        </div>
                    </div>

                    {/* Total */}
                    <div style={{ 
                        fontSize: '14px', 
                        color: '#1976d2', 
                        fontWeight: 'bold', 
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '2px solid #2196f3'
                    }}>
                        Total: {recalcInfo.totalUpdated} item{recalcInfo.totalUpdated !== 1 ? 's' : ''} updated
                    </div>
                    
                    {recalcInfo.errors > 0 && (
                        <div style={{ fontSize: '13px', color: '#d32f2f', marginTop: '8px' }}>
                            ✗ {recalcInfo.errors} error{recalcInfo.errors !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            )}

            {/* Rate History */}
            {rateHistory.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <h3>Rate History</h3>
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        marginTop: '15px'
                    }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                    Rate (LKR)
                                </th>
                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                    Rate Date
                                </th>
                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                    Updated At
                                </th>
                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', width: '100px' }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rateHistory.map((entry, index) => (
                                <tr key={entry.id || index}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                        Rs. {parseFloat(entry.rate).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        {new Date(entry.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        {new Date(entry.updated_at).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        {index !== 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(entry.id)}
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
                                        )}
                                        {index === 0 && (
                                            <span style={{ 
                                                color: '#4caf50', 
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                Current
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default UsdRateForm