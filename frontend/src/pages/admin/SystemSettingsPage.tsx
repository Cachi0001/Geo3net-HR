import React from 'react';
import styles from './SystemSettingsPage.module.css';

const SystemSettingsPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>System Settings</h1>
      <p className={styles.subtitle}>Configure platform-level settings. Coming soon.</p>
      <ul className={styles.list}>
        <li>Organization</li>
        <li>Security</li>
        <li>Notifications</li>
      </ul>
    </div>
  );
};

export default SystemSettingsPage;
