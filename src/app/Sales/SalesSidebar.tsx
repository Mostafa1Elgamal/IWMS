import { Home, Users, ShoppingCart, ClipboardList, UserPlus, Phone, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../auth/authContext';

interface SalesSidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'orders', label: 'Export Orders', icon: ShoppingCart },
  { id: 'create-order', label: 'Create Order', icon: ClipboardList },
  { id: 'invoices', label: 'Invoice', icon: FileText },
  { id: 'follow-ups', label: 'Follow-ups', icon: Phone },
];

export function SalesSidebar({ activeScreen, onNavigate }: SalesSidebarProps) {
  const { logout } = useAuth();
  return (
    <aside className="w-64 bg-[#1e293b] h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-white text-xl font-semibold">IWMS</h1>
        <p className="text-gray-400 text-sm mt-1">Salesperson Module</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Sales Team</p>
            <p className="text-gray-400 text-xs">Active</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
