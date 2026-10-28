import { isSupabaseConfigured, supabase } from './supabase';
import { UserRole, UserStatus } from '../types/auth';

export interface EmployeeAccountAccess {
  userId: string;
  employeeId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

const mapAccount = (row: any): EmployeeAccountAccess => ({
  userId: String(row.user_id),
  employeeId: String(row.employee_id),
  email: row.email,
  role: row.role,
  status: row.status,
});

export const employeeAccessService = {
  async getAccounts(): Promise<EmployeeAccountAccess[]> {
    if (!isSupabaseConfigured()) throw new Error('Workspace access management is unavailable.');
    const { data, error } = await supabase
      .from('users')
      .select('user_id,employee_id,email,role,status');
    if (error) throw new Error('Unable to load employee sign-in access. Please try again.');
    return (data || []).map(mapAccount);
  },

  async makeAdmin(employeeId: string): Promise<EmployeeAccountAccess[]> {
    if (!isSupabaseConfigured()) throw new Error('Workspace access management is unavailable.');
    if (!employeeId.trim()) throw new Error('Select an employee to promote.');
    // The database checks the signed-in administrator. Never update roles
    // directly or send a caller role supplied by the browser.
    const { data, error } = await supabase.rpc('promote_employee_to_admin', {
      p_employee_id: employeeId,
    });
    if (error) {
      if (error.code === 'PGRST202') {
        throw new Error('Admin access management has not been enabled for this workspace. Contact your administrator.');
      }
      throw new Error(error.message || 'Unable to grant admin access. Please try again.');
    }
    if (!Array.isArray(data) || data.length === 0 || data.some((row) =>
      String(row.employee_id) !== employeeId || row.role !== 'ADMIN' || row.status !== 'ACTIVE')) {
      throw new Error('Admin access could not be confirmed. Refresh the employee list before trying again.');
    }
    return data.map(mapAccount);
  },
};
