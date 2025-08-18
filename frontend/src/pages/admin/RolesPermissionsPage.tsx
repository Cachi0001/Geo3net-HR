import React from 'react';
import styles from './RolesPermissionsPage.module.css';

const RolesPermissionsPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Roles & Permissions</h1>
      <p className={styles.subtitle}>Manage roles, permissions, and assignments. Coming soon.</p>
      <div className={styles.card}>Basic role management UI will go here.</div>
    </div>
  );
};

export default RolesPermissionsPage;
