import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Login() {
  const login = useStore((s) => s.login);
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    login({ name: name.trim(), role: '管理员' });
  }

  return (
    <div className="h-full flex items-center justify-center" style={{ background: '#0B0F1A' }}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm px-6">
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#1F6FEB' }}>
            <TrendingUp size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#E2E8F0' }}>Growth OS</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>AI 增长销售系统</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-2" style={{ color: '#94A3B8' }}>输入名称开始使用</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的名称"
            className="w-full rounded-xl px-4"
            style={{
              height: 48, background: '#121826', border: '1px solid #1E293B',
              color: '#E2E8F0', fontSize: 15,
            }}
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full rounded-xl py-3 text-sm font-medium disabled:opacity-50"
          style={{ background: '#1F6FEB', color: '#FFFFFF' }}
        >
          进入系统
        </button>
      </form>
    </div>
  );
}
