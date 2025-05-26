import React, { useEffect } from "react";
import styles from "./Alert.module.css"; 

const Alert = ({ message, type, onClose }) => {
  useEffect(() => {
    // Automatically close the alert after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer); // Cleanup timer
  }, [onClose]);

  return (
    <div className={`${styles.alert} ${styles[type]}`}>
      <span className={styles.message}>{message}</span>
      <button className={styles.closeButton} onClick={onClose}>
        &times;
      </button>
    </div>
  );
};

export default Alert;