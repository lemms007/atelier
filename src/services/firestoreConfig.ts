import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, defaultDb, namedDb } from '../firebase';
import { CheckoutConfig, FAQItem } from '../types';

export const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How does the 4 to 14-day rental window work?',
    answer: 'Day 1 is your delivery date when our courier arrives with your dress in specialized hanging garment luggage. The final day (Day 4 up to Day 14) is when our return courier arrives to collect the package.',
    category: 'booking',
  },
  {
    id: 'faq-2',
    question: 'When and how is my refundable security deposit returned?',
    answer: 'Your security deposit (50% of the rental fee) is remitted back to your original GCash or Bank Transfer account within 24 hours of our Manila atelier team verifying the garment upon return.',
    category: 'deposits',
  },
  {
    id: 'faq-3',
    question: 'Do I need to dry clean the garment before returning?',
    answer: 'Never! Complimentary professional dry cleaning and sanitization by our certified atelier textile conservators is included in every rental. Please do not wash, iron, or steam delicate silk or organza at home.',
    category: 'cleaning',
  },
  {
    id: 'faq-4',
    question: 'What areas in the Philippines are covered for delivery?',
    answer: 'We offer white-glove same-day courier dispatch across Metro Manila (BGC, Makati, Ortigas, Alabang, QC, Cavite, Laguna, Rizal) via Lalamove, and express insured courier dispatch across Luzon, Visayas, and Mindanao.',
    category: 'shipping',
  },
  {
    id: 'faq-5',
    question: 'What happens if there is accidental minor wear or beverage splatter?',
    answer: 'Minor, normal wear such as cosmetic hemline dust or removable beverage splatters is 100% covered under Sinta Atelier Care. Severe irreparable burns, structural tears, or unreturned items may forfeit the security deposit or incur retail replacement costs as per the rental agreement.',
    category: 'deposits',
  },
  {
    id: 'faq-6',
    question: 'How does optional Google Registration benefit me?',
    answer: 'Registering with Google links your profile in our Firestore database. Your delivery address, Philippine government ID credentials, and measurements are securely stored so you never have to re-enter them on future rentals.',
    category: 'general',
  },
  {
    id: 'faq-7',
    question: 'How do silhouette measurements and sizing work?',
    answer: 'You can save your silhouette measurements (bust, waist, hips, height) in your Profile. You can also click "Size Guide & Silhouette Chart" on any garment page or chat directly with us on Facebook for bespoke fitting advice.',
    category: 'sizing',
  },
];

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
  faqs: DEFAULT_FAQS,
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
          faqs: Array.isArray(parsed.faqs) && parsed.faqs.length > 0
            ? parsed.faqs
            : DEFAULT_CHECKOUT_CONFIG.faqs,
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
        faqs: Array.isArray(remote.faqs) && remote.faqs.length > 0
          ? remote.faqs
          : DEFAULT_CHECKOUT_CONFIG.faqs,
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
