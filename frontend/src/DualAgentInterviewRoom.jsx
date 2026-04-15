import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import { api } from './api';
import { AuthContext } from './context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
const API_URL    = import.meta.env.VITE_API_URL    || 'http://localhost:5001';

const WHISPERER_POOL = [
  'Ask them how they handled state management or component lifecycles.',
  'Probe deeper: "Can you walk me through a time you debugged a production issue?"',
  'Ask about their experience with query optimization and index design.',
  'Follow up: "How would you design this system to handle 10x traffic?"',
  'Ask about a time they disagreed with a teammate on architecture.',
  'Dig into soft skills: "How do you communicate technical decisions to non-engineers?"',
  'Ask: "What is the most complex feature you have shipped end-to-end?"',
  'Challenge them: "How would you optimize token efficiency in a production LLM pipeline?"',
];

function useAnimatedMetric(target, speed = 0.06) {
  const [val, setVal] = useState(target);
  const ref = useRef(target);
  useEffect(() => { ref.current = target; }, [target]);
  useEffect(() => {
    const id = setInterval(() => {
      setVal(p => { const d = ref.current - p; return Math.abs(d) < 0.5 ? ref.current : p + d * speed; });
    }, 50);
    return () => clearInterval(id);
  }, [speed]);
  return Math.round(val);
}

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function DualAgentInterviewRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Identity computed once — ref never triggers re-renders
  const myIdRef = useRef(null);
  if (!myIdRef.current) {
    const fromUrl = searchParams.get('name');
    if (fromUrl) {
      myIdRef.current = fromUrl;
    } else if (user?.name) {
      myIdRef.current = user.name;
    } else {
      const key = `alumnex_guest_${roomId}`;
      let stored = sessionStorage.getItem(key);
      if (!stored) {
        stored = window.prompt('Enter your name to join:') || `Guest-${Math.floor(Math.random() * 9000) + 1000}`;
        sessionStorage.setItem(key, stored);
      }
      myIdRef.current = stored;
    }
  }
  const myId = myIdRef.current;

  // Role: alumni = interviewer, student = candidate
  const isInterviewer = user?.role === 'ALUMNI' || searchParams.get('role') === 'alumni';

  // UI State
  const [isConnected,       setIsConnected]       = useState(false);
  const [socketPeerPresent, setSocketPeerPresent] = useState(false);
  const [videoConnected,    setVideoConnected]    = useState(false);
  const [peerName,          setPeerName]          = useState('Peer');
  const [micOn,             setMicOn]             = useState(true);
  const [camOn,             setCamOn]             = useState(true);
  const [sharing,           setSharing]           = useState(false);
  const [handRaised,        setHandRaised]        = useState(false);
  const [sidePanel,         setSidePanel]         = useState('ai');
  const [elapsed,           setElapsed]           = useState(0);
  const [chatMessages,      setChatMessages]      = useState([]);
  const [chatInput,         setChatInput]         = useState('');
  const [unreadChat,        setUnreadChat]        = useState(0);
  const [hints,             setHints]             = useState([]);
  const [aiInput,           setAiInput]           = useState('');
  const [currentSuggestion, setCurrentSuggestion] = useState(WHISPERER_POOL[0]);
  const [suggestionIdx,     setSuggestionIdx]     = useState(0);
  const [factChecks,        setFactChecks]        = useState([{ claim: 'GPT-4 benchmark (2023)', status: 'confirmed', pct: '99.8%' }]);
  const [factInput,         setFactInput]         = useState('');
  const [coachingTip,       setCoachingTip]       = useState('');
  const [profileSummary,    setProfileSummary]    = useState(null);
  const [confT,             setConfT]             = useState(72);
  const [clarT,             setClarT]             = useState(65);
  const [energyT,           setEnergyT]           = useState(80);
  const [ended,             setEnded]             = useState(false);
  const [analytics,         setAnalytics]         = useState(null);
  const [analyticsLoading,  setAnalyticsLoading]  = useState(false);
  const [rating,            setRating]            = useState(0);
  const [ratingFeedback,    setRatingFeedback]    = useState('');
  const [ratingSubmitted,   setRatingSubmitted]   = useState(false);
  const [ratingSubmitting,  setRatingSubmitting]  = useState(false);

  const confidence = useAnimatedMetric(confT);
  const clarity    = useAnimatedMetric(clarT);
  const energy     = useAnimatedMetric(energyT);

  // Refs — mutable, never cause re-renders
  const localVideoRef   = useRef(null);
  const remoteVideoRef  = useRef(null);
  const screenVideoRef  = useRef(null);
  const socketRef       = useRef(null);
  const pcRef           = useRef(null);
  const streamRef       = useRef(null);
  const screenStreamRef = useRef(null);
  const timerRef        = useRef(null);
  const metricsRef      = useRef(null);
  const suggestionRef   = useRef(null);
  const chatEndRef      = useRef(null);
  const iceBuf          = useRef([]);
  const makingOfferRef  = useRef(false);
  const politeRef       = useRef(true);
  const peerReadyRef    = useRef(false); // true once peer is detected via socket
  const videoConnRef    = useRef(false); // track video state inside callbacks
  const retryTimerRef   = useRef(null);
  const sidePanelRef    = useRef(sidePanel);

  // Keep refs in sync with state for use inside socket callbacks
  useEffect(() => { sidePanelRef.current = sidePanel; }, [sidePanel]);
  useEffect(() => { videoConnRef.current = videoConnected; }, [videoConnected]);

  // Clear unread when switching to chat panel
  useEffect(() => {
    if (sidePanel === 'chat') setUnreadChat(0);
  }, [sidePanel]);

  // Single effect — runs ONCE on mount
  useEffect(() => {
    let pc = null;
    let socket = null;
    let destroyed = false;

    async function flushIceBuf() {
      if (!pc?.remoteDescription?.type) return;
      const buf = iceBuf.current.splice(0);
      for (const c of buf) {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
      }
      if (buf.length) console.log('[WebRTC] Flushed', buf.length, 'buffered ICE candidates');
    }

    // Create and send an offer (with safety checks)
    async function createAndSendOffer(reason) {
      if (!pc || pc.signalingState === 'closed' || !socket?.connected) {
        console.warn('[WebRTC] Cannot create offer:', reason, '- pc or socket not ready');
        return;
      }
      try {
        makingOfferRef.current = true;
        // If stuck in have-local-offer from a previous attempt, rollback first
        if (pc.signalingState === 'have-local-offer') {
          console.log('[WebRTC] Rolling back stale local offer before creating new one');
          await pc.setLocalDescription({ type: 'rollback' });
        }
        const offer = await pc.createOffer();
        // Double-check state hasn't changed during async gap
        if (pc.signalingState === 'stable' || pc.signalingState === 'have-local-offer') {
          await pc.setLocalDescription(offer);
          socket.emit('offer', roomId, pc.localDescription);
          console.log(`[WebRTC] Offer sent (${reason})`);
        }
      } catch (err) {
        console.error(`[WebRTC] createAndSendOffer(${reason}) error:`, err);
      } finally {
        makingOfferRef.current = false;
      }
    }

    async function start() {
      // 1. Fetch ICE config
      let iceConfig = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stun.cloudflare.com:3478' },
          { urls: 'turn:openrelay.metered.ca:80',                username: 'openrelayproject', credential: 'openrelayproject' },
          { urls: 'turn:openrelay.metered.ca:443',               username: 'openrelayproject', credential: 'openrelayproject' },
          { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
          { urls: 'turn:numb.viagenie.ca',                       username: 'webrtc@live.com',  credential: 'muazkh' },
          { urls: 'turn:standard.relay.metered.ca:80',           username: 'openrelayproject', credential: 'openrelayproject' },
          { urls: 'turn:standard.relay.metered.ca:443',          username: 'openrelayproject', credential: 'openrelayproject' },
          { urls: 'turn:standard.relay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
        ],
        iceCandidatePoolSize: 10,
      };
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const r = await fetch(`${API_URL}/meet/ice-config`, { signal: controller.signal });
        clearTimeout(timeout);
        if (r.ok) { iceConfig = await r.json(); console.log('[ICE] Loaded', iceConfig.iceServers.length, 'servers from backend'); }
      } catch (_) { console.warn('[ICE] Could not fetch from backend — using built-in defaults'); }

      if (destroyed) return;

      // 2. Create PeerConnection
      pc = new RTCPeerConnection(iceConfig);
      pcRef.current = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate) socket?.emit('ice-candidate', roomId, e.candidate);
      };

      // onnegotiationneeded — ONLY create offer if peer is already in room
      // This fires when addTrack is called before socket connects, so we MUST gate it
      pc.onnegotiationneeded = async () => {
        console.log('[WebRTC] negotiationneeded fired, peerReady:', peerReadyRef.current, 'socketConnected:', socket?.connected);
        if (!peerReadyRef.current || !socket?.connected) {
          console.log('[WebRTC] Skipping negotiationneeded — peer not ready or socket not connected');
          return;
        }
        await createAndSendOffer('negotiationneeded');
      };

      pc.ontrack = (e) => {
        console.log('[WebRTC] ontrack:', e.track.kind, 'streams:', e.streams.length);
        const remoteVideo = remoteVideoRef.current;
        if (!remoteVideo) return;

        if (e.streams?.[0]) {
          if (remoteVideo.srcObject !== e.streams[0]) {
            remoteVideo.srcObject = e.streams[0];
          }
        } else {
          if (!remoteVideo.srcObject) {
            remoteVideo.srcObject = new MediaStream();
          }
          remoteVideo.srcObject.addTrack(e.track);
        }
        remoteVideo.muted = false;
        remoteVideo.play().catch(() => {});
        setVideoConnected(true);
      };

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] connectionState:', pc.connectionState);
        if (pc.connectionState === 'connected') setVideoConnected(true);
        if (pc.connectionState === 'failed')    setVideoConnected(false);
        if (pc.connectionState === 'closed')    setVideoConnected(false);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] iceState:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setVideoConnected(true);
        }
        if (pc.iceConnectionState === 'failed') {
          console.log('[WebRTC] ICE failed — restarting');
          pc.restartIce();
        }
      };

      // 3. Get camera + mic — tracks added here will fire onnegotiationneeded
      //    but we gate it above so the premature offer is suppressed
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (destroyed) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (localVideoRef.current) { localVideoRef.current.srcObject = stream; localVideoRef.current.muted = true; }
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
        console.log('[Media] Tracks added to PC');
      } catch (err) { console.error('[Media] getUserMedia failed:', err); }

      // 4. Connect socket AFTER media is ready
      socket = io(`${SOCKET_URL}/interview`, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
        timeout: 10000,
        forceNew: true,
      });
      socketRef.current = socket;

      socket.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err.message);
        setHints(p => [{
          text: `⚠ Cannot reach backend at ${SOCKET_URL}. Make sure the backend server is running.`,
          category: 'system', time: new Date().toLocaleTimeString(), type: 'system'
        }, ...p]);
      });

      socket.on('connect', () => {
        console.log('[Socket] Connected as', myId, 'to', SOCKET_URL);
        setIsConnected(true);
        socket.emit('join-room', roomId, myId);
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        setIsConnected(false);
        if (reason === 'io server disconnect') socket.connect();
      });

      // Room users already present — we are the late joiner (polite peer)
      socket.on('room-users', (users) => {
        console.log('[Socket] Room already has users:', users);
        if (users.length > 0) {
          setPeerName(users[0]);
          setSocketPeerPresent(true);
          peerReadyRef.current = true;
          politeRef.current = true;
          console.log('[WebRTC] I am the POLITE peer (joined late) — waiting for offer from', users[0]);

          // Safety: if no video in 5 seconds, the impolite peer's offer may have been lost
          // Stay polite so if both retry simultaneously, we yield to the other's offer
          retryTimerRef.current = setTimeout(() => {
            if (!videoConnRef.current && peerReadyRef.current && pc && pc.signalingState !== 'closed') {
              console.log('[WebRTC] RETRY: No video after 5s as polite peer — sending offer (staying polite)');
              createAndSendOffer('polite-retry');
            }
          }, 5000);
        }
      });

      // A new peer joined after us — we are the impolite peer → create offer
      socket.on('user-connected', async (uid) => {
        console.log('[Socket] Peer joined:', uid);
        setPeerName(uid);
        setSocketPeerPresent(true);
        peerReadyRef.current = true;
        politeRef.current = false;
        console.log('[WebRTC] I am the IMPOLITE peer (was here first) → will send offer to', uid);

        // Small delay to let the new peer's PeerConnection initialize
        await new Promise(r => setTimeout(r, 800));

        if (streamRef.current && pc && pc.signalingState !== 'closed') {
          await createAndSendOffer('user-connected');
        }

        // Safety retry: if video not connected after 8 seconds, re-offer
        // Staggered at 8s (vs polite peer's 5s) to avoid simultaneous retries 
        retryTimerRef.current = setTimeout(() => {
          if (!videoConnRef.current && peerReadyRef.current && pc && pc.signalingState !== 'closed') {
            console.log('[WebRTC] RETRY: No video after 8s as impolite peer — re-sending offer');
            createAndSendOffer('impolite-retry');
          }
        }, 8000);
      });

      socket.on('user-disconnected', () => {
        console.log('[Socket] Peer left');
        setSocketPeerPresent(false);
        peerReadyRef.current = false;
        setVideoConnected(false);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        clearTimeout(retryTimerRef.current);
      });

      // ── Offer handler ───────────────────────────────────────────────
      socket.on('offer', async (offer) => {
        if (!pc || pc.signalingState === 'closed') return;
        console.log('[WebRTC] Got offer, signalingState:', pc.signalingState, 'polite:', politeRef.current);

        const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';

        if (offerCollision) {
          if (!politeRef.current) {
            console.log('[WebRTC] Impolite peer ignoring colliding offer');
            return;
          }
          console.log('[WebRTC] Polite peer rolling back for incoming offer');
        }

        try {
          // Rollback any existing local offer
          if (pc.signalingState !== 'stable') {
            await pc.setLocalDescription({ type: 'rollback' });
          }
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await flushIceBuf();

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', roomId, pc.localDescription);
          console.log('[WebRTC] Answer sent');
        } catch (err) {
          console.error('[WebRTC] offer handler error:', err);
        }
      });

      // ── Answer handler ──────────────────────────────────────────────
      socket.on('answer', async (ans) => {
        if (!pc || pc.signalingState === 'closed') return;
        console.log('[WebRTC] Got answer, signalingState:', pc.signalingState);
        try {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(ans));
            await flushIceBuf();
          } else {
            console.warn('[WebRTC] Got answer but signalingState is', pc.signalingState, '- ignoring');
          }
        } catch (err) { console.error('[WebRTC] answer handler:', err); }
      });

      socket.on('ice-candidate', async (c) => {
        if (!pc) return;
        if (pc.remoteDescription?.type) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); }
          catch (_) {}
        } else {
          iceBuf.current.push(c);
        }
      });

      // AI agent events
      socket.on('whisperer_feed', (data) => {
        const hint = typeof data === 'string' ? data : data.hint;
        const category = typeof data === 'object' ? data.category : 'general';
        setHints(p => [{ text: hint, category, time: new Date().toLocaleTimeString(), type: 'ai' }, ...p]);
      });
      socket.on('speech_coaching', (result) => {
        setCoachingTip(result.coaching_tip || '');
        if (result.confidence) setConfT(result.confidence);
        if (result.clarity)    setClarT(result.clarity);
        if (result.energy)     setEnergyT(result.energy);
      });
      socket.on('fact_check_result', ({ claim, result }) => {
        setFactChecks(p => [{ claim, status: result.verified ? 'confirmed' : 'disputed', pct: `${result.confidence}%`, note: result.note }, ...p.slice(0, 4)]);
        setHints(p => [{ text: `Fact-check: "${claim.slice(0, 50)}" - ${result.verified ? 'Confirmed' : 'Disputed'} (${result.confidence}%)`, category: 'fact-check', time: new Date().toLocaleTimeString(), type: result.verified ? 'fact-ok' : 'fact-warn' }, ...p]);
      });
      socket.on('coach_metrics_update', (m) => {
        if (m.confidence !== undefined) setConfT(m.confidence);
        if (m.clarity    !== undefined) setClarT(m.clarity);
        if (m.energy     !== undefined) setEnergyT(m.energy);
      });

      // Chat — only add messages from OTHER users (we add our own locally in sendChat)
      socket.on('chat_message', (msg) => {
        setChatMessages(p => [...p, msg]);
        if (sidePanelRef.current !== 'chat') {
          setUnreadChat(c => c + 1);
        }
      });

      socket.on('hand_raised',  (uid) => setHints(p => [{ text: `${uid} raised their hand`, time: new Date().toLocaleTimeString(), type: 'system' }, ...p]));

      // Timers
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

      // Speech metrics — only send from candidate side (not interviewer)
      const isInterviewerUser = (user?.role === 'ALUMNI') || (searchParams.get('role') === 'alumni');
      if (!isInterviewerUser) {
        metricsRef.current = setInterval(() => {
          socket.emit('speech_metrics', roomId, { wordsPerMinute: Math.floor(Math.random() * 80 + 100), fillerCount: Math.floor(Math.random() * 5), pauseCount: 2 });
        }, 3000);
      }

      suggestionRef.current = setInterval(() => {
        setSuggestionIdx(i => { const next = (i + 1) % WHISPERER_POOL.length; setCurrentSuggestion(WHISPERER_POOL[next]); return next; });
      }, 12000);
    }

    start();

    return () => {
      destroyed = true;
      console.log('[Room] Cleanup');
      socket?.disconnect();
      pc?.close();
      pcRef.current = null;
      iceBuf.current = [];
      peerReadyRef.current = false;
      clearTimeout(retryTimerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(timerRef.current);
      clearInterval(metricsRef.current);
      clearInterval(suggestionRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Screen share
  const toggleScreenShare = async () => {
    const pc = pcRef.current;
    if (!sharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        if (screenVideoRef.current) screenVideoRef.current.srcObject = screenStream;
        if (pc) {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(screenTrack);
        }
        screenTrack.onended = () => stopScreenShare();
        setSharing(true);
      } catch (e) {
        if (e.name !== 'NotAllowedError') console.error('Screen share error:', e);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    const pc = pcRef.current;
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    if (pc && streamRef.current) {
      const camTrack = streamRef.current.getVideoTracks()[0];
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender && camTrack) await sender.replaceTrack(camTrack);
    }
    setSharing(false);
  };

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn; });
    setMicOn(m => !m);
  };

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOn; });
    setCamOn(c => !c);
  };

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    if (next) socketRef.current?.emit('hand_raised', roomId, myId);
  };

  const sendTranscript = (text) => {
    if (!text.trim()) return;
    socketRef.current?.emit('transcript_chunk', roomId, text);
  };

  const triggerHint = () => sendTranscript(currentSuggestion);

  const nextSuggestion = () => {
    const next = (suggestionIdx + 1) % WHISPERER_POOL.length;
    setSuggestionIdx(next);
    setCurrentSuggestion(WHISPERER_POOL[next]);
  };

  const triggerFactCheck = (claim) => {
    if (!claim.trim()) return;
    socketRef.current?.emit('fact_check_request', roomId, claim);
    setFactInput('');
  };

  const loadProfileSummary = async () => {
    try {
      const data = await api.summarizeProfile({ name: peerName, role: 'STUDENT' });
      setProfileSummary(data.summary);
    } catch (e) { console.error(e); }
  };

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = { from: myId, text: chatInput, time: new Date().toLocaleTimeString() };
    setChatMessages(p => [...p, msg]);
    socketRef.current?.emit('chat_message', roomId, msg);
    setChatInput('');
  };

  const endSession = async () => {
    clearInterval(timerRef.current);
    clearInterval(metricsRef.current);
    clearInterval(suggestionRef.current);
    setEnded(true);
    // Interviewer goes straight to rating screen — no analytics needed
    if (isInterviewer) return;
    // Candidate gets analytics
    setAnalyticsLoading(true);
    try {
      const data = await api.interviewAnalytics({
        interviewId: roomId,
        metricsArray: [{ confidence, clarity, energy }],
        fullTranscript: hints.filter(h => h.type === 'ai').map(h => h.text).join(' '),
      });
      setAnalytics(data.analytics);
      try {
        const authUser = JSON.parse(localStorage.getItem('alumniconnect_user') || localStorage.getItem('alumnex_user') || '{}');
        const HISTORY_KEY = 'alumnex_interview_history';
        const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        const score = Math.round((confidence + clarity + energy) / 3);
        const report = {
          id: `iv-${roomId}-${Date.now()}`,
          label: `Mock Interview #${String(existing.filter(r => r.userId === authUser.id || r.studentName === authUser.name).length + 1).padStart(2, '0')}`,
          score, date: new Date().toISOString(), userId: authUser.id, studentName: authUser.name, roomId,
          metrics: { confidence, clarity, energy }, analytics: data.analytics,
          checklist: (data.analytics?.actionable_insights || []).map(t => ({ done: false, text: t })),
        };
        existing.unshift(report);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(existing.slice(0, 50)));
      } catch (saveErr) { console.warn('Could not save report:', saveErr); }
    } catch (e) { console.error(e); }
    setAnalyticsLoading(false);
  };

  const remaining = Math.max(0, 3600 - elapsed);

  // ── Post-session: Interviewer rating screen ─────────────────────────────────
  if (ended && isInterviewer) {
    const submitRating = async () => {
      if (rating === 0) return;
      setRatingSubmitting(true);

      // Store locally
      const key = 'alumnex_interview_ratings';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift({
        id: `rating-${roomId}-${Date.now()}`,
        roomId,
        candidateName: peerName,
        rating,
        feedback: ratingFeedback,
        date: new Date().toISOString(),
        interviewerName: myId,
      });
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 100)));

      // Also update candidate's profile rating locally
      const profileKey = 'alumnex_candidate_ratings';
      const profileRatings = JSON.parse(localStorage.getItem(profileKey) || '{}');
      if (!profileRatings[peerName]) profileRatings[peerName] = [];
      profileRatings[peerName].unshift({ rating, feedback: ratingFeedback, by: myId, date: new Date().toISOString(), roomId });
      localStorage.setItem(profileKey, JSON.stringify(profileRatings));

      // POST to backend API
      try {
        await fetch(`${API_URL}/users/${encodeURIComponent(peerName)}/rating`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating,
            feedback: ratingFeedback,
            interviewerName: myId,
            interviewerId: user?.id || null,
            roomId,
          }),
        });
        console.log('[Rating] Saved to backend');
      } catch (err) {
        console.warn('[Rating] Could not save to backend:', err);
      }

      setRatingSubmitting(false);
      setRatingSubmitted(true);
    };

    return (
      <div style={{ minHeight:'100vh', background:'#0b1326', color:'#dae2fd', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ maxWidth:520, width:'100%' }}>
          {ratingSubmitted ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>✅</div>
              <h2 style={{ fontSize:'1.75rem', fontWeight:900, marginBottom:8 }}>Rating Submitted</h2>
              <p style={{ color:'#c7c4d8', marginBottom:'2rem' }}>Your feedback for <strong style={{ color:'#c3c0ff' }}>{peerName}</strong> has been saved and will reflect in their profile.</p>
              <button onClick={() => navigate('/dashboard')} style={{ padding:'0.875rem 2rem', background:'linear-gradient(135deg,#4f46e5,#c3c0ff)', color:'#1d00a5', border:'none', borderRadius:12, fontWeight:700, fontSize:'0.875rem', cursor:'pointer' }}>Back to Dashboard</button>
            </div>
          ) : (
            <>
              <div style={{ textAlign:'center', marginBottom:'2rem' }}>
                <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>🎯</div>
                <h2 style={{ fontSize:'1.75rem', fontWeight:900, letterSpacing:'-0.03em' }}>Rate the Candidate</h2>
                <p style={{ color:'#c7c4d8', marginTop:8 }}>Your rating for <strong style={{ color:'#c3c0ff' }}>{peerName}</strong> will be stored in their profile.</p>
              </div>
              {/* Star rating */}
              <div style={{ background:'#131b2e', borderRadius:16, padding:'1.5rem', marginBottom:'1rem', textAlign:'center' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', marginBottom:'1rem' }}>Overall Performance</div>
                <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:'0.5rem' }}>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setRating(s)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'2.5rem', color: s <= rating ? '#ffb95f' : 'rgba(70,69,85,0.5)', transition:'all 0.15s', transform: s <= rating ? 'scale(1.15)' : 'scale(1)' }}>★</button>
                  ))}
                </div>
                <div style={{ fontSize:'0.8rem', color: rating > 0 ? '#ffb95f' : '#c7c4d8' }}>
                  {['','Poor','Below Average','Average','Good','Excellent'][rating] || 'Select a rating'}
                </div>
              </div>
              {/* Category ratings */}
              <div style={{ background:'#131b2e', borderRadius:16, padding:'1.5rem', marginBottom:'1rem' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', marginBottom:'1rem' }}>Quick Assessment</div>
                {[
                  { label:'Technical Knowledge', color:'#c3c0ff' },
                  { label:'Communication',        color:'#4edea3' },
                  { label:'Problem Solving',      color:'#ffb95f' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontSize:'0.78rem', color:'#c7c4d8' }}>{item.label}</span>
                    <div style={{ display:'flex', gap:6 }}>
                      {[1,2,3,4,5].map(s => (
                        <div key={s} style={{ width:10, height:10, borderRadius:'50%', background: s <= rating ? item.color : 'rgba(70,69,85,0.4)', transition:'background 0.2s' }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Feedback text */}
              <div style={{ background:'#131b2e', borderRadius:16, padding:'1.5rem', marginBottom:'1.5rem' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', marginBottom:8 }}>Written Feedback (optional)</div>
                <textarea
                  value={ratingFeedback}
                  onChange={e => setRatingFeedback(e.target.value)}
                  placeholder="Share specific feedback about the candidate's performance..."
                  rows={4}
                  style={{ width:'100%', background:'#222a3d', border:'1px solid rgba(70,69,85,0.4)', borderRadius:10, padding:'0.75rem', color:'#dae2fd', fontSize:'0.85rem', outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'Inter,sans-serif' }}
                />
              </div>
              <button onClick={submitRating} disabled={rating === 0 || ratingSubmitting} style={{ width:'100%', padding:'1rem', background: rating > 0 ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#2d3449', color: rating > 0 ? '#1d00a5' : '#c7c4d8', border:'none', borderRadius:12, fontWeight:700, fontSize:'0.875rem', cursor: rating > 0 ? 'pointer' : 'not-allowed', textTransform:'uppercase', letterSpacing:'0.1em', opacity: ratingSubmitting ? 0.6 : 1 }}>
                {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Analytics loading screen (candidate) ─────────────────────────────────────
  if (ended && !isInterviewer && !analytics) {
    return (
      <div style={{ minHeight:'100vh', background:'#0b1326', color:'#dae2fd', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem', animation:'pulse 2s infinite' }}>📊</div>
          <h2 style={{ fontSize:'1.75rem', fontWeight:900, letterSpacing:'-0.03em', marginBottom:8 }}>Generating Your Report...</h2>
          <p style={{ color:'#c7c4d8', maxWidth:400, lineHeight:1.6 }}>Our AI is analyzing your interview performance. This will take just a moment.</p>
          <div style={{ marginTop:'2rem', display:'flex', justifyContent:'center', gap:8 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:'#c3c0ff', animation:`bounce 1.2s ${i*0.2}s infinite ease-in-out` }} />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        `}</style>
      </div>
    );
  }

  // ── Analytics screen (candidate only) ────────────────────────────────────────
  if (ended && analytics) {
    return (
      <div style={{ minHeight:'100vh', background:'#0b1326', color:'#dae2fd', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ maxWidth:720, width:'100%' }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>📊</div>
            <h2 style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-0.03em' }}>Post-Interview Analytics</h2>
            <p style={{ color:'#c7c4d8', marginTop:8 }}>Session complete — here's your performance breakdown</p>
          </div>
          {/* Live metric snapshot */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
            {[{l:'Confidence',v:`${confidence}%`,c:'#c3c0ff'},{l:'Clarity',v:`${clarity}%`,c:'#4edea3'},{l:'Energy',v:`${energy}%`,c:'#ffb95f'}].map(m=>(
              <div key={m.l} style={{ background:'#171f33', borderRadius:16, padding:'1.5rem', textAlign:'center', border:`1px solid ${m.c}30` }}>
                <div style={{ fontSize:'1.75rem', fontWeight:900, color:m.c, marginBottom:6 }}>{m.v}</div>
                <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8' }}>{m.l}</div>
              </div>
            ))}
          </div>
          {/* AI analytics */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
            {[{l:'AI Confidence',v:analytics.overall_confidence,c:'#c3c0ff'},{l:'Clarity',v:analytics.communication_clarity,c:'#4edea3'},{l:'Tech Depth',v:analytics.technical_depth,c:'#ffb95f'}].map(m=>(
              <div key={m.l} style={{ background:'#131b2e', borderRadius:16, padding:'1.25rem', textAlign:'center', border:`1px solid rgba(70,69,85,0.2)` }}>
                <div style={{ fontSize:'1.25rem', fontWeight:900, color:m.c, marginBottom:4 }}>{m.v}</div>
                <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8' }}>{m.l}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'#131b2e', borderRadius:16, padding:'1.5rem', marginBottom:'1rem' }}>
            <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', marginBottom:'1rem' }}>Actionable Insights</div>
            {analytics.actionable_insights?.map((ins,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
                <span className="material-symbols-outlined" style={{ color:'#c3c0ff', fontSize:16, marginTop:1, flexShrink:0 }}>arrow_right</span>
                <span style={{ fontSize:'0.875rem', color:'#c7c4d8', lineHeight:1.6 }}>{ins}</span>
              </div>
            ))}
          </div>
          {analytics.suggested_readings?.length > 0 && (
            <div style={{ background:'#131b2e', borderRadius:16, padding:'1.25rem', marginBottom:'1.5rem' }}>
              <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', marginBottom:'0.75rem' }}>Suggested Readings</div>
              {analytics.suggested_readings.map((url,i)=>(
                <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:8, color:'#c3c0ff', fontSize:'0.8rem', marginBottom:6, textDecoration:'none' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:14 }}>open_in_new</span>{url}
                </a>
              ))}
            </div>
          )}
          <button onClick={()=>navigate('/dashboard')} style={{ width:'100%', padding:'1rem', background:'linear-gradient(135deg,#4f46e5,#c3c0ff)', color:'#1d00a5', border:'none', borderRadius:12, fontWeight:700, fontSize:'0.875rem', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.1em' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div style={{ height:'100vh', background:'#0b1326', color:'#dae2fd', fontFamily:'Inter,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* ── Top bar ── */}
      <nav style={{ height:60, background:'rgba(11,19,38,0.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(195,192,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', flexShrink:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1.25rem' }}>
          <span style={{ fontSize:'1rem', fontWeight:900, letterSpacing:'-0.03em', color:'#c3c0ff' }}>AlumNEX AI</span>
          <div style={{ display:'flex', alignItems:'center', gap:7, background:'#222a3d', padding:'0.25rem 0.65rem', borderRadius:999, border:'1px solid rgba(70,69,85,0.3)' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background: isConnected ? '#4edea3' : '#ffb4ab', animation: isConnected ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color: isConnected ? '#4edea3' : '#ffb4ab' }}>
              {isConnected ? (videoConnected ? 'LIVE' : (socketPeerPresent ? 'PEER DETECTED · CONNECTING...' : 'WAITING FOR PEER')) : 'CONNECTING...'}
            </span>
          </div>
          <span style={{ fontSize:'0.72rem', color:'#c7c4d8' }}>Room: <strong style={{ color:'#c3c0ff' }}>{roomId}</strong></span>
          {sharing && <span style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#ffb95f', background:'rgba(255,185,95,0.1)', border:'1px solid rgba(255,185,95,0.3)', padding:'0.2rem 0.6rem', borderRadius:999 }}>● SHARING SCREEN</span>}
          {handRaised && <span style={{ fontSize:'0.6rem', fontWeight:700, color:'#4edea3' }}>✋ Hand Raised</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:'0.72rem', color:'#c7c4d8' }}>You: <strong style={{ color:'#c3c0ff' }}>{myId}</strong></span>
          <button onClick={()=>navigate('/dashboard')} style={{ padding:'0.4rem 1rem', background:'rgba(79,70,229,0.15)', color:'#c3c0ff', border:'1px solid rgba(195,192,255,0.2)', borderRadius:8, fontWeight:700, fontSize:'0.75rem', cursor:'pointer' }}>Leave</button>
        </div>
      </nav>

      {/* ── Canvas ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Video area */}
        <div style={{ flex:1, padding:'1rem', display:'flex', flexDirection:'column', gap:'0.75rem', overflow:'hidden' }}>
          <div style={{ flex:1, display:'grid', gridTemplateColumns: sharing ? '2fr 1fr' : '1fr 1fr', gap:'0.75rem', transition:'grid-template-columns 0.3s' }}>

            {/* Local / Screen share */}
            <div style={{ position:'relative', borderRadius:14, overflow:'hidden', background:'#131b2e', border:'1px solid rgba(70,69,85,0.2)' }}>
              {/* Camera (hidden when sharing) */}
              <video ref={localVideoRef} autoPlay muted playsInline style={{ width:'100%', height:'100%', objectFit:'cover', display: sharing ? 'none' : 'block' }} />
              {/* Screen share */}
              <video ref={screenVideoRef} autoPlay muted playsInline style={{ width:'100%', height:'100%', objectFit:'contain', background:'#060e20', display: sharing ? 'block' : 'none' }} />
              {!camOn && !sharing && (
                <div style={{ position:'absolute', inset:0, background:'#131b2e', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:48, color:'#464555' }}>videocam_off</span>
                </div>
              )}
              {/* Live metrics overlay — candidate only */}
              {!isInterviewer && (
              <div style={{ position:'absolute', top:10, right:10, background:'rgba(11,19,38,0.88)', backdropFilter:'blur(12px)', borderRadius:10, padding:'0.65rem', width:168, border:'1px solid rgba(195,192,255,0.1)' }}>
                {[{l:'Confidence',v:confidence,c:'#4edea3'},{l:'Clarity',v:clarity,c:'#c3c0ff'},{l:'Energy',v:energy,c:'#ffb95f'}].map(m=>(
                  <div key={m.l} style={{ marginBottom:7 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.58rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#c7c4d8', marginBottom:3 }}>
                      <span>{m.l}</span><span style={{ color:m.c, transition:'color 0.5s' }}>{m.v}%</span>
                    </div>
                    <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${m.v}%`, background:m.c, borderRadius:999, transition:'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:5, paddingTop:5, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:10, color:'#4edea3' }}>auto_fix_high</span>
                  <span style={{ fontSize:'0.58rem', color:'#c7c4d8' }}>AI coaching live</span>
                </div>
              </div>
              )}
              <div style={{ position:'absolute', bottom:10, left:10, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)', padding:'0.25rem 0.65rem', borderRadius:7, fontSize:'0.68rem', fontWeight:700 }}>
                {myId} {sharing ? '(Screen)' : '(You)'}
              </div>
            </div>

            {/* Remote */}
            <div style={{ position:'relative', borderRadius:14, overflow:'hidden', background:'#131b2e', border:`1px solid ${videoConnected ? 'rgba(78,222,163,0.35)' : 'rgba(70,69,85,0.2)'}`, transition:'border-color 0.5s' }}>
              {/* Remote video — NOT muted so audio comes through */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                onClick={e => e.target.play()}
                style={{ width:'100%', height:'100%', objectFit:'cover', display: videoConnected ? 'block' : 'none' }}
              />
              {!videoConnected && (
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(11,19,38,0.9)', padding:'1rem' }}>
                  <div style={{ width:56, height:56, borderRadius:'50%', background: socketPeerPresent ? 'linear-gradient(135deg,#00a572,#4edea3)' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', fontWeight:700, color: socketPeerPresent ? '#003d29' : '#1d00a5', marginBottom:10 }}>{socketPeerPresent ? peerName[0]?.toUpperCase() : '?'}</div>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, color:'#c7c4d8', marginBottom:6 }}>{socketPeerPresent ? 'Connecting to video...' : 'Waiting for peer...'}</div>
                  <div style={{ fontSize:'0.68rem', color:'#c7c4d8', opacity:0.55, textAlign:'center', maxWidth:200, lineHeight:1.5 }}>{socketPeerPresent ? 'WebRTC handshake in progress...' : 'Share this link with the other participant:'}</div>
                  {!socketPeerPresent && (
                    <div
                      onClick={() => navigator.clipboard.writeText(window.location.href)}
                      style={{ marginTop:10, padding:'0.35rem 0.7rem', background:'#222a3d', borderRadius:7, fontSize:'0.65rem', color:'#c3c0ff', fontFamily:'monospace', wordBreak:'break-all', maxWidth:240, textAlign:'center', cursor:'pointer' }}
                      title="Click to copy"
                    >
                      {window.location.href}
                    </div>
                  )}
                </div>
              )}
              <div style={{ position:'absolute', top:10, left:10, display:'flex', alignItems:'center', gap:5, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', padding:'0.2rem 0.55rem', borderRadius:999 }}>
                <div style={{ display:'flex', alignItems:'flex-end', gap:1, height:10 }}>
                  {[5,9,11,7].map((h,i)=><div key={i} style={{ width:2, height:h, background: videoConnected && i<3 ? '#4edea3' : 'rgba(70,69,85,0.5)', borderRadius:1, transition:'background 0.5s' }} />)}
                </div>
                <span style={{ fontSize:'0.58rem', fontWeight:700, color:'#c7c4d8' }}>{videoConnected ? 'HD · Live' : 'No signal'}</span>
              </div>
              {socketPeerPresent && <div style={{ position:'absolute', bottom:10, left:10, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)', padding:'0.25rem 0.65rem', borderRadius:7, fontSize:'0.68rem', fontWeight:700 }}>{peerName}</div>}
            </div>
          </div>
        </div>

        {/* ── Side panel ── */}
        <div style={{ width:340, background:'#131b2e', borderLeft:'1px solid rgba(70,69,85,0.2)', display:'flex', flexDirection:'column', flexShrink:0 }}>
          {/* Panel tabs — AI and Chat only (no People tab) */}
          <div style={{ display:'flex', borderBottom:'1px solid rgba(70,69,85,0.2)', flexShrink:0 }}>
            {[['ai','auto_awesome','AI'],['chat','chat_bubble','Chat']].map(([tab,icon,label])=>(
              <button key={tab} onClick={()=>setSidePanel(tab)} style={{ flex:1, padding:'0.75rem 0.5rem', background: sidePanel===tab ? '#222a3d' : 'transparent', color: sidePanel===tab ? '#c3c0ff' : '#c7c4d8', border:'none', borderBottom: sidePanel===tab ? '2px solid #4f46e5' : '2px solid transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', transition:'all 0.2s', position:'relative' }}>
                <span className="material-symbols-outlined" style={{ fontSize:18 }}>{icon}</span>
                <span>{label}</span>
                {/* Unread badge on Chat tab */}
                {tab === 'chat' && unreadChat > 0 && (
                  <span style={{ position:'absolute', top:6, right:'calc(50% - 20px)', minWidth:16, height:16, borderRadius:999, background:'#ef4444', color:'#fff', fontSize:'0.5rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px', animation:'pulse 2s infinite' }}>{unreadChat > 9 ? '9+' : unreadChat}</span>
                )}
              </button>
            ))}
          </div>

          {/* AI Whisperer panel — all 7 agents */}
          {sidePanel === 'ai' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ padding:'0.875rem', borderBottom:'1px solid rgba(70,69,85,0.15)', flexShrink:0, display:'flex', flexDirection:'column', gap:'0.65rem', overflowY:'auto', maxHeight:340 }}>

                {/* Agent 6: Speech coaching tip */}
                {coachingTip && (
                  <div style={{ background:'rgba(78,222,163,0.07)', border:'1px solid rgba(78,222,163,0.2)', borderRadius:9, padding:'0.6rem 0.8rem', display:'flex', alignItems:'flex-start', gap:7 }}>
                    <span className="material-symbols-outlined" style={{ color:'#4edea3', fontSize:13, marginTop:1, flexShrink:0 }}>tips_and_updates</span>
                    <div>
                      <div style={{ fontSize:'0.55rem', fontWeight:700, color:'#4edea3', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:2 }}>Agent 6 · Speech Coach</div>
                      <span style={{ fontSize:'0.72rem', color:'#dae2fd', lineHeight:1.5 }}>{coachingTip}</span>
                    </div>
                  </div>
                )}

                {/* Agent 2: Socratic Whisperer */}
                <div style={{ background:'linear-gradient(135deg,rgba(79,70,229,0.18),rgba(11,19,38,0.85))', border:'1px solid rgba(79,70,229,0.35)', borderRadius:11, padding:'0.8rem' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <span className="material-symbols-outlined" style={{ color:'#c3c0ff', fontSize:12 }}>psychology_alt</span>
                      <span style={{ fontSize:'0.55rem', fontWeight:700, color:'#c3c0ff', textTransform:'uppercase', letterSpacing:'0.1em' }}>Agent 2 · Socratic Whisperer</span>
                    </div>
                    <button onClick={nextSuggestion} style={{ background:'none', border:'none', cursor:'pointer', color:'#c7c4d8', display:'flex' }}>
                      <span className="material-symbols-outlined" style={{ fontSize:13 }}>refresh</span>
                    </button>
                  </div>
                  <p style={{ fontSize:'0.75rem', color:'#dae2fd', lineHeight:1.55, fontWeight:500, marginBottom:7 }}>"{currentSuggestion}"</p>
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={triggerHint} style={{ background:'rgba(195,192,255,0.15)', color:'#c3c0ff', border:'none', borderRadius:6, padding:'0.25rem 0.65rem', fontSize:'0.58rem', fontWeight:700, textTransform:'uppercase', cursor:'pointer' }}>🎤 Send to AI</button>
                    <button onClick={nextSuggestion} style={{ background:'rgba(70,69,85,0.3)', color:'#c7c4d8', border:'none', borderRadius:6, padding:'0.25rem 0.65rem', fontSize:'0.58rem', fontWeight:700, cursor:'pointer' }}>Skip</button>
                  </div>
                </div>

                {/* Agent 7: Fact Checker */}
                <div style={{ background:'rgba(42,23,0,0.45)', border:'1px solid rgba(255,185,95,0.2)', borderRadius:9, padding:'0.7rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
                    <span className="material-symbols-outlined" style={{ color:'#ffb95f', fontSize:12 }}>verified_user</span>
                    <span style={{ fontSize:'0.55rem', fontWeight:700, color:'#ffb95f', textTransform:'uppercase', letterSpacing:'0.1em' }}>Agent 7 · Live Fact-Check</span>
                  </div>
                  {factChecks.slice(0,3).map((f,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:'0.65rem', color:'#c7c4d8', fontStyle:'italic', flex:1, marginRight:6 }}>{f.claim.slice(0,38)}{f.claim.length>38?'…':''}</span>
                      <span style={{ fontSize:'0.62rem', fontWeight:700, color: f.status==='confirmed' ? '#4edea3' : '#ffb4ab', flexShrink:0 }}>{f.status==='confirmed'?'✓':'⚠'} {f.pct}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:5, marginTop:6 }}>
                    <input value={factInput} onChange={e=>setFactInput(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter') triggerFactCheck(factInput); }}
                      placeholder="Type a claim to fact-check..."
                      style={{ flex:1, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,185,95,0.2)', borderRadius:6, padding:'0.28rem 0.5rem', color:'#dae2fd', fontSize:'0.65rem', outline:'none' }} />
                    <button onClick={()=>triggerFactCheck(factInput)} style={{ background:'rgba(255,185,95,0.15)', color:'#ffb95f', border:'none', borderRadius:6, padding:'0.28rem 0.6rem', fontSize:'0.58rem', fontWeight:700, cursor:'pointer' }}>Check</button>
                  </div>
                </div>

                {/* Agent 5: Peer Profile Summary */}
                {!profileSummary ? (
                  <button onClick={loadProfileSummary} style={{ width:'100%', padding:'0.45rem', background:'rgba(195,192,255,0.07)', border:'1px solid rgba(195,192,255,0.15)', borderRadius:8, color:'#c3c0ff', fontSize:'0.62rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', cursor:'pointer' }}>
                    🧠 Agent 5 · Load Peer Profile Summary
                  </button>
                ) : (
                  <div style={{ background:'rgba(23,31,51,0.8)', border:'1px solid rgba(195,192,255,0.15)', borderRadius:9, padding:'0.7rem' }}>
                    <div style={{ fontSize:'0.55rem', fontWeight:700, color:'#c3c0ff', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>Agent 5 · Peer Profile Summary</div>
                    <p style={{ fontSize:'0.7rem', color:'#c7c4d8', lineHeight:1.55, marginBottom:5 }}>{profileSummary.summary}</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginBottom:5 }}>
                      {profileSummary.top_skills?.map(s=>(
                        <span key={s} style={{ padding:'0.12rem 0.45rem', background:'rgba(78,222,163,0.1)', color:'#4edea3', fontSize:'0.58rem', borderRadius:999, fontWeight:600 }}>{s}</span>
                      ))}
                    </div>
                    <div style={{ fontSize:'0.62rem', color:'#ffb95f' }}>Focus: {profileSummary.interview_focus_areas?.[0]}</div>
                  </div>
                )}
              </div>

              {/* Live hints feed with category badges */}
              <div style={{ flex:1, overflowY:'auto', padding:'0.875rem', display:'flex', flexDirection:'column', gap:'0.55rem' }}>
                <div style={{ fontSize:'0.55rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(199,196,216,0.3)', marginBottom:2 }}>Live AI Feed</div>
                {hints.length === 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, color:'#c7c4d8', textAlign:'center', padding:'1.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:28, opacity:0.2, marginBottom:8 }}>hearing</span>
                    <p style={{ fontSize:'0.72rem', opacity:0.4, lineHeight:1.6 }}>All 7 AI agents active...<br/>Click "Send to AI" or type below.</p>
                  </div>
                ) : hints.map((h,i)=>{
                  const CAT_COLOR = { frontend:'#4edea3', backend:'#c3c0ff', database:'#ffb95f', 'system-design':'#c3c0ff', debugging:'#ffb4ab', 'soft-skills':'#4edea3', 'ai-ml':'#ffb95f', 'fact-check':'#ffb95f', general:'#c7c4d8' };
                  const bc = h.type==='fact-ok'?'#4edea3':h.type==='fact-warn'?'#ffb4ab':h.type==='system'?'#4edea3':'#c3c0ff';
                  const bg = h.type==='fact-ok'?'rgba(78,222,163,0.05)':h.type==='fact-warn'?'rgba(255,107,107,0.05)':h.type==='system'?'rgba(78,222,163,0.05)':'#171f33';
                  return (
                    <div key={i} style={{ background:bg, border:'1px solid rgba(70,69,85,0.2)', borderLeft:`3px solid ${bc}`, borderRadius:8, padding:'0.6rem 0.8rem', fontSize:'0.74rem', lineHeight:1.5, animation:'slideIn 0.3s ease' }}>
                      {h.category && h.category!=='general' && (
                        <span style={{ display:'inline-block', padding:'0.08rem 0.38rem', background:`${CAT_COLOR[h.category]||'#c7c4d8'}18`, color:CAT_COLOR[h.category]||'#c7c4d8', fontSize:'0.52rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', borderRadius:4, marginBottom:4 }}>{h.category}</span>
                      )}
                      <div>{h.text}</div>
                      <div style={{ fontSize:'0.58rem', color:'rgba(199,196,216,0.3)', marginTop:3 }}>{h.time}</div>
                    </div>
                  );
                })}
              </div>

              {/* Transcript input → Agent 2 */}
              <div style={{ padding:'0.7rem', borderTop:'1px solid rgba(70,69,85,0.2)', flexShrink:0 }}>
                <div style={{ position:'relative' }}>
                  <input value={aiInput} onChange={e=>setAiInput(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'){ sendTranscript(aiInput); setAiInput(''); } }}
                    placeholder="Type transcript → Agent 2 responds..."
                    style={{ width:'100%', background:'#222a3d', border:'1px solid rgba(70,69,85,0.3)', borderRadius:9, padding:'0.58rem 2.2rem 0.58rem 0.8rem', color:'#dae2fd', fontSize:'0.74rem', outline:'none', boxSizing:'border-box' }} />
                  <button onClick={()=>{ sendTranscript(aiInput); setAiInput(''); }} style={{ position:'absolute', right:7, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer' }}>
                    <span className="material-symbols-outlined" style={{ color:'#c3c0ff', fontSize:15 }}>send</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat panel */}
          {sidePanel === 'chat' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ flex:1, overflowY:'auto', padding:'0.875rem', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, color:'#c7c4d8', textAlign:'center', padding:'1.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:30, opacity:0.2, marginBottom:8 }}>chat_bubble</span>
                    <p style={{ fontSize:'0.75rem', opacity:0.45 }}>No messages yet</p>
                  </div>
                ) : chatMessages.map((m,i)=>(
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: m.from===myId ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize:'0.6rem', color:'#c7c4d8', marginBottom:3 }}>{m.from} · {m.time}</div>
                    <div style={{ background: m.from===myId ? 'rgba(79,70,229,0.25)' : '#222a3d', border:`1px solid ${m.from===myId ? 'rgba(195,192,255,0.2)' : 'rgba(70,69,85,0.2)'}`, borderRadius:10, padding:'0.5rem 0.75rem', fontSize:'0.8rem', maxWidth:'85%', lineHeight:1.5 }}>{m.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding:'0.75rem', borderTop:'1px solid rgba(70,69,85,0.2)', flexShrink:0 }}>
                <div style={{ position:'relative' }}>
                  <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter') sendChat(); }}
                    placeholder="Send a message..."
                    style={{ width:'100%', background:'#222a3d', border:'1px solid rgba(70,69,85,0.3)', borderRadius:9, padding:'0.6rem 2.2rem 0.6rem 0.8rem', color:'#dae2fd', fontSize:'0.76rem', outline:'none', boxSizing:'border-box' }} />
                  <button onClick={sendChat} style={{ position:'absolute', right:7, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer' }}>
                    <span className="material-symbols-outlined" style={{ color:'#c3c0ff', fontSize:15 }}>send</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Bottom controls ── */}
      <div style={{ height:72, background:'rgba(11,19,38,0.97)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', flexShrink:0 }}>
        {/* Timer */}
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div>
            <div style={{ fontSize:'0.52rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:'rgba(199,196,216,0.45)', marginBottom:1 }}>Elapsed</div>
            <div style={{ fontSize:'1.1rem', fontFamily:'monospace', fontWeight:700, color:'#c3c0ff' }}>{fmt(elapsed)}</div>
          </div>
          <div style={{ width:1, height:24, background:'rgba(255,255,255,0.07)' }} />
          <div>
            <div style={{ fontSize:'0.52rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:'rgba(199,196,216,0.45)', marginBottom:1 }}>Remaining</div>
            <div style={{ fontSize:'1.1rem', fontFamily:'monospace', fontWeight:700, color: remaining < 300 ? '#ffb4ab' : '#c7c4d8' }}>{fmt(remaining)}</div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {[
            { icon: micOn ? 'mic' : 'mic_off',                   action: toggleMic,         on: micOn,    title: micOn ? 'Mute' : 'Unmute' },
            { icon: camOn ? 'videocam' : 'videocam_off',          action: toggleCam,         on: camOn,    title: camOn ? 'Stop Video' : 'Start Video' },
            { icon: sharing ? 'stop_screen_share' : 'present_to_all', action: toggleScreenShare, on: !sharing, title: sharing ? 'Stop Sharing' : 'Share Screen', active: sharing },
            { icon: handRaised ? 'back_hand' : 'pan_tool',        action: toggleHand,        on: !handRaised, title: handRaised ? 'Lower Hand' : 'Raise Hand', active: handRaised },
          ].map((c,i)=>(
            <button key={i} onClick={c.action} title={c.title} style={{ width:40, height:40, borderRadius:'50%', background: c.active ? 'rgba(195,192,255,0.15)' : c.on ? '#222a3d' : 'rgba(255,107,107,0.12)', border:`1px solid ${c.active ? 'rgba(195,192,255,0.4)' : c.on ? 'rgba(255,255,255,0.06)' : 'rgba(255,107,107,0.25)'}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: c.active ? '#c3c0ff' : c.on ? '#dae2fd' : '#ffb4ab', transition:'all 0.2s' }}>
              <span className="material-symbols-outlined" style={{ fontSize:18 }}>{c.icon}</span>
            </button>
          ))}
          <div style={{ width:10 }} />
          <button onClick={endSession} style={{ display:'flex', alignItems:'center', gap:6, padding:'0 1.1rem', height:40, borderRadius:999, background:'#ffb4ab', color:'#690005', border:'none', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', boxShadow:'0 4px 14px rgba(255,107,107,0.22)' }}>
            <span className="material-symbols-outlined" style={{ fontSize:16 }}>call_end</span>End Session
          </button>
        </div>

        {/* Participants avatars */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex' }}>
            {[myId[0]||'Y', peerName[0]||'?', 'AI'].map((l,i)=>(
              <div key={i} style={{ width:32, height:32, borderRadius:'50%', background: i===2 ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : i===1&&videoConnected ? 'linear-gradient(135deg,#00a572,#4edea3)' : (i===1&&socketPeerPresent ? '#222a3d' : '#222a3d'), border:'2px solid #0b1326', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:700, color: i===2 ? '#1d00a5' : '#c3c0ff', marginLeft: i>0 ? -7 : 0, opacity: i===1&&!socketPeerPresent ? 0.35 : 1, transition:'all 0.3s' }}>{l.toUpperCase()}</div>
            ))}
          </div>
          <span style={{ fontSize:'0.7rem', color:'#c7c4d8' }}>{videoConnected ? '3 active' : (socketPeerPresent ? 'Connecting...' : 'Peer offline')}</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(78,222,163,0.4)} 50%{opacity:0.7;box-shadow:0 0 0 6px rgba(78,222,163,0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>
    </div>
  );
}
