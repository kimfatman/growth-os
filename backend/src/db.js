import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─── In-memory store ─────────────────────────────────────────────────
const tables = {};

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function loadTable(name) {
  const fp = filePath(name);
  if (tables[name]) return;
  try {
    const data = fs.readFileSync(fp, 'utf-8');
    tables[name] = JSON.parse(data);
  } catch {
    tables[name] = [];
  }
}

function saveTable(name) {
  if (!tables[name]) return;
  fs.writeFileSync(filePath(name), JSON.stringify(tables[name], null, 2));
}

// ─── Helpers ─────────────────────────────────────────────────────────
function uid() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function parseWhere(sql) {
  const whereMatch = sql.match(/\bWHERE\s+(.+?)(?:\bORDER\s+BY\b|\bLIMIT\b|\bRETURNING\b|$)/is);
  if (!whereMatch) return { conditions: [], hasWhere: false };

  const whereClause = whereMatch[1].trim();
  const orderByMatch = sql.match(/\bORDER\s+BY\b\s+(.+?)(?:\bLIMIT\b|$)/is);
  const limitMatch = sql.match(/\bLIMIT\b\s+(\d+)/i);

  // Build conditions array: each condition is { field, operator, value, paramIndex? }
  const conditions = [];

  // Split by AND/OR (outside string literals and parentheses)
  const parts = splitWhereClause(whereClause);

  let paramIdxTracker = 0;

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    let cond = null;

    // pattern: field IN (?, ?, ?)
    const inMatch = trimmed.match(/^(\w+(?:\.\w+)?)\s+IN\s*\(([^)]+)\)\s*$/i);
    if (inMatch) {
      const vals = inMatch[2].split(',').map(v => v.trim());
      const resolvedVals = vals.map(v => {
        if (v === '?') return { type: 'param', value: null, idx: paramIdxTracker++ };
        return { type: 'literal', value: v.replace(/^'(.*)'$/, '$1') };
      });
      cond = { field: inMatch[1], operator: 'IN', values: resolvedVals };
    }

    // pattern: field IS NULL / IS NOT NULL
    if (!cond) {
      const isNullMatch = trimmed.match(/^(\w+(?:\.\w+)?)\s+IS\s+(NOT\s+)?NULL\s*$/i);
      if (isNullMatch) {
        cond = { field: isNullMatch[1], operator: isNullMatch[2] ? 'IS NOT NULL' : 'IS NULL' };
      }
    }

    // pattern: field LIKE ? or field LIKE 'literal'
    if (!cond) {
      const likeMatch = trimmed.match(/^(\w+(?:\.\w+)?)\s+LIKE\s+(.+)$/i);
      if (likeMatch) {
        const val = likeMatch[2].trim();
        if (val === '?') {
          cond = { field: likeMatch[1], operator: 'LIKE', valueType: 'param', paramIdx: paramIdxTracker++ };
        } else {
          cond = { field: likeMatch[1], operator: 'LIKE', valueType: 'literal', literal: val.replace(/^'(.*)'$/, '$1') };
        }
      }
    }

    // pattern: field = ?, field != ?, field >= date('now'), field = 'literal'
    if (!cond) {
      const opMatch = trimmed.match(/^(\w+(?:\.\w+)?)\s*(=|!=|<>|>=|<=|>|<)\s+(.+)$/i);
      if (opMatch) {
        const field = opMatch[1];
        const operator = opMatch[2];
        const rawVal = opMatch[3].trim();

        if (rawVal === '?') {
          cond = { field, operator, valueType: 'param', paramIdx: paramIdxTracker++ };
        } else if (/^'.*'$/.test(rawVal)) {
          cond = { field, operator, valueType: 'literal', literal: rawVal.replace(/^'(.*)'$/, '$1') };
        } else if (/^\d+$/.test(rawVal)) {
          cond = { field, operator, valueType: 'literal', literal: Number(rawVal) };
        } else if (/^date\('now'(?:\s*,\s*'[^']*')?\)$/i.test(rawVal) || /^CURRENT_DATE$/i.test(rawVal)) {
          cond = { field, operator, valueType: 'function', fn: 'date_now' };
        } else if (/^datetime\('now'(?:\s*,\s*'[^']*')?\)$/i.test(rawVal)) {
          cond = { field, operator, valueType: 'function', fn: 'datetime_now' };
        } else if (/^\w+$/.test(rawVal)) {
          // Column reference
          cond = { field, operator, valueType: 'column', column: rawVal };
        }
      }
    }

    if (cond) {
      conditions.push(cond);
    } else if (trimmed.includes('?')) {
      conditions.push({ field: trimmed, operator: '?', hasPlaceholder: true });
    }
  }

  return {
    conditions,
    orderBy: orderByMatch ? orderByMatch[1].trim() : null,
    limit: limitMatch ? parseInt(limitMatch[1]) : null,
    hasWhere: conditions.length > 0,
  };
}

