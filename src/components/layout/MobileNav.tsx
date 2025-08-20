import { NavLink } from 'react-router-dom';
import { Home, Calendar, BarChart2, ClipboardList, User, Users, Dumbbell } from 'lucide-react';
import { useRolePermission } from '../../hooks/useRolePermission';

const MobileNav = () => {
  // A felhasználó jogosultságainak ellenőrzése
  const { isAdmin } = useRolePermission();

  // Admin felhasználók látják az adminisztrációs menüpontokat is
  if (isAdmin) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:hidden">
        <div className="flex items-center justify-around">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `mobile-tab ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <Home size={20} />
            <span>Kezdőlap</span>
          </NavLink>
          
          <NavLink
            to="/exercises"
            className={({ isActive }) =>
              `mobile-tab ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <Dumbbell size={20} />
            <span>Gyakorlatok</span>
          </NavLink>
          
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `mobile-tab ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <Users size={20} />
            <span>Felhasználók</span>
          </NavLink>
          
          <NavLink
            to="/appointments/manage"
            className={({ isActive }) =>
              `mobile-tab ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <Calendar size={20} />
            <span>Kezelés</span>
          </NavLink>
          
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `mobile-tab ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <User size={20} />
            <span>Profil</span>
          </NavLink>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:hidden">
      <div className="flex items-center justify-around">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `mobile-tab ${
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`
          }
        >
          <Home size={20} />
          <span>Kezdőlap</span>
        </NavLink>

        <NavLink
          to="/my-workouts"
          className={({ isActive }) =>
            `mobile-tab ${
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`
          }
        >
          <ClipboardList size={20} />
          <span>Edzések</span>
        </NavLink>

        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            `mobile-tab ${
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`
          }
        >
          <Calendar size={20} />
          <span>Naptár</span>
        </NavLink>

        <NavLink
          to="/progress"
          className={({ isActive }) =>
            `mobile-tab ${
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`
          }
        >
          <BarChart2 size={20} />
          <span>Fejlődés</span>
        </NavLink>

        <NavLink
          to="/appointments"
          className={({ isActive }) =>
            `mobile-tab ${
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`
          }
        >
          <Calendar size={20} />
          <span>Foglalás</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `mobile-tab ${
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`
          }
        >
          <User size={20} />
          <span>Profil</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileNav;