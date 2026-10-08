import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Volume2, AlertCircle, Check } from 'lucide-react';

export default function VoiceNoteRecorder({
  onRecordingComplete,
  onDeleteRecording,
  initialAudioUrl = null,
  maxDuration = 30
}) {
  const [status, setStatus] = useState(initialAudioUrl ? 'recorded' : 'idle'); // 'idle' | 'recording' | 'recorded' | 'playing'
  const [seconds, setSeconds] = useState(0);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl);
  const [audioLevels, setAudioLevels] = useState(Array(16).fill(6)); // Heights of bars
  const [errorMessage, setErrorMessage] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioElementRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Clean up streams & audio context on unmount
  useEffect(() => {
    return () => {
      stopTracks();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
  };

  // Start Real Microphone Recording with Live Voice Analyser
  const handleStartRecording = async () => {
    setErrorMessage('');
    if (!navigator?.mediaDevices?.getUserMedia) {
      setErrorMessage('Audio recording is not supported on this browser. You can skip this step.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 1. Web Audio API for Voice-Reactive Analyser
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Realtime live volume animation loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Compute volume level
        let total = 0;
        for (let i = 0; i < dataArray.length; i++) total += dataArray[i];
        const avg = total / dataArray.length;

        // Scale 16 bars: If silent (avg < 8), keep minimal baseline (4-6px).
        // If speaking, scale up dynamically to 12-40px based on real speech frequencies!
        const isSpeaking = avg > 8;
        const newBars = Array.from({ length: 16 }, (_, idx) => {
          if (!isSpeaking) {
            // Calm subtle resting line
            return 4 + (idx % 3) * 2;
          }
          const freqVal = dataArray[(idx * 2) % dataArray.length] || 0;
          const normalized = freqVal / 255;
          return Math.max(6, Math.min(38, Math.round(normalized * 38 + (avg / 255) * 10)));
        });

        setAudioLevels(newBars);
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

      // 2. MediaRecorder setup
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        stopTracks();

        const blobType = mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: blobType });
        const localBlobUrl = URL.createObjectURL(blob);
        setAudioUrl(localBlobUrl);
        setStatus('recorded');

        // Convert blob to base64 Data URL for persistent storage in DB
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64DataUrl = reader.result;
          if (onRecordingComplete) {
            onRecordingComplete(base64DataUrl, seconds || 1);
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start(250);
      setStatus('recording');
      setSeconds(0);

      // Countdown / Duration timer
      let elapsed = 0;
      timerIntervalRef.current = setInterval(() => {
        elapsed += 1;
        setSeconds(elapsed);
        if (elapsed >= maxDuration) {
          handleStopRecording();
        }
      }, 1000);

    } catch (err) {
      console.warn('Microphone access denied:', err);
      setErrorMessage('Microphone access was denied. Please allow mic permissions or skip this step.');
      setStatus('idle');
      stopTracks();
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRecordedDuration(seconds);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
  };

  // Play / Pause Recorded Preview
  const handleTogglePlay = () => {
    if (!audioUrl) return;

    if (status === 'playing') {
      if (audioElementRef.current) audioElementRef.current.pause();
      setStatus('recorded');
    } else {
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio(audioUrl);
        audioElementRef.current.onended = () => setStatus('recorded');
      }
      audioElementRef.current.play()
        .then(() => setStatus('playing'))
        .catch((err) => {
          console.warn('Audio play note:', err);
          setStatus('recorded');
        });
    }
  };

  // Reset / Re-record
  const handleReset = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setAudioUrl(null);
    setStatus('idle');
    setSeconds(0);
    setRecordedDuration(0);
    setAudioLevels(Array(16).fill(6));
    if (onDeleteRecording) onDeleteRecording();
  };

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '24px',
      padding: '24px 20px',
      border: '1.5px solid #E4E4E7',
      textAlign: 'center',
      position: 'relative',
      margin: '16px 0',
      boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
    }}>

      {errorMessage && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          padding: '10px 14px',
          borderRadius: '14px',
          fontSize: '0.78rem',
          fontWeight: 700,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          textAlign: 'left'
        }}>
          <AlertCircle size={16} flexShrink={0} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. IDLE OR RECORDING STATE */}
      {/* ======================================================== */}
      {status === 'idle' || status === 'recording' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Main Action Record/Stop Button with Dynamic Sign Change */}
          <button
            type="button"
            onClick={status === 'recording' ? handleStopRecording : handleStartRecording}
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: status === 'recording' ? '#DC2626' : '#FFF0F0',
              color: status === 'recording' ? '#FFFFFF' : '#DC2626',
              border: status === 'recording' ? '4px solid #FEE2E2' : '2px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginBottom: '14px',
              transition: 'all 0.2s ease',
              boxShadow: status === 'recording' ? '0 0 0 6px rgba(220,38,38,0.2)' : '0 4px 14px rgba(220,38,38,0.08)'
            }}
            aria-label={status === 'recording' ? 'Stop recording' : 'Start recording'}
          >
            {status === 'recording' ? (
              <Square size={24} fill="#FFFFFF" />
            ) : (
              <Mic size={30} />
            )}
          </button>

          {/* Status Label & Timer */}
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#09090B', marginBottom: '4px' }}>
            {status === 'recording' ? (
              <span style={{ color: '#DC2626' }}>
                Recording... 00:{seconds < 10 ? `0${seconds}` : seconds} / 00:{maxDuration}
              </span>
            ) : (
              'Tap Mic to Record Audio'
            )}
          </div>

          <p style={{ fontSize: '0.76rem', color: '#71717A', margin: '0 0 16px', fontWeight: 500 }}>
            {status === 'recording' ? 'Tap the red square to finish recording' : `Speak for up to ${maxDuration} seconds (intro prompts, passions, humor)`}
          </p>

          {/* REAL VOICE-REACTIVE SOUND WAVE VISUALIZER */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            height: '42px',
            width: '100%',
            maxWidth: '240px',
            padding: '4px 10px',
            background: status === 'recording' ? '#FEF2F2' : '#F4F4F5',
            borderRadius: '14px'
          }}>
            {audioLevels.map((height, i) => (
              <span
                key={i}
                style={{
                  width: '4px',
                  height: `${height}px`,
                  background: status === 'recording' ? '#DC2626' : '#A1A1AA',
                  borderRadius: '2px',
                  transition: 'height 0.08s ease'
                }}
              />
            ))}
          </div>

          {status === 'recording' && (
            <span style={{ fontSize: '0.68rem', color: '#71717A', marginTop: '8px', fontWeight: 600 }}>
              🎙️ Waveform actively responds to your speaking volume
            </span>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* 2. RECORDED PREVIEW PLAYER WITH LISTEN & RE-RECORD */
        /* ======================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ECFDF5',
            color: '#065F46',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.74rem',
            fontWeight: 800,
            marginBottom: '16px'
          }}>
            <Check size={14} /> Voice Intro Recorded! ({recordedDuration || seconds}s)
          </div>

          {/* Interactive Player Box */}
          <div style={{
            width: '100%',
            maxWidth: '280px',
            background: '#F4F4F5',
            borderRadius: '18px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '14px'
          }}>
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={handleTogglePlay}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#09090B',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
              aria-label={status === 'playing' ? 'Pause voice note' : 'Play voice note'}
            >
              {status === 'playing' ? (
                <Pause size={18} fill="#FFFFFF" />
              ) : (
                <Play size={18} fill="#FFFFFF" style={{ marginLeft: '2px' }} />
              )}
            </button>

            {/* Static Waveform Representation */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
              {[12, 18, 24, 14, 20, 16, 22, 12, 18, 24, 16, 20, 14, 18].map((h, i) => (
                <span
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}px`,
                    background: status === 'playing' ? '#09090B' : '#71717A',
                    borderRadius: '2px'
                  }}
                />
              ))}
            </div>

            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#09090B', minWidth: '32px' }}>
              0:{recordedDuration < 10 ? `0${recordedDuration}` : recordedDuration}
            </span>
          </div>

          {/* Re-record Option Button */}
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'transparent',
              border: '1px solid #D4D4D8',
              borderRadius: '12px',
              padding: '8px 16px',
              color: '#52525B',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={13} />
            Re-record Audio
          </button>

        </div>
      )}

    </div>
  );
}
