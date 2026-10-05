import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Check, X, Volume2 } from 'lucide-react';

export default function VoiceRecorderWidget({ onSave, onCancel, initialAudioUrl = null, initialDuration = '0:00' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0); // Seconds
  const [volumeLevel, setVolumeLevel] = useState(0); // 0 - 100
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl);
  const [audioDuration, setAudioDuration] = useState(initialDuration);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionError, setPermissionError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioElementRef = useRef(null);

  // Format seconds to 0:00 string
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Start Voice Recording with Live Waveform Volume Analysis
  const startRecording = async () => {
    setPermissionError('');
    audioChunksRef.current = [];
    setRecordTime(0);
    setVolumeLevel(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 1. Setup AudioContext for Live Sound Analyzer
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // Real-time audio volume visualizer loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.max(5, (average / 128) * 100));
        setVolumeLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();

      // 2. Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());

        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      // 3. Start 1-second Interval Timer & Auto-stop at 30 Seconds
      timerIntervalRef.current = setInterval(() => {
        setRecordTime((prev) => {
          const next = prev + 1;
          if (next >= 30) {
            stopRecording();
            return 30;
          }
          return next;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone permission or recording error:', err);
      setPermissionError('Microphone access denied. Please allow microphone permission in browser.');
      setIsRecording(false);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setAudioDuration(formatTime(recordTime));
  };

  // Reset Recording
  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordTime(0);
    setAudioDuration('0:00');
    setIsPlaying(false);
  };

  // Playback Control
  const togglePlay = () => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (audioElementRef.current) audioElementRef.current.pause();
    };
  }, []);

  const finalDurationStr = isRecording ? formatTime(recordTime) : audioDuration;

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '24px',
      padding: '24px',
      border: '1.5px solid #E4E4E7',
      boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      textAlign: 'center'
    }}>
      {permissionError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '14px', fontSize: '0.82rem', fontWeight: 700 }}>
          {permissionError}
        </div>
      )}

      {/* WAVEFORM VISUALIZER BARS & TIMER */}
      <div style={{
        background: isRecording ? '#FFF0F0' : '#F9F8F6',
        borderRadius: '20px',
        padding: '20px',
        border: '1.5px solid',
        borderColor: isRecording ? '#FCA5A5' : '#E4E4E7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.3s ease'
      }}>
        
        {/* Timer Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: isRecording ? '#FF3B30' : '#A1A1AA',
            animation: isRecording ? 'pulse 1s infinite' : 'none'
          }}></div>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#09090B', fontFamily: 'monospace' }}>
            {finalDurationStr}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717A' }}>
            / 0:30 max
          </span>
        </div>

        {/* Dynamic 16-Bar Sound Waveform Animation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '44px', width: '100%' }}>
          {[1.2, 0.8, 1.5, 0.6, 1.8, 1.1, 0.9, 1.6, 1.4, 0.7, 1.3, 1.0, 1.7, 0.8, 1.2, 0.9].map((scale, idx) => {
            // Calculate height based on real microphone volume level
            const barHeight = isRecording 
              ? Math.min(42, Math.max(8, volumeLevel * scale * 0.45)) 
              : isPlaying ? Math.min(38, Math.max(10, Math.sin(Date.now() / 100 + idx) * 20 + 20)) : 10;
            
            return (
              <div 
                key={idx}
                style={{
                  width: '5px',
                  height: `${barHeight}px`,
                  borderRadius: '3px',
                  background: isRecording ? '#FF3B30' : (isPlaying ? '#10B981' : '#D4D4D8'),
                  transition: isRecording ? 'height 0.08s ease' : 'height 0.2s ease'
                }}
              />
            );
          })}
        </div>

        <span style={{ fontSize: '0.78rem', color: isRecording ? '#FF3B30' : '#71717A', fontWeight: 700 }}>
          {isRecording ? '🎙️ Recording live voice... Speak into mic' : audioUrl ? '✓ Voice note recorded! Tap play to listen' : 'Tap red button below to start recording (Max 30s)'}
        </span>
      </div>

      {/* CONTROLS BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        
        {/* If no recording yet -> Start Recording Button */}
        {!isRecording && !audioUrl && (
          <button
            type="button"
            onClick={startRecording}
            style={{
              padding: '14px 28px',
              borderRadius: '20px',
              background: '#FF3B30',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: 'none',
              boxShadow: '0 6px 20px rgba(255, 59, 48, 0.35)',
              cursor: 'pointer'
            }}
          >
            <Mic size={20} />
            Start Recording
          </button>
        )}

        {/* If currently recording -> Stop Recording Button */}
        {isRecording && (
          <button
            type="button"
            onClick={stopRecording}
            style={{
              padding: '14px 28px',
              borderRadius: '20px',
              background: '#09090B',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Square size={18} fill="#FFFFFF" />
            Done & Stop ({30 - recordTime}s left)
          </button>
        )}

        {/* If recording complete -> Play, Re-record, and Save Buttons */}
        {!isRecording && audioUrl && (
          <>
            <button
              type="button"
              onClick={togglePlay}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#10B981',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
              }}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={20} fill="#FFFFFF" /> : <Play size={20} fill="#FFFFFF" style={{ marginLeft: '2px' }} />}
            </button>

            <button
              type="button"
              onClick={resetRecording}
              style={{
                padding: '10px 16px',
                borderRadius: '14px',
                background: '#F4F4F5',
                color: '#09090B',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid #E4E4E7',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={15} />
              Re-record
            </button>

            <button
              type="button"
              onClick={() => onSave && onSave({ audioUrl, duration: audioDuration })}
              style={{
                padding: '10px 20px',
                borderRadius: '14px',
                background: '#09090B',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Check size={16} />
              Save Note
            </button>
          </>
        )}

      </div>
    </div>
  );
}
