import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronDown, LogOut, Coffee, Bell } from 'lucide-react';
import { UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  currentUserRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const Header: React.FC<HeaderProps> = ({ currentUserRole, onRoleChange }) => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<string, string> = {
      'Farmer': 'bg-green-100 text-green-700 border-green-200',
      'Processor': 'bg-blue-100 text-blue-700 border-blue-200',
      'Roaster': 'bg-orange-100 text-orange-700 border-orange-200',
      'Head Judge': 'bg-purple-100 text-purple-700 border-purple-200',
      'Cupper': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Admin': 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getAvatarStyle = (role: UserRole) => {
    const styles: Record<string, string> = {
      'Farmer': 'bg-green-500',
      'Processor': 'bg-blue-500',
      'Roaster': 'bg-orange-500',
      'Head Judge': 'bg-purple-500',
      'Cupper': 'bg-indigo-500',
      'Admin': 'bg-red-500',
    };
    return styles[role] || 'bg-amber-500';
  };

  const avatarStyle = getAvatarStyle(currentUserRole);

  return (
    <header className="h-20 bg-white border-b-2 border-gray-100 shadow-sm flex items-center justify-between px-4 pl-16 lg:pl-6 lg:px-8 flex-shrink-0">
      {/* Left Section - User Info */}
      <div className="flex items-center space-x-2 lg:space-x-4">
        <div className="relative">
          <div className={`flex items-center justify-center ${avatarStyle} w-12 h-12 lg:w-14 lg:h-14 rounded-2xl shadow-lg`}>
            <User className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm lg:text-base font-bold text-gray-800">{currentUser?.name || 'User'}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-2 lg:px-3 py-1 rounded-full border ${getRoleBadgeColor(currentUserRole)}`}>
              {currentUserRole}
            </span>
          </div>
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center space-x-2 lg:space-x-3">
        {/* Notification Button */}
        <button className="relative p-2 lg:p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-3 lg:px-5 py-2 lg:py-2.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl transition-all border-2 border-gray-200 hover:border-red-200 shadow-sm"
        >
          <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
          <span className="text-xs lg:text-sm font-semibold hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
