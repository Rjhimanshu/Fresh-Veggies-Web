import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase_Config";
import { collectionGroup, getDocs, query, getDoc, where, doc, updateDoc } from "firebase/firestore";
import styles from "./Orders.module.css";

function Orders() {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingOrder, setProcessingOrder] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: "", type: "" });
    const [viewMode, setViewMode] = useState("pending"); // 'pending' or 'accepted'
     
    
    // Fetch user role
    useEffect(() => {
        const fetchUserRole = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const user = auth.currentUser;
                if (user) {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setUserRole(userData.role);
                    } else {
                        setError("User document not found.");
                    }
                } else {
                    setError("No user logged in.");
                }
            } catch (err) {
                setError("Failed to fetch user role.");
                console.error("Error fetching user role:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserRole();
    }, []);

    // Fetch orders based on user role and view mode
    useEffect(() => {
        const fetchOrders = async () => {
            if (!userRole) return;
            setIsLoading(true);
            setError(null);
            try {
                let ordersQuery;
                if (viewMode === "pending") {
                    if (userRole === "retailer") {
                        ordersQuery = query(
                            collectionGroup(db, "orders"),
                            where("status", "==", "Confirmed"),
                            where("userRole", "==", "customer")
                        );
                    } else if (userRole === "wholesaler") {
                        ordersQuery = query(
                            collectionGroup(db, "orders"),
                            where("status", "==", "Confirmed"),
                            where("userRole", "==", "retailer")
                        );
                    }
                } else if (viewMode === "accepted") {
                    if (userRole === "retailer") {
                        ordersQuery = query(
                            collectionGroup(db, "orders"),
                            where("status", "==", "Accepted"),
                            where("acceptedBy", "==", auth.currentUser.uid)
                        );
                    } else if (userRole === "wholesaler") {
                        ordersQuery = query(
                            collectionGroup(db, "orders"),
                            where("status", "==", "Accepted"),
                            where("acceptedBy", "==", auth.currentUser.uid)
                        );
                    }
                }

                if (!ordersQuery) {
                    setError("Invalid user role or view mode.");
                    setIsLoading(false);
                    return;
                }

                const ordersSnapshot = await getDocs(ordersQuery);
                const ordersList = ordersSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ref: doc.ref,
                    ...doc.data(),
                    orderDate: doc.data.timestamp?.toDate() || new Date(),
                }));

                setOrders(ordersList);
                setFilteredOrders(ordersList);
            } catch (error) {
                console.error("Error fetching orders:", error);
                setError("Failed to fetch orders. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, [userRole, viewMode]);

    // Handle accepting an order
    const handleAcceptOrder = async (order) => {
        if (processingOrder) return;
        
        setProcessingOrder(order.id);
        try {
            const orderDocRef = doc(db, order.ref.path);
            await updateDoc(orderDocRef, {
                status: "Accepted",
                acceptedBy: auth.currentUser.uid,
                acceptedAt: new Date().toISOString(),
            });
            
            // Update local state
            setOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
            setFilteredOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
            
            showAlert("Order accepted successfully!", "success");
        } catch (error) {
            console.error("Error accepting order:", error);
            showAlert("Failed to accept order. Please try again.", "error");
        } finally {
            setProcessingOrder(null);
        }
    };

    // Handle rejecting an order
    const handleRejectOrder = async (order) => {
        if (processingOrder) return;
        
        const confirmReject = window.confirm("Are you sure you want to reject this order?");
        if (!confirmReject) return;
        
        setProcessingOrder(order.id);
        try {
            const orderDocRef = doc(db, order.ref.path);
            await updateDoc(orderDocRef, { 
                status: "Rejected",
                rejectedBy: auth.currentUser.uid,
                rejectedAt: new Date().toISOString(),
            });
            
            // Update local state
            setOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
            setFilteredOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
            
            showAlert("Order rejected successfully.", "success");
        } catch (error) {
            console.error("Error rejecting order:", error);
            showAlert("Failed to reject order. Please try again.", "error");
        } finally {
            setProcessingOrder(null);
        }
    };

    // Handle marking order as dispatched
    const handleDispatchOrder = async (order) => {
        if (processingOrder) return;
        
        const confirmDispatch = window.confirm("Are you sure you want to mark this order as dispatched?");
        if (!confirmDispatch) return;
        
        setProcessingOrder(order.id);
        try {
            const orderDocRef = doc(db, order.ref.path);
            await updateDoc(orderDocRef, { 
                status: "Dispatched",
                dispatchedBy: auth.currentUser.uid,
                dispatchedAt: new Date().toISOString(),
            });
            
            // Update local state
            setOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
            setFilteredOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
            
            showAlert("Order marked as dispatched successfully.", "success");
        } catch (error) {
            console.error("Error dispatching order:", error);
            showAlert("Failed to dispatch order. Please try again.", "error");
        } finally {
            setProcessingOrder(null);
        }
    };

    const formatOrderDate = (date) => {
      if (!date) return "Date not available";
    
      try {
        // Handle Firestore Timestamp
        if (date?.toDate) return date.toDate().toLocaleString();
        // Handle ISO strings
        if (typeof date === "string") return new Date(date).toLocaleString();
        // Handle JavaScript Date
        if (date instanceof Date) return date.toLocaleString();
        return "Invalid date";
      } catch (error) {
        console.error("Date error:", error);
        return "Invalid date";
      }
    };

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: "", type: "" }), 3000);
    };

    return (
        <div className={styles.placedOrdersContainer}>
            <h1>Orders Management</h1>
            
            <div className={styles.viewToggle}>
                <button 
                    className={viewMode === "pending" ? styles.activeTab : styles.inactiveTab}
                    onClick={() => setViewMode("pending")}
                >
                    Pending Orders
                </button>
                <button 
                    className={viewMode === "accepted" ? styles.activeTab : styles.inactiveTab}
                    onClick={() => setViewMode("accepted")}
                >
                    Accepted Orders
                </button>
            </div>
            
            {isLoading ? (
                <div className={styles.loading}>Loading orders...</div>
            ) : error ? (
                <div className={styles.error}>{error}</div>
            ) : filteredOrders.length === 0 ? (
                <div className={styles.noOrders}>No {viewMode} orders found.</div>
            ) : (
                <div className={styles.ordersList}>
                    {filteredOrders.map((order) => (
                        <div key={order.id} className={styles.orderCard}>
                            <h2>Order ID: {order.id}</h2>
                            <p><strong>Customer Name:</strong> {order.userName}</p>
                            <p><strong>Customer Email:</strong> {order.userEmail}</p>
                            <p><strong>Total Quantity:</strong> {order.totalQuantity} kg</p>
                            <p><strong>Total Price:</strong> ₹{order.totalCartPrice}</p>
                            <p><strong>Order Date:</strong> {formatOrderDate(order.timestamp || order.orderDate)}</p>
                            
                            {order.status === "Accepted" && (
                                <>
                                    <p><strong>Accepted By:</strong> {order.acceptedBy}</p>
                                    <p><strong>Accepted At:</strong> {new Date(order.acceptedAt).toLocaleString()}</p>
                                </>
                            )}

                            <div className={styles.products}>
                                <h3>Products:</h3>
                                {order.products && order.products.map((product, index) => (
                                    <div key={index} className={styles.product}>
                                        <p><strong>{product.name}</strong> - {product.quantity} kg (₹{product.totalPrice})</p>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.deliveryAddress}>
                                <h3>Delivery Address:</h3>
                                {order.deliveryAddress && (
                                    <>
                                        <p>{order.deliveryAddress.name}</p>
                                        <p>{order.deliveryAddress.phone}</p>
                                        <p>{order.deliveryAddress.address}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                                    </>
                                )}
                            </div>

                            <div className={styles.buttons}>
                                {viewMode === "pending" && (
                                    <>
                                        <button 
                                            className={styles.acceptButton} 
                                            onClick={() => handleAcceptOrder(order)}
                                            disabled={processingOrder === order.id}
                                        >
                                            {processingOrder === order.id ? "Processing..." : "Accept Order"}
                                        </button>
                                        <button 
                                            className={styles.rejectButton} 
                                            onClick={() => handleRejectOrder(order)}
                                            disabled={processingOrder === order.id}
                                        >
                                            {processingOrder === order.id ? "Processing..." : "Reject Order"}
                                        </button>
                                    </>
                                )}
                                
                                {viewMode === "accepted" && (
                                    <button 
                                        className={styles.dispatchButton} 
                                        onClick={() => handleDispatchOrder(order)}
                                        disabled={processingOrder === order.id}
                                    >
                                        {processingOrder === order.id ? "Processing..." : "Mark as Dispatched"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {alert.show && (
                <div className={`${styles.alert} ${styles[alert.type]}`}>
                    {alert.message}
                </div>
            )}
        </div>
    );
}

export default Orders;