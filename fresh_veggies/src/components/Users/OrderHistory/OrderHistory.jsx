import React, { useState, useEffect } from "react";
import { db, auth } from "../../../firebase_Config";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import styles from "./OrderHistory.module.css";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Fetch user role and orders
  useEffect(() => {
    const fetchOrders = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          // Get user role
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setRole(userData.role);

            // Fetch orders from role-based subcollection
            const orderCollection = 
              userData.role === "customer" ? "customerOrderDetails" : "retailerOrderDetails";
            const ordersRef = collection(db, orderCollection, user.uid, "orders");
            const ordersSnapshot = await getDocs(ordersRef);

            const ordersList = ordersSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            // Sort by date (newest first)
            const sortedOrders = ordersList.sort((a, b) => 
              b.timestamp?.toDate() - a.timestamp?.toDate()
            );

            setOrders(sortedOrders);
            setFilteredOrders(sortedOrders);
          }
        } catch (error) {
          console.error("Error fetching orders:", error);
          setError("Failed to fetch orders. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();
  }, []);

  // Filter orders based on search and filters
  useEffect(() => {
    let result = [...orders];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      result = result.filter(order => {
        const orderDate = order.timestamp?.toDate();
        return orderDate && 
          orderDate.getFullYear() === filterDate.getFullYear() &&
          orderDate.getMonth() === filterDate.getMonth() &&
          orderDate.getDate() === filterDate.getDate();
      });
    }
    
    setFilteredOrders(result);
  }, [searchTerm, statusFilter, dateFilter, orders]);

  // Toggle order details expansion
  const toggleExpandOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Check if the order can be cancelled
  const canCancelOrder = (orderTimestamp) => {
    if (!orderTimestamp) return false;
    
    const currentTime = new Date();
    const orderTime = orderTimestamp.toDate();
    const timeDifference = (currentTime - orderTime) / (1000 * 60); // Difference in minutes

    if (role === "customer" && timeDifference > 1) {
      return false;
    }

    if (role === "retailer" && timeDifference > 60) {
      return false;
    }

    return true;
  };

  // Handle cancel order
  const handleCancelOrder = async (orderId, e) => {
    e.stopPropagation();
    const isConfirmed = window.confirm("Are you sure you want to cancel this order?");
    if (isConfirmed) {
      try {
        const user = auth.currentUser;
        const orderCollection = 
          role === "customer" ? "customerOrderDetails" : "retailerOrderDetails";
        const orderDocRef = doc(db, orderCollection, user.uid, "orders", orderId);
        await updateDoc(orderDocRef, { status: "Cancelled" });

        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: "Cancelled" } : order
          )
        );
        setFilteredOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: "Cancelled" } : order
          )
        );
      } catch (error) {
        console.error("Error cancelling order:", error);
        setError("Failed to cancel order. Please try again.");
      }
    }
  };

  const formatPrice = (price) => {
    const num = typeof price === "number" ? price : parseFloat(price) || 0;
    return num.toFixed(2);
  };

  const formatDate = (date) => {
    return date?.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className={styles.orderHistoryContainer}>
        <div className={styles.loading}>Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.orderHistoryContainer}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.orderHistoryContainer}>
      <h1>Order History</h1>
      
      {/* Filters and Search */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by order ID or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#6c757d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 21L16.65 16.65" stroke="#6c757d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <div className={styles.filterGroup}>
          <label>Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label>Date:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>
      
      {/* Order Summary */}
      <div className={styles.summaryBar}>
        <span>{filteredOrders.length} orders found</span>
        {filteredOrders.length > 0 && (
          <span>Total spent: ₹{filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}</span>
        )}
      </div>
      
      {/* Orders List */}
      <div className={styles.ordersList}>
        {filteredOrders.length === 0 ? (
          <div className={styles.noOrders}>
            <p>No orders match your filters</p>
            <button 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter("");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className={`${styles.orderCard} ${expandedOrder === order.id ? styles.expanded : ''}`}
              onClick={() => toggleExpandOrder(order.id)}
            >
              <div className={styles.orderHeader}>
                <div className={styles.orderMainInfo}>
                  <h2>Order #{order.id.substring(0, 8)}</h2>
                  <span className={styles.orderDate}>{formatDate(order.timestamp)}</span>
                </div>
                <div className={styles.orderStatusGroup}>
                  <span className={`${styles.status} ${styles[order.status?.toLowerCase()]}`}>
                    {order.status}
                  </span>
                  <span className={styles.orderTotal}>₹{formatPrice(order.total)}</span>
                </div>
              </div>
              
              {/* Collapsed view */}
              <div className={styles.collapsedView}>
                <div className={styles.itemsPreview}>
                  {order.items?.slice(0, 2).map((item, index) => (
                    <span key={index}>{item.name}</span>
                  ))}
                  {order.items?.length > 2 && (
                    <span className={styles.moreItems}>+{order.items.length - 2} more</span>
                  )}
                </div>
                <div className={styles.orderActions}>
                  <button 
                    className={styles.trackButton}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Track
                  </button>
                  {order.status !== "Cancelled" && canCancelOrder(order.timestamp) && (
                    <button
                      className={styles.cancelButton}
                      onClick={(e) => handleCancelOrder(order.id, e)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              
              {/* Expanded view */}
              {expandedOrder === order.id && (
                <div className={styles.expandedView}>
                  <div className={styles.itemsList}>
                    {order.items?.map((item, index) => (
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
                  </div>
                  
                  <div className={styles.priceSummary}>
                    <div className={styles.priceRow}>
                      <span>Subtotal:</span>
                      <span>₹{formatPrice(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className={styles.priceRow}>
                        <span>Discount:</span>
                        <span>-₹{formatPrice(order.discount)}</span>
                      </div>
                    )}
                    <div className={styles.totalRow}>
                      <span>Total:</span>
                      <span>₹{formatPrice(order.total)}</span>
                    </div>
                  </div>
                  
                  <div className={styles.deliveryInfo}>
                    <h3>Delivery Address</h3>
                    {order.address ? (
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
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OrderHistory;