function splitWhereClause(clause) {
  // Split by AND/OR but respect string literals and parentheses
  const parts = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let i = 0;

  while (i < clause.length) {
    const ch = clause[i];

    if (ch === "'") { current += ch; inString = !inString; i++; continue; }
    if (inString) { current += ch; i++; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;

    if (depth === 0 && i + 2 < clause.length) {
      const rest = clause.slice(i);
      const andMatch = rest.match(/^\s+AND\s+/i);
      const orMatch = rest.match(/^\s+OR\s+/i);
      if (andMatch) { parts.push(current); current = ''; i += andMatch[0].length; continue; }
      if (orMatch) { parts.push(current); current = ''; i += orMatch[0].length; continue; }
    }

    current += ch;
    i++;
  }

  if (current.trim()) parts.push(current);
  return parts;
}

function resolveConditionValue(cond, params) {
  if (cond.valueType === 'param') {
    return params[cond.paramIdx];
  }
  if (cond.valueType === 'literal') {
    return cond.literal;
  }
  if (cond.valueType === 'function') {
    if (cond.fn === 'date_now') return todayStr();
    if (cond.fn === 'datetime_now') return now();
    return null;
  }
  if (cond.valueType === 'column') {
    return undefined; // Will be resolved at row level
  }
  if (cond.values) {
    return cond.values.map(v => v.type === 'param' ? params[v.idx] : v.value);
  }
  return null;
}

function evalCondition(row, condition, params) {
  const val = row[condition.field];
  const condVal = resolveConditionValue(condition, params);

  // For column references (e.g., comparing two columns)
  if (condition.valueType === 'column') {
    return compareValues(val, row[condition.column], condition.operator);
  }

  // For IN operator
  if (condition.operator === 'IN' && Array.isArray(condVal)) {
    return condVal.includes(val);
  }

  if (condition.operator === 'IS NULL') return val === null || val === undefined;
  if (condition.operator === 'IS NOT NULL') return val !== null && val !== undefined;

  if (condition.operator === 'LIKE') {
    const pattern = String(condVal || '');
    const regex = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
    return regex.test(String(val));
  }

  return compareValues(val, condVal, condition.operator);
}

function compareValues(a, b, operator) {
  // Try numeric comparison first
  const numA = Number(a);
  const numB = Number(b);
  const isNumeric = !isNaN(numA) && !isNaN(numB);

  if (operator === '=') return String(a) === String(b);
  if (operator === '!=' || operator === '<>') return String(a) !== String(b);

  if (isNumeric) {
    switch (operator) {
      case '>': return numA > numB;
      case '<': return numA < numB;
      case '>=': return numA >= numB;
      case '<=': return numA <= numB;
    }
  }

  // Fallback to string comparison for dates and other text
  const strA = String(a || '');
  const strB = String(b || '');
  switch (operator) {
    case '>': return strA > strB;
    case '<': return strA < strB;
    case '>=': return strA >= strB;
    case '<=': return strA <= strB;
    default: return true;
  }
}

function evalWhere(rows, parsedWhere, params) {
  if (!parsedWhere || !parsedWhere.hasWhere) return rows;
  if (parsedWhere.conditions.length === 0) return rows;

  return rows.filter(row => {
    return parsedWhere.conditions.every(cond => evalCondition(row, cond, params));
  });
}

function applyOrderBy(rows, orderBy) {
  if (!orderBy) return rows;

  const parts = orderBy.split(',').map(p => p.trim());
  return [...rows].sort((a, b) => {
    for (const part of parts) {
      const descMatch = part.match(/^(.+?)\s+DESC$/i);
      const ascMatch = part.match(/^(.+?)\s+ASC$/i);
      const justField = part.match(/^(.+?)$/);

      let field, direction;
      if (descMatch) { field = descMatch[1].trim(); direction = -1; }
      else if (ascMatch) { field = ascMatch[1].trim(); direction = 1; }
      else if (justField) { field = justField[1].trim(); direction = 1; }

      const aVal = getFieldValue(a, field);
      const bVal = getFieldValue(b, field);
      if (aVal < bVal) return -1 * direction;
      if (aVal > bVal) return 1 * direction;
    }
    return 0;
  });
}

function getFieldValue(row, fieldExpr) {
  // Handle CASE ... END expressions
  if (/^CASE\b/i.test(fieldExpr)) {
    return evaluateCase(row, fieldExpr);
  }
  // Handle simple field name
  return row[fieldExpr];
}

function evaluateCase(row, caseExpr) {
  // Parse CASE WHEN ... THEN ... ELSE ... END
  // Supports: WHEN field = 'literal', WHEN field != 'literal',
  //           WHEN field >= literal, WHEN expr >= expr

  // Extract WHEN/THEN pairs
  const whenThenRegex = /WHEN\s+(.+?)\s+THEN\s+(\S+?)(?=\s+WHEN|\s+ELSE|\s+END)/gi;
  let result = null;

  let match;
  while ((match = whenThenRegex.exec(caseExpr)) !== null) {
    const condition = match[1].trim();
    const thenValue = match[2].trim();

    if (evaluateCaseWhen(row, condition)) {
      result = thenValue;
      break;
    }
  }

  if (result === null) {
    const elseMatch = caseExpr.match(/ELSE\s+(.+?)\s+END/i);
    if (elseMatch) result = elseMatch[1].trim();
  }

  return result;
}

function evaluateCaseWhen(row, condition) {
  // Handle: field = 'literal'
  const eqLiteral = condition.match(/^(\w+)\s*=\s*'([^']+)'$/);
  if (eqLiteral) return String(row[eqLiteral[1]]) === eqLiteral[2];

  // Handle: field != 'literal'
  const neLiteral = condition.match(/^(\w+)\s*!=\s*'([^']+)'$/);
  if (neLiteral) return String(row[neLiteral[1]]) !== neLiteral[2];

  // Handle: expr >= expr (e.g., progress + 1 >= target)
  const cmpExpr = condition.match(/^(\w+(?:\s*\+\s*\d+)?)\s*(>=|<=|>|<|=)\s*(\w+(?:\s*\+\s*\d+)?)$/);
  if (cmpExpr) {
    const left = resolveRowExpr(row, cmpExpr[1]);
    const right = resolveRowExpr(row, cmpExpr[3]);
    const op = cmpExpr[2];
    switch (op) {
      case '=': return left === right;
      case '>': return left > right;
      case '<': return left < right;
      case '>=': return left >= right;
      case '<=': return left <= right;
    }
  }

  return false;
}

