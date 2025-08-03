import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, XCircle, UserPlus } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  status: 'success' | 'pending' | 'failed';
  typeIcon: React.ReactNode;
}

const getIcon = (status: Activity['status']) => {
  if (status === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
  if (status === 'pending') return <Clock className="h-5 w-5 text-yellow-500" />;
  if (status === 'failed') return <XCircle className="h-5 w-5 text-red-500" />;
  return <UserPlus className="h-5 w-5 text-blue-500" />;
};

const RecentActivities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const ownerQ = query(collection(db, 'owners'), orderBy('joinedAt', 'desc'));
    const regUnsub = onSnapshot(ownerQ, snapshot => {
      const newRegs = snapshot.docChanges()
        .filter(c => c.type === 'added')
        .map(c => ({
          id: c.doc.id,
          title: 'New Owner Registration',
          description: `${c.doc.data().name} (Flat ${c.doc.data().flatNumber}) registered`,
          time: 'just now',
          status: 'success' as const,
          typeIcon: <UserPlus className="h-5 w-5 text-blue-500" />
        }));
      setActivities(prev => [...newRegs, ...prev].slice(0, 10));
    });

    const paymentQ = query(collection(db, 'maintenanceRecords'), orderBy('createdAt', 'desc'));
    const payUnsub = onSnapshot(paymentQ, snapshot => {
      const newPays = snapshot.docChanges()
        .filter(c => c.type === 'added')
        .map(c => {
          const data = c.doc.data();
          return {
            id: c.doc.id,
            title: data.status === 'paid' ? 'Maintenance Paid' : 'Payment Submitted',
            description: `Flat ${data.flatNumber} paid ₹${data.paymentDetails?.amount ?? data.amount}`,
            time: 'just now',
            status: data.status === 'paid' ? 'success' as const : 'pending' as const,
            typeIcon: getIcon(data.status)
          };
        });
      setActivities(prev => [...newPays, ...prev].slice(0, 10));
    });

    return () => {
      regUnsub();
      payUnsub();
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div>{activity.typeIcon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-sm text-gray-500 text-center">No recent activities.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivities;
