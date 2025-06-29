// import React, { useState } from 'react';
// import { Mic, MicOff, Pill, Eye, EyeOff, Trash2, Edit3, Check, X, Plus, Download, AlertCircle } from 'lucide-react';
// import { useMedicineDictation } from '../hooks/useMedicineDictation';

// interface MedicineDictationProps {
//   userType: 'doctor' | 'patient';
//   isCallActive: boolean;
//   patientName: string;
//   doctorName: string;
//   onMedicinesShared?: (medicines: any[]) => void;
// }

// const MedicineDictation: React.FC<MedicineDictationProps> = ({
//   userType,
//   isCallActive,
//   patientName,
//   doctorName,
//   onMedicinesShared
// }) => {
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editForm, setEditForm] = useState({
//     name: '',
//     dosage: '',
//     frequency: '',
//     duration: '',
//     instructions: ''
//   });

//   const {
//     isRecording,
//     medicines,
//     isSharedWithPatient,
//     startDictation,
//     stopDictation,
//     togglePatientVisibility,
//     clearMedicines,
//     removeMedicine,
//     editMedicine,
//     isSupported,
//     error
//   } = useMedicineDictation();

//   const handleToggleDictation = () => {
//     if (isRecording) {
//       stopDictation();
//     } else {
//       startDictation();
//     }
//   };

//   const handleShareWithPatient = () => {
//     togglePatientVisibility();
//     if (onMedicinesShared && !isSharedWithPatient) {
//       onMedicinesShared(medicines);
//     }
//   };

//   const handleEditStart = (medicine: any) => {
//     setEditingId(medicine.id);
//     setEditForm({
//       name: medicine.name,
//       dosage: medicine.dosage || '',
//       frequency: medicine.frequency || '',
//       duration: medicine.duration || '',
//       instructions: medicine.instructions || ''
//     });
//   };

//   const handleEditSave = () => {
//     if (editingId) {
//       editMedicine(editingId, editForm);
//       setEditingId(null);
//     }
//   };

//   const handleEditCancel = () => {
//     setEditingId(null);
//     setEditForm({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
//   };

//   const downloadPrescription = () => {
//     const prescriptionContent = `
// PRESCRIPTION
// ============

// Patient: ${patientName}
// Doctor: ${doctorName}
// Date: ${new Date().toLocaleDateString()}
// Time: ${new Date().toLocaleTimeString()}

// PRESCRIBED MEDICATIONS:
// ${medicines.map((med, index) => `
// ${index + 1}. ${med.name}
//    ${med.dosage ? `Dosage: ${med.dosage}` : ''}
//    ${med.frequency ? `Frequency: ${med.frequency}` : ''}
//    ${med.duration ? `Duration: ${med.duration}` : ''}
//    ${med.instructions ? `Instructions: ${med.instructions}` : ''}
// `).join('\n')}

// Doctor's Signature: ${doctorName}
// Generated on: ${new Date().toLocaleString()}
//     `.trim();

//     const blob = new Blob([prescriptionContent], { type: 'text/plain' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `prescription-${patientName}-${new Date().toISOString().split('T')[0]}.txt`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   // Patient view - only show medicines if shared by doctor
//   if (userType === 'patient') {
//     if (!isSharedWithPatient || medicines.length === 0) {
//       return (
//         <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
//           <div className="text-center text-gray-500">
//             <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
//             <p className="text-lg font-medium mb-2">Prescription</p>
//             <p className="text-sm">Your doctor will share the prescription when ready</p>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div className="bg-white rounded-lg shadow-lg border border-gray-200">
//         <div className="p-4 border-b border-gray-200 bg-blue-50">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <Pill className="w-5 h-5 text-blue-600" />
//               <h3 className="text-lg font-semibold text-blue-900">Your Prescription</h3>
//             </div>
//             <div className="flex items-center gap-2 text-sm text-blue-700">
//               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//               Shared by Dr. {doctorName}
//             </div>
//           </div>
//         </div>

//         <div className="p-4">
//           {/* Patient Table View */}
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse">
//               <thead>
//                 <tr className="bg-blue-50 border-b-2 border-blue-200">
//                   <th className="text-left p-3 font-semibold text-blue-900">#</th>
//                   <th className="text-left p-3 font-semibold text-blue-900">Medicine Name</th>
//                   <th className="text-left p-3 font-semibold text-blue-900">Dosage</th>
//                   <th className="text-left p-3 font-semibold text-blue-900">When to Take</th>
//                   <th className="text-left p-3 font-semibold text-blue-900">Duration</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {medicines.map((medicine, index) => (
//                   <tr key={medicine.id} className="border-b border-blue-100 hover:bg-blue-25">
//                     <td className="p-3 font-medium text-blue-800">{index + 1}</td>
//                     <td className="p-3">
//                       <div className="font-bold text-lg text-blue-900 bg-blue-100 px-3 py-1 rounded-lg inline-block">
//                         {medicine.name}
//                       </div>
//                     </td>
//                     <td className="p-3 text-blue-800 font-medium">
//                       {medicine.dosage || '-'}
//                     </td>
//                     <td className="p-3 text-blue-800 font-medium">
//                       {medicine.frequency || '-'}
//                     </td>
//                     <td className="p-3 text-blue-800 font-medium">
//                       {medicine.duration || '-'}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <div className="pt-4 border-t border-gray-200 mt-4">
//             <button
//               onClick={downloadPrescription}
//               className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
//             >
//               <Download className="w-5 h-5" />
//               Download Prescription
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Doctor view
//   if (!isSupported) {
//     return (
//       <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//         <div className="flex items-center">
//           <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
//           <p className="text-sm text-red-700">
//             Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-lg shadow-lg border border-gray-200">
//       <div className="p-4 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Pill className="w-5 h-5 text-teal-600" />
//             <h3 className="text-lg font-semibold text-gray-900">Medicine Prescription</h3>
//           </div>
//           <div className="flex items-center gap-2">
//             {isRecording && (
//               <div className="flex items-center text-red-600">
//                 <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-2"></div>
//                 <span className="text-sm font-medium">Listening...</span>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="p-4 space-y-4">
//         {/* Speech Dictation Controls */}
//         <div className="flex items-center gap-4">
//           <button
//             onClick={handleToggleDictation}
//             disabled={!isCallActive}
//             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
//               isRecording
//                 ? 'bg-red-600 text-white hover:bg-red-700'
//                 : 'bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
//             }`}
//           >
//             {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
//             {isRecording ? 'Stop Dictation' : 'Start Medicine Dictation'}
//           </button>

//           {medicines.length > 0 && (
//             <button
//               onClick={handleShareWithPatient}
//               className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
//                 isSharedWithPatient
//                   ? 'bg-orange-600 text-white hover:bg-orange-700'
//                   : 'bg-green-600 text-white hover:bg-green-700'
//               }`}
//             >
//               {isSharedWithPatient ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//               {isSharedWithPatient ? 'Hide from Patient' : 'Share with Patient'}
//             </button>
//           )}
//         </div>

//         {/* Error Messages */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//             <div className="flex items-center">
//               <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
//               <p className="text-sm text-red-700">{error}</p>
//             </div>
//           </div>
//         )}

//         {/* Instructions */}
//         <div className="bg-teal-50 rounded-lg p-3">
//           <p className="text-sm text-teal-800">
//             <strong>Instructions:</strong> Click "Start Medicine Dictation" and speak clearly. 
//             Say things like "Prescribe Amoxicillin 500mg twice daily for 7 days\" or just medicine names like "Aspirin".
//             The system will automatically parse dosage, frequency, and duration from your speech.
//           </p>
//         </div>

//         {/* Medicine Table */}
//         {medicines.length > 0 && (
//           <div className="space-y-3">
//             <div className="flex items-center justify-between">
//               <h4 className="font-semibold text-gray-900">
//                 Prescribed Medicines ({medicines.length})
//               </h4>
//               <div className="flex items-center gap-2">
//                 {isSharedWithPatient && (
//                   <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
//                     Shared with Patient
//                   </span>
//                 )}
//                 <button
//                   onClick={downloadPrescription}
//                   className="text-sm text-teal-600 hover:text-teal-700 font-medium p-1"
//                   title="Download Prescription"
//                 >
//                   <Download className="w-4 h-4" />
//                 </button>
//                 <button
//                   onClick={clearMedicines}
//                   className="text-sm text-red-600 hover:text-red-700 font-medium"
//                 >
//                   Clear All
//                 </button>
//               </div>
//             </div>

//             {/* Doctor Table View */}
//             <div className="overflow-x-auto bg-gray-50 rounded-lg border border-gray-200">
//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="bg-teal-100 border-b-2 border-teal-200">
//                     <th className="text-left p-3 font-semibold text-teal-900">#</th>
//                     <th className="text-left p-3 font-semibold text-teal-900">Medicine Name</th>
//                     <th className="text-left p-3 font-semibold text-teal-900">Dosage</th>
//                     <th className="text-left p-3 font-semibold text-teal-900">When to Take</th>
//                     <th className="text-left p-3 font-semibold text-teal-900">Duration</th>
//                     <th className="text-left p-3 font-semibold text-teal-900">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {medicines.map((medicine, index) => (
//                     <tr key={medicine.id} className="border-b border-gray-200 hover:bg-white">
//                       {editingId === medicine.id ? (
//                         <>
//                           <td className="p-3 font-medium text-gray-700">{index + 1}</td>
//                           <td className="p-3">
//                             <input
//                               type="text"
//                               value={editForm.name}
//                               onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
//                               className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
//                               placeholder="Medicine name"
//                             />
//                           </td>
//                           <td className="p-3">
//                             <input
//                               type="text"
//                               value={editForm.dosage}
//                               onChange={(e) => setEditForm(prev => ({ ...prev, dosage: e.target.value }))}
//                               className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
//                               placeholder="e.g., 500mg"
//                             />
//                           </td>
//                           <td className="p-3">
//                             <input
//                               type="text"
//                               value={editForm.frequency}
//                               onChange={(e) => setEditForm(prev => ({ ...prev, frequency: e.target.value }))}
//                               className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
//                               placeholder="e.g., twice daily"
//                             />
//                           </td>
//                           <td className="p-3">
//                             <input
//                               type="text"
//                               value={editForm.duration}
//                               onChange={(e) => setEditForm(prev => ({ ...prev, duration: e.target.value }))}
//                               className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
//                               placeholder="e.g., 7 days"
//                             />
//                           </td>
//                           <td className="p-3">
//                             <div className="flex items-center gap-1">
//                               <button
//                                 onClick={handleEditSave}
//                                 className="p-1 text-green-600 hover:text-green-700"
//                                 title="Save"
//                               >
//                                 <Check className="w-4 h-4" />
//                               </button>
//                               <button
//                                 onClick={handleEditCancel}
//                                 className="p-1 text-gray-600 hover:text-gray-700"
//                                 title="Cancel"
//                               >
//                                 <X className="w-4 h-4" />
//                               </button>
//                             </div>
//                           </td>
//                         </>
//                       ) : (
//                         <>
//                           <td className="p-3 font-medium text-gray-700">{index + 1}</td>
//                           <td className="p-3">
//                             <div className="font-bold text-lg text-teal-900 bg-teal-100 px-3 py-1 rounded-lg inline-block">
//                               {medicine.name}
//                             </div>
//                           </td>
//                           <td className="p-3 text-gray-700 font-medium">
//                             {medicine.dosage || '-'}
//                           </td>
//                           <td className="p-3 text-gray-700 font-medium">
//                             {medicine.frequency || '-'}
//                           </td>
//                           <td className="p-3 text-gray-700 font-medium">
//                             {medicine.duration || '-'}
//                           </td>
//                           <td className="p-3">
//                             <div className="flex items-center gap-1">
//                               <button
//                                 onClick={() => handleEditStart(medicine)}
//                                 className="p-1 text-gray-500 hover:text-teal-600"
//                                 title="Edit Medicine"
//                               >
//                                 <Edit3 className="w-4 h-4" />
//                               </button>
//                               <button
//                                 onClick={() => removeMedicine(medicine.id)}
//                                 className="p-1 text-gray-500 hover:text-red-600"
//                                 title="Remove Medicine"
//                               >
//                                 <Trash2 className="w-4 h-4" />
//                               </button>
//                             </div>
//                           </td>
//                         </>
//                       )}
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Additional Instructions Section */}
//             {medicines.some(med => med.instructions && med.instructions !== med.name) && (
//               <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
//                 <h5 className="font-semibold text-yellow-900 mb-2">Additional Instructions:</h5>
//                 <div className="space-y-1 text-sm text-yellow-800">
//                   {medicines.map((medicine, index) => 
//                     medicine.instructions && medicine.instructions !== medicine.name ? (
//                       <p key={medicine.id}>
//                         <strong>{index + 1}. {medicine.name}:</strong> {medicine.instructions}
//                       </p>
//                     ) : null
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {medicines.length === 0 && (
//           <div className="text-center py-8 text-gray-500">
//             <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
//             <p className="text-lg font-medium mb-2">No medicines prescribed yet</p>
//             <p className="text-sm">Start dictating to add medicines to the prescription</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MedicineDictation;

import React, { useState } from 'react';
import { Mic, MicOff, Download } from 'lucide-react';
import { useMedicineDictation } from '../hooks/useMedicineDictation';
import { createClient } from '@supabase/supabase-js';

// ✅ Initialize Supabase client
const supabase = createClient('https://your-project.supabase.co', 'your-anon-key'); // Replace with actual keys

interface MedicineDictationProps {
  userType: 'doctor' | 'patient';
  isCallActive: boolean;
  patientName: string;
  doctorName: string;
  onMedicinesShared?: (medicines: any[]) => void;
}

const MedicineDictation: React.FC<MedicineDictationProps> = ({
  userType,
  isCallActive,
  patientName,
  doctorName,
  onMedicinesShared
}) => {
  const {
    isRecording,
    medicines,
    isSharedWithPatient,
    startDictation,
    stopDictation,
    togglePatientVisibility,
    clearMedicines,
    removeMedicine,
    editMedicine,
    isSupported,
    error
  } = useMedicineDictation();

  const handleToggleDictation = () => {
    if (isRecording) {
      stopDictation();
    } else {
      startDictation();
    }
  };

  const generatePrescriptionContent = () => {
    return `
PRESCRIPTION
============

Patient: ${patientName}
Doctor: ${doctorName}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

PRESCRIBED MEDICATIONS:
${medicines.map((med, index) => `
${index + 1}. ${med.name}
   ${med.dosage ? `Dosage: ${med.dosage}` : ''}
   ${med.frequency ? `Frequency: ${med.frequency}` : ''}
   ${med.duration ? `Duration: ${med.duration}` : ''}
   ${med.instructions ? `Instructions: ${med.instructions}` : ''}
`).join('\n')}

Doctor's Signature: ${doctorName}
Generated on: ${new Date().toLocaleString()}
    `.trim();
  };

  const uploadPrescriptionToSupabase = async (content: string) => {
    const fileName = `prescription-${patientName}-${new Date().toISOString()}.txt`;
    const file = new File([content], fileName, { type: 'text/plain' });

    const { data, error } = await supabase.storage
      .from('prescriptions') // Replace with your actual bucket name
      .upload(fileName, file);

    if (error) {
      console.error('Upload failed:', error.message);
      alert('Upload failed: ' + error.message);
    } else {
      console.log('Uploaded file:', data);
      alert('Prescription uploaded to Supabase Storage!');
    }
  };

  const handleDownloadAndUpload = () => {
    const content = generatePrescriptionContent();

    // Download locally
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${patientName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Upload to Supabase
    uploadPrescriptionToSupabase(content);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Medicine Dictation</h2>
        <button
          onClick={handleToggleDictation}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            isRecording ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}
          disabled={!isCallActive}
        >
          {isRecording ? <MicOff className="w-4 h-4 inline-block mr-1" /> : <Mic className="w-4 h-4 inline-block mr-1" />}
          {isRecording ? 'Stop Dictation' : 'Start Dictation'}
        </button>
      </div>

      <div className="mb-4">
        {medicines.length > 0 ? (
          <>
            <ul className="list-disc pl-5 space-y-1">
              {medicines.map((med, idx) => (
                <li key={med.id} className="text-sm text-gray-700">
                  <strong>{idx + 1}. {med.name}</strong> {med.dosage ? ` - ${med.dosage}` : ''} {med.frequency ? ` - ${med.frequency}` : ''} {med.duration ? ` - ${med.duration}` : ''}
                </li>
              ))}
            </ul>
            <button
              onClick={handleDownloadAndUpload}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download className="w-4 h-4" /> Download & Upload
            </button>
          </>
        ) : (
          <p className="text-gray-500 text-sm">No medicines added yet.</p>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default MedicineDictation;
