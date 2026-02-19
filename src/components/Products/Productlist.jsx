import React, { useEffect, useState } from 'react';
import './Productlist.css'
import { useNavigate } from "react-router-dom";

/* ── Badge helpers ─────────────────────────────────────────────── */
const getSpeciesBadgeClass = (speciesType) => {
    if (!speciesType) return 'badge-default'
    const val = speciesType.toLowerCase()
    if (val === 'fish') return 'badge-fish'
    if (val === 'crustacean') return 'badge-crustacean'
    return 'badge-default'
}

const getSpeciesBadgeIcon = (speciesType) => {
    if (!speciesType) return '🌊'
    const val = speciesType.toLowerCase()
    if (val === 'fish') return '🐟'
    if (val === 'crustacean') return '🦞'
    return '🌊'
}

const getCategoryBadgeClass = (category) => {
    if (!category) return 'badge-default-cat'
    const val = category.toLowerCase()
    if (val === 'live')   return 'badge-live'
    if (val === 'fresh')  return 'badge-fresh'
    if (val === 'frozen') return 'badge-frozen'
    return 'badge-default-cat'
}

const getCategoryBadgeIcon = (category) => {
    if (!category) return ''
    const val = category.toLowerCase()
    if (val === 'live')   return '🟢'
    if (val === 'fresh')  return '💧'
    if (val === 'frozen') return '❄️'
    return ''
}
/* ──────────────────────────────────────────────────────────────── */

