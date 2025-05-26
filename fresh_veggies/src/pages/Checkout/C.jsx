import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase_Config";
import { doc, getDoc, getDocs, where, query, collection,updateDoc } from "firebase/firestore";
import styles from "./Checkout.module.css";
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const Checkout = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // State management
  const [cart, setCart] = useState(state?.cart || []);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pincode: "",
    state: "",
    city: "",
    address: "",
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // Extract addresses
            const addressesArray = Object.entries(userData)
              .filter(([key]) => key.startsWith("address"))
              .map(([key, value]) => ({ id: key, ...value }));
            setSavedAddresses(addressesArray);

            // Set default address if available
            if (addressesArray.length > 0) {
              setSelectedAddress(addressesArray[0]);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, []);

  // Calculate order totals
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
   // Calculate discount amount
   const discount = appliedCoupon
   ? appliedCoupon.type === "percentage"
     ? (subtotal * appliedCoupon.value) / 100
     : Math.min(appliedCoupon.value, subtotal)
   : 0;
  const totalPrice = subtotal - discount;

 const applyCoupon = async () => {
    setCouponError("");
    
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
  
    setIsLoading(true);
  
    try {
      // Query coupons collection where code matches
      const couponsRef = collection(db, "coupons");
      const q = query(couponsRef, where("code", "==", couponCode.toUpperCase()));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        setCouponError("Invalid coupon code");
        return;
      }
  
      // Get first matching coupon (assuming codes are unique)
      const couponDoc = querySnapshot.docs[0];
      const couponData = couponDoc.data();
  
      // Validate required fields
      if (!couponData.value || !couponData.type) {
        setCouponError("This coupon is not configured properly");
        return;
      }
  
      // For percentage coupons
      if (couponData.type === "percentage" && (couponData.value <= 0 || couponData.value > 100)) {
        setCouponError("Invalid discount percentage");
        return;
      }
  
      // Apply the valid coupon
      setAppliedCoupon({
        id: couponDoc.id,
        code: couponData.code,
        value: couponData.value,
        type: couponData.type,
        description: couponData.description || `${couponData.value}% discount`
      });
  
    } catch (error) {
      console.error("Coupon validation error:", error);
      setCouponError("Error validating coupon. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };
  
 
  // Address functions
  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setShowAddresses(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchStateCity = async (pincode) => {
    if (pincode.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();

        if (data[0]?.Status === "Success" && data[0]?.PostOffice?.[0]) {
          const postOffice = data[0].PostOffice[0];
          setFormData(prev => ({
            ...prev,
            state: postOffice.State,
            city: postOffice.District
          }));
        } else {
          setFormData(prev => ({ ...prev, state: "", city: "" }));
        }
      } catch (error) {
        console.error("Error fetching location:", error);
      }
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const addressKey = `address${Date.now()}`; // Unique key using timestamp

      await updateDoc(userDocRef, {
        [addressKey]: formData
      });

      // Refresh addresses
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();
      const updatedAddresses = Object.entries(userData)
        .filter(([key]) => key.startsWith("address"))
        .map(([key, value]) => ({ id: key, ...value }));

      setSavedAddresses(updatedAddresses);
      setSelectedAddress(formData);
      setShowAddressForm(false);
    } catch (error) {
      console.error("Error saving address:", error);
      setError("Failed to save address. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedAddress) {
      setError("Please select a shipping address");
      return;
    }
  
    setIsLoading(true);
  
    try {
      const orderData = {
        id: `ORD-${Date.now()}`,
        items: cart, // Make sure this is an array
        address: selectedAddress,
        subtotal: subtotal,
        discount: discount,
        total: totalPrice,
        coupon: appliedCoupon?.code || null,
        status: "pending",
        createdAt: new Date().toISOString()
      };
  
      // Make sure you're passing the order data correctly
      navigate("/order-confirmed", { 
        state: { 
          order: orderData // Pass as an object with 'order' property
        } 
      });
  
      // Clear cart after successful navigation
      localStorage.removeItem("cart");
      setCart([]);
  
    } catch (error) {
      console.error("Order error:", error);
      setError("Failed to place order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.checkoutContainer}>
      <h1>Checkout</h1>

      {/* Order Summary */}
      <div className={styles.orderSummary}>
        <h2>Order Summary</h2>
        <div className={styles.orderItems}>
          {cart.map((item, index) => (
            <div key={index} className={styles.orderItem}>
              <img src={item.imageUrl} alt={item.name} className={styles.itemImage} />
              <div className={styles.itemDetails}>
                <h3>{item.name}</h3>
                <p>{item.quantity} kg × ₹{item.pricePerKg.toFixed(2)}</p>
              </div>
              <div className={styles.itemTotal}>₹{item.totalPrice}</div>
            </div>
          ))}
        </div>

        <div className={styles.priceBreakdown}>
          <div className={styles.priceRow}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {appliedCoupon && (
            <div className={styles.priceRow}>
              <span>Discount ({appliedCoupon.code})</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className={styles.priceRow}>
            <span>Delivery</span>
            <span>FREE</span>
          </div>
          <div className={styles.totalRow}>
            <span>Total</span>
            <span>₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className={styles.couponSection}>
  <h2>Discount Code</h2>
  <div className={styles.couponInputWrapper}>
    <div className={styles.inputGroup}>
      <input
        type="text"
        placeholder="Enter coupon code"
        value={couponCode}
        onChange={(e) => {
          setCouponCode(e.target.value);
          setCouponError("");
        }}
        disabled={!!appliedCoupon || isLoading}
        className={`${styles.couponInput} ${
          couponError ? styles.inputError : ""
        }`}
      />
      {!appliedCoupon ? (
        <button
          onClick={applyCoupon}
          className={styles.applyButton}
          disabled={isLoading || !couponCode.trim()}
        >
          {isLoading ? (
            <span className={styles.spinner}></span>
          ) : (
            "Apply"
          )}
        </button>
      ) : (
        <button
          onClick={removeCoupon}
          className={styles.removeButton}
        >
          Remove
        </button>
      )}
    </div>
    
    {couponError && (
      <div className={styles.errorMessage}>
        <FiAlertCircle className={styles.errorIcon} />
        <span>{couponError}</span>
      </div>
    )}
    
    {appliedCoupon && (
      <div className={styles.successMessage}>
        <FiCheckCircle className={styles.successIcon} />
        <span>
          {appliedCoupon.description} applied (-₹{discount.toFixed(2)})
        </span>
      </div>
    )}
  </div>
</div>

      {/* Shipping Address */}
      <div className={styles.addressSection}>
        <h2>Shipping Address</h2>

        {selectedAddress ? (
          <div className={styles.selectedAddress}>
            <p><strong>{selectedAddress.name}</strong></p>
            <p>{selectedAddress.address}</p>
            <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
            <p>Phone: {selectedAddress.phone}</p>
            <button
              onClick={() => setShowAddresses(true)}
              className={styles.changeAddressBtn}
            >
              Change Address
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddresses(true)}
            className={styles.selectAddressBtn}
          >
            Select Address
          </button>
        )}

        {/* Address List Modal */}
        {showAddresses && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3>Select Address</h3>

              {savedAddresses.length > 0 ? (
                <div className={styles.addressList}>
                  {savedAddresses.map((address) => (
                    <div
                      key={address.id}
                      className={`${styles.addressItem} ${selectedAddress?.id === address.id ? styles.selected : ""
                        }`}
                      onClick={() => handleSelectAddress(address)}
                    >
                      <p><strong>{address.name}</strong></p>
                      <p>{address.address}</p>
                      <p>{address.city}, {address.state} - {address.pincode}</p>
                      <p>Phone: {address.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noAddresses}>No saved addresses found.</p>
              )}

              <div className={styles.modalActions}>
                <button
                  onClick={() => {
                    setShowAddresses(false);
                    setShowAddressForm(true);
                  }}
                  className={styles.addNewAddressBtn}
                >
                  Add New Address
                </button>
                <button
                  onClick={() => setShowAddresses(false)}
                  className={styles.closeModalBtn}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Address Modal */}
        {showAddressForm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3>Add New Address</h3>

              <form onSubmit={handleAddressSubmit} className={styles.addressForm}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>PIN Code</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={(e) => {
                      handleInputChange(e);
                      fetchStateCity(e.target.value);
                    }}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>City/District</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Full Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.saveAddressBtn}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Address"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setShowAddresses(true);
                    }}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Payment and Confirmation */}
      <div className={styles.paymentSection}>
        <h2>Payment Method</h2>
        <div className={styles.paymentOptions}>
          <label className={styles.paymentOption}>
            <input type="radio" name="payment" defaultChecked />
            <span>Cash on Delivery (COD)</span>
          </label>
        </div>

        <div className={styles.orderConfirmation}>
          {error && <p className={styles.error}>{error}</p>}
          <button
            onClick={handleConfirmOrder}
            className={styles.confirmOrderBtn}
            disabled={!selectedAddress || isLoading}
          >
            {isLoading ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;