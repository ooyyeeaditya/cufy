import React, { useState } from 'react';
import { AlertCircle, Upload, CheckCircle2, RefreshCw, LogOut, ArrowRight, Camera, Image, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { compressAndStoreImage } from '../../utils/imageUpload';
import { reSubmitVerification } from '../../lib/cloudSync';

export default function VerificationRejectedModal({ userProfile, onResubmitted, onLogout }) {
  const [newScreenshot, setNewScreenshot] = useState(null);
  const [newPhone, setNewPhone] = useState(userProfile?.phone || '');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const rejectionReason = userProfile?.rejectionReason || userProfile?.prompt2_answer?.replace('[REJECTION]:', '').trim() || 'Payment receipt or profile information could not be verified.';

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setErrorMessage('');
    try {
      const compressedDataUrl = await compressAndStoreImage(file);
      setNewScreenshot(compressedDataUrl);
    } catch (err) {
      console.error('Failed to compress image:', err);
      setErrorMessage('Failed to process image. Please try a different photo.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const email = userProfile?.email;
      const updatedData = {};
      if (newPhone.trim() && newPhone !== userProfile?.phone) {
        updatedData.phone = newPhone.trim();
      }

      await reSubmitVerification(email, newScreenshot || userProfile?.paymentProofUrl, updatedData);

      setSuccessMessage('Verification re-submitted! Sending to Admin for review...');

      setTimeout(() => {
        const updated = {
          ...userProfile,
          status: 'pending_approval',
          is_verified: false,
          rejectionReason: '',
          paymentProofUrl: newScreenshot || userProfile?.paymentProofUrl,
          ...updatedData
        };
        if (onResubmitted) onResubmitted(updated);
      }, 900);
    } catch (err) {
      console.error('Resubmit error:', err);
      setErrorMessage('Failed to re-submit verification. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      width: '100%', height: '100%',
      background: '#F5F3EF',
      zIndex: 1050,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      overflowY: 'auto'
    }} className="animate-fade-in">

      {/* Decorative background overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `url('/photos/haikei2 (2).png')`,
        backgroundSize: 'cover', opacity: 0.12, pointerEvents: 'none'
      }}></div>

      {/* Main Action Card */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: '#FFFFFF',
        borderRadius: '28px',
        padding: '26px 22px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
        border: '1.5px solid #FCA5A5',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header Icon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'serif', fontStyle: 'italic', color: '#09090B' }}>
              cufy<span style={{ color: '#FF3B30', fontStyle: 'normal' }}>.</span>
            </span>
          </div>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: '#FEE2E2',
            color: '#DC2626',
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '999px',
            textTransform: 'uppercase'
          }}>
            <ShieldAlert size={12} /> Action Required
          </span>
        </div>

        {/* Big Alert Heading */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '64px', height: '64px',
            borderRadius: '20px',
            background: '#FEF2F2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 8px 24px rgba(220,38,38,0.18)'
          }}>
            <AlertCircle size={32} />
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#09090B', margin: 0, letterSpacing: '-0.3px' }}>
            Verification Rejected
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#71717A', margin: '4px 0 0', fontWeight: 600 }}>
            Hi {userProfile?.name || 'Member'}, your verification could not be approved.
          </p>
        </div>

        {/* Reason Display Box */}
        <div style={{
          background: '#FFF5F5',
          border: '1.5px solid #FECACA',
          borderRadius: '18px',
          padding: '14px 16px',
          marginBottom: '18px'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Reason from Admin
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#7F1D1D', lineHeight: 1.4 }}>
            "{rejectionReason}"
          </div>
          <div style={{ fontSize: '0.74rem', color: '#B91C1C', marginTop: '6px', fontWeight: 600 }}>
            Please update your payment screenshot or details below to re-submit for instant review.
          </div>
        </div>

        {errorMessage && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B',
            padding: '8px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '12px', textAlign: 'center'
          }}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{
            background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46',
            padding: '8px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '12px', textAlign: 'center'
          }}>
            {successMessage}
          </div>
        )}

        {/* Re-submission Form */}
        <form onSubmit={handleResubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Screenshot Upload Dropzone */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#09090B', marginBottom: '6px' }}>
              Upload Valid Payment Receipt
            </label>
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 12px',
              borderRadius: '16px',
              border: newScreenshot ? '2px solid #10B981' : '2px dashed #D4D4D8',
              background: newScreenshot ? '#F0FDF4' : '#FAFAFA',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                style={{ display: 'none' }} 
              />
              {isCompressing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717A', fontSize: '0.8rem', fontWeight: 700 }}>
                  <RefreshCw size={18} className="animate-spin" /> Compressing image...
                </div>
              ) : newScreenshot ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #10B981', flexShrink: 0 }}>
                    <img src={newScreenshot} alt="New Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#065F46' }}>New Screenshot Selected ✓</div>
                    <div style={{ fontSize: '0.72rem', color: '#047857' }}>Tap to choose another</div>
                  </div>
                </div>
              ) : (
                <>
                  <Camera size={22} color="#71717A" style={{ marginBottom: '6px' }} />
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#09090B' }}>
                    Tap to Choose New Screenshot
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#71717A', marginTop: '2px' }}>
                    JPG, PNG or Screenshot from UPI App
                  </div>
                </>
              )}
            </label>
          </div>

          {/* Optional Phone correction if needed */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#09090B', marginBottom: '6px' }}>
              Phone Number (Verify)
            </label>
            <input 
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+91 9876543210"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '14px',
                border: '1.5px solid #E4E4E7',
                background: '#F4F4F5',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#09090B'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isCompressing}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '16px',
              background: '#09090B',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              border: 'none',
              cursor: (isSubmitting || isCompressing) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
            }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Submitting for Review...
              </>
            ) : (
              <>
                Re-Submit Verification
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Support & Logout */}
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F4F4F5', paddingTop: '12px' }}>
          <span style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 600 }}>
            Support: cupid.livepro@gmail.com
          </span>

          <button
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717A',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <LogOut size={13} />
            Log Out
          </button>
        </div>

      </div>

    </div>
  );
}
