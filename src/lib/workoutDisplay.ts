import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';

export const formatWorkoutDate = (date: string | Date) => {
  const value = typeof date === 'string' ? parseISO(date) : date;
  return format(value, 'yyyy. MMMM d.', { locale: hu });
};

export const formatWorkoutDuration = (duration?: number | null) => `${duration ?? 0} perc`;