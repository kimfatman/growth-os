export function formatMoney(value) {
  if (value == null) return '¥0';
  const num = Number(value);
  if (num >= 10000) return `¥${(num / 10000).toFixed(1)}万`;
  return `¥${num.toLocaleString('zh-CN')}`;
}

export function formatPercent(value) {
  if (value == null) return '0%';
  return `${Math.round(Number(value) * 100)}%`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getScoreColor(score) {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-danger';
}

export function getIntentLabel(intent) {
  const map = { tax: '税务', qualification: '资质', subsidy: '补贴', ip: '知识产权', high: '高意向', medium: '中意向', low: '低意向' };
  return map[intent] || intent;
}
