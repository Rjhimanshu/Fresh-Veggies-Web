import React from "react";
import styles from "./AdminHome.module.css";

function AdminHome() {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.heroSection}>
        <img
          src="https://res.cloudinary.com/dj5sf6jb3/image/upload/v1740743257/Img/homeimg.jpg" // Replace with your image URL
          alt="Fresh Fruits and Vegetables"
          className={styles.heroImage}
        />
        <div className={styles.quoteOverlay}>
          <h2 className={styles.quoteText}>
            "Fresh from the Farm, Straight to Your Table"
          </h2>
        </div>
      </div>

    </div>
  );
}

export default AdminHome;