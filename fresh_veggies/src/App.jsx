import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './components/Auth/Login';
import Profile from './components/Users/Profile';
import Shop from './pages/Shop/Shop';
import Cart from './pages/Cart/Cart';
import Inventory from './pages/Inventory/Inventory';
import MyProducts from './components/MyProducts/MyProducts';
import Layout from './components/Layout/Layout';
import { LoadingProvider } from './context/LoadingContext';
import Loading from './components/Loading/Loading';
import { LoadingContext } from './context/LoadingContext';
import Help from './pages/Help/Help';
import Checkout from './pages/Checkout/Checkout';
import SavedAddress from './components/Users/Address/SavedAddress';
import OrderConfirmed from './components/OrderConfirmed/OrderConfirmed';
import OrderHistory from './components/Users/OrderHistory/OrderHistory';
import EditProfile from './components/Users/EditProfile/EditProfile';
import Orders from './pages/Orders/Orders';
import Reviews from './pages/Reviews/Reviews';
import SeasonalCalendar from './components/SeasonalCalendar/SeasonalCalendar';


// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <Router>
          <GlobalLoading />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              
              {/* Public Routes */}
              <Route path="/help" element={<Help />} />
              
              {/* Customer-only Routes */}
              <Route 
                path="/shop" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'retailer']}>
                    <Shop />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cart" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'retailer']}>
                    <Cart />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'retailer']}>
                    <Checkout />
                  </ProtectedRoute>
                } 
              />
              
              {/* Retailer/Wholesaler-only Routes */}
              <Route 
                path="/inventory" 
                element={
                  <ProtectedRoute allowedRoles={['retailer', 'wholesaler']}>
                    <Inventory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/myproducts" 
                element={
                  <ProtectedRoute allowedRoles={['retailer', 'wholesaler']}>
                    <MyProducts />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute allowedRoles={['retailer', 'wholesaler']}>
                    <Orders />
                  </ProtectedRoute>
                } 
              />
              
              {/* Shared Routes */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'retailer', 'wholesaler']}>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reviews" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'retailer', 'wholesaler']}>
                    <Reviews />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/edit-profile" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'retailer', 'wholesaler']}>
                    <EditProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/saved-addresses" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'retailer']}>
                    <SavedAddress />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/order-history" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'retailer']}>
                    <OrderHistory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/order-confirmed" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'retailer']}>
                    <OrderConfirmed />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/seasonal-calendar" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'retailer','wholesaler']}>
                    <SeasonalCalendar />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </LoadingProvider>
    </AuthProvider>
  );
}

// GlobalLoading component to show loading animation
function GlobalLoading() {
  const { loading } = React.useContext(LoadingContext);
  return loading ? <Loading /> : null;
}

export default App;