import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase_Config";
import { doc, onSnapshot } from "firebase/firestore";
import styles from "./Navbar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEdit,
  faMapMarkerAlt,
  faHistory,
  faSignOutAlt,
  faShoppingCart,
  faShop,
  faComment,
  faUsers,
  faLeaf,
  faHeadset,
  faBars,
  faTimes,
  faBasketShopping,
} from "@fortawesome/free-solid-svg-icons";

function Navbar() {
  const { currentUser, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.uid) {
      setCartItemCount(0);
      return;
    }

    const cartDocRef = doc(db, "carts", currentUser.uid);
    const unsubscribe = onSnapshot(
      cartDocRef,
      (docSnap) => {
        // Document exists and has items array
        if (docSnap.exists() && Array.isArray(docSnap.data()?.items)) {
          setCartItemCount(docSnap.data().items.length);
        } else {
          // Document doesn't exist or has no items
          setCartItemCount(0);
        }
      },
      (error) => {
        console.error("Error listening to cart:", error);
        setCartItemCount(0);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const toggleMobileDropdown = () => {
    setIsMobileDropdownOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (loading) {
    return <nav className={styles.navbar}>Loading...</nav>;
  }

  const role = currentUser?.role;

  return (
    <nav className={`${styles.navbar} ${role ? styles[role] : ""}`}>
      <div className={styles.navContainer}>
        {/* Logo */}
        <Link to="/" className={styles.logo} onClick={closeMobileMenu}>
          FreshVeggies
        </Link>

        {/* Mobile Menu Icon */}
        <button className={styles.mobileMenuIcon} onClick={toggleMobileMenu}>
          <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
        </button>

        {/* Desktop Navigation */}
        <div className={`${styles.navLinks} ${isMobileMenuOpen ? styles.active : ""}`}>
          {currentUser ? (
            <>
              {(role === "customer" || role === "retailer") && (
                <>
                  <Link to="/shop" className={styles.link} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faShop} /> Shop
                  </Link>
                </>
              )}
              {(role === "retailer" || role === "wholesaler") && (
                <>
                  <Link to="/inventory" className={styles.link} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faLeaf} /> Inventory
                  </Link>
                  <Link to="/myproducts" className={styles.link} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faBasketShopping} /> My Products
                  </Link>
                  <Link to="/orders" className={styles.link} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faHistory} /> Orders 
                  </Link>
                </>
              )}

              {(role === "customer" || role === "retailer") && (
                <>
                  <Link to="/reviews" className={styles.link} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faComment} /> Reviews
                  </Link>
                  <Link to="/help" className={styles.link} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faHeadset} /> Help
                  </Link>
                  <Link to="/cart" className={styles.cartButton} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faShoppingCart} />
                    <span>Cart</span>
                    {cartItemCount > 0 && (
                      <span className={styles.cartBadge}>
                        {cartItemCount > 9 ? '9+' : cartItemCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              {(role === "wholesaler") && (
                <>
                  <Link to="/help" className={styles.link} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faHeadset} /> Help
                  </Link>
                  <Link to="/reviews" className={styles.link} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faComment} /> Reviews
                  </Link>
                </>
              )}

              {/* Profile Dropdown for Desktop */}
              <div className={styles.profileDropdown} ref={dropdownRef}>
                <button className={styles.profileButton} onClick={toggleDropdown}>
                  <FontAwesomeIcon icon={faUser} /> Account
                </button>
                {isDropdownOpen && (
                  <div className={styles.dropdownContent}>
                    <Link to="/profile" className={styles.dropdownLink} onClick={closeMobileMenu}>
                      <FontAwesomeIcon icon={faEdit} /> Edit Profile
                    </Link>
                    <Link to="/saved-addresses" className={styles.dropdownLink} onClick={closeMobileMenu}>
                      <FontAwesomeIcon icon={faMapMarkerAlt} /> Saved Addresses
                    </Link>
                    {(role === "customer" || role === "retailer") && (
                      <Link to="/order-history" className={styles.dropdownLink} onClick={closeMobileMenu}>
                        <FontAwesomeIcon icon={faHistory} /> Order History
                      </Link>
                    )}
                    <button onClick={handleLogout} className={styles.dropdownLink}>
                      <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className={styles.link} onClick={closeMobileMenu}>
              <FontAwesomeIcon icon={faUsers} /> Login/Signup
            </Link>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.active : ""}`}>
          {currentUser ? (
            <>
              {(role === "customer" || role === "retailer") && (
                <>
                  <Link to="/shop" className={styles.mobileNavLink} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faShop} /> Shop
                  </Link>
                </>
              )}

              {(role === "retailer" || role === "wholesaler") && (
                <>
                  <Link to="/inventory" className={styles.mobileNavLink} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faLeaf} /> Inventory
                  </Link>
                  <Link to="/myproducts" className={styles.mobileNavLink} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faBasketShopping} /> My Products
                  </Link>
                  <Link to="/orders" className={styles.mobileNavLink} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faHistory} /> Orders
                  </Link>
                </>
              )}

              {(role === "customer" || role === "retailer") && (
                <> 
                  <Link to="/reviews" className={styles.mobileNavLink} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faComment} /> Reviews
                  </Link>
                  <Link to="/help" className={styles.mobileNavLink} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faHeadset} /> Help
                  </Link>
                  <Link to="/cart" className={styles.mobileNavLink} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faShoppingCart} />
                    <span>Cart</span>
                    {cartItemCount > 0 && (
                      <span className={styles.cartBadge}>
                        {cartItemCount > 9 ? '9+' : cartItemCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              {(role === "wholesaler") && (
                <>
                  <Link to="/help" className={styles.mobileNavLink} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faHeadset} /> Help
                  </Link>
                  <Link to="/reviews" className={styles.mobileNavLink} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faComment} /> Reviews
                  </Link>
                </>
              )}

              {/* Mobile Account Dropdown */}
              <button className={styles.mobileDropdownButton} onClick={toggleMobileDropdown}>
                <FontAwesomeIcon icon={faUser} /> Account
              </button>
              {isMobileDropdownOpen && (
                <div className={styles.mobileDropdownContent}>
                  <Link to="/profile" className={styles.mobileDropdownLink} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faEdit} /> View Profile
                  </Link>
                  <Link to="/saved-addresses" className={styles.mobileDropdownLink} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> Saved Addresses
                  </Link>
                  {(role === "customer" || role === "retailer") && (
                    <Link to="/order-history" className={styles.mobileDropdownLink} onClick={closeMobileMenu}>
                      <FontAwesomeIcon icon={faHistory} /> Order History
                    </Link>
                  )}
                  <button onClick={handleLogout} className={styles.logoutButton}>
                    <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link to="/login" className={styles.link} onClick={closeMobileMenu}>
              <FontAwesomeIcon icon={faUsers} /> Login/Signup
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;