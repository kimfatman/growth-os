import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col justify-center px-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="mb-8">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>Growth OS</h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 8 }}>登录你的AI销售增长系统</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div
            className="text-sm px-3 py-2 rounded-lg mb-4"
            style={{ background: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d' }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="输入邮箱地址"
            required
            className="w-full rounded-xl px-4"
            style={{
              height: 48, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', fontSize: 15, outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            required
            className="w-full rounded-xl px-4"
            style={{
              height: 48, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', fontSize: 15, outline: 'none',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 text-base font-medium disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#ffffff', height: 48 }}
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <div className="text-center mt-6">
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>还没有账号？</span>
        <Link
          to="/register"
          style={{ fontSize: 13, color: 'var(--accent-light)', marginLeft: 4, textDecoration: 'none' }}
        >
          立即注册
        </Link>
      </div>
    </div>
  );
}
