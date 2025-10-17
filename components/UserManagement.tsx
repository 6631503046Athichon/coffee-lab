import React, { useState } from 'react';
import { useDataContext } from '../hooks/useDataContext';
import { User, UserRole } from '../types';
import { PlusCircle, Edit, Trash2, X } from 'lucide-react';

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
        if (editingUser) {
            // Edit existing user
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
            setData(prev => ({
                ...prev,
                users: [newUser, ...prev.users],
            }));
        }
        closeModal();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-1">Add, edit, or remove user accounts.</p>
                </div>
                <button
                    onClick={openModalForNew}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Add New User
                </button>
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
                    <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">{editingUser ? 'Edit User' : 'Add New User'}</h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-800">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="userName" className="block text-sm font-medium text-gray-700">User Name</label>
                                    <input
                                        type="text"
                                        id="userName"
                                        value={userName}
                                        onChange={e => setUserName(e.target.value)}
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="userRole" className="block text-sm font-medium text-gray-700">Role</label>
                                    <select
                                        id="userRole"
                                        value={userRole}
                                        onChange={e => setUserRole(e.target.value as UserRole)}
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {Object.values(UserRole).map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end space-x-3">
                                <button type="button" onClick={closeModal} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">{editingUser ? 'Save Changes' : 'Create User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
