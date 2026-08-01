'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUsersWithProfiles, useUpdateUser } from '@/hooks/use-queries';
import { Card, CardHeader, Button, Input, Skeleton, Badge, Avatar } from '@/components/ui';

// ─── Helper: safely extract a string from Firebase fields that may be objects ──
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

export default function EditProfilePage() {
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;

  const { data: usersWithProfiles, isLoading } = useUsersWithProfiles();
  const { mutate: updateUser, isPending } = useUpdateUser();

  const user = usersWithProfiles?.find((u: any) => u.uid === uid);

  const [form, setForm] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'profile' | 'family' | 'education'>('basic');

  // Initialize form from user data when it loads
  if (user && !form) {
    setForm({ ...user, profileDetails: user.profileDetails || {} });
  }

  const handleSave = () => {
    if (!user || !form) return;
    updateUser({ id: user.uid, data: form }, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <span className="text-5xl">😕</span>
        <p className="text-[var(--text-muted)] text-sm">Profile not found.</p>
        <Button variant="ghost" onClick={() => router.push('/profiles')}>← Back to Profiles</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back Button + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/profiles')}
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Profiles
        </button>
      </div>

      <Card className="flex flex-col">
        <CardHeader
          title="Edit Profile"
          subtitle={`${getString(user.fullName)} - ${user.uid}`}
          action={
            <div className="flex gap-2 items-center">
              {saved && <span className="text-[11px] text-[#00c9a7] font-medium">✓ Saved!</span>}
              <Button variant="ghost" size="sm" onClick={() => setForm({ ...user, profileDetails: user.profileDetails || {} })}>
                Discard
              </Button>
              <Button variant="primary" size="sm" loading={isPending} onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          }
        />

        {/* Profile Header Card */}
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-4 p-4 bg-[var(--bg-surface)] rounded-2xl">
            <Avatar name={getString(user.fullName)} size="lg" gender={getString(user.gender)} />
            <div>
              <div className="font-display text-lg font-semibold text-[var(--text)]">{getString(user.fullName) || '—'}</div>
              <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">{user.uid}</div>
              <div className="flex gap-2 mt-1.5">
                <Badge variant={getString(user.gender).toLowerCase() === 'male' ? 'male' : 'female'}>
                  <span className="capitalize">{getString(user.gender) || 'Unknown'}</span>
                </Badge>
                <Badge variant={user.isProfileCreated ? 'success' : 'warning'}>
                  {user.isProfileCreated ? 'Profile Complete' : 'Profile Incomplete'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 border-b border-[var(--border)]">
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

        {/* Tab Content */}
        <div className="p-5">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && form && (
            <div className="grid grid-cols-2 gap-4">
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
          {activeTab === 'profile' && user.profile && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Age', key: 'age', value: user.profile.identity?.age },
                { label: 'Date of Birth', key: 'dob', value: user.profile.identity?.dob },
                { label: 'Height (ft)', key: 'height', value: user.profile.physical?.height },
                { label: 'Weight (kg)', key: 'weight', value: user.profile.physical?.weight },
                { label: 'Body Type', key: 'bodyType', value: user.profile.physical?.bodyType },
                { label: 'Complexion', key: 'complexion', value: user.profile.physical?.complexion },
                { label: 'Caste', key: 'caste', value: user.profile.cultural?.caste },
                { label: 'Sub Caste', key: 'subCaste', value: user.profile.cultural?.subCaste },
                { label: 'Religion', key: 'religion', value: user.profile.cultural?.religion },
                { label: 'About Me', key: 'aboutMe', value: user.profile.identity?.aboutMe },
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
          {activeTab === 'family' && user.profile && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Family Type', key: 'familyType', value: user.profile.family?.familyType },
                { label: 'Family Status', key: 'familyStatus', value: user.profile.family?.familyStatus },
                { label: "Father's Name", key: 'fatherName', value: user.profile.family?.fatherName },
                { label: "Mother's Name", key: 'motherName', value: user.profile.family?.motherName },
                { label: 'Number of Brothers', key: 'numberOfBrothers', value: user.profile.family?.numberOfBrothers },
                { label: 'Number of Sisters', key: 'numberOfSisters', value: user.profile.family?.numberOfSisters },
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
          {activeTab === 'education' && user.profile && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Education', key: 'education', value: user.profile.education?.education?.course },
                { label: 'College', key: 'college', value: user.profile.education?.education?.college },
                { label: 'Passing Year', key: 'passingYear', value: user.profile.education?.education?.passingYear },
                { label: 'Occupation', key: 'designation', value: user.profile.employment?.designation },
                { label: 'Company', key: 'company', value: user.profile.employment?.company },
                { label: 'Annual Income', key: 'annualIncome', value: user.profile.employment?.annualIncome },
                { label: 'Work Location', key: 'workLocation', value: user.profile.employment?.workLocation },
                { label: 'Job Type', key: 'jobType', value: user.profile.employment?.jobType },
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
      </Card>
    </div>
  );
}
