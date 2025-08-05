// src/pages/OwnerDetails.tsx

import React, { useEffect, useState } from 'react';
import {
  Plus, Eye, Edit, Trash2, Mail, Phone, Search, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Owner {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  flatNumber: string;
  aadharNumber: string;
  panNumber: string;
  emergencyContact: string;
  joinedDate: Timestamp;
  isActive: boolean;
}

const OwnerDetails: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [owners, setOwners] = useState<Owner[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    flatNumber: '',
    aadharNumber: '',
    panNumber: '',
    emergencyContact: '',
  });

  const [adminEmail, setAdminEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const ADMIN_PASSCODE = '7075169816';

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'owners'));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Owner, 'id'>),
        }));
        setOwners(data);
      } catch (error) {
        console.error('Error fetching owners:', error);
      }
    };
    fetchOwners();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(userList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleUserSelect = (email: string) => {
    const selectedUser = users.find(user => user.email === email);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        phoneNumber: selectedUser.phone || '',
        flatNumber: selectedUser.flatNumber || '',
      }));
    }
  };

  const filteredOwners = owners.filter(owner =>
    `${owner.name} ${owner.email} ${owner.flatNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddOrEditOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    const newOwner = {
      ...formData,
      joinedDate: Timestamp.fromDate(new Date()),
      isActive: true,
    };

    try {
      if (editingOwnerId) {
        const ref = doc(db, 'owners', editingOwnerId);
        await updateDoc(ref, newOwner);
        setOwners(prev =>
          prev.map(o => (o.id === editingOwnerId ? { id: o.id, ...newOwner } : o))
        );
      } else {
        const q = query(collection(db, 'owners'), where('email', '==', formData.email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          alert('❗ Owner with this email already exists.');
          return;
        }

        const docRef = await addDoc(collection(db, 'owners'), newOwner);
        setOwners(prev => [...prev, { id: docRef.id, ...newOwner }]);
        console.log(`🔔 New owner added: ${formData.name} (${formData.email})`); // You can integrate real notifications here
        alert('✅ Owner added successfully!');
      }

      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        flatNumber: '',
        aadharNumber: '',
        panNumber: '',
        emergencyContact: '',
      });
      setEditingOwnerId(null);
      setFormVisible(false);
    } catch (error) {
      console.error('Error saving owner:', error);
    }
  };

  const handleEdit = (owner: Owner) => {
    setFormData({
      name: owner.name,
      email: owner.email,
      phoneNumber: owner.phoneNumber,
      flatNumber: owner.flatNumber,
      aadharNumber: owner.aadharNumber,
      panNumber: owner.panNumber,
      emergencyContact: owner.emergencyContact,
    });
    setEditingOwnerId(owner.id);
    setFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this owner?')) return;
    try {
      await deleteDoc(doc(db, 'owners', id));
      setOwners(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error('Error deleting owner:', error);
    }
  };

  const handlePromoteToAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passcode !== ADMIN_PASSCODE) {
      alert('❌ Incorrect passcode. Access denied.');
      return;
    }

    const matchUser = users.find(u => u.email === adminEmail);
    if (!matchUser) {
      alert('❌ No user found with this email.');
      return;
    }

    try {
      await setDoc(doc(db, 'users', matchUser.id), {
        ...matchUser,
        role: 'admin',
      });
      alert('✅ User promoted to admin!');
      setAdminEmail('');
      setPasscode('');
    } catch (error) {
      console.error('Failed to promote user:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Owner Details</h2>
        {isAdmin && (
          <button
            onClick={() => {
              setFormVisible(prev => !prev);
              setEditingOwnerId(null);
              setFormData({
                name: '',
                email: '',
                phoneNumber: '',
                flatNumber: '',
                aadharNumber: '',
                panNumber: '',
                emergencyContact: '',
              });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>{formVisible ? 'Cancel' : 'Add Owner'}</span>
          </button>
        )}
      </div>

      {isAdmin && (
        <form
          onSubmit={handlePromoteToAdmin}
          className="bg-yellow-50 p-4 rounded-lg shadow-sm border"
        >
          <h3 className="text-lg font-semibold mb-2 flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-yellow-600" />
            <span>Promote User to Admin</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="email"
              placeholder="User Email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="border p-2 rounded"
              required
            />
            <input
              type="password"
              placeholder="Enter Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="border p-2 rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Promote
          </button>
        </form>
      )}

      {formVisible && isAdmin && (
        <form
          onSubmit={handleAddOrEditOwner}
          className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200"
        >
          <select
            onChange={(e) => handleUserSelect(e.target.value)}
            className="border p-2 rounded-md w-full col-span-full"
            defaultValue=""
          >
            <option value="" disabled>Select user to auto-fill</option>
            {users.map((user, index) => (
              <option key={index} value={user.email}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>

          {Object.entries(formData).map(([key, value]) => (
            <input
              key={key}
              type="text"
              name={key}
              placeholder={key.replace(/([A-Z])/g, ' $1')}
              value={value}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, [key]: e.target.value }))
              }
              required={key !== 'aadharNumber' && key !== 'panNumber' && key !== 'emergencyContact'}
              className="border p-2 rounded-md w-full"
            />
          ))}

          <button
            type="submit"
            className="col-span-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {editingOwnerId ? 'Update Owner' : 'Submit Owner'}
          </button>
        </form>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search owners by name, email, flat..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredOwners.length === 0 ? (
        <p className="text-center text-gray-500">No owners found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOwners.map((owner) => (
            <div
              key={owner.id}
              className="bg-white p-5 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{owner.name}</h3>
                  <p className="text-sm text-gray-600">Flat {owner.flatNumber}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`h-3 w-3 rounded-full ${owner.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={`text-xs ${owner.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {owner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-700 mb-3">
                <p className="flex items-center space-x-2"><Mail className="h-4 w-4" /><span>{owner.email}</span></p>
                <p className="flex items-center space-x-2"><Phone className="h-4 w-4" /><span>{owner.phoneNumber}</span></p>
                <p>PAN: {owner.panNumber}</p>
                <p>Aadhar: {owner.aadharNumber}</p>
                <p>Emergency: {owner.emergencyContact}</p>
                <p>Joined: {owner.joinedDate.toDate().toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-2">
                <button className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm px-3 py-1 rounded flex items-center space-x-1">
                  <Eye className="h-4 w-4" /><span>View</span>
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleEdit(owner)}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" /><span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(owner.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 text-sm px-3 py-1 rounded flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" /><span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerDetails;
