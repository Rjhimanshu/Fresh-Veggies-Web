import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <h3 className={styles.logo}>Fresh Veggies</h3>
          <p className={styles.tagline}>Farm to Table, Fresh from the Earth</p>
        </div>
        <div className={styles.rightSection}>
          <div className={styles.socialIcons}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <i className={`fab fa-facebook ${styles.icon}`}></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <i className={`fab fa-twitter ${styles.icon}`}></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className={`fab fa-instagram ${styles.icon}`}></i>
            </a>
          </div>
          <div className={styles.contactInfo}>
            <p><i className={`fas fa-envelope ${styles.contactIcon}`}></i> contact@freshveggies.com</p>
            <p><i className={`fas fa-phone ${styles.contactIcon}`}></i> +1 (555) 123-4567</p>
          </div>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <div className={styles.copyright}>
          &copy; {new Date().getFullYear()} Fresh Veggies. All rights reserved.
        </div>
        <div className={styles.links}>
          <a href="/admin/privacy">Privacy Policy</a>
          <a href="/admin/terms">Terms of Service</a>
          <a href="/admin/about">About Us</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;