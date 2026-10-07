import React, { useState } from 'react';
import { Clock, ShieldAlert, Copy, ExternalLink, Camera, Check, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { compressAndStoreImage } from '../../utils/imageUpload';
import { supabase } from '../../lib/supabase';
import { syncUserToCloud } from '../../lib/cloudSync';

export default function MembershipExpiredModal({ userProfile, onRenewSubmitted, onLogout }) {
  const [selectedPlan, setSelectedPlan] = useState({
    id: 'month_799',
    title: '1 Month VIP Pass',
    price: 799,
    days: 30,
    highlight: true,
    note: 'Includes 1 FREE Boost ⚡'
  });

  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const plans = [
    { id: 'day_199', title: '1 Day Pass', price: 199, days: 1, note: '24 Hours VIP Access' },
    { id: 'week_299', title: '1 Week Pass', price: 299, days: 7, note: '7 Days VIP Access' },
    { id: 'days15_499', title: '15 Days Pass', price: 499, days: 15, note: '15 Days VIP Access' },
    { id: 'month_799', title: '1 Month VIP Pass', price: 799, days: 30, highlight: true, note: '30 Days • Most Popular • 1 Free Boost ⚡' }
  ];

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('aditya.378@superyes');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleScreenshotChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setErrorMsg('');
    try {
      const compressedDataUrl = await compressAndStoreImage(file);
      setPaymentScreenshot(compressedDataUrl);
    } catch (err) {
      console.error('Screenshot compression error:', err);
      setErrorMsg('Failed to process image. Please try another photo.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleOpenUpiApp = () => {
    window.location.href = `upi://pay?pa=aditya.378@superyes&pn=Cufy%20Renewal&am=${selectedPlan.price}&cu=INR`;
  };

  const handleSubmitRenewal = async (e) => {
    e.preventDefault();
    if (!paymentScreenshot) {
      setErrorMsg('Please upload your payment screenshot before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const cleanEmail = (userProfile?.email || '').toLowerCase().trim();
      const updatedProfile = {
        ...userProfile,
        status: 'pending_approval',
        plan: selectedPlan.title,
        planId: selectedPlan.id,
        planPrice: selectedPlan.price,
        planDays: selectedPlan.days,
        paymentProofUrl: paymentScreenshot,
        is_verified: false,
        startsAt: null,
        expiresAt: null
      };

      // 1. Update Supabase memberships
      if (supabase) {
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (prof?.id) {
            await supabase
              .from('profiles')
              .update({ is_verified: false, updated_at: new Date().toISOString() })
              .eq('id', prof.id);

            await supabase
              .from('memberships')
              .upsert({
                user_id: prof.id,
                plan_type: selectedPlan.id === 'day_199' ? '1_day' : selectedPlan.id === 'week_299' ? '1_week' : selectedPlan.id === 'days15_499' ? '15_days' : '1_month',
                price: selectedPlan.price,
                screenshot_url: paymentScreenshot,
                status: 'pending',
                starts_at: null,
                expires_at: null,
                created_at: new Date().toISOString()
              });
          }
        } catch (sbErr) {
          console.warn('Supabase renewal error:', sbErr);
        }
      }

      // 2. Sync to cloud & localStorage
      await syncUserToCloud(updatedProfile);

      setIsSuccess(true);
      setTimeout(() => {
        if (onRenewSubmitted) {
          onRenewSubmitted(updatedProfile);
        }
      }, 1200);
    } catch (err) {
      console.error('Renewal submission failed:', err);
      setErrorMsg('Submission error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const expiredDateFormatted = userProfile?.expiresAt 
    ? new Date(userProfile.expiresAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    : 'Recently';

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(9, 9, 11, 0.88)',
      backdropFilter: 'blur(20px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#FFFFFF',
        borderRadius: '28px',
        padding: '24px 20px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        maxHeight: '92vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }} className="animate-fade-in">

        {/* Top Expired Banner */}
        <div style={{
          background: '#FEF2F2',
          border: '1.5px solid #FCA5A5',
          borderRadius: '20px',
          padding: '16px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: '#FEE2E2', color: '#DC2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px', boxShadow: '0 4px 12px rgba(220,38,38,0.2)'
          }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#991B1B', margin: '0 0 4px' }}>
            Plan Expired
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#7F1D1D', margin: 0, fontWeight: 600, lineHeight: 1.4 }}>
            Hi <b>{userProfile?.name || 'Member'}</b>, your <b>{userProfile?.plan || 'Membership Pass'}</b> ended on <b>{expiredDateFormatted}</b>.
            Your account is locked until you renew.
          </p>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B', marginBottom: '8px' }}>
              Renewal Screenshot Submitted!
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#52525B', lineHeight: '1.5' }}>
              Admin has received your payment proof for verification. Your timer will start immediately once approved.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitRenewal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Step 1: Choose Plan */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#09090B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                1. Select Renewal Plan
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {plans.map((p) => {
                  const isSel = selectedPlan.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        border: isSel ? '2px solid #FF3B30' : '1.5px solid #E4E4E7',
                        background: isSel ? '#FFF0F0' : '#FFFFFF',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isSel ? '#FF3B30' : '#09090B' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#09090B', marginTop: '2px' }}>
                        ₹{p.price}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: isSel ? '#FF3B30' : '#71717A', fontWeight: 600, marginTop: '2px' }}>
                        {p.note}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: UPI Payment Details */}
            <div style={{
              background: '#F5F3EF',
              borderRadius: '18px',
              padding: '14px',
              border: '1.5px solid #E4E4E7'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#52525B', textTransform: 'uppercase' }}>
                  2. Pay ₹{selectedPlan.price} via UPI
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#FF3B30' }}>
                  ₹{selectedPlan.price}
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFFFFF',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #E4E4E7'
              }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#09090B', fontFamily: 'monospace' }}>
                  aditya.378@superyes
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '6px 10px', borderRadius: '8px',
                    background: copiedUpi ? '#DCFCE7' : '#09090B',
                    color: copiedUpi ? '#16A34A' : '#FFFFFF',
                    border: 'none', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 800
                  }}
                >
                  {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                  {copiedUpi ? 'Copied' : 'Copy'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenUpiApp}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '10px',
                  borderRadius: '12px',
                  background: '#09090B',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <ExternalLink size={14} />
                Open GPay / PhonePe / Paytm (₹{selectedPlan.price})
              </button>
            </div>

            {/* Step 3: Screenshot Upload */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#09090B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                3. Upload Payment Screenshot
              </div>

              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                border: paymentScreenshot ? '2px solid #10B981' : '2px dashed #D4D4D8',
                borderRadius: '18px',
                background: paymentScreenshot ? '#F0FDF4' : '#FAFAFA',
                cursor: 'pointer',
                position: 'relative',
                minHeight: '100px'
              }}>
                {isCompressing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717A', fontSize: '0.85rem', fontWeight: 700 }}>
                    <RefreshCw className="animate-spin" size={18} />
                    Processing photo...
                  </div>
                ) : paymentScreenshot ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <img 
                      src={paymentScreenshot} 
                      alt="Uploaded proof" 
                      style={{ width: '56px', height: '64px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #10B981' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={16} /> Screenshot Ready
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#71717A', marginTop: '2px' }}>
                        Tap here to change image
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Camera size={26} color="#FF3B30" style={{ marginBottom: '6px' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#09090B' }}>
                      Tap to Upload Screenshot
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#71717A', marginTop: '2px' }}>
                      PNG or JPG from your payment app
                    </span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleScreenshotChange} 
                  style={{ display: 'none' }} 
                  disabled={isCompressing || isSubmitting}
                />
              </label>
            </div>

            {errorMsg && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                textAlign: 'center'
              }}>
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isCompressing || !paymentScreenshot}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '0.95rem',
                opacity: (!paymentScreenshot || isSubmitting) ? 0.6 : 1,
                cursor: (!paymentScreenshot || isSubmitting) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <RefreshCw className="animate-spin" size={18} />
                  Submitting Renewal...
                </span>
              ) : (
                `Renew ${selectedPlan.title} (₹${selectedPlan.price})`
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717A',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px'
              }}
            >
              <LogOut size={14} />
              Log Out of Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
