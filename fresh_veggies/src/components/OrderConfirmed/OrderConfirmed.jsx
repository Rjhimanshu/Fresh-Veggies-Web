import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../../firebase_Config';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import styles from './OrderConfirmed.module.css';

const OrderConfirmed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [role, setRole] = useState('');

  // Clear cart function
  const clearCart = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "carts", user.uid), {
          items: []
        });
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  }, []);

  useEffect(() => {
    if (location.state?.order) {
      setOrder(location.state.order);
      setStatus('ready');
    } else {
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  const fetchUserRole = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      setRole(userDoc.data()?.role || 'customer');
    } catch (err) {
      console.error('Role fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  const saveOrder = useCallback(async () => {
    if (!order || status !== 'ready') return;

    setStatus('saving');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
        

        // Transform items to products with proper price structure
    const products = order.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.pricePerKg, // Store the unit price
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      imageUrl: item.imageUrl
    }));

    const orderData = {
      ...order,
      products, // Add the transformed products array
      userId: user.uid,
      userRole: role,
      userName: user.displayName || user.email,
      userEmail: user.email,
      timestamp: new Date(),
      status: 'Confirmed', // Changed from 'placed' to match your status system
      totalCartPrice: order.total, // Ensure total is stored as totalCartPrice
      totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0)
    };

      const orderCollection = role === 'retailer' 
        ? 'retailerOrderDetails' 
        : 'customerOrderDetails';

      await addDoc(
        collection(db, orderCollection, user.uid, 'orders'),
        orderData
      );

      // Clear the cart after successful order
      await clearCart();
      
      setStatus('saved');
    } catch (err) {
      console.error('Order save error:', err);
      setError('Failed to save order details');
      setStatus('error');
    }
  }, [order, status, role, clearCart]);

  useEffect(() => {
    if (status === 'ready') {
      saveOrder();
    }
  }, [status, saveOrder]);

  useEffect(() => {
    if (status !== 'saved') return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate]);

  if (status === 'loading') return (
    <div className={styles.orderConfirmedContainer}>
      <div className={styles.loading}>Loading your order...</div>
    </div>
  );

  const formatPrice = (price) => {
    const num = typeof price === 'number' ? price : parseFloat(price) || 0;
    return num.toFixed(2);
  };

  return (
    <div className={styles.orderConfirmedContainer}>
      <div className={styles.confirmationAnimation}>
        {/* Confetti elements */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className={styles.confetti}></div>
        ))}
        <div className={styles.checkmark}>✓</div>
      </div>
      
      <h1>Order Confirmed!</h1>
      <p>Order ID: <strong>{order?.id}</strong></p>
      
      {status === 'saved' ? (
        <p>You will be redirected in {countdown} seconds...</p>
      ) : status === 'saving' ? (
        <p className={styles.loading}>Finalizing your order...</p>
      ) : null}

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button 
            className={styles.continueShopping}
            onClick={() => navigate('/')}
          >
            Return Home
          </button>
        </div>
      )}

      <div className={styles.orderDetails}>
        <h2>Order Summary</h2>
        {order?.items?.map((item, index) => (
          <div key={`${item.id}-${index}`} className={styles.item}>
            <img src={item.imageUrl} alt={item.name} />
            <div>
              <h3>{item.name}</h3>
              <p>
                {item.quantity} kg × ₹{formatPrice(item.pricePerKg)}
                <span>₹{formatPrice(item.totalPrice)}</span>
              </p>
            </div>
          </div>
        ))}

        <div className={styles.priceSummary}>
          <div className={styles.priceRow}>
            <span>Subtotal:</span>
            <span>₹{formatPrice(order?.subtotal)}</span>
          </div>
          {order?.discount > 0 && (
            <div className={styles.priceRow}>
              <span>Discount:</span>
              <span>-₹{formatPrice(order?.discount)}</span>
            </div>
          )}
          <div className={styles.totalRow}>
            <span>Total:</span>
            <span>₹{formatPrice(order?.total)}</span>
          </div>
        </div>
      </div>

      <div className={styles.deliveryInfo}>
        <h2>Delivery Address</h2>
        {order?.address ? (
          <>
            <p><strong>{order.address.name}</strong></p>
            <p>{order.address.address}</p>
            <p>
              {order.address.city}, {order.address.state} - {order.address.pincode}
            </p>
            <p>Phone: {order.address.phone}</p>
          </>
        ) : (
          <p>No delivery address provided</p>
        )}
      </div>

      <button
        className={styles.continueShopping}
        onClick={() => navigate('/', { replace: true })}
      >
        Continue Shopping
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

export default React.memo(OrderConfirmed);