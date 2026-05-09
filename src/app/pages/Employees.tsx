import { useState, useEffect } from "react";
import { Users, Award, Clock, TrendingUp, Plus, X, Eye, EyeOff } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import * as Progress from "@radix-ui/react-progress";
import { getEmployees, createEmployee, type Employee } from "../api/employeeService";
import { toast } from "sonner";

const ROLES = ["manager", "accountant", "sales", "technician", "inventory"];

export function Employees() {
  const [employeeData, setEmployeeData] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    userId: "",
    email: "",
    password: "",
    role: "technician",
    hourlyRate: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await getEmployees();
      setEmployeeData(data);
    } catch (error) {
      console.error("Failed to fetch employees", error);
      toast.error("Failed to load employee data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim values to avoid whitespace issues
    const trimmedForm = {
      name: form.name.trim(),
      userId: form.userId.trim(),
      email: form.email.trim(),
      password: form.password, // Don't trim password
      role: form.role,
      hourlyRate: form.hourlyRate,
    };

    if (!trimmedForm.name || !trimmedForm.userId || !trimmedForm.password || !trimmedForm.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      await createEmployee({
        name: trimmedForm.name,
        userId: trimmedForm.userId,
        email: trimmedForm.email,
        password: trimmedForm.password,
        role: trimmedForm.role,
        hourlyRate: parseFloat(trimmedForm.hourlyRate) || 0,
      });
      
      toast.success(`Employee "${trimmedForm.name}" added successfully`);
      setShowModal(false);
      setForm({ name: "", userId: "", email: "", password: "", role: "technician", hourlyRate: "" });
      fetchEmployees();
    } catch (error: any) {
      // Extract the most useful error message from the server
      const serverMsg = error?.response?.data?.message;
      const status = error?.response?.status;
      
      if (serverMsg) {
        toast.error(serverMsg);
      } else if (status === 409) {
        toast.error(`Employee ID "${form.userId}" is already taken. Please use a different ID.`);
      } else if (status === 400) {
        toast.error("Please check all required fields are filled correctly.");
      } else {
        toast.error("Failed to add employee. Please try again.");
      }
      console.error("Add employee error:", status, error?.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { label: 'Total Employees', value: employeeData.length.toString(), icon: Users, color: 'blue', bg: 'bg-blue-100', text: 'text-blue-600' },
    { label: 'Avg Performance', value: `${employeeData.length > 0 ? Math.round(employeeData.reduce((s, e) => s + e.performanceScore, 0) / employeeData.length) : 0}%`, icon: Award, color: 'green', bg: 'bg-green-100', text: 'text-green-600' },
    { label: 'Roles', value: [...new Set(employeeData.map(e => e.role))].length.toString(), icon: Clock, color: 'purple', bg: 'bg-purple-100', text: 'text-purple-600' },
    { label: 'Active', value: employeeData.filter(e => e.status === 'Active').length.toString(), icon: TrendingUp, color: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-600' },
  ];

  const performanceData = employeeData.map(emp => ({ name: emp.name.split(' ')[0], score: emp.performanceScore }));

  if (isLoading) return <div className="p-8 text-center">Loading employees...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employees & Performance</h1>
        <p className="text-gray-500 mt-1">Manage workforce and track performance metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={stat.text} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Chart */}
      {performanceData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Performance Scores</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#3b82f6" name="Performance Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Employee Directory</h2>
              <p className="text-sm text-gray-500 mt-1">Complete list of all workshop employees</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} /> Add Employee
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employeeData.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{employee.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full capitalize">
                      {employee.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.email || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-32">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">{employee.performanceScore}%</span>
                      </div>
                      <Progress.Root className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <Progress.Indicator
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${employee.performanceScore}%` }}
                        />
                      </Progress.Root>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {employee.status}
                    </span>
                  </td>
                </tr>
              ))}
              {employeeData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No employees found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add New Employee</h3>
                <p className="text-sm text-gray-500 mt-0.5">Create a login account for the new employee</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    name="name" value={form.name} onChange={handleInputChange} required
                    placeholder="e.g. Ahmed Ali"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID <span className="text-red-500">*</span></label>
                  <input
                    name="userId" value={form.userId} onChange={handleInputChange} required
                    placeholder="e.g. EMP-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email" value={form.email} onChange={handleInputChange} type="email"
                  placeholder="employee@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                  <select
                    name="role" value={form.role} onChange={handleInputChange} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white capitalize"
                  >
                    {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                  <input
                    name="hourlyRate" value={form.hourlyRate} onChange={handleInputChange} type="number" min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    name="password" value={form.password} onChange={handleInputChange} required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60">
                  {isSubmitting ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
