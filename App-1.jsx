
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const App = () => {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('human');
  const navigate = useNavigate();

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    await supabase.from('users').insert([{ email, type: userType }]);
    navigate('/dashboard');
  };

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    navigate('/dashboard');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
    navigate('/login');
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user?.email) {
        const { data, error } = await supabase
          .from('users')
          .select('type')
          .eq('email', session.user.email)
          .single();
        if (!error) setRole(data?.type);
      }
    };

    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const PrivateRoute = ({ children }) => {
    return session ? children : <Navigate to="/login" />;
  };

  const LoginForm = () => (
    <div className="auth-container">
      <h2>Login</h2>
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={signIn}>Log In</button>
    </div>
  );

  const SignupForm = () => (
    <div className="auth-container">
      <h2>Sign Up</h2>
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <select onChange={(e) => setUserType(e.target.value)}>
        <option value="human">Human</option>
        <option value="agent">Agent</option>
      </select>
      <button onClick={signUp}>Sign Up</button>
    </div>
  );

  const Dashboard = () => (
    <div className="dashboard-container">
      <h2>Welcome, {role}</h2>
      {role === 'human' ? <p>This is the human dashboard.</p> : <p>This is the agent dashboard.</p>}
      <button onClick={signOut}>Logout</button>
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

const RootApp = () => (
  <Router>
    <App />
  </Router>
);

export default RootApp;
