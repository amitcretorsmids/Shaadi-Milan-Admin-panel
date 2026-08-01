import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
  addDoc,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
  setDoc,
  writeBatch,
  or,
} from 'firebase/firestore';
import { db } from './firebase'; // Your firebase config


import type {
  User, Agent, Order, PendingApproval, Notification,
  DashboardStats, MonthlyData, WeeklyData, OriginalAgent, OriginalUser
} from '@/types';
import { getFunctions, httpsCallable } from 'firebase/functions';

// ─── Helpers ───────────────────────────────────────────────────────────────
const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── Mock Data ──────────────────────────────────────────────────────────────
const STATES = ['Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Rajasthan', 'Gujarat', 'Maharashtra', 'Jharkhand', 'Karnataka'];
const DISTRICTS: Record<string, string[]> = {
  'Uttar Pradesh': ['Lucknow', 'Varanasi', 'Kanpur', 'Agra', 'Allahabad'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
};

const MALE_NAMES = ['Arjun Tiwari', 'Rahul Verma', 'Sunil Mishra', 'Manoj Dubey', 'Deepak Rao', 'Ashok Pandey', 'Raj Kumar', 'Vikram Singh', 'Aditya Sharma', 'Sanjay Gupta', 'Ravi Yadav', 'Amit Joshi', 'Naveen Kumar', 'Prakash Dubey', 'Dinesh Soni'];
const FEMALE_NAMES = ['Pooja Yadav', 'Anita Kumari', 'Rekha Singh', 'Kavita Joshi', 'Savita Devi', 'Lata Agarwal', 'Sita Devi', 'Geeta Sharma', 'Meena Gupta', 'Sunita Devi', 'Priya Sharma', 'Aarti Verma', 'Ritu Tiwari', 'Neha Chauhan', 'Seema Patel'];
const AGENT_NAMES = ['Rajesh Kumar', 'Priya Sharma', 'Amit Singh', 'Sunita Devi', 'Vikram Patel', 'Meena Gupta', 'Suresh Yadav', 'Kavita Mishra'];
const PLANS: Array<'Standard' | 'Premium' | 'VIP'> = ['Standard', 'Premium', 'VIP'];
const PLAN_PRICES = { Standard: 1999, Premium: 2999, VIP: 4999 };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ISSUES = ['Blurry photo', 'Invalid DOB', 'Missing documents', 'Name mismatch', 'Invalid phone', 'Duplicate entry'];




// ─── Helper Functions ───────────────────────────────────────────────────────
const convertUser = (doc: any): OriginalUser => {
  const data = doc.data();
  return {
    uid: doc.id,
    fullName: data.fullName || '',
    gender: data.gender || 'male',
    phone: data.phone || '',
    email: data.email || '',
    agentId: data.agentId || '',
    role: data.role || 'user',
    platform: data.platform || 'web',
    isProfileCreated: data.isProfileCreated || false,
    agentNotifiedOnRegister: data.agentNotifiedOnRegister || false,
    agentNotifiedAt: data.agentNotifiedAt,
    createdAt: data.createdAt,
    fcmToken: data.fcmToken,
    fcmTokenUpdatedAt: data.fcmTokenUpdatedAt,
  };
};

const convertAgent = (doc: any): OriginalAgent => {
  const data = doc.data();
  return {
    uid: doc.id,
    agentId: data.agentId || '',
    agentName: data.agentName || '',
    agentEmail: data.agentEmail || '',
    agentMobile: data.agentMobile || '',
    agentAddress: data.agentAddress || '',
    agentCity: data.agentCity || '',
    agentState: data.agentState || '',
    agentPincode: data.agentPincode || '',
    agentAadhar: data.agentAadhar || '',
    agentLicenseNumber: data.agentLicenseNumber || '',
    isApproved: data.isApproved || false,
    isRejected: data.isRejected || false,
    role: data.role || 'user',
    platform: data.platform || '',
    registrationDate: data.registrationDate || '',
    aadharUrl: data.aadharUrl,
    primaryImageUrl: data.primaryImageUrl,
    profileImageUrl: data.profileImageUrl,

  };
};
type UpdateAmountPayload = {
  id: string;
  data: {
    amount?: number;
    currency?: string;
    paymentType?: string;
  };
};

// ─── API Functions ──────────────────────────────────────────────────────────
export const firebaseApi = {
  functions: getFunctions(),

  createAgentWithAuth: async (data: {
    agentEmail: string;
    tempPassword: string;
    agentName: string;
    agentMobile: string;
    agentAddress: string;
    agentCity: string;
    agentState: string;
    agentPincode: string;
    agentAadhar: string;
    agentLicenseNumber: string;
    aadharUrl?: string;
    primaryImageUrl?: string;
    profileImageUrl?: string;
    isApproved?: boolean;
    isRejected?: boolean;
    role?: string;
    platform?: string;
    registrationDate?: string;
  }) => {
    try {
      // ─── Step 1: Create Firebase Auth user via REST API ───────────────────
      // This creates the login account without signing out the current admin
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (!apiKey) throw new Error('Firebase API key is missing from environment variables');

      const authResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.agentEmail,
            password: data.tempPassword,
            returnSecureToken: false, // Don't return a token — we just want the UID
          }),
        }
      );

      const authResult = await authResponse.json();

      let uid: string;

      if (!authResponse.ok || authResult.error) {
        const errorCode = authResult.error?.message || '';

        if (errorCode === 'EMAIL_EXISTS') {
          // ─── Email already exists in Firebase Auth ───────────────────────────
          // Try to sign in with the given credentials to get the UID
          const signInResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: data.agentEmail,
                password: data.tempPassword,
                returnSecureToken: false,
              }),
            }
          );

          const signInResult = await signInResponse.json();

          if (!signInResponse.ok || signInResult.error) {
            // Email exists but password doesn't match — inform user clearly
            throw new Error(
              `This email (${data.agentEmail}) is already registered in Firebase. ` +
              `Please use a different email address to create a new agent.`
            );
          }

          uid = signInResult.localId;
          console.warn('⚠️ Email already existed in Auth, reusing UID:', uid);

          // Check if Firestore agent doc already exists for this UID
          const existingSnap = await getDocs(query(collection(db, 'agents'), where('uid', '==', uid), limit(1)));
          if (!existingSnap.empty) {
            throw new Error(
              `An agent with email (${data.agentEmail}) already exists. Please use a different email address.`
            );
          }
        } else {
          const errorMsg = authResult.error?.message || 'Failed to create Firebase Auth account';
          console.error('❌ Firebase Auth creation failed:', authResult.error);
          throw new Error(errorMsg);
        }
      } else {
        uid = authResult.localId; // The Firebase Auth UID
      }

      console.log('✅ Firebase Auth user created/reused:', uid);

      // ─── Step 2: Generate unique agentId ──────────────────────────────────
      const generateUniqueAgentId = async (): Promise<string> => {
        let agentId = '';
        let exists = true;
        while (exists) {
          agentId = Math.floor(10000 + Math.random() * 9000000).toString();
          const snap = await getDocs(
            query(collection(db, 'agents'), where('agentId', '==', agentId), limit(1))
          );
          exists = !snap.empty;
        }
        return agentId;
      };

      const agentId = await generateUniqueAgentId();

      // ─── Step 3: Save agent data to Firestore using Auth UID ──────────────
      const agentRef = doc(db, 'agents', uid); // Use Auth UID as the document ID

      const agentData = {
        uid,
        agentId,
        agentAuthId: uid,
        agentEmail: data.agentEmail,
        agentName: data.agentName,
        agentMobile: data.agentMobile,
        agentAddress: data.agentAddress,
        agentCity: data.agentCity,
        agentState: data.agentState,
        agentPincode: data.agentPincode,
        agentAadhar: data.agentAadhar,
        agentLicenseNumber: data.agentLicenseNumber || '',
        aadharUrl: data.aadharUrl || '',
        primaryImageUrl: data.primaryImageUrl || '',
        profileImageUrl: data.profileImageUrl || '',
        role: data.role || 'agent',
        platform: data.platform || 'admin_panel',
        isApproved: data.isApproved ?? false,
        isRejected: data.isRejected ?? false,
        registrationDate: data.registrationDate || new Date().toISOString(),
        createdAt: Timestamp.now(), // ✅ Added for reporting/analytics queries
        tempPassword: data.tempPassword, // Store so admin can share it with agent
      };

      await setDoc(agentRef, agentData);

      console.log('✅ Agent saved to Firestore:', uid);

      return { success: true, uid };
    } catch (error) {
      console.error('❌ createAgentWithAuth error:', error);
      throw error;
    }
  },

  // Users
  getUsers: async (filters?: {
    gender?: string;
    state?: string;
    status?: string;
    agentId?: string;
    search?: string;
  }): Promise<OriginalUser[]> => {
    let usersRef = collection(db, 'users');
    let constraints = [];

    if (filters?.agentId && filters.agentId !== 'All') {
      constraints.push(where('agentId', '==', filters.agentId));
    }

    const q = constraints.length > 0 ? query(usersRef, ...constraints) : usersRef;
    const snapshot = await getDocs(q);

    let users = snapshot.docs.map(convertUser);

    // Client-side filtering for gender (avoids Firebase index errors with case variations)
    if (filters?.gender && filters.gender !== 'All') {
      const gFilter = filters.gender.toLowerCase();
      users = users.filter(u => {
        const uGender = (typeof u.gender === 'string' ? u.gender : (u.gender as any)?.en || '').toLowerCase();
        return uGender === gFilter;
      });
    }

    // Client-side filtering for fields not in Firebase
    if (filters?.search?.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();

      const safeString = (val: any) => {
        if (!val) return '';
        if (typeof val === 'string') return val.toLowerCase();
        if (typeof val === 'object') {
          const en = val.en || val.nameEn || '';
          const hi = val.hi || val.nameHi || '';
          return `${en} ${hi}`.toLowerCase();
        }
        return String(val).toLowerCase();
      };

      users = users.filter(u =>
        safeString(u.fullName).includes(searchTerm) ||
        safeString(u.phone).includes(searchTerm) ||
        safeString(u.uid).includes(searchTerm) ||
        safeString(u.email).includes(searchTerm)
      );
    }

    return users;
  },

  getUsersPaginated: async (filters?: {
    gender?: string;
    state?: string;
    status?: string;
    agentId?: string;
    search?: string;
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  }): Promise<{
    users: OriginalUser[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }> => {
    try {
      const usersRef = collection(db, "users");
      const pageSize = filters?.pageSize || 10;

      let constraints: any[] = [];

      // console.log("🔥 Incoming Filters:", filters);

      // ✅ Always add orderBy FIRST (important for pagination)
      constraints.push(orderBy("createdAt", "desc"));

      // ✅ Filters
      if (filters?.agentId && filters.agentId !== "All") {
        constraints.push(where("agentId", "==", filters.agentId));
      }

      let finalUsers: OriginalUser[] = [];
      let currentLastDoc: QueryDocumentSnapshot<DocumentData> | null = filters?.lastDoc || null;
      let fetchedCount = 0;

      while (finalUsers.length < pageSize && fetchedCount < 100) {
        let currentConstraints = [...constraints];
        
        if (currentLastDoc) {
          currentConstraints.push(startAfter(currentLastDoc));
        }
        currentConstraints.push(limit(pageSize));

        const q = query(usersRef, ...currentConstraints);
        const snapshot = await getDocs(q);

        if (snapshot.empty) break;

        let batchUsers = snapshot.docs.map(convertUser);

        // Client-side filtering for gender (handles both string and object cases without Firebase index errors)
        if (filters?.gender && filters.gender !== 'All') {
          const gFilter = filters.gender.toLowerCase();
          batchUsers = batchUsers.filter(u => {
            const uGender = (typeof u.gender === 'string' ? u.gender : (u.gender as any)?.en || '').toLowerCase();
            return uGender === gFilter;
          });
        }

        // Client-side search (for text search only)
        if (filters?.search?.trim()) {
          const searchTerm = filters.search.toLowerCase().trim();
          const safeString = (val: any) => {
            if (!val) return '';
            if (typeof val === 'string') return val.toLowerCase();
            if (typeof val === 'object') {
              const en = val.en || val.nameEn || '';
              const hi = val.hi || val.nameHi || '';
              return `${en} ${hi}`.toLowerCase();
            }
            return String(val).toLowerCase();
          };

          batchUsers = batchUsers.filter((u) =>
            safeString(u.fullName).includes(searchTerm) ||
            safeString(u.phone).includes(searchTerm) ||
            safeString(u.uid).includes(searchTerm) ||
            safeString(u.email).includes(searchTerm)
          );
        }

        finalUsers = [...finalUsers, ...batchUsers];
        currentLastDoc = snapshot.docs[snapshot.docs.length - 1];
        fetchedCount += snapshot.docs.length;
      }

      return {
        users: finalUsers,
        lastDoc: currentLastDoc,
      };
    } catch (error: any) {
      console.error("❌ Firestore Error:", error);

      // 🔥 VERY IMPORTANT: shows index error
      if (error.code === "failed-precondition") {
        console.error("🚨 Missing Index! Create it from this link:");
        console.error(error.message);
      }

      throw error;
    }
  },
  getUsersStats: async () => {
    const usersRef = collection(db, "users");
    const snap = await getDocs(usersRef);
    
    let total = 0;
    let male = 0;
    let female = 0;
    let profileCreated = 0;

    // Helper to extract string if field is multilingual object e.g. { en: "Male" }
    const extractString = (val: any): string => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'object') {
        if (typeof val.en === 'string') return val.en;
        if (typeof val.hi === 'string') return val.hi;
        const first = Object.values(val).find(v => typeof v === 'string');
        return (first as string) || '';
      }
      return String(val);
    };

    snap.forEach(doc => {
      total++;
      const data = doc.data();
      
      const rawGender = extractString(data.gender);
      const g = rawGender.toLowerCase().trim();
      
      if (g === 'male' || g === 'm') male++;
      else if (g === 'female' || g === 'f') female++;
      
      if (data.isProfileCreated) profileCreated++;
    });

    return {
      total,
      male,
      female,
      profileCreated,
    };
  },

  // ─── Monthly Reports Real Stats ───────────────────────────────────────────────
  // Returns Fixed Male/Female, Registrations (Male/Female/Agent), and Total Marriages
  // for a given date range. Uses getCountFromServer for scale, falls back to
  // client-side tallying where composite indexes aren't available.
  getMonthlyReportsStats: async (startDate: Date, endDate: Date) => {
    const usersRef = collection(db, 'users');
    const agentsRef = collection(db, 'agents');
    const marriagesRef = collection(db, 'marriages');

    const startTs = Timestamp.fromDate(startDate);
    const endTs = Timestamp.fromDate(endDate);

    // Helper: normalize gender from string or multilingual object
    const extractGender = (val: any): string => {
      if (!val) return '';
      if (typeof val === 'string') return val.toLowerCase().trim();
      if (typeof val === 'object') {
        const str = val.en || val.hi || Object.values(val).find((v: any) => typeof v === 'string') || '';
        return (str as string).toLowerCase().trim();
      }
      return String(val).toLowerCase().trim();
    };

    // ── Fetch users in date range (for registrations + fixed counts) ──────────
    // We fetch docs (not just count) because we need to filter by gender+status
    // For 50K+ scale, replace with a /stats collection maintained by Cloud Functions
    const usersInRangeSnap = await getDocs(
      query(usersRef, where('createdAt', '>=', startTs), where('createdAt', '<=', endTs))
    );

    let maleRegistrations = 0;
    let femaleRegistrations = 0;
    let fixedMale = 0;
    let fixedFemale = 0;

    usersInRangeSnap.forEach(docSnap => {
      const data = docSnap.data();
      const g = extractGender(data.gender);
      const statusRaw = (data.status || data.profileStatus || '').toString().toLowerCase().trim();

      if (g === 'male' || g === 'm') {
        maleRegistrations++;
        if (statusRaw === 'fixed') fixedMale++;
      } else if (g === 'female' || g === 'f') {
        femaleRegistrations++;
        if (statusRaw === 'fixed') fixedFemale++;
      }
    });

    // ── Agent registrations in date range ─────────────────────────────────────
    // Agents may have 'createdAt' (Timestamp, new) OR 'registrationDate' (string, old).
    // We fetch all agents and filter client-side to handle both formats.
    let agentRegistrations = 0;
    try {
      const agentSnap = await getDocs(agentsRef);
      agentSnap.forEach(d => {
        const agentData = d.data();
        let agentDate: Date | null = null;

        // Try createdAt (Timestamp) first
        if (agentData.createdAt?.toDate) {
          agentDate = agentData.createdAt.toDate();
        } else if (agentData.registrationDate) {
          // Fallback: registrationDate is an ISO string
          if (agentData.registrationDate.seconds) {
            agentDate = new Date(agentData.registrationDate.seconds * 1000);
          } else {
            agentDate = new Date(agentData.registrationDate);
          }
        }

        if (agentDate && agentDate >= startDate && agentDate <= endDate) {
          agentRegistrations++;
        }
      });
    } catch {
      agentRegistrations = 0;
    }

    // ── Total Marriages in date range ─────────────────────────────────────────
    let totalMarriages = 0;
    try {
      const marriageCountSnap = await getCountFromServer(
        query(marriagesRef, where('createdAt', '>=', startTs), where('createdAt', '<=', endTs))
      );
      totalMarriages = marriageCountSnap.data().count;
    } catch {
      totalMarriages = 0;
    }

    return {
      fixedMale,
      fixedFemale,
      maleRegistrations,
      femaleRegistrations,
      agentRegistrations,
      totalMarriages,
    };
  },


  // Returns bucketed real registration data for the bar chart.
  // period: 'Daily' → hourly buckets, 'Weekly' → daily buckets,
  //         'Monthly' → monthly buckets (full year), 'Custom' → daily buckets
  getRegistrationChartData: async (period: string, startDate: Date, endDate: Date) => {
    const usersRef  = collection(db, 'users');
    const agentsRef = collection(db, 'agents');

    // ── Helpers ────────────────────────────────────────────────────────────────
    const extractGender = (val: any): string => {
      if (!val) return '';
      if (typeof val === 'string') return val.toLowerCase().trim();
      if (typeof val === 'object') {
        const str = val.en || val.hi || Object.values(val).find((v: any) => typeof v === 'string') || '';
        return (str as string).toLowerCase().trim();
      }
      return String(val).toLowerCase().trim();
    };

    // Agents may have Timestamp 'createdAt' (new) OR string 'registrationDate' (old)
    const getAgentDate = (data: any): Date | null => {
      if (data.createdAt?.toDate) return data.createdAt.toDate();
      if (data.registrationDate) {
        if (data.registrationDate.seconds) return new Date(data.registrationDate.seconds * 1000);
        const d = new Date(data.registrationDate);
        if (!isNaN(d.getTime())) return d;
      }
      return null;
    };

    // ── MONTHLY: show all 12 months of current year ──────────────────────────
    if (period === 'Monthly') {
      const yearStart = new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0);
      const yearEnd   = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

      const [usersSnap, agentsSnap] = await Promise.all([
        getDocs(query(usersRef,  where('createdAt', '>=', Timestamp.fromDate(yearStart)), where('createdAt', '<=', Timestamp.fromDate(yearEnd)))),
        getDocs(agentsRef), // Fetch all agents — filter by date client-side (handles both field types)
      ]);

      const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const maleArr   = new Array(12).fill(0);
      const femaleArr = new Array(12).fill(0);
      const agentArr  = new Array(12).fill(0);

      usersSnap.forEach(d => {
        const data = d.data();
        const ts = data.createdAt?.toDate?.();
        if (!ts) return;
        const m = ts.getMonth();
        const g = extractGender(data.gender);
        if (g === 'male' || g === 'm') maleArr[m]++;
        else if (g === 'female' || g === 'f') femaleArr[m]++;
      });

      agentsSnap.forEach(d => {
        const ts = getAgentDate(d.data());
        if (!ts || ts < yearStart || ts > yearEnd) return;
        agentArr[ts.getMonth()]++;
      });

      return MONTHS.map((month, i) => ({ month, male: maleArr[i], female: femaleArr[i], agent: agentArr[i] }));
    }

    // ── WEEKLY: last 7 days, bucket by day ────────────────────────────────────
    if (period === 'Weekly') {
      const now = new Date();
      const labels: string[] = [];
      const dates: Date[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        dates.push(d);
        labels.push(d.toLocaleDateString('en', { weekday: 'short' }) + ' ' + d.getDate());
      }
      const weekStart = dates[0];
      const weekEnd   = new Date(now); weekEnd.setHours(23, 59, 59, 999);

      const [usersSnap, agentsSnap] = await Promise.all([
        getDocs(query(usersRef, where('createdAt', '>=', Timestamp.fromDate(weekStart)), where('createdAt', '<=', Timestamp.fromDate(weekEnd)))),
        getDocs(agentsRef),
      ]);

      const maleArr   = new Array(7).fill(0);
      const femaleArr = new Array(7).fill(0);
      const agentArr  = new Array(7).fill(0);

      const getDayIdx = (ts: Date) => {
        for (let i = 0; i < 7; i++) {
          if (ts >= dates[i] && ts < new Date(dates[i].getTime() + 86400000)) return i;
        }
        return -1;
      };

      usersSnap.forEach(d => {
        const data = d.data();
        const ts = data.createdAt?.toDate?.();
        if (!ts) return;
        const idx = getDayIdx(ts);
        if (idx < 0) return;
        const g = extractGender(data.gender);
        if (g === 'male' || g === 'm') maleArr[idx]++;
        else if (g === 'female' || g === 'f') femaleArr[idx]++;
      });

      agentsSnap.forEach(d => {
        const ts = getAgentDate(d.data());
        if (!ts) return;
        const idx = getDayIdx(ts);
        if (idx >= 0) agentArr[idx]++;
      });

      return labels.map((month, i) => ({ month, male: maleArr[i], female: femaleArr[i], agent: agentArr[i] }));
    }

    // ── DAILY: today, bucket by hour ──────────────────────────────────────────
    if (period === 'Daily') {
      const today    = new Date();
      const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const dayEnd   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      const [usersSnap, agentsSnap] = await Promise.all([
        getDocs(query(usersRef, where('createdAt', '>=', Timestamp.fromDate(dayStart)), where('createdAt', '<=', Timestamp.fromDate(dayEnd)))),
        getDocs(agentsRef),
      ]);

      const maleArr   = new Array(24).fill(0);
      const femaleArr = new Array(24).fill(0);
      const agentArr  = new Array(24).fill(0);

      usersSnap.forEach(d => {
        const data = d.data();
        const ts = data.createdAt?.toDate?.();
        if (!ts) return;
        const g = extractGender(data.gender);
        if (g === 'male' || g === 'm') maleArr[ts.getHours()]++;
        else if (g === 'female' || g === 'f') femaleArr[ts.getHours()]++;
      });

      agentsSnap.forEach(d => {
        const ts = getAgentDate(d.data());
        if (!ts || ts < dayStart || ts > dayEnd) return;
        agentArr[ts.getHours()]++;
      });

      const labels = Array.from({ length: 24 }, (_, h) => `${h}:00`);
      return labels.map((month, i) => ({ month, male: maleArr[i], female: femaleArr[i], agent: agentArr[i] }));
    }

    // ── CUSTOM: bucket by day within date range ────────────────────────────────
    const msPerDay  = 86400000;
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay) + 1);
    const labels    = Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(startDate.getTime() + i * msPerDay);
      return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    });

    const [usersSnap, agentsSnap] = await Promise.all([
      getDocs(query(usersRef, where('createdAt', '>=', Timestamp.fromDate(startDate)), where('createdAt', '<=', Timestamp.fromDate(endDate)))),
      getDocs(agentsRef),
    ]);

    const maleArr   = new Array(totalDays).fill(0);
    const femaleArr = new Array(totalDays).fill(0);
    const agentArr  = new Array(totalDays).fill(0);

    usersSnap.forEach(d => {
      const data = d.data();
      const ts = data.createdAt?.toDate?.();
      if (!ts) return;
      const idx = Math.floor((ts.getTime() - startDate.getTime()) / msPerDay);
      if (idx < 0 || idx >= totalDays) return;
      const g = extractGender(data.gender);
      if (g === 'male' || g === 'm') maleArr[idx]++;
      else if (g === 'female' || g === 'f') femaleArr[idx]++;
    });

    agentsSnap.forEach(d => {
      const ts = getAgentDate(d.data());
      if (!ts || ts < startDate || ts > endDate) return;
      const idx = Math.floor((ts.getTime() - startDate.getTime()) / msPerDay);
      if (idx >= 0 && idx < totalDays) agentArr[idx]++;
    });

    return labels.map((month, i) => ({ month, male: maleArr[i], female: femaleArr[i], agent: agentArr[i] }));
  },

  // ─── Fixed Relationships Chart Real Data ──────────────────────────────────
  // Returns bucketed real fixed data for the area chart.
  getFixedChartData: async (period: string, startDate: Date, endDate: Date) => {
    const usersRef = collection(db, 'users');

    const extractGender = (val: any): string => {
      if (!val) return '';
      if (typeof val === 'string') return val.toLowerCase().trim();
      if (typeof val === 'object') {
        const str = val.en || val.hi || Object.values(val).find((v: any) => typeof v === 'string') || '';
        return (str as string).toLowerCase().trim();
      }
      return String(val).toLowerCase().trim();
    };

    const isFixed = (data: any): boolean => {
      const statusRaw = (data.status || data.profileStatus || '').toString().toLowerCase().trim();
      return statusRaw === 'fixed';
    };

    // ── MONTHLY
    if (period === 'Monthly') {
      const yearStart = new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0);
      const yearEnd   = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

      const usersSnap = await getDocs(query(usersRef, where('createdAt', '>=', Timestamp.fromDate(yearStart)), where('createdAt', '<=', Timestamp.fromDate(yearEnd))));

      const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const maleArr  = new Array(12).fill(0);
      const femaleArr = new Array(12).fill(0);

      usersSnap.forEach(d => {
        const data = d.data();
        if (!isFixed(data)) return;
        const ts = data.createdAt?.toDate?.();
        if (!ts) return;
        const m = ts.getMonth();
        const g = extractGender(data.gender);
        if (g === 'male' || g === 'm') maleArr[m]++;
        else if (g === 'female' || g === 'f') femaleArr[m]++;
      });

      return MONTHS.map((month, i) => ({ month, maleFixed: maleArr[i], femaleFixed: femaleArr[i] }));
    }

    // ── WEEKLY
    if (period === 'Weekly') {
      const now = new Date();
      const labels: string[] = [];
      const dates: Date[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        dates.push(d);
        labels.push(d.toLocaleDateString('en', { weekday: 'short' }) + ' ' + d.getDate());
      }
      const weekStart = dates[0];
      const weekEnd   = new Date(now); weekEnd.setHours(23, 59, 59, 999);

      const usersSnap = await getDocs(query(usersRef, where('createdAt', '>=', Timestamp.fromDate(weekStart)), where('createdAt', '<=', Timestamp.fromDate(weekEnd))));

      const maleArr   = new Array(7).fill(0);
      const femaleArr = new Array(7).fill(0);

      const getDayIdx = (ts: Date) => {
        for (let i = 0; i < 7; i++) {
          if (ts >= dates[i] && ts < new Date(dates[i].getTime() + 86400000)) return i;
        }
        return -1;
      };

      usersSnap.forEach(d => {
        const data = d.data();
        if (!isFixed(data)) return;
        const ts = data.createdAt?.toDate?.();
        if (!ts) return;
        const idx = getDayIdx(ts);
        if (idx < 0) return;
        const g = extractGender(data.gender);
        if (g === 'male' || g === 'm') maleArr[idx]++;
        else if (g === 'female' || g === 'f') femaleArr[idx]++;
      });

      return labels.map((month, i) => ({ month, maleFixed: maleArr[i], femaleFixed: femaleArr[i] }));
    }

    // ── DAILY
    if (period === 'Daily') {
      const today    = new Date();
      const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const dayEnd   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      const usersSnap = await getDocs(query(usersRef, where('createdAt', '>=', Timestamp.fromDate(dayStart)), where('createdAt', '<=', Timestamp.fromDate(dayEnd))));

      const maleArr   = new Array(24).fill(0);
      const femaleArr = new Array(24).fill(0);

      usersSnap.forEach(d => {
        const data = d.data();
        if (!isFixed(data)) return;
        const ts = data.createdAt?.toDate?.();
        if (!ts) return;
        const g = extractGender(data.gender);
        if (g === 'male' || g === 'm') maleArr[ts.getHours()]++;
        else if (g === 'female' || g === 'f') femaleArr[ts.getHours()]++;
      });

      const labels = Array.from({ length: 24 }, (_, h) => `${h}:00`);
      return labels.map((month, i) => ({ month, maleFixed: maleArr[i], femaleFixed: femaleArr[i] }));
    }

    // ── CUSTOM
    const msPerDay  = 86400000;
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay) + 1);
    const labels    = Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(startDate.getTime() + i * msPerDay);
      return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    });

    const usersSnap = await getDocs(query(usersRef, where('createdAt', '>=', Timestamp.fromDate(startDate)), where('createdAt', '<=', Timestamp.fromDate(endDate))));

    const maleArr   = new Array(totalDays).fill(0);
    const femaleArr = new Array(totalDays).fill(0);

    usersSnap.forEach(d => {
      const data = d.data();
      if (!isFixed(data)) return;
      const ts = data.createdAt?.toDate?.();
      if (!ts) return;
      const idx = Math.floor((ts.getTime() - startDate.getTime()) / msPerDay);
      if (idx < 0 || idx >= totalDays) return;
      const g = extractGender(data.gender);
      if (g === 'male' || g === 'm') maleArr[idx]++;
      else if (g === 'female' || g === 'f') femaleArr[idx]++;
    });

    return labels.map((month, i) => ({ month, maleFixed: maleArr[i], femaleFixed: femaleArr[i] }));
  },

  getUser: async (uid: string): Promise<OriginalUser | null> => {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? convertUser(snapshot) : null;
  },

  updateUser: async (id: string, data: Partial<OriginalUser>): Promise<void> => {
    try {
      const docRef = doc(db, 'users', id);

      // 🔥 Remove undefined fields
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      // ❗ Prevent empty update
      if (Object.keys(cleanData).length === 0) {
        console.warn("⚠️ No valid fields to update");
        return;
      }

      // console.log("🔥 Updating user:", {
      //   id,
      //   cleanData
      // });

      await updateDoc(docRef, cleanData);

      console.log("✅ User updated successfully:", id);

    } catch (error: any) {
      console.error("❌ Update failed:", {
        message: error?.message,
        code: error?.code,
        fullError: error
      });

      // 🔥 Optional: rethrow for React Query
      throw error;
    }
  },

  // Agents
  getAgents: async (): Promise<OriginalAgent[]> => {
    const agentsRef = collection(db, 'agents');
    const snapshot = await getDocs(agentsRef);
    return snapshot.docs.map(convertAgent);
  },


  getAgentsStats: async () => {
    try {
      const agentsRef = collection(db, "agents");

      console.log("Fetching agents stats...");

      const snapshot = await getDocs(agentsRef);

      const agents = snapshot.docs.map(doc => doc.data());

      console.log("Total agents fetched:", agents.length);

      const now = new Date();

      let total = agents.length;
      let active = 0;
      let inactive = 0;
      let newThisMonth = 0;

      agents.forEach((a) => {
        // ✅ Active / Inactive logic
        if (a.isRejected === true) {
          inactive++;
        } else {
          active++;
        }

        // ✅ New this month logic
        if (a.registrationDate) {
          let regDate: Date;

          if (a.registrationDate.seconds) {
            // Firestore Timestamp
            regDate = new Date(a.registrationDate.seconds * 1000);
          } else {
            // String date
            regDate = new Date(a.registrationDate);
          }

          if (
            regDate.getMonth() === now.getMonth() &&
            regDate.getFullYear() === now.getFullYear()
          ) {
            newThisMonth++;
          }
        }
      });

      const result = {
        total,
        active,
        inactive,
        newThisMonth,
      };

      console.log("Agent stats result:", result);

      return result;

    } catch (error) {
      console.error("Error fetching agent stats:", error);
      throw error;
    }
  },

  getAgentsPaginated: async (filters?: {
    search?: string;
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  }): Promise<{
    agents: OriginalAgent[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }> => {
    try {
      const agentsRef = collection(db, "agents");
      const constraints: any[] = [];

      const pageSize = filters?.pageSize || 10;

      console.log("Agents filters:", filters);

      // ✅ Latest first (IMPORTANT)
      constraints.push(orderBy("registrationDate", "desc"));

      // ✅ Pagination
      constraints.push(limit(pageSize));

      if (filters?.lastDoc) {
        constraints.push(startAfter(filters.lastDoc));
      }

      const q = query(agentsRef, ...constraints);
      const snapshot = await getDocs(q);

      let agents = snapshot.docs.map(convertAgent);

      // ✅ Search (client-side)
      if (filters?.search?.trim()) {
        const s = filters.search.toLowerCase();
        agents = agents.filter((a) =>
          a.agentName?.toLowerCase().includes(s) ||
          a.agentMobile?.includes(s) ||
          a.agentEmail?.toLowerCase().includes(s) ||
          a.agentId?.toLowerCase().includes(s)
        );
      }

      console.log("Agents fetched:", agents.length);

      return {
        agents,
        lastDoc:
          snapshot.docs.length > 0
            ? snapshot.docs[snapshot.docs.length - 1]
            : null,
      };
    } catch (error) {
      console.error("Error fetching agents:", error);
      throw error;
    }
  },

  getAgent: async (uid: string): Promise<OriginalAgent | null> => {
    const agentRef = doc(db, 'agents', uid);
    const snapshot = await getDoc(agentRef);
    return snapshot.exists() ? convertAgent(snapshot) : null;
  },

  createAgent: async (data: Omit<OriginalAgent, 'uid'>): Promise<void> => {
    const ref = doc(collection(db, 'agents')); // auto ID

    const finalData = {
      ...data,

      agentId: ref.id,      // 🔥 same as doc id


    };

    await setDoc(ref, finalData);
  },

  getAgentByCustomId: async (agentId: string): Promise<OriginalAgent | null> => {
    const agentsRef = collection(db, 'agents');
    const q = query(agentsRef, where('agentId', '==', agentId));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : convertAgent(snapshot.docs[0]);
  },

  updateUsersAgentId: async (oldAgentId: string, newAgentId: string): Promise<void> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('agentId', '==', oldAgentId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    // Firestore batch supports up to 500 writes — split if needed
    const BATCH_SIZE = 500;
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      docs.slice(i, i + BATCH_SIZE).forEach(d => {
        batch.update(d.ref, { agentId: newAgentId });
      });
      await batch.commit();
    }
  },



  updateAgent: async (
    uid: string,
    data: Partial<OriginalAgent>
  ): Promise<void> => {
    try {
      const docRef = doc(db, "agents", uid);

      // 🔥 Remove undefined values (VERY IMPORTANT)
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      console.log("Updating agent:", uid, cleanData);

      await updateDoc(docRef, cleanData);

      console.log("Agent updated successfully ✅");

    } catch (error) {
      console.error("Error updating agent ❌:", error);
      throw error;
    }
  },


  deleteAgent: async (uid: string): Promise<void> => {
    try {
      // Cloud Function deletes both Auth user and Firestore doc
      const fn = httpsCallable(firebaseApi.functions, 'deleteUserFromAuth');
      await fn({ uid });
    } catch (error) {
      console.error('Error deleting agent ❌:', error);
      throw error;
    }
  },

  // Payments
  getPaymentsPaginated: async (filters?: {
    agentId?: string;
    status?: string;
    paymentType?: string;
    search?: string;
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  }): Promise<{
    payments: any[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }> => {
    try {
      const paymentsRef = collection(db, "payments");

      const pageSize = filters?.pageSize || 10;
      let constraints: any[] = [];

      // ✅ IMPORTANT: orderBy required for pagination
      constraints.push(orderBy("createdAt", "desc"));

      // ✅ Filter by agentId
      if (filters?.agentId && filters.agentId !== "All") {
        constraints.push(where("agentId", "==", filters.agentId));
      }

      // ✅ Filter by status
      if (filters?.status && filters.status !== "All") {
        constraints.push(where("status", "==", filters.status));
      }

      // ✅ Filter by paymentType
      if (filters?.paymentType && filters.paymentType !== "All") {
        constraints.push(where("paymentType", "==", filters.paymentType));
      }

      // ✅ Pagination
      if (filters?.lastDoc) {
        constraints.push(startAfter(filters.lastDoc));
      }

      constraints.push(limit(pageSize));

      const q = query(paymentsRef, ...constraints);

      const snapshot = await getDocs(q);

      let payments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // ✅ Client-side search
      if (filters?.search?.trim()) {
        const s = filters.search.toLowerCase();

        payments = payments.filter((p: any) =>
          p.fullName?.toLowerCase().includes(s) ||
          p.phone?.includes(s) ||
          p.email?.toLowerCase().includes(s) ||
          p.orderId?.toLowerCase().includes(s)
        );
      }

      const newLastDoc =
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : null;

      return {
        payments,
        lastDoc: newLastDoc,
      };
    } catch (error: any) {
      console.error("❌ Error fetching payments:", error);

      // 🔥 Handle index error (very common in Firestore)
      if (error.code === "failed-precondition") {
        console.error("🚨 Missing Firestore Index:");
        console.error(error.message);
      }

      throw error;
    }
  },
  getPaymentsSummary: async (filters?: {
    agentId?: string;
  }): Promise<{
    totalRevenue: number;
    paidCount: number;
    pendingCount: number;
    failedCount: number;
    totalOrders: number;
  }> => {
    try {
      const paymentsRef = collection(db, "payments");

      let constraints: any[] = [];

      // ✅ Filter by agentId
      if (filters?.agentId && filters.agentId !== "All") {
        constraints.push(where("agentId", "==", filters.agentId));
      }

      const q =
        constraints.length > 0
          ? query(paymentsRef, ...constraints)
          : paymentsRef;

      const snapshot = await getDocs(q);

      let totalRevenue = 0;
      let paidCount = 0;
      let pendingCount = 0;
      let failedCount = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();

        if (data.status === "Paid") {
          totalRevenue += data.amount || 0;
          paidCount++;
        } else if (data.status === "PENDING") {
          pendingCount++;
        } else if (data.status === "Failed") {
          failedCount++;
        }
      });

      return {
        totalRevenue,
        paidCount,
        pendingCount,
        failedCount,
        totalOrders: snapshot.size,
      };
    } catch (error) {
      console.error("❌ Error fetching payments summary:", error);
      throw error;
    }
  },


  getDashboardCounts: async (): Promise<{
    totalUsers: number;
    totalMale: number;
    totalFemale: number;
    totalAgents: number;
  }> => {
    try {
      const usersRef = collection(db, "users");
      const agentsRef = collection(db, "agents");

      // ✅ Parallel queries (faster 🚀)
      const [
        totalUsersSnap,
        maleSnap,
        femaleSnap,
        agentsSnap
      ] = await Promise.all([
        getCountFromServer(usersRef),

        getCountFromServer(
          query(usersRef, where("gender", "==", "male"))
        ),

        getCountFromServer(
          query(usersRef, where("gender", "==", "female"))
        ),

        getCountFromServer(agentsRef)
      ]);

      return {
        totalUsers: totalUsersSnap.data().count,
        totalMale: maleSnap.data().count,
        totalFemale: femaleSnap.data().count,
        totalAgents: agentsSnap.data().count,
      };
    } catch (error) {
      console.error("❌ Error fetching dashboard counts:", error);
      throw error;
    }
  },

  // Send bulk notification using Firebase Function
  sendBulkNotification: async (data: {
    target: string;
    title: string;
    message: string;
  }): Promise<{ success: boolean; sentCount: number; totalUsers: number }> => {
    try {
      const sendNotification = httpsCallable(firebaseApi.functions, 'sendBulkNotification');
      const result = await sendNotification(data);
      return result.data as { success: boolean; sentCount: number; totalUsers: number };
    } catch (error: any) {
      console.error("❌ Error sending notification:", error);
      throw error;
    }
  },

  // Get all notifications using Firebase Function
  getAllNotifications: async (filters?: {
    target?: string;
    status?: string;
    limit?: number;
    lastDocId?: string;
  }): Promise<{
    notifications: any[];
    lastDocId: string | null;
  }> => {
    try {
      let q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(filters?.limit || 20)
      );

      if (filters?.target && filters.target !== 'All') {
        q = query(q, where('target', '==', filters.target));
      }
      if (filters?.status && filters.status !== 'All') {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.lastDocId) {
        const lastDocSnap = await getDoc(doc(db, 'notifications', filters.lastDocId));
        if (lastDocSnap.exists()) {
          q = query(q, startAfter(lastDocSnap));
        }
      }

      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        notifications,
        lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null
      };
    } catch (error: any) {
      console.error("❌ Error fetching notifications directly:", error);
      throw error;
    }
  },

  // Get user profile from metrimony_profiles collection
  getUserProfile: async (userId: string): Promise<any | null> => {
    try {
      const profileRef = doc(db, 'metrimony_profiles', userId);
      const snapshot = await getDoc(profileRef);
      return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      throw error;
    }
  },
  // Get users with their profiles (joined data)
  getUsersWithProfiles: async (filters?: {
    gender?: string;
    state?: string;
    agentId?: string;
    search?: string;
  }): Promise<any[]> => {
    try {
      let usersRef = collection(db, 'users');
      let constraints: any[] = [];

      // ✅ Filters
      if (filters?.agentId && filters.agentId !== 'All') {
        constraints.push(where('agentId', '==', filters.agentId));
      }

      if (filters?.gender && filters.gender !== 'All') {
        constraints.push(where('gender', '==', filters.gender.toLowerCase()));
      }

      // ✅ ORDER BY (latest first)
      constraints.push(orderBy('createdAt', 'desc'));

      // 🔥 Build query
      const q = query(usersRef, ...constraints);
      const userSnapshot = await getDocs(q);
      const users = userSnapshot.docs.map(convertUser);

      // 🔥 Get profiles
      const usersWithProfiles = await Promise.all(
        users.map(async (user) => {
          const profile = await firebaseApi.getUserProfile(user.uid);

          return {
            ...user,
            profile: profile || null,
            profileDetails: profile ? {
              caste: profile.cultural?.caste,
              religion: profile.cultural?.religion,
              education: profile.education?.education?.course,
              occupation: profile.employment?.designation,
              annualIncome: profile.employment?.annualIncome,
              age: profile.identity?.age,
              dob: profile.identity?.dob,
              height: profile.physical?.height,
              weight: profile.physical?.weight,
              bodyType: profile.physical?.bodyType,
              complexion: profile.physical?.complexion,
              familyType: profile.family?.familyType,
              familyStatus: profile.family?.familyStatus,
              aboutMe: profile.identity?.aboutMe,
              profileStatus: profile.profileStatus,
              images: profile.images,
            } : null
          };
        })
      );

      // 🔍 Client-side search
      let result = usersWithProfiles;
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        result = result.filter(u =>
          u.fullName.toLowerCase().includes(s) ||
          u.phone.includes(s) ||
          u.uid.toLowerCase().includes(s)
        );
      }

      return result;

    } catch (error) {
      console.error("❌ Error fetching users with profiles:", error);
      throw error;
    }
  },

  getAmounts: async () => {
    const snap = await getDocs(collection(db, "amounts"));

    const data: Record<string, any> = {};

    snap.docs.forEach(doc => {
      data[doc.id] = doc.data();
    });

    return data;
  },
  // updateAmount: async ({
  //   id,
  //   data,
  // }: {
  //   id: string;
  //   data: any;
  // }) => {
  //   const ref = doc(db, "amounts", id);

  //   // 🔥 remove undefined
  //   const cleanData = Object.fromEntries(
  //     Object.entries(data).filter(([_, v]) => v !== undefined)
  //   );

  //   await updateDoc(ref, cleanData);

  //   return true;
  // },

  updateAmount: async ({
    id,
    data,
  }: UpdateAmountPayload): Promise<boolean> => {
    try {
      const ref = doc(db, "amounts", id);

      // 🔥 Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      if (Object.keys(cleanData).length === 0) {
        console.warn("⚠️ No valid fields to update");
        return false;
      }

      // ✅ setDoc with merge → works for create + update
      await setDoc(ref, cleanData, { merge: true });

      console.log("✅ Amount updated:", id);

      return true;
    } catch (error: any) {
      console.error("❌ Error updating amount:", {
        message: error?.message,
        code: error?.code,
        fullError: error,
      });

      throw error; // important for React Query
    }
  },

  // ─── Registration Report (Real Firebase Data) ─────────────────────────────
  getRegistrationReport: async ({
    period,
    customFrom,
    customTo,
  }: {
    period: 'Daily' | 'Weekly' | 'Monthly' | 'Custom';
    customFrom?: Date;
    customTo?: Date;
  }): Promise<{
    labels: string[];
    maleData: number[];
    femaleData: number[];
    agentData: number[];
    totalMale: number;
    totalFemale: number;
    totalAgent: number;
  }> => {
    const now = new Date();

    // ── Compute date range ──────────────────────────────────────────────────
    let fromDate: Date;
    let toDate: Date = new Date(now);
    toDate.setHours(23, 59, 59, 999);

    if (period === 'Daily') {
      fromDate = new Date(now);
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === 'Weekly') {
      fromDate = new Date(now);
      fromDate.setDate(now.getDate() - 6);
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === 'Monthly') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // Custom
      fromDate = customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1);
      toDate = customTo ? new Date(customTo) : toDate;
      toDate.setHours(23, 59, 59, 999);
    }

    const fromTs = Timestamp.fromDate(fromDate);
    const toTs = Timestamp.fromDate(toDate);

    // ── Fetch users in range ────────────────────────────────────────────────
    const usersSnap = await getDocs(
      query(
        collection(db, 'users'),
        where('createdAt', '>=', fromTs),
        where('createdAt', '<=', toTs),
        orderBy('createdAt', 'asc')
      )
    );

    // ── Fetch agents in range ───────────────────────────────────────────────
    const agentsSnap = await getDocs(
      query(
        collection(db, 'agents'),
        where('createdAt', '>=', fromTs),
        where('createdAt', '<=', toTs),
        orderBy('createdAt', 'asc')
      )
    );

    // ── Build bucket labels ─────────────────────────────────────────────────
    const diffMs = toDate.getTime() - fromDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let labels: string[] = [];
    let bucketFn: (d: Date) => string;

    if (period === 'Daily') {
      // Hourly buckets: 0-23
      labels = Array.from({ length: 24 }, (_, h) => `${h}:00`);
      bucketFn = (d) => `${d.getHours()}:00`;
    } else if (period === 'Weekly' || (period === 'Custom' && diffDays <= 14)) {
      // Daily buckets
      const cur = new Date(fromDate);
      while (cur <= toDate) {
        labels.push(cur.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
        cur.setDate(cur.getDate() + 1);
      }
      bucketFn = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } else if (period === 'Monthly' || (period === 'Custom' && diffDays <= 90)) {
      // Daily buckets for month
      const cur = new Date(fromDate);
      while (cur <= toDate) {
        labels.push(cur.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
        cur.setDate(cur.getDate() + 1);
      }
      bucketFn = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } else {
      // Monthly buckets for large ranges
      const cur = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
      while (cur <= toDate) {
        labels.push(cur.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }));
        cur.setMonth(cur.getMonth() + 1);
      }
      bucketFn = (d) => d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }

    // ── Zero-initialize buckets ─────────────────────────────────────────────
    const maleMap: Record<string, number> = {};
    const femaleMap: Record<string, number> = {};
    const agentMap: Record<string, number> = {};
    labels.forEach((l) => { maleMap[l] = 0; femaleMap[l] = 0; agentMap[l] = 0; });

    // ── Populate user buckets ───────────────────────────────────────────────
    usersSnap.docs.forEach((d) => {
      const data = d.data();
      const ts: Timestamp | undefined = data.createdAt;
      if (!ts) return;
      const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
      const key = bucketFn(date);
      if (!(key in maleMap)) return;
      const gender = (data.gender || '').toLowerCase();
      if (gender === 'male' || gender === 'm') maleMap[key] = (maleMap[key] || 0) + 1;
      else femaleMap[key] = (femaleMap[key] || 0) + 1;
    });

    // ── Populate agent buckets ──────────────────────────────────────────────
    agentsSnap.docs.forEach((d) => {
      const data = d.data();
      const ts: Timestamp | undefined = data.createdAt;
      if (!ts) return;
      const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
      const key = bucketFn(date);
      if (!(key in agentMap)) return;
      agentMap[key] = (agentMap[key] || 0) + 1;
    });

    const maleData = labels.map((l) => maleMap[l] || 0);
    const femaleData = labels.map((l) => femaleMap[l] || 0);
    const agentData = labels.map((l) => agentMap[l] || 0);

    return {
      labels,
      maleData,
      femaleData,
      agentData,
      totalMale: maleData.reduce((a, b) => a + b, 0),
      totalFemale: femaleData.reduce((a, b) => a + b, 0),
      totalAgent: agentData.reduce((a, b) => a + b, 0),
    };
  },

  // ─── Dashboard Stats (Real Data) ───────────────────────────────────────────
  getDashboardStats: async (): Promise<DashboardStats> => {
    const usersRef = collection(db, 'users');
    const agentsRef = collection(db, 'agents');
    const marriagesRef = collection(db, 'marriages');

    const extractGender = (val: any): string => {
      if (!val) return '';
      if (typeof val === 'string') return val.toLowerCase().trim();
      if (typeof val === 'object') {
        const str = val.en || val.hi || Object.values(val).find((v: any) => typeof v === 'string') || '';
        return (str as string).toLowerCase().trim();
      }
      return String(val).toLowerCase().trim();
    };

    // Parallel fetch for speed
    const [usersSnap, agentsSnap, marriagesCountSnap] = await Promise.all([
      getDocs(usersRef),
      getDocs(agentsRef),
      getCountFromServer(marriagesRef).catch(() => ({ data: () => ({ count: 0 }) }))
    ]);

    let totalRegistrations = 0;
    let maleFixed = 0;
    let femaleFixed = 0;
    let maleMarried = 0;
    let femaleMarried = 0;
    let pendingApprovals = 0;

    usersSnap.forEach(doc => {
      const data = doc.data();
      totalRegistrations++;

      const g = extractGender(data.gender);
      const isMale = g === 'male' || g === 'm';
      const isFemale = g === 'female' || g === 'f';
      
      const statusRaw = (data.status || data.profileStatus || '').toString().toLowerCase().trim();

      if (statusRaw === 'fixed') {
        if (isMale) maleFixed++;
        else if (isFemale) femaleFixed++;
      } else if (statusRaw === 'married') {
        if (isMale) maleMarried++;
        else if (isFemale) femaleMarried++;
      } else if (statusRaw === 'pending') {
        pendingApprovals++;
      }
    });

    let totalAgents = 0;
    let activeAgents = 0;

    agentsSnap.forEach(doc => {
      const data = doc.data();
      totalAgents++;
      if (data.isApproved || data.status?.toLowerCase() === 'active') {
        activeAgents++;
      }
    });

    return {
      totalRegistrations,
      maleFixed,
      femaleFixed,
      maleMarried,
      femaleMarried,
      totalAgents,
      activeAgents,
      pendingApprovals,
      monthlyRevenue: 0, // Not required right now
      registrationGrowth: 0, // Dummy growth for now since all-time
      fixedGrowth: 0,
      marriageGrowth: 0,
    };
  },

  // ─── Agent Performance (Real Data) ─────────────────────────────────────────
  getAgentPerformanceStats: async (startDate: Date, endDate: Date): Promise<any[]> => {
    const agentsRef = collection(db, 'agents');
    const usersRef = collection(db, 'users');
    const paymentsRef = collection(db, 'payments');

    const startTs = Timestamp.fromDate(startDate);
    const endTs = Timestamp.fromDate(endDate);

    // Fetch all agents (small enough for admin panel)
    const agentsSnap = await getDocs(agentsRef);
    const agentsMap = new Map<string, any>();

    agentsSnap.forEach(doc => {
      const data = doc.data();
      agentsMap.set(doc.id, {
        id: doc.id,
        agentId: data.agentId || doc.id,
        agentName: data.agentName || 'Unknown Agent',
        agentMobile: data.agentMobile || '',
        agentEmail: data.agentEmail || '',
        agentState: data.agentState || '',
        agentCity: data.agentCity || '',
        status: data.isApproved ? 'Active' : 'Pending',
        usersAdded: 0,
        usersPaid: 0,
        totalRevenue: 0,
        conversionRate: 0,
      });
      // Fallback matching by custom agentId string
      if (data.agentId && data.agentId !== doc.id) {
        agentsMap.set(data.agentId, agentsMap.get(doc.id));
      }
    });

    // Fetch users in date range
    const usersQuery = query(usersRef, where('createdAt', '>=', startTs), where('createdAt', '<=', endTs));
    const usersSnap = await getDocs(usersQuery);
    
    usersSnap.forEach(doc => {
      const data = doc.data();
      const aId = data.agentId;
      if (aId && agentsMap.has(aId)) {
        agentsMap.get(aId).usersAdded++;
      }
    });

    // Fetch payments in date range
    const paymentsQuery = query(paymentsRef, where('createdAt', '>=', startTs), where('createdAt', '<=', endTs));
    const paymentsSnap = await getDocs(paymentsQuery);

    paymentsSnap.forEach(doc => {
      const data = doc.data();
      const aId = data.agentId;
      if (aId && agentsMap.has(aId) && data.status === 'Paid') {
        agentsMap.get(aId).usersPaid++;
        agentsMap.get(aId).totalRevenue += (data.amount || 0);
      }
    });

    // Convert map to array (unique agents by doc.id) and calculate conversion rates
    const uniqueAgents = Array.from(new Set(Array.from(agentsMap.values())));
    
    uniqueAgents.forEach(a => {
      if (a.usersAdded > 0) {
        a.conversionRate = Math.round((a.usersPaid / a.usersAdded) * 100);
      }
    });

    // Sort by conversion rate descending, then users added
    uniqueAgents.sort((a, b) => b.conversionRate - a.conversionRate || b.usersAdded - a.usersAdded);

    return uniqueAgents;
  },

}




















