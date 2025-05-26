import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Login from './components/Auth/Login';
import QueryMgmt from './page/QueryMgmt/QueryMgmt';
import ReviewMgmt from './page/ReviewMgmt/ReviewMgmt';
import AdminHome from './page/AdminHome/AdminHome';
import ProductMgmt from './page/ProductMgmt/ProductMgmt';
import UserMgmt from './page/UserMgmt/UserMgmt';
import OrderMgmt from './page/OrderMgmt/OrderMgmt';
import AddProduct from './page/AddProduct/AddProduct';
import { db } from './firebaseConfig';
import CreateAdmin from './components/CreateAdmin/CreateAdmin';
import { collection, getDocs } from 'firebase/firestore';
import AdminLayout from './components/AdminLayout/AdminLayout'; // Import AdminLayout
import AboutUs from './components/AboutUs/AboutUs';
import TermsOfService from './components/TermsOfService/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy/PrivacyPolicy';

function App() {
  const [adminExists, setAdminExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if an admin user exists in Firestore
    const checkAdminExists = async () => {
      const adminQuery = collection(db, 'adminCredentials');
      const querySnapshot = await getDocs(adminQuery);
      setAdminExists(!querySnapshot.empty);
      setLoading(false);
    };

    checkAdminExists();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (

    <Router>
      <Routes>
        {adminExists ? (
          <Route path="/" element={<Login />} />
        ) : (
          <Route path="/" element={<CreateAdmin setAdminExists={setAdminExists} />} />
        )}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminHome />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/productmgmt"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductMgmt />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usermgmt"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <UserMgmt />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ordermgmt"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <OrderMgmt />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reviewmgmt"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ReviewMgmt />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/querymgmt"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <QueryMgmt />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/addproduct"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AddProduct />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/privacy"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <PrivacyPolicy />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/terms"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <TermsOfService />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/about"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AboutUs />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;