import React, { useEffect, useState, useContext } from 'react';
import styles from './MyProducts.module.css';
import { getFirestore, collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { app } from '../../firebase_Config'; // Adjust the path to your Firebase config
import { getAuth } from 'firebase/auth';
import { LoadingContext } from "../../context/LoadingContext"; // Import the LoadingContext
import Alert from '../Alert/Alert';
import Search from '../Search/Search';

const MyProducts = () => {
  const [myProducts, setMyProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState("all");
  const [filteredMyProducts, setFilteredMyProducts] = useState([]);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const user = auth.currentUser; // Get the current user
  const [userRole, setUserRole] = useState(null); // State to store user role
  const { setLoading } = useContext(LoadingContext); // Access the setLoading function
  // Alert state
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
  };

  const hideAlert = () => {
    setAlert({ show: false, message: "", type: "" });
  };

  // Fetch user role from Firestore
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role); // Set the user role
        }
      }
    };
    fetchUserRole();
  }, [db, user]);


  // Handle search and filter
  useEffect(() => {
    let filtered = myProducts;

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

    setFilteredMyProducts(filtered);
  }, [category, searchQuery, myProducts]);

  // Fetch products added by the current user (retailer or wholesaler)
  useEffect(() => {
    const fetchMyProducts = async () => {
      if (!userRole) return; // Wait until user role is fetched

      // Determine the collection based on user role
      const collectionName = userRole === 'retailer' ? 'retailers' : 'wholesalers';

      // Query the user's subcollection for products
      const userProductsRef = collection(db, collectionName, user.uid, 'products');
      const querySnapshot = await getDocs(userProductsRef);

      // Fetch product details from the products collection
      const productsList = [];
      for (const docSnapshot of querySnapshot.docs) {
        const productData = docSnapshot.data();
        const productDocRef = doc(db, 'products', productData.productId);
        const productDocSnap = await getDoc(productDocRef);

        if (productDocSnap.exists()) {
          const productDetails = productDocSnap.data();
          productsList.push({
            id: docSnapshot.id, // Add document ID for deletion
            ...productData,
            ...productDetails,
            // Use the correct price field based on user role
            pricePerKg: userRole === 'retailer' ? productData.retailerPricePerKg : productData.wholesalerPricePerKg,
          });
        }
      }
      setMyProducts(productsList);
      setFilteredMyProducts(productsList);
      setLoading(false); // Stop loading
    };

    fetchMyProducts();
  }, [db, user, userRole, setLoading]);

  // Remove a product from the user's subcollection
  const handleRemoveProduct = async (productId) => {
    if (!userRole) return;

    try {
      // Determine the collection based on user role
      const collectionName = userRole === 'retailer' ? 'retailers' : 'wholesalers';

      // Reference to the product document in the user's subcollection
      const productDocRef = doc(db, collectionName, user.uid, 'products', productId);

      // Delete the product document
      await deleteDoc(productDocRef);

      // Update the UI by removing the product from the state
      setMyProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== productId)
      );

      showAlert('Product removed successfully!', 'success');
    } catch (error) {
      showAlert('Failed to remove product. Please try again.', 'error');
    }
  };

  return (
    <div className={styles.container}>
      <h1>My Products</h1>
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

      <div className={styles.productList}>
        {filteredMyProducts.map((product) => (
          <div key={product.id} className={styles.productCard}>
            <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
            <h3>{product.name}</h3>
            <p>Price per Kg: ₹{product.pricePerKg}</p>
            <p>Stock: {product.stockInKg} Kg</p>
            <button
              className={styles.removeButton}
              onClick={() => handleRemoveProduct(product.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {/* Render Alert */}
      {alert.show && (
        <Alert message={alert.message} type={alert.type} onClose={hideAlert} />
      )}
    </div>
  );
};

export default MyProducts;