// ─── Generated Data ──────────────────────────────────────────────────────────
export const mockAgents: Agent[] = AGENT_NAMES.map((name, i) => {
  const state = STATES[i % STATES.length];
  const dist = DISTRICTS[state][0];
  const users = rand(80, 220);
  const paid = Math.floor(users * (rand(60, 80) / 100));
  return {
    id: `ARV-AG-${String(i + 1).padStart(3, '0')}`,
    name,
    phone: `98${rand(10000000, 99999999)}`,
    email: `${name.split(' ')[0].toLowerCase()}@arvika.in`,
    state,
    district: dist,
    joinedAt: `2024-0${i + 1}-15`,
    status: i < 6 ? 'Active' : 'Inactive',
    usersAdded: users,
    usersPaid: paid,
    conversionRate: Math.round((paid / users) * 100),
    totalRevenue: paid * PLAN_PRICES.Standard,
    thisWeekReg: rand(8, 18),
    lastWeekReg: rand(6, 15),
    thisWeekFixed: rand(3, 9),
    lastWeekFixed: rand(2, 7),
  };
});

export const mockUsers: User[] = [
  ...MALE_NAMES.map((name, i) => {
    const state = STATES[i % STATES.length];
    const dist = DISTRICTS[state][i % DISTRICTS[state].length];
    return {
      id: `ARV-M-${1001 + i}`,
      name,
      gender: 'Male' as const,
      age: rand(22, 40),
      state,
      district: dist,
      agentId: mockAgents[i % mockAgents.length].id,
      status: (['Active', 'Verified', 'Pending', 'Active', 'Active'] as const)[i % 5],
      paid: i % 3 !== 2,
      plan: PLANS[i % 3],
      phone: `97${rand(10000000, 99999999)}`,
      email: `${name.split(' ')[0].toLowerCase()}@email.com`,
      joinedAt: `2025-01-${String(rand(1, 31)).padStart(2, '0')}`,
    };
  }),
  ...FEMALE_NAMES.map((name, i) => {
    const state = STATES[(i + 2) % STATES.length];
    const dist = DISTRICTS[state][i % DISTRICTS[state].length];
    return {
      id: `ARV-F-${1001 + i}`,
      name,
      gender: 'Female' as const,
      age: rand(18, 35),
      state,
      district: dist,
      agentId: mockAgents[(i + 1) % mockAgents.length].id,
      status: (['Active', 'Verified', 'Pending', 'Active', 'Suspended'] as const)[i % 5],
      paid: i % 4 !== 3,
      plan: PLANS[(i + 1) % 3],
      phone: `96${rand(10000000, 99999999)}`,
      email: `${name.split(' ')[0].toLowerCase()}@email.com`,
      joinedAt: `2025-01-${String(rand(1, 31)).padStart(2, '0')}`,
    };
  }),
];




















