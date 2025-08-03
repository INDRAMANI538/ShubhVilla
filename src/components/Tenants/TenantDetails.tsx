import React, { useEffect, useState } from 'react';
import {
  Search, Plus, Edit, Eye, Phone, Mail, Calendar, IndianRupee, Trash
} from 'lucide-react';
import { collection, getDocs, addDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

interface Owner {
  id: string;
  name: string;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  flatNumber: string;
  ownerId: string;
  ownerName: string;
  aadharNumber: string;
  leaseStartDate: Timestamp;
  leaseEndDate: Timestamp;
  rentAmount: number;
  depositAmount: number;
  isVerified: boolean;
}

const TenantDetails: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    flatNumber: '',
    ownerId: '',
    aadharNumber: '',
    leaseStartDate: '',
    leaseEndDate: '',
    rentAmount: '',
    depositAmount: '',
  });

  useEffect(() => {
    const fetchOwnersAndTenants = async () => {
      const ownersSnapshot = await getDocs(collection(db, 'owners'));
      const ownersData = ownersSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setOwners(ownersData);

      const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
      const tenantsData = tenantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Tenant, 'id'>),
      }));
      setTenants(tenantsData);
    };

    fetchOwnersAndTenants();
  }, []);

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();

    const owner = owners.find(o => o.id === formData.ownerId);
    if (!owner) return;

    const newTenant = {
      ...formData,
      leaseStartDate: Timestamp.fromDate(new Date(formData.leaseStartDate)),
      leaseEndDate: Timestamp.fromDate(new Date(formData.leaseEndDate)),
      rentAmount: Number(formData.rentAmount),
      depositAmount: Number(formData.depositAmount),
      isVerified: false,
      ownerName: owner.name,
    };

    const docRef = await addDoc(collection(db, 'tenants'), newTenant);
    setTenants(prev => [...prev, { id: docRef.id, ...newTenant }]);
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      flatNumber: '',
      ownerId: '',
      aadharNumber: '',
      leaseStartDate: '',
      leaseEndDate: '',
      rentAmount: '',
      depositAmount: '',
    });
    setFormVisible(false);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'tenants', id));
    setTenants(prev => prev.filter(t => t.id !== id));
  };

  const filteredTenants = tenants.filter(t =>
    `${t.name} ${t.flatNumber} ${t.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Tenant Details</h2>
        {isAdmin && (
          <button
            onClick={() => setFormVisible(prev => !prev)}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>{formVisible ? 'Cancel' : 'Add Tenant'}</span>
          </button>
        )}
      </div>

      {formVisible && isAdmin && (
        <form onSubmit={handleAddTenant} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border p-4 rounded-lg shadow-sm">
          {Object.entries(formData).map(([key, value]) => {
            if (key === 'ownerId') {
              return (
                <select
                  key={key}
                  name="ownerId"
                  value={value}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerId: e.target.value }))}
                  required
                  className="border p-2 rounded-md"
                >
                  <option value="">Select Owner</option>
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.id}>{owner.name}</option>
                  ))}
                </select>
              );
            }
            return (
              <input
                key={key}
                type={key.includes('Date') ? 'date' : 'text'}
                name={key}
                placeholder={key.replace(/([A-Z])/g, ' $1')}
                value={value}
                onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                required
                className="border p-2 rounded-md"
              />
            );
          })}
          <button type="submit" className="col-span-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
            Submit
          </button>
        </form>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tenants by name, flat number, or email..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTenants.map(tenant => (
          <div key={tenant.id} className="bg-gray-50 rounded-lg p-6 shadow-sm border">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                <p className="text-sm text-gray-600">Flat {tenant.flatNumber}</p>
                <p className="text-xs text-gray-500">Owner: {tenant.ownerName}</p>
              </div>
              <span className={`text-xs font-semibold ${tenant.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {tenant.isVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div className="text-sm text-gray-700 space-y-1 mb-3">
              <p><Mail className="inline h-4 w-4 mr-1" />{tenant.email}</p>
              <p><Phone className="inline h-4 w-4 mr-1" />{tenant.phoneNumber}</p>
              <p><Calendar className="inline h-4 w-4 mr-1" />
                {tenant.leaseStartDate.toDate().toLocaleDateString()} - {tenant.leaseEndDate.toDate().toLocaleDateString()}
              </p>
              <p><IndianRupee className="inline h-4 w-4 mr-1" />Rent: ₹{tenant.rentAmount}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedTenant(tenant)}
                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-3 rounded-md text-sm flex items-center justify-center space-x-1"
              >
                <Eye className="h-4 w-4" /><span>View</span>
              </button>
              {isAdmin && (
                <>
                  <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-2 px-3 rounded-md text-sm flex items-center justify-center space-x-1">
                    <Edit className="h-4 w-4" /><span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(tenant.id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 px-3 rounded-md text-sm flex items-center justify-center space-x-1"
                  >
                    <Trash className="h-4 w-4" /><span>Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-lg space-y-4 relative">
            <h3 className="text-xl font-bold">{selectedTenant.name}'s Details</h3>
            <button
              className="absolute top-2 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setSelectedTenant(null)}
            >✕</button>
            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>Email:</strong> {selectedTenant.email}</p>
              <p><strong>Phone:</strong> {selectedTenant.phoneNumber}</p>
              <p><strong>Flat:</strong> {selectedTenant.flatNumber}</p>
              <p><strong>Owner:</strong> {selectedTenant.ownerName}</p>
              <p><strong>Aadhar:</strong> {selectedTenant.aadharNumber}</p>
              <p><strong>Lease:</strong> {selectedTenant.leaseStartDate.toDate().toLocaleDateString()} to {selectedTenant.leaseEndDate.toDate().toLocaleDateString()}</p>
              <p><strong>Rent:</strong> ₹{selectedTenant.rentAmount}</p>
              <p><strong>Deposit:</strong> ₹{selectedTenant.depositAmount}</p>
              <p><strong>Status:</strong> {selectedTenant.isVerified ? 'Verified' : 'Pending'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDetails;
