    // File: /src/components/payment/PaymentForm.tsx

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

    // ✅ Fetch flat number of current user
    useEffect(() => {
        const fetchUserFlatNumber = async () => {
        if (!currentUser?.email) return;

        const ownersRef = collection(db, 'owners');
        const q = query(ownersRef, where('email', '==', currentUser.email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const ownerData = snapshot.docs[0].data();
            setUserFlatNumber(ownerData.flatNumber);
        }
        };

        fetchUserFlatNumber();
    }, [currentUser]);

    // ✅ Fetch bills by flat number
    useEffect(() => {
        const fetchPendingBills = async () => {
        if (!userFlatNumber) return;

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
        };

        fetchPendingBills();
    }, [userFlatNumber]);

    const handleBillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const billId = e.target.value;
        setSelectedBillId(billId);
        const selected = bills.find((b) => b.id === billId) || null;
        setSelectedBillDetails(selected);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.uid || !selectedBillDetails) return;

        setSubmitting(true);

        try {
        // Add to paymentConfirmations
        await addDoc(collection(db, 'paymentConfirmations'), {
            userId: currentUser.uid,
            email: currentUser.email,
            billId: selectedBillDetails.id,
            amount: selectedBillDetails.amount,
            month: selectedBillDetails.month,
            year: selectedBillDetails.year,
            remarks,
            submittedAt: serverTimestamp(),
            flatNumber: selectedBillDetails.flatNumber,
        });

        // Update bill status
        await updateDoc(doc(db, 'maintenanceRecords', selectedBillDetails.id), {
            status: 'submitted',
            submittedAt: serverTimestamp(),
            submittedRemarks: remarks,
        });

        alert('✅ Payment submitted successfully!');

        // Reset state
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

    return (
        <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto space-y-4"
        >
        <h2 className="text-xl font-semibold text-gray-700">Submit Maintenance Payment</h2>

        {bills.length === 0 ? (
            <p className="text-gray-500">No pending bills found for your flat.</p>
        ) : (
            <>
            {/* Bill Dropdown */}
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

            {/* Auto-filled fields */}
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

            {/* Remarks */}
            <div>
                <label className="text-sm font-medium text-gray-600">Remarks</label>
                <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                required
                />
            </div>

            {/* Submit */}
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
