import { useState, useCallback, useEffect } from 'react';
import {
  Brain, Sparkles, MessageSquare, Lightbulb,
  ShoppingBag, Send, Copy, Check, Loader2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { PageHeader, EmptyState, StatusBadge } from '../components';

const CAPABILITY_CARDS = [
  { id: 'content', title: '内容生成', desc: 'AI驱动的营销文案与内容创作', icon: Sparkles },
  { id: 'sales', title: '销售建议', desc: '基于数据的销售策略与跟进建议', icon: Lightbulb },
  { id: 'product', title: '产品推荐', desc: '智能匹配最佳产品组合方案', icon: ShoppingBag },
  { id: 'script', title: '话术生成', desc: '销售场景话术与沟通模板', icon: MessageSquare },
];

const PLATFORMS = [
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'douyin', label: '抖音' },
  { value: 'wechat_article', label: '微信公众号' },
  { value: 'wechat_video', label: '微信视频号' },
  { value: 'bilibili', label: 'B站' },
  { value: 'kuaishou', label: '快手' },
];

const SCENARIOS = [
  { value: 'cold_call', label: '电话邀约' },
  { value: 'follow_up', label: '跟进攻坚' },
  { value: 'negotiation', label: '价格谈判' },
  { value: 'closing', label: '成交促成' },
];

