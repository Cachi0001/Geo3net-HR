import { apiService } from './api.service';

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  position: string;
  department: string;
  createdAt: string;
}

export interface EmployeeStatistics {
  totalEmployees: number;
  totalDepartments: number;
  newThisMonth: number;
  averageTenure: number; // in years
}

export type CreateEmployeeData = Omit<Employee, 'id' | 'createdAt'>;
export type UpdateEmployeeData = Partial<CreateEmployeeData>;

class EmployeeService {
  public async getEmployees(limit: number = 25, offset: number = 0, search: string = ''): Promise<{ employees: Employee[], total: number }> {
    try {
      const params = { limit, offset, search, sortBy: 'fullName', sortOrder: 'asc' };
      const response = await apiService.get('/employees', { params });
      return response.data; // Assuming API returns { employees: [], total: 0 }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      throw error;
    }
  }

  public async getEmployeeById(id: string): Promise<Employee> {
    try {
      const response = await apiService.get(`/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch employee ${id}:`, error);
      throw error;
    }
  }

  public async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    try {
      const response = await apiService.post('/employees', data);
      return response.data.employee;
    } catch (error) {
      console.error('Failed to create employee:', error);
      throw error;
    }
  }

  public async updateEmployee(id: string, data: UpdateEmployeeData): Promise<Employee> {
    try {
      const response = await apiService.put(`/employees/${id}`, data);
      return response.data.employee;
    } catch (error) {
      console.error(`Failed to update employee ${id}:`, error);
      throw error;
    }
  }

  public async deleteEmployee(id: string): Promise<void> {
    try {
      await apiService.delete(`/employees/${id}`);
    } catch (error) {
      console.error(`Failed to delete employee ${id}:`, error);
      throw error;
    }
  }

  public async getEmployeeStatistics(): Promise<EmployeeStatistics> {
    try {
      const response = await apiService.get('/employees/statistics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch employee statistics:', error);
      throw error;
    }
  }
}

export const employeeService = new EmployeeService();
