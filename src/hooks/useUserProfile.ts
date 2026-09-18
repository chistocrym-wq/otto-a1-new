import { useCallback, useState } from 'react';

export type ContactType = 'email' | 'telegram';
export type LearningMode = 'guided' | 'direct';
export type AuthStatus = 'guest' | 'verified';
export type Gender = 'female' | 'male';

export interface UserProfile {
  name: string;
  contactType: ContactType;
  contact: string;
  contactVerified: boolean;
  authStatus: AuthStatus;
  gender?: Gender;
  learningMode: LearningMode;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileDraft {
  name: string;
  contactType: ContactType;
  contact: string;
  contactVerified: boolean;
  authStatus?: AuthStatus;
  gender?: Gender;
  learningMode: LearningMode;
}

const PROFILE_KEY = 'otto-user-profile';
const ONBOARDING_KEY = 'otto-onboarding-completed';
const MODE_KEY = 'otto-learning-mode-v1';
const LEGACY_PROGRESS_KEYS = ['goethe-a1-progress', 'otto-a1-activity-v1'] as const;

function safeGet(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

function normalizeProfile(value: unknown): UserProfile | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<UserProfile>;
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  const contact = typeof candidate.contact === 'string' ? candidate.contact.trim() : '';
  const contactType = candidate.contactType === 'email' || candidate.contactType === 'telegram' ? candidate.contactType : null;
  const learningMode = candidate.learningMode === 'guided' || candidate.learningMode === 'direct' ? candidate.learningMode : null;
  if (!name || !contact || !contactType || !learningMode) return null;
  const createdAt = typeof candidate.createdAt === 'string' && candidate.createdAt ? candidate.createdAt : new Date().toISOString();
  const updatedAt = typeof candidate.updatedAt === 'string' && candidate.updatedAt ? candidate.updatedAt : createdAt;
  const contactVerified = candidate.contactVerified === true;
  const authStatus: AuthStatus = contactVerified ? 'verified' : 'guest';
  const gender: Gender | undefined = candidate.gender === 'female' || candidate.gender === 'male' ? candidate.gender : undefined;
  return {
    name,
    contactType,
    contact,
    contactVerified,
    authStatus,
    gender,
    learningMode,
    createdAt,
    updatedAt,
  };
}

export function loadUserProfile(): UserProfile | null {
  try {
    const raw = safeGet(PROFILE_KEY);
    return raw ? normalizeProfile(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function hasExistingLearningData() {
  return LEGACY_PROGRESS_KEYS.some((key) => {
    const value = safeGet(key);
    return Boolean(value && value !== '{}' && value !== '[]');
  });
}

export function getStoredLearningMode(): LearningMode {
  const profile = loadUserProfile();
  if (profile) return profile.learningMode;
  return safeGet(MODE_KEY) === 'guided' ? 'guided' : 'direct';
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(loadUserProfile);
  const [modePreference, setModePreference] = useState<LearningMode>(getStoredLearningMode);
  const [completed, setCompleted] = useState(() => safeGet(ONBOARDING_KEY) === 'true' && Boolean(loadUserProfile()));
  // Старый progress сохраняется как есть, но больше не считается заменой новому профилю/onboarding.
  const legacyUser = false;
  const learningMode = profile?.learningMode ?? modePreference;

  const saveProfile = useCallback((draft: UserProfileDraft) => {
    const now = new Date().toISOString();
    setProfile((previous) => {
      const next: UserProfile = {
        name: draft.name.trim(),
        contactType: draft.contactType,
        contact: draft.contact.trim(),
        contactVerified: draft.contactVerified,
        authStatus: draft.contactVerified ? 'verified' : 'guest',
        gender: draft.gender ?? previous?.gender,
        learningMode: draft.learningMode,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
      };
      safeSet(PROFILE_KEY, JSON.stringify(next));
      safeSet(MODE_KEY, next.learningMode);
      return next;
    });
    setModePreference(draft.learningMode);
    safeSet(ONBOARDING_KEY, 'true');
    setCompleted(true);
  }, []);

  const setGender = useCallback((gender: Gender) => {
    setProfile((previous) => {
      if (!previous) return previous;
      const next = { ...previous, gender, updatedAt: new Date().toISOString() };
      safeSet(PROFILE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setLearningMode = useCallback((mode: LearningMode) => {
    setModePreference(mode);
    safeSet(MODE_KEY, mode);
    setProfile((previous) => {
      if (!previous) return previous;
      const next = { ...previous, learningMode: mode, updatedAt: new Date().toISOString() };
      safeSet(PROFILE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { profile, completed, legacyUser, learningMode, saveProfile, setGender, setLearningMode };
}
