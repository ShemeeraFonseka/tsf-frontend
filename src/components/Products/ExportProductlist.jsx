import React, { useEffect, useState } from 'react';
import './Productlist.css'
import { useNavigate } from "react-router-dom";

const ExportProductlist = () => {
    const API_URL = process.env.REACT_APP_API_URL

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
  fetchProducts();
}, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchProducts = () => {
        fetch(`${API_URL}/api/exportproductlist`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch')
                return res.json()
            })
            .then(data => {
                setItems(data)
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
            const res = await fetch(`${API_URL}/api/exportproductlist/${productId}`, {
                method: 'DELETE'
            })

            if (!res.ok) throw new Error('Failed to delete')

            // Refresh the list
            fetchProducts()
        } catch (err) {
            alert('Error deleting product: ' + err.message)
        }
    }

    const formatCategory = (category) => {
        if (!category) return '-'
        return category.charAt(0).toUpperCase() + category.slice(1)
    }

    const navigate = useNavigate();

    const navigateForm = () => {
        navigate('/exportproductform')
    }

    const navigateEdit = (productId) => {
        navigate(`/exportproductform/${productId}`)
    }

    // Helper function to get the correct image URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) {
            return '/images/placeholder-seafood.png'
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
            <h2>Export Product List</h2>

            <div className='add-section'>
                <button className='apf-btn' onClick={navigateForm}>+ Add Product</button>
            </div>

            {loading && <div className="info">Loading...</div>}
            {error && <div className="error">{error}</div>}

            {!loading && !error && (
                <div className="table-wrap">
                    <table className="pricelist-table">
                        <thead>
                            <tr>
                                <th>Picture</th>
                                <th>Common Name</th>
                                <th>Scientific Name</th>
                                <th>Category</th>
                                <th>Size</th>
                                <th>Unit</th>
                                <th>Purchase Price</th>
                                <th>Ex-Factory Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="muted">No items found</td>
                                </tr>
                            )}

                            {items.map(product => {
                                const imgSrc = getImageUrl(product.image_url)
                                const variants = product.variants || []

                                // If product has variants, show one row per variant
                                if (variants.length > 0) {
                                    return variants.map((variant, index) => (
                                        <tr key={`${product.id}-${variant.id || index}`}>
                                            {/* Show product info only in first row */}
                                            {index === 0 && (
                                                <>
                                                    <td className="thumb-cell" rowSpan={variants.length}>
                                                        <img src={imgSrc} alt={product.common_name} className="thumb" />
                                                    </td>
                                                    <td rowSpan={variants.length}>{product.common_name}</td>
                                                    <td className="scientific" rowSpan={variants.length}>
                                                        {product.scientific_name || '-'}
                                                    </td>
                                                    <td rowSpan={variants.length}>{formatCategory(product.category)}</td>
                                                </>
                                            )}
                                            
                                            {/* Variant info on every row */}
                                            <td>{variant.size}</td>
                                            <td>{variant.unit}</td>
                                            <td className="price-cell">
                                                Rs. {parseFloat(variant.purchasing_price).toFixed(2)}
                                            </td>
                                            <td>Rs. {parseFloat(variant.exfactoryprice).toFixed(2)}</td>
                                            {/* Actions only in first row */}
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

                                // If product has no variants, show one row with empty variant columns
                                return (
                                    <tr key={product.id}>
                                        <td className="thumb-cell">
                                            <img src={imgSrc} alt={product.common_name} className="thumb" />
                                        </td>
                                        <td>{product.common_name}</td>
                                        <td className="scientific">{product.scientific_name || '-'}</td>
                                        <td>{formatCategory(product.category)}</td>
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
            )}
        </div>
    );
}

export default ExportProductlist