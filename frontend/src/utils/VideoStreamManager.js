/**
 * Video stream utilities for WebRTC rooms
 * Handles media configuration, error recovery, and quality management
 */

const MEDIA_CONSTRAINTS = {
  // High quality with fallback options
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: 'user',
    aspectRatio: { ideal: 16 / 9 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100,
    channelCount: 1,
  },
};

// Fallback constraints for lower-end devices
const FALLBACK_CONSTRAINTS = {
  video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } },
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
};

const SCREEN_CONSTRAINTS = {
  video: {
    cursor: 'always', // Show cursor on shared screen
    displaySurface: 'monitor', // Prefer monitor over window
    logicalSurface: true,
  },
  audio: false,
};

export class VideoStreamManager {
  constructor() {
    this.localStream = null;
    this.screenStream = null;
    this.qualityLevel = 'high'; // 'high', 'medium', 'low'
  }

  async getCameraStream(attemptHighQuality = true) {
    try {
      if (this.localStream) {
        return this.localStream;
      }

      console.log('[Video] Requesting camera stream (quality:', attemptHighQuality ? 'high' : 'fallback', ')');
      
      const constraints = attemptHighQuality ? MEDIA_CONSTRAINTS : FALLBACK_CONSTRAINTS;
      
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        this.qualityLevel = 'high';
        console.log('[Video] High-quality camera stream obtained');
        return this.localStream;
      } catch (highQualityErr) {
        console.warn('[Video] High-quality constraints failed, trying fallback:', highQualityErr.message);
        
        // Fallback to basic constraints
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia(FALLBACK_CONSTRAINTS);
          this.qualityLevel = 'medium';
          console.log('[Video] Fallback camera stream obtained');
          return this.localStream;
        } catch (fallbackErr) {
          console.warn('[Video] Fallback failed, trying minimal:', fallbackErr.message);
          
          // Final fallback: minimal constraints
          this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          this.qualityLevel = 'low';
          console.log('[Video] Minimal camera stream obtained');
          return this.localStream;
        }
      }
    } catch (err) {
      console.error('[Video] Failed to get camera stream:', err.message, err.name);
      
      // Provide user-friendly error messages
      if (err.name === 'NotAllowedError') {
        throw new Error('Camera/Microphone access was denied. Please check your browser permissions.');
      } else if (err.name === 'NotFoundError') {
        throw new Error('No camera or microphone found. Please connect a device.');
      } else if (err.name === 'NotReadableError') {
        throw new Error('Camera/Microphone is already in use by another application.');
      } else {
        throw new Error(`Failed to access camera: ${err.message}`);
      }
    }
  }

  async getScreenShare() {
    try {
      console.log('[Video] Requesting screen share');
      
      this.screenStream = await navigator.mediaDevices.getDisplayMedia(SCREEN_CONSTRAINTS);
      console.log('[Video] Screen share stream obtained');
      
      // Listen for stream end (user pressed stop in browser UI)
      const videoTrack = this.screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          console.log('[Video] Screen share stopped by user');
          this.screenStream = null;
        });
      }
      
      return this.screenStream;
    } catch (err) {
      console.error('[Video] Failed to share screen:', err.message, err.name);
      
      if (err.name === 'NotAllowedError') {
        throw new Error('Screen sharing was cancelled. Please try again.');
      } else if (err.name === 'NotImplementedError') {
        throw new Error('Screen sharing is not supported in your browser.');
      } else {
        throw new Error(`Failed to share screen: ${err.message}`);
      }
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        console.log('[Video] Stopping track:', track.kind);
        track.stop();
      });
      this.screenStream = null;
    }
  }

  stopCamera() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        console.log('[Video] Stopping track:', track.kind);
        track.stop();
      });
      this.localStream = null;
    }
  }

  stopAllStreams() {
    this.stopCamera();
    this.stopScreenShare();
  }

  // Toggle microphone without stopping stream
  setMicrophoneEnabled(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
        console.log('[Video] Microphone:', enabled ? 'enabled' : 'disabled');
      });
    }
  }

  // Toggle camera without stopping stream
  setCameraEnabled(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
        console.log('[Video] Camera:', enabled ? 'enabled' : 'disabled');
      });
    }
  }

  // Get current stream quality info
  getQualityInfo() {
    return {
      level: this.qualityLevel,
      hasCameraStream: !!this.localStream,
      hasScreenShare: !!this.screenStream,
      videotracking: this.localStream?.getVideoTracks().length || 0,
      audioTracks: this.localStream?.getAudioTracks().length || 0,
    };
  }

  // Better camera/mic check with actual device enumeration
  async checkDeviceAvailability() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(d => d.kind === 'videoinput');
      const hasMicrophone = devices.some(d => d.kind === 'audioinput');
      
      console.log('[Video] Device availability:', { camera: hasCamera, microphone: hasMicrophone });
      
      return { camera: hasCamera, microphone: hasMicrophone };
    } catch (err) {
      console.warn('[Video] Failed to check device availability:', err.message);
      return { camera: false, microphone: false };
    }
  }

  // Basic face detection using luminance variance
  async detectFace(videoElement, canvasElement) {
    try {
      if (!videoElement || !canvasElement) return false;
      
      const ctx = canvasElement.getContext('2d');
      canvasElement.width = 64;
      canvasElement.height = 48;
      ctx.drawImage(videoElement, 0, 0, 64, 48);
      
      const imageData = ctx.getImageData(0, 0, 64, 48);
      const data = imageData.data;
      
      const luminances = [];
      for (let i = 0; i < data.length; i += 4) {
        luminances.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      }
      
      const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;
      const variance = luminances.reduce((a, b) => a + (b - mean) ** 2, 0) / luminances.length;
      
      // Variance > 200 indicates likely face presence (content, not blank)
      const faceDetected = variance > 200;
      console.log('[Video] Face detection:', { variance: Math.round(variance), detected: faceDetected });
      
      return faceDetected;
    } catch (err) {
      console.warn('[Video] Face detection error:', err.message);
      return true; // Don't block on detection failure
    }
  }
}

export default VideoStreamManager;
