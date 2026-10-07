import React, { useState, useRef } from 'react';
import { 
  AlertCircle, Camera, Plus, Trash2, ArrowRight, RefreshCw, 
  LogOut, ShieldAlert, CheckCircle2, User, Image as ImageIcon, Sparkles 
} from 'lucide-react';
import { fileToCompressedBase64 } from '../../utils/imageUpload';
import { reSubmitVerification } from '../../lib/cloudSync';

export default function VerificationRejectedModal({ 
  userProfile, 
  onResubmitted, 
  onEditFullProfile, 
  onLogout 
}) {
  const isWoman = userProfile?.gender === 'Woman';
  
  // Extract and clean rejection reason
  const rawReason = userProfile?.rejectionReason || 
    (userProfile?.prompt2_answer && userProfile.prompt2_answer.startsWith('[REJECTION]:')
      ? userProfile.prompt2_answer.replace('[REJECTION]:', '').trim()
      : '') || 
    'Profile verification could not be completed.';
  
  const rejectionReason = rawReason.trim();
  const reasonLower = rejectionReason.toLowerCase();

  // Reason Categorization
  const isPhotoIssue = reasonLower.includes('photo') || 
                       reasonLower.includes('image') || 
                       reasonLower.includes('fake') || 
                       reasonLower.includes('impersonat') || 
                       reasonLower.includes('blur') ||
                       reasonLower.includes('inappropriate');

  // Men only can have payment issue (women always free)
  const isPaymentIssue = !isWoman && (
    reasonLower.includes('payment') || 
    reasonLower.includes('receipt') || 
    reasonLower.includes('screenshot') || 
    reasonLower.includes('upi') || 
    reasonLower.includes('amount') || 
    reasonLower.includes('mismatch') || 
    reasonLower.includes('chargeback')
  );

  // Initial photos: up to 6 slots
  const initialPhotos = Array.isArray(userProfile?.photos) && userProfile.photos.length > 0
    ? [...userProfile.photos.slice(0, 6), ...Array(Math.max(0, 6 - userProfile.photos.length)).fill(null)]
    : [null, null, null, null, null, null];

  const [photos, setPhotos] = useState(initialPhotos.slice(0, 6));
  const [activeSlotIdx, setActiveSlotIdx] = useState(null);
  const [newScreenshot, setNewScreenshot] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const photoFileInputRef = useRef(null);
  const screenshotInputRef = useRef(null);

  // Trigger file picker for specific photo slot
  const handleSlotClick = (idx) => {
    setActiveSlotIdx(idx);
    if (photoFileInputRef.current) {
      photoFileInputRef.current.value = '';
      photoFileInputRef.current.click();
    }
  };

  // Process chosen photo for slot
  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || activeSlotIdx === null) return;

    setIsCompressing(true);
    setErrorMessage('');
    try {
      const compressed = await fileToCompressedBase64(file, 900, 0.78);
      if (compressed) {
        setPhotos(prev => {
          const next = [...prev];
          next[activeSlotIdx] = compressed;
          return next;
        });
      }
    } catch (err) {
      console.error('Error compressing photo:', err);
      setErrorMessage('Could not process photo. Please choose another image.');
    } finally {
      setIsCompressing(false);
      setActiveSlotIdx(null);
    }
  };

  const handleRemovePhoto = (idx) => {
    setPhotos(prev => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  };

  // Process payment receipt (men only)
  const handleScreenshotChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setErrorMessage('');
    try {
      const compressed = await fileToCompressedBase64(file, 1000, 0.82);
      setNewScreenshot(compressed);
    } catch (err) {
      setErrorMessage('Could not process receipt screenshot. Please try another image.');
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle re-submission based on context
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (isPhotoIssue || (!isPaymentIssue && !newScreenshot)) {
      const cleanPhotos = photos.filter(Boolean);
      if (cleanPhotos.length === 0) {
        setErrorMessage('Please upload at least 1 clear profile photo to re-submit.');
        return;
      }
    } else if (isPaymentIssue && !isWoman) {
      if (!newScreenshot && !userProfile?.paymentProofUrl) {
        setErrorMessage('Please upload your valid payment receipt screenshot.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const cleanPhotos = photos.filter(Boolean);
      const email = userProfile?.email;

      const updatedPayload = {};
      if (cleanPhotos.length > 0) {
        updatedPayload.photos = cleanPhotos;
      }

      await reSubmitVerification(
        email, 
        newScreenshot || userProfile?.paymentProofUrl || null, 
        updatedPayload
      );

      setSuccessMessage('✓ Re-submitted for review! Cufy team will verify your update shortly.');

      setTimeout(() => {
        const updatedUser = {
          ...userProfile,
          status: 'pending_approval',
          is_verified: false,
          rejectionReason: '',
          photos: cleanPhotos.length > 0 ? cleanPhotos : userProfile?.photos || [],
          paymentProofUrl: newScreenshot || userProfile?.paymentProofUrl || null
        };
        if (onResubmitted) onResubmitted(updatedUser);
      }, 900);
    } catch (err) {
      console.error('Re-submit error:', err);
      setErrorMessage('Failed to re-submit. Please check connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      width: '100%', height: '100%',
      background: '#FAF8F5',
      zIndex: 1050,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      boxSizing: 'border-box'
    }} className="animate-fade-in">

      {/* Hidden File Inputs */}
      <input 
        ref={photoFileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handlePhotoFileChange}
        style={{ display: 'none' }}
      />
      <input 
        ref={screenshotInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleScreenshotChange}
        style={{ display: 'none' }}
      />

      {/* Main Responsive View Container (fits all phones perfectly) */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        margin: '0 auto',
        padding: '20px 18px 40px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>

        {/* Minimal Header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '1.45rem', fontWeight: 900, fontFamily: 'serif', fontStyle: 'italic', color: '#09090B' }}>
            cufy<span style={{ color: '#FF3B30', fontStyle: 'normal' }}>.</span>
          </span>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: '#FEE2E2',
            color: '#DC2626',
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '5px 10px',
            borderRadius: '999px',
            letterSpacing: '0.3px',
            textTransform: 'uppercase'
          }}>
            <ShieldAlert size={12} /> Action Required
          </span>
        </header>

        {/* Title & Icon Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '56px', height: '56px',
            borderRadius: '18px',
            background: '#FEF2F2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
            boxShadow: '0 8px 20px rgba(220,38,38,0.12)'
          }}>
            <AlertCircle size={28} />
          </div>

          <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#09090B', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            Verification Rejected
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#71717A', margin: 0, fontWeight: 500 }}>
            Hi <b>{userProfile?.name || 'Member'}</b>, admin reviewed your profile.
          </p>
        </div>

        {/* Clean Admin Reason Banner */}
        <div style={{
          background: '#FFF5F5',
          border: '1.5px solid #FECACA',
          borderRadius: '18px',
          padding: '14px 16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Reason from Admin
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#7F1D1D', lineHeight: 1.4 }}>
            "{rejectionReason}"
          </div>
          <div style={{ fontSize: '0.74rem', color: '#B91C1C', marginTop: '6px', fontWeight: 500 }}>
            {isPhotoIssue ? (
              <span>Please replace your photos with real, recent, and clear photos of yourself below.</span>
            ) : isPaymentIssue ? (
              <span>Please upload a clear screenshot of your valid payment receipt below.</span>
            ) : (
              <span>Please update your details below to re-submit for instant review.</span>
            )}
          </div>
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B',
            padding: '10px 14px', borderRadius: '14px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '14px', textAlign: 'center'
          }}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{
            background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46',
            padding: '10px 14px', borderRadius: '14px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '14px', textAlign: 'center'
          }}>
            {successMessage}
          </div>
        )}

        {/* MAIN RE-SUBMIT FORM */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* ======================================================== */}
          {/* CASE 1: PHOTO / FAKE PROFILE REJECTION -> 6-SLOT PHOTO GRID */}
          {/* ======================================================== */}
          {(isPhotoIssue || (!isPaymentIssue && isWoman)) && (
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 800, color: '#09090B' }}>
                  Upload Real Profile Photos
                </label>
                <span style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 600 }}>
                  Tap box to choose photo
                </span>
              </div>

              {/* Responsive 3x2 Photo Upload Grid (Matches Cufy Aesthetics) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginBottom: '12px'
              }}>
                {photos.map((photoUrl, idx) => {
                  const hasPhoto = Boolean(photoUrl);
                  return (
                    <div
                      key={idx}
                      onClick={() => !hasPhoto && handleSlotClick(idx)}
                      style={{
                        aspectRatio: '3 / 4',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        position: 'relative',
                        background: hasPhoto ? '#09090B' : '#FFFFFF',
                        border: hasPhoto ? '2px solid #FF3B30' : '2px dashed #D4D4D8',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: hasPhoto ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: hasPhoto ? '0 4px 14px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      {hasPhoto ? (
                        <>
                          <img 
                            src={photoUrl} 
                            alt={`Profile photo ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                          
                          {/* Remove / Replace Photo Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(idx);
                            }}
                            title="Remove photo"
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '8px',
                              background: 'rgba(9,9,11,0.75)',
                              color: '#FFFFFF',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>

                          {/* Main DP Badge on first photo */}
                          {idx === 0 && (
                            <span style={{
                              position: 'absolute',
                              bottom: '6px',
                              left: '6px',
                              background: '#FF3B30',
                              color: '#FFFFFF',
                              fontSize: '0.58rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '6px'
                            }}>
                              Main DP
                            </span>
                          )}
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '10px',
                            background: '#FFF0F0',
                            color: '#FF3B30',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Plus size={16} />
                          </div>
                          <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#71717A' }}>
                            {idx === 0 ? 'Main Photo' : `Photo ${idx + 1}`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {isCompressing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#71717A', fontSize: '0.74rem', fontWeight: 600 }}>
                  <RefreshCw size={14} className="animate-spin" /> Compressing selected photo...
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* CASE 2: PAYMENT REJECTION -> RECEIPT UPLOAD (MEN ONLY) */}
          {/* ======================================================== */}
          {isPaymentIssue && !isWoman && (
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#09090B', marginBottom: '8px' }}>
                Upload Valid Payment Receipt
              </label>

              <div
                onClick={() => screenshotInputRef.current?.click()}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px 16px',
                  borderRadius: '18px',
                  border: newScreenshot ? '2px solid #10B981' : '2px dashed #D4D4D8',
                  background: newScreenshot ? '#F0FDF4' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {isCompressing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717A', fontSize: '0.8rem', fontWeight: 700 }}>
                    <RefreshCw size={18} className="animate-spin" /> Processing image...
                  </div>
                ) : newScreenshot ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #10B981', flexShrink: 0 }}>
                      <img src={newScreenshot} alt="New Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#065F46' }}>Receipt Selected ✓</div>
                      <div style={{ fontSize: '0.72rem', color: '#047857' }}>Tap to choose another</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Camera size={24} color="#71717A" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#09090B' }}>
                      Tap to Choose New Screenshot
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#71717A', marginTop: '2px' }}>
                      JPG or PNG showing UPI transaction ID
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* CASE 3: WOMAN NOTIFICATION ON PAYMENT (FREE PASS EXPLANATION) */}
          {/* ======================================================== */}
          {isWoman && isPaymentIssue && (
            <div style={{
              background: '#FDF2F8',
              border: '1px solid #FBCFE8',
              borderRadius: '16px',
              padding: '12px 14px',
              marginBottom: '20px',
              fontSize: '0.76rem',
              color: '#DB2777',
              fontWeight: 600
            }}>
              ✨ <b>Free Pass for Women:</b> Membership is 100% free for women on Cufy. No payment receipt is required. Please update your profile photos above so we can verify your profile.
            </div>
          )}

          {/* Optional: Link to edit full profile in wizard */}
          {onEditFullProfile && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={onEditFullProfile}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FF3B30',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Or re-open Full Profile Setup to edit all details →
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              style={{
                width: '100%',
                padding: '14px',
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
                boxShadow: '0 8px 24px rgba(9,9,11,0.18)'
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Submitting for Review...
                </>
              ) : (
                <>
                  {isPhotoIssue ? 'Submit Updated Photos for Review' : isPaymentIssue ? 'Re-Submit Payment Receipt' : 'Re-Submit Verification'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Support & Log Out */}
        <footer style={{
          marginTop: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #E4E4E7',
          paddingTop: '14px'
        }}>
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
        </footer>

      </div>

    </div>
  );
}
