import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../hooks/useDataContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { Coffee, Droplets, FlaskConical, TrendingUp, Users, Award, PackageCheck, Package, PlusCircle, BookText } from 'lucide-react';

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
  subtitle?: string;
}> = ({ icon, title, value, bgColor, iconColor, subtitle }) => (
  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100">
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-4 rounded-xl ${bgColor} shadow-md`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        <TrendingUp className="h-5 w-5 text-green-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-4xl font-bold text-gray-800 mb-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
    <div className={`h-2 ${bgColor}`}></div>
  </div>
);

const Dashboard: React.FC = () => {
  const { data } = useDataContext();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === UserRole.Admin;
  const isFarmer = currentUser?.role === UserRole.Farmer;
  const isProcessor = currentUser?.role === UserRole.Processor;
  const isCupper = currentUser?.role === UserRole.Cupper || currentUser?.role === UserRole.HeadJudge;
  const isRoaster = currentUser?.role === UserRole.Roaster;

  const hasAvailableGreenBeans = React.useMemo(
    () => data.greenBeanLots.some(lot => lot.availabilityStatus === 'Available' && lot.currentWeightKg > 0),
    [data.greenBeanLots]
  );

  const hasRoasterInventory = React.useMemo(
    () => data.roasterInventory.some(item => item.roasterId === currentUser?.id && item.remainingWeightKg > 0.01),
    [data.roasterInventory, currentUser?.id]
  );

  const handleRoasterQuickAction = (action: 'claim' | 'logRoast' | 'viewLog') => {
    switch (action) {
      case 'claim':
        if (!hasAvailableGreenBeans) {
          alert('No green bean stock is available to claim right now.');
          return;
        }
        navigate('/roaster', { state: { quickAction: 'claim' } });
        break;
      case 'logRoast':
        if (!hasRoasterInventory) {
          alert('You do not have inventory yet. Claim a lot first.');
          return;
        }
        navigate('/roaster', { state: { quickAction: 'logRoast' } });
        break;
      case 'viewLog':
        navigate('/roaster', { state: { quickAction: 'viewLog' } });
        break;
      default:
        break;
    }
  };

  // Calculate stats based on role
  let activeLots = 0;
  let processingBatches = 0;
  let completedBatches = 0;
  let cuppingSessions = 0;
  let totalUsers = 0;
  let greenBeanLots = 0;

  if (isAdmin) {
    activeLots = data.harvestLots.length;
    processingBatches = data.processingBatches.filter(b => b.status !== 'Completed').length;
    completedBatches = data.processingBatches.filter(b => b.status === 'Completed').length;
    cuppingSessions = data.cuppingSessions.length;
    totalUsers = data.users.length;
    greenBeanLots = data.greenBeanLots.length;
  } else if (isFarmer) {
    const farmerLots = data.harvestLots.filter(lot => lot.farmerName === currentUser?.name);
    activeLots = farmerLots.length;
    const farmerLotIds = farmerLots.map(lot => lot.id);
    processingBatches = data.processingBatches.filter(b =>
      farmerLotIds.includes(b.harvestLotId) && b.status !== 'Completed'
    ).length;
    completedBatches = data.processingBatches.filter(b =>
      farmerLotIds.includes(b.harvestLotId) && b.status === 'Completed'
    ).length;
  } else if (isProcessor) {
    processingBatches = data.processingBatches.filter(b => b.status !== 'Completed').length;
    completedBatches = data.processingBatches.filter(b => b.status === 'Completed').length;
    greenBeanLots = data.greenBeanLots.length;
  } else if (isCupper) {
    cuppingSessions = data.cuppingSessions.length;
    greenBeanLots = data.greenBeanLots.length;
  } else if (isRoaster) {
    greenBeanLots = data.greenBeanLots.filter(lot => lot.availabilityStatus === 'Available').length;
    const roasterInventory = data.roasterInventory.filter(item => item.roasterId === currentUser?.id);
    totalUsers = roasterInventory.length; // Interpreted as roaster inventory count
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl shadow-md p-8 border border-amber-100">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-amber-600 rounded-xl shadow-lg">
            <Coffee className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Welcome to Coffee Lab</h1>
            <p className="text-gray-600 text-lg mt-1">Your central hub for coffee quality and traceability.</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Award className="h-7 w-7 text-amber-600" />
          Overview Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(isAdmin || isFarmer) && (
            <StatCard
              icon={<Coffee className="h-7 w-7" />}
              title="Active Harvest Lots"
              value={activeLots}
              bgColor="bg-green-100"
              iconColor="text-green-700"
              subtitle="Currently tracked"
            />
          )}
          {(isAdmin || isFarmer || isProcessor) && (
            <StatCard
              icon={<Droplets className="h-7 w-7" />}
              title="Batches in Processing"
              value={processingBatches}
              bgColor="bg-blue-100"
              iconColor="text-blue-700"
              subtitle="Active batches"
            />
          )}
          {(isAdmin || isCupper) && (
            <StatCard
              icon={<FlaskConical className="h-7 w-7" />}
              title="Cupping Sessions"
              value={cuppingSessions}
              bgColor="bg-purple-100"
              iconColor="text-purple-700"
              subtitle="Total sessions"
            />
          )}
          {(isAdmin || isFarmer || isProcessor) && (
            <StatCard
              icon={<PackageCheck className="h-7 w-7" />}
              title="Completed Batches"
              value={completedBatches}
              bgColor="bg-amber-100"
              iconColor="text-amber-700"
              subtitle="Ready for next stage"
            />
          )}
          {(isAdmin || isProcessor || isCupper || isRoaster) && (
            <StatCard
              icon={<Coffee className="h-7 w-7" />}
              title={isRoaster ? 'Available Green Beans' : 'Green Bean Lots'}
              value={greenBeanLots}
              bgColor="bg-emerald-100"
              iconColor="text-emerald-700"
              subtitle={isRoaster ? 'Ready to claim' : 'Available inventory'}
            />
          )}
          {isAdmin && (
            <StatCard
              icon={<Users className="h-7 w-7" />}
              title="Total Users"
              value={totalUsers}
              bgColor="bg-indigo-100"
              iconColor="text-indigo-700"
              subtitle="Active members"
            />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        {isRoaster ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[{
              key: 'claim' as const,
              title: 'Quick Claim',
              description: 'Open the claim modal with the next available lot.',
              iconBg: 'bg-green-100 text-green-600',
              icon: <Package className="h-6 w-6" />,
              disabled: !hasAvailableGreenBeans,
            }, {
              key: 'logRoast' as const,
              title: 'Log a Roast',
              description: 'Start a roast entry from your latest inventory.',
              iconBg: 'bg-orange-100 text-orange-600',
              icon: <PlusCircle className="h-6 w-6" />,
              disabled: !hasRoasterInventory,
            }, {
              key: 'viewLog' as const,
              title: 'View Roast Log',
              description: 'Jump to your roasting history and flavor notes.',
              iconBg: 'bg-indigo-100 text-indigo-600',
              icon: <BookText className="h-6 w-6" />,
              disabled: false,
            }].map(action => (
              <button
                key={action.key}
                type="button"
                onClick={() => !action.disabled && handleRoasterQuickAction(action.key)}
                className={`bg-white border border-gray-200 rounded-2xl p-6 text-left shadow-sm transition-all ${
                  action.disabled ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200'
                }`}
                aria-disabled={action.disabled}
              >
                <span className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${action.iconBg}`}>
                  {action.icon}
                </span>
                <h3 className="font-bold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(isAdmin || isFarmer) && (
              <button
                onClick={() => navigate('/farmer-dashboard')}
                className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-amber-400 rounded-xl p-6 text-left transition-all shadow-md hover:shadow-lg"
              >
                <Coffee className="h-8 w-8 text-amber-600 mb-3" />
                <h3 className="font-bold text-gray-800 mb-1">New Harvest</h3>
                <p className="text-sm text-gray-600">Record a new harvest lot</p>
              </button>
            )}
            {(isAdmin || isProcessor) && (
              <button
                onClick={() => navigate('/processor')}
                className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-400 rounded-xl p-6 text-left transition-all shadow-md hover:shadow-lg"
              >
                <Droplets className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-bold text-gray-800 mb-1">Start Processing</h3>
                <p className="text-sm text-gray-600">Begin new processing batch</p>
              </button>
            )}
            {(isAdmin || isCupper) && (
              <button
                onClick={() => navigate('/cupping')}
                className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-400 rounded-xl p-6 text-left transition-all shadow-md hover:shadow-lg"
              >
                <FlaskConical className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-bold text-gray-800 mb-1">New Session</h3>
                <p className="text-sm text-gray-600">Create cupping session</p>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => navigate('/insights')}
                className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-green-400 rounded-xl p-6 text-left transition-all shadow-md hover:shadow-lg"
              >
                <Award className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-bold text-gray-800 mb-1">View Reports</h3>
                <p className="text-sm text-gray-600">Quality insights & analytics</p>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
