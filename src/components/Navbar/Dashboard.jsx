import React from 'react'
import { Link } from 'react-router-dom'
import './Dashboard.css'

const Dashboard = () => {
  const menuItems = [
    {
      title: 'Products',
      items: [
        {
          name: 'Product List',
          path: '/productlist',
          icon: '📦',
          description: 'View and manage all products',
          color: '#3b82f6'
        },
        {
          name: 'Export Products',
          path: '/exportproductlist',
          icon: '🌍',
          description: 'Products available for export',
          color: '#3b82f6'
        }
      ]
    },
    {
      title: 'Customers',
      items: [
        {
          name: 'Local Customers',
          path: '/customerlist',
          icon: '👥',
          description: 'Local customer base',
          color: '#3b82f6'
        },
        {
          name: 'Export Customers',
          path: '/exportcustomerlist',
          icon: '🌐',
          description: 'International customer base',
          color: '#3b82f6'
        }
      ]
    },
    {
      title: 'Rates & Pricing',
      items: [
        {
          name: 'USD Rate',
          path: '/usdrate',
          icon: '💱',
          description: 'Currency exchange rates',
          color: '#3b82f6'
        },
        {
          name: 'Air Freight',
          path: '/freightrates',
          icon: '✈️',
          description: 'Air shipping rates',
          color: '#3b82f6'
        },
        {
          name: 'Sea Freight',
          path: '/seafreightrates',
          icon: '🚢',
          description: 'Ocean shipping rates',
          color: '#3b82f6'
        }
      ]
    }
  ]

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Manage your seafood export business efficiently</p>
      </div>

      <div className="dashboard-content">
        {menuItems.map((section, index) => (
          <div key={index} className="dashboard-section">
            <h2 className="section-title">{section.title}</h2>
            <div className="cards-grid">
              {section.items.map((item, itemIndex) => (
                <Link 
                  key={itemIndex} 
                  to={item.path} 
                  className="dashboard-card"
                  style={{ '--card-color': item.color }}
                >
                  <div className="card-icon">{item.icon}</div>
                  <h3 className="card-title">{item.name}</h3>
                  <p className="card-description">{item.description}</p>
                  <div className="card-arrow">→</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard