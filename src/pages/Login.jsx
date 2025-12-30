import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login: setAuthUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const accessToken = tokenResponse.access_token;

        // AUTHENTICATE WITH BACKEND
        const backendResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: accessToken }),
        });

        if (!backendResponse.ok) {
          const errorData = await backendResponse.json().catch(() => ({}));
          console.error('Backend Auth Failed:', backendResponse.status, backendResponse.statusText, errorData);
          throw new Error(errorData.msg || 'Backend authentication failed');
        }

        const user = await backendResponse.json();

        // Save user to context (include accessToken for future API calls)
        setAuthUser({
          ...user,
          accessToken: accessToken
        });

        toast.success(`Welcome back, ${user.name}!`);
        navigate('/');
      } catch (error) {
        console.error('Login Error:', error);
        toast.error('Authentication failed. Please try again.');
        setAuthUser(null);
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      toast.error('Sign in failed. Please try again.');
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen w-full bg-[#191919] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />

      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center">

        {/* Logo/Icon */}
        <div className="mb-8 p-4 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 shadow-lg shadow-purple-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2 font-sans tracking-tight">
          Welcome Back
        </h1>
        <p className="text-gray-400 mb-10 text-center text-sm">
          Sign in to access your snippets and folders
        </p>

        {/* Custom Google Button */}
        <div
          onClick={() => !loading && login()}
          className={`group relative flex items-center justify-center w-full px-6 py-3.5 
            bg-white hover:bg-gray-50 active:bg-gray-100
             text-gray-700 font-medium rounded-xl transition-all duration-200 
            cursor-pointer select-none shadow-lg shadow-black/20 overflow-hidden
            ${loading ? 'opacity-70 pointer-events-none' : ''}`}
        >
          {/* Loading State Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}

          <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/50 transition-colors duration-200" />

          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-6 h-6 mr-3 z-10"
          />
          <span className="z-10 font-roboto">Continue with Google</span>
        </div>

        <div className="mt-8 text-xs text-gray-500 text-center">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
};

export default Login;
