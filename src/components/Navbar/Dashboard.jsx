import React from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const menuItems = [
    {
      title: "Products",
      icon: "📊",
      gradient: "linear-gradient(135deg, #1e4b8c 0%, #2d7fc1 100%)",
      items: [
        {
          name: "Product List",
          path: "/productlist",
          icon: "📦",
          description: "View and manage all products",
          color: "#1e4b8c",
        },
        {
          name: "Export Products - Sea",
          path: "/exportproductlist",
          icon: "🌍",
          description: "Products available for export",
          color: "#2d7fc1",
        },
        {
          name: "Export Products - Air",
          path: "/exportproductlistair",
          icon: "🌍",
          description: "Products available for export",
          color: "#2d7fc1",
        },
      ],
    },
    {
      title: "Customers",
      icon: "👥",
      gradient: "linear-gradient(135deg, #005b96 0%, #1a8cff 100%)",
      items: [
        {
          name: "Local Customers",
          path: "/customerlist",
          icon: "👥",
          description: "Local customer base",
          color: "#005b96",
        },
        {
          name: "Export Customers - Sea",
          path: "/exportcustomerlist",
          icon: "🌐",
          description: "International customer base",
          color: "#1a8cff",
        },
        {
          name: "Export Customers - Air",
          path: "/exportcustomerlistair",
          icon: "🌐",
          description: "International customer base",
          color: "#1a8cff",
        },
      ],
    },
    {
      title: "Rates & Pricing",
      icon: "💰",
      gradient: "linear-gradient(135deg, #003f5c 0%, #2c7da0 100%)",
      items: [
        {
          name: "USD Rate",
          path: "/usdrate",
          icon: "💱",
          description: "Currency exchange rates",
          color: "#003f5c",
        },
        {
          name: "Air Freight",
          path: "/freightrates",
          icon: "✈️",
          description: "Air shipping rates",
          color: "#2c7da0",
        },
        {
          name: "Sea Freight",
          path: "/seafreightrates",
          icon: "🚢",
          description: "Ocean shipping rates",
          color: "#4895d6",
        },
      ],
    },
    {
      title: "Orders",
      icon: "📋",
      gradient: "linear-gradient(135deg, #064e3b 0%, #059669 100%)",
      items: [
        {
          name: "All Orders",
          path: "/admin/orders",
          icon: "📋",
          description: "View and manage all customer orders",
          color: "#064e3b",
        },
        {
          name: "Pending Orders",
          path: "/admin/orders?status=pending",
          icon: "⏳",
          description: "Orders awaiting confirmation",
          color: "#065f46",
        },
        {
          name: "Active Orders",
          path: "/admin/orders?status=confirmed",
          icon: "🚢",
          description: "Confirmed and in-progress orders",
          color: "#047857",
        },
      ],
    },
    {
      title: "User Management",
      icon: "👥",
      gradient: "linear-gradient(135deg, #003f5c 0%, #2c7da0 100%)",
      items: [
        {
          name: "Users",
          path: "/usermanagement",
          icon: "👥",
          description: "Manage user accounts",
          color: "#003f5c",
        },
      ],
    },
  ];

  return (
    <div className="dashboard">
      {/* Animated Background */}
      <div className="dashboard__background"></div>

      <div className="dashboard__container">
        {/* Header Section */}
        <div className="dashboard__header">
          <div className="dashboard__header-content">
            <h1 className="dashboard__title">
              Welcome back,
              <span className="dashboard__title-highlight"> Admin</span>
            </h1>
            <p className="dashboard__subtitle">
              Manage your seafood export business with our comprehensive
              dashboard
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard__content">
          {menuItems.map((section, index) => (
            <div key={index} className="dashboard__section">
              <div className="dashboard__section-header">
                <div
                  className="dashboard__section-icon"
                  style={{ background: section.gradient }}
                >
                  {section.icon}
                </div>
                <h2 className="dashboard__section-title">{section.title}</h2>
              </div>

              <div className="dashboard__grid">
                {section.items.map((item, itemIndex) => (
                  <Link
                    key={itemIndex}
                    to={item.path}
                    className="dashboard__card"
                    style={{ "--card-color": item.color }}
                  >
                    <div className="dashboard__card-header">
                      <div className="dashboard__card-icon-wrapper">
                        <span className="dashboard__card-icon">
                          {item.icon}
                        </span>
                      </div>
                    </div>

                    <div className="dashboard__card-body">
                      <h3 className="dashboard__card-title">{item.name}</h3>
                      <p className="dashboard__card-description">
                        {item.description}
                      </p>
                    </div>

                    <div className="dashboard__card-footer">
                      <span className="dashboard__card-link">
                        Access Module
                        <svg
                          className="dashboard__card-arrow"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M5 12h14M12 5l7 7-7 7"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="dashboard__card-overlay"></div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
