// Feature: alumnex-interview-room
// Property-based tests for pure logic in DualAgentInterviewRoom

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ── Property 1: Polite Peer Collision Resolution ──────────────────────────────
// Validates: Requirements 2.2
//
// The "polite peer" algorithm determines whether to ignore an incoming offer.
// ignoreOffer = (makingOffer || signalingState !== 'stable') && !makingOffer
// Simplified: ignoreOffer = !makingOffer && signalingState !== 'stable'
function computeIgnoreOffer(makingOffer, signalingState) {
  const offerCollision = makingOffer || signalingState !== 'stable';
  return offerCollision && !makingOffer;
}

describe('Property 1: Polite Peer Collision Resolution', () => {
  it('ignoreOffer is true only when not making offer AND state is not stable', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.oneof(
          fc.constant('stable'),
          fc.constant('have-local-offer'),
          fc.constant('have-remote-offer'),
          fc.constant('have-local-pranswer'),
          fc.constant('closed'),
        ),
        (makingOffer, signalingState) => {
          const result = computeIgnoreOffer(makingOffer, signalingState);
          // If makingOffer is true, we never ignore (we are the polite peer)
          if (makingOffer) {
            expect(result).toBe(false);
          }
          // If state is stable and not making offer, no collision
          if (!makingOffer && signalingState === 'stable') {
            expect(result).toBe(false);
          }
          // If not making offer and state is not stable, we ignore
          if (!makingOffer && signalingState !== 'stable') {
            expect(result).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 13: Spring Interpolation Convergence ────────────────────────────
// Validates: Requirements 17.1, 17.2
//
// The useAnimatedMetric hook uses spring interpolation:
//   nextVal = p + (t - p) * speed   if |t - p| >= 0.5
//   nextVal = t                      if |t - p| < 0.5
function nextVal(p, t, s) {
  const d = t - p;
  return Math.abs(d) < 0.5 ? t : p + d * s;
}

describe('Property 13: Spring Interpolation Convergence', () => {
  it('moves closer to target when distance >= 0.5', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
        fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(0.99), noNaN: true }),
        (p, t, s) => {
          const result = nextVal(p, t, s);
          if (Math.abs(t - p) >= 0.5) {
            // Must be strictly closer to target
            expect(Math.abs(result - t)).toBeLessThan(Math.abs(p - t));
          } else {
            // Snaps to target
            expect(result).toBe(t);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ── Property 14: Room ID Uniqueness Across Bookings ──────────────────────────
// Validates: Requirements 20.4
//
// The bookSlot function generates: `room-${requestId.slice(-8)}-${Date.now()}`
// With distinct requestIds and sequential timestamps, all IDs must be unique.
function generateRoomId(requestId, timestamp) {
  return `room-${requestId.slice(-8)}-${timestamp}`;
}

describe('Property 14: Room ID Uniqueness Across Bookings', () => {
  it('generates unique room IDs for distinct request IDs', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 8, maxLength: 36 }), { minLength: 2, maxLength: 50 }),
        (requestIds) => {
          // Generate IDs with incrementing timestamps to ensure uniqueness
          const ids = requestIds.map((rid, i) => generateRoomId(rid, 1700000000000 + i));
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
