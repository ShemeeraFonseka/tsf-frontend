import React, { useState, useEffect } from 'react'
import './Navbar.css'
import { Link, useNavigate } from "react-router-dom";


const Navbar = () => {

  const navigate = useNavigate();

  const navigatePackages = () => {
    navigate('/packages')
  }

  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="navbar-logo">Tropical Shellfish</div>

      <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? "✖" : "☰"}
      </div>


      <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
        <li>
          <Link to="/">Home</Link>
        </li>
        
        <li>
          <Link to="/productlist">Product List</Link>
        </li>

        <li>
          <Link to="/exportproductlist">Export Product List</Link>
        </li>

        <li>
          <Link to="/customerlist">Customer List</Link>
        </li>

        <li>
          <Link to="/exportcustomerlist">Export Customer List</Link>
        </li>

        <li>
          <Link to="/usdrate">USD Rate</Link>
        </li>

        <li>
          <Link to="/freightrates">Freight Rate</Link>
        </li>
        
      </ul>
    </nav>
  )
}

export default Navbar
