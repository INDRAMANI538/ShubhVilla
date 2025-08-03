import React, { useEffect, useState } from 'react';
import { Users, Home, CreditCard, AlertTriangle } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase'; // adjust path as needed

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  change?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        {change && (
          <p className={`text-sm mt-2 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {change} from last month
          </p>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const DashboardStats: React.FC = () => {
  const [totalFlats, setTotalFlats] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);

  useEffect(() => {
    const unsubOwners = onSnapshot(collection(db, 'owners'), (snapshot) => {
      setTotalFlats(snapshot.size);
    });

    const unsubUsers = onSnapshot(query(collection(db, 'users'), where('role', '==', 'user')), (snapshot) => {
      setActiveMembers(snapshot.size);
    });

    const unsubPaid = onSnapshot(
      query(collection(db, 'maintenanceRecords'), where('status', '==', 'paid')),
      (snapshot) => {
        const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
        setTotalCollected(total);
      }
    );

    const unsubPending = onSnapshot(
      query(collection(db, 'maintenanceRecords'), where('status', '!=', 'paid')),
      (snapshot) => {
        setPendingPayments(snapshot.size);
      }
    );

    return () => {
      unsubOwners();
      unsubUsers();
      unsubPaid();
      unsubPending();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Flats"
        value={String(totalFlats)}
        icon={<Home className="h-6 w-6 text-blue-600" />}
        color="bg-blue-100"
        change="+2 new registrations"
      />
      <StatCard
        title="Active Members"
        value={String(activeMembers)}
        icon={<Users className="h-6 w-6 text-green-600" />}
        color="bg-green-100"
        change="+5 this month"
      />
      <StatCard
        title="Maintenance Collected"
        value={`₹${totalCollected.toLocaleString('en-IN')}`}
        icon={<CreditCard className="h-6 w-6 text-purple-600" />}
        color="bg-purple-100"
        change="+12% from last month"
      />
      <StatCard
        title="Pending Payments"
        value={String(pendingPayments)}
        icon={<AlertTriangle className="h-6 w-6 text-orange-600" />}
        color="bg-orange-100"
        change="-3 from last week"
      />
    </div>
  );
};

export default DashboardStats;
