import { Link } from 'react-router-dom';
import { Camera, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Infinite Arch</span>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            {/* Public Links - Always Visible */}
            <Link to="/galleries" className="text-gray-700 hover:text-amber-600 font-medium">
              Galleries
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-amber-600 font-medium">
              About
            </Link>
            <Link to="/gear" className="text-gray-700 hover:text-amber-600 font-medium">
              My Gear
            </Link>

            {/* Admin Link - Only for logged in users */}
            {user ? (
              <>
                <Link to="/admin" className="text-gray-700 hover:text-amber-600 font-medium flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  Admin
                </Link>
                <div className="flex items-center space-x-2">
                  {user.avatar && (
                    <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                  )}
                  <span className="text-gray-700 text-sm">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
