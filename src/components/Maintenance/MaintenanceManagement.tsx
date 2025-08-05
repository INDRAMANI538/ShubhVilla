import React, { useEffect, useState } from 'react';
import { Search, Plus, Eye, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

interface Owner {
  id: string;
  name: string;
  flatNumber: string;
  uid: string;
}

interface MaintenanceRecord {
  id?: string;
  ownerId: string;
  ownerName: string;
  flatNumber: string;
  amount: number;
  month: string;
  year: number;
  dueDate: Timestamp;
  status: string;
  remarks?: string;
  createdAt: Timestamp;
}

const MaintenanceManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [owners, setOwners] = useState<Owner[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    status: '',
    minAmount: '',
    maxAmount: ''
  });

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    ownerId: '',
    amount: '',
    month: '',
    year: '',
    dueDate: '',
    remarks: ''
  });

  // Fetch owners (for admin form select)
  useEffect(() => {
    if (!isAdmin) return;
    const fetchOwners = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'owners'));
        const ownersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Owner)
        }));
        setOwners(ownersList);
      } catch (error) {
        console.error('Error fetching owners:', error);
      }
    };
    fetchOwners();
  }, [isAdmin]);

  // Fetch records based on user role
  useEffect(() => {
    const fetchRecords = async () => {
      if (!currentUser?.email) return;

      try {
        if (isAdmin) {
          // Admin: get all records
          const snapshot = await getDocs(collection(db, 'maintenanceRecords'));
          const allRecords = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as MaintenanceRecord)
          }));
          setRecords(allRecords);
        } else {
          // Non-admin: get current user's name from users collection
          const userQ = query(collection(db, 'users'), where('email', '==', currentUser.email));
          const userSnap = await getDocs(userQ);
          if (userSnap.empty) {
            setRecords([]);
            return;
          }
          const userName = userSnap.docs[0].data().name;

          // Get owner's record by name
          const ownerQ = query(collection(db, 'owners'), where('name', '==', userName));
          const ownerSnap = await getDocs(ownerQ);
          if (ownerSnap.empty) {
            setRecords([]);
            return;
          }
          const ownerData = ownerSnap.docs[0].data();

          // Get maintenance records for that ownerName or flatNumber (choose one consistent filter)
          const recordsQ = query(
            collection(db, 'maintenanceRecords'),
            where('ownerName', '==', userName)
          );
          const recordsSnap = await getDocs(recordsQ);

          const userRecords = recordsSnap.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as MaintenanceRecord)
          }));

          setRecords(userRecords);
        }
      } catch (error) {
        console.error('Error fetching maintenance records:', error);
        setRecords([]);
      }
    };

    fetchRecords();
  }, [currentUser, isAdmin]);

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        ownerId: editingRecord.ownerId,
        amount: editingRecord.amount.toString(),
        month: editingRecord.month,
        year: editingRecord.year.toString(),
        dueDate: editingRecord.dueDate.toDate().toISOString().split('T')[0],
        remarks: editingRecord.remarks || ''
      });
      setShowForm(true);
    }
  }, [editingRecord]);

  const handleAddOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return; // Only admin can add/edit

    const owner = owners.find(o => o.id === formData.ownerId);
    if (!owner) return;

    const recordData: Omit<MaintenanceRecord, 'id'> = {
      ownerId: owner.id,
      ownerName: owner.name,
      flatNumber: owner.flatNumber,
      amount: Number(formData.amount),
      month: formData.month,
      year: Number(formData.year),
      dueDate: Timestamp.fromDate(new Date(formData.dueDate)),
      status: editingRecord?.status || 'pending',
      remarks: formData.remarks,
      createdAt: editingRecord?.createdAt || Timestamp.now()
    };

    if (editingRecord?.id) {
      await updateDoc(doc(db, 'maintenanceRecords', editingRecord.id), recordData);
      setRecords(prev =>
        prev.map(r => (r.id === editingRecord.id ? { ...recordData, id: editingRecord.id } : r))
      );
    } else {
      const docRef = await addDoc(collection(db, 'maintenanceRecords'), recordData);
      setRecords(prev => [...prev, { id: docRef.id, ...recordData }]);
    }

    setFormData({ ownerId: '', amount: '', month: '', year: '', dueDate: '', remarks: '' });
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return; // Only admin can delete
    if (window.confirm('Are you sure you want to delete this bill?')) {
      await deleteDoc(doc(db, 'maintenanceRecords', id));
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleMarkPaid = async (id: string) => {
    if (!isAdmin) return; // Only admin can mark paid
    await updateDoc(doc(db, 'maintenanceRecords', id), { status: 'paid' });
    setRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'paid' } : r))
    );
  };

  const filteredRecords = records.filter(r => {
    if (!isAdmin) return true; // Non-admin see only their records (already filtered)

    const searchMatch = `${r.flatNumber} ${r.ownerName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const monthMatch = filters.month ? r.month.toLowerCase() === filters.month.toLowerCase() : true;
    const yearMatch = filters.year ? r.year.toString() === filters.year : true;
    const statusMatch = filters.status ? r.status === filters.status : true;
    const minAmountMatch = filters.minAmount ? r.amount >= Number(filters.minAmount) : true;
    const maxAmountMatch = filters.maxAmount ? r.amount <= Number(filters.maxAmount) : true;
    return searchMatch && monthMatch && yearMatch && statusMatch && minAmountMatch && maxAmountMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Maintenance Management</h2>
        {isAdmin && (
          <button
            onClick={() => {
              setShowForm(prev => !prev);
              setEditingRecord(null);
              setFormData({ ownerId: '', amount: '', month: '', year: '', dueDate: '', remarks: '' });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>{showForm ? 'Cancel' : 'Generate Bill'}</span>
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <form onSubmit={handleAddOrEdit} className="bg-white p-6 rounded-lg border space-y-4">
          <select
            required
            value={formData.ownerId}
            onChange={e => setFormData({ ...formData, ownerId: e.target.value })}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Owner</option>
            {owners.map(owner => (
              <option key={owner.id} value={owner.id}>
                {owner.name} - {owner.flatNumber}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="number" required placeholder="Amount" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="border p-2 rounded" />
            <input type="text" required placeholder="Month" value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} className="border p-2 rounded" />
            <input type="number" required placeholder="Year" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="border p-2 rounded" />
            <input type="date" required value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="border p-2 rounded" />
            <input type="text" placeholder="Remarks" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} className="border p-2 rounded col-span-full" />
          </div>
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            {editingRecord ? 'Update Bill' : 'Submit Bill'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {isAdmin && (
          <input type="text" placeholder="Search by name or flat" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="col-span-2 border p-2 rounded" />
        )}
        <input type="text" placeholder="Month" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} className="border p-2 rounded" />
        <input type="text" placeholder="Year" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} className="border p-2 rounded" />
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="border p-2 rounded">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
        <input type="number" placeholder="Min ₹" value={filters.minAmount} onChange={e => setFilters({ ...filters, minAmount: e.target.value })} className="border p-2 rounded" />
        <input type="number" placeholder="Max ₹" value={filters.maxAmount} onChange={e => setFilters({ ...filters, maxAmount: e.target.value })} className="border p-2 rounded" />
      </div>

      <div className="overflow-x-auto border rounded-lg mt-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-2">Flat</th>
              <th className="px-6 py-2">Owner</th>
              <th className="px-6 py-2">Month</th>
              <th className="px-6 py-2">Amount</th>
              <th className="px-6 py-2">Due</th>
              <th className="px-6 py-2">Status</th>
              <th className="px-6 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {filteredRecords.map(record => (
              <tr key={record.id}>
                <td className="px-6 py-2">{record.flatNumber}</td>
                <td className="px-6 py-2">{record.ownerName}</td>
                <td className="px-6 py-2">{record.month} {record.year}</td>
                <td className="px-6 py-2">₹{record.amount}</td>
                <td className="px-6 py-2">{record.dueDate.toDate().toLocaleDateString()}</td>
                <td className="px-6 py-2 capitalize">{record.status}</td>
                <td className="px-6 py-2 space-x-2">
                  <Eye className="w-4 h-4 inline text-blue-500 cursor-pointer" />
                  {isAdmin && (
                    <>
                      {record.status !== 'paid' && (
                        <button onClick={() => handleMarkPaid(record.id!)} className="text-green-600 text-sm">
                          <CheckCircle className="inline w-4 h-4 mr-1" />
                          Paid
                        </button>
                      )}
                      <button onClick={() => setEditingRecord(record)} className="text-yellow-600 text-sm">
                        <Pencil className="inline w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button onClick={() => handleDelete(record.id!)} className="text-red-600 text-sm">
                        <Trash2 className="inline w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceManagement;
