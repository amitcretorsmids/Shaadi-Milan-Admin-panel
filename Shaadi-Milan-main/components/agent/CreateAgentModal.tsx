// components/agent/CreateAgentModal.tsx
import React, { useState, useRef } from 'react';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { Eye, EyeOff, Upload, FileText, Image, Loader2, CheckCircle, AlertCircle, X, Link as LinkIcon } from 'lucide-react';
import { uploadFileToFirebase } from '@/lib/firebase-upload';
import { Modal } from '../ui/modal';
import { STATES, DISTRICTS } from '@/constants/locations';

interface CreateAgentFormData {
  agentName: string;
  agentMobile: string;
  agentEmail: string;
  agentAadhar: string;
  agentLicenseNumber: string;
  agentAddress: string;
  agentCity: string;
  agentState: string;
  agentPincode: string;
  tempPassword: string;
  aadharUrl: string;
  primaryImageUrl: string;
  profileImageUrl: string;
}

interface FormErrors {
  agentName?: string;
  agentMobile?: string;
  agentEmail?: string;
  agentAadhar?: string;
  agentLicenseNumber?: string;
  agentAddress?: string;
  agentCity?: string;
  agentState?: string;
  agentPincode?: string;
  tempPassword?: string;
  aadharUrl?: string;
  primaryImageUrl?: string;
  profileImageUrl?: string;
}

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateAgentFormData) => void;
  isCreating: boolean;
}

const INITIAL_FORM: CreateAgentFormData = {
  agentName: '',
  agentMobile: '',
  agentEmail: '',
  agentAadhar: '',
  agentLicenseNumber: '',
  agentAddress: '',
  agentCity: 'Lucknow',
  agentState: 'Uttar Pradesh',
  agentPincode: '',
  tempPassword: '',
  aadharUrl: '',
  primaryImageUrl: '',
  profileImageUrl: '',
};

const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Validation functions
const validateName = (name: string): string => {
  if (!name.trim()) return 'Full name is required';
  if (name.trim().length < 3) return 'Name must be at least 3 characters';
  if (!/^[a-zA-Z\s\.\-]+$/.test(name)) return 'Name can only contain letters, spaces, dots, and hyphens';
  return '';
};

const validateMobile = (mobile: string): string => {
  if (!mobile) return 'Mobile number is required';
  if (!/^[6-9]\d{9}$/.test(mobile)) return 'Enter valid 10-digit Indian mobile number';
  return '';
};

const validateEmail = (email: string): string => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  if (!emailRegex.test(email)) return 'Enter a valid email address';
  return '';
};

const validateAadhar = (aadhar: string): string => {
  if (!aadhar) return 'Aadhar number is required';
  const clean = aadhar.replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(clean)) return 'Aadhar must be 12 digits';
  return '';
};

const validateLicense = (license: string): string => {
  if (!license) return '';
  if (license.length < 5) return 'License number too short';
  return '';
};

const validatePincode = (pincode: string): string => {
  if (!pincode) return 'Pincode is required';
  if (!/^\d{6}$/.test(pincode)) return 'Pincode must be 6 digits';
  return '';
};

const validatePassword = (password: string): string => {
  if (!password) return 'Temporary password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'Password must contain uppercase, lowercase, and number';
  }
  return '';
};

const validateUrl = (url: string, fieldName: string, required = true): string => {
  if (!required && !url) return '';
  if (!url && required) return `${fieldName} is required`;
  if (url) {
    try {
      new URL(url);
      if (!url.startsWith('https://')) return 'URL must use HTTPS';
      return '';
    } catch {
      return 'Enter a valid URL';
    }
  }
  return '';
};

