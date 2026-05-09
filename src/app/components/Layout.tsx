import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Factory,
  Package,
  DollarSign,
  FileText,
  Users,
  Truck,
  Search,
  Bell,
  ClipboardCheck,
  LogOut,
  ChevronRight
} from "lucide-react";
import apiClient from "../api/client";
import { useAuth } from "../auth/authContext";

const navigation = [
  { name: 'Dashboard', path: '/Manager', icon: LayoutDashboard },
  { name: 'Orders', path: '/Manager/orders', icon: ShoppingCart },
  { name: 'Production', path: '/Manager/production', icon: Factory },
  { name: 'Inventory', path: '/Manager/inventory', icon: Package },
  { name: 'Financial', path: '/Manager/financial', icon: DollarSign },
  { name: 'Purchase Orders', path: '/Manager/purchase-orders', icon: FileText },
  { name: 'Employees', path: '/Manager/employees', icon: Users },
  { name: 'Attendance', path: '/Manager/attendance', icon: ClipboardCheck },
  { name: 'Suppliers', path: '/Manager/suppliers', icon: Truck },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{type: string, label: string, path: string}[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }
    
    try {
      const res = await apiClient.get(`/search?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data);
      setIsSearchOpen(true);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-semibold">Workshop Manager</h1>
          <p className="text-sm text-slate-400 mt-1">IWMS Dashboard</p>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-2xl">
              <div className="relative flex-1" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search orders, customers, materials..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => { if(searchQuery) setIsSearchOpen(true); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {isSearchOpen && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-96 overflow-y-auto z-50">
                    <div className="p-2">
                      <p className="text-xs font-semibold text-gray-500 px-3 pb-2 pt-1 uppercase tracking-wider">Search Results</p>
                      {searchResults.map((result, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                            navigate(result.path);
                          }}
                          className="w-full text-left flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{result.label}</p>
                            <p className="text-xs text-gray-500 capitalize">{result.type}</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {isSearchOpen && searchQuery && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 p-4 text-center z-50">
                    <p className="text-sm text-gray-500">No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  AM
                </div>
                <div>
                  <p className="text-sm font-medium">Admin Manager</p>
                  <p className="text-xs text-gray-500">Workshop Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
