import React from 'react';
import Card from '../../common/Card/Card';
import './PendingApprovalsWidget.css';

interface PendingApprovalsWidgetProps {
  // In the future, this would take a list of approval items
  isLoading: boolean;
}

const PendingApprovalsWidget: React.FC<PendingApprovalsWidgetProps> = ({ isLoading }) => {
  return (
    <Card title="Pending Approvals">
      {isLoading ? (
        <p>Loading approvals...</p>
      ) : (
        <div className="pending-approvals-widget__placeholder">
          <p className="pending-approvals-widget__text">
            Approval notifications will be shown here.
          </p>
          <span className="pending-approvals-widget__status">
            (Feature coming soon)
          </span>
        </div>
      )}
    </Card>
  );
};

export default PendingApprovalsWidget;
