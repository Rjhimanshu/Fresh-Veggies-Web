import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import styles from "./Footer.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faFacebook, faTwitter, faInstagram } from "@fortawesome/free-brands-svg-icons";

function Footer() {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  return (
    <footer className={`${styles.footer} ${role ? styles[role] : ""}`}>
      <div className={styles.footerContent}>
        {/* Common Footer Sections */}
        <div className={styles.footerSection}>
          <h3>About Us</h3>
          <p>
            FreshVeggies is your one-stop shop for fresh and organic vegetables.
            We connect farmers, retailers, and customers to ensure the best
            quality produce.
          </p>
        </div>
        <div className={styles.footerSection}>
          <h3>Contact Us</h3>
          <ul>
            <li>
              <FontAwesomeIcon icon={faMapMarkerAlt} /> Patna, India
            </li>
            <li>
              <FontAwesomeIcon icon={faPhone} /> +91 98765 43210
            </li>
            <li>
              <FontAwesomeIcon icon={faEnvelope} /> support@freshveggies.com
            </li>
          </ul>
        </div>

        {/* Role-Specific Footer Sections */}
        {role === "customer" && (
          <div className={styles.footerSection}>
            <h3>Customer Links</h3>
            <ul>
              <li>
                <Link to="/shop">Shop</Link>
              </li>
              <li>
                <Link to="/help">Help</Link>
              </li>
              <li>
                <Link to="/cart">Cart</Link>
              </li>
            </ul>
          </div>
        )}

        {role === "retailer" && (
          <div className={styles.footerSection}>
            <h3>Retailer Links</h3>
            <ul>
              <li>
                <Link to="/inventory">Inventory</Link>
              </li>
              <li>
                <Link to="/placed-orders">Customer Orders</Link>
              </li>
              <li>
                <Link to="/myproducts">My Products</Link>
              </li>
              <li>
                <Link to="/help">Help</Link>
              </li>

              <li>
                <Link to="/cart">Cart</Link>
              </li>
            </ul>
          </div>
        )}

        {role === "wholesaler" && (
          <div className={styles.footerSection}>
            <h3>Wholesaler Links</h3>
            <ul>
            <li>
                <Link to="/inventory">Inventory</Link>
              </li>
              <li>
                <Link to="/myproducts">My Products</Link>
              </li>
              <li>
                <Link to="/placed-orders">Retailer Orders</Link>
              </li>
              
              <li>
                <Link to="/help">Help</Link>
              </li>

            </ul>
          </div>
        )}

        {role === "delivery" && (
          <div className={styles.footerSection}>
            <h3>Delivery Links</h3>
            <ul>
              <li>
                <Link to="/assignments">Assignments</Link>
              </li>
              <li>
                <Link to="/delivery-history">Delivery History</Link>
              </li>
            </ul>
          </div>
        )}

        {/* Common Footer Section for Social Media */}
        <div className={styles.footerSection}>
          <h3>Follow Us</h3>
          <div className={styles.socialIcons}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faFacebook} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faTwitter} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
          </div>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} FreshVeggies. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;