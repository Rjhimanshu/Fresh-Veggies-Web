import React, { useState } from 'react';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Import your Firestore instance
import styles from './AddProduct.module.css';

const AddProduct = () => {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('vegetables'); // Add category state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Ensure an image is selected
      if (!image) {
        throw new Error('Please select an image');
      }

      // Check if a product with the same name already exists
      const productsQuery = query(collection(db, 'products'), where('name', '==', name));
      const querySnapshot = await getDocs(productsQuery);

      if (!querySnapshot.empty) {
        throw new Error('Product already exists !!  Please add a new product');
      }

      // Upload image to Cloudinary
      const formData = new FormData();
      formData.append('file', image);
      formData.append('upload_preset', 'products_img'); // Replace with your upload preset
      formData.append('folder', 'products'); // Optional: Folder in Cloudinary

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/dj5sf6jb3/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!cloudinaryResponse.ok) {
        const errorData = await cloudinaryResponse.json();
        console.error('Cloudinary Error:', errorData);
        throw new Error('Failed to upload image to Cloudinary');
      }

      const cloudinaryData = await cloudinaryResponse.json();
      const imageUrl = cloudinaryData.secure_url; // Get the image URL

      // Ensure imageUrl is defined
      if (!imageUrl) {
        throw new Error('Image URL is undefined');
      }

      // Save product data to Firestore
      await addDoc(collection(db, 'products'), {
        name,
        description,
        imageUrl,
        category, // Add category field
      });

      alert('Product added successfully!');
      setName('');
      setImage(null);
      setDescription('');
      setCategory('vegetables'); // Reset category to default
    } catch (err) {
      setError(err.message); // Display the error message
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <h2 className={styles.title}>Add Product</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Product Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Product Image:</label>
            <input
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
              className={styles.fileInput}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.select}
              required
            >
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
            </select>
          </div>
          {error && <p className={styles.errorMessage}>{error}</p>}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </form>
      </div>
    </>
  );
};

export default AddProduct;