import React, { useState } from 'react';
import { Search, Filter, FileText, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { VerificationRequest } from '../../types';

const VerificationSystem: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState('all');

  const verificationRequests: VerificationRequest[] = [
    {
      id: '1',
      type: 'tenant',
      requesterId: '1',
      requesterName: 'Neha Singh',
      flatNumber: 'A-102',
      documents: ['aadhar.pdf', 'lease_agreement.pdf', 'police_verification.pdf'],
      status: 'pending',
      submittedDate: new Date('2024-12-01'),
    },
    {
      id: '2',
      type: 'owner',
      requesterId: '2',
      requesterName: 'Amit Kumar',
      flatNumber: 'C-310',
      documents: ['ownership_deed.pdf', 'pan_card.pdf', 'aadhar.pdf'],
      status: 'approved',
      submittedDate: new Date('2024-11-25'),
      reviewedDate: new Date('2024-11-28'),
      reviewedBy: 'Admin',
    },
    {
      id: '3',
      type: 'document',
      requesterId: '3',
      requesterName: 'Vikram Gupta',
      flatNumber: 'B-205',
      documents: ['noc_certificate.pdf'],
      status: 'rejected',
      submittedDate: new Date('2024-11-20'),
      reviewedDate: new Date('2024-11-22'),
      reviewedBy: 'Admin',
      comments: 'Document quality is poor. Please resubmit clear documents.'
    }
  ];

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1';
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'rejected':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tenant':
        return 'bg-blue-100 text-blue-800';
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'document':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Verification System</h2>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {verificationRequests.map((request) => (
          <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(request.type)}`}>
                    {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                  </span>
                  <span className={getStatusBadge(request.status)}>
                    {getStatusIcon(request.status)}
                    <span>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{request.requesterName}</h3>
                <p className="text-sm text-gray-600">Flat {request.flatNumber}</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Documents Submitted:</p>
                <div className="space-y-1">
                  {request.documents.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>{doc}</span>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-500">
                <p>Submitted: {request.submittedDate.toLocaleDateString()}</p>
                {request.reviewedDate && (
                  <p>Reviewed: {request.reviewedDate.toLocaleDateString()}</p>
                )}
              </div>

              {request.comments && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-700">{request.comments}</p>
                </div>
              )}
            </div>

            {request.status === 'pending' && (
              <div className="flex space-x-2">
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors">
                  Approve
                </button>
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors">
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerificationSystem;