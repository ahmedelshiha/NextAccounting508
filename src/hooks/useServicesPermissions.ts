import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export interface ServicesPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canBulkEdit: boolean;
  canExport: boolean;
  canViewAnalytics: boolean;
  canManageFeatured: boolean;
}

export function useServicesPermissions(): ServicesPermissions {
  const { data: session } = useSession();

  return useMemo(() => {
    const role = session?.user?.role;
    const isAdmin = role === 'ADMIN';
    const isStaff = role === 'TEAM_MEMBER' || role === 'TEAM_LEAD' || isAdmin;

    return {
      canView: isStaff,
      canCreate: isAdmin,
      canEdit: isAdmin,
      canDelete: isAdmin,
      canBulkEdit: isAdmin,
      canExport: isStaff,
      canViewAnalytics: isStaff,
      canManageFeatured: isAdmin,
    };
  }, [session?.user?.role]);
}
