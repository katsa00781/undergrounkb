import React, { ReactNode } from 'react';
import { Calendar, CalendarDays, ClipboardList, Dumbbell } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface WorkoutSectionHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

const navItems = [
  { to: '/workout-planner', label: 'Tervező', icon: CalendarDays },
  { to: '/workout-planner/template-generator', label: 'Sablongenerátor', icon: CalendarDays },
  { to: '/workout-planner/periodized-generator', label: 'Ciklusgenerátor', icon: CalendarDays },
  { to: '/workout-planner/pwron-generator', label: 'Pwron generátor', icon: CalendarDays },
  { to: '/calendar', label: 'Naptár', icon: Calendar },
  { to: '/my-workouts', label: 'Edzéseim', icon: Dumbbell },
  { to: '/log', label: 'Napló', icon: ClipboardList },
];

const WorkoutSectionHeader: React.FC<WorkoutSectionHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
            Edzések
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex min-w-max gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default WorkoutSectionHeader;