import { useEffect, useState } from 'react';
import { formatLocalYMD } from '@shared/utils/dateUtils';

export const useDailyRange = (currentDate: Date) => {
  const [targetDate, setTargetDate] = useState<string>(formatLocalYMD(currentDate));

  useEffect(() => {
    setTargetDate(formatLocalYMD(currentDate));
  }, [currentDate]);

  return { targetDate, setTargetDate };
};
