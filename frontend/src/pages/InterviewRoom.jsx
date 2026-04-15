import React from 'react';
import DualAgentInterviewRoom from '../DualAgentInterviewRoom';

// No auth guard — anyone with the room link can join as a guest
export default function InterviewRoom() {
  return <DualAgentInterviewRoom />;
}
