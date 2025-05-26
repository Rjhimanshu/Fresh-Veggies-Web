import React, { useEffect, useState } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  collectionGroup
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import styles from './ProductMgmt.module.css';

const ProductMgmt = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProductId, setEditingProductId] = useState(null);
  const [updatedName, setUpdatedName] = useState('');
  const [updatedImage, setUpdatedImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchProductsWithPrices = async () => {
      try {
        setLoading(true);
        
        // Fetch all products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsList = [];
        
        // Fetch all product prices from retailers and wholesalers
        const productPricesQuery = collectionGroup(db, 'products');
        const productPricesSnapshot = await getDocs(productPricesQuery);

        // Process each product
        for (const productDoc of productsSnapshot.docs) {
          const productData = productDoc.data();
          const productId = productDoc.id;

          // Filter prices for this product
          const productPrices = productPricesSnapshot.docs
            .filter(doc => doc.data().productId === productId)
            .map(doc => doc.data());

          // Calculate average prices
          const retailerPrices = productPrices
            .filter(price => price.retailerPricePerKg)
            .map(price => price.retailerPricePerKg);
          
          const wholesalerPrices = productPrices
            .filter(price => price.wholesalerPricePerKg)
            .map(price => price.wholesalerPricePerKg);

          const retailerAvg = retailerPrices.length > 0 
            ? retailerPrices.reduce((sum, price) => sum + price, 0) / retailerPrices.length
            : 0;
            
          const wholesalerAvg = wholesalerPrices.length > 0
            ? wholesalerPrices.reduce((sum, price) => sum + price, 0) / wholesalerPrices.length
            : 0;

          productsList.push({
            id: productId,
            ...productData,
            retailerAveragePrice: retailerAvg,
            wholesalerAveragePrice: wholesalerAvg
          });
        }

        setProducts(productsList);
        setFilteredProducts(productsList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products: ', err);
        setLoading(false);
      }
    };

    fetchProductsWithPrices();
  }, []);

  // Apply search and filters
  useEffect(() => {
    let results = products;
    
    // Filter by category (vegetables or fruits)
    if (categoryFilter !== 'all') {
      results = results.filter(product => product.category === categoryFilter);
    }
    
    // Search by product name
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(product => 
        product.name.toLowerCase().includes(term)
      );
    }
    
    setFilteredProducts(results);
  }, [products, searchTerm, categoryFilter]);

  const handleEdit = (product) => {
    setEditingProductId(product.id);
    setUpdatedName(product.name);
    setUpdatedImage(null);
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  const uploadImage = async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('upload_preset', 'products_img');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dj5sf6jb3/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (err) {
      console.error('Error uploading image: ', err);
      throw err;
    }
  };

  const handleUpdate = async (productId) => {
    try {
      const productRef = doc(db, 'products', productId);
      const updatedData = {
        name: updatedName,
      };

      // Upload new image if provided
      if (updatedImage) {
        const imageUrl = await uploadImage(updatedImage);
        updatedData.imageUrl = imageUrl;
      }

      await updateDoc(productRef, updatedData);

      // Update local state
      setProducts(products.map(product => 
        product.id === productId ? { 
          ...product, 
          ...updatedData 
        } : product
      ));

      setEditingProductId(null);
      alert('Product updated successfully!');
    } catch (err) {
      console.error('Error updating product: ', err);
      alert('Failed to update product. Please try again.');
    }
  };

  const handleDelete = async (productId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this product?');
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        setProducts(products.filter(product => product.id !== productId));
        alert('Product deleted successfully!');
      } catch (err) {
        console.error('Error deleting product: ', err);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading products...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Product Management</h2>
      
      {/* Search and Filter Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterContainer}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Categories</option>
            <option value="vegetables">Vegetables</option>
            <option value="fruits">Fruits</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className={styles.noResults}>No products found matching your criteria.</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Retailer Avg (₹/kg)</th>
                <th>Wholesaler Avg (₹/kg)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    {editingProductId === product.id ? (
                      <input
                        type="file"
                        onChange={(e) => setUpdatedImage(e.target.files[0])}
                      />
                    ) : (
                      <img
                        src={product.imageUrl || '/placeholder-product.png'}
                        alt={product.name}
                        className={styles.productImage}
                      />
                    )}
                  </td>
                  <td>
                    {editingProductId === product.id ? (
                      <input
                        type="text"
                        value={updatedName}
                        onChange={(e) => setUpdatedName(e.target.value)}
                        required
                      />
                    ) : (
                      product.name
                    )}
                  </td>
                  <td>
                    {product.category || 'N/A'}
                  </td>
                  <td>
                    {product.retailerAveragePrice.toFixed(2)}
                  </td>
                  <td>
                    {product.wholesalerAveragePrice.toFixed(2)}
                  </td>
                  <td className={styles.actions}>
                    {editingProductId === product.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(product.id)}
                          className={styles.updateButton}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className={styles.cancelButton}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(product)}
                          className={styles.editButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductMgmt;