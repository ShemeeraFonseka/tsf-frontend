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

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Login />
            </>
          }
        />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/productform" element={<AddProductForm />} />
        <Route path="/productform/:id" element={<AddProductForm />} />

        <Route path="/customerlist" element={<Customers />} />
        <Route path="/customerform" element={<AddCustomerForm />} />
        <Route path="/customerform/:id" element={<AddCustomerForm />} />

        <Route path="/customer/:cus_id" element={<CustomerDetail />} />

        <Route path="/productlist" element={<Productlist />} />

        <Route path="/exportproductform" element={<ExportAddProductForm />} />
        <Route
          path="/exportproductform/:id"
          element={<ExportAddProductForm />}
        />

        <Route
          path="/exportproductformair"
          element={<ExportAddProductFormAir />}
        />
        <Route
          path="/exportproductformair/:id"
          element={<ExportAddProductFormAir />}
        />

        <Route path="/exportcustomerlist" element={<ExportCustomers />} />
        <Route path="/exportcustomerform" element={<ExportAddCustomerForm />} />
        <Route
          path="/exportcustomerform/:id"
          element={<ExportAddCustomerForm />}
        />

        <Route path="/exportcustomerlistair" element={<ExportCustomersAir />} />
        <Route
          path="/exportcustomerformair"
          element={<ExportAddCustomerFormAir />}
        />
        <Route
          path="/exportcustomerformair/:id"
          element={<ExportAddCustomerFormAir />}
        />

        <Route
          path="/exportcustomer/:cus_id"
          element={<ExportCustomerDetail />}
        />

        <Route
          path="/exportcustomerair/:cus_id"
          element={<ExportCustomerDetailAir />}
        />

        <Route path="/exportproductlist" element={<ExportProductlist />} />

        <Route
          path="/exportproductlistair"
          element={<ExportProductlistAir />}
        />

        <Route path="/usdrate" element={<UsdRateForm />} />

        <Route path="/freightrates" element={<FreightRatesForm />} />
        <Route path="/seafreightrates" element={<SeaFreightRatesForm />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
