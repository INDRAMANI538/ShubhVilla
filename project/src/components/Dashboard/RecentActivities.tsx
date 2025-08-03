import React from 'react';
import { CheckCircle, Clock, XCircle, UserPlus } from 'lucide-react';

interface Activity {
  id: string;
  type: 'payment' | 'verification' | 'registration' | 'maintenance';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'pending' | 'failed';
}

const RecentActivities: React.FC = () => {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'payment',
      title: 'Maintenance Payment Received',
      description: 'Flat A-101 - Mr. Sharma paid ₹5,000',
      time: '2 hours ago',
      status: 'success'
    },
    {
      id: '2',
      type: 'verification',
      title: 'Tenant Verification Pending',
      description: 'Flat B-205 - New tenant documents submitted',
      time: '4 hours ago',
      status: 'pending'
    },
    {
      id: '3',
      type: 'registration',
      title: 'New Owner Registration',
      description: 'Flat C-310 - Mr. Patel registered successfully',
      time: '1 day ago',
      status: 'success'
    },
    {
      id: '4',
      type: 'maintenance',
      title: 'Maintenance Due Alert',
      description: 'Flat D-115 - Payment overdue by 5 days',
      time: '2 days ago',
      status: 'failed'
    }
  ];

  const getIcon = (type: string, status: string) => {
    if (status === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'pending') return <Clock className="h-5 w-5 text-yellow-500" />;
    if (status === 'failed') return <XCircle className="h-5 w-5 text-red-500" />;
    return <UserPlus className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getIcon(activity.type, activity.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentActivities;