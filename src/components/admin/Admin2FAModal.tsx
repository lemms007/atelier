import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  ShieldAlert,
  Mail,
  Lock,
  ArrowRight,
  RefreshCw,
  X,
  CheckCircle2,
  Copy,
  Check,
  KeyRound,
  Inbox,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const Admin2FAModal: React.FC = () => {
  const {
    isAdmin2FAOpen,
    setIsAdmin2FAOpen,
    adminEmail,
    setAdminEmail,
    sendAdmin2FACode,
    verifyAdmin2FACode,
    admin2FACode,
    admin2FAEmailPreview,
    showToast,
  } = useApp();

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [emailInput, setEmailInput] = useState(adminEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [isCopied, setIsCopied] = useState(false);
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(true);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync email input when modal opens
  useEffect(() => {
    if (isAdmin2FAOpen) {
      setEmailInput(adminEmail);
      setErrorMessage(null);
      // If code was already sent, start in verify step
      if (admin2FACode) {
        setStep('verify');
      } else {
        setStep('request');
      }
    }
  }, [isAdmin2FAOpen, adminEmail]);

  // Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === 'verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  // Auto-focus first input in verify mode
  useEffect(() => {
    if (step === 'verify') {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (!isAdmin2FAOpen) return null;

  const handleSendCode = () => {
    const trimmed = emailInput.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMessage('Please enter a valid administrator email address.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    setTimeout(() => {
      setAdminEmail(trimmed);
      const res = sendAdmin2FACode(trimmed);
      setIsSending(false);
      setStep('verify');
      setResendTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      setIsEmailPreviewOpen(true);
    }, 600);
  };

  const handleOtpChange = (index: number, value: string) => {
    setErrorMessage(null);
    const cleaned = value.replace(/[^0-9]/g, '');

    if (!cleaned) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    // Handle paste of multiple digits
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((char, i) => {
        if (index + i < 6) {
          newDigits[index + i] = char;
        }
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(index + pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();

      // Check if complete
      if (newDigits.every((d) => d !== '')) {
        attemptVerify(newDigits.join(''));
      }
      return;
    }

    // Single digit input
    const newDigits = [...otpDigits];
    newDigits[index] = cleaned[0];
    setOtpDigits(newDigits);

    // Auto advance focus
    if (index < 5 && cleaned[0]) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits filled
    if (index === 5 && newDigits.every((d) => d !== '')) {
      attemptVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/[^0-9]/g, '');
    if (pastedData) {
      const digits = pastedData.slice(0, 6).split('');
      const newDigits = ['', '', '', '', '', ''];
      digits.forEach((d, i) => {
        newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const focusIndex = Math.min(digits.length, 5);
      inputRefs.current[focusIndex]?.focus();

      if (digits.length === 6) {
        attemptVerify(digits.join(''));
      }
    }
  };

  const attemptVerify = (fullCode: string) => {
    setIsVerifying(true);
    setErrorMessage(null);

    setTimeout(() => {
      const isSuccess = verifyAdmin2FACode(fullCode);
      setIsVerifying(false);
      if (!isSuccess) {
        setErrorMessage('Invalid verification code. Please check your email and try again.');
        inputRefs.current[0]?.focus();
      }
    }, 500);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpDigits.join('');
    if (fullCode.length < 6) {
      setErrorMessage('Please enter the full 6-digit code.');
      return;
    }
    attemptVerify(fullCode);
  };

  const handleAutoFillCode = () => {
    if (admin2FAEmailPreview?.code) {
      const codeDigits = admin2FAEmailPreview.code.split('');
      setOtpDigits(codeDigits);
      attemptVerify(admin2FAEmailPreview.code);
      showToast('Auto-filled 6-digit verification code.');
    }
  };

  const handleCopyCode = () => {
    if (admin2FAEmailPreview?.code) {
      navigator.clipboard.writeText(admin2FAEmailPreview.code);
      setIsCopied(true);
      showToast('Code copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141312]/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-[#FFFFFF] w-full max-w-md rounded-2xl border border-[#E8E4DF] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#141312] text-white p-5 border-b border-[#2A2725] relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2A2725] border border-[#3D3A37] flex items-center justify-center text-[#22C55E]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#948E88] font-medium block">
                  Sinta Backoffice Security
                </span>
                <h2 className="font-serif text-base font-semibold text-white">
                  Two-Factor Authentication
                </h2>
              </div>
            </div>

            <button
              onClick={() => setIsAdmin2FAOpen(false)}
              className="text-[#948E88] hover:text-white transition-colors p-1 -mr-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {step === 'request' ? (
            /* STEP 1: Enter Admin Email & Request 6-digit Code */
            <div className="space-y-4">
              <div className="text-center space-y-1.5 pb-1">
                <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#E8E4DF] flex items-center justify-center mx-auto text-[#141312]">
                  <Lock className="w-5 h-5 stroke-[1.75]" />
                </div>
                <h3 className="font-serif text-sm font-semibold text-[#141312]">
                  Admin Identity Verification
                </h3>
                <p className="text-xs text-[#5C5854] max-w-xs mx-auto">
                  Access to order verification, escrow releases, and rates management requires one-time 2FA authorization.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="admin-email-input"
                  className="text-[11px] font-medium uppercase tracking-wider text-[#5C5854] block"
                >
                  Authorized Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#948E88] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-email-input"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. admin@atelier-manila.ph"
                    className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#141312] placeholder-[#948E88] focus:outline-none focus:border-[#141312] focus:bg-white transition-all font-medium"
                    autoFocus
                  />
                </div>

                {/* Quick email presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#948E88]">Quick fill:</span>
                  <button
                    type="button"
                    onClick={() => setEmailInput('admin@atelier-manila.ph')}
                    className="text-[10px] bg-[#FAF9F6] border border-[#E8E4DF] hover:border-[#141312] px-2 py-0.5 rounded text-[#5C5854] transition-colors"
                  >
                    admin@atelier-manila.ph
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailInput('lemms007@gmail.com')}
                    className="text-[10px] bg-[#FAF9F6] border border-[#E8E4DF] hover:border-[#141312] px-2 py-0.5 rounded text-[#5C5854] transition-colors"
                  >
                    lemms007@gmail.com
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg text-xs text-[#991B1B] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                id="btn-send-admin-2fa"
                type="button"
                onClick={handleSendCode}
                disabled={isSending}
                className="w-full py-2.5 px-4 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Email...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 stroke-[2]" />
                    <span>Send 6-Digit Verification Code</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <span className="text-[10px] text-[#948E88]">
                  Two-Factor Authentication • Code is dispatched securely for staff verification.
                </span>
              </div>
            </div>
          ) : (
            /* STEP 2: Input 6-Digit Code & Simulated Email Preview */
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center mx-auto text-[#16A34A]">
                  <KeyRound className="w-4 h-4 stroke-[2]" />
                </div>
                <h3 className="font-serif text-sm font-semibold text-[#141312]">
                  Enter 6-Digit Code
                </h3>
                <p className="text-xs text-[#5C5854]">
                  We sent an authentication code to{' '}
                  <span className="font-semibold text-[#141312]">{adminEmail}</span>
                </p>
              </div>

              {/* Real-Time Email Dispatch Card Simulation */}
              {admin2FAEmailPreview && isEmailPreviewOpen && (
                <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl p-3.5 space-y-2.5 animate-fadeIn shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-2">
                    <div className="flex items-center gap-1.5">
                      <Inbox className="w-3.5 h-3.5 text-[#141312]" />
                      <span className="text-[11px] font-semibold text-[#141312]">
                        Simulated Inbound Email Dispatch
                      </span>
                    </div>
                    <span className="text-[10px] text-[#948E88] font-mono">
                      {admin2FAEmailPreview.timestamp}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex justify-between text-[11px] text-[#5C5854]">
                      <span>From: security@sintawardrobe.ph</span>
                      <span>To: {admin2FAEmailPreview.to}</span>
                    </div>
                    <p className="text-[#141312] font-medium text-[11px] pt-0.5">
                      Subject: Sinta Backoffice 6-Digit Access Code: {admin2FAEmailPreview.code}
                    </p>
                  </div>

                  <div className="bg-[#FFFFFF] border border-[#E8E4DF] rounded-lg p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[#948E88] font-medium block">
                        One-Time Code (10m Expiry)
                      </span>
                      <span className="font-mono text-base font-bold tracking-widest text-[#141312]">
                        {admin2FAEmailPreview.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-2 py-1 text-[10px] font-medium bg-[#FAF9F6] hover:bg-[#E8E4DF] text-[#141312] rounded border border-[#E8E4DF] flex items-center gap-1 transition-colors"
                        title="Copy Code"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoFillCode}
                        className="px-2.5 py-1 text-[10px] font-medium bg-[#141312] hover:bg-[#2A2725] text-white rounded flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Auto-Fill Code</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 6-Digit OTP Box Grid */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-[#5C5854]">
                    Security Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('request');
                    }}
                    className="text-[10px] text-[#5C5854] hover:text-[#141312] underline"
                  >
                    Change Email
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      id={`input-2fa-digit-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      className={`h-12 text-center font-mono text-lg font-bold rounded-lg border transition-all ${
                        errorMessage
                          ? 'border-[#EF4444] bg-[#FEF2F2] text-[#991B1B]'
                          : digit
                          ? 'border-[#141312] bg-[#FAF9F6] text-[#141312]'
                          : 'border-[#E8E4DF] bg-white text-[#141312] focus:border-[#141312] focus:bg-[#FAF9F6]'
                      } focus:outline-none focus:ring-1 focus:ring-[#141312]`}
                    />
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg text-xs text-[#991B1B] flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit & Verify Button */}
              <button
                id="btn-submit-verify-2fa"
                type="submit"
                disabled={isVerifying || otpDigits.some((d) => d === '')}
                className="w-full py-2.5 px-4 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Passcode...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>Verify Code & Enter Console</span>
                  </>
                )}
              </button>

              {/* Resend Code Section */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E8E4DF]">
                <span className="text-[#948E88] text-[11px]">Didn't receive the email?</span>
                {resendTimer > 0 ? (
                  <span className="text-[11px] text-[#948E88] font-medium">
                    Resend in <span className="font-mono">{resendTimer}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="text-[11px] text-[#141312] font-semibold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAF9F6] px-5 py-3 border-t border-[#E8E4DF] flex items-center justify-between text-[10px] text-[#948E88]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            256-Bit SSL Encrypted
          </span>
          <button
            type="button"
            onClick={() => setIsAdmin2FAOpen(false)}
            className="text-[#5C5854] hover:text-[#141312] underline"
          >
            Cancel & Return to Store
          </button>
        </div>
      </div>
    </div>
  );
};
