import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendValue,
}) => {
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : '';
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass-card flex items-center space-x-4 p-6 animate-fade-in"
    >
      <div className="flex-shrink-0 text-primary/80 text-3xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-secondary truncate">{title}</p>
        <p className="text-xl font-bold text-primary mt-1">{value}</p>
        {trend && trendValue && (
          <p className={`flex items-center text-sm mt-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4 mr-1" /> {trendValue}
          </p>
        )}
      </div>
    </motion.div>
  );
};
