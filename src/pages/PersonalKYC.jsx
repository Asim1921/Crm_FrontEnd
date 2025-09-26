import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Upload, FileText, Image, File, Download, Eye, Trash2, User, Calendar, Camera, X, CheckCircle, AlertCircle, FileCheck } from 'lucide-react';
import { kycAPI } from '../utils/api';

const PersonalKYC = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    country: ''
  });
  
  // Document upload state
  const [documents, setDocuments] = useState({
    selfie: null,
    idFront: null,
    idBack: null,
    paymentProof: null,
    bankStatement: null,
    utilityBill: null
  });
  
  // Admin view state
  const [allKycData, setAllKycData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Camera modal state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Document types configuration
  const documentTypes = {
    selfie: { label: 'Selfie', icon: User, accept: 'image/*', required: true },
    idFront: { label: 'ID Front Side', icon: FileText, accept: 'image/*,application/pdf', required: true },
    idBack: { label: 'ID Back Side', icon: FileText, accept: 'image/*,application/pdf', required: true },
    paymentProof: { label: 'Payment Proof', icon: File, accept: 'image/*,application/pdf', required: true },
    bankStatement: { label: 'Bank Statement', icon: FileText, accept: 'image/*,application/pdf', required: true },
    utilityBill: { label: 'Utility Bill', icon: FileText, accept: 'image/*,application/pdf', required: true }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllKycData();
    } else {
      fetchUserKycData();
    }
  }, [isAdmin]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const fetchUserKycData = async () => {
    try {
      setLoading(true);
      const data = await kycAPI.getUserKyc(user._id);
      // Don't pre-fill the form - let users start fresh each time
      // Only show existing data in admin view
    } catch (error) {
      console.error('Error fetching user KYC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllKycData = async () => {
    try {
      setLoading(true);
      const data = await kycAPI.getAllKyc();
      setAllKycData(data);
    } catch (error) {
      console.error('Error fetching all KYC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (documentType, file) => {
    if (file) {
      setDocuments(prev => ({
        ...prev,
        [documentType]: file
      }));
    }
  };

  // Camera functions
  const openCameraModal = () => {
    setShowCameraModal(true);
    setCapturedImage(null);
  };

  const closeCameraModal = () => {
    setShowCameraModal(false);
    setCameraLoading(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const startCamera = async () => {
    try {
      setCameraLoading(true);
      console.log('Requesting camera access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', // Front camera for selfies
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      console.log('Camera stream obtained:', stream);
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Set up event listeners before trying to play
        const video = videoRef.current;
        
        const handleLoadedMetadata = () => {
          console.log('Video metadata loaded, starting playback...');
          video.play()
            .then(() => {
              console.log('Video started playing');
              setCameraLoading(false);
            })
            .catch((playError) => {
              console.error('Error playing video:', playError);
              setCameraLoading(false);
            });
        };
        
        const handleCanPlay = () => {
          console.log('Video can play');
          setCameraLoading(false);
        };
        
        // Add event listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);
        
        // Try to play immediately
        video.play().catch((playError) => {
          console.log('Immediate play failed, waiting for metadata...', playError);
        });
        
        // Fallback timeout
        setTimeout(() => {
          if (cameraLoading) {
            console.log('Timeout reached, forcing camera to show');
            setCameraLoading(false);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraLoading(false);
      let errorMessage = 'Unable to access camera. Please check permissions.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera or use gallery option.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (error.message === 'Camera not supported in this browser') {
        errorMessage = 'Camera not supported in this browser. Please use a modern browser.';
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to canvas (mirrored for selfie)
      context.save();
      context.scale(-1, 1); // Mirror horizontally
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();
      
      // Convert canvas to data URL
      const dataURL = canvas.toDataURL('image/jpeg', 0.9);
      
      // Create a file-like object without using File constructor
      const file = {
        name: 'selfie.jpg',
        type: 'image/jpeg',
        size: dataURL.length,
        lastModified: Date.now(),
        dataURL: dataURL, // Store the data URL for later use
        // Add methods that might be needed
        stream: function() {
          const byteString = atob(dataURL.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          return new Blob([ab], { type: 'image/jpeg' }).stream();
        },
        arrayBuffer: function() {
          const byteString = atob(dataURL.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          return ab;
        }
      };
      
      setCapturedImage(file);
      handleFileUpload('selfie', file);
      console.log('Photo captured successfully:', file);
    } else {
      console.error('Video or canvas not available');
      showToast('Camera not ready for capture', 'error');
    }
  };

  const selectFromGallery = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setCapturedImage(file);
        handleFileUpload('selfie', file);
        closeCameraModal();
      }
    };
    input.click();
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      // If it's our custom file object with dataURL, use it directly
      if (file.dataURL) {
        resolve(file.dataURL);
        return;
      }
      
      // Otherwise, use FileReader for regular files
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.fullName || !formData.idNumber || !formData.country) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Validate required documents
    const requiredDocs = Object.keys(documentTypes).filter(key => documentTypes[key].required);
    const missingDocs = requiredDocs.filter(docType => !documents[docType]);
    
    if (missingDocs.length > 0) {
      showToast(`Please upload all required documents: ${missingDocs.map(doc => documentTypes[doc].label).join(', ')}`, 'error');
      return;
    }

    try {
      setUploading(true);
      
      // Convert files to base64
      const documentsBase64 = {};
      for (const [docType, file] of Object.entries(documents)) {
        if (file) {
          documentsBase64[docType] = await fileToBase64(file);
        }
      }

      // Create JSON payload
      const payload = {
        fullName: formData.fullName,
        idNumber: formData.idNumber,
        country: formData.country,
        userId: user._id,
        documents: documentsBase64
      };

      console.log('About to submit KYC with payload:', payload);
      
      // Use a simple JSON POST instead of FormData
      const response = await fetch('/api/kyc/submit-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit KYC documents');
      }

      const result = await response.json();
      const isUpdate = response.status === 200;
      
      showToast(isUpdate ? 'Documents Updated Successfully' : 'Documents Submitted Successfully', 'success');
      
      // Refresh data
      if (isAdmin) {
        fetchAllKycData();
      } else {
        fetchUserKycData();
      }
      
      // Reset form
      setFormData({ fullName: '', idNumber: '', country: '' });
      setDocuments({
        selfie: null,
        idFront: null,
        idBack: null,
        paymentProof: null,
        bankStatement: null,
        utilityBill: null
      });
    } catch (error) {
      console.error('Error submitting KYC:', error);
      showToast('Error submitting KYC documents', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (kycId, documentType) => {
    try {
      await kycAPI.downloadDocument(kycId, documentType);
    } catch (error) {
      console.error('Error downloading document:', error);
      showToast('Error downloading document', 'error');
    }
  };

  const handleDelete = async (kycId) => {
    if (window.confirm('Are you sure you want to delete this KYC submission?')) {
      try {
        await kycAPI.deleteKyc(kycId);
        showToast('KYC submission deleted successfully', 'success');
        fetchAllKycData();
      } catch (error) {
        console.error('Error deleting KYC:', error);
        showToast('Error deleting KYC submission', 'error');
      }
    }
  };

  // Admin view - show all KYC submissions
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">KYC Management</h1>
                  <p className="mt-1 text-gray-600">View and manage all KYC submissions</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID Number</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Country</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submitted On</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Documents</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {allKycData.map((kyc) => (
                        <tr key={kyc._id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="text-sm font-semibold text-gray-900">{kyc.fullName}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{kyc.idNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{kyc.country}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              kyc.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                              kyc.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                              'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                              {kyc.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {kyc.status === 'rejected' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {kyc.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {new Date(kyc.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(kyc.documents || {}).map(docType => (
                                <span key={docType} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  {documentTypes[docType]?.label || docType}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDownload(kyc._id, 'selfie')}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Download Documents"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(kyc._id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Client view - KYC form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-4">
            <FileCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Personal KYC
          </h1>
          <p className="text-gray-600 text-lg">Submit your documents for verification</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-xl">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">ID Number *</label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  placeholder="Enter your ID number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Country *</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  placeholder="Enter your country"
                  required
                />
              </div>
            </div>
          </div>

          {/* Document Upload Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Upload className="h-6 w-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Document Upload</h2>
            </div>
            
            {/* Selfie Section */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Camera className="h-5 w-5 text-green-600" />
                </div>
                <label className="text-lg font-semibold text-gray-700">Selfie *</label>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gradient-to-r from-green-50 to-blue-50">
                {!documents.selfie ? (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={openCameraModal}
                      className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-blue-600 flex items-center gap-3 mx-auto transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Camera className="h-5 w-5" />
                      Take Selfie
                    </button>
                    <p className="text-gray-600 mt-3">Click to take a selfie or select from gallery</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{documents.selfie.name}</p>
                        <p className="text-sm text-gray-500">Photo uploaded successfully</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openCameraModal}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Retake
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ID Documents Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <label className="text-lg font-semibold text-gray-700">ID Front Side *</label>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-white/50">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload('idFront', e.target.files[0])}
                    className="w-full"
                  />
                  {documents.idFront && (
                    <div className="mt-3 flex items-center gap-3 bg-green-50 rounded-lg p-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">{documents.idFront.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <label className="text-lg font-semibold text-gray-700">ID Back Side *</label>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-white/50">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload('idBack', e.target.files[0])}
                    className="w-full"
                  />
                  {documents.idBack && (
                    <div className="mt-3 flex items-center gap-3 bg-green-50 rounded-lg p-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">{documents.idBack.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Documents Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <File className="h-5 w-5 text-purple-600" />
                  </div>
                  <label className="text-lg font-semibold text-gray-700">Payment Proof</label>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-white/50">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload('paymentProof', e.target.files[0])}
                    className="w-full"
                  />
                  {documents.paymentProof && (
                    <div className="mt-3 flex items-center gap-3 bg-green-50 rounded-lg p-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">{documents.paymentProof.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FileText className="h-5 w-5 text-orange-600" />
                  </div>
                  <label className="text-lg font-semibold text-gray-700">Bank Statement</label>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-white/50">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload('bankStatement', e.target.files[0])}
                    className="w-full"
                  />
                  {documents.bankStatement && (
                    <div className="mt-3 flex items-center gap-3 bg-green-50 rounded-lg p-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">{documents.bankStatement.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <FileText className="h-5 w-5 text-teal-600" />
                  </div>
                  <label className="text-lg font-semibold text-gray-700">Utility Bill</label>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-white/50">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload('utilityBill', e.target.files[0])}
                    className="w-full"
                  />
                  {documents.utilityBill && (
                    <div className="mt-3 flex items-center gap-3 bg-green-50 rounded-lg p-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">{documents.utilityBill.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={uploading}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Submit KYC Documents
                </>
              )}
            </button>
          </div>
        </form>

        {/* Camera Modal */}
        {showCameraModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Take Selfie</h3>
                <button
                  onClick={closeCameraModal}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {!cameraStream ? (
                  <div className="text-center space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
                      <Camera className="h-20 w-20 text-blue-400 mx-auto mb-6" />
                      <p className="text-gray-700 mb-6 text-lg">Choose how you want to add your selfie:</p>
                      <div className="space-y-3">
                        <button
                          onClick={startCamera}
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <Camera className="h-5 w-5" />
                          Use Camera
                        </button>
                        <button
                          onClick={selectFromGallery}
                          className="w-full bg-gray-600 text-white py-3 px-6 rounded-xl hover:bg-gray-700 flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <Image className="h-5 w-5" />
                          Choose from Gallery
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 object-cover"
                        style={{ transform: 'scaleX(-1)' }} // Mirror the video for selfie
                      />
                      {cameraLoading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                            <p className="text-white mb-4">Starting camera...</p>
                            <button
                              onClick={() => {
                                setCameraLoading(false);
                                setTimeout(() => startCamera(), 100);
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Try Again
                            </button>
                          </div>
                        </div>
                      )}
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={capturePhoto}
                        disabled={cameraLoading || !cameraStream}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Camera className="h-5 w-5" />
                        {cameraLoading ? 'Loading...' : cameraStream ? 'Capture Photo' : 'Camera Not Ready'}
                      </button>
                      <button
                        onClick={selectFromGallery}
                        className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-xl hover:bg-gray-700 flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Image className="h-5 w-5" />
                        Gallery
                      </button>
                    </div>
                  </div>
                )}

                {capturedImage && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-green-600 font-semibold mb-4 text-lg">Photo captured successfully!</p>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-700 font-medium">{capturedImage.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={closeCameraModal}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Use This Photo
                      </button>
                      <button
                        onClick={() => {
                          setCapturedImage(null);
                          if (cameraStream) {
                            startCamera();
                          }
                        }}
                        className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalKYC;