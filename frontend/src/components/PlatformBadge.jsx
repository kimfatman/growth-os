const PLATFORMS = {
  xiaohongshu: { label: '小红书', icon: '📕', color: 'bg-red-500' },
  douyin: { label: '抖音', icon: '🎵', color: 'bg-cyan-500' },
  wechat_video: { label: '视频号', icon: '📺', color: 'bg-green-500' },
  wechat_article: { label: '公众号', icon: '📰', color: 'bg-emerald-500' },
  kuaishou: { label: '快手', icon: '⚡', color: 'bg-orange-500' },
  bilibili: { label: 'B站', icon: '📺', color: 'bg-pink-500' },
};

export default function PlatformBadge({ platform, className = '' }) {
  const p = PLATFORMS[platform] || { label: platform, icon: '🌐', color: 'bg-gray-500' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 ${className}`}>
      <span className="text-sm">{p.icon}</span>
      <span>{p.label}</span>
    </span>
  );
}
