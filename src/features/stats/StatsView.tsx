import React from 'react';
import { Stats } from '@features/stats';

interface StatsViewProps {
  currentDate: Date;
}

const StatsView: React.FC<StatsViewProps> = ({ currentDate }) => {
  return <Stats currentDate={currentDate} />;
};

export default StatsView;
