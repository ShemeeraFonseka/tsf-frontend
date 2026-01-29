import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Home from './components/Home/Home';
import AddProductForm from './components/pricelist/AddProductForm';
import Customers from './components/Customers/Customers';
import AddCustomerForm from './components/Customers/AddCustomerForm';
import CustomerDetail from './components/Customers/CustomerDetail';
import Productlist from './components/Products/Productlist';
import ExportAddProductForm from './components/pricelist/ExportAddProductForm';
import ExportCustomers from './components/Customers/ExportCustomers';
import ExportAddCustomerForm from './components/Customers/ExportAddCustomerForm';
import ExportProductlist from './components/Products/ExportProductlist';
import ExportCustomerDetail from './components/Customers/ExportCustomerDetail';
import UsdRateForm from './components/pricelist/UsdRateForm';
import FreightRatesForm from './components/Products/Freightratesform';
import SeaFreightRatesForm from './components/Products/SeaFreightratesform';


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>

        <Route
          path="/"
          element={
            <>
              <Home />


            </>
          }
        />

        <Route path="/productform" element={<AddProductForm />} />
        <Route path="/productform/:id" element={<AddProductForm />} />

        <Route path="/customerlist" element={<Customers />} />
        <Route path="/customerform" element={<AddCustomerForm />} />
        <Route path="/customerform/:id" element={<AddCustomerForm />} />

        <Route path="/customer/:cus_id" element={<CustomerDetail />} />

        <Route path="/productlist" element={<Productlist />} />



        <Route path="/exportproductform" element={<ExportAddProductForm />} />
        <Route path="/exportproductform/:id" element={<ExportAddProductForm />} />

        <Route path="/exportcustomerlist" element={<ExportCustomers />} />
        <Route path="/exportcustomerform" element={<ExportAddCustomerForm />} />
        <Route path="/exportcustomerform/:id" element={<ExportAddCustomerForm />} />

        <Route path="/exportcustomer/:cus_id" element={<ExportCustomerDetail />} />

        <Route path="/exportproductlist" element={<ExportProductlist />} />

        <Route path="/usdrate" element={<UsdRateForm />} />

        <Route path="/freightrates" element={<FreightRatesForm />} />
        <Route path="/seafreightrates" element={<SeaFreightRatesForm />} />

      </Routes>
    </Router>
  );
}

export default App;
