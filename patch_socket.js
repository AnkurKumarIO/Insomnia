const fs = require('fs');
const file = 'frontend/src/DualAgentInterviewRoom.jsx';
let text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// Fix socket connection — add error handling and better reconnection
const OLD = `      // 4. Connect socket — allow polling fallback for restrictive hosts (Render, Railway etc.)
      socket = io(\`\${SOCKET_URL}/interview\`, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Socket] Connected as', myId);
        setIsConnected(true);
        socket.emit('join-room', roomId, myId);
      });

      socket.on('disconnect', () => setIsConnected(false));`;

const NEW = `      // 4. Connect socket — allow polling fallback for restrictive hosts (Render, Railway etc.)
      socket = io(\`\${SOCKET_URL}/interview\`, {
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
          text: \`⚠ Cannot reach backend at \${SOCKET_URL}. Make sure the backend server is running and VITE_SOCKET_URL is set to the deployed backend URL.\`,
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
        // Auto-reconnect on transport close
        if (reason === 'io server disconnect') socket.connect();
      });`;

if (text.includes(OLD)) {
  text = text.replace(OLD, NEW);
  fs.writeFileSync(file, text, 'utf8');
  console.log('Socket connection patched');
} else {
  console.log('Pattern not found');
  const idx = text.indexOf('Connect socket');
  console.log('Found at:', idx);
}
