import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { api } from './api';
import { AuthContext } from './App';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

// Smoothly animate a value toward a target
function useAnimatedMetric(target, speed = 0.05) {
  const [val, setVal] = useState(target);
  const ref = useRef(target);
  useEffect(() => {
    ref.current = target;
  }, [target]);
  useEffect(() => {
    const id = setInterval(() => {
      setVal(prev => {
        const diff = ref.current - prev;
        if (Math.abs(diff) < 0.5) return ref.current;
        return prev + diff * speed;
      });
    }, 50);
    return () => clearInterval(id);
  }, [speed]);
  return Math.round(val);
}

export default function DualAgentInterviewRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [peerName, setPeerName] = useState('Peer');

  // Controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // AI
  const [hints, setHints] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [whisperLoading, setWhisperLoading] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chat'); // 'chat' | 'whisperer' | 'interviewer'
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: "Hi! I'm your AI Interview Coach. Ask me anything about interview techniques, how to answer a question, or request a practice question.", time: new Date().toLocaleTimeString() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Live metrics — vary over time
  const [confTarget, setConfTarget] = useState(72);
  const [clarTarget, setClarTarget] = useState(65);
  const [energyTarget, setEnergyTarget] = useState(80);
  const confidence = useAnimatedMetric(confTarget);
  const clarity    = useAnimatedMetric(clarTarget);
  const energy     = useAnimatedMetric(energyTarget);

  // Post-session
  const [ended, setEnded] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  // Refs
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef      = useRef(null);
  const pcRef          = useRef(null);
  const streamRef      = useRef(null);
  const timerRef       = useRef(null);
  const metricsRef     = useRef(null);
  const makingOffer    = useRef(false);

  // Camera permission state
  const [camPermission, setCamPermission] = useState('pending'); // pending | granted | denied | unavailable

  const myId = user?.name || user?.role || 'User';

  useEffect(() => {
    const socket = io(`${SOCKET_URL}/interview`);
    socketRef.current = socket;

    // ── Get local media ──────────────────────────────────────────────────
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        setCamPermission('granted');
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        initPeerConnection(stream);
      })
      .catch(err => {
        console.warn('Camera/mic error:', err.name, err.message);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCamPermission('denied');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCamPermission('unavailable');
        } else {
          setCamPermission('unavailable');
        }
        // Try audio-only fallback
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
          .then(audioStream => {
            streamRef.current = audioStream;
            initPeerConnection(audioStream);
          })
          .catch(() => {
            initPeerConnection(null);
          });
      });

    // ── Socket events ────────────────────────────────────────────────────
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', roomId, myId);
    });
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('user-connected', (userId) => {
      setPeerName(userId);
      setPeerConnected(true);
      // We are the polite peer — wait for offer from the other side
    });

    socket.on('user-disconnected', () => {
      setPeerConnected(false);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    });

    // WebRTC signaling
    socket.on('offer', async (offer) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', roomId, answer);
      } catch (e) { console.error('offer handling error', e); }
    });

    socket.on('answer', async (answer) => {
      const pc = pcRef.current;
      if (!pc || pc.signalingState === 'stable') return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (e) { console.error('answer handling error', e); }
    });

    socket.on('ice-candidate', async (candidate) => {
      try {
        await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) { /* ignore benign errors */ }
    });

    // AI hints
    socket.on('whisperer_feed', (hint) => {
      setWhisperLoading(false);
      setHints(prev => [{ text: hint, time: new Date().toLocaleTimeString() }, ...prev]);
    });

    // Live metrics from peer
    socket.on('coach_metrics_update', (m) => {
      if (m.confidence !== undefined) setConfTarget(m.confidence);
      if (m.clarity    !== undefined) setClarTarget(m.clarity);
      if (m.energy     !== undefined) setEnergyTarget(m.energy);
    });

    // ── Timers ───────────────────────────────────────────────────────────
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    // Vary metrics every 3s and broadcast to peer
    metricsRef.current = setInterval(() => {
      const m = {
        confidence: Math.min(99, Math.max(40, Math.round(Math.random() * 30 + 65))),
        clarity:    Math.min(99, Math.max(40, Math.round(Math.random() * 30 + 60))),
        energy:     Math.min(99, Math.max(40, Math.round(Math.random() * 25 + 70))),
      };
      setConfTarget(m.confidence);
      setClarTarget(m.clarity);
      setEnergyTarget(m.energy);
      socket.emit('coach_metrics', roomId, m);
    }, 3000);

    // Auto-fire AI hint every 45s when session is live
    const autoHintTopics = [
      'system design scalability',
      'react state management',
      'database optimization',
      'leadership conflict resolution',
      'machine learning production',
      'api design best practices',
      'debugging complex bugs',
    ];
    let autoHintIdx = 0;
    const autoHintRef = setInterval(() => {
      socket.emit('transcript_chunk', roomId, autoHintTopics[autoHintIdx % autoHintTopics.length]);
      autoHintIdx++;
    }, 45000);

    return () => {
      socket.disconnect();
      pcRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(timerRef.current);
      clearInterval(metricsRef.current);
      clearInterval(autoHintRef);
    };
  }, [roomId]);

  function initPeerConnection(stream) {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Add local tracks
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    // Remote stream → remote video
    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        setPeerConnected(true);
      }
    };

    // ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit('ice-candidate', roomId, e.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setPeerConnected(true);
      if (['disconnected','failed','closed'].includes(pc.connectionState)) setPeerConnected(false);
    };

    // When a new peer joins, the first peer creates the offer
    socketRef.current?.on('user-connected', async () => {
      if (makingOffer.current) return;
      makingOffer.current = true;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current.emit('offer', roomId, offer);
      } catch (e) { console.error('offer creation error', e); }
      makingOffer.current = false;
    });
  }

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn; });
    setMicOn(m => !m);
  };

  const toggleCam = async () => {
    if (camPermission === 'denied') {
      // Prompt user to allow camera in browser settings
      alert('Camera access was denied. Please allow camera access in your browser settings and refresh the page.');
      return;
    }
    if (camPermission === 'unavailable') {
      alert('No camera found on this device.');
      return;
    }
    if (!camOn) {
      // Turning camera back ON — re-request if stream lost video tracks
      const videoTracks = streamRef.current?.getVideoTracks() || [];
      if (videoTracks.length === 0) {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newTrack = newStream.getVideoTracks()[0];
          streamRef.current?.addTrack(newTrack);
          const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(newTrack);
          if (localVideoRef.current) {
            const combined = new MediaStream([
              ...(streamRef.current?.getAudioTracks() || []),
              newTrack,
            ]);
            localVideoRef.current.srcObject = combined;
          }
          setCamOn(true);
          return;
        } catch (e) {
          console.warn('Could not re-enable camera:', e);
          return;
        }
      }
      videoTracks.forEach(t => { t.enabled = true; });
    } else {
      streamRef.current?.getVideoTracks().forEach(t => { t.enabled = false; });
    }
    setCamOn(c => !c);
  };

  const shareScreen = async () => {
    if (isSharing) return; // already sharing
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = screenStream.getVideoTracks()[0];
      setIsSharing(true);
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      screenTrack.onended = () => {
        setIsSharing(false);
        const camTrack = streamRef.current?.getVideoTracks()[0];
        if (sender && camTrack) sender.replaceTrack(camTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = streamRef.current;
      };
    } catch (e) {
      setIsSharing(false);
      console.warn('Screen share cancelled or unavailable:', e);
    }
  };

  const AI_RESPONSES = {
    greet: ["Hello! Ready to ace your interview? Let's start with a warm-up question.", "Great to meet you! I'll be coaching you through this session."],
    question: [
      "Tell me about a time you faced a major technical challenge. How did you approach it?",
      "How would you design a URL shortener like bit.ly? Walk me through your thought process.",
      "Explain the difference between REST and GraphQL. When would you choose one over the other?",
      "Describe a situation where you had to learn a new technology quickly. What was your strategy?",
      "How do you handle disagreements with your team lead on technical decisions?",
      "What's the most complex system you've built? What were the key design decisions?",
      "How would you optimize a slow database query? Walk me through your debugging process.",
    ],
    feedback: [
      "Good answer! Try to add specific metrics or numbers to make it more impactful.",
      "Nice structure! Consider using the STAR method: Situation, Task, Action, Result.",
      "Strong technical depth. Make sure to also highlight the business impact of your work.",
      "Good start! Try to be more concise — aim for 2-3 minutes per answer.",
    ],
    tip: [
      "💡 Tip: Always clarify requirements before diving into a solution.",
      "💡 Tip: Think out loud — interviewers want to see your reasoning process.",
      "💡 Tip: It's okay to ask for a moment to think before answering.",
      "💡 Tip: Use concrete examples from your past experience whenever possible.",
    ],
    default: [
      "That's a great point! Let me ask you a follow-up: how would you scale that solution?",
      "Interesting approach. What trade-offs did you consider?",
      "Good thinking. Can you elaborate on the technical implementation?",
      "I see. How would you handle edge cases in that scenario?",
    ],
  };

  const getAIResponse = (msg) => {
    const m = msg.toLowerCase();
    if (m.includes('hello') || m.includes('hi') || m.includes('hey')) return AI_RESPONSES.greet[Math.floor(Math.random() * AI_RESPONSES.greet.length)];
    if (m.includes('question') || m.includes('ask me') || m.includes('practice')) return AI_RESPONSES.question[Math.floor(Math.random() * AI_RESPONSES.question.length)];
    if (m.includes('feedback') || m.includes('how did i') || m.includes('was that good')) return AI_RESPONSES.feedback[Math.floor(Math.random() * AI_RESPONSES.feedback.length)];
    if (m.includes('tip') || m.includes('advice') || m.includes('help')) return AI_RESPONSES.tip[Math.floor(Math.random() * AI_RESPONSES.tip.length)];
    return AI_RESPONSES.default[Math.floor(Math.random() * AI_RESPONSES.default.length)];
  };

  const sendChatMessage = () => {
    const msg = chatInput.trim();
    if (!msg) return;
    const userMsg = { role: 'user', text: msg, time: new Date().toLocaleTimeString() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    setTimeout(() => {
      const aiReply = { role: 'ai', text: getAIResponse(msg), time: new Date().toLocaleTimeString() };
      setChatMessages(prev => [...prev, aiReply]);
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }, 900 + Math.random() * 600);
  };

  const triggerHint = (text) => {
    const msg = text || 'Can you tell me about your experience with React and system design?';
    setWhisperLoading(true);
    socketRef.current?.emit('transcript_chunk', roomId, msg);
  };

  const endSession = async () => {
    clearInterval(timerRef.current);
    clearInterval(metricsRef.current);
    setEnded(true);
    try {
      const data = await api.interviewAnalytics({
        interviewId: roomId,
        metricsArray: [{ confidence, clarity, energy }],
        fullTranscript: 'Discussed React, system design, and distributed systems experience.'
      });
      setAnalytics(data.analytics);
    } catch (e) { console.error(e); }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const remaining = Math.max(0, 3600 - elapsed);

  // ── Analytics screen ──────────────────────────────────────────────────
  if (ended && !analytics) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(195,192,255,0.2)', borderTop: '3px solid #c3c0ff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#c7c4d8' }}>Generating analytics...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (ended && analytics) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 700, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📊</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Post-Interview Analytics</h2>
            <p style={{ color: '#c7c4d8', marginTop: 8 }}>Session complete — here's your performance breakdown</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Confidence', val: analytics.overall_confidence, color: '#c3c0ff' },
              { label: 'Clarity',    val: analytics.communication_clarity, color: '#4edea3' },
              { label: 'Tech Depth', val: analytics.technical_depth, color: '#ffb95f' },
            ].map(m => (
              <div key={m.label} style={{ background: '#171f33', borderRadius: 16, padding: '1.5rem', textAlign: 'center', border: `1px solid ${m.color}30` }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: m.color, marginBottom: 6 }}>{m.val}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: '1rem' }}>Actionable Insights</div>
            {analytics.actionable_insights?.map((ins, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 16, marginTop: 1, flexShrink: 0 }}>arrow_right</span>
                <span style={{ fontSize: '0.875rem', color: '#c7c4d8', lineHeight: 1.6 }}>{ins}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/dashboard')} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Main room UI ──────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Top bar */}
      <nav style={{ height: 64, background: 'rgba(11,19,38,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(195,192,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#c3c0ff' }}>AlumniConnect AI</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#222a3d', padding: '0.3rem 0.75rem', borderRadius: 999, border: '1px solid rgba(70,69,85,0.3)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#4edea3' : '#ffb4ab', animation: isConnected ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: isConnected ? '#4edea3' : '#ffb4ab' }}>
              {isConnected ? (peerConnected ? 'LIVE • PEER CONNECTED' : 'LIVE • WAITING FOR PEER') : 'CONNECTING...'}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>Room: <strong style={{ color: '#c3c0ff' }}>{roomId}</strong></span>
          {camPermission === 'denied' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', padding: '0.25rem 0.75rem', borderRadius: 999 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ffb4ab' }}>no_photography</span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#ffb4ab', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Camera Blocked</span>
            </div>
          )}
          {camPermission === 'unavailable' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(70,69,85,0.2)', border: '1px solid rgba(70,69,85,0.3)', padding: '0.25rem 0.75rem', borderRadius: 999 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#c7c4d8' }}>videocam_off</span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Audio Only</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>Logged in as <strong style={{ color: '#c3c0ff' }}>{myId}</strong></span>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1.25rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
            Leave Room
          </button>
        </div>
      </nav>

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Video grid */}
        <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            {/* Local */}
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#131b2e', border: `1px solid ${isSharing ? 'rgba(78,222,163,0.4)' : 'rgba(70,69,85,0.2)'}`, transition: 'border-color 0.3s' }}>
              <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

              {/* Camera off overlay */}
              {!camOn && !isSharing && camPermission === 'granted' && (
                <div style={{ position: 'absolute', inset: 0, background: '#131b2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#464555' }}>videocam_off</span>
                  <span style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>Camera off</span>
                </div>
              )}

              {/* Camera permission denied */}
              {camPermission === 'denied' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,19,38,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '1rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#ffb4ab' }}>no_photography</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffb4ab', marginBottom: 4 }}>Camera Access Denied</div>
                    <div style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.5, maxWidth: 200 }}>
                      Click the camera icon in your browser's address bar to allow access, then refresh.
                    </div>
                  </div>
                  <button onClick={() => window.location.reload()} style={{ padding: '0.4rem 1rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 8, color: '#c3c0ff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                    Retry
                  </button>
                </div>
              )}

              {/* Camera unavailable */}
              {camPermission === 'unavailable' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,19,38,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#464555' }}>videocam_off</span>
                  <div style={{ fontSize: '0.75rem', color: '#c7c4d8', textAlign: 'center' }}>No camera detected</div>
                  <div style={{ fontSize: '0.65rem', color: '#c7c4d8', opacity: 0.6 }}>Audio only mode</div>
                </div>
              )}
              {isSharing && (
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(78,222,163,0.15)', border: '1px solid rgba(78,222,163,0.4)', backdropFilter: 'blur(8px)', padding: '0.3rem 0.75rem', borderRadius: 999 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4edea3', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#4edea3', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sharing Screen</span>
                </div>
              )}
              {/* Live metrics overlay */}
              <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(23,31,51,0.85)', backdropFilter: 'blur(12px)', borderRadius: 12, padding: '0.75rem', width: 176, border: '1px solid rgba(195,192,255,0.1)' }}>
                {[
                  { label: 'Confidence', val: confidence, color: '#4edea3' },
                  { label: 'Clarity',    val: clarity,    color: '#c3c0ff' },
                  { label: 'Energy',     val: energy,     color: '#ffb95f' },
                ].map(m => (
                  <div key={m.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c7c4d8', marginBottom: 3 }}>
                      <span>{m.label}</span>
                      <span style={{ color: m.color, transition: 'color 0.5s' }}>{m.val}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${m.val}%`, background: m.color, borderRadius: 999, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#4edea3' }}>auto_fix_high</span>
                  <span style={{ fontSize: '0.6rem', color: '#c7c4d8', lineHeight: 1.4 }}>AI coaching live</span>
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '0.3rem 0.75rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700 }}>
                {myId} (You)
              </div>
            </div>

            {/* Remote */}
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#131b2e', border: `1px solid ${peerConnected ? 'rgba(78,222,163,0.3)' : 'rgba(70,69,85,0.2)'}`, transition: 'border-color 0.5s' }}>
              <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {!peerConnected && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,19,38,0.85)' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#1d00a5', marginBottom: 12 }}>?</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#c7c4d8', marginBottom: 6 }}>Waiting for peer...</div>
                  <div style={{ fontSize: '0.75rem', color: '#c7c4d8', opacity: 0.6, textAlign: 'center', maxWidth: 220 }}>
                    Open this URL in another tab and log in as a different user
                  </div>
                  <div style={{ marginTop: 12, padding: '0.4rem 0.8rem', background: '#222a3d', borderRadius: 8, fontSize: '0.7rem', color: '#c3c0ff', fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: 260, textAlign: 'center' }}>
                    {window.location.href}
                  </div>
                </div>
              )}
              {/* Signal indicator */}
              <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '0.25rem 0.6rem', borderRadius: 999 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 12 }}>
                  {[6,10,12,8].map((h, i) => (
                    <div key={i} style={{ width: 2, height: h, background: peerConnected && i < 3 ? '#4edea3' : 'rgba(70,69,85,0.5)', borderRadius: 1, transition: 'background 0.5s' }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c7c4d8' }}>{peerConnected ? 'HD • Live' : 'No signal'}</span>
              </div>
              {peerConnected && (
                <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '0.3rem 0.75rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700 }}>
                  {peerName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Panel sidebar — tabbed */}
        <aside style={{ width: 360, background: '#131b2e', borderLeft: '1px solid rgba(70,69,85,0.2)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(70,69,85,0.2)', flexShrink: 0 }}>
            {[
              { id: 'chat',        icon: 'chat',          label: 'AI Chat'      },
              { id: 'whisperer',   icon: 'auto_awesome',  label: 'Whisperer'    },
              { id: 'interviewer', icon: 'record_voice_over', label: 'Interviewer' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setSidebarTab(tab.id)} style={{ flex: 1, padding: '0.875rem 0.5rem', background: 'none', border: 'none', borderBottom: sidebarTab === tab.id ? '2px solid #c3c0ff' : '2px solid transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: sidebarTab === tab.id ? '#c3c0ff' : '#c7c4d8', transition: 'all 0.2s' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: sidebarTab === tab.id ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
                <span style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── AI CHAT TAB ── */}
          {sidebarTab === 'chat' && <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'slideIn 0.3s ease' }}>
                  {m.role === 'ai' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#1d00a5', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      </div>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Coach</span>
                    </div>
                  )}
                  <div style={{ maxWidth: '85%', padding: '0.65rem 0.875rem', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: m.role === 'user' ? 'linear-gradient(135deg,#4f46e5,#6366f1)' : '#222a3d', color: '#dae2fd', fontSize: '0.8rem', lineHeight: 1.6 }}>
                    {m.text}
                  </div>
                  <div style={{ fontSize: '0.58rem', color: 'rgba(199,196,216,0.35)', marginTop: 3 }}>{m.time}</div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#1d00a5', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                  <div style={{ display: 'flex', gap: 3, padding: '0.5rem 0.75rem', background: '#222a3d', borderRadius: 12 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#c3c0ff', animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '0.875rem', borderTop: '1px solid rgba(70,69,85,0.2)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                  placeholder="Ask AI Coach anything..."
                  style={{ flex: 1, background: '#222a3d', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 10, padding: '0.65rem 0.875rem', color: '#dae2fd', fontSize: '0.78rem', outline: 'none' }} />
                <button onClick={sendChatMessage} disabled={!chatInput.trim()} style={{ width: 38, height: 38, borderRadius: 10, background: chatInput.trim() ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#222a3d', border: 'none', cursor: chatInput.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: chatInput.trim() ? '#1d00a5' : '#464555', fontSize: 16 }}>send</span>
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {['Ask me a question', 'Give feedback', 'Interview tip'].map(q => (
                  <button key={q} onClick={() => { setChatInput(q); }} style={{ padding: '0.25rem 0.6rem', background: 'rgba(195,192,255,0.08)', border: '1px solid rgba(195,192,255,0.15)', borderRadius: 999, fontSize: '0.6rem', color: '#c3c0ff', cursor: 'pointer', fontWeight: 600 }}>{q}</button>
                ))}
              </div>
            </div>
          </>}

          {/* ── WHISPERER TAB ── */}
          {sidebarTab === 'whisperer' && <>
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(70,69,85,0.15)', flexShrink: 0 }}>
              <div style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.15),rgba(11,19,38,0.8))', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 12, padding: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 13 }}>psychology_alt</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suggested Follow-up</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#dae2fd', lineHeight: 1.6, fontWeight: 500, marginBottom: 8 }}>
                  "Ask about LLM token efficiency in production environments."
                </p>
                <button onClick={() => triggerHint()} style={{ background: 'rgba(195,192,255,0.15)', color: '#c3c0ff', border: 'none', borderRadius: 6, padding: '0.3rem 0.75rem', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer' }}>
                  🎤 Trigger AI Hint
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(199,196,216,0.4)' }}>Real-time Insights</div>
              {whisperLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1rem', background: 'rgba(195,192,255,0.05)', borderRadius: 8, border: '1px solid rgba(195,192,255,0.1)' }}>
                  <div style={{ display: 'flex', gap: 3 }}>{[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#c3c0ff', animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}</div>
                  <span style={{ fontSize: '0.72rem', color: '#c3c0ff' }}>AI is thinking...</span>
                </div>
              )}
              {hints.length === 0 && !whisperLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#c7c4d8', textAlign: 'center', padding: '2rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.25, marginBottom: 8 }}>hearing</span>
                  <p style={{ fontSize: '0.78rem', opacity: 0.5, lineHeight: 1.6 }}>Listening...<br />Type a topic below to get a hint.</p>
                </div>
              ) : hints.map((h, i) => (
                <div key={i} style={{ background: '#171f33', border: '1px solid rgba(70,69,85,0.2)', borderLeft: '3px solid #c3c0ff', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.78rem', lineHeight: 1.5, animation: 'slideIn 0.3s ease' }}>
                  {h.text}
                  <div style={{ fontSize: '0.62rem', color: 'rgba(199,196,216,0.4)', marginTop: 5 }}>{h.time}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '0.875rem', borderTop: '1px solid rgba(70,69,85,0.2)', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && aiInput.trim()) { triggerHint(aiInput); setAiInput(''); } }}
                  placeholder="Type topic to get AI hint (Enter)..."
                  style={{ width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 10, padding: '0.65rem 2.5rem 0.65rem 0.875rem', color: '#dae2fd', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }} />
                <button onClick={() => { if (aiInput.trim()) { triggerHint(aiInput); setAiInput(''); } }}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 16 }}>send</span>
                </button>
              </div>
            </div>
          </>}

          {/* ── AI INTERVIEWER TAB ── */}
          {sidebarTab === 'interviewer' && <>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(70,69,85,0.15)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 20px rgba(79,70,229,0.3)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#1d00a5', fontSize: 26, fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#dae2fd' }}>Alex — AI Interviewer</div>
                  <div style={{ fontSize: '0.7rem', color: '#c7c4d8', marginTop: 2 }}>Senior Engineer • 8 yrs exp</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4edea3', animation: 'pulse 2s infinite' }} />
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#4edea3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active in session</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(199,196,216,0.4)', marginBottom: 4 }}>Interview Questions</div>

              {[
                { q: "Tell me about yourself and your background.", cat: 'Intro', color: '#c3c0ff' },
                { q: "Describe a challenging technical problem you solved recently.", cat: 'Behavioral', color: '#ffb95f' },
                { q: "How would you design a scalable notification system?", cat: 'System Design', color: '#4edea3' },
                { q: "What's the difference between SQL and NoSQL databases?", cat: 'Technical', color: '#c3c0ff' },
                { q: "How do you handle conflicts within your team?", cat: 'Behavioral', color: '#ffb95f' },
                { q: "Explain the concept of microservices and their trade-offs.", cat: 'System Design', color: '#4edea3' },
                { q: "Where do you see yourself in 5 years?", cat: 'Career', color: '#ffb4ab' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#171f33', borderRadius: 10, padding: '0.875rem', border: '1px solid rgba(70,69,85,0.2)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${item.color}40`; e.currentTarget.style.background = '#1e2740'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(70,69,85,0.2)'; e.currentTarget.style.background = '#171f33'; }}
                  onClick={() => {
                    const aiMsg = { role: 'ai', text: item.q, time: new Date().toLocaleTimeString() };
                    setChatMessages(prev => [...prev, aiMsg]);
                    setSidebarTab('chat');
                    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <p style={{ fontSize: '0.78rem', color: '#dae2fd', lineHeight: 1.5, flex: 1 }}>{item.q}</p>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#c7c4d8', flexShrink: 0, marginTop: 2 }}>arrow_forward</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{ padding: '0.15rem 0.5rem', background: `${item.color}15`, border: `1px solid ${item.color}30`, borderRadius: 999, fontSize: '0.58rem', fontWeight: 700, color: item.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.cat}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '0.875rem', borderTop: '1px solid rgba(70,69,85,0.2)', flexShrink: 0 }}>
              <button onClick={() => {
                const questions = ["Tell me about a time you led a project under tight deadlines.", "How do you approach learning a new technology?", "Describe your ideal engineering culture.", "What's your biggest professional achievement?"];
                const q = questions[Math.floor(Math.random() * questions.length)];
                const aiMsg = { role: 'ai', text: q, time: new Date().toLocaleTimeString() };
                setChatMessages(prev => [...prev, aiMsg]);
                setSidebarTab('chat');
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
              }} style={{ width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>shuffle</span>
                Ask Random Question
              </button>
            </div>
          </>}

        </aside>
      </div>

      {/* Bottom controls */}
      <div style={{ height: 76, background: 'rgba(11,19,38,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', flexShrink: 0 }}>
        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(199,196,216,0.5)', marginBottom: 2 }}>Elapsed</div>
            <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 700, color: '#c3c0ff' }}>{fmt(elapsed)}</div>
          </div>
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(199,196,216,0.5)', marginBottom: 2 }}>Remaining</div>
            <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 700, color: '#c7c4d8' }}>{fmt(remaining)}</div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {[
            { icon: micOn ? 'mic' : 'mic_off', action: toggleMic, on: micOn, title: micOn ? 'Mute' : 'Unmute' },
            { icon: camPermission === 'denied' ? 'no_photography' : camOn ? 'videocam' : 'videocam_off', action: toggleCam, on: camOn && camPermission === 'granted', title: camPermission === 'denied' ? 'Camera denied — click to retry' : camOn ? 'Stop Video' : 'Start Video' },
            { icon: isSharing ? 'stop_screen_share' : 'present_to_all', action: shareScreen, on: !isSharing, title: isSharing ? 'Sharing Screen' : 'Share Screen', active: isSharing },
          ].map((c, i) => (
            <button key={i} onClick={c.action} title={c.title} style={{ width: 42, height: 42, borderRadius: '50%', background: c.active ? 'rgba(78,222,163,0.2)' : c.on ? '#222a3d' : 'rgba(255,107,107,0.15)', border: `1px solid ${c.active ? 'rgba(78,222,163,0.4)' : c.on ? 'rgba(255,255,255,0.06)' : 'rgba(255,107,107,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.active ? '#4edea3' : c.on ? '#dae2fd' : '#ffb4ab', transition: 'all 0.2s' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 19 }}>{c.icon}</span>
            </button>
          ))}
          <div style={{ width: 12 }} />
          <button onClick={endSession} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 1.25rem', height: 42, borderRadius: 999, background: '#ffb4ab', color: '#690005', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 6px 16px rgba(255,107,107,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>call_end</span>
            End Session
          </button>
        </div>

        {/* Participants */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex' }}>
            {[myId[0] || 'Y', peerName[0] || '?', 'AI'].map((l, i) => (
              <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: i === 2 ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : i === 1 && peerConnected ? 'linear-gradient(135deg,#00a572,#4edea3)' : '#222a3d', border: '2px solid #0b1326', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: i === 2 ? '#1d00a5' : '#c3c0ff', marginLeft: i > 0 ? -8 : 0, opacity: i === 1 && !peerConnected ? 0.4 : 1, transition: 'all 0.3s' }}>{l.toUpperCase()}</div>
            ))}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#c7c4d8' }}>{peerConnected ? '3 connected' : '1 connected'}</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(78,222,163,0.4)} 50%{opacity:0.7;box-shadow:0 0 0 6px rgba(78,222,163,0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
      `}</style>
    </div>
  );
}
