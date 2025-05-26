import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase_Config";
import { getDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import styles from "./Cart.module.css";
import Alert from "../../components/Alert/Alert";

function Cart() {
  const [cart, setCart] = useState([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [animatingItem, setAnimatingItem] = useState(null);

  // Helper functions
  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
  };

  const hideAlert = () => {
    setAlert({ show: false, message: "", type: "" });
  };

  // Animation handler
  const triggerAnimation = (itemId) => {
    setAnimatingItem(itemId);
    setTimeout(() => setAnimatingItem(null), 300); // Match animation duration
  };

  const roundToTwoDecimals = (value) => Math.round(value * 100) / 100;

  // Fetch user role and cart data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Fetch user role
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setRole(userDocSnap.data().role);
          }

          // Set up real-time cart listener
          const cartDocRef = doc(db, "carts", user.uid);
          const unsubscribeCart = onSnapshot(cartDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setCart(docSnap.data().items || []);
            } else {
              // Initialize empty cart if doesn't exist
              updateDoc(cartDocRef, { items: [] });
              setCart([]);
            }
            setLoading(false);
          });

          return () => unsubscribeCart();
        } catch (error) {
          console.error("Error fetching cart:", error);
          showAlert("Failed to load cart. Please try again.", "error");
          setLoading(false);
        }
      } else {
        setLoading(false);
        setCart([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle quantity changes
  const handleQuantityChange = async (index, newQuantity) => {
    const updatedCart = [...cart];
    const item = updatedCart[index];

    // Validation
    if (isNaN(newQuantity) || newQuantity === "") {
      showAlert("Please enter a valid quantity.", "error");
      return;
    }

    newQuantity = parseFloat(newQuantity);
    const maxQty = role === "retailer" ? 5000 : 5;
    const minQty = role === "retailer" ? 5 : 0.1;

    if (newQuantity < minQty) {
      showAlert(`Minimum quantity is ${minQty}kg.`, "error");
      return;
    }

    if (newQuantity > maxQty) {
      showAlert(`Maximum quantity is ${maxQty}kg.`, "error");
      return;
    }

    if (role === "retailer") {
      newQuantity = Math.round(newQuantity);
    }

    // Update cart
    item.quantity = roundToTwoDecimals(newQuantity);
    item.totalPrice = roundToTwoDecimals(item.pricePerKg * item.quantity).toFixed(2);

    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "carts", user.uid), {
          items: updatedCart
        });
        setCart(updatedCart);
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      showAlert("Failed to update quantity. Please try again.", "error");
    }
  };

  // Remove product
  const removeProduct = async (index) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);

    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "carts", user.uid), {
          items: updatedCart
        });
        setCart(updatedCart);
        showAlert("Product removed from cart", "success");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      showAlert("Failed to remove item. Please try again.", "error");
    }
  };

  // Calculate totals
  const totalCartPrice = cart.reduce((total, item) => total + parseFloat(item.totalPrice), 0);
  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);

  // Check limits
  const maxTotalQuantity = role === "retailer" ? Infinity : 25;
  const isQuantityExceeded = totalQuantity > maxTotalQuantity;
  const minOrderAmount = role === "retailer" ? 4999 : 99;
  const isOrderAmountValid = totalCartPrice >= minOrderAmount;

  // Proceed to checkout
  const handleProceedToCheckout = () => {
    if (isQuantityExceeded) {
      showAlert(`Maximum order limit is ${maxTotalQuantity}kg. Please reduce quantity.`, "error");
      return;
    }

    if (!isOrderAmountValid) {
      showAlert(`Minimum order amount is ₹${minOrderAmount}. Add more items.`, "error");
      return;
    }

    navigate("/checkout", { state: { cart } });
  };

  if (loading) {
    return (
      <div className={styles.cartContainer}>
        <h1>Your Cart</h1>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cartContainer}>
      <h1>Your Cart</h1>

      {alert.show && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      {cart.length === 0 ? (
        <div className={styles.emptyCart}>
          <p>Your cart is empty</p>
          <Link to="/shop" className={styles.continueShopping}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.cartItems}>
            {cart.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className={`${styles.cartItem} ${animatingItem === item.id ? styles.itemAdded : ''
                  }`}
              >
                <img src={item.imageUrl} alt={item.name} className={styles.cartItemImage} />
                <div className={styles.cartItemDetails}>
                  <h3>{item.name}</h3>
                  <p>₹{item.pricePerKg.toFixed(2)}/kg</p>
                  <div className={styles.quantityControl}>
                    <input
                      type="number"
                      step={role === "retailer" ? 1 : 0.1}
                      min={role === "retailer" ? 5 : 0.1}
                      max={role === "retailer" ? 5000 : 5}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      onBlur={(e) => handleQuantityChange(index, e.target.value)}
                      className={styles.quantityInput}
                    />
                    <span>kg</span>
                  </div>
                  <p>Total: ₹{item.totalPrice}</p>
                  <button
                    className={styles.removeButton}
                    onClick={() => removeProduct(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.cartSummary}>
            <h3>Total Price: ₹{totalCartPrice.toFixed(2)}</h3>
            <h3>Total Quantity: {totalQuantity.toFixed(2)} kg</h3>

            {isQuantityExceeded && (
              <p className={styles.errorMessage}>
                Maximum order limit is {maxTotalQuantity}kg
              </p>
            )}

            {!isOrderAmountValid && (
              <p className={styles.errorMessage}>
                Minimum order amount is ₹{minOrderAmount}
              </p>
            )}

            <button
              className={styles.checkoutButton}
              onClick={handleProceedToCheckout}
              disabled={isQuantityExceeded || !isOrderAmountValid}
            >
              Proceed to Checkout
            </button>

            <Link to="/shop" className={styles.continueShopping}>
              Continue Shopping
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;