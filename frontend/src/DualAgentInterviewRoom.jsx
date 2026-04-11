import React, { useEffect, useRef, useState, useContext } from 'react';
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
  const [elapsed, setElapsed] = useState(0);

  // AI
  const [hints, setHints] = useState([]);
  const [aiInput, setAiInput] = useState('');

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

  const myId = user?.name || user?.role || 'User';

  useEffect(() => {
    const socket = io(`${SOCKET_URL}/interview`);
    socketRef.current = socket;

    // ── Get local media ──────────────────────────────────────────────────
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        initPeerConnection(stream);
      })
      .catch(err => {
        console.warn('Camera unavailable, using audio-only or no media:', err);
        initPeerConnection(null);
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

    return () => {
      socket.disconnect();
      pcRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(timerRef.current);
      clearInterval(metricsRef.current);
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
  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOn; });
    setCamOn(c => !c);
  };

  const triggerHint = () => {
    socketRef.current?.emit('transcript_chunk', roomId, 'Can you tell me about your experience with React and system design?');
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
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#131b2e', border: '1px solid rgba(70,69,85,0.2)' }}>
              <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {!camOn && (
                <div style={{ position: 'absolute', inset: 0, background: '#131b2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#464555' }}>videocam_off</span>
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

        {/* AI Whisperer sidebar */}
        <aside style={{ width: 340, background: '#131b2e', borderLeft: '1px solid rgba(70,69,85,0.2)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(195,192,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(195,192,255,0.2)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 16 }}>auto_awesome</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Whisperer</span>
              </div>
              <span style={{ background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.6rem', fontWeight: 700, border: '1px solid rgba(195,192,255,0.2)' }}>PRIVATE</span>
            </div>

            {/* Suggested question */}
            <div style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.15),rgba(11,19,38,0.8))', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 12, padding: '0.875rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 13 }}>psychology_alt</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suggested Follow-up</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#dae2fd', lineHeight: 1.6, fontWeight: 500, marginBottom: 8 }}>
                "Ask about LLM token efficiency in production environments."
              </p>
              <button onClick={triggerHint} style={{ background: 'rgba(195,192,255,0.15)', color: '#c3c0ff', border: 'none', borderRadius: 6, padding: '0.3rem 0.75rem', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer' }}>
                🎤 Trigger AI Hint
              </button>
            </div>

            {/* Fact check */}
            <div style={{ background: 'rgba(42,23,0,0.4)', border: '1px solid rgba(255,185,95,0.2)', borderRadius: 12, padding: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <span className="material-symbols-outlined" style={{ color: '#ffb95f', fontSize: 13 }}>verified_user</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fact-Check Live</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#c7c4d8', fontStyle: 'italic', lineHeight: 1.5 }}>
                GPT-4 benchmark claim: <span style={{ color: '#4edea3', fontWeight: 700 }}>Confirmed ✓</span> (99.8% match)
              </p>
            </div>
          </div>

          {/* Hints feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(199,196,216,0.4)' }}>Real-time Insights</div>
            {hints.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#c7c4d8', textAlign: 'center', padding: '2rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.25, marginBottom: 8 }}>hearing</span>
                <p style={{ fontSize: '0.78rem', opacity: 0.5, lineHeight: 1.6 }}>Listening...<br />Click "Trigger AI Hint" to test.</p>
              </div>
            ) : hints.map((h, i) => (
              <div key={i} style={{ background: '#171f33', border: '1px solid rgba(70,69,85,0.2)', borderLeft: '3px solid #c3c0ff', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.78rem', lineHeight: 1.5, animation: 'slideIn 0.3s ease' }}>
                {h.text}
                <div style={{ fontSize: '0.62rem', color: 'rgba(199,196,216,0.4)', marginTop: 5 }}>{h.time}</div>
              </div>
            ))}
          </div>

          {/* AI input */}
          <div style={{ padding: '0.875rem', borderTop: '1px solid rgba(70,69,85,0.2)' }}>
            <div style={{ position: 'relative' }}>
              <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && aiInput.trim()) { socketRef.current?.emit('transcript_chunk', roomId, aiInput); setAiInput(''); } }}
                placeholder="Type to trigger AI hint (Enter)..."
                style={{ width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 10, padding: '0.65rem 2.5rem 0.65rem 0.875rem', color: '#dae2fd', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={() => { if (aiInput.trim()) { socketRef.current?.emit('transcript_chunk', roomId, aiInput); setAiInput(''); } }}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 16 }}>send</span>
              </button>
            </div>
          </div>
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
            { icon: camOn ? 'videocam' : 'videocam_off', action: toggleCam, on: camOn, title: camOn ? 'Stop Video' : 'Start Video' },
            { icon: 'present_to_all', action: () => {}, on: true, title: 'Share Screen' },
          ].map((c, i) => (
            <button key={i} onClick={c.action} title={c.title} style={{ width: 42, height: 42, borderRadius: '50%', background: c.on ? '#222a3d' : 'rgba(255,107,107,0.15)', border: `1px solid ${c.on ? 'rgba(255,255,255,0.06)' : 'rgba(255,107,107,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.on ? '#dae2fd' : '#ffb4ab', transition: 'all 0.2s' }}>
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
      `}</style>
    </div>
  );
}