function resolveRowExpr(row, expr) {
  const trimmed = expr.trim();
  // Handle: field + number
  const plusMatch = trimmed.match(/^(\w+)\s*\+\s*(\d+)$/);
  if (plusMatch) return (Number(row[plusMatch[1]]) || 0) + parseInt(plusMatch[2]);
  // Handle: number
  const num = Number(trimmed);
  if (!isNaN(num)) return num;
  // Handle: field name
  if (row[trimmed] !== undefined) return row[trimmed];
  return trimmed;
}

function simpleConditionCheck(row, condition) {
  const match = condition.match(/^(.+?)\s*=\s*'([^']+)'$/);
  if (match) {
    return String(row[match[1].trim()]) === match[2];
  }
  return false;
}

function evaluateExpr(expr, row, params, paramIdx) {
  // Handle field reference
  if (row[expr] !== undefined) return row[expr];
  // Handle ? placeholder
  if (expr === '?' && params) return params[paramIdx];
  // Handle numeric literal
  const num = Number(expr);
  if (!isNaN(num)) return num;
  // Handle expressions like field + number
  const plusMatch = expr.match(/^(\w+)\s*\+\s*(\d+)$/);
  if (plusMatch) return (Number(row[plusMatch[1]]) || 0) + parseInt(plusMatch[2]);
  // Handle expressions like field + ?
  const plusParam = expr.match(/^(\w+)\s*\+\s*\?$/);
  if (plusParam && params) return (Number(row[plusParam[1]]) || 0) + Number(params[paramIdx]);
  return expr;
}

