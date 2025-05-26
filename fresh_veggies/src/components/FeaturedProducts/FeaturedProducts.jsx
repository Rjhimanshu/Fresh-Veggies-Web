import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "../../firebase_Config";
import styles from "./FeaturedProducts.module.css";
import { Link } from "react-router-dom";
import Alert from "../Alert/Alert";
import { useAuth } from "../../context/AuthContext";

const FeaturedProducts = () => {
  const { currentUser } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const db = getFirestore(app);

  // Get today's date key for caching
  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  };

  // Get role-based discount range
  const getDiscountRange = () => {
    return currentUser?.role === "retailer" 
      ? { min: 0, max: 10 } 
      : { min: 10, max: 20 };
  };

  // Generate discount within role-based range
  const getRoleBasedDiscount = () => {
    const { min, max } = getDiscountRange();
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Fetch or generate today's featured products
  const fetchFeaturedProducts = async () => {
    try {
      const todayKey = getTodayKey();
      const cachedProducts = localStorage.getItem(`featuredProducts-${todayKey}`);
      
      if (cachedProducts) {
        setFeaturedProducts(JSON.parse(cachedProducts));
        return;
      }

      const productsCollection = collection(db, "products");
      const productsSnapshot = await getDocs(productsCollection);
      
      let productsList = productsSnapshot.docs.map((doc) => {
        const productData = doc.data();
        const price = parseFloat(productData.price || productData.averagePrice || 0);
        const discountPercent = getRoleBasedDiscount();
        const discountAmount = (price * discountPercent / 100).toFixed(2);
        
        return {
          id: doc.id,
          ...productData,
          price: price,
          discountPercent: discountPercent,
          discountAmount: discountAmount
        };
      });

      // Sort by price to get mid-range products (not too cheap/expensive)
      productsList.sort((a, b) => a.price - b.price);
      
      // Take 4 products from the middle of the sorted list
      const middleIndex = Math.floor(productsList.length / 2) - 2;
      const todayProducts = productsList.slice(middleIndex, middleIndex + 4);

      // Cache for today
      localStorage.setItem(
        `featuredProducts-${todayKey}`,
        JSON.stringify(todayProducts)
      );

      setFeaturedProducts(todayProducts);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      showAlert("Failed to load featured products", "error");
    }
  };

  // Handle quantity selection
  const handleQuantitySelect = (productId, quantity, price) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [productId]: { quantity, price },
    }));
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(hideAlert, 3000);
  };

  const hideAlert = () => {
    setAlert({ show: false, message: "", type: "" });
  }; 

  const handleAddToCart = (product) => {
    const selectedQuantity = selectedQuantities[product.id];
    if (!selectedQuantity) {
      showAlert("Please select a quantity.", "error");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItemIndex = cart.findIndex((item) => item.id === product.id);

    // Calculate final price with discount
    const discountedPrice = (product.price * (1 - product.discountPercent / 100)).toFixed(2);
    const totalPrice = (discountedPrice * selectedQuantity.quantity).toFixed(2);

    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += selectedQuantity.quantity;
      cart[existingItemIndex].totalPrice = (
        parseFloat(cart[existingItemIndex].totalPrice) + parseFloat(totalPrice)
      ).toFixed(2);
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        pricePerKg: discountedPrice,
        quantity: selectedQuantity.quantity,
        totalPrice: totalPrice,
        discountPercent: product.discountPercent
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    showAlert("Added to cart!", "success");
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, [currentUser?.role]); // Refetch if role changes

  return (
    <>
      <section className={styles.featuredProducts}>
        <h2>
          {currentUser?.role === "retailer" 
            ? "Wholesale Specials" 
            : "Today's Featured Deals"}
        </h2>
        
        <div className={styles.productGrid}>
          {featuredProducts.map((product) => {
            // Ensure price is a valid number
            const price = parseFloat(product.price) || 0;
            const discountedPrice = (price * (1 - product.discountPercent / 100)).toFixed(2);

            return (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.discountBadge}>
                  {product.discountPercent}% OFF
                </div>

                <div className={styles.productImageContainer}>
                  <img
                    src={product.imageUrl || "/images/placeholder.jpg"}
                    alt={product.name}
                    className={styles.productImage}
                    onError={(e) => {
                      e.target.src = "/images/placeholder.jpg";
                    }}
                  />
                </div>
                
                <h3>{product.name}</h3>
                
                {/* Price Display - Now properly validated */}
                <div className={styles.priceContainer}>
                  <span className={styles.originalPrice}>
                    ₹{price.toFixed(2)}
                  </span>
                  <span className={styles.discountedPrice}>
                    ₹{discountedPrice}/kg
                  </span>
                  <span className={styles.discountAmount}>
                    Save ₹{product.discountAmount}
                  </span>
                </div>

                {/* Quantity Options */}
                <div className={styles.priceOptions}>
                  {[
                    { label: "100g", quantity: 0.1 },
                    { label: "250g", quantity: 0.25 },
                    { label: "500g", quantity: 0.5 },
                    { label: "1kg", quantity: 1 },
                  ].map((option) => {
                    const optionPrice = (price * option.quantity).toFixed(2);
                    const discountedOptionPrice = (
                      price * 
                      option.quantity * 
                      (1 - product.discountPercent / 100)
                    ).toFixed(2);

                    return (
                      <button
                        key={option.label}
                        className={`${styles.quantityButton} ${
                          selectedQuantities[product.id]?.quantity === option.quantity 
                            ? styles.selected 
                            : ""
                        }`}
                        onClick={() =>
                          handleQuantitySelect(
                            product.id,
                            option.quantity,
                            discountedOptionPrice
                          )
                        }
                      >
                        {option.label} - ₹{discountedOptionPrice}
                      </button>
                    );
                  })}
                </div>

                <button
                  className={styles.addToCartButton}
                  onClick={() => handleAddToCart(product)}
                >
                  Add to Cart
                </button>
              </div>
            );
          })}
        </div>

        <Link to="/shop" className={styles.shopMoreButton}>
          View All Products
        </Link>
      </section>
      
      {alert.show && (
        <Alert message={alert.message} type={alert.type} onClose={hideAlert} />
      )}
    </>
  );
};

export default FeaturedProducts;