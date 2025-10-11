
import React from 'react';
import { useDataContext } from '../hooks/useDataContext';
import { Coffee, Droplets, FlaskConical } from 'lucide-react';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string }> = ({ icon, title, value, color }) => (
  <div className="bg-white p-6 rounded-lg shadow flex items-start">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div className="ml-4">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { data } = useDataContext();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Coffee Lab</h1>
      <p className="text-gray-600 mb-8">Your central hub for coffee quality and traceability.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          icon={<Coffee className="h-6 w-6 text-green-800" />}
          title="Active Harvest Lots"
          value={data.harvestLots.length}
          color="bg-green-100"
        />
        <StatCard 
          icon={<Droplets className="h-6 w-6 text-blue-800" />}
          title="Batches in Processing"
          value={data.processingBatches.filter(b => b.status !== 'Completed').length}
          color="bg-blue-100"
        />
        <StatCard 
          icon={<FlaskConical className="h-6 w-6 text-purple-800" />}
          title="Cupping Sessions"
          value={data.cuppingSessions.length}
          color="bg-purple-100"
        />
      </div>
    </div>
  );
};

export default Dashboard;