export const mockApprovals: PendingApproval[] = [
  { id: 'ARV-M-1030', name: 'Deepak Rao', gender: 'Male', age: 30, state: 'Karnataka', district: 'Bangalore', agentId: 'ARV-AG-005', issue: 'Blurry photo', submittedAt: '2025-01-10', documents: ['Aadhaar', 'Photo'] },
  { id: 'ARV-F-1031', name: 'Savita Devi', gender: 'Female', age: 23, state: 'Jharkhand', district: 'Ranchi', agentId: 'ARV-AG-002', issue: 'Invalid DOB', submittedAt: '2025-01-11', documents: ['Aadhaar', 'Birth Cert'] },
  { id: 'ARV-M-1032', name: 'Ashok Pandey', gender: 'Male', age: 35, state: 'Uttar Pradesh', district: 'Kanpur', agentId: 'ARV-AG-001', issue: 'Missing documents', submittedAt: '2025-01-12', documents: ['Aadhaar'] },
  { id: 'ARV-F-1033', name: 'Lata Agarwal', gender: 'Female', age: 26, state: 'Madhya Pradesh', district: 'Jabalpur', agentId: 'ARV-AG-003', issue: 'Name mismatch', submittedAt: '2025-01-12', documents: ['Aadhaar', 'PAN'] },
];

