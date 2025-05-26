import React, { useEffect, useState, useContext } from "react";
import { getFirestore, collection, doc, getDoc, getDocs, collectionGroup } from "firebase/firestore";
import { app } from "../../firebase_Config"; 
import { LoadingContext } from "../../context/LoadingContext"; 
import Alert from "../../components/Alert/Alert";
import Search from "../../components/Search/Search"; 
import { getAuth } from "firebase/auth";
import {addToCart, getCart, updateCartItem} from "../../utils/cartService"
import styles from "./Shop.module.css"

function Shop() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); // State for filtered products
  const [selectedQuantities, setSelectedQuantities] = useState({}); // Track selected quantities
  const { setLoading } = useContext(LoadingContext); // Access the setLoading function
  const [category, setCategory] = useState("all"); // Track selected category
  const [searchQuery, setSearchQuery] = useState(""); // Track search query
  const [userRole, setUserRole] = useState(null); // State to store user role
  const db = getFirestore(app);
  const auth = getAuth(app);
  const user = auth.currentUser; // Get the current user

  // Alert state
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
  };

  const hideAlert = () => {
    setAlert({ show: false, message: "", type: "" });
  };

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          setUserRole(role);
        }
      }
    };
    fetchUserRole();
  }, [db, user]);

  // Fetch all products and calculate average price
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true); // Set loading to true before fetching data
      try {
        // Fetch all products from the 'products' collection
        const productsCollection = collection(db, "products");
        const productsSnapshot = await getDocs(productsCollection);
        const productsList = [];

        // Fetch all 'pricePerKg' values for each product using a collection group query
        const productsGroupQuery = collectionGroup(db, "products");
        const productsGroupSnapshot = await getDocs(productsGroupQuery);

        // Process each product
        for (const productDoc of productsSnapshot.docs) {
          const productData = productDoc.data();
          const productId = productDoc.id;

          // Filter the collection group results for the current product
          const productPrices = productsGroupSnapshot.docs
            .filter((doc) => {
              const data = doc.data();
              return (
                data.productId === productId &&
                (userRole === "customer" ? data.retailerPricePerKg !== undefined : data.wholesalerPricePerKg !== undefined)
              );
            })
            .map((doc) => {
              const data = doc.data();
              return userRole === "customer" ? data.retailerPricePerKg : data.wholesalerPricePerKg;
            });

          // Calculate average price
          const totalPrice = productPrices.reduce((sum, price) => sum + price, 0);
          const averagePrice = productPrices.length > 0 ? totalPrice / productPrices.length : 0;

          // Add product to the list
          productsList.push({
            id: productId,
            ...productData,
            averagePrice,
          });
        }

        setProducts(productsList);
        setFilteredProducts(productsList); // Initialize filtered products with all products
      } catch (error) {
        showAlert("Error fetching products. Please try again later.", "error");
      } finally {
        setLoading(false); // Stop loading
      }
    };

    if (userRole) {
      fetchProducts();
    }
  }, [db, setLoading, userRole]);

  // Handle quantity selection
  const handleQuantitySelect = (productId, quantity, price) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [productId]: { quantity, price },
    }));
  };

  const handleAddToCart = async (product) => {
    const selectedQuantity = selectedQuantities[product.id];
    if (!selectedQuantity) {
      showAlert("Please select a quantity.", "warning");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        showAlert("Please login to add items to cart", "error");
        return;
      }

      const cartItem = {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        pricePerKg: selectedQuantity.price / selectedQuantity.quantity,
        quantity: selectedQuantity.quantity,
        totalPrice: selectedQuantity.price,
        addedAt: new Date().toISOString()
      };

      // Check if item already exists in cart
      const existingCart = await getCart(user.uid);
      const existingItem = existingCart.find(item => item.id === product.id);

      if (existingItem) {
        // Update quantity if exists
        const newQuantity = existingItem.quantity + selectedQuantity.quantity;
        await updateCartItem(
          user.uid,
          product.id,
          newQuantity,
          selectedQuantity.price / selectedQuantity.quantity
        );
      } else {
        // Add new item
        await addToCart(user.uid, cartItem);
      }

      showAlert("Added to cart!", "success");
    } catch (error) {
      console.error("Error adding to cart:", error);
      showAlert("Failed to add to cart. Please try again.", "error");
    }
  };

  // Handle search and filter
  useEffect(() => {
    let filtered = products;

    // Filter by category
    if (category !== "all") {
      filtered = filtered.filter((product) => product.category === category);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [category, searchQuery, products]);

  // Generate quantity options based on user role
  const getQuantityOptions = (averagePrice) => {
    if (userRole === "retailer") {
      return [
        { label: "5kg", quantity: 5, price: (averagePrice * 5).toFixed(2) },
        { label: "10kg", quantity: 10, price: (averagePrice * 10).toFixed(2) },
        { label: "20kg", quantity: 20, price: (averagePrice * 20).toFixed(2) },
        { label: "50kg", quantity: 50, price: (averagePrice * 50).toFixed(2) },
      ];
    } else {
      return [
        { label: "100g", quantity: 0.1, price: (averagePrice / 10).toFixed(2) },
        { label: "250g", quantity: 0.25, price: (averagePrice / 4).toFixed(2) },
        { label: "500g", quantity: 0.5, price: (averagePrice / 2).toFixed(2) },
        { label: "1kg", quantity: 1, price: averagePrice.toFixed(2) },
      ];
    }
  };

  return (
    <div className={styles.shopContainer}>
      <h1>Shop</h1>
      <Search onSearch={setSearchQuery} />
      <div className={styles.categoryButtons}>
        <button
          className={`${styles.categoryButton} ${category === "all" ? styles.active : ""}`}
          onClick={() => setCategory("all")}
        >
          All
        </button>
        <button
          className={`${styles.categoryButton} ${category === "vegetables" ? styles.active : ""}`}
          onClick={() => setCategory("vegetables")}
        >
          Vegetables
        </button>
        <button
          className={`${styles.categoryButton} ${category === "fruits" ? styles.active : ""}`}
          onClick={() => setCategory("fruits")}
        >
          Fruits
        </button>
      </div>

      {/* Display Filtered Products */}
      <div className={styles.productGrid}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className={styles.productCard}>
              <div className={styles.productImageContainer}>
                <img
                  src={product.imageUrl || "/path/to/placeholder-image.jpg"}
                  alt={product.name}
                  className={styles.productImage}
                  onError={(e) => {
                    e.target.src = "/path/to/placeholder-image.jpg"; // Fallback image
                  }}
                />
              </div>
              <h3>{product.name}</h3>
              <p>Price: ₹{product.averagePrice.toFixed(2)}/kg</p>
              <div className={styles.priceOptions}>
                {getQuantityOptions(product.averagePrice).map((option) => (
                  <button
                    key={option.label}
                    className={`${styles.quantityButton} ${
                      selectedQuantities[product.id]?.quantity === option.quantity ? styles.selected : ""
                    }`}
                    onClick={() =>
                      handleQuantitySelect(product.id, option.quantity, option.price)
                    }
                  >
                    {option.label} - ₹{option.price}
                  </button>
                ))}
              </div>
              <button
                className={styles.addToCartButton}
                onClick={() => handleAddToCart(product)}
              >
                Add to Cart
              </button>
            </div>
          ))
        ) : (
          <p className={styles.noProductsMessage}>No products found with the product name.</p>
        )}
      </div>

      {/* Render Alert */}
      {alert.show && (
        <Alert message={alert.message} type={alert.type} onClose={hideAlert} />
      )}
    </div>
  );
}

export default Shop;