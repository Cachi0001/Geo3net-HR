import React, { useState } from 'react'
import { DashboardLayoutProps } from '../../../types/design-system'
import { Sidebar } from '../Sidebar/Sidebar'
import { Header } from '../Header/Header'
import styles from './DashboardLayout.module.css'

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    userRole = 'employee',
    userName = 'John Doe',
    userEmail = 'john.doe@go3net.com.ng'
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className={styles.layout}>
            <div className={`${styles.sidebar} ${sidebarOpen ? styles.mobileOpen : ''}`}>
                <Sidebar
                    userRole={userRole}
                    onCloseMobile={() => setSidebarOpen(false)}
                />
            </div>

            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <Header
                        userName={userName}
                        userEmail={userEmail}
                        userRole={userRole}
                        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                    />
                </div>

                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    )
}