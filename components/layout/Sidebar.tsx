
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon, Coffee } from 'lucide-react';
import { UserRole } from '../../types';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

interface SidebarProps {
  navItems: NavItem[];
  currentUserRole: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ navItems, currentUserRole }) => {
  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUserRole));

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200">
        <Coffee className="h-8 w-8 text-indigo-600" />
        <h1 className="ml-3 text-xl font-bold text-gray-800">Coffee Lab</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-200">
         <p className="text-xs text-gray-500">Version 3.1</p>
      </div>
    </aside>
  );
};

export default Sidebar;
