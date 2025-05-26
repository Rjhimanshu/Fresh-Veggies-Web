import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; // Use NavLink for active links
import styles from './Navbar.module.css';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add logout logic here (e.g., clear session, redirect to login)
    navigate('/login');
  };

  return (
    <nav className={styles.navbar}>
      {/* Fresh Veggies Logo */}
      <NavLink to="/admin" className={styles.logo}>
        <img src="https://res.cloudinary.com/dj5sf6jb3/image/upload/v1742238801/am9sbfa1xlrsgrxalnln.jpg" alt="Fresh Veggies Logo" />
        Fresh Veggies
      </NavLink>

      {/* Navbar Links */}
      <ul className={styles.navList}>
        <li className={styles.navItem}>
          <NavLink
            to="/admin/usermgmt"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            Users
          </NavLink>
        </li>
        <li className={styles.navItem}>
          <NavLink
            to="/admin/addproduct"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            Add Product
          </NavLink>
        </li>
        <li className={styles.navItem}>
          <NavLink
            to="/admin/productmgmt"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            Products
          </NavLink>
        </li>
        <li className={styles.navItem}>
          <NavLink
            to="/admin/querymgmt"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            Queries
          </NavLink>
        </li>
        <li className={styles.navItem}>
          <NavLink
            to="/admin/reviewmgmt"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            Reviews
          </NavLink>
        </li>
        <li className={styles.navItem}>
          <NavLink
            to="/admin/ordermgmt"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            Orders
          </NavLink>
        </li>
        <li className={styles.navItem}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;