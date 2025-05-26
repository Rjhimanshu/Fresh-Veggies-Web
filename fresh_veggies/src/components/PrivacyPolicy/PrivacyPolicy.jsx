import React from 'react';
import styles from './PrivacyPolicy.module.css';

const PrivacyPolicy = ({ showFull }) => {
  const content = (
    <>
      <h3>Privacy Policy</h3>
      {showFull ? (
        <>
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
          
          <h4>1. Information Collection</h4>
          <p>We collect information you provide when you create an account, place orders, or contact us. This includes:</p>
          <ul>
            <li>Name and contact details</li>
            <li>Payment information</li>
            <li>Purchase history</li>
          </ul>
          
          <h4>2. Data Usage</h4>
          <p>Your information is used to:</p>
          <ul>
            <li>Process orders and deliveries</li>
            <li>Improve our services</li>
            <li>Communicate with you</li>
          </ul>
        </>
      ) : (
        <>
          <p>We collect personal information to provide and improve our services.</p>
          <p>Your data is protected and never sold to third parties.</p>
        </>
      )}
    </>
  );

  return showFull ? (
    <div className={styles.fullPolicy}>
      {content}
    </div>
  ) : (
    <div className={styles.policySummary}>
      {content}
    </div>
  );
};

export default PrivacyPolicy;