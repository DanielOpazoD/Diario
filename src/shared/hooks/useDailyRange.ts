import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export const useDailyRange = (currentDate: Date) => {
  const [targetDate, setTargetDate] = useState<string>(format(currentDate, 'yyyy-MM-dd'));

  useEffect(() => {
    setTargetDate(format(currentDate, 'yyyy-MM-dd'));
  }, [currentDate]);

  return { targetDate, setTargetDate };
};
