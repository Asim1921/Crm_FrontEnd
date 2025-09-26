import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  Download, 
  Eye, 
  Trash2, 
  User, 
  Calendar, 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle, 
  FileCheck,
  Shield,
  Building,
  CreditCard,
  FileImage,
  Phone,
  Mail,
  MapPin,
  Clock,
  Check,
  ArrowRight,
  ArrowLeft,
  Lock,
  Globe
} from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState(1);

  // Camera modal state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Document types configuration
  const documentTypes = {
    selfie: { 
      label: 'Selfie Photo', 
      icon: User, 
      accept: 'image/*', 
      required: true,
      description: 'Take a clear selfie for identity verification',
      color: 'blue'
    },
    idFront: { 
      label: 'ID Front Side', 
      icon: CreditCard, 
      accept: 'image/*,application/pdf', 
      required: true,
      description: 'Upload the front side of your government-issued ID',
      color: 'green'
    },
    idBack: { 
      label: 'ID Back Side', 
      icon: CreditCard, 
      accept: 'image/*,application/pdf', 
      required: true,
      description: 'Upload the back side of your government-issued ID',
      color: 'green'
    },
    paymentProof: { 
      label: 'Payment Proof', 
      icon: FileCheck, 
      accept: 'image/*,application/pdf', 
      required: true,
      description: 'Upload proof of payment or transaction receipt',
      color: 'purple'
    },
    bankStatement: { 
      label: 'Bank Statement', 
      icon: Building, 
      accept: 'image/*,application/pdf', 
      required: true,
      description: 'Upload your recent bank statement',
      color: 'orange'
    },
    utilityBill: { 
      label: 'Utility Bill', 
      icon: FileImage, 
      accept: 'image/*,application/pdf', 
      required: true,
      description: 'Upload a recent utility bill for address verification',
      color: 'red'
    }
  };

  const steps = [
    { id: 1, title: 'Personal Information', description: 'Enter your basic details' },
    { id: 2, title: 'Identity Documents', description: 'Upload your ID documents' },
    { id: 3, title: 'Financial Documents', description: 'Upload financial proof' },
    { id: 4, title: 'Review & Submit', description: 'Review and submit your application' }
  ];

  // Step navigation functions
  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.idNumber && formData.country;
      case 2:
        return documents.selfie && documents.idFront && documents.idBack;
      case 3:
        return documents.paymentProof && documents.bankStatement && documents.utilityBill;
      default:
        return true;
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInfo();
      case 2:
        return renderIdentityDocuments();
      case 3:
        return renderFinancialDocuments();
      case 4:
        return renderReview();
      default:
        return renderPersonalInfo();
    }
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Information</h3>
        <p className="text-gray-600">Please provide your basic personal details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your full name"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.idNumber}
              onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your ID number"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={formData.country}
              onChange={(e) => setFormData({...formData, country: e.target.value})}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
              required
            >
              <option value="">Select your country</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="ES">Spain</option>
              <option value="IT">Italy</option>
              <option value="NL">Netherlands</option>
              <option value="BE">Belgium</option>
              <option value="CH">Switzerland</option>
              <option value="AT">Austria</option>
              <option value="SE">Sweden</option>
              <option value="NO">Norway</option>
              <option value="DK">Denmark</option>
              <option value="FI">Finland</option>
              <option value="IE">Ireland</option>
              <option value="PT">Portugal</option>
              <option value="GR">Greece</option>
              <option value="PL">Poland</option>
              <option value="CZ">Czech Republic</option>
              <option value="HU">Hungary</option>
              <option value="SK">Slovakia</option>
              <option value="SI">Slovenia</option>
              <option value="HR">Croatia</option>
              <option value="RO">Romania</option>
              <option value="BG">Bulgaria</option>
              <option value="LT">Lithuania</option>
              <option value="LV">Latvia</option>
              <option value="EE">Estonia</option>
              <option value="LU">Luxembourg</option>
              <option value="MT">Malta</option>
              <option value="CY">Cyprus</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIdentityDocuments = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Identity Documents</h3>
        <p className="text-gray-600">Upload your government-issued ID documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['selfie', 'idFront', 'idBack'].map((docType) => (
          <DocumentUploadCard
            key={docType}
            docType={docType}
            document={documents[docType]}
            onUpload={handleFileUpload}
            onRemove={handleRemoveDocument}
          />
        ))}
      </div>
    </div>
  );

  const renderFinancialDocuments = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Financial Documents</h3>
        <p className="text-gray-600">Upload your financial verification documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['paymentProof', 'bankStatement', 'utilityBill'].map((docType) => (
          <DocumentUploadCard
            key={docType}
            docType={docType}
            document={documents[docType]}
            onUpload={handleFileUpload}
            onRemove={handleRemoveDocument}
          />
        ))}
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Review & Submit</h3>
        <p className="text-gray-600">Please review your information before submitting</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-6">
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Full Name</span>
              </div>
              <p className="text-gray-900">{formData.fullName || 'Not provided'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">ID Number</span>
              </div>
              <p className="text-gray-900">{formData.idNumber || 'Not provided'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Country</span>
              </div>
              <p className="text-gray-900">{formData.country || 'Not provided'}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Documents</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(documents).map(([docType, doc]) => (
              <div key={docType} className="bg-white p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  {React.createElement(documentTypes[docType].icon, { className: "w-4 h-4 text-gray-500" })}
                  <span className="text-sm font-medium text-gray-700">{documentTypes[docType].label}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  {doc ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Uploaded</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Missing</span>
                    </>
                  )}
                </div>
                {doc && (docType === 'selfie' || docType.includes('id') || docType === 'paymentProof') && (
                  <div className="mt-2">
                    <img 
                      src={doc.dataURL || URL.createObjectURL(doc)} 
                      alt={documentTypes[docType].label}
                      className="w-full h-20 object-cover rounded border"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const DocumentUploadCard = ({ docType, document, onUpload, onRemove }) => {
    const config = documentTypes[docType];
    const Icon = config.icon;
    const colorClasses = {
      blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
      green: 'border-green-200 bg-green-50 hover:bg-green-100',
      purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100',
      orange: 'border-orange-200 bg-orange-50 hover:bg-orange-100',
      red: 'border-red-200 bg-red-50 hover:bg-red-100'
    };

    return (
      <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${colorClasses[config.color]}`}>
        <div className="text-center">
          <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
            config.color === 'blue' ? 'bg-blue-100' :
            config.color === 'green' ? 'bg-green-100' :
            config.color === 'purple' ? 'bg-purple-100' :
            config.color === 'orange' ? 'bg-orange-100' :
            'bg-red-100'
          }`}>
            <Icon className={`w-6 h-6 ${
              config.color === 'blue' ? 'text-blue-600' :
              config.color === 'green' ? 'text-green-600' :
              config.color === 'purple' ? 'text-purple-600' :
              config.color === 'orange' ? 'text-orange-600' :
              'text-red-600'
            }`} />
          </div>
          
          <h4 className="text-sm font-medium text-gray-900 mb-2">{config.label}</h4>
          <p className="text-xs text-gray-600 mb-4">{config.description}</p>
          
          {document ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Document Uploaded</span>
              </div>
              <button
                onClick={() => onRemove(docType)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {docType === 'selfie' ? (
                <>
                  <button
                    onClick={() => setShowCameraModal(true)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Camera className="w-4 h-4 inline mr-2" />
                    Take Photo
                  </button>
                  <button
                    onClick={() => {
                      setShowCameraModal(true);
                      setTimeout(() => startCamera(), 200);
                    }}
                    className="w-full bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Camera className="w-4 h-4 inline mr-2" />
                    Open Camera
                  </button>
                </>
              ) : null}
              
              <input
                type="file"
                accept={config.accept}
                onChange={(e) => onUpload(docType, e.target.files[0])}
                className="hidden"
                id={`file-${docType}`}
              />
              <label
                htmlFor={`file-${docType}`}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer inline-block text-center"
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Choose File
              </label>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Camera functionality
  const startCamera = async () => {
    try {
      setCameraLoading(true);
      console.log('Starting camera...');
      
      // Stop any existing stream first
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      });
      
      console.log('Camera stream obtained:', stream);
      setCameraStream(stream);
      
      // Set loading to false immediately after getting stream
      setCameraLoading(false);
      
      if (videoRef.current) {
        console.log('Setting video srcObject...');
        videoRef.current.srcObject = stream;
        
        // Simple play attempt
        setTimeout(() => {
          if (videoRef.current) {
            console.log('Attempting to play video...');
            videoRef.current.play().catch(console.error);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Camera access denied. Please allow camera permission.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported on this device.';
      }
      
      showToast(errorMessage, 'error');
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.save();
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();
      
      const dataURL = canvas.toDataURL('image/jpeg', 0.9);
      
      const file = {
        name: 'selfie.jpg',
        type: 'image/jpeg',
        size: dataURL.length,
        lastModified: Date.now(),
        dataURL: dataURL,
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
      showToast('Photo captured successfully!', 'success');
    }
  };

  const handleFileUpload = (docType, file) => {
    if (!file) return;
    
    setDocuments(prev => ({
      ...prev,
      [docType]: file
    }));
    
    showToast(`${documentTypes[docType].label} uploaded successfully!`, 'success');
  };

  const handleRemoveDocument = (docType) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: null
    }));
    showToast(`${documentTypes[docType].label} removed`, 'success');
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (file.dataURL) {
        resolve(file.dataURL);
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.idNumber || !formData.country) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const requiredDocs = ['selfie', 'idFront', 'idBack', 'paymentProof', 'bankStatement', 'utilityBill'];
    const missingDocs = requiredDocs.filter(doc => !documents[doc]);
    
    if (missingDocs.length > 0) {
      showToast(`Please upload all required documents: ${missingDocs.map(doc => documentTypes[doc].label).join(', ')}`, 'error');
      return;
    }

    try {
      setUploading(true);
      
      // Prepare documents object
      const documentsData = {};
      for (const [docType, file] of Object.entries(documents)) {
        if (file) {
          const base64 = await fileToBase64(file);
          documentsData[docType] = base64;
          console.log(`Added ${docType} document to request`);
        }
      }
      
      const requestData = {
        fullName: formData.fullName,
        idNumber: formData.idNumber,
        country: formData.country,
        documents: documentsData
      };
      
      console.log('Request data being sent:', {
        fullName: requestData.fullName,
        idNumber: requestData.idNumber,
        country: requestData.country,
        documentsCount: Object.keys(requestData.documents).length
      });
      
      await kycAPI.submitKycJson(requestData);
      showToast('KYC documents submitted successfully!', 'success');
      
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
      setCurrentStep(1);
      
    } catch (error) {
      console.error('Error submitting KYC:', error);
      showToast('Failed to submit KYC documents. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Admin view functions
  const fetchAllKycData = async () => {
    try {
      setLoading(true);
      const data = await kycAPI.getAllKyc();
      setAllKycData(data);
    } catch (error) {
      console.error('Error fetching KYC data:', error);
      showToast('Failed to fetch KYC data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (kycId, documentType, fileName) => {
    try {
      await kycAPI.downloadDocument(kycId, documentType, fileName);
      showToast('Document downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading document:', error);
      showToast('Failed to download document', 'error');
    }
  };

  const handleDeleteKyc = async (kycId) => {
    if (window.confirm('Are you sure you want to delete this KYC submission?')) {
      try {
        await kycAPI.deleteKyc(kycId);
        showToast('KYC submission deleted successfully!', 'success');
        fetchAllKycData();
      } catch (error) {
        console.error('Error deleting KYC:', error);
        showToast('Failed to delete KYC submission', 'error');
      }
    }
  };

  const handleStatusUpdate = async (kycId, status) => {
    try {
      await kycAPI.updateKycStatus(kycId, status);
      showToast(`KYC status updated to ${status}`, 'success');
      fetchAllKycData();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllKycData();
    }
  }, [isAdmin]);

  // Start camera when modal opens
  useEffect(() => {
    if (showCameraModal) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        startCamera();
      }, 100);
    } else {
      stopCamera();
    }
  }, [showCameraModal]);

  // Ensure video element is properly configured when camera stream changes
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      console.log('Camera stream changed, reconfiguring video element...');
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">KYC Management</h1>
                  <p className="text-gray-600 mt-1">Review and manage KYC submissions</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">System Active</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allKycData.map((kyc) => (
                        <tr key={kyc._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{kyc.fullName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kyc.idNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kyc.country}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              kyc.status === 'approved' ? 'bg-green-100 text-green-800' :
                              kyc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {kyc.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(kyc.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleStatusUpdate(kyc._id, 'approved')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(kyc._id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleDeleteKyc(kyc._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Complete your Know Your Customer verification to access all platform features. 
            Your information is secure and encrypted.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 sm:p-8">
            {getStepContent()}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Step {currentStep} of {steps.length}
              </span>
            </div>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={uploading || !canProceed()}
                className="flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit KYC
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Take Selfie</h3>
              <button 
                onClick={() => {
                  setShowCameraModal(false);
                  stopCamera();
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
              {cameraLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-sm text-gray-600 mb-4">Starting camera...</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : !cameraStream ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">Camera not started</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Start Camera
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transform: 'scaleX(-1)'
                    }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => {
                        console.log('Manual camera restart');
                        startCamera();
                      }}
                      className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                    >
                      Restart
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCameraModal(false);
                  stopCamera();
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              {!cameraLoading && !cameraStream && (
                <button
                  onClick={startCamera}
                  className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Try Camera Again
                </button>
              )}
              {cameraStream && (
                <button
                  onClick={() => {
                    console.log('Manual play button clicked');
                    if (videoRef.current) {
                      console.log('Video element:', videoRef.current);
                      console.log('Video paused:', videoRef.current.paused);
                      console.log('Video readyState:', videoRef.current.readyState);
                      videoRef.current.play().then(() => {
                        console.log('Manual play successful');
                      }).catch((error) => {
                        console.error('Manual play failed:', error);
                      });
                    }
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Force Play
                </button>
              )}
              <button
                onClick={() => {
                  capturePhoto();
                  setShowCameraModal(false);
                  stopCamera();
                }}
                disabled={cameraLoading || !cameraStream}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalKYC;
