import React, { useEffect, useState } from 'react';
import './Productlist.css'
import { useNavigate } from "react-router-dom";

const Productlist = () => {
    const API_URL = process.env.REACT_APP_API_URL

    const [items, setItems] = useState([])
    const [filteredItems, setFilteredItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedSpeciesType, setSelectedSpeciesType] = useState('all')

    // Seafood species types
    const speciesTypes = [
        { value: 'all', label: 'All Products', icon: '🌊' },
        { value: 'shellfish', label: 'Shellfish', icon: '🦪' },
        { value: 'prawns', label: 'Prawns', icon: '🦐' },
        { value: 'crabs', label: 'Crabs', icon: '🦀' },
        { value: 'crab-meat', label: 'Crab Meat', icon: '🥩' },
        { value: 'cephalopods', label: 'Cephalopods', icon: '🦑' },
        { value: 'fish', label: 'Fish', icon: '🐟' },
        { value: 'tuna', label: 'Tuna', icon: '🐟' },
        { value: 'salmon', label: 'Salmon', icon: '🐟' },
        { value: 'lobster', label: 'Lobster', icon: '🦞' }
    ]

    useEffect(() => {
        fetchProducts();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
            .then(data => {
                setItems(data)
                setFilteredItems(data)
                setLoading(false)
            })
            .catch(err => {
                setError(err.message)
                setLoading(false)
            })
    }

    const handleDelete = async (productId, productName) => {
        if (!window.confirm(`Are you sure you want to delete "${productName}"? This will delete all variants as well.`)) {
            return
        }

        try {
            const res = await fetch(`${API_URL}/api/productlist/${productId}`, {
                method: 'DELETE'
            })

            if (!res.ok) throw new Error('Failed to delete')

            fetchProducts()
        } catch (err) {
            alert('Error deleting product: ' + err.message)
        }
    }

    const formatCategory = (category) => {
        if (!category) return '-'
        return category.charAt(0).toUpperCase() + category.slice(1)
    }

    const formatSpeciesType = (speciesType) => {
        if (!speciesType) return '-'
        const typeObj = speciesTypes.find(t => t.value === speciesType.toLowerCase())
        return typeObj ? typeObj.label : speciesType.charAt(0).toUpperCase() + speciesType.slice(1)
    }

    const navigate = useNavigate();

    const navigateForm = () => {
        navigate('/productform')
    }

    const navigateEdit = (productId) => {
        navigate(`/productform/${productId}`)
    }

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) {
            return '/images/placeholder-seafood.png'
        }
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl
        }
        return `${API_URL}${imageUrl}`
    }

    // Get species type counts
    const getSpeciesTypeCount = (typeValue) => {
        if (typeValue === 'all') return items.length
        return items.filter(item => item.species_type?.toLowerCase() === typeValue).length
    }

    return (
        <div className="pricelist-container">
            <h2>Local Product List</h2>

            <div className='add-section'>
                <button className='apf-btn' onClick={navigateForm}>+ Add Product</button>
            </div>

            {/* Species Type Filter Pills */}
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

            {loading && <div className="info">Loading...</div>}
            {error && <div className="error">{error}</div>}

            {!loading && !error && (
                <>
                    {/* Show current filter info */}
                    <div className="filter-info">
                        Showing <strong>{filteredItems.length}</strong> {selectedSpeciesType === 'all' ? 'products' : formatSpeciesType(selectedSpeciesType)}
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
                                    <th>Unit</th>
                                    <th>Purchase Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="muted">
                                            {selectedSpeciesType === 'all' 
                                                ? 'No items found' 
                                                : `No ${formatSpeciesType(selectedSpeciesType)} found`}
                                        </td>
                                    </tr>
                                )}

                                {filteredItems.map(product => {
                                    const imgSrc = getImageUrl(product.image_url)
                                    const variants = product.variants || []

                                    if (variants.length > 0) {
                                        return variants.map((variant, index) => (
                                            <tr key={`${product.id}-${variant.id || index}`}>
                                                {index === 0 && (
                                                    <>
                                                        <td className="thumb-cell" rowSpan={variants.length}>
                                                            <img src={imgSrc} alt={product.common_name} className="thumb" />
                                                        </td>
                                                        <td rowSpan={variants.length}>{product.common_name}</td>
                                                        <td className="scientific" rowSpan={variants.length}>
                                                            {product.scientific_name || '-'}
                                                        </td>
                                                        <td rowSpan={variants.length}>
                                                            <span className="category-badge">
                                                                {formatCategory(product.category)}
                                                            </span>
                                                        </td>
                                                        <td rowSpan={variants.length}>
                                                            <span className="species-badge">
                                                                {formatSpeciesType(product.species_type)}
                                                            </span>
                                                        </td>
                                                    </>
                                                )}
                                                
                                                <td>{variant.size}</td>
                                                <td>{variant.unit}</td>
                                                <td className="price-cell">
                                                    Rs. {parseFloat(variant.purchasing_price).toFixed(2)}
                                                </td>
                                                
                                                {index === 0 && (
                                                    <td className="actions-cell" rowSpan={variants.length}>
                                                        <div className="actions-wrapper">
                                                            <button
                                                                className="btn-edit"
                                                                onClick={() => navigateEdit(product.id)}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="btn-delete"
                                                                onClick={() => handleDelete(product.id, product.common_name)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    }

                                    return (
                                        <tr key={product.id}>
                                            <td className="thumb-cell">
                                                <img src={imgSrc} alt={product.common_name} className="thumb" />
                                            </td>
                                            <td>{product.common_name}</td>
                                            <td className="scientific">{product.scientific_name || '-'}</td>
                                            <td>
                                                <span className="category-badge">
                                                    {formatCategory(product.category)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="species-badge">
                                                    {formatSpeciesType(product.species_type)}
                                                </span>
                                            </td>
                                            <td className="muted">-</td>
                                            <td className="muted">-</td>
                                            <td className="muted">-</td>
                                            <td className="actions-cell">
                                                <div className="actions-wrapper">
                                                    <button
                                                        className="btn-edit"
                                                        onClick={() => navigateEdit(product.id)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleDelete(product.id, product.common_name)}
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
                </>
            )}
        </div>
    );
}

export default Productlist