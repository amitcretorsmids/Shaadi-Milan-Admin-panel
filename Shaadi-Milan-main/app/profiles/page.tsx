'use client';
import { useState } from 'react';
import { useUsersWithProfiles, useUpdateUser } from '@/hooks/use-queries';
import { Card, CardHeader, Button, Input, Select, Skeleton, Badge, Avatar } from '@/components/ui';

const STATES = ['Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Rajasthan', 'Gujarat', 'Maharashtra', 'Jharkhand', 'Karnataka'];

// ─── Helper: safely extract a string from Firebase fields that may be objects ──
// Some Firebase fields are stored as { en: "value", hi: "value" } instead of plain strings
function getString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.en === 'string') return obj.en;
    if (typeof obj.hi === 'string') return obj.hi;
    const firstStr = Object.values(obj).find(v => typeof v === 'string');
    if (firstStr) return firstStr as string;
  }
  return fallback;
}

export default function ProfilesPage() {
  const { data: usersWithProfiles, isLoading } = useUsersWithProfiles();
  const { mutate: updateUser, isPending } = useUpdateUser();
  const [selected, setSelected] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'profile' | 'family' | 'education'>('basic');

  const handleSelect = (u: any) => {
    setSelected(u);
    setForm({ 
      ...u,
      profileDetails: u.profileDetails || {}
    });
    setSaved(false);
  };

  const handleSave = () => {
    if (!selected) return;
    // Update user basic info
    updateUser({ id: selected.uid, data: form }, {
      onSuccess: () => { 
        setSaved(true); 
        setTimeout(() => setSaved(false), 2500);
      },
    });
  };

  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-full">
        {/* User list panel - Only this scrolls */}
        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader title="Select Profile" subtitle="Click a user to edit" />
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : (
              (usersWithProfiles || []).map(u => (
                <button
                  key={u.uid}
                  onClick={() => handleSelect(u)}
                  className={` cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-2 ${
                    selected?.uid === u.uid
                      ? 'border-[var(--purple)] bg-[rgba(124,92,252,0.08)]'
                      : 'border-transparent hover:bg-[var(--bg-glass)]'
                  }`}
                >
                  <Avatar 
                    name={getString(u.fullName)} 
                    size="sm" 
                    gender={getString(u.gender)} 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--text)] truncate">{getString(u.fullName) || '—'}</div>
                    <div className="text-[10px] font-mono text-[var(--text-dim)]">{u.uid}</div>
                    {u.profile?.profileStatus && (
                      <Badge variant={u.profile.profileStatus === 'active' ? 'success' : 'warning'} >
                        {getString(u.profile.profileStatus)}
                      </Badge>
                    )}
                  </div>
                  <Badge variant={getString(u.gender) === 'male' ? 'male' : 'female'}>
                    {getString(u.gender) === 'male' ? 'M' : 'F'}
                  </Badge>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Edit panel - Fixed, no scroll */}
        <Card className="xl:col-span-2 flex flex-col h-full overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] gap-3">
              <span className="text-5xl">👈</span>
              <p className="text-sm">Select a user from the left panel to edit their profile</p>
            </div>
          ) : (
            <>
              <CardHeader
                title="Edit Profile"
                subtitle={`${getString(selected.fullName)} - ${selected.uid}`}
                action={
                  <div className="flex gap-2">
                    {saved && <span className="text-[11px] text-[#00c9a7] font-medium">✓ Saved!</span>}
                    <Button variant="ghost" size="sm" onClick={() => setForm({ ...selected })}>
                      Discard
                    </Button>
                    <Button variant="primary" size="sm" loading={isPending} onClick={handleSave}>
                      Save Changes
                    </Button>
                  </div>
                }
              />
              
              {/* Tabs */}
              <div className="flex gap-1 px-5 border-b border-[var(--border)] flex-shrink-0">
                {[
                  { id: 'basic', label: 'Basic Info' },
                  { id: 'profile', label: 'Profile Details' },
                  { id: 'family', label: 'Family' },
                  { id: 'education', label: 'Education & Work' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 text-xs font-medium transition-all ${
                      activeTab === tab.id
                        ? 'text-[var(--purple)] border-b-2 border-[var(--purple)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              {/* Content area - Make this scrollable if needed */}
              <div className="flex-1 overflow-y-auto p-5">
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <div className="flex items-center gap-4 p-4 bg-[var(--bg-surface)] rounded-2xl mb-5">
                        <Avatar 
                          name={getString(selected.fullName)} 
                          size="lg" 
                          gender={getString(selected.gender)} 
                        />
                        <div>
                          <div className="font-display text-lg font-semibold text-[var(--text)]">{getString(selected.fullName) || '—'}</div>
                          <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">{selected.uid}</div>
                          <div className="flex gap-2 mt-1.5">
                            <Badge variant={getString(selected.gender) === 'male' ? 'male' : 'female'}>
                              {getString(selected.gender) || 'Unknown'}
                            </Badge>
                            <Badge variant={selected.isProfileCreated ? 'success' : 'warning'}>
                              {selected.isProfileCreated ? 'Profile Complete' : 'Profile Incomplete'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {[
                      { label: 'Full Name', key: 'fullName', type: 'text' },
                      { label: 'Phone', key: 'phone', type: 'tel' },
                      { label: 'Email', key: 'email', type: 'email' },
                      { label: 'Agent ID', key: 'agentId', type: 'text' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">
                          {f.label}
                        </label>
                        <Input
                          type={f.type}
                          value={getString(form[f.key as keyof typeof form]) || ''}
                          onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Profile Details Tab */}
                {activeTab === 'profile' && selected.profile && (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Age', key: 'age', value: selected.profile.identity?.age },
                      { label: 'Date of Birth', key: 'dob', value: selected.profile.identity?.dob },
                      { label: 'Height (ft)', key: 'height', value: selected.profile.physical?.height },
                      { label: 'Weight (kg)', key: 'weight', value: selected.profile.physical?.weight },
                      { label: 'Body Type', key: 'bodyType', value: selected.profile.physical?.bodyType },
                      { label: 'Complexion', key: 'complexion', value: selected.profile.physical?.complexion },
                      { label: 'Caste', key: 'caste', value: selected.profile.cultural?.caste },
                      { label: 'Sub Caste', key: 'subCaste', value: selected.profile.cultural?.subCaste },
                      { label: 'Religion', key: 'religion', value: selected.profile.cultural?.religion },
                      { label: 'About Me', key: 'aboutMe', value: selected.profile.identity?.aboutMe },
                    ].map(f => (
                      <div key={f.key} className={f.key === 'aboutMe' ? 'col-span-2' : ''}>
                        <label className="block text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">
                          {f.label}
                        </label>
                        {f.key === 'aboutMe' ? (
                          <textarea
                            value={getString(f.value)}
                            rows={3}
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] text-xs outline-none focus:border-[var(--purple)] transition-colors resize-none"
                            onChange={e => setForm((p: any) => ({ 
                              ...p, 
                              profileDetails: { ...p.profileDetails, [f.key]: e.target.value } 
                            }))}
                          />
                        ) : (
                          <Input
                            type="text"
                            value={getString(f.value)}
                            onChange={e => setForm((p: any) => ({ 
                              ...p, 
                              profileDetails: { ...p.profileDetails, [f.key]: e.target.value } 
                            }))}
                            className="w-full"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Family Tab */}
                {activeTab === 'family' && selected.profile && (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Family Type', key: 'familyType', value: selected.profile.family?.familyType },
                      { label: 'Family Status', key: 'familyStatus', value: selected.profile.family?.familyStatus },
                      { label: "Father's Name", key: 'fatherName', value: selected.profile.family?.fatherName },
                      { label: "Mother's Name", key: 'motherName', value: selected.profile.family?.motherName },
                      { label: 'Number of Brothers', key: 'numberOfBrothers', value: selected.profile.family?.numberOfBrothers },
                      { label: 'Number of Sisters', key: 'numberOfSisters', value: selected.profile.family?.numberOfSisters },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">
                          {f.label}
                        </label>
                        <Input
                          type="text"
                          value={getString(f.value)}
                          onChange={e => setForm((p: any) => ({ 
                            ...p, 
                            profileDetails: { ...p.profileDetails, [f.key]: e.target.value } 
                          }))}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Education & Work Tab */}
                {activeTab === 'education' && selected.profile && (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Education', key: 'education', value: selected.profile.education?.education?.course },
                      { label: 'College', key: 'college', value: selected.profile.education?.education?.college },
                      { label: 'Passing Year', key: 'passingYear', value: selected.profile.education?.education?.passingYear },
                      { label: 'Occupation', key: 'designation', value: selected.profile.employment?.designation },
                      { label: 'Company', key: 'company', value: selected.profile.employment?.company },
                      { label: 'Annual Income', key: 'annualIncome', value: selected.profile.employment?.annualIncome },
                      { label: 'Work Location', key: 'workLocation', value: selected.profile.employment?.workLocation },
                      { label: 'Job Type', key: 'jobType', value: selected.profile.employment?.jobType },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">
                          {f.label}
                        </label>
                        <Input
                          type="text"
                          value={getString(f.value)}
                          onChange={e => setForm((p: any) => ({ 
                            ...p, 
                            profileDetails: { ...p.profileDetails, [f.key]: e.target.value } 
                          }))}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}