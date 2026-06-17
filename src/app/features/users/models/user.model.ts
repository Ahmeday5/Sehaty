import { UserRole } from '../../../core/models/auth.model';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  picture: string | null;
  nationalID: string;
  roles: UserRole[];
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  nationalID: string;
  role: UserRole;
  picture?: File;
}
