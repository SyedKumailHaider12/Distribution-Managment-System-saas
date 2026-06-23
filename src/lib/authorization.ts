import { getSession } from './auth';
import { redirect } from 'next/navigation';

/**
 * Checks if the current user has permission to access the requested module.
 * If the user is unauthenticated, they are redirected to /login.
 * If the user lacks permission, they are redirected to /dashboard (or an error page).
 *
 * @param moduleId The ID of the module (e.g. 'inventory', 'sales', 'reports')
 */
export async function requirePermission(moduleId: string) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Admin always has access to everything
  if (session.role === 'admin' || session.permissions?.includes('*')) {
    return session;
  }

  // Check module specific permission
  const hasAccess = session.permissions?.includes(moduleId);
  
  if (!hasAccess) {
    redirect('/dashboard?error=unauthorized');
  }

  return session;
}

/**
 * Checks if the user has permission without redirecting.
 * Returns true if authorized, false if not.
 */
export async function checkPermission(moduleId: string): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  if (session.role === 'admin' || session.permissions?.includes('*')) return true;
  return session.permissions?.includes(moduleId) || false;
}

/**
 * For Server Actions where we don't want to redirect, but throw an Error.
 */
export async function requirePermissionForAction(moduleId: string) {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized: Please log in again.');
  }

  if (session.role === 'admin' || session.permissions?.includes('*')) {
    return session;
  }

  const hasAccess = session.permissions?.includes(moduleId);
  if (!hasAccess) {
    throw new Error('Unauthorized: You do not have permission for this action.');
  }

  return session;
}
