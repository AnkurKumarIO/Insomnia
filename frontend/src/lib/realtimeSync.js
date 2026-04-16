const CHANNEL_NAME = 'alumnex-realtime-sync';
const EVENT_NAME = 'alumnex:sync';

let channel = null;

function getChannel() {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function emitRealtimeSync(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
  }
  const bc = getChannel();
  if (bc) bc.postMessage(detail);
}

export function subscribeRealtimeSync(callback) {
  if (typeof window === 'undefined') return () => {};

  const onWindowEvent = (event) => callback(event.detail || {});
  const onStorage = (event) => callback({ type: 'storage', key: event.key });
  window.addEventListener(EVENT_NAME, onWindowEvent);
  window.addEventListener('storage', onStorage);

  const bc = getChannel();
  const onMessage = (event) => callback(event.data || {});
  if (bc) bc.addEventListener('message', onMessage);

  return () => {
    window.removeEventListener(EVENT_NAME, onWindowEvent);
    window.removeEventListener('storage', onStorage);
    if (bc) bc.removeEventListener('message', onMessage);
  };
}
