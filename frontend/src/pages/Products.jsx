import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { Package, Search, Plus, Upload, DollarSign, Clock, TrendingUp, Tag, X } from 'lucide-react';
import { useStore } from '../store/useStore';

const THEME = {
  bg: '#0B0F1A',
  card: '#121826',
  border: '#1E293B',
  primary: '#1F6FEB',
  text: '#E2E8F0',
  secondary: '#94A3B8',
  muted: '#64748B',
};

const CATEGORIES = [
  '全部',
  '咨询服务',
  '营销推广',
  '技术开发',
  '培训课程',
  '设计创意',
  '数据分析',
  '运营服务',
];

export default function Products() {
  const { products, addProduct, importProducts, loadProducts } = useStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    service_content: '',
    target_customer: '',
    duration: '',
    profit_margin: '',
  });

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      activeCategory === '全部' || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const totalProducts = products.length;
  const avgPrice =
    products.length > 0
      ? products.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / products.length
      : 0;
  const highestProfitProduct = products.reduce((best, p) => {
    const margin = Number(p.profit_margin) || 0;
    return margin > (Number(best.profit_margin) || 0) ? p : best;
  }, products[0] || null);

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
      const values = [];
      let current = '', inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      values.push(current.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (values[i] || '').replace(/^"|"$/g, ''); });
      return obj;
    });
  }

  function handleImportClick() { fileInputRef.current?.click(); }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { alert('未检测到有效数据行'); setImporting(false); return; }
      const mapped = rows.map(r => ({
        name: r.name || r['产品名称'] || r['名称'] || '',
        price: Number(r.price || r['价格'] || r['单价'] || 0),
        category: r.category || r['类别'] || r['分类'] || '',
        description: r.description || r['描述'] || r['说明'] || '',
        service_content: r.service_content || r['服务内容'] || '',
        target_customer: r.target_customer || r['目标客户'] || '',
        duration: r.duration || r['周期'] || r['服务周期'] || '',
        profit_margin: Number(r.profit_margin || r['利润率'] || r['毛利'] || 0),
      })).filter(r => r.name);
      if (mapped.length === 0) { alert('未找到有效产品名称列'); setImporting(false); return; }
      await importProducts(mapped);
      alert(`成功导入 ${mapped.length} 个产品`);
    } catch (err) {
      console.error('Import error:', err);
      alert('导入失败，请检查文件格式');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  function openNew() {
    setForm({
      name: '',
      price: '',
      category: '',
      description: '',
      service_content: '',
      target_customer: '',
      duration: '',
      profit_margin: '',
    });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.price) return;
    setSubmitting(true);
    try {
      addProduct({
        name: form.name,
        price: Number(form.price),
        category: form.category,
        description: form.description,
        service_content: form.service_content,
        target_customer: form.target_customer,
        duration: form.duration,
        profit_margin: form.profit_margin ? Number(form.profit_margin) : 0,
      });
      setShowModal(false);
    } catch (err) {
      console.error('Add product error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Package size={22} color={THEME.primary} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: THEME.text, margin: 0 }}>
            产品库
          </h1>
        </div>
        <p style={{ fontSize: 13, color: THEME.muted, margin: 0, paddingLeft: 32 }}>
          产品管理与AI推荐匹配
        </p>
      </div>

      {/* Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          padding: '0 16px 16px',
        }}
      >
        <div
          style={{
            background: THEME.card,
            borderRadius: 12,
            border: `1px solid ${THEME.border}`,
            padding: '14px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Package size={14} color={THEME.primary} />
            <span style={{ fontSize: 11, color: THEME.muted }}>总产品数</span>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: THEME.text }}>
            {totalProducts}
          </span>
        </div>
        <div
          style={{
            background: THEME.card,
            borderRadius: 12,
            border: `1px solid ${THEME.border}`,
            padding: '14px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <DollarSign size={14} color={THEME.secondary} />
            <span style={{ fontSize: 11, color: THEME.muted }}>平均价格</span>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: THEME.text }}>
            ¥{avgPrice.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <div
          style={{
            background: THEME.card,
            borderRadius: 12,
            border: `1px solid ${THEME.border}`,
            padding: '14px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <TrendingUp size={14} color="#22c55e" />
            <span style={{ fontSize: 11, color: THEME.muted }}>最高利润</span>
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: THEME.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
            title={highestProfitProduct?.name}
          >
            {highestProfitProduct
              ? `${highestProfitProduct.name} ${Number(highestProfitProduct.profit_margin) || 0}%`
              : '--'}
          </span>
        </div>
      </div>

      {/* Search + Add Button */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '0 16px 12px',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: THEME.card,
            borderRadius: 10,
            border: `1px solid ${THEME.border}`,
            padding: '0 12px',
            height: 40,
          }}
        >
          <Search size={16} color={THEME.muted} />
          <input
            type="text"
            placeholder="搜索产品名称或描述..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              height: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: THEME.text,
              fontSize: 13,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
              }}
            >
              <X size={14} color={THEME.muted} />
            </button>
          )}
        </div>
        <button
          onClick={openNew}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            background: THEME.primary,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '0 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            height: 40,
          }}
        >
          <Plus size={16} />
          添加产品
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          onClick={handleImportClick}
          disabled={importing}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            background: THEME.card,
            color: THEME.secondary,
            border: `1px solid ${THEME.border}`,
            borderRadius: 10,
            padding: '0 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            height: 40,
          }}
        >
          <Upload size={16} />
          {importing ? '导入中...' : '导入CSV'}
        </button>
      </div>

      {/* Category Filter Chips */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 16px 16px',
          overflowX: 'auto',
          flexWrap: 'nowrap',
          scrollbarWidth: 'none',
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              border: `1px solid ${activeCategory === cat ? THEME.primary : THEME.border}`,
              background: activeCategory === cat ? THEME.primary : THEME.card,
              color: activeCategory === cat ? '#fff' : THEME.secondary,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {cat === '全部' ? null : <Tag size={12} />}
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div style={{ padding: '0 16px 100px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              color: THEME.muted,
              textAlign: 'center',
            }}
          >
            <Package size={40} color={THEME.border} strokeWidth={1.5} />
            <p style={{ margin: '12px 0 0', fontSize: 14, color: THEME.secondary }}>
              {search || activeCategory !== '全部'
                ? '没有匹配的产品'
                : '暂无产品，点击上方按钮添加'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            {filtered.map((product) => (
              <div
                key={product.id}
                style={{
                  background: THEME.card,
                  borderRadius: 14,
                  border: `1px solid ${THEME.border}`,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {/* Name + Category Tag */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 600,
                      color: THEME.text,
                      lineHeight: 1.3,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {product.name}
                  </h3>
                  {product.category && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: THEME.primary,
                        background: `${THEME.primary}18`,
                        padding: '2px 8px',
                        borderRadius: 10,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {product.category}
                    </span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: THEME.muted,
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {product.description}
                  </p>
                )}

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <DollarSign size={13} color={THEME.primary} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: THEME.text }}>
                    ¥{Number(product.price).toLocaleString('zh-CN')}
                  </span>
                </div>

                {/* Service Content Tags */}
                {product.service_content && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {product.service_content.split(',').map((item, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 10,
                          color: THEME.secondary,
                          background: THEME.bg,
                          padding: '2px 8px',
                          borderRadius: 8,
                          border: `1px solid ${THEME.border}`,
                        }}
                      >
                        {item.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer: Target Customer, Duration, Profit Margin */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    paddingTop: 6,
                    borderTop: `1px solid ${THEME.border}`,
                    fontSize: 11,
                    color: THEME.muted,
                  }}
                >
                  {product.target_customer && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Tag size={11} />
                      {product.target_customer}
                    </span>
                  )}
                  {product.duration && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={11} />
                      {product.duration}
                    </span>
                  )}
                  {product.profit_margin !== undefined && product.profit_margin !== '' && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        color: Number(product.profit_margin) >= 50 ? '#22c55e' : THEME.muted,
                        fontWeight: Number(product.profit_margin) >= 50 ? 600 : 400,
                      }}
                    >
                      <TrendingUp size={11} />
                      {Number(product.profit_margin)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.65)',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: THEME.card,
              borderRadius: '20px 20px 0 0',
              padding: '20px 20px 32px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: THEME.text }}>
                添加产品
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: THEME.muted,
                  padding: 4,
                  display: 'flex',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: THEME.muted,
                    marginBottom: 5,
                    display: 'block',
                  }}
                >
                  产品名称 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="输入产品名称"
                  style={{
                    width: '100%',
                    height: 44,
                    background: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 12,
                    padding: '0 14px',
                    color: THEME.text,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Price */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: THEME.muted,
                    marginBottom: 5,
                    display: 'block',
                  }}
                >
                  价格 (元) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="输入价格"
                  style={{
                    width: '100%',
                    height: 44,
                    background: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 12,
                    padding: '0 14px',
                    color: THEME.text,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Category */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: THEME.muted,
                    marginBottom: 5,
                    display: 'block',
                  }}
                >
                  分类
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{
                    width: '100%',
                    height: 44,
                    background: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 12,
                    padding: '0 14px',
                    color: form.category ? THEME.text : THEME.muted,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="" style={{ background: THEME.bg, color: THEME.muted }}>
                    选择分类
                  </option>
                  {CATEGORIES.filter((c) => c !== '全部').map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      style={{ background: THEME.bg, color: THEME.text }}
                    >
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: THEME.muted,
                    marginBottom: 5,
                    display: 'block',
                  }}
                >
                  产品描述
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="产品描述与服务介绍"
                  rows={3}
                  style={{
                    width: '100%',
                    background: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: THEME.text,
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Service Content */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: THEME.muted,
                    marginBottom: 5,
                    display: 'block',
                  }}
                >
                  服务内容 (逗号分隔)
                </label>
                <input
                  value={form.service_content}
                  onChange={(e) => setForm({ ...form, service_content: e.target.value })}
                  placeholder="例如: 需求分析,方案设计,实施交付"
                  style={{
                    width: '100%',
                    height: 44,
                    background: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 12,
                    padding: '0 14px',
                    color: THEME.text,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Target Customer */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: THEME.muted,
                    marginBottom: 5,
                    display: 'block',
                  }}
                >
                  目标客户
                </label>
                <input
                  value={form.target_customer}
                  onChange={(e) => setForm({ ...form, target_customer: e.target.value })}
                  placeholder="例如: 中小企业, 电商团队"
                  style={{
                    width: '100%',
                    height: 44,
                    background: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 12,
                    padding: '0 14px',
                    color: THEME.text,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Duration */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: THEME.muted,
                    marginBottom: 5,
                    display: 'block',
                  }}
                >
                  服务周期
                </label>
                <input
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="例如: 1个月, 3个月"
                  style={{
                    width: '100%',
                    height: 44,
                    background: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 12,
                    padding: '0 14px',
                    color: THEME.text,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Profit Margin */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: THEME.muted,
                    marginBottom: 5,
                    display: 'block',
                  }}
                >
                  利润率 (%)
                </label>
                <input
                  type="number"
                  value={form.profit_margin}
                  onChange={(e) => setForm({ ...form, profit_margin: e.target.value })}
                  placeholder="例如: 30"
                  style={{
                    width: '100%',
                    height: 44,
                    background: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 12,
                    padding: '0 14px',
                    color: THEME.text,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.name.trim() || !form.price}
                style={{
                  width: '100%',
                  height: 46,
                  background: THEME.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: submitting || !form.name.trim() || !form.price ? 'not-allowed' : 'pointer',
                  opacity: submitting || !form.name.trim() || !form.price ? 0.5 : 1,
                  marginTop: 6,
                }}
              >
                {submitting ? '添加中...' : '添加产品'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