const Productlist = () => {
    const API_URL = process.env.REACT_APP_API_URL

    const [items, setItems] = useState([])
    const [filteredItems, setFilteredItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedSpeciesType, setSelectedSpeciesType] = useState('all')

    const speciesTypes = [
        { value: 'all',        label: 'All Products', icon: '🌊' },
        { value: 'crustacean', label: 'Crustacean',   icon: '🦞' },
        { value: 'fish',       label: 'Fish',          icon: '🐟' }
    ]

    useEffect(() => { fetchProducts() }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (selectedSpeciesType === 'all') {
            setFilteredItems(items)
        } else {
            setFilteredItems(items.filter(item =>
                item.species_type?.toLowerCase() === selectedSpeciesType.toLowerCase()
            ))
        }
    }, [selectedSpeciesType, items])

    const fetchProducts = () => {
        fetch(`${API_URL}/api/productlist`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch')
                return res.json()
            })
            .then(data => { setItems(data); setFilteredItems(data); setLoading(false) })
            .catch(err => { setError(err.message); setLoading(false) })
    }

    const handleDelete = async (productId, productName) => {
        if (!window.confirm(`Are you sure you want to delete "${productName}"? This will delete all variants as well.`)) return
        try {
            const res = await fetch(`${API_URL}/api/productlist/${productId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            fetchProducts()
        } catch (err) {
            alert('Error deleting product: ' + err.message)
        }
    }

    const formatCategory   = (c) => !c ? '-' : c.charAt(0).toUpperCase() + c.slice(1)
    const formatSpeciesType = (s) => {
        if (!s) return '-'
        const t = speciesTypes.find(x => x.value === s.toLowerCase())
        return t ? t.label : s.charAt(0).toUpperCase() + s.slice(1)
    }

    const navigate = useNavigate()
    const navigateForm = ()           => navigate('/productform')
    const navigateEdit = (productId) => navigate(`/productform/${productId}`)

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return '/images/placeholder-seafood.png'
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
        return `${API_URL}${imageUrl}`
    }

    const getSpeciesTypeCount = (typeValue) => {
        if (typeValue === 'all') return items.length
        return items.filter(item => item.species_type?.toLowerCase() === typeValue).length
    }

    // ── Group filteredItems by common_name ────────────────────────────
    const groupedProducts = filteredItems.reduce((acc, product) => {
        const key = product.common_name
        if (!acc[key]) acc[key] = []
        acc[key].push(product)
        return acc
    }, {})

    const getTotalRowsForGroup = (products) =>
        products.reduce((sum, product) => {
            const variants = product.variants || []
            return sum + (variants.length > 0 ? variants.length : 1)
        }, 0)

    return (
        <div className="pricelist-container">
            <h2>Local Product List</h2>

            <div className='add-section'>
                <button className='apf-btn' onClick={navigateForm}>+ Add Product</button>
            </div>

            {/* Species Filter Pills */}
            <div className='species-filter'>
                {speciesTypes.map(type => {
                    const count = getSpeciesTypeCount(type.value)
                    return (
                        <button
                            key={type.value}
                            className={`species-pill ${selectedSpeciesType === type.value ? 'active' : ''}`}
                            onClick={() => setSelectedSpeciesType(type.value)}
                            disabled={count === 0 && type.value !== 'all'}
                        >
                            <span className="species-icon">{type.icon}</span>
                            <span className="species-label">{type.label}</span>
                            <span className="species-count">({count})</span>
                        </button>
                    )
                })}
            </div>

            {loading && <div className="info">Loading…</div>}
            {error   && <div className="error">{error}</div>}

            {!loading && !error && (
                <>
                    <div className="filter-info">
                        Showing <strong>{filteredItems.length}</strong>{' '}
                        {selectedSpeciesType === 'all' ? 'products' : formatSpeciesType(selectedSpeciesType)}
                    </div>

                    <div className="table-wrap">
                        <table className="pricelist-table">
                            <thead>
                                <tr>
                                    <th>Picture</th>
                                    <th>Common Name</th>
                                    <th>Scientific Name</th>
                                    <th>Condition</th>
                                    <th>Type</th>
                                    <th>Size</th>
                                    <th>Purchase Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(groupedProducts).length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="muted" style={{ textAlign: 'center', padding: '3rem' }}>
                                            {selectedSpeciesType === 'all'
                                                ? 'No items found'
                                                : `No ${formatSpeciesType(selectedSpeciesType)} found`}
                                        </td>
                                    </tr>
                                )}

                                {Object.entries(groupedProducts).map(([commonName, products]) => {
                                    const groupRowSpan  = getTotalRowsForGroup(products)
                                    const firstProduct  = products[0]
                                    const imgSrc        = getImageUrl(firstProduct.image_url)
                                    let isFirstRowOfGroup = true

                                    return products.map((product) => {
                                        const variants = product.variants || []

                                        // ── Product HAS variants ──────────────────────
                                        if (variants.length > 0) {
                                            return variants.map((variant, variantIndex) => {
                                                const isVeryFirstRow  = isFirstRowOfGroup && variantIndex === 0
                                                const isFirstOfProduct = variantIndex === 0
                                                if (isVeryFirstRow) isFirstRowOfGroup = false

                                                return (
                                                    <tr
                                                        key={`${product.id}-${variant.id || variantIndex}`}
                                                        className={isVeryFirstRow ? 'product-group-start' : ''}
                                                    >
                                                        {isVeryFirstRow && (
                                                            <>
                                                                <td className="thumb-cell" rowSpan={groupRowSpan}>
                                                                    <img src={imgSrc} alt={commonName} className="thumb" />
                                                                </td>
                                                                <td rowSpan={groupRowSpan} style={{ fontWeight: 600 }}>
                                                                    {commonName}
                                                                </td>
                                                                <td className="scientific" rowSpan={groupRowSpan}>
                                                                    {firstProduct.scientific_name || '—'}
                                                                </td>
                                                                <td rowSpan={groupRowSpan}>
                                                                    <span className={`species-badge ${getSpeciesBadgeClass(firstProduct.species_type)}`}>
                                                                        {getSpeciesBadgeIcon(firstProduct.species_type)}{' '}
                                                                        {formatSpeciesType(firstProduct.species_type)}
                                                                    </span>
                                                                </td>
                                                            </>
                                                        )}

                                                        {isFirstOfProduct && (
                                                            <td rowSpan={variants.length}>
                                                                <span className={`category-badge ${getCategoryBadgeClass(product.category)}`}>
                                                                    {getCategoryBadgeIcon(product.category)}{' '}
                                                                    {formatCategory(product.category)}
                                                                </span>
                                                            </td>
                                                        )}

                                                        <td>{variant.size || '—'}</td>
                                                        <td className="price-cell">
                                                            Rs.&nbsp;{parseFloat(variant.purchasing_price).toFixed(2)}
                                                        </td>

                                                        {isFirstOfProduct && (
                                                            <td className="actions-cell" rowSpan={variants.length}>
                                                                <div className="actions-wrapper">
                                                                    <button className="btn-edit"   onClick={() => navigateEdit(product.id)}>Edit</button>
                                                                    <button className="btn-delete" onClick={() => handleDelete(product.id, product.common_name)}>Delete</button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                )
                                            })
                                        }

                                        // ── Product has NO variants ───────────────────
                                        const isVeryFirstRow = isFirstRowOfGroup
                                        if (isVeryFirstRow) isFirstRowOfGroup = false

                                        return (
                                            <tr
                                                key={product.id}
                                                className={isVeryFirstRow ? 'product-group-start' : ''}
                                            >
                                                {isVeryFirstRow && (
                                                    <>
                                                        <td className="thumb-cell" rowSpan={groupRowSpan}>
                                                            <img src={imgSrc} alt={commonName} className="thumb" />
                                                        </td>
                                                        <td rowSpan={groupRowSpan} style={{ fontWeight: 600 }}>
                                                            {commonName}
                                                        </td>
                                                        <td className="scientific" rowSpan={groupRowSpan}>
                                                            {firstProduct.scientific_name || '—'}
                                                        </td>
                                                        <td rowSpan={groupRowSpan}>
                                                            <span className={`species-badge ${getSpeciesBadgeClass(firstProduct.species_type)}`}>
                                                                {getSpeciesBadgeIcon(firstProduct.species_type)}{' '}
                                                                {formatSpeciesType(firstProduct.species_type)}
                                                            </span>
                                                        </td>
                                                    </>
                                                )}
                                                <td>
                                                    <span className={`category-badge ${getCategoryBadgeClass(product.category)}`}>
                                                        {getCategoryBadgeIcon(product.category)}{' '}
                                                        {formatCategory(product.category)}
                                                    </span>
                                                </td>
                                                <td className="muted">—</td>
                                                <td className="muted">—</td>
                                                <td className="muted">—</td>
                                                <td className="actions-cell">
                                                    <div className="actions-wrapper">
                                                        <button className="btn-edit"   onClick={() => navigateEdit(product.id)}>Edit</button>
                                                        <button className="btn-delete" onClick={() => handleDelete(product.id, product.common_name)}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    )
}

export default Productlist