import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  BarChart2, 
  Dumbbell, 
  ClipboardList,
  User,
  Users,
  Activity
} from 'lucide-react';
import { useRolePermission } from '../../hooks/useRolePermission';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const Sidebar = ({ open, onClose, isMobile }: SidebarProps) => {
  // A felhasználó jogosultságainak ellenőrzése
  const { permissions } = useRolePermission();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-20 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out dark:bg-gray-800 md:static md:translate-x-0 ${
        open ? 'translate-x-0' : isMobile ? '-translate-x-full' : 'translate-x-0'
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Menü</h2>
        <button
          onClick={onClose}
          className={`rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 ${!isMobile && 'hidden'}`}
          aria-label="Menü bezárása"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <nav className="mt-5 px-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
          }
          onClick={onClose}
        >
          <Home size={20} />
          <span>Irányítópult</span>
        </NavLink>

        <NavLink
          to="/log"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
          }
          onClick={onClose}
        >
          <ClipboardList size={20} />
          <span>Edzésnapló</span>
        </NavLink>

        {permissions.canAccessWorkoutPlanner && (
          <NavLink
            to="/planner"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            onClick={onClose}
          >
            <Calendar size={20} />
            <span>Edzéstervező</span>
          </NavLink>
        )}

        {permissions.canAccessExerciseLibrary && (
          <NavLink
            to="/exercises"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            onClick={onClose}
          >
            <Dumbbell size={20} />
            <span>Gyakorlattár</span>
          </NavLink>
        )}

        {permissions.canAccessFMSAssessment && (
          <NavLink
            to="/assessment"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            onClick={onClose}
          >
            <Activity size={20} />
            <span>FMS Felmérés</span>
          </NavLink>
        )}

        <NavLink
          to="/progress"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
          }
          onClick={onClose}
        >
          <BarChart2 size={20} />
          <span>Fejlődés Követése</span>
        </NavLink>

        {permissions.canAccessUserManagement && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            onClick={onClose}
          >
            <Users size={20} />
            <span>Felhasználók</span>
          </NavLink>
        )}

        {permissions.canAccessAppointmentManager && (
          <NavLink
            to="/appointments/manage"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            onClick={onClose}
          >
            <Calendar size={20} />
            <span>Időpontok Kezelése</span>
          </NavLink>
        )}

        <NavLink
          to="/appointments"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
          }
          onClick={onClose}
        >
          <Calendar size={20} />
          <span>Időpontfoglalás</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
          }
          onClick={onClose}
        >
          <User size={20} />
          <span>Profil</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