export const mockOrders: Order[] = [
  ...mockUsers.slice(0, 12).map((u, i) => ({
    id: `ORD-2025-${String(i + 1).padStart(3, '0')}`,
    userId: u.id,
    userName: u.name,
    userType: u.gender as 'Male' | 'Female',
    plan: PLANS[i % 3],
    amount: PLAN_PRICES[PLANS[i % 3]],
    date: `2025-01-${String(rand(1, 15)).padStart(2, '0')}`,
    status: (['Paid', 'Paid', 'Paid', 'Pending', 'Paid', 'Failed'] as const)[i % 6],
    agentId: u.agentId,
  })),
];

export const mockNotifications: Notification[] = [
  { id: 'N-001', target: 'Male', title: 'Profile Verified', message: 'Your profile has been verified successfully.', sentAt: '2025-01-10', sentTo: 234, status: 'Delivered' },
  { id: 'N-002', target: 'Female', title: 'Special Offer', message: 'Upgrade to Premium and get matches faster!', sentAt: '2025-01-09', sentTo: 189, status: 'Delivered' },
  { id: 'N-003', target: 'Agent', title: 'Payout Processed', message: 'Weekly payout has been processed. Check your account.', sentAt: '2025-01-08', sentTo: 47, status: 'Delivered' },
  { id: 'N-004', target: 'Male', title: 'New Profiles Added', message: 'New female profiles added in your area!', sentAt: '2025-01-07', sentTo: 312, status: 'Delivered' },
  { id: 'N-005', target: 'All', title: 'App Update', message: 'Arvika app v2.0 is now available. Please update.', sentAt: '2025-01-06', sentTo: 3345, status: 'Delivered' },
];

