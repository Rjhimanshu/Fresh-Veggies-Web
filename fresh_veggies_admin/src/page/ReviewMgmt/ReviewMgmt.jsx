import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import styles from './ReviewMgmt.module.css';

const ReviewMgmt = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  
  // Filters
  const [nameFilter, setNameFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [dateFilter, setDateFilter] = useState('newest');

  // Fetch all reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        let q;
        if (dateFilter === 'newest') {
          q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
        } else {
          q = query(collection(db, 'reviews'), orderBy('createdAt', 'asc'));
        }

        const querySnapshot = await getDocs(q);
        const reviewsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setReviews(reviewsData);
        setFilteredReviews(reviewsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews. Please try again later.');
        setLoading(false);
      }
    };

    fetchReviews();
  }, [dateFilter]);

  // Apply filters
  useEffect(() => {
    let result = [...reviews];
    
    // Filter by name
    if (nameFilter) {
      const searchTerm = nameFilter.toLowerCase();
      result = result.filter(review => 
        review.userName.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter(review => review.userRole === roleFilter);
    }
    
    // Filter by rating
    if (ratingFilter > 0) {
      result = result.filter(review => review.rating === ratingFilter);
    }
    
    setFilteredReviews(result);
  }, [nameFilter, roleFilter, ratingFilter, reviews]);

  // Delete review
  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      setReviews(prev => prev.filter(review => review.id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review. Please try again.');
    }
  };

  // Update review
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingReview) return;
    
    try {
      await updateDoc(doc(db, 'reviews', editingReview.id), {
        rating: editingReview.rating,
        comment: editingReview.comment
      });
      
      setReviews(prev => prev.map(review => 
        review.id === editingReview.id ? editingReview : review
      ));
      
      setEditingReview(null);
    } catch (err) {
      console.error('Error updating review:', err);
      setError('Failed to update review. Please try again.');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading reviews...</div>;
  }

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.pageTitle}>Reviews Management</h1>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {/* Filters Section */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label>Search by Name:</label>
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Enter user name"
          />
        </div>
        
        <div className={styles.filterGroup}>
          <label>Filter by Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="retailer">Retailer</option>
            <option value="wholesaler">Wholesaler</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label>Filter by Rating:</label>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(Number(e.target.value))}
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
          <label>Sort by Date:</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
      
      {/* Reviews Table */}
      <div className={styles.reviewsTableContainer}>
        <table className={styles.reviewsTable}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length === 0 ? (
              <tr>
                <td colSpan="6" className={styles.noResults}>
                  No reviews found matching your filters
                </td>
              </tr>
            ) : (
              filteredReviews.map(review => (
                <tr key={review.id}>
                  <td>
                    <div className={styles.userCell}>
                      {review.userPhoto && (
                        <img 
                          src={review.userPhoto} 
                          alt={review.userName} 
                          className={styles.userAvatar}
                        />
                      )}
                      <div>
                        <div className={styles.userName}>{review.userName}</div>
                        <div className={styles.userEmail}>{review.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.roleCell}>
                    <span className={`${styles.roleBadge} ${styles[review.userRole]}`}>
                      {review.userRole}
                    </span>
                  </td>
                  <td className={styles.ratingCell}>
                    <div className={styles.stars}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </td>
                  <td className={styles.reviewCell}>
                    <div className={styles.comment}>{review.comment}</div>
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
                  </td>
                  <td className={styles.dateCell}>
                    {review.createdAt.toLocaleDateString()}
                    <div className={styles.time}>
                      {review.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </td>
                  <td className={styles.actionsCell}>
                    <button 
                      onClick={() => setEditingReview({...review})}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(review.id)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Edit Modal */}
      {editingReview && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button 
              onClick={() => setEditingReview(null)}
              className={styles.closeButton}
            >
              &times;
            </button>
            
            <h2>Edit Review</h2>
            
            <form onSubmit={handleUpdate} className={styles.editForm}>
              <div className={styles.formGroup}>
                <label>Rating:</label>
                <div className={styles.starRating}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`${styles.star} ${star <= editingReview.rating ? styles.filled : ''}`}
                      onClick={() => setEditingReview({...editingReview, rating: star})}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Review Text:</label>
                <textarea
                  value={editingReview.comment}
                  onChange={(e) => setEditingReview({
                    ...editingReview,
                    comment: e.target.value
                  })}
                  className={styles.textarea}
                  rows="5"
                />
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewMgmt;