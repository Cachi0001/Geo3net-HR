import React from 'react';
import styles from './AnalyticsPage.module.css';

const AnalyticsPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Analytics</h1>
      <p className={styles.subtitle}>Organization-wide metrics and reports. Coming soon.</p>
      <div className={styles.grid}>
        <div className={styles.card}>KPI Card</div>
        <div className={styles.card}>Trend Card</div>
        <div className={styles.card}>Distribution Card</div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
