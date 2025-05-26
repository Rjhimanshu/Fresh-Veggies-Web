import React from 'react';
import styles from './PrivacyPolicy.module.css';

const PrivacyPolicy = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
          <p className={styles.sectionText}>
            We collect personal information you provide when you create an account, place an order, 
            or contact us. This may include your name, email address, phone number, and payment information.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. How We Use Your Information</h2>
          <p className={styles.sectionText}>
            Your information is used to process orders, improve our services, and communicate with you. 
            We do not sell or share your personal information with third parties for marketing purposes.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Data Security</h2>
          <p className={styles.sectionText}>
            We implement industry-standard security measures to protect your information. 
            However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Your Rights</h2>
          <p className={styles.sectionText}>
            You may request access to, correction of, or deletion of your personal data. 
            Contact us at privacy@freshveggies.com for any privacy-related inquiries.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;