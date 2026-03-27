import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar/Navbar";
import Home from "./components/Home/Home";
import AddProductForm from "./components/pricelist/AddProductForm";
import Customers from "./components/Customers/Customers";
import AddCustomerForm from "./components/Customers/AddCustomerForm";
import CustomerDetail from "./components/Customers/CustomerDetail";
import Productlist from "./components/Products/Productlist";
import ExportAddProductForm from "./components/pricelist/ExportAddProductForm";
import ExportCustomers from "./components/Customers/ExportCustomers";
import ExportAddCustomerForm from "./components/Customers/ExportAddCustomerForm";
import ExportProductlist from "./components/Products/ExportProductlist";
import ExportCustomerDetail from "./components/Customers/ExportCustomerDetail";
import UsdRateForm from "./components/pricelist/UsdRateForm";
import FreightRatesForm from "./components/Products/Freightratesform";
import SeaFreightRatesForm from "./components/Products/SeaFreightratesform";
import Dashboard from "./components/Navbar/Dashboard";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ExportAddCustomerFormAir from "./components/Customers/ExportAddCustomerFormAir";
import ExportCustomersAir from "./components/Customers/ExportCustomersAir";
import ExportCustomerDetailAir from "./components/Customers/ExportCustomerDetailAir";
import ExportProductlistAir from "./components/Products/ExportProductlistAir";
import ExportAddProductFormAir from "./components/pricelist/ExportAddProductFormAir";
import ProductDetail from "./components/Products/ProductDetail";
import ExportProductDetail from "./components/Products/ExportProductDetail";
import ExportProductDetailAir from "./components/Products/ExportProductDetailAir";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── Protected ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/productform"
          element={
            <ProtectedRoute>
              <AddProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/productform/:id"
          element={
            <ProtectedRoute>
              <AddProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/productlist"
          element={
            <ProtectedRoute>
              <Productlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/productdetail/:id"
          element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customerlist"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customerform"
          element={
            <ProtectedRoute>
              <AddCustomerForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customerform/:id"
          element={
            <ProtectedRoute>
              <AddCustomerForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/:cus_id"
          element={
            <ProtectedRoute>
              <CustomerDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exportproductform"
          element={
            <ProtectedRoute>
              <ExportAddProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportproductform/:id"
          element={
            <ProtectedRoute>
              <ExportAddProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportproductformair"
          element={
            <ProtectedRoute>
              <ExportAddProductFormAir />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportproductformair/:id"
          element={
            <ProtectedRoute>
              <ExportAddProductFormAir />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exportcustomerlist"
          element={
            <ProtectedRoute>
              <ExportCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportcustomerform"
          element={
            <ProtectedRoute>
              <ExportAddCustomerForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportcustomerform/:id"
          element={
            <ProtectedRoute>
              <ExportAddCustomerForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportcustomerlistair"
          element={
            <ProtectedRoute>
              <ExportCustomersAir />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportcustomerformair"
          element={
            <ProtectedRoute>
              <ExportAddCustomerFormAir />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportcustomerformair/:id"
          element={
            <ProtectedRoute>
              <ExportAddCustomerFormAir />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportcustomer/:cus_id"
          element={
            <ProtectedRoute>
              <ExportCustomerDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportcustomerair/:cus_id"
          element={
            <ProtectedRoute>
              <ExportCustomerDetailAir />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exportproductlist"
          element={
            <ProtectedRoute>
              <ExportProductlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportproductlistair"
          element={
            <ProtectedRoute>
              <ExportProductlistAir />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportproductdetailair/:id"
          element={
            <ProtectedRoute>
              <ExportProductDetailAir />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportproductdetail/:id"
          element={
            <ProtectedRoute>
              <ExportProductDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usdrate"
          element={
            <ProtectedRoute>
              <UsdRateForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/freightrates"
          element={
            <ProtectedRoute>
              <FreightRatesForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seafreightrates"
          element={
            <ProtectedRoute>
              <SeaFreightRatesForm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
