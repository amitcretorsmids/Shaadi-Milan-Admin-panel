'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Input } from '@/components/ui';
import { useAmounts, useUpdateAmount } from '@/hooks/use-queries';

type SettingSection = {
  id: string;
  title: string;
  icon: string;
  fields: Array<{
    label: string;
    key: string;
    type: 'text' | 'email' | 'password' | 'number' | 'select' | 'toggle';
    placeholder?: string;
    options?: string[];
    defaultValue?: string | number | boolean;
    docId?: string; // Firestore document ID
  }>;
};

const SECTIONS: SettingSection[] = [
  {
    id: 'admin',
    title: 'Admin Access Control',
    icon: '🔐',
    fields: [
      { label: 'Super Admin Email', key: 'adminEmail', type: 'email', placeholder: 'admin@arvika.in', defaultValue: 'admin@arvika.in' },
      { label: 'Admin Display Name', key: 'adminName', type: 'text', placeholder: 'Super Admin', defaultValue: 'Super Admin' },
      { label: 'Current Password', key: 'currentPass', type: 'password', placeholder: '••••••••' },
      { label: 'New Password', key: 'newPass', type: 'password', placeholder: '••••••••' },
      { label: 'Session Timeout (mins)', key: 'sessionTimeout', type: 'number', placeholder: '60', defaultValue: 60 },
      { label: 'Two-Factor Auth', key: '2fa', type: 'toggle', defaultValue: false },
    ],
  },
  {
    id: 'registration',
    title: 'Registration Settings',
    icon: '📋',
    fields: [
      { label: 'Minimum Age', key: 'minAge', type: 'number', placeholder: '18', defaultValue: 18 },
      { label: 'Maximum Age', key: 'maxAge', type: 'number', placeholder: '60', defaultValue: 60 },
      { label: 'Required Documents', key: 'requiredDocs', type: 'select', options: ['Aadhaar Only', 'Aadhaar + Photo', 'Aadhaar + PAN + Photo'], defaultValue: 'Aadhaar + Photo' },
      { label: 'Auto-Approval', key: 'autoApproval', type: 'toggle', defaultValue: false },
      { label: 'Max Photo Size (MB)', key: 'maxPhoto', type: 'number', placeholder: '5', defaultValue: 5 },
      { label: 'Profile Review Days', key: 'reviewDays', type: 'number', placeholder: '3', defaultValue: 3 },
    ],
  },
  {
    id: 'payments',
    title: 'Payment Amounts',
    icon: '💳',
    fields: [
      { 
        label: 'Registration Fee (₹)', 
        key: 'registration', 
        type: 'number', 
        placeholder: '500', 
        defaultValue: 500,
        docId: 'registration'
      },
      { 
        label: 'After Marriage - Male (₹)', 
        key: 'afterMarriageMale', 
        type: 'number', 
        placeholder: '3000', 
        defaultValue: 3000,
        docId: 'afterMarriageAmountforMale'
      },
      { 
        label: 'After Marriage - Female (₹)', 
        key: 'afterMarriageFemale', 
        type: 'number', 
        placeholder: '2000', 
        defaultValue: 2000,
        docId: 'afterMarriageAmountforFemale'
      },
    ],
  },
  {
    id: 'notification',
    title: 'Notification Settings',
    icon: '🔔',
    fields: [
      { label: 'SMS Gateway API Key', key: 'smsKey', type: 'password', placeholder: 'Enter SMS gateway key' },
      { label: 'Email SMTP Host', key: 'smtpHost', type: 'text', placeholder: 'smtp.gmail.com', defaultValue: 'smtp.gmail.com' },
      { label: 'Email SMTP Port', key: 'smtpPort', type: 'number', placeholder: '587', defaultValue: 587 },
      { label: 'Alert Email', key: 'alertEmail', type: 'email', placeholder: 'alerts@arvika.in', defaultValue: 'alerts@arvika.in' },
      { label: 'Push Notifications', key: 'pushEnabled', type: 'toggle', defaultValue: true },
      { label: 'FCM Server Key', key: 'fcmKey', type: 'password', placeholder: 'Enter Firebase FCM key' },
    ],
  },
  {
    id: 'firebase',
    title: 'Firebase Configuration',
    icon: '🔥',
    fields: [
      { label: 'Project ID', key: 'fbProjectId', type: 'text', placeholder: 'arvika-prod', defaultValue: 'arvika-prod' },
      { label: 'API Key', key: 'fbApiKey', type: 'password', placeholder: 'Firebase API key' },
      { label: 'Auth Domain', key: 'fbAuthDomain', type: 'text', placeholder: 'arvika-prod.firebaseapp.com' },
      { label: 'Storage Bucket', key: 'fbBucket', type: 'text', placeholder: 'arvika-prod.appspot.com' },
      { label: 'Messaging Sender ID', key: 'fbSenderId', type: 'text', placeholder: '123456789' },
      { label: 'App ID', key: 'fbAppId', type: 'text', placeholder: '1:123456789:web:abc' },
    ],
  },
  {
    id: 'export',
    title: 'Data Export & Backup',
    icon: '📦',
    fields: [
      { label: 'Auto Backup', key: 'autoBackup', type: 'toggle', defaultValue: true },
      { label: 'Backup Frequency', key: 'backupFreq', type: 'select', options: ['Daily', 'Weekly', 'Monthly'], defaultValue: 'Daily' },
      { label: 'Export Format', key: 'exportFormat', type: 'select', options: ['CSV', 'Excel', 'JSON', 'PDF'], defaultValue: 'Excel' },
      { label: 'Data Retention (Days)', key: 'retention', type: 'number', placeholder: '365', defaultValue: 365 },
    ],
  },
];

