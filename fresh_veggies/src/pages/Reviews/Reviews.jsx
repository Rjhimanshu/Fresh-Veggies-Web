import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase_Config';
import styles from './Reviews.module.css';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert/Alert';

const Reviews = () => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [ratingFilter, setRatingFilter] = useState(0);
  const [roleFilter, setRoleFilter] = useState('all');


  // Alert state
    const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  
    const hideAlert = () => {
      setAlert({ show: false, message: "", type: "" });
    };

  // Fetch all reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, 'reviews'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const reviewsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));
        setReviews(reviewsData);
        setFilteredReviews(reviewsData);
      } catch (err) {
        setError('Failed to load reviews. Please try again later.');
      }
    };

    fetchReviews();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    let result = [...reviews];
    
    // Apply rating filter
    if (ratingFilter > 0) {
      result = result.filter(review => review.rating === ratingFilter);
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(review => review.userRole === roleFilter);
    }
    
    setFilteredReviews(result);
  }, [ratingFilter, roleFilter, reviews]);

  const handleImageChange = (e) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const filesArray = Array.from(e.target.files)
        .filter(file => file.type.startsWith('image/'));
      
      if (filesArray.length === 0) {
        setError('Please select valid image files');
        return;
      }

      setImages(prev => [...prev, ...filesArray]);
    } catch (err) {
      setError('Failed to process images');
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => {
      const newProgress = {...prev};
      delete newProgress[images[index]?.name];
      return newProgress;
    });
  };

  const uploadImageToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'reviews');
      formData.append('folder', 'product_reviews');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dj5sf6jb3/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to submit a review');
      }
      
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('Please select a valid rating (1-5 stars)');
      }

      // Upload images if any
      let imageUrls = [];
      if (images.length > 0) {
        const uploadPromises = images.map(async (file) => {
          try {
            const data = await uploadImageToCloudinary(file);
            return data.secure_url;
          } catch (err) {
            console.error(`Failed to upload image ${file.name}:`, err);
            throw new Error(`Failed to upload ${file.name}. Please try again.`);
          }
        });

        imageUrls = await Promise.all(uploadPromises);
      }

      // Prepare review data with user information
      const reviewData = {
        rating,
        comment: comment.trim(),
        images: imageUrls,
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        userEmail: currentUser.email || '',
        userPhoto: currentUser.photoURL || '',
        userRole: currentUser.role || 'customer' // Add user role
      };

      // Add to Firestore (now in general reviews collection)
      const docRef = await addDoc(collection(db, 'reviews'), reviewData);

      // Update local state
      setReviews(prev => [{
        ...reviewData,
        id: docRef.id,
        createdAt: new Date()
      }, ...prev]);

      // Reset form
      setRating(0);
      setComment('');
      setImages([]);
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress({});
    }
  };

  return (
    <div className={styles.reviewsContainer}>
      <h2 className={styles.sectionTitle}>Customer Reviews</h2>
      
      {/* Filters Section */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Filter by Rating:</label>
          <select 
            value={ratingFilter} 
            onChange={(e) => setRatingFilter(Number(e.target.value))}
            className={styles.filterSelect}
          >
            <option value={0}>All Ratings</option>
            <option value={5}>★★★★★</option>
            <option value={4}>★★★★☆</option>
            <option value={3}>★★★☆☆</option>
            <option value={2}>★★☆☆☆</option>
            <option value={1}>★☆☆☆☆</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Filter by Role:</label>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Users</option>
            <option value="customer">Customers</option>
            <option value="retailer">Retailers</option>
            <option value="wholesaler">Wholesalers</option>
          </select>
        </div>
      </div>

      {/* Add Review Button - Only for logged in users */}
      {currentUser && (
        <button 
          onClick={() => setShowForm(true)}
          className={styles.addReviewButton}
        >
          Add Your Review
        </button>
      )}

      {/* Reviews List */}
      <div className={styles.reviewsList}>
        {filteredReviews.length === 0 ? (
          <p className={styles.noReviews}>No reviews found matching your filters.</p>
        ) : (
          filteredReviews.map(review => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.userInfo}>
                  {review.userPhoto && (
                    <img 
                      src={review.userPhoto} 
                      alt={review.userName} 
                      className={styles.userAvatar}
                    />
                  )}
                  <div>
                    <span className={styles.userName}>{review.userName}</span>
                    <span className={styles.userRole}>{review.userRole}</span>
                  </div>
                </div>
                <div className={styles.ratingStars}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
              </div>
              
              <span className={styles.reviewDate}>
                {review.createdAt?.toLocaleDateString() || 'Just now'}
              </span>
              
              <p className={styles.reviewComment}>{review.comment}</p>
              
              {review.images?.length > 0 && (
                <div className={styles.reviewImages}>
                  {review.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt={`Review ${idx + 1}`} 
                      className={styles.reviewImage}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Form Modal */}
      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button 
              onClick={() => setShowForm(false)}
              className={styles.closeButton}
            >
              &times;
            </button>
            
            <h3 className={styles.modalTitle}>Write a Review</h3>
            
            <form onSubmit={handleSubmit} className={styles.reviewForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Rating:</label>
                <div className={styles.starRating}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`${styles.star} ${star <= rating ? styles.filled : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Your Review:</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={styles.textarea}
                  rows="4"
                  placeholder="Share your thoughts..."
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Upload Images (Optional):</label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className={styles.fileInput}
                  multiple
                  accept="image/*"
                />
                
                {images.length > 0 && (
                  <div className={styles.imagePreviews}>
                    {images.map((file, index) => (
                      <div key={index} className={styles.imagePreviewItem}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index}`}
                          className={styles.imagePreview}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className={styles.removeImageButton}
                        >
                          &times;
                        </button>
                        {uploadProgress[file.name] && (
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFill}
                              style={{ width: `${uploadProgress[file.name]}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {error && <p className={styles.errorMessage}>{error}</p>}
              
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Render Alert */}
      {alert.show && (
        <Alert message={alert.message} type={alert.type} onClose={hideAlert} />
      )}

    </div>
  );
};

export default Reviews;