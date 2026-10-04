import React from 'react';
import { X, FileText } from 'lucide-react';

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(9, 9, 11, 0.75)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backdropFilter: 'blur(6px)'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: '28px',
        boxShadow: '0 20px 48px rgba(0,0,0,0.2)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText style={{ color: '#FF3B30' }} size={24} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Terms & Conditions</h2>
          </div>
          <button 
            onClick={onClose} 
            style={{ padding: '8px', background: '#F4F4F5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: '0.92rem', color: '#52525B', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '14px' }}>
            Welcome to Cufy. By creating an account, accessing, or using our services, you agree to bound by these terms.
          </p>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#09090B', marginTop: '16px', marginBottom: '8px' }}>
            1. Age Eligibility
          </h3>
          <p style={{ marginBottom: '14px' }}>
            You must be at least 18 years of age to create an account or use Cufy. By creating an account, you represent and warrant that you are 18 or older.
          </p>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#09090B', marginTop: '16px', marginBottom: '8px' }}>
            2. Community Safety Guidelines
          </h3>
          <p style={{ marginBottom: '14px' }}>
            We maintain strict zero-tolerance policies for harassment, fake impersonation, hate speech, or explicit non-consensual content. Violators will face immediate ban.
          </p>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#09090B', marginTop: '16px', marginBottom: '8px' }}>
            3. Membership & Subscriptions
          </h3>
          <p style={{ marginBottom: '14px' }}>
            Cufy provides full daily match features through our membership pass. You can cancel active auto-renewals anytime through account settings.
          </p>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E4E4E7' }}>
          <button onClick={onClose} className="btn-primary">
            Accept Terms
          </button>
        </div>
      </div>
    </div>
  );
}
