// components/admin/AccessPassForm.jsx
'use client';

import { useState } from 'react';

export default function AccessPassForm({ booking, onSend, onUpdate, onCancel, loading }) {
  const [formData, setFormData] = useState({
    accessCode: booking.accessPass?.code || '',
    provider: booking.accessPass?.providedBy || '',
    instructions: booking.accessPass?.instructions || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.accessCode.trim()) {
      alert('Access code is required');
      return;
    }

    if (booking.accessPass?.status === 'sent') {
      onUpdate(formData);
    } else {
      onSend(formData);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-3">
        {booking.accessPass?.status === 'sent' ? 'Update Access Pass' : 'Send Access Pass'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Access Code *
          </label>
          <input
            type="text"
            value={formData.accessCode}
            onChange={(e) => setFormData({...formData, accessCode: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
            placeholder="Enter the access code provided externally"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            This code will be sent to the guest via email and appear in their dashboard.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provider (Optional)
          </label>
          <input
            type="text"
            value={formData.provider}
            onChange={(e) => setFormData({...formData, provider: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
            placeholder="e.g., SmartLock Inc, KeyNest, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usage Instructions (Optional)
          </label>
          <textarea
            value={formData.instructions}
            onChange={(e) => setFormData({...formData, instructions: e.target.value})}
            rows="3"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
            placeholder="Any special instructions for using the access code..."
          />
          <p className="text-xs text-gray-500 mt-1">
            These instructions will be included in the email sent to the guest.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#f06123] text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {booking.accessPass?.status === 'sent' ? 'Update Access Pass' : 'Send Access Pass'}
          </button>
        </div>
      </form>
    </div>
  );
}

















































// // components/admin/AccessPassForm.jsx
// 'use client';

// import { useState } from 'react';

// export default function AccessPassForm({ booking, onSend, onUpdate, onCancel, loading }) {
//   const [formData, setFormData] = useState({
//     accessCode: booking.accessPass?.code || '',
//     provider: booking.accessPass?.providedBy || '',
//     instructions: booking.accessPass?.instructions || ''
//   });

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!formData.accessCode.trim()) {
//       alert('Access code is required');
//       return;
//     }

//     if (booking.accessPass?.status === 'sent') {
//       onUpdate(formData);
//     } else {
//       onSend(formData);
//     }
//   };

//   return (
//     <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
//       <h3 className="font-semibold text-gray-900 mb-3">
//         {booking.accessPass?.status === 'sent' ? 'Update Access Pass' : 'Send Access Pass'}
//       </h3>
      
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Access Code *
//           </label>
//           <input
//             type="text"
//             value={formData.accessCode}
//             onChange={(e) => setFormData({...formData, accessCode: e.target.value})}
//             className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
//             placeholder="Enter the access code provided externally"
//             required
//           />
//           <p className="text-xs text-gray-500 mt-1">
//             This code will be sent to the guest via email and appear in their dashboard.
//           </p>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Provider (Optional)
//           </label>
//           <input
//             type="text"
//             value={formData.provider}
//             onChange={(e) => setFormData({...formData, provider: e.target.value})}
//             className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
//             placeholder="e.g., SmartLock Inc, KeyNest, etc."
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Usage Instructions (Optional)
//           </label>
//           <textarea
//             value={formData.instructions}
//             onChange={(e) => setFormData({...formData, instructions: e.target.value})}
//             rows="3"
//             className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f06123] focus:border-transparent"
//             placeholder="Any special instructions for using the access code..."
//           />
//           <p className="text-xs text-gray-500 mt-1">
//             These instructions will be included in the email sent to the guest.
//           </p>
//         </div>

//         <div className="flex justify-end space-x-3 pt-2">
//           <button
//             type="button"
//             onClick={onCancel}
//             disabled={loading}
//             className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={loading}
//             className="px-4 py-2 bg-[#f06123] text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center"
//           >
//             {loading && (
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//             )}
//             {booking.accessPass?.status === 'sent' ? 'Update Access Pass' : 'Send Access Pass'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }