import { LayoutDashboard, Package, AlertTriangle, Scissors, LogOut } from 'lucide-react';
import { cn } from '../../components/ui/utils';
import { useAuth } from '../../auth/authContext';

interface SidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory List', icon: Package },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'cutoffs', label: 'Cut-Off Materials', icon: Scissors },
];

export function Sidebar({ currentScreen, onNavigate }: SidebarProps) {
  const { logout } = useAuth();
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-semibold">IWMS</h1>
        <p className="text-sm text-gray-400 mt-1">Inventory Manager</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">IM</span>
          </div>
          <div>
            <p className="text-sm font-medium">Inventory Manager</p>
            <p className="text-xs text-gray-400">manager@iwms.com</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full mt-3 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
