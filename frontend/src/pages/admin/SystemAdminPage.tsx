import React from 'react';
import styles from './SystemAdminPage.module.css';

const SystemAdminPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>System Admin</h1>
      <p className={styles.subtitle}>Superadmin tools and system overview. Coming soon.</p>
      <div className={styles.section}>
        <ul>
          <li>Initialization status</li>
          <li>Role distribution</li>
          <li>System readiness</li>
        </ul>
      </div>
    </div>
  );
};

export default SystemAdminPage;
