
import React, { useState } from 'react';
import { User, ChevronDown } from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderProps {
  currentUserRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const Header: React.FC<HeaderProps> = ({ currentUserRole, onRoleChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roles = Object.values(UserRole).filter(role => role !== UserRole.Consumer);

  const handleSelectRole = (role: UserRole) => {
    onRoleChange(role);
    setDropdownOpen(false);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-4 sm:px-6 lg:px-8 flex-shrink-0">
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          <User className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-800">{currentUserRole}</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
            {roles.map((role) => (
              <a
                key={role}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectRole(role);
                }}
                className={`block px-4 py-2 text-sm ${
                  currentUserRole === role ? 'text-indigo-600 font-semibold' : 'text-gray-700'
                } hover:bg-gray-100`}
              >
                {role}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