const AICenter = () => {
  const {
    customers, leads, products, generateAIContent, analyzeCustomer,
    recommendProducts: storeRecommend, generateScript, loadCustomers,
    loadLeads, loadProducts,
  } = useStore();

  const [activeTab, setActiveTab] = useState('content');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  // Panel states
  const [platform, setPlatform] = useState('xiaohongshu');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [salesResult, setSalesResult] = useState(null);

  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [productResults, setProductResults] = useState([]);

  const [scenario, setScenario] = useState('cold_call');
  const [scriptContext, setScriptContext] = useState('');
  const [scriptResult, setScriptResult] = useState(null);

  useEffect(() => {
    if (customers.length === 0) loadCustomers();
    if (leads.length === 0) loadLeads();
    if (products.length === 0) loadProducts();
  }, []);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateContent = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    const res = await generateAIContent({ platform, topic, style: 'professional' });
    if (res) {
      const text = `【${res.title || topic}】\n\n${res.content || ''}\n\n${(res.hashtags || []).map(t => '#' + t).join(' ')}${res.tips ? '\n\n💡 ' + res.tips : ''}`;
      setResult(text);
    }
    setLoading(false);
  };

  const handleAnalyzeCustomer = async () => {
    if (!selectedCustomerId && customers.length === 0) return;
    setLoading(true);
    const cid = selectedCustomerId || customers[0]?.id;
    if (!cid) { setLoading(false); return; }
    const res = await analyzeCustomer({ customerId: cid });
    if (res) setSalesResult(res);
    setLoading(false);
  };

  const handleRecommendProducts = async () => {
    setLoading(true);
    const leadId = selectedLeadId || leads[0]?.id;
    if (leadId) {
      const res = await storeRecommend({ leadId });
      if (res?.recommendations) setProductResults(res.recommendations);
    }
    setLoading(false);
  };

  const handleGenerateScript = async () => {
    setLoading(true);
    const res = await generateScript({ scenario, context: { note: scriptContext } });
    if (res) setScriptResult(res);
    setLoading(false);
  };

  const CopyBtn = ({ text }) => (
    <button
      onClick={() => handleCopy(text)}
      className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 text-xs border border-border rounded-md text-text-muted hover:bg-card-hover hover:text-text transition-colors cursor-pointer bg-bg/80"
    >
      {copied ? <><Check size={14} className="text-success" />已复制</> : <><Copy size={14} />复制</>}
    </button>
  );

  return (
    <div className="min-h-screen bg-bg text-text p-6">
      <PageHeader
        icon={<Brain size={28} className="text-primary" />}
        title="AI中心"
        subtitle="智能分析与决策支持"
      />

      {/* Capability Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {CAPABILITY_CARDS.map(card => {
          const Icon = card.icon;
          const isActive = activeTab === card.id;
          return (
            <button
              key={card.id}
              onClick={() => setActiveTab(card.id)}
              className={`flex flex-col items-center gap-3 p-5 rounded-xl border cursor-pointer transition-all text-center
                ${isActive
                  ? 'bg-card border-primary shadow-[0_0_20px_rgba(31,111,235,0.15)]'
                  : 'bg-card border-border opacity-75 hover:opacity-90 hover:border-white/20'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/15' : 'bg-white/5'}`}>
                <Icon size={22} className={isActive ? 'text-primary' : 'text-text-secondary'} />
              </div>
              <p className="text-sm font-semibold">{card.title}</p>
              <p className="text-xs text-text-muted leading-relaxed">{card.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="bg-card border border-border rounded-xl p-6">
        {/* === Content Generation === */}
        {activeTab === 'content' && (
          <>
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <Sparkles size={22} className="text-purple-400" />AI 内容生成
            </h2>
            <label className="block text-sm font-medium text-text-secondary mb-2">选择平台</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg text-text px-4 py-2.5 mb-4 text-sm cursor-pointer focus:border-primary"
            >
              {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>

            <label className="block text-sm font-medium text-text-secondary mb-2">输入主题或关键词</label>
            <textarea
              className="w-full bg-bg border border-border rounded-lg text-text px-4 py-3 mb-4 text-sm resize-y min-h-[100px] focus:border-primary"
              placeholder="请输入内容主题，例如：新产品上线推广文案、品牌故事..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />

            <button
              onClick={handleGenerateContent}
              disabled={loading || !topic.trim()}
              className="inline-flex items-center gap-2 bg-primary text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              生成内容
            </button>

            {result && (
              <div className="relative bg-bg border border-border rounded-lg p-4 mt-4">
                <CopyBtn text={result} />
                <pre className="text-sm text-text leading-relaxed whitespace-pre-wrap font-sans">{result}</pre>
              </div>
            )}
          </>
        )}

        {/* === Sales Suggestions === */}
        {activeTab === 'sales' && (
          <>
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <Lightbulb size={22} className="text-yellow-400" />AI 销售建议
            </h2>
            <label className="block text-sm font-medium text-text-secondary mb-2">选择客户</label>
            <select
              value={selectedCustomerId || ''}
              onChange={e => setSelectedCustomerId(Number(e.target.value))}
              className="w-full bg-bg border border-border rounded-lg text-text px-4 py-2.5 mb-4 text-sm cursor-pointer focus:border-primary"
            >
              <option value="">-- 选择客户 --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.company} — {c.status}</option>
              ))}
            </select>

            <button
              onClick={handleAnalyzeCustomer}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-primary text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
              分析客户
            </button>

            {salesResult && (
              <div className="relative bg-bg border border-border rounded-lg p-4 mt-4">
                <CopyBtn text={JSON.stringify(salesResult, null, 2)} />
                <div className="space-y-3">
                  <p className="text-sm text-text">{salesResult.analysis}</p>
                  <div>
                    <p className="text-xs text-text-muted mb-1">风险等级</p>
                    <StatusBadge status={salesResult.riskLevel === '高' ? 'high' : salesResult.riskLevel === '中' ? 'medium' : 'low'} />
                  </div>
                  <p className="text-sm"><span className="text-text-muted">下一步行动：</span>{salesResult.nextAction}</p>
                  <p className="text-sm"><span className="text-text-muted">建议方式：</span>{salesResult.recommendedApproach}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* === Product Recommendation === */}
        {activeTab === 'product' && (
          <>
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <ShoppingBag size={22} className="text-green-400" />AI 产品推荐
            </h2>
            <label className="block text-sm font-medium text-text-secondary mb-2">选择线索</label>
            <select
              value={selectedLeadId || ''}
              onChange={e => setSelectedLeadId(Number(e.target.value))}
              className="w-full bg-bg border border-border rounded-lg text-text px-4 py-2.5 mb-4 text-sm cursor-pointer focus:border-primary"
            >
              <option value="">-- 选择线索 --</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.name} — {l.platform} — {l.intent}</option>
              ))}
            </select>

            <button
              onClick={handleRecommendProducts}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-primary text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
              推荐产品
            </button>

            {productResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {productResults.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-bg border border-border rounded-lg p-4">
                    <div>
                      <p className="text-sm font-semibold">{p.productName}</p>
                      <p className="text-xs text-text-muted mt-1">{p.reason}</p>
                    </div>
                    <span className="text-xs font-medium bg-primary/15 text-primary px-2.5 py-1 rounded">匹配 {p.score}%</span>
                  </div>
                ))}
              </div>
            )}

            {productResults.length === 0 && !loading && (
              <EmptyState icon="🛍️" title="选择线索后点击推荐" description="AI 将根据线索特征匹配最佳产品" />
            )}
          </>
        )}

        {/* === Script Generation === */}
        {activeTab === 'script' && (
          <>
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <MessageSquare size={22} className="text-blue-400" />AI 话术生成
            </h2>
            <label className="block text-sm font-medium text-text-secondary mb-2">选择场景</label>
            <select
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg text-text px-4 py-2.5 mb-4 text-sm cursor-pointer focus:border-primary"
            >
              {SCENARIOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            <label className="block text-sm font-medium text-text-secondary mb-2">客户背景描述（选填）</label>
            <textarea
              className="w-full bg-bg border border-border rounded-lg text-text px-4 py-3 mb-4 text-sm resize-y min-h-[80px] focus:border-primary"
              placeholder="如：客户为科技公司CEO，已进行2次产品演示，对价格较为敏感..."
              value={scriptContext}
              onChange={e => setScriptContext(e.target.value)}
            />

            <button
              onClick={handleGenerateScript}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-primary text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
              生成话术
            </button>

            {scriptResult && (
              <div className="relative bg-bg border border-border rounded-lg p-4 mt-4">
                <CopyBtn text={JSON.stringify(scriptResult, null, 2)} />
                <div className="space-y-3">
                  <div><p className="text-xs text-text-muted mb-1">开场白</p><p className="text-sm">{scriptResult.opening}</p></div>
                  <div><p className="text-xs text-text-muted mb-1">价值陈述</p><p className="text-sm">{scriptResult.valueProposition}</p></div>
                  <div><p className="text-xs text-text-muted mb-1">异议处理</p><p className="text-sm">{scriptResult.objectionHandling}</p></div>
                  <div><p className="text-xs text-text-muted mb-1">成交话术</p><p className="text-sm">{scriptResult.closing}</p></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AICenter;
