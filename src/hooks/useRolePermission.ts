import { useState, useEffect } from 'react';
import { getCurrentUserRole } from '../lib/users';

/**
 * Hook a felhasználó szerepkör alapú jogosultságainak ellenőrzésére
 * @returns Objektum, amely tartalmazza a felhasználó jogosultságait és a szerepkörét
 */
export function useRolePermission() {
  const [role, setRole] = useState<'admin' | 'user' | 'anonymous'>('anonymous');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkUserRole() {
      try {
        const userRole = await getCurrentUserRole();
        setRole(userRole);
      } catch (error) {
        console.error('Error checking user role:', error);
        setRole('user'); // Alapértelmezetten user szerepkört adunk
      } finally {
        setLoading(false);
      }
    }
    
    checkUserRole();
  }, []);
  
  const isAdmin = role === 'admin';
  const isUser = role === 'admin' || role === 'user'; // admin is láthatja a user oldalakat
  
  // Különböző oldalakhoz való hozzáférési jogosultságok
  const permissions = {
    // Mindenki által elérhető oldalak
    canAccessDashboard: isUser,
    canAccessProfile: isUser,
    canAccessWorkoutLog: isUser,
    canAccessProgressTracking: isUser,
    canAccessAppointmentBooking: isUser,
    
    // Csak admin által elérhető oldalak
    canAccessWorkoutPlanner: isAdmin,
    canAccessExerciseLibrary: isAdmin,
    canAccessFMSAssessment: isAdmin,
    canAccessUserManagement: isAdmin,
    canAccessAppointmentManager: isAdmin
  };
  
  return {
    role,
    isAdmin,
    isUser,
    loading,
    permissions
  };
}
