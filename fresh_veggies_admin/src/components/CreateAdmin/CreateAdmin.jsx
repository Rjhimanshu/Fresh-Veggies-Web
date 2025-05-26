import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styles from './CreateAdmin.module.css'; // Import the CSS module

const CreateAdmin = ({ setAdminExists }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Create the admin user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Store the admin email in Firestore
      await addDoc(collection(db, 'adminCredentials'), {
        email: email,
      });

      // Update the adminExists state
      setAdminExists(true);

      // Redirect to the login page
      navigate('/');
    } catch (err) {
      setError('Error creating admin user. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Create Admin</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter admin email"
            className={styles.input}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className={styles.input}
            required
          />
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <button type="submit" className={styles.submitButton}>
          Create Admin
        </button>
      </form>
    </div>
  );
};

export default CreateAdmin;