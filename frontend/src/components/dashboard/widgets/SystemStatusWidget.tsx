import React from 'react';
import Card from '../../common/Card/Card';
import './SystemStatusWidget.css';

interface SystemStatusWidgetProps {
  // In the future, this would take system status data
  isLoading: boolean;
}

const SystemStatusWidget: React.FC<SystemStatusWidgetProps> = ({ isLoading }) => {
  return (
    <Card header={<h3>System Status</h3>}>
      {isLoading ? (
        <p>Loading system status...</p>
      ) : (
        <div className="system-status-widget__placeholder">
          <p className="system-status-widget__text">
            System health indicators will be displayed here.
          </p>
          <span className="system-status-widget__status">
            (Feature coming soon)
          </span>
        </div>
      )}
    </Card>
  );
};

export default SystemStatusWidget;
