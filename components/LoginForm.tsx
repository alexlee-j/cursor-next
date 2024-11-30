import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SliderCaptcha from './SliderCaptcha';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSlider, setShowSlider] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const initializeSliderVerification = async () => {
    try {
      const response = await fetch('/api/auth/verify-slider', {
        method: 'POST',
      });
      const data = await response.json();
      setVerificationToken(data.token);
      setShowSlider(true);
    } catch (error) {
      console.error('Failed to initialize slider verification:', error);
      setError('验证初始化失败，请重试');
    }
  };

  const handleSliderSuccess = async () => {
    try {
      await fetch('/api/auth/verify-slider', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });
      handleLogin();
    } catch (error) {
      console.error('Slider verification failed:', error);
      setError('验证失败，请重试');
      setShowSlider(false);
    }
  };

  const handleSliderFail = () => {
    setError('验证失败，请重试');
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          verificationToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requireSlider) {
          await initializeSliderVerification();
        } else {
          setError(data.error || '登录失败');
        }
        return;
      }

      // 登录成功
      if (onSuccess) {
        onSuccess();
      }
      router.push('/dashboard'); // 或其他成功后的跳转页面
    } catch (error) {
      console.error('Login error:', error);
      setError('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showSlider) {
      return;
    }
    handleLogin();
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            邮箱
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            密码
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        {showSlider && (
          <div className="my-4">
            <SliderCaptcha
              onSuccess={handleSliderSuccess}
              onFail={handleSliderFail}
            />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading || showSlider}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            (isLoading || showSlider) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
