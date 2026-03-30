import React, { useState, useEffect } from "react";
import "./Navbar.css";
import { Link, useNavigate, useLocation } from "react-router-dom";

// Helper functions for avatar
const AVATAR_COLORS = [
  "#00d4ff",
  "#fb923c",
  "#4ade80",
  "#818cf8",
  "#f472b6",
  "#facc15",
  "#34d399",
  "#f87171",
];

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    setUser(stored ? JSON.parse(stored) : null);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);
    setShowUserMenu(false);
    navigate("/");
  };

  const handleProfile = () => {
    setShowUserMenu(false);
    navigate("/profile");
  };

  const closeMenu = () => setMenuOpen(false);

  const isAuthPage =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password";

  if (isAuthPage) return null;

  const avatarColor = user ? getAvatarColor(user.name) : "#00d4ff";
  const initials = user ? getInitials(user.name) : "?";

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="navbar-logo">Tropical Shellfish</div>

      <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? "✖" : "☰"}
      </div>

      <ul className={`nav-links ${menuOpen ? "active" : ""}`}>
        <li>
          <Link to="/dashboard" onClick={closeMenu}>
            Dashboard
          </Link>
        </li>

        {/* User Profile Section */}
        {user && (
          <li className="user-profile-nav">
            <div
              className="user-profile-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div
                className="user-avatar"
                style={{
                  background: `${avatarColor}18`,
                  border: `2px solid ${avatarColor}40`,
                }}
              >
                <span style={{ color: avatarColor }}>{initials}</span>
              </div>
              <span className="user-name">{user.name}</span>
              <span className="dropdown-arrow">{showUserMenu ? "▲" : "▼"}</span>
            </div>

            {showUserMenu && (
              <div className="user-dropdown-menu">
                <div className="user-dropdown-header">
                  <div
                    className="user-dropdown-avatar"
                    style={{
                      background: `${avatarColor}18`,
                      border: `2px solid ${avatarColor}40`,
                    }}
                  >
                    <span style={{ color: avatarColor, fontSize: "18px" }}>
                      {initials}
                    </span>
                  </div>
                  <div className="user-dropdown-info">
                    <div className="user-dropdown-name">{user.name}</div>
                    <div className="user-dropdown-email">{user.email}</div>
                    <div className="user-dropdown-position">
                      {user.position || "Staff"}
                    </div>
                  </div>
                </div>
                <div className="user-dropdown-divider"></div>

                {/* My Profile Option */}
                <button
                  className="user-dropdown-profile"
                  onClick={handleProfile}
                >
                  👤 My Profile
                </button>

                <button className="user-dropdown-logout" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </li>
        )}

        {/* Fallback if no user (shouldn't happen on protected pages) */}
        {!user && (
          <li>
            <button className="nav-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </li>
        )}
      </ul>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="user-menu-overlay"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
