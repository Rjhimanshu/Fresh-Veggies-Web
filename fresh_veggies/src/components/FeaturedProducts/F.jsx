import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "../../firebase_Config";
import styles from "./FeaturedProducts.module.css";
import { Link } from "react-router-dom";

const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const db = getFirestore(app);

  // Generate random discount between 2-7 rupees
  const getRandomDiscount = () => {
    return Math.floor(Math.random() * 6) + 2; // 2-7 rupees
  };

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const productsCollection = collection(db, "products");
        const productsSnapshot = await getDocs(productsCollection);
        const productsList = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          discount: getRandomDiscount(),
        }));

        // Shuffle and pick 4 products
        const shuffled = productsList.sort(() => 0.5 - Math.random());
        setFeaturedProducts(shuffled.slice(0, 4));
      } catch (error) {
        console.error("Error fetching featured products:", error);
      }
    };

    fetchFeaturedProducts();
  }, [db]);

  const handleQuantitySelect = (productId, quantity, price) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [productId]: { quantity, price },
    }));
  };

  const handleAddToCart = (product) => {
    const selectedQuantity = selectedQuantities[product.id];
    if (!selectedQuantity) {
      alert("Please select a quantity.");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItemIndex = cart.findIndex((item) => item.id === product.id);

    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += selectedQuantity.quantity;
      cart[existingItemIndex].totalPrice = (
        (product.averagePrice - product.discount) * 
        cart[existingItemIndex].quantity
      ).toFixed(2);
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        pricePerKg: (product.averagePrice - product.discount).toFixed(2),
        originalPrice: product.averagePrice,
        discount: product.discount,
        quantity: selectedQuantity.quantity,
        totalPrice: selectedQuantity.price,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Added to cart. Visit cart for checkout.");
  };

  return (
    <section className={styles.featuredProducts}>
      <h2>Featured Products</h2>
      <div className={styles.productGrid}>
        {featuredProducts.map((product) => {
          const originalPrice = product.averagePrice || 0;
          const discountedPrice = originalPrice - (product.discount || 0);
          
          return (
            <div key={product.id} className={styles.productCard}>
              <div className={styles.productImageContainer}>
                <img
                  src={product.imageUrl || "/path/to/placeholder-image.jpg"}
                  alt={product.name}
                  className={styles.productImage}
                  onError={(e) => {
                    e.target.src = "/path/to/placeholder-image.jpg";
                  }}
                />
                {product.discount > 0 && (
                  <div className={styles.discountBadge}>
                    Save ₹{product.discount}/kg
                  </div>
                )}
              </div>
              <h3>{product.name}</h3>
              <div className={styles.priceContainer}>
                {product.discount > 0 ? (
                  <>
                    <span className={styles.originalPrice}>
                      ₹{originalPrice.toFixed(2)}/kg
                    </span>
                    <span className={styles.currentPrice}>
                      ₹{discountedPrice.toFixed(2)}/kg
                    </span>
                  </>
                ) : (
                  <span className={styles.currentPrice}>
                    ₹{originalPrice.toFixed(2)}/kg
                  </span>
                )}
              </div>
              <div className={styles.priceOptions}>
                {[
                  { label: "100g", quantity: 0.1 },
                  { label: "250g", quantity: 0.25 },
                  { label: "500g", quantity: 0.5 },
                  { label: "1kg", quantity: 1 },
                ].map((option) => {
                  const optionPrice = (discountedPrice * option.quantity).toFixed(2);
                  return (
                    <button
                      key={option.label}
                      className={`${styles.quantityButton} ${
                        selectedQuantities[product.id]?.quantity === option.quantity
                          ? styles.selected
                          : ""
                      }`}
                      onClick={() =>
                        handleQuantitySelect(product.id, option.quantity, optionPrice)
                      }
                    >
                      {option.label} - ₹{optionPrice}
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
        Shop More
      </Link>
    </section>
  );
};

export default FeaturedProducts;