interface UploadingFile {
  field: string;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
  uploadType?: 'file' | 'url';
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}) => {
  const [formData, setFormData] = useState<CreateAgentFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'documents'>('basic');
  
  const [uploadMethods, setUploadMethods] = useState<Record<string, 'file' | 'url'>>({
    aadhar: 'file',
    primary: 'file',
    profile: 'file',
  });
  
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({
    aadhar: '',
    primary: '',
    profile: '',
  });
  
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, UploadingFile>>({
    aadhar: { field: 'aadhar', progress: 0, status: 'idle' },
    primary: { field: 'primary', progress: 0, status: 'idle' },
    profile: { field: 'profile', progress: 0, status: 'idle' },
  });
  
  const fileInputRefs = {
    aadhar: useRef<HTMLInputElement>(null),
    primary: useRef<HTMLInputElement>(null),
    profile: useRef<HTMLInputElement>(null),
  };

  const validateField = (name: keyof CreateAgentFormData, value: string): string => {
    switch (name) {
      case 'agentName': return validateName(value);
      case 'agentMobile': return validateMobile(value);
      case 'agentEmail': return validateEmail(value);
      case 'agentAadhar': return validateAadhar(value);
      case 'agentLicenseNumber': return validateLicense(value);
      case 'agentPincode': return validatePincode(value);
      case 'tempPassword': return validatePassword(value);
      case 'aadharUrl': return validateUrl(value, 'Aadhar document', true);
      case 'primaryImageUrl': return validateUrl(value, 'Primary document', true);
      case 'profileImageUrl': return validateUrl(value, 'Profile image', false);
      case 'agentAddress': return !value.trim() ? 'Address is required' : '';
      case 'agentCity': return !value.trim() ? 'City is required' : '';
      case 'agentState': return !value.trim() ? 'State is required' : '';
      default: return '';
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name] || submitAttempted) {
      const error = validateField(name as keyof CreateAgentFormData, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof CreateAgentFormData, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleFileUpload = async (
    file: File,
    fieldType: 'aadhar' | 'primary' | 'profile',
    uid: string
  ) => {
    if (!file) return;

    setUploadingFiles(prev => ({
      ...prev,
      [fieldType]: { ...prev[fieldType], status: 'uploading', progress: 0, uploadType: 'file' }
    }));

    try {
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `${fieldType}_${timestamp}.${extension}`;
      const path = `agent_files/${uid}/${fileName}`;

      const downloadURL = await uploadFileToFirebase(file, path, (progress: number) => {
        setUploadingFiles(prev => ({
          ...prev,
          [fieldType]: { ...prev[fieldType], progress }
        }));
      });

      const urlField = fieldType === 'aadhar' ? 'aadharUrl' : 
                       fieldType === 'primary' ? 'primaryImageUrl' : 'profileImageUrl';
      
      setFormData(prev => ({ ...prev, [urlField]: downloadURL }));
      setErrors(prev => ({ ...prev, [urlField]: undefined }));
      
      setUploadingFiles(prev => ({
        ...prev,
        [fieldType]: { ...prev[fieldType], status: 'success', progress: 100, url: downloadURL, uploadType: 'file' }
      }));

      setTimeout(() => {
        setUploadingFiles(prev => ({
          ...prev,
          [fieldType]: { ...prev[fieldType], status: 'idle', progress: 0 }
        }));
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(prev => ({
        ...prev,
        [fieldType]: { 
          ...prev[fieldType], 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed' 
        }
      }));
      
      setTimeout(() => {
        setUploadingFiles(prev => ({
          ...prev,
          [fieldType]: { ...prev[fieldType], status: 'idle', error: undefined }
        }));
      }, 5000);
    }
  };

  const handleUrlSubmit = async (fieldType: 'aadhar' | 'primary' | 'profile', url: string) => {
    if (!url) return;
    
    // Validate URL
    try {
      new URL(url);
      if (!url.startsWith('https://')) {
        throw new Error('URL must use HTTPS');
      }
    } catch (error) {
      setUploadingFiles(prev => ({
        ...prev,
        [fieldType]: {
          ...prev[fieldType],
          status: 'error',
          error: 'Please enter a valid URL (must start with https://)'
        }
      }));
      
      setTimeout(() => {
        setUploadingFiles(prev => ({
          ...prev,
          [fieldType]: { ...prev[fieldType], status: 'idle', error: undefined }
        }));
      }, 5000);
      return;
    }
    
    setUploadingFiles(prev => ({
      ...prev,
      [fieldType]: { ...prev[fieldType], status: 'uploading', progress: 50, uploadType: 'url' }
    }));
    
    // Simulate processing URL
    setTimeout(() => {
      const urlField = fieldType === 'aadhar' ? 'aadharUrl' : 
                       fieldType === 'primary' ? 'primaryImageUrl' : 'profileImageUrl';
      
      setFormData(prev => ({ ...prev, [urlField]: url }));
      setErrors(prev => ({ ...prev, [urlField]: undefined }));
      
      setUploadingFiles(prev => ({
        ...prev,
        [fieldType]: { ...prev[fieldType], status: 'success', progress: 100, url, uploadType: 'url' }
      }));
      
      // Clear the URL input after successful submission
      setUrlInputs(prev => ({ ...prev, [fieldType]: '' }));
      
      setTimeout(() => {
        setUploadingFiles(prev => ({
          ...prev,
          [fieldType]: { ...prev[fieldType], status: 'idle', progress: 0 }
        }));
      }, 3000);
    }, 1000);
  };

  const triggerFileUpload = (fieldType: 'aadhar' | 'primary' | 'profile') => {
    fileInputRefs[fieldType].current?.click();
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldType: 'aadhar' | 'primary' | 'profile'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload JPEG, PNG, WEBP, or PDF files only');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const tempUid = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await handleFileUpload(file, fieldType, tempUid);
  };

  const handleRemoveDocument = (fieldType: 'aadhar' | 'primary' | 'profile') => {
    const urlField = fieldType === 'aadhar' ? 'aadharUrl' : 
                     fieldType === 'primary' ? 'primaryImageUrl' : 'profileImageUrl';
    setFormData(prev => ({ ...prev, [urlField]: '' }));
    setUploadingFiles(prev => ({
      ...prev,
      [fieldType]: { ...prev[fieldType], status: 'idle', progress: 0, url: undefined, uploadType: undefined }
    }));
  };

  const handleGeneratePassword = () => {
    const newPassword = generateTempPassword();
    setFormData(prev => ({ ...prev, tempPassword: newPassword }));
    setTouched(prev => ({ ...prev, tempPassword: true }));
    const error = validatePassword(newPassword);
    setErrors(prev => ({ ...prev, tempPassword: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof CreateAgentFormData>).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => { allTouched[key] = true; });
    setTouched(allTouched);

    if (validateForm()) {
      onCreate(formData);
    }
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
    setActiveSection('basic');
    setUploadMethods({
      aadhar: 'file',
      primary: 'file',
      profile: 'file',
    });
    setUrlInputs({
      aadhar: '',
      primary: '',
      profile: '',
    });
    setUploadingFiles({
      aadhar: { field: 'aadhar', progress: 0, status: 'idle' },
      primary: { field: 'primary', progress: 0, status: 'idle' },
      profile: { field: 'profile', progress: 0, status: 'idle' },
    });
    onClose();
  };

  const availableDistricts = DISTRICTS[formData.agentState] || ['Lucknow', 'Kanpur', 'Varanasi'];

  const renderUploadButton = (
    fieldType: 'aadhar' | 'primary' | 'profile',
    label: string,
    icon: React.ReactNode,
    required: boolean = true
  ) => {
    const uploadState = uploadingFiles[fieldType];
    const currentUrl = fieldType === 'aadhar' ? formData.aadharUrl :
                       fieldType === 'primary' ? formData.primaryImageUrl : 
                       formData.profileImageUrl;
    const currentMethod = uploadMethods[fieldType];
    const currentUrlInput = urlInputs[fieldType];
    
    return (
      <div className="bg-[var(--bg-surface)] rounded-xl p-4 border border-[var(--border-light)] hover:border-[var(--border)] transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <h4 className="font-medium text-[var(--text-primary)]">{label}</h4>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">
                {required ? 'Required' : 'Optional'} • Max 5MB for files
              </p>
            </div>
          </div>
          {currentUrl && (
            <div className="flex gap-1">
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 text-xs rounded-lg bg-[var(--bg-glass)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                View
              </a>
              <button
                type="button"
                onClick={() => handleRemoveDocument(fieldType)}
                className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>
        
        {/* Upload Method Toggle - Only show if no document uploaded yet */}
        {!currentUrl && (
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setUploadMethods(prev => ({ ...prev, [fieldType]: 'file' }))}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                currentMethod === 'file' 
                  ? 'bg-[#00c9a7] text-white' 
                  : 'bg-[var(--bg-glass)] text-[var(--text-dim)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Upload className="w-3 h-3 inline mr-1" />
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setUploadMethods(prev => ({ ...prev, [fieldType]: 'url' }))}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                currentMethod === 'url' 
                  ? 'bg-[#00c9a7] text-white' 
                  : 'bg-[var(--bg-glass)] text-[var(--text-dim)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <LinkIcon className="w-3 h-3 inline mr-1" />
              Provide URL
            </button>
          </div>
        )}
        
        {!currentUrl && currentMethod === 'file' && (
          <>
            <input
              type="file"
              ref={fileInputRefs[fieldType]}
              onChange={(e) => handleFileSelect(e, fieldType)}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => triggerFileUpload(fieldType)}
              disabled={uploadState.status === 'uploading'}
              className="w-full py-2.5 rounded-lg border-2 border-dashed border-[var(--border-light)] 
                         bg-[var(--bg-card)] hover:border-[#00c9a7] hover:bg-[var(--bg-glass)]
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all
                         flex items-center justify-center gap-2 text-sm font-medium"
            >
              {uploadState.status === 'uploading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading... {uploadState.progress}%</span>
                </>
              ) : uploadState.status === 'success' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Uploaded successfully!</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Click to upload {label}</span>
                </>
              )}
            </button>
          </>
        )}
        
        {!currentUrl && currentMethod === 'url' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={currentUrlInput}
                onChange={(e) => setUrlInputs(prev => ({ ...prev, [fieldType]: e.target.value }))}
                placeholder="https://example.com/document.pdf"
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-light)] 
                           bg-[var(--bg-card)] text-[var(--text-primary)] text-sm
                           focus:outline-none focus:border-[#00c9a7] focus:ring-1 focus:ring-[#00c9a7]"
              />
              <button
                type="button"
                onClick={() => handleUrlSubmit(fieldType, currentUrlInput)}
                disabled={uploadState.status === 'uploading' || !currentUrlInput}
                className="px-4 py-2 rounded-lg bg-[#00c9a7] text-white text-sm font-medium
                           hover:bg-[#00b896] disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
              >
                {uploadState.status === 'uploading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Add URL'
                )}
              </button>
            </div>
            <p className="text-xs text-[var(--text-dim)]">
              Enter the complete URL of the document (must start with https://)
            </p>
          </div>
        )}
        
        {uploadState.status === 'error' && (
          <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="w-3 h-3" />
            <span>{uploadState.error}</span>
          </div>
        )}
        
        {!currentUrl && required && uploadState.status !== 'uploading' && (
          <p className="text-xs text-amber-600 mt-2">⚠️ This document is required</p>
        )}
        
        {currentUrl && uploadState.uploadType === 'url' && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Document linked via URL
          </p>
        )}
        
        {currentUrl && uploadState.uploadType === 'file' && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Document uploaded successfully
          </p>
        )}
      </div>
    );
  };

  const getFieldError = (fieldName: keyof FormErrors) => {
    return errors[fieldName] && touched[fieldName] ? errors[fieldName] : null;
  };

  const renderInputField = (
    label: string,
    name: keyof CreateAgentFormData,
    type: string = 'text',
    placeholder: string = '',
    required: boolean = true,
    icon?: React.ReactNode
  ) => {
    const error = getFieldError(name);
    
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          {label} {required && <span className="text-red-500 text-xs">*</span>}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]">
              {icon}
            </div>
          )}
          <Input
            name={name}
            type={type}
            value={formData[name] as string}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-red-500 focus:border-red-500' : ''}
              transition-all
            `}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderSelectField = (
    label: string,
    name: keyof CreateAgentFormData,
    options: string[],
    required: boolean = true
  ) => {
    const error = getFieldError(name);
    
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          {label} {required && <span className="text-red-500 text-xs">*</span>}
        </label>
        <Select
          name={name}
          value={formData[name] as string}
          onChange={handleChange}
          onBlur={handleBlur}
          className={error ? 'border-red-500' : ''}
        >
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    );
  };

  // Calculate progress
  const completedFields = Object.keys(formData).filter(key => {
    const value = formData[key as keyof CreateAgentFormData];
    return value && value.toString().trim() !== '';
  }).length;
  
  const totalRequiredFields = 12; // Adjust based on your required fields
  const progressPercentage = (completedFields / totalRequiredFields) * 100;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Register New Agent" size="xl">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-[var(--text-dim)] mb-2">
            <span>Profile Completion</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 bg-[var(--border-light)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#00c9a7] to-[#7c5cfc] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 border-b border-[var(--border-light)]">
          <button
            type="button"
            onClick={() => setActiveSection('basic')}
            className={`
              px-4 py-2 text-sm font-medium transition-all relative
              ${activeSection === 'basic' 
                ? 'text-[#00c9a7]' 
                : 'text-[var(--text-dim)] hover:text-[var(--text-primary)]'
              }
            `}
          >
            Basic Information
            {activeSection === 'basic' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00c9a7]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('documents')}
            className={`
              px-4 py-2 text-sm font-medium transition-all relative
              ${activeSection === 'documents' 
                ? 'text-[#00c9a7]' 
                : 'text-[var(--text-dim)] hover:text-[var(--text-primary)]'
              }
            `}
          >
            Documents & Verification
            {activeSection === 'documents' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00c9a7]" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {activeSection === 'basic' ? (
            <div className="space-y-5">
              {/* Personal Information Section */}
              <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-light)]">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  👤 Personal Information
                </h3>
                <div className="space-y-4">
                  {renderInputField('Full Name', 'agentName', 'text', 'e.g., Amit Verma', true)}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInputField('Mobile Number', 'agentMobile', 'tel', '9123456780', true)}
                    {renderInputField('Email Address', 'agentEmail', 'email', 'agent@example.com', true)}
                  </div>
                </div>
              </div>

              {/* Credentials Section */}
              <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-light)]">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  🔐 Login Credentials
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-[var(--text-primary)]">
                      Temporary Password <span className="text-red-500 text-xs">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          name="tempPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.tempPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter or generate temporary password"
                          className={getFieldError('tempPassword') ? 'border-red-500 pr-10' : 'pr-10'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-primary)]"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="success"
                        onClick={handleGeneratePassword}
                        size="sm"
                      >
                        Generate
                      </Button>
                    </div>
                    {getFieldError('tempPassword') && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {getFieldError('tempPassword')}
                      </p>
                    )}
                    <p className="text-xs text-[var(--text-dim)] flex items-center gap-1 mt-1">
                      ⚠️ Save this password - it will be shared with the agent for first login
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-light)]">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  📍 Address Information
                </h3>
                <div className="space-y-4">
                  {renderInputField('Street Address', 'agentAddress', 'text', 'House No 54, Civil Lines', true)}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderSelectField('State', 'agentState', STATES, true)}
                    {renderSelectField('City', 'agentCity', availableDistricts, true)}
                  </div>
                  
                  {renderInputField('Pincode', 'agentPincode', 'text', '208001', true)}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Professional Details Section */}
              <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-light)]">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  🆔 Professional Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInputField('Aadhar Number', 'agentAadhar', 'text', '4321-8765-2109', true)}
                    {renderInputField('License Number', 'agentLicenseNumber', 'text', 'UP-MB-AGENT-2045', false)}
                  </div>
                </div>
              </div>

              {/* Document Uploads Section */}
              <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-light)]">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  📄 Document Uploads
                </h3>
                <div className="space-y-4">
                  {renderUploadButton('aadhar', 'Aadhar Card', <FileText className="w-5 h-5 text-[#00c9a7]" />, true)}
                  {renderUploadButton('primary', 'Primary ID Document', <Image className="w-5 h-5 text-[#7c5cfc]" />, true)}
                  {renderUploadButton('profile', 'Profile Image', <Image className="w-5 h-5 text-[#a78bfa]" />, false)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Summary */}
        {submitAttempted && Object.keys(errors).length > 0 && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-md">
            <p className="text-sm text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Please fix {Object.keys(errors).length} error(s) before submitting
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-[var(--border-light)]">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isCreating}>
            {isCreating ? 'Creating Agent...' : 'Create Agent'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};