import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name);
      navigate('/');
    } catch (err) {
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col justify-center px-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="mb-8">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>创建账号</h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 8 }}>开启你的AI销售增长之旅</p>
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
          <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>姓名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入姓名"
            required
            className="w-full rounded-xl px-4"
            style={{
              height: 48, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', fontSize: 15, outline: 'none',
            }}
          />
        </div>

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
            placeholder="至少6位密码"
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
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      <div className="text-center mt-6">
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>已有账号？</span>
        <Link
          to="/login"
          style={{ fontSize: 13, color: 'var(--accent-light)', marginLeft: 4, textDecoration: 'none' }}
        >
          立即登录
        </Link>
      </div>
    </div>
  );
}
