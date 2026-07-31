// components/modals/UserAddModal.tsx

'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Type, User, CreditCard, Calendar, Loader2, MapPin, Mail, Shield, ChevronDown, GraduationCap, Book, Percent, PlusCircle, Building, Briefcase, IndianRupee, Users, CircleDot, UserPlus, Globe, Ruler, Scale, Upload, Camera, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import locationData from '@/constants/location.json';
import religionData from '@/constants/religions_castes.json';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, setDoc, doc, serverTimestamp, getDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useQueryClient } from '@tanstack/react-query';
import type { OriginalUser } from '@/types';

interface UserAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (userData: any) => void;
  isAdding: boolean;
  editUser?: OriginalUser | null; // if provided, modal runs in Edit Mode
}

// Custom Input Field to match the screenshot design
function FormStepInput({
  label,
  icon: Icon,
  iconText,
  value,
  onChange,
  placeholder,
  maxLength,
  hint,
  type = 'text',
  isLoading = false,
  readOnly = false,
  max,
}: any) {
  return (
    <div className="relative mt-3 mb-4">
      {/* Floating Label */}
      <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
        {label}
      </div>
      
      {/* Input Container */}
      <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors">
        {/* Icon/Avatar Circle */}
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
          {iconText ? (
            <span className="text-[10px] font-bold">{iconText}</span>
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </div>
        
        {/* Input Field */}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          max={max}
          readOnly={readOnly}
          className={`flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] placeholder-[var(--text-dim)] font-medium ${readOnly ? 'opacity-70 cursor-default' : ''}`}
        />
        {isLoading && (
          <Loader2 className="w-4 h-4 text-[#7c5cfc] animate-spin flex-shrink-0 mr-2" />
        )}
      </div>
      
      {/* Optional Hint Text */}
      {hint && (
        <div className="text-right text-[10px] text-[var(--text-dim)] mt-1 mr-4">
          {hint}
        </div>
      )}
    </div>
  );
}

// Custom Upload Component for Step 8
function FormStepUpload({ label, file, onChange }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
      setIsExpanded(false);
    }
  }, [file]);

  return (
    <div className="flex flex-col border border-[var(--border)] rounded-[1.5rem] bg-[var(--bg-surface)] mt-3 mb-4 transition-colors">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--bg-hover)] rounded-[1.5rem]"
        onClick={() => {
          if (file) {
            setIsExpanded(!isExpanded);
          } else {
            fileInputRef.current?.click();
          }
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e: any) => {
            if (e.target.files?.[0]) {
              onChange(e.target.files[0]);
              setIsExpanded(true); // auto expand on upload
            }
          }} 
          className="hidden" 
        />
        <div className="flex-1 flex items-center overflow-hidden mr-4">
          <span className="text-sm font-medium text-[var(--text)] truncate">
            {file ? file.name : label}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-[var(--text-muted)] flex-shrink-0">
          <Upload 
            className="w-5 h-5 cursor-pointer hover:text-[var(--text)]" 
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }} 
          />
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isExpanded && previewUrl && (
        <div className="px-4 pb-4 pt-2">
          {file?.type.startsWith('image/') ? (
            <img src={previewUrl} alt="Preview" className="w-full max-h-64 rounded-lg object-contain bg-black/5" />
          ) : file?.type === 'application/pdf' ? (
            <iframe src={previewUrl} className="w-full h-64 rounded-lg border border-[var(--border)] bg-white" />
          ) : (
            <div className="p-4 bg-[var(--bg-hover)] rounded-lg text-sm text-[var(--text-muted)] text-center">
              Preview not available for this file type.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function UserAddModal({ isOpen, onClose, onAdd, isAdding, editUser }: UserAddModalProps) {
  const isEditMode = !!editUser;
  const [step, setStep] = useState(1);
  const totalSteps = 9;
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [translatingFields, setTranslatingFields] = useState<Record<string, boolean>>({});
  const [formLanguage, setFormLanguage] = useState<'en' | 'hi'>('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [existingMediaUrls, setExistingMediaUrls] = useState<any>(null);
  const queryClient = useQueryClient();

  // List states for multi-entry fields
  const [extraQualifications, setExtraQualifications] = useState<{en: string; hi: string}[]>([]);
  const [knownLanguages, setKnownLanguages] = useState<{en: string; hi: string}[]>([]);

  // Master data from Firebase
  const [masterQualifications, setMasterQualifications] = useState<{en: string, hi: string}[]>([]);
  const [masterDesignations, setMasterDesignations] = useState<{en: string, hi: string}[]>([]);
  const [masterAnnualIncomes, setMasterAnnualIncomes] = useState<{en: string, hi: string}[]>([]);
  const [isMasterLoading, setIsMasterLoading] = useState(false);

  // Fetch master data from Firebase when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchMasterData = async () => {
      setIsMasterLoading(true);
      try {
        const fetchCollection = async (names: string[]) => {
          for (const name of names) {
            try {
              const snap = await getDocs(collection(db, name));
              if (!snap.empty) return snap;
            } catch (e) {
              console.warn(`Failed to fetch ${name}`);
            }
          }
          return { docs: [], empty: true, size: 0 };
        };

        const [qualificationsSnap, designationsSnap, incomesSnap] = await Promise.all([
          fetchCollection(['master_qualification', 'master_qualifications', 'master_degree', 'master_degrees', 'masterqualification', 'masterdegree']),
          fetchCollection(['master_designation', 'master_designations', 'masterdesignation']),
          fetchCollection(['master_annual_income', 'master_annual_incomes', 'master_annual', 'masterannualincome', 'annual_income', 'master_income']),
        ]);
        
        console.log("Firebase fetched sizes -> Qual:", qualificationsSnap.size, "Desig:", designationsSnap.size, "Inc:", incomesSnap.size);

        // Extract both English and Hindi values
        const extractData = (d: any) => {
          const data = d.data();
          let enValue = data.nameEn || data.name_en || data.name || data.en || data.value || data.title || data.degree || data.designation || data.income || data.label;
          if (!enValue) {
            // Find the first string value if standard names aren't found
            const stringValues = Object.values(data).filter(v => typeof v === 'string');
            enValue = stringValues[0] || '';
          }
          let hiValue = data.nameHi || data.name_hi || data.name_hindi || data.hindi || data.hi || enValue;
          return { en: String(enValue), hi: String(hiValue) };
        };

        setMasterQualifications(qualificationsSnap.docs.map(extractData).filter(item => item.en));
        setMasterDesignations(designationsSnap.docs.map(extractData).filter(item => item.en));
        setMasterAnnualIncomes(incomesSnap.docs.map(extractData).filter(item => item.en));
      } catch (err) {
        console.warn('Failed to fetch master data:', err);
      } finally {
        setIsMasterLoading(false);
      }
    };
    fetchMasterData();
  }, [isOpen]);

  const [formData, setFormData] = useState({
    // Basic Info (for users collection)
    fullName: '',
    phone: '',
    email: '',
    gender: 'male' as 'male' | 'female',
    // Step 1 Fields
    aboutMeEn: '',
    aboutMeHi: '',
    aadharNumber: '',
    dob: '',
    // Step 2 Fields
    placeEn: '',
    placeHi: '',
    postEn: '',
    postHi: '',
    policeStationEn: '',
    policeStationHi: '',
    state: '',
    district: '',
    pinCode: '',
    // Step 3 Fields
    isLiterate: true,
    collegeEn: '',
    collegeHi: '',
    degreeEn: '',
    degreeHi: '',
    percentage: '',
    passingYear: '',
    extraQualificationEn: '',
    extraQualificationHi: '',
    // Step 4 Fields
    jobType: '',
    organizationEn: '',
    organizationHi: '',
    designationEn: '',
    designationHi: '',
    workLocationEn: '',
    workLocationHi: '',
    annualIncome: '',
    // Step 5 Fields
    fatherNameEn: '',
    fatherNameHi: '',
    motherNameEn: '',
    motherNameHi: '',
    noOfBrothers: '',
    noOfSisters: '',
    familyType: '',
    lifestyleStatus: '',
    // Step 6 Fields
    religion: '',
    caste: '',
    subCasteEn: '',
    subCasteHi: '',
    languageEn: '',
    languageHi: '',
    // Step 7 Fields
    height: '',
    weight: '',
    bodyType: '',
    complexion: '',
    physicallyChallenged: false,
    // Step 8 Fields (Store files)
    profileImage: null as File | null,
    matrimonyImage: null as File | null,
    agentImage: null as File | null,
    galleryImages: null as File | null,
    aadharDoc: null as File | null,
    biodataDoc: null as File | null,
  });

  // ─── EDIT MODE: Fetch full profile data from metrimony_profiles and pre-fill form ───
  useEffect(() => {
    if (!isOpen) {
      // Reset to step 1 when closed
      setStep(1);
      setStepErrors([]);
      return;
    }
    if (!editUser) return;

    const fetchAndFillProfile = async () => {
      setIsLoadingProfile(true);
      try {
        // First, get the user's metrimony_profiles document (search by userId field)
        const profilesRef = collection(db, 'metrimony_profiles');
        const profileQuery = query(profilesRef, where('userId', '==', editUser.uid));
        let profileDoc: any = null;
        let profileId: string | null = null;

        const snapshot = await getDocs(profileQuery);
        if (!snapshot.empty) {
          profileDoc = snapshot.docs[0].data();
          profileId = snapshot.docs[0].id;
        } else {
          // Fallback: try using uid directly as doc ID
          const directRef = doc(db, 'metrimony_profiles', editUser.uid);
          const directSnap = await getDoc(directRef);
          if (directSnap.exists()) {
            profileDoc = directSnap.data();
            profileId = directSnap.id;
          }
        }

        setExistingProfileId(profileId);

        // Helper to extract string from { en, hi } objects
        const getStr = (val: any, lang: 'en' | 'hi' = 'en') => {
          if (!val) return '';
          if (typeof val === 'string') return val;
          return val[lang] || val.en || val.hi || '';
        };

        const p = profileDoc || {};

        // Save existing media URLs so we can preserve them if no new files uploaded
        setExistingMediaUrls(p.mediaUrls || null);

        // Pre-fill formData from fetched profile + editUser
        setFormData(prev => ({
          ...prev,
          // Basic info from users collection
          fullName: editUser.fullName || '',
          phone: editUser.phone || '',
          email: editUser.email || '',
          gender: (editUser.gender as 'male' | 'female') || 'male',
          // Step 1
          aboutMeEn: getStr(p.personalInfo?.aboutMe, 'en'),
          aboutMeHi: getStr(p.personalInfo?.aboutMe, 'hi'),
          aadharNumber: p.personalInfo?.aadharNumber || '',
          dob: p.personalInfo?.dob || '',
          // Step 2
          placeEn: getStr(p.address?.addressLine1, 'en'),
          placeHi: getStr(p.address?.addressLine1, 'hi'),
          postEn: getStr(p.address?.postOffice, 'en'),
          postHi: getStr(p.address?.postOffice, 'hi'),
          policeStationEn: getStr(p.address?.policeStation, 'en'),
          policeStationHi: getStr(p.address?.policeStation, 'hi'),
          state: getStr(p.address?.state),
          district: getStr(p.address?.city),
          pinCode: p.address?.pincode || '',
          // Step 3
          isLiterate: p.education?.isLiterate ?? true,
          collegeEn: getStr(p.education?.college, 'en'),
          collegeHi: getStr(p.education?.college, 'hi'),
          degreeEn: getStr(p.education?.degree, 'en'),
          degreeHi: getStr(p.education?.degree, 'hi'),
          percentage: p.education?.percentage || '',
          passingYear: p.education?.passingYear || '',
          extraQualificationEn: getStr(p.education?.extraQualification, 'en'),
          extraQualificationHi: getStr(p.education?.extraQualification, 'hi'),
          // Step 4
          jobType: p.employment?.jobType || '',
          organizationEn: getStr(p.employment?.organization, 'en'),
          organizationHi: getStr(p.employment?.organization, 'hi'),
          designationEn: getStr(p.employment?.designation, 'en'),
          designationHi: getStr(p.employment?.designation, 'hi'),
          workLocationEn: getStr(p.employment?.workLocation, 'en'),
          workLocationHi: getStr(p.employment?.workLocation, 'hi'),
          annualIncome: p.employment?.annualIncome || '',
          // Step 5
          fatherNameEn: getStr(p.family?.fatherName, 'en'),
          fatherNameHi: getStr(p.family?.fatherName, 'hi'),
          motherNameEn: getStr(p.family?.motherName, 'en'),
          motherNameHi: getStr(p.family?.motherName, 'hi'),
          noOfBrothers: p.family?.noOfBrothers || '',
          noOfSisters: p.family?.noOfSisters || '',
          familyType: p.family?.familyType || '',
          lifestyleStatus: p.family?.lifestyleStatus || '',
          // Step 6
          religion: p.cultural?.religion || '',
          caste: p.cultural?.caste || '',
          subCasteEn: getStr(p.cultural?.subCaste, 'en'),
          subCasteHi: getStr(p.cultural?.subCaste, 'hi'),
          languageEn: '',
          languageHi: '',
          // Step 7
          height: p.physical?.height || '',
          weight: p.physical?.weight || '',
          bodyType: p.physical?.bodyType || '',
          complexion: p.physical?.complexion || '',
          physicallyChallenged: p.physical?.physicallyChallenged || false,
        }));
      } catch (err) {
        console.error('Error fetching profile for edit:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchAndFillProfile();
  }, [isOpen, editUser]);

  // ─── TRANSLITERATION using Google Input Tools API ───
  // The user requested phonetic transliteration (e.g., "creator" -> "क्रिएटर") instead of translation

  const useAutoTranslate = (sourceText: string, targetKey: string) => {
    useEffect(() => {
      const timer = setTimeout(async () => {
        if (!sourceText.trim()) {
          setFormData(prev => ({ ...prev, [targetKey]: '' }));
          return;
        }
        setTranslatingFields(prev => ({ ...prev, [targetKey]: true }));
        try {
          const res = await fetch(
            `https://inputtools.google.com/request?text=${encodeURIComponent(sourceText)}&itc=hi-t-i0-und&num=1`
          );
          const data = await res.json();
          if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
            const transliteratedText = data[1][0][1][0];
            setFormData(prev => ({ ...prev, [targetKey]: transliteratedText }));
          }
        } catch (err) {
          console.error('Transliteration error:', err);
        } finally {
          setTranslatingFields(prev => ({ ...prev, [targetKey]: false }));
        }
      }, 800);
      return () => clearTimeout(timer);
    }, [sourceText, targetKey]);
  };

  // We use the same transliteration logic for all fields
  const useAutoTransliterate = (sourceText: string, targetKey: string) => {
    useEffect(() => {
      const timer = setTimeout(async () => {
        if (!sourceText.trim()) {
          setFormData(prev => ({ ...prev, [targetKey]: '' }));
          return;
        }
        setTranslatingFields(prev => ({ ...prev, [targetKey]: true }));
        try {
          const res = await fetch(
            `https://inputtools.google.com/request?text=${encodeURIComponent(sourceText)}&itc=hi-t-i0-und&num=1`
          );
          const data = await res.json();
          if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
            const transliteratedText = data[1][0][1][0];
            setFormData(prev => ({ ...prev, [targetKey]: transliteratedText }));
          }
        } catch (err) {
          console.error('Transliteration error:', err);
        } finally {
          setTranslatingFields(prev => ({ ...prev, [targetKey]: false }));
        }
      }, 800);
      return () => clearTimeout(timer);
    }, [sourceText, targetKey]);
  };

  // ─── LOCATION DATA PROCESSING ───
  const uniqueStates = useMemo(() => {
    const isHi = formLanguage === 'hi';
    const states = new Set(locationData.map((item: any) => isHi ? (item.stateHi || item.state) : item.state));
    return Array.from(states).sort();
  }, [formLanguage]);

  const availableDistricts = useMemo(() => {
    if (!formData.state) return [];
    const isHi = formLanguage === 'hi';
    const stateField = isHi ? 'stateHi' : 'state';
    const nameField = isHi ? 'nameHi' : 'name';

    return locationData
      .filter((item: any) => item[stateField] === formData.state || item.state === formData.state)
      .map((item: any) => item[nameField] || item.name)
      .sort();
  }, [formData.state, formLanguage]);
  // ─── RELIGION / CASTE DATA PROCESSING ───
  const uniqueReligions = useMemo(() => {
    return religionData.map((r: any) => ({
      value: r.religion,
      label: formLanguage === 'hi' ? r.religionHi : r.religion,
    }));
  }, [formLanguage]);

  const availableCastes = useMemo(() => {
    if (!formData.religion) return [];
    const entry = religionData.find((r: any) => r.religion === formData.religion);
    if (!entry) return [];
    return entry.castes.map((c: any) => ({
      value: c.name,
      label: formLanguage === 'hi' ? c.nameHi : c.name,
    }));
  }, [formData.religion, formLanguage]);

  // When language changes, clear caste to prevent mismatch
  useEffect(() => {
    setFormData(prev => ({ ...prev, caste: '' }));
  }, [formLanguage]);


  useEffect(() => {
    setFormData(prev => ({ ...prev, state: '', district: '' }));
  }, [formLanguage]);

  // About Me → Transliteration (convert Roman script to Hindi script)
  useAutoTransliterate(formData.aboutMeEn, 'aboutMeHi');

  // Address fields → Transliteration (proper nouns, places)
  useAutoTransliterate(formData.placeEn, 'placeHi');
  useAutoTransliterate(formData.postEn, 'postHi');
  useAutoTransliterate(formData.policeStationEn, 'policeStationHi');
  
  // Education fields → Transliteration
  useAutoTransliterate(formData.collegeEn, 'collegeHi');
  useAutoTransliterate(formData.degreeEn, 'degreeHi');
  useAutoTransliterate(formData.extraQualificationEn, 'extraQualificationHi');
  
  // Employment fields → Transliteration
  useAutoTransliterate(formData.organizationEn, 'organizationHi');
  useAutoTransliterate(formData.designationEn, 'designationHi');
  useAutoTransliterate(formData.workLocationEn, 'workLocationHi');
  
  // Family fields → Transliteration
  useAutoTransliterate(formData.fatherNameEn, 'fatherNameHi');
  useAutoTransliterate(formData.motherNameEn, 'motherNameHi');
  
  // Cultural fields → Transliteration
  useAutoTransliterate(formData.subCasteEn, 'subCasteHi');
  useAutoTransliterate(formData.languageEn, 'languageHi');

  const getAgeDisplay = (dobStr: string) => {
    if (!dobStr) return '';
    const dob = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return formLanguage === 'hi' ? `उम्र: ${age} वर्ष` : `Age: ${age} years`;
  };

  const validateStep = (): string[] => {
    const errors: string[] = [];
    if (step === 1) {
      if (String(formData.phone || '').trim() && String(formData.phone || '').length < 10) errors.push('Valid 10-digit Phone Number is required.');
      if (String(formData.email || '').trim() && !String(formData.email || '').includes('@')) errors.push('Valid Email Address is required.');

      if (formData.dob) {
        const selectedDate = new Date(formData.dob);
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
        eighteenYearsAgo.setHours(0, 0, 0, 0);
        
        if (selectedDate > eighteenYearsAgo) {
          errors.push('User must be at least 18 years old.');
        }
      }
    }
    if (step === 2) {
      if (String(formData.pinCode || '').trim() && String(formData.pinCode || '').trim().length !== 6) errors.push('Valid 6-digit PIN Code is required.');
    }
    return errors;
  };

  const handleNext = async () => {
    const errors = validateStep();
    if (errors.length > 0) {
      setStepErrors(errors);
      return;
    }
    setStepErrors([]);
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      // ── FINAL SUBMIT ──
      setIsSubmitting(true);
      try {
        // 1. Upload files to Firebase Storage (each file is optional)
        const uploadFile = async (file: File | null, path: string): Promise<string> => {
          if (!file) return '';
          try {
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, file);
            return await getDownloadURL(storageRef);
          } catch (uploadErr: any) {
            console.warn(`File upload skipped for ${path}:`, uploadErr?.message || uploadErr);
            return ''; // Don't block the whole submit if one file fails
          }
        };

        const uid = `profile_${Date.now()}`;
        const basePath = `metrimony_profiles/${uid}`;

        console.log('Starting file uploads...');
        const profileImageUrl = await uploadFile(formData.profileImage, `${basePath}/profileImage`);
        console.log('Files uploaded. Saving to Firestore...');

        // 2. Build the structured Firestore document
        const profileData: Record<string, any> = {
          personalInfo: {
            dob: formData.dob,
          },
          address: {
            addressLine1: { en: formData.placeEn, hi: formData.placeHi },
            city:    { en: formData.district, hi: formData.district },
            state:   { en: formData.state,    hi: formData.state },
            pincode: formData.pinCode,
          },
          education: {
            isLiterate: formData.isLiterate,
            college:            { en: formData.collegeEn,            hi: formData.collegeHi },
            degree:             { en: formData.degreeEn,             hi: formData.degreeHi },
            extraQualification: extraQualifications.length > 0
              ? { en: extraQualifications.map(q => q.en).join(', '), hi: extraQualifications.map(q => q.hi).join(', ') }
              : { en: formData.extraQualificationEn, hi: formData.extraQualificationHi },
            extraQualifications: extraQualifications,
          },
          employment: {
            jobType:      formData.jobType,
            organization: { en: formData.organizationEn, hi: formData.organizationHi },
            designation:  { en: formData.designationEn,  hi: formData.designationHi },
            workLocation: { en: formData.workLocationEn,  hi: formData.workLocationHi },
            annualIncome: formData.annualIncome,
          },
          family: {
            fatherName:      { en: formData.fatherNameEn, hi: formData.fatherNameHi },
            motherName:      { en: formData.motherNameEn, hi: formData.motherNameHi },
            noOfBrothers:    formData.noOfBrothers,
            noOfSisters:     formData.noOfSisters,
            familyType:      formData.familyType,
            lifestyleStatus: formData.lifestyleStatus,
          },
          cultural: {
            religion: formData.religion,
            caste:    formData.caste,
            language: knownLanguages.length > 0
              ? { en: knownLanguages.map(l => l.en).join(', '), hi: knownLanguages.map(l => l.hi).join(', ') }
              : { en: formData.languageEn, hi: formData.languageHi },
            languages: knownLanguages,
          },
          physical: {
            height:              formData.height,
            weight:              formData.weight,
            bodyType:            formData.bodyType,
            complexion:          formData.complexion,
            physicallyChallenged: formData.physicallyChallenged,
          },
          mediaUrls: {
            profileImage:    profileImageUrl || existingMediaUrls?.profileImage || '',
          },
          source: isEditMode ? (existingMediaUrls ? 'admin_panel' : 'admin_panel') : 'admin_panel',
          status: 'active',
        };

        // Basic user fields for users collection
        const userDocData = {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          gender: formData.gender,
          role: 'user',
          isProfileCreated: true,
        };

        if (isEditMode && editUser) {
          // ── EDIT MODE: Update existing documents ──
          console.log('Updating user profile in edit mode...');

          // Update users collection
          await updateDoc(doc(db, 'users', editUser.uid), userDocData);

          // Update metrimony_profiles document
          if (existingProfileId) {
            await updateDoc(doc(db, 'metrimony_profiles', existingProfileId), {
              ...profileData,
              userId: editUser.uid,
              updatedAt: serverTimestamp(),
            });
            console.log('Profile updated successfully!');
          } else {
            // No existing profile - create new
            await addDoc(collection(db, 'metrimony_profiles'), {
              ...profileData,
              userId: editUser.uid,
              createdAt: serverTimestamp(),
            });
            console.log('New profile created for existing user!');
          }
        } else {
          // ── ADD MODE: Create new documents ──
          const userDocRef = await addDoc(collection(db, 'users'), {
            ...userDocData,
            platform: 'admin_panel',
            source: 'admin_panel',
            agentId: '',
            createdAt: serverTimestamp(),
          });
          const userId = userDocRef.id;
          console.log('User doc created! ID:', userId);

          const docRef = await addDoc(collection(db, 'metrimony_profiles'), {
            ...profileData,
            userId,
            createdAt: serverTimestamp(),
          });
          console.log('Profile saved successfully! Doc ID:', docRef.id);
        }

        setSubmitSuccess(true);
        queryClient.invalidateQueries({ queryKey: ['users'] });
        onAdd({ ...profileData });
        setTimeout(() => {
          setSubmitSuccess(false);
          onClose();
        }, 1500);

      } catch (err: any) {
        const msg = err?.message || String(err);
        console.error('Submit error:', msg, err);
        setStepErrors([`Failed to save profile: ${msg}. Check browser console for details.`]);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-3xl bg-[var(--bg-card)] shadow-xl transition-all border border-[var(--border)]">
                
                {/* Header (Language, Step, Title) */}
                <div className="p-6 pb-2 relative">
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-muted)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl font-medium text-[var(--text)]">
                      Step {step} / {totalSteps}
                    </span>
                    <div className="mr-8">
                      {/* Language Toggle */}
                      <button
                        onClick={() => setFormLanguage(prev => prev === 'en' ? 'hi' : 'en')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(124,92,252,0.1)] hover:bg-[rgba(124,92,252,0.2)] transition-colors border border-[rgba(124,92,252,0.2)]"
                        title="Toggle Language"
                      >
                        <Type className="w-4 h-4 text-[#7c5cfc]" />
                        <span className="text-xs font-semibold text-[#7c5cfc]">
                          {formLanguage === 'en' ? 'English' : 'हिन्दी'}
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-semibold text-[var(--text)] mb-6">
                    {isEditMode ? '✏️ Edit Profile' : ''}
                    {!isEditMode && step === 1 && "Create Identity"}
                    {!isEditMode && step === 2 && "Address Details"}
                    {!isEditMode && step === 3 && "Education Details"}
                    {!isEditMode && step === 4 && "Employment Details"}
                    {!isEditMode && step === 5 && "Family Details"}
                    {!isEditMode && step === 6 && "Add Cultural Details"}
                    {!isEditMode && step === 7 && "Physical Details"}
                    {!isEditMode && step === 8 && "Upload Profile Images"}
                    {!isEditMode && step === 9 && "Review & Submit"}
                    {isEditMode && step === 1 && " — Create Identity"}
                    {isEditMode && step === 2 && " — Address Details"}
                    {isEditMode && step === 3 && " — Education Details"}
                    {isEditMode && step === 4 && " — Employment Details"}
                    {isEditMode && step === 5 && " — Family Details"}
                    {isEditMode && step === 6 && " — Cultural Details"}
                    {isEditMode && step === 7 && " — Physical Details"}
                    {isEditMode && step === 8 && " — Profile Images"}
                    {isEditMode && step === 9 && " — Review & Update"}
                  </h2>
                </div>

                {/* Loading Overlay when fetching profile in edit mode */}
                {isLoadingProfile && (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="w-10 h-10 text-[#7c5cfc] animate-spin" />
                    <p className="text-sm text-[var(--text-muted)]">Loading profile details...</p>
                  </div>
                )}

                {/* Form Content */}
                <div className="px-6 space-y-2 max-h-[60vh] overflow-y-auto">
                  {step === 1 && (
                    <>
                      {/* Basic identity fields */}
                      <FormStepInput
                        label={formLanguage === 'hi' ? 'पूरा नाम (Full Name)' : 'Full Name'}
                        icon={User}
                        placeholder={formLanguage === 'hi' ? 'पूरा नाम दर्ज करें' : 'Enter full name'}
                        value={formData.fullName}
                        onChange={(e: any) => setFormData({ ...formData, fullName: e.target.value })}
                      />

                      <FormStepInput
                        label={formLanguage === 'hi' ? 'फ़ोन नंबर (Phone Number)' : 'Phone Number'}
                        iconText="📞"
                        placeholder={formLanguage === 'hi' ? '10-अंकीय मोबाइल नंबर' : '10-digit mobile number'}
                        maxLength={10}
                        value={formData.phone}
                        onChange={(e: any) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      />

                      <FormStepInput
                        label={formLanguage === 'hi' ? 'ईमेल (Email Address)' : 'Email Address'}
                        iconText="@"
                        type="email"
                        placeholder={formLanguage === 'hi' ? 'ईमेल दर्ज करें' : 'Enter email address'}
                        value={formData.email}
                        onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                      />

                      {/* Gender Select */}
                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">{formLanguage === 'hi' ? 'लिंग (Gender)' : 'Gender'}</div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <UserPlus className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="male">{formLanguage === 'hi' ? 'पुरुष (Male)' : 'Male'}</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="female">{formLanguage === 'hi' ? 'महिला (Female)' : 'Female'}</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>


                      <FormStepInput
                        label={formLanguage === 'hi' ? 'जन्म तिथि (Date of Birth)' : 'Date of Birth'}
                        icon={Calendar}
                        type="date"
                        value={formData.dob}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e: any) => setFormData({ ...formData, dob: e.target.value })}
                        hint={getAgeDisplay(formData.dob)}
                      />
                    </>
                  )}

                  {step === 2 && (
                    <>
                      {formLanguage === 'en' && (
                        <FormStepInput
                          label="Place (English)"
                          iconText="ABC"
                          placeholder="Type in English to transliterate"
                          value={formData.placeEn}
                          onChange={(e: any) => setFormData({ ...formData, placeEn: e.target.value })}
                        />
                      )}
                      {formLanguage === 'hi' && (
                        <FormStepInput
                          label="स्थान (Place)"
                          icon={MapPin}
                          placeholder={formLanguage === 'hi' ? 'अपना गांव, सड़क या मोहल्ला दर्ज करें' : 'Enter your village, street, or locality'}
                          value={formData.placeHi}
                          isLoading={translatingFields.placeHi}
                          hint={translatingFields.placeHi ? 'Translating...' : ''}
                          onChange={(e: any) => setFormData({ ...formData, placeHi: e.target.value })}
                        />
                      )}

                      {/* Select Dropdowns for State/District */}
                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                          {formLanguage === 'hi' ? 'राज्य (State)' : 'State'}
                        </div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value, district: '' })}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="">
                              {formLanguage === 'hi' ? 'राज्य चुनें' : 'Select state'}
                            </option>
                            {uniqueStates.map(state => (
                              <option className="bg-[var(--bg-surface)] text-[var(--text)]" key={state as string} value={state as string}>{state as string}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>

                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                          {formLanguage === 'hi' ? 'ज़िला (District)' : 'District'}
                        </div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.district}
                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            disabled={!formData.state}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer disabled:opacity-50"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="">
                              {formLanguage === 'hi' ? 'ज़िला चुनें' : 'Select district'}
                            </option>
                            {availableDistricts.map((district, index) => (
                              <option className="bg-[var(--bg-surface)] text-[var(--text)]" key={`${district}-${index}`} value={district as string}>{district as string}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>

                      <FormStepInput
                        label={formLanguage === 'hi' ? 'पिन कोड (PIN Code)' : 'PIN Code'}
                        iconText="#"
                        placeholder={formLanguage === 'hi' ? '6-अंकीय पिन दर्ज करें' : 'Enter 6-digit PIN'}
                        maxLength={6}
                        type="number"
                        hint={`${formData.pinCode.length} characters`}
                        value={formData.pinCode}
                        onChange={(e: any) => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      />
                    </>
                  )}

                  {step === 3 && (
                    <>
                      {/* Literate / Illiterate Toggle */}
                      <div className="flex border border-[#a32b36] rounded-full overflow-hidden mb-6 mt-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isLiterate: true })}
                          className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                            formData.isLiterate ? 'bg-[#a32b36] text-white' : 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                          }`}
                        >
                          Literate
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isLiterate: false })}
                          className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                            !formData.isLiterate ? 'bg-[#a32b36] text-white' : 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                          }`}
                        >
                          Illiterate
                        </button>
                      </div>

                      {formData.isLiterate && (
                        <>
                          <div className="text-[#a32b36] font-semibold text-sm mb-4 px-2 bg-[#a32b3615] py-2 rounded-lg inline-block w-full">
                            Highest Qualification
                          </div>

                          <FormStepInput
                            label="College / University (English)"
                            iconText="ABC"
                            placeholder="Type in English to transliterate"
                            value={formData.collegeEn}
                            onChange={(e: any) => setFormData({ ...formData, collegeEn: e.target.value })}
                          />
                          <FormStepInput
                            label="College / University (हिन्दी)"
                            icon={GraduationCap}
                            placeholder="Enter college or university name"
                            value={formData.collegeHi}
                            isLoading={translatingFields.collegeHi}
                            hint={translatingFields.collegeHi ? 'Translating...' : ''}
                            onChange={(e: any) => setFormData({ ...formData, collegeHi: e.target.value })}
                          />

                          {/* Degree Dropdown from Firebase master_degrees */}
                          <div className="relative mt-3 mb-4">
                            <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                              Degree / Course
                            </div>
                            <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                                <Book className="w-5 h-5" />
                              </div>
                              <select
                                value={formData.degreeEn}
                                onChange={(e) => {
                                  const selected = masterQualifications.find(q => q.en === e.target.value);
                                  setFormData({ ...formData, degreeEn: e.target.value, degreeHi: selected?.hi || e.target.value });
                                }}
                                className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer"
                              >
                                <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="">Select degree / course</option>
                                {isMasterLoading
                                  ? <option disabled>Loading...</option>
                                  : masterQualifications.length > 0
                                    ? masterQualifications.map((d, i) => (
                                      <option className="bg-[var(--bg-surface)] text-[var(--text)]" key={i} value={d.en}>
                                        {formLanguage === 'en' ? d.en : d.hi}
                                      </option>
                                    ))
                                    : <option disabled>No data found</option>
                                }
                              </select>
                              <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                            </div>
                          </div>


                          <div className="text-[#a32b36] font-semibold text-sm mb-4 mt-4 px-2 bg-[#a32b3615] py-2 rounded-lg inline-block w-full">
                            Additional Qualifications
                          </div>
                          
                          <FormStepInput
                            label="Add Extra Qualification (English)"
                            iconText="ABC"
                            placeholder="Type in English to transliterate"
                            value={formData.extraQualificationEn}
                            onChange={(e: any) => setFormData({ ...formData, extraQualificationEn: e.target.value })}
                          />
                          <FormStepInput
                            label="Add Extra Qualification (हिन्दी)"
                            icon={PlusCircle}
                            placeholder="e.g., Computer Course, Diploma"
                            value={formData.extraQualificationHi}
                            isLoading={translatingFields.extraQualificationHi}
                            hint={translatingFields.extraQualificationHi ? 'Translating...' : ''}
                            onChange={(e: any) => setFormData({ ...formData, extraQualificationHi: e.target.value })}
                          />

                          {/* Show added qualifications as chips */}
                          {extraQualifications.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {extraQualifications.map((q, i) => (
                                <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(124,92,252,0.15)] border border-[rgba(124,92,252,0.3)] text-sm">
                                  <span className="text-[var(--text)]">{q.en}</span>
                                  {q.hi && <span className="text-[var(--text-muted)] text-xs">({q.hi})</span>}
                                  <button
                                    type="button"
                                    onClick={() => setExtraQualifications(prev => prev.filter((_, idx) => idx !== i))}
                                    className="text-[var(--text-muted)] hover:text-red-400 ml-1 font-bold"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (!formData.extraQualificationEn.trim()) return;
                              setExtraQualifications(prev => [
                                ...prev,
                                { en: formData.extraQualificationEn.trim(), hi: formData.extraQualificationHi.trim() }
                              ]);
                              setFormData(prev => ({ ...prev, extraQualificationEn: '', extraQualificationHi: '' }));
                            }}
                            className="w-full bg-[#e84c3d] hover:bg-[#c0392b] text-white py-3 rounded-full font-semibold mt-2 mb-2 transition-colors"
                          >
                            Add Qualification
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {step === 4 && (
                    <>
                      {/* Job Type Dropdown */}
                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                          Job Type
                        </div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.jobType}
                            onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="">Select job type</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Private">Private</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Government">Government</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Business">Business</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Self Employed">Self Employed</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Not Working">Not Working</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>

                      <FormStepInput
                        label="Organization (English)"
                        iconText="ABC"
                        placeholder="Type in English to transliterate"
                        value={formData.organizationEn}
                        onChange={(e: any) => setFormData({ ...formData, organizationEn: e.target.value })}
                      />
                      <FormStepInput
                        label="Organization (हिन्दी)"
                        icon={Building}
                        placeholder="Enter your organization name"
                        value={formData.organizationHi}
                        isLoading={translatingFields.organizationHi}
                        hint={translatingFields.organizationHi ? 'Translating...' : ''}
                        onChange={(e: any) => setFormData({ ...formData, organizationHi: e.target.value })}
                      />

                      {/* Designation Dropdown */}
                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                          {formLanguage === 'hi' ? 'पद / नौकरी (Designation)' : 'Designation'}
                        </div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.designationEn}
                            onChange={(e) => {
                              const selected = masterDesignations.find(d => d.en === e.target.value);
                              setFormData({ ...formData, designationEn: e.target.value, designationHi: selected?.hi || e.target.value });
                            }}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="">{formLanguage === 'hi' ? 'पद चुनें' : 'Select designation'}</option>
                            {isMasterLoading
                              ? <option disabled>Loading...</option>
                              : masterDesignations.length > 0
                                ? masterDesignations.map((d, i) => (
                                  <option className="bg-[var(--bg-surface)] text-[var(--text)]" key={i} value={d.en}>
                                    {formLanguage === 'en' ? d.en : d.hi}
                                  </option>
                                ))
                                : (
                                  <>
                                    <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="IAS Officer">IAS Officer</option>
                                    <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="IPS Officer">IPS Officer</option>
                                    <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Government Doctor">Government Doctor</option>
                                    <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Software Engineer">Software Engineer</option>
                                    <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Business Owner">Business Owner</option>
                                    <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Not Working">Not Working</option>
                                    <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Other">Other</option>
                                  </>
                                )
                            }
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>


                      <FormStepInput
                        label="Work Location (English)"
                        iconText="ABC"
                        placeholder="Type in English to transliterate"
                        value={formData.workLocationEn}
                        onChange={(e: any) => setFormData({ ...formData, workLocationEn: e.target.value })}
                      />
                      <FormStepInput
                        label="Work Location (हिन्दी)"
                        icon={MapPin}
                        placeholder="Enter your work location"
                        value={formData.workLocationHi}
                        isLoading={translatingFields.workLocationHi}
                        hint={translatingFields.workLocationHi ? 'Translating...' : ''}
                        onChange={(e: any) => setFormData({ ...formData, workLocationHi: e.target.value })}
                      />

                      {/* Annual Income Dropdown from Firebase master_annual_income */}
                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                          Annual Income
                        </div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <IndianRupee className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.annualIncome}
                            onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="">Select annual income</option>
                            {isMasterLoading
                              ? <option disabled>Loading...</option>
                              : masterAnnualIncomes.length > 0
                                ? masterAnnualIncomes.map((inc, i) => (
                                  <option className="bg-[var(--bg-surface)] text-[var(--text)]" key={i} value={inc.en}>
                                    {formLanguage === 'en' ? inc.en : inc.hi}
                                  </option>
                                ))
                                : <option disabled>No data found</option>
                            }
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>
                    </>
                  )}

                  {step === 5 && (
                    <>
                      <FormStepInput
                        label="Father's Name (English)"
                        iconText="ABC"
                        placeholder="Type in English to transliterate"
                        value={formData.fatherNameEn}
                        onChange={(e: any) => setFormData({ ...formData, fatherNameEn: e.target.value })}
                      />
                      <FormStepInput
                        label="Father's Name (हिन्दी)"
                        icon={User}
                        placeholder="Enter your father's name"
                        value={formData.fatherNameHi}
                        isLoading={translatingFields.fatherNameHi}
                        hint={translatingFields.fatherNameHi ? 'Translating...' : ''}
                        onChange={(e: any) => setFormData({ ...formData, fatherNameHi: e.target.value })}
                      />

                      <FormStepInput
                        label="Mother's Name (English)"
                        iconText="ABC"
                        placeholder="Type in English to transliterate"
                        value={formData.motherNameEn}
                        onChange={(e: any) => setFormData({ ...formData, motherNameEn: e.target.value })}
                      />
                      <FormStepInput
                        label="Mother's Name (हिन्दी)"
                        icon={User}
                        placeholder="Enter your mother's name"
                        value={formData.motherNameHi}
                        isLoading={translatingFields.motherNameHi}
                        hint={translatingFields.motherNameHi ? 'Translating...' : ''}
                        onChange={(e: any) => setFormData({ ...formData, motherNameHi: e.target.value })}
                      />

                      <FormStepInput
                        label="Number of Brothers"
                        icon={Users}
                        type="number"
                        placeholder="Enter number of brothers"
                        value={formData.noOfBrothers}
                        onChange={(e: any) => setFormData({ ...formData, noOfBrothers: e.target.value })}
                      />

                      <FormStepInput
                        label="Number of Sisters"
                        icon={Users}
                        type="number"
                        placeholder="Enter number of sisters"
                        value={formData.noOfSisters}
                        onChange={(e: any) => setFormData({ ...formData, noOfSisters: e.target.value })}
                      />

                      {/* Family Type Dropdown */}
                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                          {formLanguage === 'hi' ? 'परिवार का प्रकार (Family Type)' : 'Family Type'}
                        </div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <Users className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.familyType}
                            onChange={(e) => setFormData({ ...formData, familyType: e.target.value })}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="" disabled hidden>{formLanguage === 'hi' ? 'परिवार का प्रकार चुनें' : 'Select family type'}</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Joint Family">{formLanguage === 'hi' ? 'संयुक्त परिवार (Joint)' : 'Joint Family'}</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Nuclear Family">{formLanguage === 'hi' ? 'एकल परिवार (Nuclear)' : 'Nuclear Family'}</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Prefer not to say">{formLanguage === 'hi' ? 'कहना नहीं चाहते (Prefer not to say)' : 'Prefer not to say'}</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>

                      {/* Lifestyle Status Dropdown */}
                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                          {formLanguage === 'hi' ? 'जीवनशैली (LifeStyle Status)' : 'LifeStyle Status'}
                        </div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <Users className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.lifestyleStatus}
                            onChange={(e) => setFormData({ ...formData, lifestyleStatus: e.target.value })}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="" disabled hidden>{formLanguage === 'hi' ? 'जीवनशैली चुनें' : 'Select lifestyle status'}</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Prefer not to say">{formLanguage === 'hi' ? 'कहना नहीं चाहते' : 'Prefer not to say'}</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Simple Lifestyle">{formLanguage === 'hi' ? 'सरल जीवनशैली' : 'Simple Lifestyle'}</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Moderate Lifestyle">{formLanguage === 'hi' ? 'मध्यम जीवनशैली' : 'Moderate Lifestyle'}</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Comfortable Lifestyle">{formLanguage === 'hi' ? 'आरामदायक जीवनशैली' : 'Comfortable Lifestyle'}</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Well-established Lifestyle">{formLanguage === 'hi' ? 'सुस्थापित जीवनशैली' : 'Well-established Lifestyle'}</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>
                    </>
                  )}

                  {step === 6 && (
                    <>
                      {/* Religion Dropdown */}
                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                          {formLanguage === 'hi' ? 'धर्म (Religion)' : 'Religion'}
                        </div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <CircleDot className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.religion}
                            onChange={(e) => setFormData({ ...formData, religion: e.target.value, caste: '' })}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="">{formLanguage === 'hi' ? 'धर्म चुनें' : 'Select religion'}</option>
                            {uniqueReligions.map((r: any) => (
                              <option className="bg-[var(--bg-surface)] text-[var(--text)]" key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>

                      {/* Caste Dropdown - dynamic based on religion */}
                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                          {formLanguage === 'hi' ? 'जाति (Caste)' : 'Caste'}
                        </div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <CircleDot className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.caste}
                            onChange={(e) => setFormData({ ...formData, caste: e.target.value })}
                            disabled={!formData.religion}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer disabled:opacity-50"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="">{formLanguage === 'hi' ? 'जाति चुनें' : 'Select caste'}</option>
                            {availableCastes.map((c: any) => (
                              <option className="bg-[var(--bg-surface)] text-[var(--text)]" key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>



                      <div className="text-[#a32b36] font-semibold text-sm mb-4 mt-6 px-2 bg-[#a32b3615] py-2 rounded-lg inline-block w-full">
                        Add Known Languages
                      </div>

                      <FormStepInput
                        label="Add Known Languages (English)"
                        iconText="ABC"
                        placeholder="e.g., English, Hindi"
                        value={formData.languageEn}
                        onChange={(e: any) => setFormData({ ...formData, languageEn: e.target.value })}
                      />
                      <FormStepInput
                        label="Add Known Languages (हिन्दी)"
                        icon={Globe}
                        placeholder="Enter language"
                        value={formData.languageHi}
                        isLoading={translatingFields.languageHi}
                        hint={translatingFields.languageHi ? 'Translating...' : ''}
                        onChange={(e: any) => setFormData({ ...formData, languageHi: e.target.value })}
                      />

                      {/* Show added languages as chips */}
                      {knownLanguages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {knownLanguages.map((lang, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(163,43,54,0.15)] border border-[rgba(163,43,54,0.3)] text-sm">
                              <span className="text-[var(--text)]">{lang.en}</span>
                              {lang.hi && <span className="text-[var(--text-muted)] text-xs">({lang.hi})</span>}
                              <button
                                type="button"
                                onClick={() => setKnownLanguages(prev => prev.filter((_, idx) => idx !== i))}
                                className="text-[var(--text-muted)] hover:text-red-400 ml-1 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (!formData.languageEn.trim()) return;
                          setKnownLanguages(prev => [
                            ...prev,
                            { en: formData.languageEn.trim(), hi: formData.languageHi.trim() }
                          ]);
                          setFormData(prev => ({ ...prev, languageEn: '', languageHi: '' }));
                        }}
                        className="w-full bg-[#a32b36] hover:bg-[#8a242d] text-white py-3 rounded-2xl font-semibold mt-2 mb-2 transition-colors"
                      >
                        Add Language
                      </button>
                    </>
                  )}


                  {step === 7 && (
                    <>
                      {/* Height Dropdown */}
                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                          Height (in cm)
                        </div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <Ruler className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.height}
                            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="">Select height</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="152 cm (5'0&quot;)">152 cm (5'0")</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="155 cm (5'1&quot;)">155 cm (5'1")</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="157 cm (5'2&quot;)">157 cm (5'2")</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="160 cm (5'3&quot;)">160 cm (5'3")</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="162 cm (5'4&quot;)">162 cm (5'4")</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="165 cm (5'5&quot;)">165 cm (5'5")</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="167 cm (5'6&quot;)">167 cm (5'6")</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="170 cm (5'7&quot;)">170 cm (5'7")</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="172 cm (5'8&quot;)">172 cm (5'8")</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="175 cm (5'9&quot;)">175 cm (5'9")</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="177 cm (5'10&quot;)">177 cm (5'10")</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="180 cm (5'11&quot;)">180 cm (5'11")</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="182 cm (6'0&quot;)">182 cm (6'0")</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>

                      {/* Weight Dropdown */}
                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                          Weight (in kg)
                        </div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <Scale className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="">Select weight</option>
                            {Array.from({ length: 71 }, (_, i) => i + 40).map((kg) => (
                              <option className="bg-[var(--bg-surface)] text-[var(--text)]" key={kg} value={`${kg} kg`}>{kg} kg</option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>

                      {/* Body Type Dropdown */}
                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                          Please select a body type
                        </div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <CircleDot className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.bodyType}
                            onChange={(e) => setFormData({ ...formData, bodyType: e.target.value })}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="">Select body type</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Slim">Slim</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Average">Average</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Athletic">Athletic</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Heavy">Heavy</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>

                      {/* Complexion Dropdown */}
                      <div className="relative mt-3 mb-4">
                        <div className="absolute -top-2 left-4 px-1 bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] z-10">
                          Please select a complexion
                        </div>
                        <div className="flex items-center border border-[var(--border)] rounded-[1.5rem] p-2 bg-[var(--bg-surface)] focus-within:border-[#7c5cfc] transition-colors relative">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[rgba(232,86,106,0.15)] text-[#e8568a] mr-3">
                            <CircleDot className="w-5 h-5" />
                          </div>
                          <select
                            value={formData.complexion}
                            onChange={(e) => setFormData({ ...formData, complexion: e.target.value })}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text)] font-medium appearance-none cursor-pointer"
                          >
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="">Select complexion</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Fair">Fair</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Very Fair">Very Fair</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Wheatish">Wheatish</option>
                            <option className="bg-[var(--bg-surface)] text-[var(--text)]" value="Dark">Dark</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[var(--text-dim)] absolute right-4 pointer-events-none" />
                        </div>
                      </div>

                      {/* Physically Challenged Toggle Switch */}
                      <div className="flex items-center justify-between p-3 mt-4 mb-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[1.5rem]">
                        <span className="text-sm font-medium text-[var(--text)] ml-2">Physically Challenged</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, physicallyChallenged: !formData.physicallyChallenged })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formData.physicallyChallenged ? 'bg-[#a32b36]' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              formData.physicallyChallenged ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </>
                  )}

                  {step === 8 && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="relative mb-6">
                        <div className="w-40 h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {formData.profileImage ? (
                            <img 
                              src={URL.createObjectURL(formData.profileImage)} 
                              alt="Profile Preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : existingMediaUrls?.profileImage ? (
                            <img 
                              src={existingMediaUrls.profileImage} 
                              alt="Existing Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-20 h-20 text-gray-300" />
                          )}
                        </div>
                        <label className="absolute bottom-2 right-2 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer border border-gray-200 hover:bg-gray-50 transition-colors">
                          <Camera className="w-6 h-6 text-gray-600" />
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setFormData({ ...formData, profileImage: e.target.files[0] });
                              }
                            }}
                          />
                        </label>
                      </div>
                      
                      {formData.profileImage && (
                        <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-full font-medium text-sm">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Image uploaded successfully
                        </div>
                      )}
                    </div>
                  )}

                  {step === 9 && (
                    <>
                      <p className="text-xs text-[var(--text-muted)] mb-4">Please review all details before submitting. Click <strong>Back</strong> to make changes.</p>

                      {/* Step 1: Identity */}
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 mb-3">
                        <h3 className="text-sm font-bold text-[#7c5cfc] mb-3 uppercase tracking-wider">🪪 Identity</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div><p className="text-[10px] text-[var(--text-muted)]">Date of Birth</p><p className="text-sm text-[var(--text)] font-medium">{formData.dob || '—'}</p></div>
                        </div>
                      </div>

                      {/* Step 2: Address */}
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 mb-3">
                        <h3 className="text-sm font-bold text-[#7c5cfc] mb-3 uppercase tracking-wider">📍 Address</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div><p className="text-[10px] text-[var(--text-muted)]">Place</p><p className="text-sm text-[var(--text)] font-medium">{formData.placeEn || formData.placeHi || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">State</p><p className="text-sm text-[var(--text)] font-medium">{formData.state || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">District</p><p className="text-sm text-[var(--text)] font-medium">{formData.district || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">PIN Code</p><p className="text-sm text-[var(--text)] font-medium">{formData.pinCode || '—'}</p></div>
                        </div>
                      </div>

                      {/* Step 3: Education */}
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 mb-3">
                        <h3 className="text-sm font-bold text-[#7c5cfc] mb-3 uppercase tracking-wider">🎓 Education</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div><p className="text-[10px] text-[var(--text-muted)]">Literate</p><p className="text-sm text-[var(--text)] font-medium">{formData.isLiterate ? 'Yes' : 'No'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">College</p><p className="text-sm text-[var(--text)] font-medium truncate">{formData.collegeEn || formData.collegeHi || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Degree</p><p className="text-sm text-[var(--text)] font-medium">{formData.degreeEn || formData.degreeHi || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Extra Qualification</p><p className="text-sm text-[var(--text)] font-medium truncate">{formData.extraQualificationEn || formData.extraQualificationHi || '—'}</p></div>
                        </div>
                      </div>

                      {/* Step 4: Employment */}
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 mb-3">
                        <h3 className="text-sm font-bold text-[#7c5cfc] mb-3 uppercase tracking-wider">💼 Employment</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div><p className="text-[10px] text-[var(--text-muted)]">Job Type</p><p className="text-sm text-[var(--text)] font-medium">{formData.jobType || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Organization</p><p className="text-sm text-[var(--text)] font-medium truncate">{formData.organizationEn || formData.organizationHi || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Designation</p><p className="text-sm text-[var(--text)] font-medium truncate">{formData.designationEn || formData.designationHi || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Work Location</p><p className="text-sm text-[var(--text)] font-medium truncate">{formData.workLocationEn || formData.workLocationHi || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Annual Income</p><p className="text-sm text-[var(--text)] font-medium">{formData.annualIncome || '—'}</p></div>
                        </div>
                      </div>

                      {/* Step 5: Family */}
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 mb-3">
                        <h3 className="text-sm font-bold text-[#7c5cfc] mb-3 uppercase tracking-wider">👨‍👩‍👧‍👦 Family</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div><p className="text-[10px] text-[var(--text-muted)]">Father's Name</p><p className="text-sm text-[var(--text)] font-medium">{formData.fatherNameEn || formData.fatherNameHi || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Mother's Name</p><p className="text-sm text-[var(--text)] font-medium">{formData.motherNameEn || formData.motherNameHi || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Brothers</p><p className="text-sm text-[var(--text)] font-medium">{formData.noOfBrothers || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Sisters</p><p className="text-sm text-[var(--text)] font-medium">{formData.noOfSisters || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Family Type</p><p className="text-sm text-[var(--text)] font-medium">{formData.familyType || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Lifestyle</p><p className="text-sm text-[var(--text)] font-medium">{formData.lifestyleStatus || '—'}</p></div>
                        </div>
                      </div>

                      {/* Step 6: Cultural */}
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 mb-3">
                        <h3 className="text-sm font-bold text-[#7c5cfc] mb-3 uppercase tracking-wider">🕌 Cultural</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div><p className="text-[10px] text-[var(--text-muted)]">Religion</p><p className="text-sm text-[var(--text)] font-medium">{formData.religion || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Caste</p><p className="text-sm text-[var(--text)] font-medium">{formData.caste || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Language</p><p className="text-sm text-[var(--text)] font-medium">{formData.languageEn || formData.languageHi || '—'}</p></div>
                        </div>
                      </div>

                      {/* Step 7: Physical */}
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 mb-3">
                        <h3 className="text-sm font-bold text-[#7c5cfc] mb-3 uppercase tracking-wider">🏋️ Physical</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div><p className="text-[10px] text-[var(--text-muted)]">Height</p><p className="text-sm text-[var(--text)] font-medium">{formData.height || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Weight</p><p className="text-sm text-[var(--text)] font-medium">{formData.weight || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Body Type</p><p className="text-sm text-[var(--text)] font-medium">{formData.bodyType || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Complexion</p><p className="text-sm text-[var(--text)] font-medium">{formData.complexion || '—'}</p></div>
                          <div><p className="text-[10px] text-[var(--text-muted)]">Physically Challenged</p><p className="text-sm text-[var(--text)] font-medium">{formData.physicallyChallenged ? 'Yes' : 'No'}</p></div>
                        </div>
                      </div>

                      {/* Step 8: Documents */}
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 mb-3">
                        <h3 className="text-sm font-bold text-[#7c5cfc] mb-3 uppercase tracking-wider">📁 Uploaded Documents</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {[
                            { label: 'Profile Image', file: formData.profileImage, existing: existingMediaUrls?.profileImage },
                          ].map(({ label, file, existing }) => (
                            <div key={label}>
                              <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
                              <p className={`text-sm font-medium ${file || existing ? 'text-green-400' : 'text-[var(--text-dim)]'}`}>
                                {file ? `✓ ${(file as File).name.length > 16 ? (file as File).name.substring(0, 16) + '...' : (file as File).name}` : existing ? '✓ Uploaded' : '— Not uploaded'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Bottom Action Area */}
                <div className="p-6 pt-2 flex flex-col gap-3">
                  {/* Validation Error Messages */}
                  {stepErrors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/40 rounded-2xl px-4 py-3">
                      <p className="text-xs font-semibold text-red-400 mb-1">⚠ Please fix the following before proceeding:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {stepErrors.map((err, i) => (
                          <li key={i} className="text-xs text-red-300">{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-3">
                    {step > 1 && (
                      <button
                        onClick={() => { setStepErrors([]); handleBack(); }}
                        disabled={isSubmitting}
                        className="w-1/3 bg-transparent border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--text)] py-2 rounded-full font-semibold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Back
                      </button>
                    )}
                    {step < 9 && (
                      <button
                        onClick={() => { setStepErrors([]); setStep(prev => prev + 1); }}
                        disabled={isSubmitting}
                        className="w-1/3 bg-transparent border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--text)] py-2 rounded-full font-semibold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Skip
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      disabled={isSubmitting || submitSuccess}
                      className={`flex-1 py-2 rounded-full font-semibold text-base transition-all flex items-center justify-center gap-2 ${
                        submitSuccess
                          ? 'bg-green-600 text-white'
                          : 'bg-[#a32b36] hover:bg-[#8a242d] text-white disabled:opacity-60 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : submitSuccess ? (
                        '✓ Saved!'
                      ) : step === 9 ? (isEditMode ? 'Update' : 'Submit') : 'Next'}
                    </button>
                  </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