export const mockMonthlyData: MonthlyData[] = MONTHS.map((month, i) => {
  const male = rand(80, 140);
  const female = rand(60, 110);
  const maleFixed = rand(20, 45);
  const femaleFixed = rand(18, 38);
  return {
    month,
    male,
    female,
    agent: rand(3, 8),
    maleFixed,
    femaleFixed,
    marriages: Math.floor((maleFixed + femaleFixed) * 0.35),
    revenue: (male + female) * rand(1800, 3500),
  };
});

export const mockWeeklyData: WeeklyData[] = Array.from({ length: 8 }, (_, i) => ({
  week: `Wk ${i + 1}`,
  registrations: rand(35, 70),
  fixed: rand(10, 25),
  revenue: rand(60000, 150000),
}));

export const mockDashboardStats: DashboardStats = {
  totalRegistrations: 3345,
  maleFixed: 486,
  femaleFixed: 406,
  maleMarried: 174,
  femaleMarried: 173,
  totalAgents: 47,
  activeAgents: 39,
  pendingApprovals: 4,
  monthlyRevenue: 892500,
  registrationGrowth: 12,
  fixedGrowth: 8,
  marriageGrowth: 15,
};

// ─── API Functions (React Query fetchers) ────────────────────────────────────
export const api = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    await delay(300);
    return mockDashboardStats;
  },

  getMonthlyData: async (period: string): Promise<MonthlyData[]> => {
    await delay(350);
    if (period === 'Weekly') return mockMonthlyData.slice(0, 4);
    return mockMonthlyData;
  },

  getWeeklyData: async (): Promise<WeeklyData[]> => {
    await delay(300);
    return mockWeeklyData;
  },

  getUsers: async (filters?: {
    gender?: string;
    state?: string;
    status?: string;
    agentId?: string;
    search?: string;
  }): Promise<User[]> => {
    await delay(400);
    let users = [...mockUsers];
    if (filters?.gender && filters.gender !== 'All') {
      users = users.filter(u => u.gender === filters.gender);
    }
    if (filters?.state && filters.state !== 'All') {
      users = users.filter(u => u.state === filters.state);
    }
    if (filters?.status && filters.status !== 'All') {
      users = users.filter(u => u.status === filters.status);
    }
    if (filters?.agentId && filters.agentId !== 'All') {
      users = users.filter(u => u.agentId === filters.agentId);
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(s) ||
        u.id.toLowerCase().includes(s) ||
        u.phone.includes(s)
      );
    }
    return users;
  },

  getUser: async (id: string): Promise<User | null> => {
    await delay(200);
    return mockUsers.find(u => u.id === id) || null;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    await delay(500);
    const idx = mockUsers.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    Object.assign(mockUsers[idx], data);
    return mockUsers[idx];
  },

  getAgents: async (): Promise<Agent[]> => {
    await delay(350);
    return mockAgents;
  },

  getAgent: async (id: string): Promise<Agent | null> => {
    await delay(200);
    return mockAgents.find(a => a.id === id) || null;
  },

  createAgent: async (data: Omit<Agent, 'id' | 'usersAdded' | 'usersPaid' | 'conversionRate' | 'totalRevenue' | 'thisWeekReg' | 'lastWeekReg' | 'thisWeekFixed' | 'lastWeekFixed'>): Promise<Agent> => {
    await delay(600);
    const newAgent: Agent = {
      ...data,
      id: `ARV-AG-${String(mockAgents.length + 1).padStart(3, '0')}`,
      usersAdded: 0,
      usersPaid: 0,
      conversionRate: 0,
      totalRevenue: 0,
      thisWeekReg: 0,
      lastWeekReg: 0,
      thisWeekFixed: 0,
      lastWeekFixed: 0,
    };
    mockAgents.push(newAgent);
    return newAgent;
  },

  getPendingApprovals: async (): Promise<PendingApproval[]> => {
    await delay(300);
    return mockApprovals;
  },

  processApproval: async (id: string, action: 'Approved' | 'Rejected'): Promise<void> => {
    await delay(500);
    const idx = mockApprovals.findIndex(a => a.id === id);
    if (idx !== -1) mockApprovals.splice(idx, 1);
  },

  getOrders: async (filters?: { status?: string; userType?: string }): Promise<Order[]> => {
    await delay(350);
    let orders = [...mockOrders];
    if (filters?.status && filters.status !== 'All') {
      orders = orders.filter(o => o.status === filters.status);
    }
    if (filters?.userType && filters.userType !== 'All') {
      orders = orders.filter(o => o.userType === filters.userType);
    }
    return orders;
  },

  getNotifications: async (): Promise<Notification[]> => {
    await delay(300);
    return mockNotifications;
  },

  sendNotification: async (data: {
    target: string;
    title: string;
    message: string;
  }): Promise<Notification> => {
    await delay(700);
    const notif: Notification = {
      id: `N-${String(mockNotifications.length + 1).padStart(3, '0')}`,
      target: data.target as any,
      title: data.title,
      message: data.message,
      sentAt: new Date().toISOString().split('T')[0],
      sentTo: data.target === 'All' ? 3345 : data.target === 'Male' ? 1842 : data.target === 'Female' ? 1456 : 47,
      status: 'Delivered',
    };
    mockNotifications.unshift(notif);
    return notif;
  },
};