// ─── SQL parser ──────────────────────────────────────────────────────
function parseSQL(sql) {
  const type = sql.trim().split(/\s+/)[0].toUpperCase();
  return { type };
}

// ─── Table name extraction ──────────────────────────────────────────
function getTableName(sql) {
  const patterns = [
    /(?:FROM|INTO|UPDATE|TABLE)\s+(?:IF NOT EXISTS\s+)?(\w+)/i,
    /ON\s+CONFLICT\s*\((\w+)/i,
  ];
  for (const p of patterns) {
    const m = sql.match(p);
    if (m) return m[1];
  }
  return null;
}

// ─── Aggregation evaluator ──────────────────────────────────────────
function splitByCommaOutsideParens(str) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function evalAggregate(rows, selectExpr) {
  const result = {};

  // Parse the SELECT list
  const selectMatch = sqlSelectCache?.get(selectExpr);
  // Simple approach: process the select clause
  // We handle only the patterns used in our routes

  // Split by comma but not inside parentheses
  const selections = splitByCommaOutsideParens(selectExpr);

  for (const sel of selections) {
    // COUNT(*) as alias
    const countStar = sel.match(/COUNT\(\*\)\s+(?:as\s+)?(\w+)/i);
    if (countStar) {
      result[countStar[1]] = rows.length;
      continue;
    }

    // COUNT(CASE WHEN ... THEN 1 END) as alias
    const countCase = sel.match(/COUNT\((CASE\s+.+?END)\)\s+(?:as\s+)?(\w+)/i);
    if (countCase) {
      // Extract condition from CASE WHEN ... THEN 1 END
      const whenMatch = countCase[1].match(/WHEN\s+(.+?)\s+THEN/i);
      if (whenMatch) {
        const condition = whenMatch[1].trim();
        const caseResult = rows.filter(r => {
          if (condition.includes("!='")) {
            const parts = condition.match(/(\w+)\s*!=\s*'([^']+)'/);
            if (parts) return String(r[parts[1]]) !== parts[2];
          }
          if (condition.includes("='")) {
            const parts = condition.match(/(\w+)\s*=\s*'([^']+)'/);
            if (parts) return String(r[parts[1]]) === parts[2];
          }
          return simpleConditionCheck(r, condition);
        }).length;
        result[countCase[2]] = caseResult;
      }
      continue;
    }

    // COALESCE(SUM(...), 0) as alias
    const coalesceSum = sel.match(/COALESCE\(SUM\((.+?)\)\s*,\s*(\d+)\)\s+(?:as\s+)?(\w+)/i);
    if (coalesceSum) {
      const field = coalesceSum[1].trim();
      const defaultVal = parseInt(coalesceSum[2]);
      result[coalesceSum[3]] = rows.reduce((sum, r) => sum + (Number(r[field]) || 0), defaultVal);
      continue;
    }

    // COALESCE(SUM(CASE WHEN ... THEN ... ELSE ... END), 0) as alias
    const coalesceCaseSum = sel.match(/COALESCE\(SUM\(CASE\s+(.+?)END\)\s*,\s*(\d+)\)\s+as\s+(\w+)/i);
    if (coalesceCaseSum) {
      const caseBlock = coalesceCaseSum[1];
      const defaultVal = parseInt(coalesceCaseSum[2]);
      const alias = coalesceCaseSum[3];

      // Parse simple CASE WHEN status != '成交' THEN amount ELSE 0 END
      const sum = rows.reduce((acc, r) => {
        const whenNot = caseBlock.match(/WHEN\s+(\w+)\s+!=\s+'([^']+)'\s+THEN\s+(\w+)/);
        if (whenNot) {
          if (String(r[whenNot[1]]) !== whenNot[2]) {
            return acc + (Number(r[whenNot[3]]) || 0);
          }
        }
        const elses = caseBlock.match(/ELSE\s+(\d+)/);
        if (elses) return acc + (Number(elses[1]) || 0);
        return acc;
      }, 0);
      result[alias] = sum + defaultVal;
      continue;
    }

    // Simple SUM(field) as alias
    const simpleSum = sel.match(/SUM\((.+?)\)\s+(?:as\s+)?(\w+)/i);
    if (simpleSum) {
      result[simpleSum[2]] = rows.reduce((s, r) => s + (Number(r[simpleSum[1]]) || 0), 0);
      continue;
    }

    // Simple field name
    const fieldMatch = sel.match(/(\w+)\s+(?:as\s+)?(\w+)?/i);
    if (fieldMatch) {
      const field = fieldMatch[1];
      const alias = fieldMatch[2] || field;
      if (rows.length > 0 && field in rows[0]) {
        result[alias] = rows[0][field];
      }
    }
  }

  return result;
}

