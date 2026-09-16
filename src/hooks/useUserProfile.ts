import { useCallback, useEffect, useState } from 'react';

type UserProfile = {
  name: string;
  createdAt: string;
};

const PROFILE_KEY = 'otto-user-profile';
const ONBOARDING_KEY = 'otto-onboarding-completed';

function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadCompleted() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(loadProfile);
  const [completed, setCompleted] = useState<boolean>(loadCompleted);

  useEffect(() => {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  const saveProfile = useCallback((name: string) => {
    const next = { name: name.trim(), createdAt: new Date().toISOString() };
    setProfile(next);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setCompleted(true);
  }, []);

  return { profile, completed, saveProfile };
}
