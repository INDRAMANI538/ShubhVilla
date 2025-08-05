import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  where,
  getDocs,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../config/firebase';

interface PaymentConfirmation {
  id: string;
  userId: string;
  email: string;
  billId: string;
  amount: number;
  month: string;
  year: number;
  flatNumber: string;
  remarks: string;
  submittedAt: Date;
  status?: string;
}

const VerificationSystem: React.FC = () => {
  const [confirmations, setConfirmations] = useState<PaymentConfirmation[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userFlat, setUserFlat] = useState<string | null>(null);

  useEffect(() => {
    // Detect user login, role, and flat number
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.data();
        if (data) {
          setIsAdmin(data.role === 'admin');
          setUserFlat(data.flatNumber); // store flatNumber
        }
      } else {
        setIsAdmin(false);
        setUserFlat(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userFlat && !isAdmin) return; // wait until we have user's flat or admin status

    const q = query(
      collection(db, 'paymentConfirmations'),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allData: PaymentConfirmation[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          submittedAt: d.submittedAt?.toDate?.() || new Date(),
        } as PaymentConfirmation;
      });

      // Filter: show only current user's data (by flatNumber), unless admin
      const filteredData = isAdmin
        ? allData
        : allData.filter((d) => d.flatNumber === userFlat);

      setConfirmations(filteredData);
    });

    return () => unsubscribe();
  }, [userFlat, isAdmin]);

  const approveConfirmation = async (confirmationId: string) => {
    try {
      await updateDoc(doc(db, 'paymentConfirmations', confirmationId), {
        status: 'approved',
      });
      alert('✅ Payment marked as approved!');
    } catch (error) {
      console.error('❌ Error approving:', error);
      alert('Failed to approve. See console for details.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-semibold mb-4">Submitted Payments</h2>
      {confirmations.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <div className="space-y-4">
          {confirmations.map((c) => (
            <div key={c.id} className="p-4 border rounded-md shadow bg-white">
              <p><strong>Flat:</strong> {c.flatNumber}</p>
              <p><strong>Amount:</strong> ₹{c.amount}</p>
              <p><strong>Month/Year:</strong> {c.month} / {c.year}</p>
              <p><strong>Remarks:</strong> {c.remarks}</p>
              <p>
                <strong>Status:</strong>{' '}
                {c.status === 'approved' ? (
                  <span className="text-green-600 font-semibold">Approved ✅</span>
                ) : (
                  'Pending'
                )}
              </p>
              <p><strong>Submitted:</strong> {c.submittedAt.toLocaleString()}</p>

              {/* ✅ Approve Button — only shown for admins */}
              {isAdmin && c.status !== 'approved' && (
                <button
                  onClick={() => {
                    if (confirm('Approve this payment confirmation?')) {
                      approveConfirmation(c.id);
                    }
                  }}
                  className="mt-2 px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                >
                  Approve
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VerificationSystem;
