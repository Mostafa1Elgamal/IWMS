import { X, Calendar, Clock, TrendingUp, CheckCircle, XCircle, Download, Award, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";

interface AttendanceDetailsModalProps {
  employee: {
    id: number;
    name: string;
    role: string;
    department: string;
    avatar: string;
  };
  onClose: () => void;
}

const attendanceHistory = [
  { date: 'Apr 24, 2026', status: 'Present', checkIn: '08:45 AM', checkOut: '05:30 PM', hours: '8h 45m' },
  { date: 'Apr 25, 2026', status: 'Present', checkIn: '08:30 AM', checkOut: '05:45 PM', hours: '9h 15m' },
  { date: 'Apr 26, 2026', status: 'Present', checkIn: '08:50 AM', checkOut: '05:20 PM', hours: '8h 30m' },
  { date: 'Apr 27, 2026', status: 'Present', checkIn: '09:15 AM', checkOut: '05:35 PM', hours: '8h 20m' },
  { date: 'Apr 28, 2026', status: 'Present', checkIn: '08:40 AM', checkOut: '05:50 PM', hours: '9h 10m' },
  { date: 'Apr 29, 2026', status: 'Present', checkIn: '08:35 AM', checkOut: '05:40 PM', hours: '9h 05m' },
  { date: 'Apr 30, 2026', status: 'Present', checkIn: '08:55 AM', checkOut: '05:25 PM', hours: '8h 30m' },
  { date: 'May 01, 2026', status: 'Present', checkIn: '08:45 AM', checkOut: '-', hours: '3h 15m (ongoing)' },
];

const weeklyStats = [
  { week: 'Week 1', hours: 42 },
  { week: 'Week 2', hours: 44 },
  { week: 'Week 3', hours: 40 },
  { week: 'Week 4', hours: 45 },
];

export function AttendanceDetailsModal({ employee, onClose }: AttendanceDetailsModalProps) {
  const totalDays = attendanceHistory.length;
  const presentDays = attendanceHistory.filter(d => d.status === 'Present').length;
  const attendanceRate = ((presentDays / totalDays) * 100).toFixed(1);
  const avgHoursPerDay = '8.7';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
        >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg backdrop-blur-sm border-2 border-white border-opacity-30"
              >
                {employee.avatar}
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <p className="text-blue-100 mt-1 flex items-center gap-2">
                  {employee.role} • {employee.department}
                  <span className="px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">ID: {employee.id}</span>
                </p>
              </motion.div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={24} />
            </motion.button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shadow-sm"
                >
                  <CheckCircle className="text-green-600" size={24} />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-green-700 tabular-nums">{attendanceRate}%</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shadow-sm"
                >
                  <Calendar className="text-blue-600" size={24} />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-600">Days Present</p>
                  <p className="text-2xl font-bold text-blue-700 tabular-nums">{presentDays}/{totalDays}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
              className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shadow-sm"
                >
                  <Clock className="text-purple-600" size={24} />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-600">Avg Hours/Day</p>
                  <p className="text-2xl font-bold text-purple-700 tabular-nums">{avgHoursPerDay}h</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
              className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center shadow-sm"
                >
                  <TrendingUp className="text-orange-600" size={24} />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-orange-700 tabular-nums">45h</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Weekly Hours Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
            className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-sm p-6 border border-blue-100 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={20} />
                Weekly Working Hours
              </h3>
              <span className="text-sm text-gray-500">Target: 40h/week</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="hours" fill="#3b82f6" name="Hours Worked" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Attendance History Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="text-blue-600" size={20} />
                    Attendance History
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Last 8 days of attendance records</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All →
                </motion.button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceHistory.map((record, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.05 }}
                      whileHover={{ backgroundColor: "#f9fafb", scale: 1.01 }}
                      className="transition-all"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.status === 'Present'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : record.status === 'Absent'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : record.status === 'Late'
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                          <span className="flex items-center gap-1">
                            {record.status === 'Present' && <CheckCircle size={12} />}
                            {record.status === 'Absent' && <XCircle size={12} />}
                            {record.status}
                          </span>
                        </motion.span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 tabular-nums">
                        {record.checkIn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 tabular-nums">
                        {record.checkOut}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 tabular-nums">
                        {record.hours}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Award className="text-yellow-500" size={18} />
              <span>Top performer this month</span>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
              >
                Close
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium flex items-center gap-2 shadow-lg"
              >
                <Download size={18} />
                Export Report
              </motion.button>
            </div>
          </div>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
