import React, { useState, useRef, useEffect } from 'react';
import { useDataContext } from '../hooks/useDataContext';
import { User, UserRole } from '../types';
import { PlusCircle, Edit, Trash2, X, ChevronDown, Check } from 'lucide-react';

// Custom Dropdown Component
const CustomRoleDropdown: React.FC<{
  value: UserRole;
  onChange: (value: UserRole) => void;
  options: UserRole[];
}> = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border-2 border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-gray-400 flex items-center justify-between gap-2"
      >
        <span className="font-medium text-gray-900">{value}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto w-full">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors flex items-center justify-between text-sm ${
                  value === option ? 'bg-indigo-50' : ''
                }`}
              >
                <span className="font-medium text-gray-900">{option}</span>
                {value === option && (
                  <Check className="h-4 w-4 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const UserManagement: React.FC = () => {
    const { data, setData } = useDataContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState<UserRole>(UserRole.Farmer);

    const openModalForNew = () => {
        setEditingUser(null);
        setUserName('');
        setUserRole(UserRole.Farmer);
        setIsModalOpen(true);
    };

    const openModalForEdit = (user: User) => {
        console.log('Opening edit modal for user:', user);
        setEditingUser(user);
        setUserName(user.name);
        setUserRole(user.role);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleDelete = (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            setData(prev => ({
                ...prev,
                users: prev.users.filter(u => u.id !== userId),
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting form. Editing user?', editingUser);
        console.log('New values:', { userName, userRole });

        if (editingUser) {
            // Edit existing user
            console.log('Updating user with ID:', editingUser.id);
            setData(prev => ({
                ...prev,
                users: prev.users.map(u => u.id === editingUser.id ? { ...u, name: userName, role: userRole } : u),
            }));
        } else {
            // Add new user
            const newId = `user-${data.users.length + 1}-${userName.toLowerCase().replace(/\s/g, '')}`;
            const newUser: User = {
                id: newId,
                name: userName,
                role: userRole,
            };
            console.log('Creating new user:', newUser);
            setData(prev => ({
                ...prev,
                users: [newUser, ...prev.users],
            }));
        }
        closeModal();
    };

    return (
        <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600 mt-2">Add, edit, or remove user accounts.</p>
                    </div>
                    <button
                        onClick={openModalForNew}
                        className="inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Add New User
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">User ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.users.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        <button onClick={() => openModalForEdit(user)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50" title={`Edit ${user.name}`}><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50" title={`Delete ${user.name}`}><Trash2 className="h-4 w-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white rounded-xl p-8 shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">{editingUser ? 'Edit User' : 'Add New User'}</h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-800 transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="userName" className="block text-sm font-semibold text-gray-700 mb-2">User Name</label>
                                    <input
                                        type="text"
                                        id="userName"
                                        value={userName}
                                        onChange={e => setUserName(e.target.value)}
                                        required
                                        className="block w-full border-2 border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="userRole" className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                                    <CustomRoleDropdown
                                        value={userRole}
                                        onChange={setUserRole}
                                        options={Object.values(UserRole)}
                                    />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end space-x-3">
                                <button type="button" onClick={closeModal} className="bg-white py-2.5 px-5 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                                <button type="submit" className="inline-flex justify-center py-2.5 px-5 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">{editingUser ? 'Save Changes' : 'Create User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
