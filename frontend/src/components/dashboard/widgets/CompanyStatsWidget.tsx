import React from 'react';
import { EmployeeStatistics } from '../../../services/employee.service';
import Card from '../../common/Card/Card';
import './CompanyStatsWidget.css';

interface CompanyStatsWidgetProps {
  stats: EmployeeStatistics | null;
  isLoading: boolean;
}

const CompanyStatsWidget: React.FC<CompanyStatsWidgetProps> = ({ stats, isLoading }) => {
  return (
    <Card title="Company Overview">
      {isLoading ? (
        <p>Loading company statistics...</p>
      ) : stats ? (
        <div className="company-stats-widget__grid">
          <div className="company-stats-widget__item">
            <span className="company-stats-widget__value">{stats.totalEmployees}</span>
            <span className="company-stats-widget__label">Total Employees</span>
          </div>
          <div className="company-stats-widget__item">
            <span className="company-stats-widget__value">{stats.totalDepartments}</span>
            <span className="company-stats-widget__label">Departments</span>
          </div>
          <div className="company-stats-widget__item">
            <span className="company-stats-widget__value">{stats.newThisMonth}</span>
            <span className="company-stats-widget__label">New Hires (Month)</span>
          </div>
          <div className="company-stats-widget__item">
            <span className="company-stats-widget__value">{stats.averageTenure.toFixed(1)} yrs</span>
            <span className="company-stats-widget__label">Average Tenure</span>
          </div>
        </div>
      ) : (
        <p>Could not load company statistics.</p>
      )}
    </Card>
  );
};

export default CompanyStatsWidget;
