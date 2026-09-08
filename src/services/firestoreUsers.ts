import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../firebase';
import { UserProfile, ShippingDetails, KYCData, UserMeasurements } from '../types';

const USER_PROFILE_STORAGE_KEY_PREFIX = 'atelier_user_profile_v1_';

/**
 * Get cached user profile from local storage for fast instant hydration
 */
export function getCachedUserProfile(uid: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(`${USER_PROFILE_STORAGE_KEY_PREFIX}${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persist user profile to local storage cache
 */
export function setCachedUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(
      `${USER_PROFILE_STORAGE_KEY_PREFIX}${profile.uid}`,
      JSON.stringify(profile)
    );
  } catch (err) {
    console.warn('[Cache] Could not cache user profile locally:', err);
  }
}

/**
 * Retrieve user profile from Firestore
 */
export async function getUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      setCachedUserProfile(data);
      return data;
    }
    return null;
  } catch (error) {
    console.error('[FirestoreUsers] Failed to fetch user profile:', error);
    return getCachedUserProfile(uid);
  }
}

/**
 * Save / update complete user profile to Firestore
 */
export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', profile.uid);
    const payload: UserProfile = {
      ...profile,
      lastLoginAt: new Date().toISOString(),
    };
    await setDoc(userRef, payload, { merge: true });
    setCachedUserProfile(payload);
    console.log(`[FirestoreUsers] Saved profile for ${profile.email}`);
  } catch (error) {
    console.error('[FirestoreUsers] Failed to save user profile:', error);
    // Still save to local storage cache if network is degraded
    setCachedUserProfile(profile);
    throw error;
  }
}

/**
 * Real-time listener for user profile updates
 */
export function subscribeToUserProfile(
  uid: string,
  onUpdate: (profile: UserProfile | null) => void
): () => void {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        const profile = snap.data() as UserProfile;
        setCachedUserProfile(profile);
        onUpdate(profile);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('[FirestoreUsers] Profile snapshot notice:', error);
    }
  );
}

/**
 * Synchronize user profile upon Google Sign-In
 * If profile already exists in Firestore, loads their reusable details;
 * if new registration, seeds their initial profile with default VIP tier and Google metadata.
 */
export async function syncUserProfileOnGoogleLogin(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const existing = snap.data() as UserProfile;
    const updated: UserProfile = {
      ...existing,
      email: user.email || existing.email,
      displayName: user.displayName || existing.displayName,
      photoURL: user.photoURL || existing.photoURL,
      lastLoginAt: new Date().toISOString(),
      isRegistered: true,
    };
    await setDoc(userRef, updated, { merge: true });
    setCachedUserProfile(updated);
    return updated;
  }

  // New User Registration with Google
  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Atelier Renter',
    photoURL: user.photoURL || undefined,
    phoneNumber: user.phoneNumber || undefined,
    isRegistered: true,
    membershipTier: 'VIP Member',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    shippingDetails: {
      fullName: user.displayName || '',
      email: user.email || '',
      mobileNumber: user.phoneNumber || '',
      deliveryAddress: '',
      city: 'Taguig City',
      province: 'Metro Manila',
      postalCode: '1634',
      deliveryMethod: 'same_day_courier',
    },
    measurements: {
      primarySize: 'S',
      bust: '33" (84cm)',
      waist: '25" (63cm)',
      hips: '35" (89cm)',
      height: "5'7\"",
    },
    kycDetails: {
      idType: 'Philippine Passport',
      isVerified: false,
    },
    wishlist: [],
  };

  await setDoc(userRef, newProfile);
  setCachedUserProfile(newProfile);
  return newProfile;
}
