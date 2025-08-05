import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

interface Bill {
  id: string;
  amount: number;
  month: string;
  year: number;
  status: string;
  dueDate: Timestamp;
  flatNumber: string;
}

const PaymentForm: React.FC = () => {
  const { currentUser } = useAuth();

  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBillId, setSelectedBillId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedBillDetails, setSelectedBillDetails] = useState<Bill | null>(null);
  const [userFlatNumber, setUserFlatNumber] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch user's flat number
  useEffect(() => {
    const fetchUserFlatNumber = async () => {
      if (!currentUser?.email) return;

      try {
        const ownersRef = collection(db, 'owners');
        const q = query(ownersRef, where('email', '==', currentUser.email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const ownerData = snapshot.docs[0].data();
          setUserFlatNumber(ownerData.flatNumber);
        }
      } catch (error) {
        console.error('❌ Error fetching user flat number:', error);
      }
    };

    fetchUserFlatNumber();
  }, [currentUser]);

  // Fetch pending bills
  useEffect(() => {
    const fetchPendingBills = async () => {
      if (!userFlatNumber) return;

      try {
        const billsRef = collection(db, 'maintenanceRecords');
        const q = query(
          billsRef,
          where('flatNumber', '==', userFlatNumber),
          where('status', '==', 'pending')
        );

        const snapshot = await getDocs(q);

        const fetchedBills: Bill[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            amount: data.amount,
            month: data.month,
            year: data.year,
            status: data.status,
            dueDate: data.dueDate,
            flatNumber: data.flatNumber,
          };
        });

        setBills(fetchedBills);
      } catch (error) {
        console.error('❌ Error fetching bills:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingBills();
  }, [userFlatNumber]);

  const handleBillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const billId = e.target.value;
    setSelectedBillId(billId);

    const selected = bills.find((b) => b.id.toString() === billId.toString()) || null;
    setSelectedBillDetails(selected);

    console.log('✅ Selected Bill:', selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('DEBUG: user', currentUser);
    console.log('DEBUG: selectedBillDetails', selectedBillDetails);

    if (!currentUser?.id || !selectedBillDetails) {
      alert('User or bill not selected properly.');
      return;
    }

    setSubmitting(true);

    try {
      // Add payment confirmation
      await addDoc(collection(db, 'paymentConfirmations'), {
        userId: currentUser.id,
        email: currentUser.email,
        billId: selectedBillDetails.id,
        amount: selectedBillDetails.amount,
        month: selectedBillDetails.month,
        year: selectedBillDetails.year,
        remarks,
        submittedAt: serverTimestamp(),
        flatNumber: selectedBillDetails.flatNumber,
      });

      // Update bill as submitted
      await updateDoc(doc(db, 'maintenanceRecords', selectedBillDetails.id), {
        status: 'submitted',
        submittedAt: serverTimestamp(),
        submittedRemarks: remarks,
      });

      alert('✅ Payment submitted successfully!');

      // Reset form state
      setSelectedBillId('');
      setSelectedBillDetails(null);
      setRemarks('');
      setBills((prev) => prev.filter((b) => b.id !== selectedBillDetails.id));
    } catch (error) {
      console.error('❌ Error submitting payment:', error);
      alert('Failed to submit payment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return <p className="text-center mt-4">🔄 Loading user...</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto space-y-4"
    >
      <h2 className="text-xl font-semibold text-gray-700">Submit Maintenance Payment</h2>

      {loading ? (
        <p className="text-gray-500">Loading pending bills...</p>
      ) : bills.length === 0 ? (
        <p className="text-gray-500">No pending bills found for your flat.</p>
      ) : (
        <>
          {/* Select Bill */}
          <div>
            <label className="text-sm font-medium text-gray-600">Pending Bill</label>
            <select
              value={selectedBillId}
              onChange={handleBillChange}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            >
              <option value="">-- Select Bill --</option>
              {bills.map((bill) => (
                <option key={bill.id} value={bill.id}>
                  ₹{bill.amount} - {bill.month}/{bill.year} (Due: {bill.dueDate.toDate().toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Auto-filled Details */}
          {selectedBillDetails && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-600">Amount</label>
                <input
                  type="text"
                  value={`₹${selectedBillDetails.amount}`}
                  disabled
                  className="w-full mt-1 px-3 py-2 bg-gray-100 border rounded-md"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Month / Year</label>
                <input
                  type="text"
                  value={`${selectedBillDetails.month} / ${selectedBillDetails.year}`}
                  disabled
                  className="w-full mt-1 px-3 py-2 bg-gray-100 border rounded-md"
                />
              </div>
            </>
          )}

          {/* Remarks Input */}
          <div>
            <label className="text-sm font-medium text-gray-600">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedBillDetails}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition"
          >
            {submitting ? 'Submitting...' : 'Submit Payment'}
          </button>
        </>
      )}
    </form>
  );
};

export default PaymentForm;
