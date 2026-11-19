import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, autoLogin } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    } else {
      void autoLogin().finally(() => {
        navigate('/', { replace: true });
      });
    }
  }, [isAuthenticated, autoLogin, navigate]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#ffffff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', borderRadius: '50%', border: '4px solid #38bdf8', borderRightColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '12px', fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Entering KFab Invoicing...</p>
      </div>
    </div>
  );
}
