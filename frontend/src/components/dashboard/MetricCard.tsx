import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import styles from './MetricCard.module.css';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon: LucideIcon;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'info';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  className = '',
  variant = 'primary'
}) => {
  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getIconBackground = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-primary';
      case 'secondary':
        return 'bg-gradient-secondary';
      case 'accent':
        return 'bg-gradient-accent';
      case 'success':
        return 'nav-accent-cyan';
      case 'warning':
        return 'nav-accent-orange';
      case 'info':
        return 'nav-accent-purple';
      default:
        return 'bg-gradient-primary';
    }
  };

  return (
    <Card className={`${styles.metricCard} ${className} border-0`}>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2 truncate">{title}</p>
            <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground mb-1 truncate">{value}</p>
            {change && (
              <p className={`text-xs sm:text-sm font-medium flex items-center gap-1 ${getTrendColor(change.trend)} truncate`}>
                {change.trend === 'up' && '↗'}
                {change.trend === 'down' && '↘'}
                {change.value}
              </p>
            )}
          </div>
          <div className={`h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 ${getIconBackground(variant)} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};