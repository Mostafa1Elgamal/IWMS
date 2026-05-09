import apiClient from "./client";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  status: 'Present' | 'Absent' | 'Late' | 'On Leave';
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkIn: string;
  checkOut: string;
  totalHours: string;
  date: string;
}

export const getAttendance = async (): Promise<AttendanceRecord[]> => {
  const response = await apiClient.get("/attendance/today");
  return response.data.map((record: any) => ({
    id: record.recordId || record.employeeId,
    employeeId: record.employeeId,
    employeeName: record.employeeName || 'Unknown',
    role: record.role || 'N/A',
    department: record.department || record.role || 'N/A',
    status: record.status || 'Absent',
    hasCheckedIn: record.hasCheckedIn || false,
    hasCheckedOut: record.hasCheckedOut || false,
    checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-',
    checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-',
    totalHours: record.hoursWorked ? `${record.hoursWorked}h` : '-',
    date: record.date || new Date().toISOString().split('T')[0],
  }));
};

export const managerCheckIn = async (employeeId: string) => {
  const response = await apiClient.post(`/attendance/manager/checkin/${employeeId}`);
  return response.data;
};

export const managerCheckOut = async (employeeId: string) => {
  const response = await apiClient.post(`/attendance/manager/checkout/${employeeId}`);
  return response.data;
};

export const markAttendance = async (attendanceData: { userId: string; status: string; date: string }) => {
  const response = await apiClient.post("/attendance", attendanceData);
  return response.data;
};

export const updateEmployeeStatus = async (employeeId: string, status: string) => {
  const response = await apiClient.patch(`/attendance/manager/status/${employeeId}`, { status });
  return response.data;
};
