import React, { useState, useEffect, useContext } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { app } from '../../firebase_Config';
import { getAuth } from 'firebase/auth';
import { LoadingContext } from "../../context/LoadingContext";
import Alert from '../../components/Alert/Alert';
import styles from './Inventory.module.css';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [userProducts, setUserProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState("all");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pricePerKg, setPricePerKg] = useState('');
  const [stockInKg, setStockInKg] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [viewMode, setViewMode] = useState("myProducts");
  const [isLoading, setIsLoading] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState({});
  
  const db = getFirestore(app);
  const auth = getAuth(app);
  const user = auth.currentUser;
  const { setLoading } = useContext(LoadingContext);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  // Alert functions
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
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
    };
    fetchUserRole();
  }, [db, user]);

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Initialize loading state for each image
          imageLoading: true
        }));
        setProducts(productsList);
        setFilteredProducts(productsList);
      } catch (error) {
        console.error("Error fetching products:", error);
        showAlert("Failed to load products", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [db, setLoading]);

  // Fetch user's products
  useEffect(() => {
    const fetchUserProducts = async () => {
      if (!userRole || !user) return;
      
      setIsViewLoading(true);
      try {
        const collectionName = userRole === 'retailer' ? 'retailers' : 'wholesalers';
        const userProductsRef = collection(db, collectionName, user.uid, 'products');
        const querySnapshot = await getDocs(userProductsRef);
        
        const userProductsList = [];
        for (const docSnapshot of querySnapshot.docs) {
          const productData = docSnapshot.data();
          const productDoc = await getDoc(doc(db, 'products', productData.productId));
          
          if (productDoc.exists()) {
            userProductsList.push({
              id: docSnapshot.id,
              ...productData,
              ...productDoc.data(),
              pricePerKg: userRole === 'retailer' ? productData.retailerPricePerKg : productData.wholesalerPricePerKg,
              imageLoading: true
            });
          }
        }
        setUserProducts(userProductsList);
      } catch (error) {
        console.error("Error fetching user products:", error);
        showAlert("Failed to load your products", "error");
      } finally {
        setIsViewLoading(false);
      }
    };
    
    fetchUserProducts();
  }, [db, user, userRole]);

  // Handle view change
  const handleViewChange = (mode) => {
    setIsLoading(true);
    setViewMode(mode);
    // Simulate loading delay (replace with actual data fetching if needed)
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  // Handle image load
  const handleImageLoad = (productId) => {
    setImageLoading(prev => ({ ...prev, [productId]: false }));
  };

  // Handle product selection for editing
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    if (userProducts.some(p => p.id === product.id)) {
      const userProduct = userProducts.find(p => p.id === product.id);
      setPricePerKg(userProduct.pricePerKg || '');
      setStockInKg(userProduct.stockInKg || '');
    } else {
      setPricePerKg('');
      setStockInKg('');
    }
  };

  // Save/update product
  const saveProduct = async () => {
    if (!pricePerKg || !stockInKg || !selectedProduct || !userRole) {
      showAlert("Please fill all fields", "error");
      return;
    }

    setIsLoading(true);
    try {
      const collectionName = userRole === 'retailer' ? 'retailers' : 'wholesalers';
      const productRef = doc(db, collectionName, user.uid, 'products', selectedProduct.id);
      
      await setDoc(productRef, {
        productId: selectedProduct.id,
        [userRole === 'retailer' ? 'retailerPricePerKg' : 'wholesalerPricePerKg']: parseFloat(pricePerKg),
        stockInKg: parseFloat(stockInKg),
        timestamp: new Date()
      });

      showAlert("Product saved successfully", "success");
      setSelectedProduct(null);
      // Refresh user products
      const updatedSnapshot = await getDocs(collection(db, collectionName, user.uid, 'products'));
      const updatedProducts = [];
      for (const docSnapshot of updatedSnapshot.docs) {
        const productData = docSnapshot.data();
        const productDoc = await getDoc(doc(db, 'products', productData.productId));
        if (productDoc.exists()) {
          updatedProducts.push({
            id: docSnapshot.id,
            ...productData,
            ...productDoc.data(),
            pricePerKg: userRole === 'retailer' ? productData.retailerPricePerKg : productData.wholesalerPricePerKg,
            imageLoading: true
          });
        }
      }
      setUserProducts(updatedProducts);
    } catch (error) {
      console.error("Error saving product:", error);
      showAlert("Failed to save product", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Remove product
  const removeProduct = async (productId) => {
    if (!userRole) return;
    
    setIsLoading(true);
    try {
      const collectionName = userRole === 'retailer' ? 'retailers' : 'wholesalers';
      await deleteDoc(doc(db, collectionName, user.uid, 'products', productId));
      setUserProducts(prev => prev.filter(p => p.id !== productId));
      showAlert("Product removed", "success");
    } catch (error) {
      console.error("Error removing product:", error);
      showAlert("Failed to remove product", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products
  useEffect(() => {
    const currentList = viewMode === "myProducts" ? userProducts : products;
    let filtered = currentList;

    if (category !== "all") {
      filtered = filtered.filter(p => p.category === category);
    }
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [category, searchQuery, viewMode, products, userProducts]);

  return (
    <div className={styles.container}>
      <h1>Product Management</h1>
      
      {/* View Toggle */}
      <div className={styles.viewToggle}>
        <button
          className={`${viewMode === "myProducts" ? styles.active : ""} ${isLoading ? styles.disabled : ""}`}
          onClick={() => !isLoading && handleViewChange("myProducts")}
          disabled={isLoading}
        >
          My Products
        </button>
        <button
          className={`${viewMode === "allProducts" ? styles.active : ""} ${isLoading ? styles.disabled : ""}`}
          onClick={() => !isLoading && handleViewChange("allProducts")}
          disabled={isLoading}
        >
          All Products
        </button>
      </div>

      {/* Loading Overlay */}
      {(isLoading || isViewLoading) && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
        </div>
      )}

      {/* Search */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by name ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className={styles.searchIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
      
      {/* Category Filters */}
      <div className={styles.categoryButtons}>
        {["all", "vegetables", "fruits"].map(cat => (
          <button
            key={cat}
            className={`${styles.categoryButton} ${category === cat ? styles.active : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className={styles.productList}>
        {filteredProducts.length === 0 ? (
          <div className={styles.noProducts}>
            <p>No products found matching your criteria</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <div 
              key={product.id} 
              className={styles.productCard}
              onClick={() => viewMode === "allProducts" && handleProductSelect(product)}
            >
              <div className={styles.productImageContainer}>
                {(imageLoading[product.id] !== false) && (
                  <div className={styles.imagePlaceholder}></div>
                )}
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className={`${styles.productImage} ${imageLoading[product.id] !== false ? styles.loading : ''}`}
                  onLoad={() => handleImageLoad(product.id)}
                  onError={() => handleImageLoad(product.id)}
                  style={{ display: imageLoading[product.id] === false ? 'block' : 'none' }}
                />
              </div>
              
              <h3>{product.name}</h3>
              
              {viewMode === "myProducts" && (
                <>
                  <p className={styles.productPrice}>Price: ₹{product.pricePerKg}/kg</p>
                  <p className={styles.productStock}>Stock: {product.stockInKg} kg</p>
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.editButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductSelect(product);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className={styles.removeButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProduct(product.id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
              
              {viewMode === "allProducts" && (
                <button 
                  className={styles.addButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductSelect(product);
                  }}
                >
                  {userProducts.some(p => p.id === product.id) ? "Update" : "Add to My Products"}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Product Form Modal */}
      {selectedProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>
                {userProducts.some(p => p.id === selectedProduct.id) 
                  ? "Edit Product" 
                  : "Add to My Products"}
              </h2>
              <button 
                className={styles.closeButton}
                onClick={() => setSelectedProduct(null)}
              >
                &times;
              </button>
            </div>
            
            <div className={styles.modalImageContainer}>
              <img 
                src={selectedProduct.imageUrl} 
                alt={selectedProduct.name}
                className={styles.modalImage}
              />
            </div>
            
            <div className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Price per Kg (₹)</label>
                <input
                  type="number"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(e.target.value)}
                  placeholder="Enter price per kg"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Stock (kg)</label>
                <input
                  type="number"
                  value={stockInKg}
                  onChange={(e) => setStockInKg(e.target.value)}
                  placeholder="Enter stock quantity"
                  min="0"
                  step="0.1"
                />
              </div>
              
              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelButton}
                  onClick={() => setSelectedProduct(null)}
                >
                  Cancel
                </button>
                <button 
                  className={styles.saveButton}
                  onClick={saveProduct}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert */}
      {alert.show && (
        <Alert message={alert.message} type={alert.type} onClose={hideAlert} />
      )}
    </div>
  );
};

export default Inventory;