let sqlSelectCache = new Map();

// ─── Main query executor ─────────────────────────────────────────────
function executeQuery(sql, params = []) {
  const trimmed = sql.trim();
  const tableName = getTableName(trimmed);
  if (!tableName) {
    // DDL like CREATE TABLE
    if (/^CREATE\s+TABLE/i.test(trimmed)) {
      // Just register the table
      loadTable(tableName || 'unknown');
      return { changes: 0 };
    }
    if (/^CREATE\s+INDEX/i.test(trimmed)) return { changes: 0 };
    return { changes: 0 };
  }

  loadTable(tableName);
  let data = tables[tableName];

  // ── SELECT ──
  if (/^SELECT/i.test(trimmed)) {
    const selectPart = trimmed.match(/SELECT\s+(.+?)\s+FROM/i)?.[1] || '*';
    const whereInfo = parseWhere(trimmed);
    let rows = data;

    if (whereInfo.hasWhere) {
      rows = evalWhere(data, whereInfo, params);
    }

    // Handle ORDER BY
    if (whereInfo.orderBy) {
      rows = applyOrderBy(rows, whereInfo.orderBy);
    }

    // Handle LIMIT
    if (whereInfo.limit) {
      rows = rows.slice(0, whereInfo.limit);
    }

    // Handle aggregate queries (no GROUP BY, just aggregation)
    const hasAggregates = /(COUNT|SUM|COALESCE|AVG|MIN|MAX)\s*\(/i.test(selectPart);
    if (selectPart !== '*' && hasAggregates) {
      const aggResult = evalAggregate(rows, selectPart);
      return { rows: [aggResult] };
    }

    // Handle RETURNING * from INSERT/UPDATE
    if (/RETURNING\s+\*/i.test(trimmed)) {
      return { rows: [data[data.length - 1]], returning: true };
    }

    return { rows };
  }

  // ── INSERT ──
  if (/^INSERT/i.test(trimmed)) {
    const colsMatch = trimmed.match(/\(([^)]+)\)\s*VALUES/i);
    const valuesMatch = trimmed.match(/VALUES\s*\(([^)]+)\)/i);

    if (colsMatch && valuesMatch) {
      const cols = colsMatch[1].split(',').map(c => c.trim());
      const placeholders = valuesMatch[1].split(',').map(p => p.trim());

      // Map params to columns
      const newRow = { id: uid() };
      let paramIdx = 0;

      for (const placeholder of placeholders) {
        if (placeholder === '?') {
          const col = cols[paramIdx];
          newRow[col] = params[paramIdx];
          paramIdx++;
        } else if (placeholder.toLowerCase().includes("datetime('now')")) {
          // Handle CURRENT_TIMESTAMP type
          // auto-set later
        }
      }

      // Handle ON CONFLICT DO UPDATE
      const onConflict = trimmed.match(/ON\s+CONFLICT.*?DO\s+UPDATE\s+SET\s+(.+?)(?:\s+WHERE|$)/is);
      if (onConflict) {
        // Parse conflict columns: ON CONFLICT(col1, col2)
        const conflictColMatch = trimmed.match(/ON\s+CONFLICT\s*\(([^)]+)\)/i);
        if (conflictColMatch) {
          const conflictFields = conflictColMatch[1].split(',').map(c => c.trim());

          // Check if a row with the same conflict column values exists
          const existing = data.find(r =>
            conflictFields.every(f => String(r[f]) === String(newRow[f]))
          );

          if (existing) {
            // Update existing row using SET clause assignments
            const setClause = onConflict[1];
            // Handle each SET assignment: col = expr
            const setAssignments = setClause.split(',').map(a => a.trim());
            for (const assign of setAssignments) {
              const setMatch = assign.match(/^(\w+)\s*=\s*(.+)$/);
              if (!setMatch) continue;
              const field = setMatch[1];
              const expr = setMatch[2].trim();
              if (/^excluded\.(\w+)$/.test(expr)) {
                existing[field] = newRow[expr.match(/excluded\.(\w+)/)[1]];
              } else if (expr.includes("datetime('now')") || expr === "datetime('now')") {
                existing[field] = now();
              } else if (expr === '?') {
                // skip params in ON CONFLICT SET
              } else {
                existing[field] = newRow[field] ?? existing[field];
              }
            }
            existing.updated_at = now();
            saveTable(tableName);
            return { changes: 1, rows: [existing] };
          }
        }
      }

      // Handle ON CONFLICT IGNORE / OR IGNORE
      const isInsertIgnore = /OR\s+IGNORE|ON\s+CONFLICT.*DO\s+NOTHING/i.test(trimmed);
      if (isInsertIgnore) {
        let conflictCols = [];
        if (tableName === 'xp') conflictCols = ['user_id'];
        else if (tableName === 'daily_tasks') conflictCols = ['user_id', 'date', 'task_type'];
        else if (tableName === 'achievements') conflictCols = ['user_id', 'code'];
        else if (tableName === 'streaks') conflictCols = ['user_id'];
        else if (tableName === 'targets') conflictCols = ['user_id', 'month'];
        else {
          const uniqueMatch = trimmed.match(/UNIQUE\s*\((\w+(?:\s*,\s*\w+)*)\)/i);
          if (uniqueMatch) {
            conflictCols = uniqueMatch[1].split(',').map(c => c.trim());
          }
        }
        if (conflictCols.length > 0) {
          const exists = data.some(r =>
            conflictCols.every(col => String(r[col]) === String(newRow[col]))
          );
          if (exists) return { changes: 0, rows: [] };
        }
      }

      // Set auto fields
      if (!newRow.created_at) newRow.created_at = now();
      if (!newRow.updated_at) newRow.updated_at = now();

      data.push(newRow);
      saveTable(tableName);

      // RETURNING *
      if (/RETURNING\s+\*/i.test(trimmed)) {
        return { rows: [newRow], changes: 1 };
      }

      return { changes: 1, rows: [newRow] };
    }
  }

  // ── UPDATE ──
  if (/^UPDATE/i.test(trimmed)) {
    const setMatch = trimmed.match(/SET\s+(.+?)(?:\s+WHERE|\s+RETURNING|\s*$)/is);
    const whereInfo = parseWhere(trimmed);
    const returningStar = /RETURNING\s+\*/i.test(trimmed);
    const returningFields = trimmed.match(/RETURNING\s+(.+?)$/i)?.[1];
    const hasReturning = returningStar || returningFields;

    let rowsToUpdate = data;
    if (whereInfo.hasWhere) {
      rowsToUpdate = evalWhere(data, whereInfo, params);
    }

    if (setMatch) {
      const setClause = setMatch[1];
      const assignments = setClause.split(',').map(a => a.trim());
      let paramIdx = 0;

      for (const row of rowsToUpdate) {
        for (const assign of assignments) {
          const exprMatch = assign.match(/^(\w+)\s*=\s*(.+)$/);
          if (!exprMatch) continue;

          const field = exprMatch[1];
          let valueExpr = exprMatch[2].trim();

          // Handle ? at end of expression (parameter)
          const hasParam = valueExpr.includes('?');

          // Parse expression
          if (valueExpr === '?') {
            row[field] = params[paramIdx++];
          } else if (valueExpr.startsWith('datetime(') || valueExpr === "datetime('now')") {
            row[field] = now();
          } else if (valueExpr.startsWith('date(') || valueExpr === "date('now')") {
            row[field] = todayStr();
          } else if (valueExpr.includes("datetime('now',")) {
            const offset = valueExpr.match(/'(-?\d+\s+\w+)'/)?.[1];
            if (offset === '1 day') row[field] = new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' ');
            else if (offset === '-1 day') row[field] = yesterdayStr().replace('T', ' ');
            else row[field] = now();
          } else if (/^(LEAST|MIN)\(/i.test(valueExpr)) {
            const leastMatch = valueExpr.match(/(?:LEAST|MIN)\((.+?),\s*(.+)\)/i);
            if (leastMatch) {
              const valA = evaluateExpr(leastMatch[1].trim(), row, params, paramIdx);
              const valB = evaluateExpr(leastMatch[2].trim(), row, params, paramIdx);
              row[field] = Math.min(Number(valA), Number(valB));
            }
          } else if (valueExpr.startsWith('CASE ')) {
            const result = evaluateCase(row, valueExpr);
            if (result === '1' || result === 1 || result === true) row[field] = 1;
            else if (result === '0' || result === 0 || result === false) row[field] = 0;
            else row[field] = result;
          } else if (/excluded\.(\w+)/.test(valueExpr)) {
            const refField = valueExpr.match(/excluded\.(\w+)/)[1];
            try { row[field] = newRow ? newRow[refField] : row[refField]; } catch { row[field] = row[refField]; }
          } else if (valueExpr.includes(' + ')) {
            // Handle expressions like total_xp + ?
            const parts = valueExpr.match(/(\w+)\s*\+\s*\?/);
            if (parts) {
              row[field] = (Number(row[parts[1]]) || 0) + (Number(params[paramIdx++]) || 0);
            }
          } else {
            // Try numeric or string value
            const num = Number(valueExpr);
            if (!isNaN(num) && valueExpr !== '') {
              row[field] = num;
            } else if (valueExpr !== '?') {
              // might be a field reference like another column name
              if (row[valueExpr] !== undefined) {
                row[field] = row[valueExpr];
              }
            }
          }
        }
        row.updated_at = now();
      }

      saveTable(tableName);

      if (hasReturning) {
        if (returningFields && returningFields !== '*') {
          // Return specific fields
          const fields = returningFields.split(',').map(f => f.trim());
          const result = rowsToUpdate.map(r => {
            const obj = {};
            for (const f of fields) obj[f] = r[f];
            return obj;
          });
          return { rows: result, changes: rowsToUpdate.length };
        }
        return { rows: rowsToUpdate, changes: rowsToUpdate.length };
      }

      return { changes: rowsToUpdate.length };
    }
  }

  // ── DELETE ──
  if (/^DELETE/i.test(trimmed)) {
    const whereInfo = parseWhere(trimmed);
    let beforeCount = data.length;

    if (whereInfo.hasWhere && whereInfo.conditions.length > 0) {
      const toDelete = evalWhere(data, whereInfo, params);
      const idsToDelete = new Set(toDelete.map(r => r.id));
      tables[tableName] = data.filter(r => !idsToDelete.has(r.id));
    } else {
      tables[tableName] = [];
    }

    saveTable(tableName);
    return { changes: beforeCount - tables[tableName].length };
  }

  return { changes: 0 };
}

