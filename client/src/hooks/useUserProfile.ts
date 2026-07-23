import { useState, useEffect, useCallback } from "react";

export interface UserProfileData {
  lastCarouselImage: string | null;   // base64 data URL
  moodboardImages: string[];          // array of base64 data URLs
  useLastImage: boolean;              // whether to append last image to carousels
  totalGenerated: number;
  totalPosted: number;
}

const STORAGE_KEY = "hookslide-user-profile";

const DEFAULT_PROFILE: UserProfileData = {
  lastCarouselImage: null,
  moodboardImages: [],
  useLastImage: false,
  totalGenerated: 0,
  totalPosted: 0,
};

export function useUserProfile() {
  const [profile, setProfileState] = useState<UserProfileData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn("Failed to save profile:", e);
    }
  }, [profile]);

  const updateProfile = useCallback((partial: Partial<UserProfileData>) => {
    setProfileState((prev) => ({ ...prev, ...partial }));
  }, []);

  const setLastCarouselImage = useCallback((dataUrl: string | null) => {
    updateProfile({ lastCarouselImage: dataUrl });
  }, [updateProfile]);

  const addMoodboardImage = useCallback((dataUrl: string) => {
    setProfileState((prev) => ({
      ...prev,
      moodboardImages: [...prev.moodboardImages, dataUrl].slice(0, 12),
    }));
  }, []);

  const removeMoodboardImage = useCallback((index: number) => {
    setProfileState((prev) => ({
      ...prev,
      moodboardImages: prev.moodboardImages.filter((_, i) => i !== index),
    }));
  }, []);

  const toggleUseLastImage = useCallback(() => {
    setProfileState((prev) => ({ ...prev, useLastImage: !prev.useLastImage }));
  }, []);

  const incrementGenerated = useCallback(() => {
    setProfileState((prev) => ({ ...prev, totalGenerated: prev.totalGenerated + 1 }));
  }, []);

  const incrementPosted = useCallback(() => {
    setProfileState((prev) => ({ ...prev, totalPosted: prev.totalPosted + 1 }));
  }, []);

  return {
    profile,
    updateProfile,
    setLastCarouselImage,
    addMoodboardImage,
    removeMoodboardImage,
    toggleUseLastImage,
    incrementGenerated,
    incrementPosted,
  };
}