type FormValues = Record<string, string | number | boolean>;

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={` cursor-pointer relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-[#7c5cfc]' : 'bg-[var(--bg-surface)] border border-[var(--border)]'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

function SettingsSection({ 
  section, 
  amountsData, 
  onUpdateAmount 
}: { 
  section: SettingSection;
  amountsData: any;
  onUpdateAmount: (docId: string, data: any) => Promise<void>;
}) {
  const [values, setValues] = useState<FormValues>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize values from amounts collection
  useEffect(() => {
    const initValues: FormValues = {};
    
    for (const field of section.fields) {
      if (field.docId && amountsData) {
        // Get value from amounts collection
        const amountDoc = amountsData[field.docId];
        if (amountDoc && amountDoc.amount !== undefined) {
          initValues[field.key] = amountDoc.amount;
        } else {
          initValues[field.key] = field.defaultValue ?? '';
        }
      } else {
        // Get from localStorage or use default
        const stored = localStorage.getItem(`setting_${field.key}`);
        initValues[field.key] = stored !== null ? JSON.parse(stored) : (field.defaultValue ?? '');
      }
    }
    
    setValues(initValues);
  }, [section, amountsData]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Save amounts collection fields
      for (const field of section.fields) {
        if (field.docId) {
          const amountValue = values[field.key];
          await onUpdateAmount(field.docId, { amount: Number(amountValue) });
        } else {
          // Save to localStorage
          localStorage.setItem(`setting_${field.key}`, JSON.stringify(values[field.key]));
        }
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (key: string, value: string | number | boolean) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader
        title={section.title}
        subtitle={`Configure ${section.title.toLowerCase()}`}
        action={
          <div className="flex items-center gap-2">
            {saved && <span className="text-[11px] text-[#00c9a7] font-medium animate-pulse">✓ Saved!</span>}
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
          </div>
        }
      />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{section.icon}</span>
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-semibold">{section.title}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.fields.map(field => (
            <div key={field.key}>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">
                {field.label}
                {field.docId && (
                  <span className="ml-2 text-[8px] text-[#ffc84a]">(Live from DB)</span>
                )}
              </label>
              
              {field.type === 'toggle' ? (
                <div className="flex items-center gap-3">
                  <Toggle
                    value={Boolean(values[field.key])}
                    onChange={v => handleValueChange(field.key, v)}
                  />
                  <span className="text-xs text-[var(--text-muted)]">
                    {values[field.key] ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ) : field.type === 'select' ? (
                <select
                  value={String(values[field.key] || '')}
                  onChange={e => handleValueChange(field.key, e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] text-xs outline-none focus:border-[var(--purple)] transition-colors"
                >
                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={String(values[field.key] || '')}
                  onChange={e => {
                    const val = field.type === 'number' ? Number(e.target.value) : e.target.value;
                    handleValueChange(field.key, val);
                  }}
                  placeholder={field.placeholder}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] placeholder-[var(--text-dim)] text-xs outline-none focus:border-[var(--purple)] transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('admin');
  const { data: amountsData, isLoading: amountsLoading } = useAmounts();
  const { mutate: updateAmount } = useUpdateAmount();
  
  const activeSection = SECTIONS.find(s => s.id === activeTab) ?? SECTIONS[0];

  const handleUpdateAmount = (docId: string, data: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      updateAmount({ id: docId, data }, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  };

  if (amountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--purple)] mx-auto"></div>
          <p className="mt-4 text-[var(--text-muted)]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab nav */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all border ${
              activeTab === s.id
                ? 'bg-[rgba(124,92,252,0.2)] border-[rgba(124,92,252,0.4)] text-[var(--text)]'
                : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-light)] hover:text-[var(--text)]'
            }`}
          >
            <span>{s.icon}</span>
            {s.title}
          </button>
        ))}
      </div>

      <SettingsSection 
        section={activeSection} 
        amountsData={amountsData}
        onUpdateAmount={handleUpdateAmount}
      />

      {/* Amounts Preview Card - Only for payments tab */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader 
            title="Current Payment Amounts (Live from Firestore)" 
            subtitle="These values are used for all payment calculations"
          />
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[var(--bg-surface)] rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">Registration Fee</div>
                <div className="text-2xl font-display font-semibold text-[#ffc84a] mt-1">
                  ₹{amountsData?.registration?.amount || 500}
                </div>
                <div className="text-[10px] text-[var(--text-dim)] mt-1">Document ID: registration</div>
              </div>
              
              <div className="bg-[var(--bg-surface)] rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">After Marriage (Male)</div>
                <div className="text-2xl font-display font-semibold text-[#00c9a7] mt-1">
                  ₹{amountsData?.afterMarriageAmountforMale?.amount || 3000}
                </div>
                <div className="text-[10px] text-[var(--text-dim)] mt-1">Document ID: afterMarriageAmountforMale</div>
              </div>
              
              <div className="bg-[var(--bg-surface)] rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">After Marriage (Female)</div>
                <div className="text-2xl font-display font-semibold text-[#ff7eb3] mt-1">
                  ₹{amountsData?.afterMarriageAmountforFemale?.amount || 2000}
                </div>
                <div className="text-[10px] text-[var(--text-dim)] mt-1">Document ID: afterMarriageAmountforFemale</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      
    </div>
  );
}