// ─── Public API ──────────────────────────────────────────────────────
const db = {
  prepare(sql) {
    const self = this;
    return {
      all(...params) {
        const result = executeQuery(sql, params);
        return result.rows || [];
      },
      get(...params) {
        const result = executeQuery(sql, params);
        const rows = result.rows || [];
        return rows[0] || null;
      },
      run(...params) {
        const result = executeQuery(sql, params);
        return {
          changes: result.changes || 0,
          lastInsertRowid: result.rows?.[0]?.id || 0,
        };
      },
    };
  },
  exec(sql) {
    // For multi-statement SQL (CREATE TABLE, etc.)
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      if (/^CREATE\s+TABLE/i.test(stmt)) {
        const nameMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
        if (nameMatch) {
          const name = nameMatch[1];
          if (!tables[name]) {
            tables[name] = [];
            saveTable(name);
          }
        }
      } else if (/^CREATE\s+INDEX/i.test(stmt)) {
        // Indexes are no-ops in our JSON store
      }
    }
  },
  // Async query interface for routes using PostgreSQL-style $1, $2 params
  async query(sql, params = []) {
    // Convert PostgreSQL $1, $2... to ? placeholders
    let convertedSql = sql;
    const paramMap = {};
    const numericParams = [];

    // Replace $1, $2, etc. with ? while preserving order
    let match;
    const paramRegex = /\$(\d+)/g;
    let lastIdx = 0;
    while ((match = paramRegex.exec(sql)) !== null) {
      const num = parseInt(match[1]);
      if (!paramMap[num]) {
        paramMap[num] = true;
        numericParams.push(params[num - 1]);
      }
    }

    // Simple replacement: just replace $N with ? sequentially
    // We need to handle this carefully since the routes use $1, $2 in order
    // Actually since this is PostgreSQL style and our params array is positional,
    // we just need to replace $1 with ?, $2 with ? sequentially
    if (numericParams.length > 0) {
      convertedSql = sql.replace(/\$\d+/g, '?');
    }

    try {
      const stmt = this.prepare(convertedSql);

      if (/SELECT/i.test(convertedSql) && !/INSERT|UPDATE|DELETE|RETURNING/i.test(convertedSql)) {
        // Just a SELECT without RETURNING
        const rows = stmt.all(...numericParams);
        return { rows, rowCount: rows.length };
      }

      if (/INSERT|UPDATE|DELETE/i.test(convertedSql) || /RETURNING/i.test(convertedSql)) {
        if (/RETURNING/i.test(convertedSql)) {
          // INSERT/UPDATE with RETURNING: return the row(s)
          const rows = stmt.all(...numericParams);
          return { rows, rowCount: rows.length };
        }
        // Simple INSERT/UPDATE/DELETE without RETURNING
        const result = stmt.run(...numericParams);
        return { rows: [], rowCount: result.changes };
      }

      // Fallback
      const rows = stmt.all(...numericParams);
      return { rows, rowCount: rows.length };
    } catch (err) {
      console.error(`DB query error: ${convertedSql}`, err.message);
      throw err;
    }
  },
};

// ─── Initialize all tables ───────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users;
  CREATE TABLE IF NOT EXISTS customers;
  CREATE TABLE IF NOT EXISTS timeline;
  CREATE TABLE IF NOT EXISTS targets;
  CREATE TABLE IF NOT EXISTS products;
  CREATE TABLE IF NOT EXISTS pipeline;
  CREATE TABLE IF NOT EXISTS content;
  CREATE TABLE IF NOT EXISTS leads;
  CREATE TABLE IF NOT EXISTS xp;
  CREATE TABLE IF NOT EXISTS xp_log;
  CREATE TABLE IF NOT EXISTS daily_tasks;
  CREATE TABLE IF NOT EXISTS streaks;
  CREATE TABLE IF NOT EXISTS achievements;
  CREATE TABLE IF NOT EXISTS dashboard;
`);

export default db;
