import React from 'react'
import './Home.css'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()

  const navigatePackages = () => {
    navigate('/packages')
  }

  return (
    <div className="home-container">
            <div className="hero-content">
        <h1>Sri Lanka’s Trusted Source for Premium Seafood</h1>
        <p>Carefully selected, sustainably sourced, expertly delivered.</p>
        <button className="hero-btn" onClick={navigatePackages}>
          Explore Products
        </button>
      </div>
    </div>
  )
}

export default Home
