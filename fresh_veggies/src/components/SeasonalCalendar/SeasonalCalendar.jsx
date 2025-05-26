// components/SeasonalCalendar/SeasonalCalendar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './SeasonalCalendar.module.css';

const SeasonalCalendar = () => {
  // Data for seasonal produce in India (can be moved to Firebase later)
  const seasonalData = [
    {
      month: 'January',
      produce: ['Oranges', 'Carrots', 'Beetroot', 'Spinach', 'Strawberries']
    },
    {
      month: 'February',
      produce: ['Grapefruit', 'Cabbage', 'Cauliflower', 'Peas', 'Radish']
    },
    {
      month: 'March',
      produce: ['Mangoes', 'Cucumber', 'Bottle Gourd', 'Pumpkin', 'Watermelon']
    },
    {
      month: 'April',
      produce: ['Mangoes', 'Muskmelon', 'Bitter Gourd', 'Lady Finger', 'Jackfruit']
    },
    {
      month: 'May',
      produce: ['Mangoes', 'Lychee', 'Tomatoes', 'Brinjal', 'Coconut']
    },
    {
      month: 'June',
      produce: ['Plums', 'Cherries', 'Cucumber', 'Bottle Gourd', 'Pumpkin']
    },
    {
      month: 'July',
      produce: ['Peaches', 'Jamun', 'Brinjal', 'Lady Finger', 'Bitter Gourd']
    },
    {
      month: 'August',
      produce: ['Pears', 'Apples', 'Sweet Corn', 'Cucumber', 'Pumpkin']
    },
    {
      month: 'September',
      produce: ['Pomegranate', 'Guava', 'Bottle Gourd', 'Radish', 'Spinach']
    },
    {
      month: 'October',
      produce: ['Bananas', 'Papaya', 'Carrots', 'Beetroot', 'Cauliflower']
    },
    {
      month: 'November',
      produce: ['Oranges', 'Grapes', 'Peas', 'Cabbage', 'Strawberries']
    },
    {
      month: 'December',
      produce: ['Kiwi', 'Pineapple', 'Carrots', 'Spinach', 'Radish']
    }
  ];

  return (
    <div className={styles.calendarContainer}>
      <h2>Seasonal Produce Calendar for India</h2>
      <p className={styles.subtitle}>Fresh fruits and vegetables available each month</p>
      
      <div className={styles.calendarGrid}>
        {seasonalData.map((monthData) => (
          <div key={monthData.month} className={styles.monthCard}>
            <h3>{monthData.month}</h3>
            <ul className={styles.produceList}>
              {monthData.produce.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <Link to="/" className={styles.backLink}>← Back to Home</Link>
    </div>
  );
};

export default SeasonalCalendar;