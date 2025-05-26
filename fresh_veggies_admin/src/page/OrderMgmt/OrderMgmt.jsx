import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebaseConfig";
import {
  collectionGroup, getDocs, doc,
  updateDoc, deleteDoc, getDoc
} from "firebase/firestore";
import styles from "./OrderMgmt.module.css";

function OrderMgmt() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  const fetchUserDetails = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ordersQuery = collectionGroup(db, "orders");
      const ordersSnapshot = await getDocs(ordersQuery);

      const ordersList = await Promise.all(
        ordersSnapshot.docs.map(async (doc) => {
          const orderData = doc.data();
          let processedOrder = {
            id: doc.id,
            ref: doc.ref,
            parentId: doc.ref.parent.parent.id,
            ...orderData,
            products: orderData.products || [],
            deliveryAddress: orderData.deliveryAddress || {},
            orderDate: orderData.timestamp?.toDate() || new Date(),
          };

          // Fetch retailer details
          if (orderData.acceptedByRetailer) {
            const retailerDetails = await fetchUserDetails(orderData.acceptedByRetailer);
            processedOrder.retailerDetails = {
              name: retailerDetails?.name || retailerDetails?.businessName || "Unknown",
              email: retailerDetails?.email || "N/A",
              phone: retailerDetails?.phone || retailerDetails?.mobile || "N/A",
              address: retailerDetails?.address || "N/A",
              city: retailerDetails?.city || "N/A",
              state: retailerDetails?.state || "N/A",
              pincode: retailerDetails?.pincode || retailerDetails?.zipCode || "N/A"
            };
          }

          // Fetch wholesaler details
          if (orderData.acceptedByWholesaler) {
            const wholesalerDetails = await fetchUserDetails(orderData.acceptedByWholesaler);
            processedOrder.wholesalerDetails = {
              name: wholesalerDetails?.name || wholesalerDetails?.businessName || "Unknown",
              email: wholesalerDetails?.email || "N/A",
              phone: wholesalerDetails?.phone || wholesalerDetails?.mobile || "N/A",
              address: wholesalerDetails?.address || "N/A",
              city: wholesalerDetails?.city || "N/A",
              state: wholesalerDetails?.state || "N/A",
              pincode: wholesalerDetails?.pincode || wholesalerDetails?.zipCode || "N/A"
            };
          }

          // Fetch rejected by details
          if (orderData.rejectedBy) {
            const rejectedByDetails = await fetchUserDetails(orderData.rejectedBy);
            processedOrder.rejectedByDetails = {
              name: rejectedByDetails?.name || rejectedByDetails?.businessName || "Unknown",
              email: rejectedByDetails?.email || "N/A",
              phone: rejectedByDetails?.phone || rejectedByDetails?.mobile || "N/A",
              role: rejectedByDetails?.role || "N/A"
            };
          }

          return processedOrder;
        })
      );

      setOrders(ordersList);
      setFilteredOrders(ordersList);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to fetch orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setCurrentUserRole(userDoc.data().role || "");
        }
      }
      await fetchOrders();
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...orders];
    if (statusFilter !== "all") result = result.filter(order => order.status === statusFilter);
    if (roleFilter !== "all") result = result.filter(order => order.userRole === roleFilter);
    if (dateFilter.from) result = result.filter(order => new Date(order.orderDate) >= new Date(dateFilter.from));
    if (dateFilter.to) result = result.filter(order => new Date(order.orderDate) <= new Date(dateFilter.to));
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order =>
        order.id.toLowerCase().includes(term) ||
        (order.userName || "").toLowerCase().includes(term) ||
        (order.userEmail || "").toLowerCase().includes(term) ||
        (order.deliveryAddress?.phone || "").includes(term) ||
        (order.status || "").toLowerCase().includes(term)
      );
    }
    setFilteredOrders(result);
  }, [orders, searchTerm, statusFilter, roleFilter, dateFilter]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (processingOrder) return;
    setProcessingOrder(orderId);

    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error("Order not found");

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");

      let updateData = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (!userDoc.exists()) throw new Error("User details not found");
      const userData = userDoc.data();

      if (newStatus === "AcceptedByRetailer") {
        updateData = {
          ...updateData,
          acceptedByRetailer: currentUser.uid,
          retailerDetails: {
            name: userData.name || userData.businessName || "Unknown",
            email: userData.email || "N/A",
            phone: userData.phone || userData.mobile || "N/A",
            address: userData.address || "N/A",
            city: userData.city || "N/A",
            state: userData.state || "N/A",
            pincode: userData.pincode || userData.zipCode || "N/A"
          }
        };
      }
      else if (newStatus === "AcceptedByWholesaler") {
        updateData = {
          ...updateData,
          acceptedByWholesaler: currentUser.uid,
          wholesalerDetails: {
            name: userData.name || userData.businessName || "Unknown",
            email: userData.email || "N/A",
            phone: userData.phone || userData.mobile || "N/A",
            address: userData.address || "N/A",
            city: userData.city || "N/A",
            state: userData.state || "N/A",
            pincode: userData.pincode || userData.zipCode || "N/A"
          }
        };
      }
      else if (newStatus === "Rejected") {
        updateData = {
          ...updateData,
          rejectedBy: currentUser.uid,
          rejectedByDetails: {
            name: userData.name || userData.businessName || "Unknown",
            email: userData.email || "N/A",
            phone: userData.phone || userData.mobile || "N/A",
            role: userData.role || "N/A"
          }
        };
      }

      const orderDocRef = doc(db, order.ref.path);
      await updateDoc(orderDocRef, updateData);
      await fetchOrders();

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          ...updateData
        });
      }

      showAlert(`Order status updated to ${newStatus}`, "success");
    } catch (error) {
      console.error("Error updating order:", error);
      showAlert(error.message || "Failed to update order status", "error");
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (processingOrder) return;

    const confirmDelete = window.confirm("Are you sure you want to delete this order?");
    if (!confirmDelete) return;

    setProcessingOrder(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error("Order not found");

      await deleteDoc(doc(db, order.ref.path));
      await fetchOrders();

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }

      showAlert("Order deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting order:", error);
      showAlert("Failed to delete order", "error");
    } finally {
      setProcessingOrder(null);
    }
  };

  const formatOrderDate = (date) => {
    if (!date) return "N/A";
    try {
      if (date?.toDate) return date.toDate().toLocaleString();
      if (typeof date === "string") return new Date(date).toLocaleString();
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

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "Confirmed", label: "Confirmed" },
    { value: "AcceptedByRetailer", label: "Accepted by Retailer" },
    { value: "AcceptedByWholesaler", label: "Accepted by Wholesaler" },
    { value: "Dispatched", label: "Dispatched" },
    { value: "Delivered", label: "Delivered" },
    { value: "Rejected", label: "Rejected" }
  ];

  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "customer", label: "Customer" },
    { value: "retailer", label: "Retailer" },
    { value: "wholesaler", label: "Wholesaler" }
  ];

  return (
    <div className={styles.adminContainer}>
      <h1>Order Management System</h1>

      {alert.show && (
        <div className={`${styles.alert} ${styles[alert.type]}`}>
          {alert.message}
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>From:</label>
            <input
              type="date"
              value={dateFilter.from}
              onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>To:</label>
            <input
              type="date"
              value={dateFilter.to}
              onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className={styles.contentArea}>
        <div className={styles.ordersTableContainer}>
          {isLoading ? (
            <div className={styles.loading}>Loading orders...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : filteredOrders.length === 0 ? (
            <div className={styles.noOrders}>No orders found matching your criteria.</div>
          ) : (
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`${styles.orderRow} ${selectedOrder?.id === order.id ? styles.selected : ''}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td>{order.id}</td>
                    <td>{order.userName || "N/A"}</td>
                    <td>
                      <span className={`${styles.roleBadge} ${styles[order.userRole.toLowerCase()]}`}>
                        {order.userRole}
                      </span>
                    </td>
                    <td>{formatOrderDate(order.orderDate)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase().replace('by', '')]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>₹{(order.totalCartPrice || 0).toFixed(2)}</td>
                    <td>
                      <button
                        className={styles.viewButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedOrder && (
          <div className={styles.orderDetailsPanel}>
            <div className={styles.panelHeader}>
              <h2>Order Details</h2>
              <button
                className={styles.closePanel}
                onClick={() => setSelectedOrder(null)}
              >
                &times;
              </button>
            </div>

            <div className={styles.orderDetailsContent}>
              <div className={styles.detailSection}>
                <h3>Basic Information</h3>
                <div className={styles.detailGrid}>
                  <div>
                    <strong>Order ID:</strong> {selectedOrder.id}
                  </div>
                  <div>
                    <strong>Order Date:</strong> {formatOrderDate(selectedOrder.orderDate)}
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <span className={`${styles.statusBadge} ${styles[selectedOrder.status.toLowerCase().replace('by', '')]}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <strong>User Role:</strong>
                    <span className={`${styles.roleBadge} ${styles[selectedOrder.userRole.toLowerCase()]}`}>
                      {selectedOrder.userRole}
                    </span>
                  </div>
                  <div>
                    <strong>User Name:</strong> {selectedOrder.userName || "N/A"}
                  </div>
                  <div>
                    <strong>User Email:</strong> {selectedOrder.userEmail || "N/A"}
                  </div>
                  <div>
                    <strong>Total Quantity:</strong> {selectedOrder.totalQuantity || 0}
                  </div>
                  <div>
                    <strong>Total Price:</strong> ₹{(selectedOrder.totalCartPrice || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Delivery Address</h3>
                <div className={styles.detailGrid}>
                  <div>
                    <strong>Name:</strong> {selectedOrder.address.name || "N/A"}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedOrder.address.phone || "N/A"}
                  </div>
                  <div>
                    <strong>Address:</strong> {selectedOrder.address.address || "N/A"}
                  </div>
                  <div>
                    <strong>City:</strong> {selectedOrder.address.city || "N/A"}
                  </div>
                  <div>
                    <strong>State:</strong> {selectedOrder.address.state || "N/A"}
                  </div>
                  <div>
                    <strong>Pincode:</strong> {selectedOrder.address.pincode || "N/A"}
                  </div>
                </div>
              </div>

              {selectedOrder.retailerDetails && (
                <div className={`${styles.detailSection} ${styles.acceptedBySection}`}>
                  <h3>Retailer Information (Accepted By)</h3>
                  <div className={styles.detailGrid}>
                    <div><strong>Name:</strong> {selectedOrder.retailerDetails.name}</div>
                    <div><strong>Email:</strong> {selectedOrder.retailerDetails.email}</div>
                    <div><strong>Phone:</strong> {selectedOrder.retailerDetails.phone}</div>
                    <div><strong>Address:</strong> {selectedOrder.retailerDetails.address}</div>
                    <div><strong>City:</strong> {selectedOrder.retailerDetails.city}</div>
                    <div><strong>State:</strong> {selectedOrder.retailerDetails.state}</div>
                    <div><strong>Pincode:</strong> {selectedOrder.retailerDetails.pincode}</div>
                  </div>
                </div>
              )}

              {selectedOrder.wholesalerDetails && (
                <div className={`${styles.detailSection} ${styles.acceptedBySection}`}>
                  <h3>Wholesaler Information (Accepted By)</h3>
                  <div className={styles.detailGrid}>
                    <div><strong>Name:</strong> {selectedOrder.wholesalerDetails.name}</div>
                    <div><strong>Email:</strong> {selectedOrder.wholesalerDetails.email}</div>
                    <div><strong>Phone:</strong> {selectedOrder.wholesalerDetails.phone}</div>
                    <div><strong>Address:</strong> {selectedOrder.wholesalerDetails.address}</div>
                    <div><strong>City:</strong> {selectedOrder.wholesalerDetails.city}</div>
                    <div><strong>State:</strong> {selectedOrder.wholesalerDetails.state}</div>
                    <div><strong>Pincode:</strong> {selectedOrder.wholesalerDetails.pincode}</div>
                  </div>
                </div>
              )}

              {selectedOrder.rejectedByDetails && (
                <div className={`${styles.detailSection} ${styles.rejectedBySection}`}>
                  <h3>Rejected By</h3>
                  <div className={styles.detailGrid}>
                    <div><strong>Name:</strong> {selectedOrder.rejectedByDetails.name}</div>
                    <div><strong>Role:</strong> {selectedOrder.rejectedByDetails.role}</div>
                    <div><strong>Email:</strong> {selectedOrder.rejectedByDetails.email}</div>
                    <div><strong>Phone:</strong> {selectedOrder.rejectedByDetails.phone}</div>
                  </div>
                </div>
              )}

              <div className={styles.detailSection}>
                <h3>Products</h3>
                <table className={styles.productsTable}>
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Name</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.products.map((product, index) => (
                      <tr key={index}>
                        <td>{product.id}</td>
                        <td>{product.name}</td>
                        <td>{product.quantity}</td>
                        <td>₹{(product.totalPrice || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className={styles.grandTotalRow}>
                      <td colSpan="3" className={styles.totalLabel}>Order Total:</td>
                      <td className={styles.totalAmount}>
                        ₹{(selectedOrder.totalCartPrice || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className={styles.actionButtons}>
                {selectedOrder.status === "Confirmed" && currentUserRole === "retailer" && (
                  <button
                    className={styles.acceptButton}
                    onClick={() => handleStatusUpdate(selectedOrder.id, "AcceptedByRetailer")}
                    disabled={processingOrder === selectedOrder.id}
                  >
                    {processingOrder === selectedOrder.id ? "Processing..." : "Accept as Retailer"}
                  </button>
                )}

                {selectedOrder.status === "AcceptedByRetailer" && currentUserRole === "wholesaler" && (
                  <button
                    className={styles.acceptButton}
                    onClick={() => handleStatusUpdate(selectedOrder.id, "AcceptedByWholesaler")}
                    disabled={processingOrder === selectedOrder.id}
                  >
                    {processingOrder === selectedOrder.id ? "Processing..." : "Accept as Wholesaler"}
                  </button>
                )}

                {(selectedOrder.status === "AcceptedByRetailer" || selectedOrder.status === "AcceptedByWholesaler") && (
                  <button
                    className={styles.dispatchButton}
                    onClick={() => handleStatusUpdate(selectedOrder.id, "Dispatched")}
                    disabled={processingOrder === selectedOrder.id}
                  >
                    {processingOrder === selectedOrder.id ? "Processing..." : "Dispatch"}
                  </button>
                )}

                {selectedOrder.status !== "Rejected" && selectedOrder.status !== "Delivered" && (
                  <button
                    className={styles.rejectButton}
                    onClick={() => handleStatusUpdate(selectedOrder.id, "Rejected")}
                    disabled={processingOrder === selectedOrder.id}
                  >
                    {processingOrder === selectedOrder.id ? "Processing..." : "Reject"}
                  </button>
                )}

                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  disabled={processingOrder === selectedOrder.id}
                >
                  Delete Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderMgmt;