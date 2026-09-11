import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, defaultDb, namedDb } from '../firebase';
import { CheckoutConfig } from '../types';

export const DEFAULT_CHECKOUT_CONFIG: CheckoutConfig = {
  gcash: {
    merchantName: 'ATELIER LUXE COUTURE INC',
    accountNumber: '0917 888 2345',
    qrCodeImageUrl: '',
    instructions: 'Scan the QR code or send payment to the verified GCash mobile number. Attach your receipt screenshot with reference number.',
  },
  bankTransfer: {
    accounts: [
      {
        id: 'bank-bdo',
        bankName: 'BDO Unibank (Banco de Oro)',
        accountName: 'SINTA WARDROBE RENTAL INC.',
        accountNumber: '0019 8273 4401',
        branch: 'BGC High Street Branch',
      },
      {
        id: 'bank-bpi',
        bankName: 'Bank of the Philippine Islands (BPI)',
        accountName: 'SINTA WARDROBE RENTAL INC.',
        accountNumber: '3890 1204 88',
        branch: 'Makati Ayala Main Branch',
      },
      {
        id: 'bank-unionbank',
        bankName: 'UnionBank of the Philippines',
        accountName: 'SINTA WARDROBE RENTAL INC.',
        accountNumber: '1098 7765 2200',
        branch: 'Ortigas Center Emerald Branch',
      },
    ],
    instructions: 'Transfer the exact amount to any of our accredited corporate bank accounts. Please enter your order or renter name as transfer remarks.',
  },
  termsTitle: 'Terms of Service and Rental Agreement',
  termsContent: `1. Rental Window & Period
Day 1 commences upon receipt of the garment via our designated courier. The final day signifies the scheduled pickup by our return courier. Extensions must be requested 48 hours prior and are subject to availability.

2. Garment Care & Prohibited Alterations
Renters may NOT perform permanent alterations, hem cuts, pin adjustments with non-silk pins, iron on delicate organza, or attempt home washing. All garments are sanitized through our specialized dry cleaning partners.

3. Minor Wear vs. Major Damage
Standard wear (minor cosmetic hem dust, removable beverage splatters) is 100% covered by Sinta Insurance. Irreparable tears, severe burns, cigarette marks, or theft will forfeit the security deposit and may incur up to the full retail replacement value.

4. 100% Security Deposit Refund Policy
Refundable deposits are remitted to your original GCash or Bank account within 24 hours of our physical garment check in Manila.

5. Courier Dispatch & Delivery
Courier shipping fee is calculated live and shouldered directly by the renter via the courier app. All dispatches include sealed garment bags and direct rider tracking coordinated via SMS.`,
  privacyTitle: 'Privacy Policy',
  privacyContent: `1. Collection of Personal Information
In compliance with the Data Privacy Act of 2012 (Republic Act No. 10173), Sinta Wardrobe Rental collects personal information including your full legal name, delivery address, mobile contact number, email address, and government identification strictly for verifying high-value designer garment rentals.

2. Identity Verification (KYC)
Uploaded government identification documents are accessed exclusively by authorized concierge verification officers to authenticate identity and prevent fraudulent bookings. We do not sell, disclose, or transfer your identification records to third-party advertisers.

3. Payment Data Security
Payment proofs, transaction reference codes, and banking details are recorded solely for escrow auditing, payment confirmation, and processing security deposit refunds upon return of the rented pieces.

4. Data Retention and Storage
Your personal records and order history are securely maintained in protected cloud infrastructure with restricted role-based administrative access. You may request data rectification or account profile deletion at any time by contacting concierge@sinta-rentals.ph.

5. Your Data Subject Rights
As a data subject, you have the right to be informed, access, rectify, erase, or object to the processing of your personal data under Philippine data privacy regulations.`,
};

const CHECKOUT_CONFIG_CACHE_KEY = 'sinta_checkout_config_v2';

export function getCachedCheckoutConfig(): CheckoutConfig {
  try {
    const raw = localStorage.getItem(CHECKOUT_CONFIG_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.gcash && parsed.bankTransfer) {
        return {
          ...DEFAULT_CHECKOUT_CONFIG,
          ...parsed,
          gcash: { ...DEFAULT_CHECKOUT_CONFIG.gcash, ...parsed.gcash },
          bankTransfer: {
            ...DEFAULT_CHECKOUT_CONFIG.bankTransfer,
            ...parsed.bankTransfer,
            accounts: Array.isArray(parsed.bankTransfer?.accounts) && parsed.bankTransfer.accounts.length > 0
              ? parsed.bankTransfer.accounts
              : DEFAULT_CHECKOUT_CONFIG.bankTransfer.accounts,
          },
        };
      }
    }
  } catch (err) {
    console.warn('[Storage] Could not parse cached checkout config:', err);
  }
  return DEFAULT_CHECKOUT_CONFIG;
}

export function setCachedCheckoutConfig(config: CheckoutConfig): void {
  try {
    localStorage.setItem(CHECKOUT_CONFIG_CACHE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('[Storage] Could not save checkout config to localStorage:', err);
  }
}

export async function fetchCheckoutConfigFromFirestore(): Promise<CheckoutConfig | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'checkout_config'));
    if (snap.exists()) {
      const remote = snap.data() as Partial<CheckoutConfig>;
      const merged: CheckoutConfig = {
        ...DEFAULT_CHECKOUT_CONFIG,
        ...remote,
        gcash: { ...DEFAULT_CHECKOUT_CONFIG.gcash, ...(remote.gcash || {}) },
        bankTransfer: {
          ...DEFAULT_CHECKOUT_CONFIG.bankTransfer,
          ...(remote.bankTransfer || {}),
          accounts: Array.isArray(remote.bankTransfer?.accounts) && remote.bankTransfer.accounts.length > 0
            ? remote.bankTransfer.accounts
            : DEFAULT_CHECKOUT_CONFIG.bankTransfer.accounts,
        },
      };
      setCachedCheckoutConfig(merged);
      return merged;
    }
  } catch (err) {
    console.warn('[Firestore] Could not fetch checkout config from Firestore:', err);
  }
  return null;
}

export async function saveCheckoutConfigToFirestore(config: CheckoutConfig): Promise<void> {
  try {
    setCachedCheckoutConfig(config);
    const docRef = doc(db, 'settings', 'checkout_config');
    await setDoc(
      docRef,
      {
        ...config,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    if (namedDb && defaultDb && namedDb !== defaultDb) {
      try {
        const defaultRef = doc(defaultDb, 'settings', 'checkout_config');
        await setDoc(
          defaultRef,
          {
            ...config,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch {}
    }
  } catch (err) {
    console.error('[Firestore] Failed to save checkout config to Firestore:', err);
    throw err;
  }
}
