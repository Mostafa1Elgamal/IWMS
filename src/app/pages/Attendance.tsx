import { useState, useEffect } from "react";
import { UserCheck, UserX, Clock, Calendar, TrendingUp, Search, RefreshCw, LogIn, LogOut } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { getAttendance, managerCheckIn, managerCheckOut, type AttendanceRecord } from "../api/attendanceService";
import { toast } from "sonner";
import { updateEmployeeStatus } from "../api/attendanceService";

export function Attendance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean, employeeId: string, currentStatus: string }>({ isOpen: false, employeeId: '', currentStatus: '' });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const data = await getAttendance();
      setAttendanceData(data);
    } catch (error) {
      console.error("Failed to fetch attendance", error);
      toast.error("Failed to load attendance data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = async (employeeId: string, name: string) => {
    setActionLoading(employeeId);
    try {
      await managerCheckIn(employeeId);
      toast.success(`${name} checked in successfully`);
      fetchAttendance();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Check-in failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (employeeId: string, name: string) => {
    setActionLoading(employeeId);
    try {
      await managerCheckOut(employeeId);
      toast.success(`${name} checked out successfully`);
      fetchAttendance();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Check-out failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAttendance();
    setIsRefreshing(false);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!statusModal.employeeId) return;
    setActionLoading(statusModal.employeeId);
    try {
      await updateEmployeeStatus(statusModal.employeeId, status);
      toast.success(`Status updated successfully`);
      fetchAttendance();
      setStatusModal({ isOpen: false, employeeId: '', currentStatus: '' });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const totalEmployees = attendanceData.length;
  const presentCount = attendanceData.filter(e => e.hasCheckedIn).length;
  const absentCount = attendanceData.filter(e => !e.hasCheckedIn).length;
  const checkedOutCount = attendanceData.filter(e => e.hasCheckedOut).length;

  const filteredAttendance = attendanceData.filter(employee => {
    const matchesSearch = employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Present' && employee.hasCheckedIn) ||
      (statusFilter === 'Absent' && !employee.hasCheckedIn);
    return matchesSearch && matchesStatus;
  });

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Build chart data from live records
  const departmentMap: Record<string, { present: number; total: number }> = {};
  for (const e of attendanceData) {
    const dept = e.department || 'Other';
    if (!departmentMap[dept]) departmentMap[dept] = { present: 0, total: 0 };
    departmentMap[dept].total++;
    if (e.hasCheckedIn) departmentMap[dept].present++;
  }
  const departmentAttendance = Object.entries(departmentMap).map(([department, v]) => ({ department, ...v }));

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading attendance...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-500 mt-1">Track and manage employee attendance in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200" whileHover={{ scale: 1.02 }}>
            <div className="text-right">
              <p className="text-xs text-gray-500 flex items-center justify-end gap-1"><Clock size={14} /> Live Time</p>
              <p className="text-xl font-bold text-blue-600 tabular-nums">{formatTime(currentTime)}</p>
              <p className="text-xs text-gray-600 mt-1">{formatDate(currentTime)}</p>
            </div>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: totalEmployees, icon: UserCheck, color: 'blue', bg: 'bg-blue-100', text: 'text-blue-600' },
          { label: 'Checked In', value: presentCount, sub: `${totalEmployees > 0 ? ((presentCount / totalEmployees) * 100).toFixed(0) : 0}% of staff`, icon: UserCheck, color: 'green', bg: 'bg-green-100', text: 'text-green-600' },
          { label: 'Absent', value: absentCount, sub: 'Not checked in', icon: UserX, color: 'red', bg: 'bg-red-100', text: 'text-red-600' },
          { label: 'Checked Out', value: checkedOutCount, sub: 'Completed day', icon: Clock, color: 'purple', bg: 'bg-purple-100', text: 'text-purple-600' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  {stat.sub && <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>}
                </div>
                <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={stat.text} size={24} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Department Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Department-wise Attendance (Live)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={departmentAttendance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="department" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" fill="#10b981" name="Present" />
            <Bar dataKey="total" fill="#e5e7eb" name="Total" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option>All</option>
            <option>Present</option>
            <option>Absent</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Today's Attendance</h2>
            <p className="text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
                Live — {filteredAttendance.length} employees
              </span>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {filteredAttendance.map((employee, index) => (
                  <motion.tr
                    key={employee.employeeId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.04 }}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                          {employee.employeeName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{employee.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{employee.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.hasCheckedIn
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {employee.hasCheckedIn ? (employee.hasCheckedOut ? 'Completed' : 'Present') : 'Absent'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 tabular-nums">
                      {employee.checkIn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 tabular-nums">
                      {employee.checkOut}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 tabular-nums">
                      {employee.totalHours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {!employee.hasCheckedIn ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => handleCheckIn(employee.employeeId, employee.employeeName)}
                            disabled={actionLoading === employee.employeeId}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                          >
                            <LogIn size={13} />
                            {actionLoading === employee.employeeId ? '...' : 'Check In'}
                          </motion.button>
                        ) : !employee.hasCheckedOut ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => handleCheckOut(employee.employeeId, employee.employeeName)}
                            disabled={actionLoading === employee.employeeId}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 disabled:opacity-60 transition-colors"
                          >
                            <LogOut size={13} />
                            {actionLoading === employee.employeeId ? '...' : 'Check Out'}
                          </motion.button>
                        ) : (
                          <span className="px-3 py-1.5 text-xs text-gray-400 bg-gray-100 rounded-lg">Done</span>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setStatusModal({ isOpen: true, employeeId: employee.employeeId, currentStatus: employee.status })}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Status
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Status Modal */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Change Status</h3>
              <button onClick={() => setStatusModal({ isOpen: false, employeeId: '', currentStatus: '' })} className="text-gray-500 hover:bg-gray-100 p-1 rounded-md">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-3">
              {['Present', 'Absent', 'Sick Leave', 'On Leave'].map(status => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    statusModal.currentStatus === status ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
