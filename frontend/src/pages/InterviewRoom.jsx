import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DualAgentInterviewRoom from '../DualAgentInterviewRoom';

export default function InterviewRoom() {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/" replace />;
  return <DualAgentInterviewRoom />;
}
