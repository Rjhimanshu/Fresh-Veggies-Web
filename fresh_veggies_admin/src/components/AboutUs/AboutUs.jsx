import React from 'react';
import styles from './AboutUs.module.css';

const AboutUs = () => {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Our Story</h1>
        <p className={styles.heroSubtitle}>Bringing farm-fresh produce to your table since 2022</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Who We Are</h2>
          <p className={styles.sectionText}>
            Fresh Veggies is a family-owned business dedicated to providing the freshest, 
            highest-quality fruits and vegetables directly from local farms to your home. 
            We believe in sustainable farming and supporting our local agricultural community.
          </p>
        </section>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Our Mission</h3>
            <p className={styles.cardText}>
              To make fresh, nutritious produce accessible to everyone while supporting 
              local farmers and reducing our environmental impact.
            </p>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Our Values</h3>
            <p className={styles.cardText}>
              Quality, sustainability, and community. We source ethically and deliver 
              with care to ensure you get the best nature has to offer.
            </p>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Meet the Team</h2>
          <div className={styles.teamGrid}>
            <div className={styles.teamMember}>
              <div className={styles.memberImage}></div>
              <h3 className={styles.memberName}>Himanshu Ranjan</h3>
              <p className={styles.memberRole}>Founder & CEO</p>
            </div>
         
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;