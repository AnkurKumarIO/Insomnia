// Alumni "Login" page now redirects to the full registration/create-account flow
import { Navigate } from 'react-router-dom';
export default function AlumniLogin() {
  return <Navigate to="/alumni/register" replace />;
}
