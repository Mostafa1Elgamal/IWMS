import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router";
import { useAuth } from "./authContext";
import { signup, getRoleDashboardPath, type UserRole } from "./authService";

const roles: UserRole[] = [
  "Manager",
  "Accounting",
  "Inventory",
  "Sales Person",
  "Technician"
];

export default function Signup() {
  const navigate = useNavigate();
  const { isAuthenticated, role, login } = useAuth();
  
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("Technician");
  const [hourlyRate, setHourlyRate] = useState<number | "">("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated && role) {
    return <Navigate to={getRoleDashboardPath(role)} replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !userId.trim() || !password.trim() || hourlyRate === "") {
      setError("All fields are required.");
      return;
    }

    try {
      setIsLoading(true);
      const session = await signup({
        name,
        userId,
        password,
        role: selectedRole.toLowerCase(), // Backend expects lowercase string for role or we can just send as is depending on backend
        hourlyRate: Number(hourlyRate)
      });
      
      // Auto-login or navigate to login after signup
      // Assuming signup returns a valid session based on authService implementation
      if (session) {
        // Here we could manually call login context to set state, but we'll just redirect to login for a fresh start 
        // since useAuth login might be needed to set full context state, or we can just navigate to login.
        navigate("/login", { replace: true });
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Signup failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold text-gray-900">Sign Up</h1>
        <p className="text-sm text-gray-500 mt-2">
          Create a new account for IWMS
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID *
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="EMP123"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate ($) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value ? Number(e.target.value) : "")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="15.00"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {isLoading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
