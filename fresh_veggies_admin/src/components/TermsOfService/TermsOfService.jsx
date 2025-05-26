import React from 'react';
import styles from './TermsOfService.module.css';

const TermsOfService = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.lastUpdated}>Effective Date: {new Date().toLocaleDateString()}</p>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
          <p className={styles.sectionText}>
            By accessing or using our services, you agree to be bound by these Terms. 
            If you disagree with any part, you may not access the service.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Ordering and Payments</h2>
          <p className={styles.sectionText}>
            All orders are subject to product availability. Prices are subject to change without notice. 
            We reserve the right to refuse or cancel any order.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Delivery Policy</h2>
          <p className={styles.sectionText}>
            Delivery times are estimates only. We are not responsible for delays beyond our control. 
            Risk of loss passes to you upon delivery.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Returns and Refunds</h2>
          <p className={styles.sectionText}>
            Fresh produce may only be returned if damaged or spoiled upon delivery. 
            Refund requests must be made within 24 hours of delivery.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Limitation of Liability</h2>
          <p className={styles.sectionText}>
            Fresh Veggies shall not be liable for any indirect, incidental, or consequential damages 
            resulting from the use or inability to use our services.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;