import React from 'react';
import styles from './TermsOfService.module.css';

const TermsOfService = ({ showFull}) => {
  const content = (
    <>
      <h3>Terms of Service</h3>
      {showFull ? (
        <>
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
          
          <h4>1. Account Responsibility</h4>
          <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
          
          <h4>2. Order Policy</h4>
          <p>All orders are subject to product availability. We reserve the right to cancel any order.</p>
          
          <h4>3. Returns & Refunds</h4>
          <p>Fresh produce may be returned within 24 hours if damaged. Refunds processed within 5-7 business days.</p>
        </>
      ) : (
        <>
          <p>You agree to use our services responsibly and legally.</p>
          <p>We may modify or terminate services at any time.</p>
        </>
      )}
    </>
  );

  return showFull ? (
    <div className={styles.fullTerms}>
      {content}
    </div>
  ) : (
    <div className={styles.termsSummary}>
      {content}
    </div>
  );
};

export default TermsOfService;