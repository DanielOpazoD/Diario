import React from 'react';
import Stats from '../../components/Stats';

interface StatsViewProps {
  currentDate: Date;
}

const StatsView: React.FC<StatsViewProps> = ({ currentDate }) => {
  return <Stats currentDate={currentDate} />;
};

export default StatsView;
