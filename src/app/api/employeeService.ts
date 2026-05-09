import apiClient from "./client";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  attendanceRate: string;
  performanceScore: number;
  tasksCompleted: number;
  shift: string;
}

export const getEmployees = async (): Promise<Employee[]> => {
  const response = await apiClient.get("/auth/users"); // Assuming we add a get all users route
  return response.data.map((u: any) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department || 'Production',
    status: u.status || 'Active',
    attendanceRate: u.attendanceRate || 'N/A',
    performanceScore: u.performanceScore || 0,
    tasksCompleted: 0,
    shift: 'Day',
  }));
};

export const createEmployee = async (employeeData: any) => {
  const response = await apiClient.post("/auth/register", employeeData);
  return response.data;
};
