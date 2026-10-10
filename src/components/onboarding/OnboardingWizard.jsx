import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, Lock, CreditCard, ShieldCheck, Sparkles, MapPin, Zap, Pause, Play, Bell, Mic, Copy, Eye, Plus, Minus, Heart, User, Trash2, Camera, HelpCircle, AlertCircle } from 'lucide-react';
import { validateName, validateEmail, validatePhotos, checkRateLimit } from '../../utils/validation';
import { fileToCompressedBase64 } from '../../utils/imageUpload';
import VoiceNoteRecorder from '../common/VoiceNoteRecorder';
import { isFreeLaunchPeriodActive, FREE_PROMO_END_DATE, getFreePromoRemainingDays } from '../../utils/promoManager';

export default function OnboardingWizard({ initialData, onCompleteOnboarding, onCancel }) {
  // Total onboarding step count including question steps and interstitials
  const [step, setStep] = useState(1);
  const totalSteps = 19;
  const [stepError, setStepError] = useState('');

  // File Input Ref for User Photo Uploads
  const fileInputRef = useRef(null);
  const [activeSlotIdx, setActiveSlotIdx] = useState(null);

  // Onboarding Form State (Cleaned up from hardcoded dummy strings)
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    name: initialData?.name || '',
    email: initialData?.email || '',
    day: '15',
    month: '06',
    year: '2002',
    location: initialData?.location || 'New Delhi',
    gender: 'Woman',
    pronouns: 'she/her',
    heightFeet: 5,
    heightInches: 5,
    heightUnit: 'FT',
    ethnicity: ['South Asian'],
    interestedIn: 'Men',
    intent: 'Serious relationship',
    college: '',
    degree: '',
    jobTitle: '',
    hometown: '',
    religion: 'Spiritual',
    drinking: 'Socially',
    smoking: 'Never',
    drugs: 'Never',
    photos: (initialData?.photos && Array.isArray(initialData.photos) && initialData.photos.some(Boolean))
      ? initialData.photos
      : [null, null, null, null, null, null],
    bio: '',
    prompt1: 'Together, we could...',
    prompt1Answer: '',
    prompt2: 'I get along best with people who...',
    prompt2Answer: '',
    voiceNoteUrl: null,
    voiceRecorded: false
  });

  // Hinge-Style Age Confirmation Bottom Sheet Popup State
  const [showAgePopup, setShowAgePopup] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState(22);

  // OTP Verification State
  const [otpVerified, setOtpVerified] = useState(false);

  // Voice Recording 30s Countdown State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(30);

  // Payment Tiers & Screenshot Upload State
  const [selectedPlan, setSelectedPlan] = useState({ id: 'week_299', title: '1 Week VIP Pass', price: 299, type: 'membership' });
  const [paymentProofUrl, setPaymentProofUrl] = useState(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Real Geolocation Detection Handler
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.suburb || data.address?.state_district || 'New Delhi';
          const country = data.address?.country || 'India';
          setFormData(prev => ({ ...prev, location: `${city}, ${country}` }));
        } catch (e) {
          setFormData(prev => ({ ...prev, location: 'New Delhi, India' }));
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        setFormData(prev => ({ ...prev, location: 'New Delhi, India' }));
        setIsDetectingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Real Native Push Notification Permission Popup Handler
  const handleRequestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission result:', permission);
        handleNext();
      }).catch(() => {
        handleNext();
      });
    } else {
      handleNext();
    }
  };

  // Voice Recording 30s Countdown Timer Effect
  useEffect(() => {
    let timerInterval;
    if (isRecording) {
      setRecordingSeconds(30);
      timerInterval = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            setIsRecording(false);
            setRecordedAudio(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [isRecording]);

  // 3-Second Interstitial Auto-Timer State
  const [interstitialTimer, setInterstitialTimer] = useState(3);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Available Haikei Background Images from public/photos/
  const haikeiBgs = [
    '/photos/haikei2 (1).png',
    '/photos/haikei2 (2).png',
    '/photos/haikei2 (3).png',
    '/photos/layered-waves-haikei.png',
    '/photos/layered-waves-haikei (1).png'
  ];

  const photoPresets = [
    '/photos/couple1.jpg',
    '/photos/couple2.jpg',
    '/photos/couple3.jpg',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80'
  ];

  // UPFRONT IMAGE PRELOADER to fix late-appearing couple and background images!
  useEffect(() => {
    const allImagesToPreload = [
      '/photos/couple1.jpg',
      '/photos/couple2.jpg',
      '/photos/couple3.jpg',
      '/photos/couple4.jpg',
      '/photos/couple5.jpg',
      '/photos/haikei2 (1).png',
      '/photos/haikei2 (2).png',
      '/photos/haikei2 (3).png',
      '/photos/layered-waves-haikei.png',
      '/photos/layered-waves-haikei (1).png'
    ];

    allImagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Auto-Timer Effect for Interstitial Slides (Step 4, Step 9, Step 14)
  useEffect(() => {
    const isInterstitialStep = step === 4 || step === 9 || step === 14;
    if (!isInterstitialStep || isTimerPaused) return;

    setInterstitialTimer(3);
    const interval = setInterval(() => {
      setInterstitialTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleNext();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, isTimerPaused]);

  // Clear step error when step changes
  useEffect(() => {
    setStepError('');
  }, [step]);

  // Calculate age from day/month/year
  const triggerAgeCheck = () => {
    const d = parseInt(formData.day, 10) || 1;
    const m = parseInt(formData.month, 10) || 1;
    const y = parseInt(formData.year, 10) || 2002;
    const birthDate = new Date(y, m - 1, d);
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const mDiff = now.getMonth() - birthDate.getMonth();
    if (mDiff < 0 || (mDiff === 0 && now.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      setStepError('You must be at least 18 years old to join Cufy.');
      return false;
    }
    setCalculatedAge(age > 0 ? age : 22);
    setShowAgePopup(true);
    return true;
  };

  const handleNext = () => {
    if (!checkRateLimit('onboarding_next', 150)) return;

    // STEP 1: Phone Validation (Compulsory, 10 digits)
    if (step === 1) {
      const digitsOnly = (formData.phone || '').replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        setStepError('Please enter a valid 10-digit mobile number to continue.');
        return;
      }
      setStepError('');
    }

    // STEP 2: Name & Email Validation (Both Compulsory)
    if (step === 2) {
      const trimmedName = (formData.name || '').trim();
      if (trimmedName.length < 2) {
        setStepError('Please enter your name (minimum 2 characters) to continue.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email || !emailRegex.test(formData.email.trim())) {
        setStepError('Please enter a valid email address to continue.');
        return;
      }
      setStepError('');
    }

    // STEP 3: Age / Birthday Validation (Compulsory, >= 18)
    if (step === 3 && !showAgePopup) {
      const valid = triggerAgeCheck();
      if (!valid) return;
      return;
    }

    // STEP 16: Profile Photos (Compulsory, MINIMUM 2 PHOTOS!)
    if (step === 16) {
      const uploadedCount = (formData.photos || []).filter(p => Boolean(p) && typeof p === 'string' && p.length > 20).length;
      if (uploadedCount < 2) {
        setStepError('Please upload at least 2 profile photos to continue.');
        return;
      }
      setStepError('');
    }

    setStepError('');
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setStepError('');
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      onCancel();
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText('aditya.378@superyes');
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  };

  const buildCompletedData = (customOverrides = {}) => {
    const planDays = formData.gender === 'Woman' ? 99999 : (selectedPlan.id === 'day_199' ? 1 : selectedPlan.id === 'week_299' ? 7 : selectedPlan.id === 'days15_499' ? 15 : 30);
    const heightString = formData.heightFeet ? `${formData.heightFeet}'${formData.heightInches || 0}"` : "5'5\"";
    const educationString = formData.college || formData.degree || formData.education || '';
    const jobTitleString = formData.jobTitle || formData.occupation || '';
    const cityString = formData.location || formData.city || 'Greater Noida';
    const finalAge = calculatedAge || formData.age || 22;

    return {
      ...formData,
      age: finalAge,
      city: cityString,
      location: cityString,
      height: heightString,
      heightFeet: formData.heightFeet || 5,
      heightInches: formData.heightInches || 0,
      education: educationString,
      college: educationString,
      jobTitle: jobTitleString,
      occupation: jobTitleString,
      religion: formData.religion || 'Spiritual',
      bio: formData.bio || '',
      prompt1: formData.prompt1 || 'Together, we could...',
      prompt1Answer: formData.prompt1Answer || '',
      prompt2: formData.prompt2 || 'I get along best with people who...',
      prompt2Answer: formData.prompt2Answer || '',
      promptQuestion: formData.prompt1 || 'Together, we could...',
      promptAnswer: formData.prompt1Answer || '',
      photos: (formData.photos || []).filter(p => Boolean(p) && typeof p === 'string' && p.length > 20),
      plan: formData.gender === 'Woman' 
        ? 'Lifetime VIP Pass' 
        : isFreeLaunchPeriodActive() 
          ? 'Launch Promo VIP Pass (Free until Oct 15)' 
          : selectedPlan.title,
      planId: formData.gender === 'Woman' 
        ? 'lifetime_women' 
        : isFreeLaunchPeriodActive() 
          ? 'free_launch_promo' 
          : selectedPlan.id,
      planPrice: (formData.gender === 'Woman' || isFreeLaunchPeriodActive()) ? 0 : selectedPlan.price,
      planDays: formData.gender === 'Woman' ? 99999 : isFreeLaunchPeriodActive() ? 30 : planDays,
      paymentProofUrl: (formData.gender === 'Woman' || isFreeLaunchPeriodActive()) ? null : paymentProofUrl,
      voiceNoteUrl: formData.voiceNoteUrl || null,
      voice_note_url: formData.voiceNoteUrl || null,
      status: (formData.gender === 'Woman' || isFreeLaunchPeriodActive()) ? 'approved' : 'pending_approval',
      expiresAt: formData.gender === 'Woman' 
        ? null 
        : isFreeLaunchPeriodActive() 
          ? FREE_PROMO_END_DATE.toISOString() 
          : new Date(Date.now() + planDays * 24 * 60 * 60 * 1000).toISOString(),
      ...customOverrides
    };
  };

  const handlePayment = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const isFree = formData.gender === 'Woman' || isFreeLaunchPeriodActive();

    if (!isFree && !paymentProofUrl) {
      setStepError('Please upload your UPI payment transaction screenshot before submitting.');
      alert('Please upload your UPI payment transaction screenshot before submitting.');
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        onCompleteOnboarding(buildCompletedData());
      }, 500);
    }, 600);
  };

  // Height Control Handlers (FT/IN & CM sync)
  const updateFeet = (delta) => {
    const newFeet = Math.min(7, Math.max(3, formData.heightFeet + delta));
    setFormData(prev => ({ ...prev, heightFeet: newFeet }));
  };

  const updateInches = (delta) => {
    let newInches = formData.heightInches + delta;
    let newFeet = formData.heightFeet;
    if (newInches > 11) {
      newInches = 0;
      newFeet = Math.min(7, newFeet + 1);
    } else if (newInches < 0) {
      newInches = 11;
      newFeet = Math.max(3, newFeet - 1);
    }
    setFormData(prev => ({ ...prev, heightFeet: newFeet, heightInches: newInches }));
  };

  const currentTotalInches = formData.heightFeet * 12 + formData.heightInches;
  const currentCm = Math.round(currentTotalInches * 2.54);

  const updateCm = (newCm) => {
    const clampedCm = Math.min(220, Math.max(120, newCm));
    const totalInches = Math.round(clampedCm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    setFormData(prev => ({
      ...prev,
      heightFeet: Math.min(7, Math.max(3, feet)),
      heightInches: Math.min(11, Math.max(0, inches))
    }));
  };

  // User Photo Upload Slot Handler
  const triggerPhotoUpload = (slotIdx) => {
    setActiveSlotIdx(slotIdx);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file && activeSlotIdx !== null) {
      try {
        const imageUrl = await fileToCompressedBase64(file, 640, 0.72);
        const newPhotos = [...formData.photos];
        newPhotos[activeSlotIdx] = imageUrl;
        setFormData(prev => ({ ...prev, photos: newPhotos }));
        setStepError('');
      } catch (err) {
        console.error('Failed to convert photo:', err);
      }
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const removePhoto = (slotIdx) => {
    const newPhotos = [...formData.photos];
    newPhotos[slotIdx] = null;
    setFormData({ ...formData, photos: newPhotos });
  };

  // TRUE EDGE-TO-EDGE FULL SCREEN Interstitial Slide Component
  const isInterstitial = step === 4 || step === 9 || step === 14;

  if (isInterstitial) {
    let slideImg = '/photos/couple1.jpg';
    let headline = 'Your profile is a glimpse of you.';
    let subtitle = 'Deepen connection with simple steps that bring you closer every single day.';

    if (step === 9) {
      slideImg = '/photos/couple2.jpg';
      headline = 'Intentional moments make lasting bonds.';
      subtitle = 'Quality over quantity in every connection you choose to explore.';
    } else if (step === 14) {
      slideImg = '/photos/couple3.jpg';
      headline = 'Authentic connections with zero noise.';
      subtitle = 'One curated connection paired with you every single day.';
    }

    return (
      <div className="full-screen-interstitial animate-fade-in">
        {/* Hidden Preloaded Images Buffer */}
        <div style={{ display: 'none' }}>
          {photoPresets.map((src, i) => <img key={i} src={src} alt="preload buffer" />)}
        </div>

        {/* Edge-to-Edge Full Screen Image */}
        <img 
          src={slideImg} 
          alt="Full screen couple portrait" 
          className="interstitial-bg-img" 
          loading="eager"
        />

        {/* Top Header Bar inside Interstitial */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 30
        }}>
          <button onClick={handlePrev} style={{ padding: '8px 14px', background: 'rgba(255, 255, 255, 0.88)', backdropFilter: 'blur(12px)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.9)' }} aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#09090B', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', padding: '6px 12px', borderRadius: '12px' }}>
            Step {step} of {totalSteps}
          </span>
        </div>

        {/* Bottom Vignette Overlay Anchored Cleanly at Bottom of Viewport */}
        <div className="interstitial-vignette-overlay">
          <h2 className="editorial-title animate-slide-up-1" style={{ fontSize: '2.3rem', fontWeight: 800, color: '#09090B', marginBottom: '8px' }}>
            {headline}
          </h2>

          <p className="editorial-subtitle animate-slide-up-2" style={{ fontSize: '1.02rem', color: '#3F3F46', fontWeight: 500, maxWidth: '310px', marginBottom: '24px' }}>
            {subtitle}
          </p>

          {/* Black Rounded Pill CTA Button Anchored at Bottom */}
          <button onClick={handleNext} className="btn-black-pill animate-slide-up-3">
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Current Haikei background image URL
  const currentHaikeiBg = haikeiBgs[step % haikeiBgs.length];

  return (
    <div style={{
      position: 'relative',
      height: '100%',
      minHeight: '100%',
      flex: 1,
      backgroundColor: '#F5F3EF',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '16px 24px 24px',
      overflow: 'hidden'
    }} className="animate-fade-in">
      
      {/* Hidden File Input for Real Photo Uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />

      {/* Full Screen Haikei Background Coverage for Question Steps */}
      <img 
        src={currentHaikeiBg} 
        alt="Haikei background graphic"
        loading="eager"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.14,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Compact Top Header Bar */}
      <div style={{ position: 'relative', zIndex: 10, paddingTop: '2px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <button 
            onClick={handlePrev} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              padding: '4px 0', 
              color: '#09090B', 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer' 
            }} 
            aria-label="Go back"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 800, color: '#71717A' }}>
            <span>Step {step} of {totalSteps}</span>
            {step === 18 && (
              <button
                type="button"
                onClick={() => {
                  setStepError('');
                  setStep(prev => prev + 1);
                }}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #D4D4D8',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  color: '#09090B',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Skip voice recording"
              >
                Skip <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Animated Progress Bar shifted right under top row */}
        <div className="progress-bar-container" style={{ marginBottom: '6px', height: '4px' }}>
          <div className="progress-bar-fill" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
        </div>
      </div>

      {/* Question Body Scroll Container with Key-driven Smooth Step Glide Wrapper */}
      <div style={{ flex: 1, position: 'relative', zIndex: 10, overflowY: 'auto', padding: '0 4px 12px', display: 'flex', flexDirection: 'column' }}>
        <form key={step} onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="step-glide-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

          {/* Clean Real-time Validation Error Banner */}
          {stepError && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              padding: '10px 14px',
              borderRadius: '14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} flexShrink={0} />
              <span>{stepError}</span>
            </div>
          )}

          {/* STEP 1: Phone Number */}
          {step === 1 && (
            <div>
              <h1 className="editorial-title">Can we get your number?</h1>
              <p className="editorial-subtitle">Cufy uses your phone number to verify authentic members (Compulsory).</p>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">
                  Phone Number *
                  {Boolean(initialData?.phone) && (
                    <span style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 700, marginLeft: '6px' }}>
                      (Verified • Locked)
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    defaultValue="+91" 
                    style={{ width: '75px', textAlign: 'center', fontWeight: 800 }} 
                    className="form-input" 
                    readOnly
                  />
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(e) => {
                      if (initialData?.phone) return;
                      setFormData({ ...formData, phone: e.target.value });
                      if (stepError) setStepError('');
                    }} 
                    readOnly={Boolean(initialData?.phone)}
                    placeholder="98765 43210"
                    className="form-input"
                    style={initialData?.phone ? { backgroundColor: '#F4F4F5', cursor: 'not-allowed', color: '#52525B', borderColor: '#E4E4E7' } : {}}
                    maxLength={15}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Name & Email */}
          {step === 2 && (
            <div>
              <h1 className="editorial-title">What is your name & email?</h1>
              <p className="editorial-subtitle">Both fields are strictly required to verify your profile.</p>

              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (stepError) setStepError('');
                  }} 
                  placeholder="Enter your name"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Email Address * 
                  {(initialData?.authProvider === 'google' || Boolean(initialData?.email)) && (
                    <span style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 700, marginLeft: '6px' }}>
                      (Verified Google Account)
                    </span>
                  )}
                </label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => {
                    if (initialData?.authProvider === 'google' || Boolean(initialData?.email)) return;
                    setFormData({ ...formData, email: e.target.value });
                    if (stepError) setStepError('');
                  }} 
                  readOnly={initialData?.authProvider === 'google' || Boolean(initialData?.email)}
                  placeholder="name@example.com"
                  className="form-input"
                  style={initialData?.authProvider === 'google' || Boolean(initialData?.email) ? { backgroundColor: '#F4F4F5', cursor: 'not-allowed', color: '#52525B', borderColor: '#E4E4E7' } : {}}
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 3: Date of Birth */}
          {step === 3 && (
            <div>
              <h1 className="editorial-title" style={{ fontFamily: 'serif', fontStyle: 'normal' }}>When's your birthday?</h1>
              <p className="editorial-subtitle">Must be at least 18 years old to join Cufy.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px', margin: '24px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>DAY *</label>
                  <input 
                    type="text" 
                    value={formData.day} 
                    onChange={(e) => {
                      setFormData({ ...formData, day: e.target.value });
                      if (stepError) setStepError('');
                    }} 
                    className="form-input" 
                    style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 800 }} 
                  />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>MONTH *</label>
                  <input 
                    type="text" 
                    value={formData.month} 
                    onChange={(e) => {
                      setFormData({ ...formData, month: e.target.value });
                      if (stepError) setStepError('');
                    }} 
                    className="form-input" 
                    style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 800 }} 
                  />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>YEAR *</label>
                  <input 
                    type="text" 
                    value={formData.year} 
                    onChange={(e) => {
                      setFormData({ ...formData, year: e.target.value });
                      if (stepError) setStepError('');
                    }} 
                    className="form-input" 
                    style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 800 }} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Notification Permission */}
          {step === 5 && (
            <div>
              <h1 className="editorial-title">Enable Notifications</h1>
              <p className="editorial-subtitle">Get notified instantly when your daily connection arrives.</p>

              <div style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '24px',
                textAlign: 'center',
                border: '1.5px solid #E4E4E7',
                margin: '20px 0'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '20px',
                  background: '#FFF0F0',
                  color: '#FF3B30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Bell size={28} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Never Miss a Match</h3>
                <p style={{ fontSize: '0.88rem', color: '#52525B', marginTop: '4px' }}>
                  We send only 1 notification per day when your match is curated. Zero spam.
                </p>
                <button 
                  type="button" 
                  onClick={handleRequestNotificationPermission} 
                  className="btn-primary" 
                  style={{ marginTop: '16px' }}
                >
                  <Bell size={18} />
                  Allow Notifications
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Location */}
          {step === 6 && (
            <div>
              <h1 className="editorial-title">Where are you located?</h1>
              <p className="editorial-subtitle">Cufy pairs you with intentional dates near your city.</p>

              <div className="form-group">
                <label className="form-label">Your Current City</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={formData.location} 
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                    className="form-input"
                    placeholder="e.g. New Delhi, India"
                    style={{ paddingRight: '44px' }}
                  />
                  <MapPin size={20} style={{ position: 'absolute', right: '14px', top: '16px', color: '#71717A' }} />
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleDetectLocation} 
                disabled={isDetectingLocation}
                className="btn-secondary"
                style={{ marginTop: '8px', fontSize: '0.9rem' }}
              >
                <Zap size={16} style={{ color: '#FF3B30' }} />
                {isDetectingLocation ? 'Detecting your city...' : 'Detect Current Location'}
              </button>
            </div>
          )}

          {/* STEP 7: Gender & Pronouns */}
          {step === 7 && (
            <div>
              <h1 className="editorial-title">Gender & Pronouns</h1>
              <p className="editorial-subtitle">Select your gender and preferred pronouns.</p>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <div className="chip-group">
                  {['Woman', 'Man', 'Non-binary'].map(g => {
                    const isSelected = formData.gender === g;
                    return (
                      <button 
                        key={g} 
                        type="button" 
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={`chip-option ${isSelected ? 'selected' : ''}`}
                      >
                        <span>{g}</span>
                        {isSelected && <Check size={16} style={{ marginLeft: 'auto' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pronouns</label>
                <div className="chip-group">
                  {['she/her', 'he/him', 'they/them'].map(p => {
                    const isSelected = formData.pronouns === p;
                    return (
                      <button 
                        key={p} 
                        type="button" 
                        onClick={() => setFormData({ ...formData, pronouns: p })}
                        className={`chip-option ${isSelected ? 'selected' : ''}`}
                      >
                        <span>{p}</span>
                        {isSelected && <Check size={16} style={{ marginLeft: 'auto' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Clean Interactive Height Selector */}
          {step === 8 && (
            <div>
              <h1 className="editorial-title" style={{ fontFamily: 'serif' }}>What's your height?</h1>
              <p className="editorial-subtitle">Tap - / + steppers or toggle units to adjust your height.</p>

              {/* FT MODE PICKER */}
              {formData.heightUnit === 'FT' && (
                <div>
                  <div className="height-picker-container">
                    {/* Feet Stepper Box */}
                    <div className="height-stepper-box">
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase' }}>FEET</span>
                      <div className="height-value-display">{formData.heightFeet}</div>
                      <div className="stepper-controls">
                        <button type="button" onClick={() => updateFeet(-1)} className="stepper-btn" aria-label="Decrease feet">
                          <Minus size={16} />
                        </button>
                        <button type="button" onClick={() => updateFeet(1)} className="stepper-btn" aria-label="Increase feet">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Inches Stepper Box */}
                    <div className="height-stepper-box">
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase' }}>INCHES</span>
                      <div className="height-value-display">{formData.heightInches}</div>
                      <div className="stepper-controls">
                        <button type="button" onClick={() => updateInches(-1)} className="stepper-btn" aria-label="Decrease inches">
                          <Minus size={16} />
                        </button>
                        <button type="button" onClick={() => updateInches(1)} className="stepper-btn" aria-label="Increase inches">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', fontSize: '0.92rem', color: '#52525B', fontWeight: 700, margin: '14px 0 6px' }}>
                    Equivalent to <span style={{ color: '#FF3B30', fontWeight: 900 }}>{currentCm} cm</span>
                  </div>
                </div>
              )}

              {/* CM MODE PICKER */}
              {formData.heightUnit === 'CM' && (
                <div>
                  <div className="height-picker-container">
                    <div className="height-stepper-box" style={{ width: '100%', maxWidth: '240px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase' }}>CENTIMETERS</span>
                      <div className="height-value-display">{currentCm} <span style={{ fontSize: '1.2rem', color: '#71717A' }}>cm</span></div>
                      <div className="stepper-controls">
                        <button type="button" onClick={() => updateCm(currentCm - 1)} className="stepper-btn" aria-label="Decrease cm">
                          <Minus size={16} />
                        </button>
                        <button type="button" onClick={() => updateCm(currentCm + 1)} className="stepper-btn" aria-label="Increase cm">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Clean Range Slider for CM */}
                  <div style={{ padding: '0 16px', textAlign: 'center', marginTop: '12px' }}>
                    <input 
                      type="range" 
                      min="120" 
                      max="220" 
                      value={currentCm} 
                      onChange={(e) => updateCm(parseInt(e.target.value))} 
                      className="height-range-slider"
                    />
                  </div>

                  <div style={{ textAlign: 'center', fontSize: '0.92rem', color: '#52525B', fontWeight: 700, marginTop: '14px' }}>
                    Equivalent to <span style={{ color: '#FF3B30', fontWeight: 900 }}>{formData.heightFeet}'{formData.heightInches}"</span>
                  </div>
                </div>
              )}

              {/* Unit Toggle FT | CM */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 16px' }}>
                <div style={{ background: '#E4E4E7', padding: '4px', borderRadius: '16px', display: 'flex', gap: '4px' }}>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, heightUnit: 'FT' })}
                    style={{
                      padding: '8px 22px',
                      borderRadius: '12px',
                      background: formData.heightUnit === 'FT' ? '#FFFFFF' : 'transparent',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      color: formData.heightUnit === 'FT' ? '#09090B' : '#71717A',
                      boxShadow: formData.heightUnit === 'FT' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    FT
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, heightUnit: 'CM' })}
                    style={{
                      padding: '8px 22px',
                      borderRadius: '12px',
                      background: formData.heightUnit === 'CM' ? '#FFFFFF' : 'transparent',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      color: formData.heightUnit === 'CM' ? '#09090B' : '#71717A',
                      boxShadow: formData.heightUnit === 'CM' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    CM
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#71717A', justifyContent: 'center', marginTop: '20px' }}>
                <Eye size={16} />
                <span>Always visible on profile</span>
              </div>
            </div>
          )}

          {/* STEP 10: Ethnicity Multi-Select */}
          {step === 10 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h1 className="editorial-title" style={{ marginBottom: 0 }}>What is your ethnicity?</h1>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FF3B30', background: '#FFF0F0', padding: '4px 10px', borderRadius: '10px' }}>
                  Selected ({formData.ethnicity.length})
                </span>
              </div>
              <p className="editorial-subtitle">Select all that apply to your background.</p>

              <div className="chip-group">
                {[
                  'South Asian', 'East Asian', 'Black / African', 
                  'Hispanic / Latino', 'Middle Eastern', 'White / Caucasian', 'Mixed / Other'
                ].map(eth => {
                  const isSelected = formData.ethnicity.includes(eth);
                  return (
                    <button 
                      key={eth}
                      type="button"
                      onClick={() => {
                        const current = formData.ethnicity;
                        if (isSelected) {
                          setFormData({ ...formData, ethnicity: current.filter(e => e !== eth) });
                        } else {
                          setFormData({ ...formData, ethnicity: [...current, eth] });
                        }
                      }}
                      className={`chip-option ${isSelected ? 'selected' : ''}`}
                    >
                      <span>{eth}</span>
                      {isSelected && <Check size={16} style={{ marginLeft: 'auto' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 11: Dating Preferences & Intent */}
          {step === 11 && (
            <div>
              <h1 className="editorial-title">Dating Preferences</h1>
              <p className="editorial-subtitle">Select who you'd like to date and your relationship goal.</p>

              <div className="form-group">
                <label className="form-label">Interested in</label>
                <div className="chip-group">
                  {['Women', 'Men', 'Everyone'].map(seek => {
                    const isSelected = formData.interestedIn === seek;
                    return (
                      <button 
                        key={seek} 
                        type="button" 
                        onClick={() => setFormData({ ...formData, interestedIn: seek })}
                        className={`chip-option ${isSelected ? 'selected' : ''}`}
                      >
                        <span>{seek}</span>
                        {isSelected && <Check size={16} style={{ marginLeft: 'auto' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Relationship Goal</label>
                <div className="chip-group" style={{ flexDirection: 'column' }}>
                  {[
                    { label: 'Serious relationship', desc: 'Looking for a deep, long-term commitment' },
                    { label: 'Life partner', desc: 'Building a shared future together' },
                    { label: 'Casual dating', desc: 'Exploring connection without pressure' },
                    { label: 'New friends', desc: 'Expanding social circle intentionally' }
                  ].map(intent => {
                    const isSelected = formData.intent === intent.label;
                    return (
                      <button 
                        key={intent.label} 
                        type="button" 
                        onClick={() => setFormData({ ...formData, intent: intent.label })}
                        className={`chip-option ${isSelected ? 'selected' : ''}`}
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '16px 20px' }}
                      >
                        <div style={{ textAlign: 'left', flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>{intent.label}</div>
                          <div style={{ fontSize: '0.78rem', color: isSelected ? '#FF3B30' : '#71717A', fontWeight: 500 }}>{intent.desc}</div>
                        </div>
                        {isSelected && <Check size={18} style={{ color: '#FF3B30' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 12: Education & Career */}
          {step === 12 && (
            <div>
              <h1 className="editorial-title">Education & Career</h1>
              <p className="editorial-subtitle">Share your academic & professional background.</p>

              <div className="form-group">
                <label className="form-label">College / University</label>
                <input 
                  type="text" 
                  value={formData.college} 
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })} 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input 
                  type="text" 
                  value={formData.jobTitle} 
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} 
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* STEP 13: Hometown & Religion */}
          {step === 13 && (
            <div>
              <h1 className="editorial-title">Hometown & Beliefs</h1>

              <div className="form-group">
                <label className="form-label">Hometown</label>
                <input 
                  type="text" 
                  value={formData.hometown} 
                  onChange={(e) => setFormData({ ...formData, hometown: e.target.value })} 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Religious Beliefs</label>
                <div className="chip-group">
                  {['Agnostic', 'Spiritual', 'Christian', 'Hindu', 'Muslim', 'Buddhist', 'Atheist'].map(rel => {
                    const isSelected = formData.religion === rel;
                    return (
                      <button 
                        key={rel} 
                        type="button" 
                        onClick={() => setFormData({ ...formData, religion: rel })}
                        className={`chip-option ${isSelected ? 'selected' : ''}`}
                      >
                        <span>{rel}</span>
                        {isSelected && <Check size={16} style={{ marginLeft: 'auto' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 15: Lifestyle Habits */}
          {step === 15 && (
            <div>
              <h1 className="editorial-title">Lifestyle Habits</h1>
              <p className="editorial-subtitle">Share your drinking and smoking preferences.</p>

              <div className="form-group">
                <label className="form-label">Drinking</label>
                <div className="chip-group">
                  {['Socially', 'Frequently', 'Rarely', 'Never'].map(d => {
                    const isSelected = formData.drinking === d;
                    return (
                      <button 
                        key={d} 
                        type="button" 
                        onClick={() => setFormData({ ...formData, drinking: d })}
                        className={`chip-option ${isSelected ? 'selected' : ''}`}
                      >
                        <span>{d}</span>
                        {isSelected && <Check size={16} style={{ marginLeft: 'auto' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Smoking</label>
                <div className="chip-group">
                  {['Socially', 'Regularly', 'Never'].map(s => {
                    const isSelected = formData.smoking === s;
                    return (
                      <button 
                        key={s} 
                        type="button" 
                        onClick={() => setFormData({ ...formData, smoking: s })}
                        className={`chip-option ${isSelected ? 'selected' : ''}`}
                      >
                        <span>{s}</span>
                        {isSelected && <Check size={16} style={{ marginLeft: 'auto' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 16: Profile Photos Upload - COMPULSORY MINIMUM 2 PHOTOS */}
          {step === 16 && (() => {
            const uploadedCount = (formData.photos || []).filter(p => Boolean(p) && typeof p === 'string' && p.length > 20).length;
            return (
              <div>
                <h1 className="editorial-title">Add profile photos</h1>
                <p className="editorial-subtitle">Upload at least 2 photos so matches can see the real you (Compulsory).</p>

                {/* Photo Requirement Status Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: uploadedCount >= 2 ? '#FFF5F2' : '#FFF0F0',
                  border: uploadedCount >= 2 ? '1px solid #FFCFC0' : '1px solid #FFE0E0',
                  color: uploadedCount >= 2 ? '#D9381E' : '#C53030',
                  padding: '6px 16px',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  marginBottom: '16px'
                }}>
                  {uploadedCount >= 2 ? (
                    <>
                      <Check size={14} /> {uploadedCount} photos uploaded (Requirement satisfied)
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} /> {uploadedCount} of 2 required photos uploaded
                    </>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px' }}>
                  {formData.photos.map((photoUrl, idx) => {
                    const hasPhoto = Boolean(photoUrl);
                    return (
                      <div 
                        key={idx}
                        onClick={() => !hasPhoto && triggerPhotoUpload(idx)}
                        style={{
                          height: '160px',
                          borderRadius: '22px',
                          overflow: 'hidden',
                          position: 'relative',
                          background: '#FFFFFF',
                          border: hasPhoto ? (idx === 0 ? '2px solid #FF5A43' : '1px solid #E4E4E7') : (idx < 2 && uploadedCount < 2) ? '2px dashed #FF8A7A' : '2px dashed #D4D4D8',
                          boxShadow: hasPhoto ? '0 6px 18px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.25s var(--ease-spring)'
                        }}
                      >
                        {hasPhoto ? (
                          <>
                            {idx === 0 && (
                              <span style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                background: '#FF5A43',
                                color: '#FFFFFF',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '8px',
                                zIndex: 2
                              }}>Main DP</span>
                            )}
                            <img src={photoUrl} alt={`User uploaded photo ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePhoto(idx);
                              }}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '28px',
                                height: '28px',
                                borderRadius: '10px',
                                background: 'rgba(9,9,11,0.75)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              aria-label="Remove photo"
                            >
                              <Trash2 size={14} />
                            </button>
                            {idx === 0 && (
                              <span style={{
                                position: 'absolute',
                                bottom: '8px',
                                left: '8px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                background: '#FF3B30',
                                color: '#FFFFFF',
                                padding: '3px 8px',
                                borderRadius: '8px'
                              }}>
                                Main Photo *
                              </span>
                            )}
                            {idx === 1 && (
                              <span style={{
                                position: 'absolute',
                                bottom: '8px',
                                left: '8px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                background: '#09090B',
                                color: '#FFFFFF',
                                padding: '3px 8px',
                                borderRadius: '8px'
                              }}>
                                Photo 2 *
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <div style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '14px',
                              background: '#FFF0F0',
                              color: '#FF3B30',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '8px'
                            }}>
                              <Plus size={22} />
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#09090B' }}>
                              {idx === 0 ? 'Main Photo *' : (idx === 1 ? 'Photo 2 *' : `Photo ${idx + 1}`)}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: (idx < 2 && uploadedCount < 2) ? '#DC2626' : '#71717A', fontWeight: (idx < 2 && uploadedCount < 2) ? 700 : 500, marginTop: '2px' }}>
                              {idx < 2 ? 'Compulsory' : 'Optional'}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* STEP 17: Written Intro Prompts & Bio */}
          {step === 17 && (
            <div>
              <h1 className="editorial-title">Bio & Prompts</h1>
              <p className="editorial-subtitle">Write a bio and answer prompts to show your personality.</p>

              {/* Bio Section */}
              <div className="form-group">
                <label className="form-label">About You (Bio)</label>
                <textarea 
                  rows={3}
                  maxLength={160}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="form-input"
                  placeholder="Share what makes you unique..."
                />
              </div>

              {/* Written Prompt 1 - CLEAN DESIGN (No "Hinge Style" text!) */}
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Written Prompt 1</label>
                
                <select 
                  value={formData.prompt1}
                  onChange={(e) => setFormData({ ...formData, prompt1: e.target.value })}
                  className="form-input"
                  style={{ fontWeight: 800, background: '#FFFFFF', marginBottom: '8px', padding: '12px 14px' }}
                >
                  <option value="Together, we could...">Together, we could...</option>
                  <option value="My simple pleasure is...">My simple pleasure is...</option>
                  <option value="The hallmark of a good relationship is...">The hallmark of a good relationship is...</option>
                  <option value="Dating me looks like...">Dating me looks like...</option>
                </select>

                <textarea 
                  rows={2}
                  value={formData.prompt1Answer}
                  onChange={(e) => setFormData({ ...formData, prompt1Answer: e.target.value })}
                  className="form-input"
                  placeholder="Type your prompt answer..."
                />
              </div>

              {/* Written Prompt 2 */}
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Written Prompt 2</label>
                
                <select 
                  value={formData.prompt2}
                  onChange={(e) => setFormData({ ...formData, prompt2: e.target.value })}
                  className="form-input"
                  style={{ fontWeight: 800, background: '#FFFFFF', marginBottom: '8px', padding: '12px 14px' }}
                >
                  <option value="I get along best with people who...">I get along best with people who...</option>
                  <option value="A non-negotiable for me is...">A non-negotiable for me is...</option>
                  <option value="My ideal Sunday...">My ideal Sunday...</option>
                  <option value="Let's debate...">Let's debate...</option>
                </select>

                <textarea 
                  rows={2}
                  value={formData.prompt2Answer}
                  onChange={(e) => setFormData({ ...formData, prompt2Answer: e.target.value })}
                  className="form-input"
                  placeholder="Type your prompt answer..."
                />
              </div>
            </div>
          )}

          {/* STEP 18: Voice Intro Recording (Real AudioContext Recorder with Sound-Reactive Bars, Preview, Re-record & Skip) */}
          {step === 18 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 className="editorial-title" style={{ margin: 0 }}>Voice Intro</h1>
                <button
                  type="button"
                  onClick={() => {
                    setStepError('');
                    setStep(prev => prev + 1);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1.5px solid #D4D4D8',
                    color: '#09090B',
                    padding: '6px 14px',
                    borderRadius: '14px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Skip <ArrowRight size={14} />
                </button>
              </div>
              <p className="editorial-subtitle" style={{ marginTop: '4px' }}>
                Let matches hear your real voice intro (optional 30s recording).
              </p>

              <VoiceNoteRecorder
                initialAudioUrl={formData.voiceNoteUrl}
                onRecordingComplete={(base64Url, duration) => {
                  setFormData(prev => ({ ...prev, voiceNoteUrl: base64Url, voiceRecorded: true }));
                }}
                onDeleteRecording={() => {
                  setFormData(prev => ({ ...prev, voiceNoteUrl: null, voiceRecorded: false }));
                }}
              />
            </div>
          )}

          {/* STEP 19: Premium Pricing Tiers, UPI Deep Link & Screenshot Upload */}
          {step === 19 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* VIP Member Card - Warm Premium Theme */}
              <div style={{
                background: 'linear-gradient(135deg, #FFF8F6 0%, #FFEFEA 100%)',
                color: '#2B2625',
                borderRadius: '24px',
                padding: '20px 24px',
                boxShadow: '0 12px 32px rgba(255, 90, 67, 0.08)',
                position: 'relative',
                border: '1.5px solid #FFD8CC'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ color: '#E0533C', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {isFreeLaunchPeriodActive() ? '🎉 LAUNCH PROMO: FREE VIP PASS' : (formData.gender === 'Woman' ? 'WOMEN FREE VIP PASS' : 'CUFY VIP ACCESS')}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'serif', fontStyle: 'italic', color: '#2B2625' }}>
                    cufy<span style={{ color: '#FF3B30', fontStyle: 'normal' }}>.</span>
                  </div>
                </div>

                {isFreeLaunchPeriodActive() ? (
                  <div style={{
                    background: '#ECFDF5',
                    border: '1.5px solid #A7F3D0',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    marginBottom: '16px',
                    color: '#065F46',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.98rem', fontWeight: 900 }}>
                      🎉 100% Free VIP Access for Everyone!
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', fontWeight: 600 }}>
                      Special launch celebration offer active until <b>15th October</b>. Zero payment required!
                    </div>
                  </div>
                ) : formData.gender === 'Woman' ? (
                  <div style={{
                    background: '#FFF0EC',
                    border: '1px solid #FFCFC0',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    marginBottom: '16px',
                    color: '#D9381E',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    textAlign: 'center'
                  }}>
                    Unlimited Free Membership for All Women!
                  </div>
                ) : (
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #FFE0D8',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#8C7A77', textTransform: 'uppercase' }}>UPI PAY ID</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2B2625', fontFamily: 'monospace' }}>aditya.378@superyes</div>
                    </div>
                    <button onClick={copyUpiId} style={{ padding: '6px 14px', background: '#FF3B30', color: '#FFFFFF', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                      {upiCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#8C7A77', textTransform: 'uppercase' }}>SELECTED PLAN</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2B2625' }}>
                      {isFreeLaunchPeriodActive()
                        ? 'Launch Promo VIP Pass (Free until Oct 15)'
                        : (formData.gender === 'Woman' && selectedPlan.type === 'membership' ? 'Lifetime VIP Pass' : selectedPlan.title)}
                    </div>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: isFreeLaunchPeriodActive() ? '#10B981' : '#FF3B30' }}>
                    {(isFreeLaunchPeriodActive() || (formData.gender === 'Woman' && selectedPlan.type === 'membership')) ? '₹0 FREE' : `₹${selectedPlan.price}`}
                  </div>
                </div>
              </div>

              {/* During Free Launch Period: Direct 1-Click Access Card */}
              {isFreeLaunchPeriodActive() ? (
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '20px',
                  border: '1.5px solid #E4E4E7',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#09090B' }}>
                    What's included in your Free Launch Pass:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#52525B', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#10B981', fontWeight: 900, fontSize: '1.1rem' }}>✓</span> Unlimited verified profile browsing & swiping
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#10B981', fontWeight: 900, fontSize: '1.1rem' }}>✓</span> 1 Free Cufy Like every 24 hours
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#10B981', fontWeight: 900, fontSize: '1.1rem' }}>✓</span> Instant private chat when both users match
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#10B981', fontWeight: 900, fontSize: '1.1rem' }}>✓</span> Valid until 15th October • No payment needed
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={handlePayment} 
                    disabled={isProcessingPayment} 
                    className="btn-black-pill" 
                    style={{ width: '100%', padding: '16px', marginTop: '6px' }}
                  >
                    {isProcessingPayment ? 'Activating Free VIP Access...' : 'Claim Free Pass & Enter Cufy →'}
                  </button>
                </div>
              ) : (
                /* Post-Promo Regular Payment Flow (After Oct 15) */
                <>
                  {/* Membership Pricing Options (For Men) vs Free Badge (For Women) */}
                  {formData.gender === 'Woman' ? (
                    <div style={{ background: '#FFF8F5', border: '1.5px solid #FFDCD2', padding: '16px', borderRadius: '20px', color: '#8A2B1E' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>Women Membership is Always Free!</div>
                      <div style={{ fontSize: '0.82rem', marginTop: '4px', opacity: 0.9 }}>
                        No subscription needed. You can optionally purchase Profile Boosts below to get featured at the top.
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="form-label" style={{ marginBottom: '8px' }}>Select Membership Plan</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {[
                          { id: 'day_199', title: '1 Day Pass', price: 199 },
                          { id: 'week_299', title: '1 Week Pass', price: 299 },
                          { id: 'days15_499', title: '15 Days Pass', price: 499 },
                          { id: 'month_799', title: '1 Month Pass (Includes 1 Free Boost)', price: 799 }
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPlan({ ...p, type: 'membership' })}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '16px',
                              background: selectedPlan.id === p.id ? '#FFF0F0' : '#FFFFFF',
                              border: selectedPlan.id === p.id ? '2px solid #FF3B30' : '1.5px solid #E4E4E7',
                              color: selectedPlan.id === p.id ? '#FF3B30' : '#09090B',
                              textAlign: 'left',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>{p.title}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900, marginTop: '2px' }}>₹{p.price}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Direct UPI Payment Button (For Men) */}
                  {formData.gender !== 'Woman' && (
                    <button 
                      type="button"
                      onClick={() => {
                        window.location.href = `upi://pay?pa=aditya.378@superyes&pn=Cufy%20Dating&am=${selectedPlan.price}&cu=INR`;
                      }}
                      className="btn-primary"
                      style={{ width: '100%', padding: '16px' }}
                    >
                      Pay ₹{selectedPlan.price} via UPI
                    </button>
                  )}

                  {/* Payment Proof Screenshot Upload Slot (Or Free Access for Women) */}
                  {formData.gender === 'Woman' && selectedPlan.type === 'membership' ? (
                    <button 
                      type="button" 
                      onClick={() => onCompleteOnboarding(buildCompletedData({
                        plan: 'Lifetime VIP Pass',
                        planId: 'lifetime_women',
                        planPrice: 0,
                        planDays: 99999,
                        paymentProofUrl: null,
                        status: 'approved'
                      }))} 
                      className="btn-black-pill" 
                      style={{ width: '100%', padding: '16px' }}
                    >
                      Access Cufy Free Now
                    </button>
                  ) : (
                    <div style={{
                      background: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '16px',
                      border: '1.5px solid #E4E4E7',
                      textAlign: 'center'
                    }}>
                      <label className="form-label" style={{ marginBottom: '6px' }}>Upload Payment Screenshot</label>
                      <p style={{ fontSize: '0.78rem', color: '#71717A', marginBottom: '12px' }}>
                        Upload your transaction screenshot for admin verification.
                      </p>

                      {paymentProofUrl ? (
                        <div style={{ position: 'relative', width: '100%', height: '120px', borderRadius: '14px', overflow: 'hidden' }}>
                          <img src={paymentProofUrl} alt="Payment proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => setPaymentProofUrl(null)}
                            style={{ position: 'absolute', top: '6px', right: '6px', padding: '4px', background: '#09090B', color: '#FFFFFF', borderRadius: '50%' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '16px',
                          border: '2px dashed #CBD5E1',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          background: '#F9F8F6'
                        }}>
                          <Camera size={24} style={{ color: '#FF3B30', marginBottom: '4px' }} />
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#09090B' }}>
                            {isUploadingProof ? 'Optimizing screenshot...' : 'Select Screenshot Image'}
                          </span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  setIsUploadingProof(true);
                                  const base64Url = await fileToCompressedBase64(file, 1200, 0.78);
                                  setPaymentProofUrl(base64Url);
                                } catch (err) {
                                  console.error('Payment proof conversion error:', err);
                                } finally {
                                  setIsUploadingProof(false);
                                }
                              }
                            }}
                          />
                        </label>
                      )}

                      <button 
                        type="button" 
                        onClick={handlePayment} 
                        disabled={isProcessingPayment} 
                        className="btn-black-pill" 
                        style={{ width: '100%', marginTop: '14px' }}
                      >
                        {isProcessingPayment ? 'Submitting Payment Proof...' : 'Submit Screenshot & Access App'}
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>
          )}

        </form>
      </div>

      {/* Black Rounded Action Button ALWAYS Anchored Cleanly at Bottom */}
      {step < 19 && (
        <div style={{ position: 'relative', zIndex: 10, paddingTop: '12px', marginTop: 'auto' }}>
          <button type="button" onClick={handleNext} className="btn-black-pill">
            <span>
              {step === 18 
                ? (formData.voiceNoteUrl ? 'Continue with Voice Note' : 'Continue') 
                : 'Continue'}
            </span>
          </button>
        </div>
      )}


      {/* HINGE AGE CONFIRMATION BOTTOM SHEET POPUP (PROPER SOLID WHITE CARD!) */}
      {showAgePopup && (
        <div className="hinge-age-popup-overlay">
          <div className="hinge-age-popup-card">
            <h2 style={{ fontSize: '1.7rem', fontWeight: 900, marginBottom: '8px', color: '#09090B' }}>
              You're {calculatedAge}
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#52525B', lineHeight: '1.45', marginBottom: '24px' }}>
              Make sure your age is correct before moving on. It keeps Cufy real for everyone.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setShowAgePopup(false)} 
                className="btn-secondary"
                style={{ flex: 1, borderRadius: '24px' }}
              >
                Edit
              </button>

              <button 
                type="button"
                onClick={() => {
                  if (calculatedAge < 18) {
                    setStepError('You must be at least 18 years old to join Cufy.');
                    setShowAgePopup(false);
                    return;
                  }
                  setShowAgePopup(false);
                  setStep(4); // Advance smoothly to Step 4 interstitial slide!
                }} 
                className="btn-black-pill"
                style={{ flex: 1 }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
