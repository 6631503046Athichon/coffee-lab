
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon, Coffee, X, Menu } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUserRole));

  // Close mobile menu when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-indigo-600 rounded-xl shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Menu className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Backdrop overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col
        fixed lg:relative inset-y-0 left-0 z-40
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center flex-1">
            <Coffee className="h-8 w-8 text-indigo-600" />
            <h1 className="ml-3 text-xl font-bold text-gray-800">Coffee Lab</h1>
          </div>
          {/* Close button for mobile - only inside sidebar */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-red-50 rounded-lg transition-colors group"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-500 group-hover:text-red-600 transition-colors" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
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
    </>
  );
};

export default Sidebar;
