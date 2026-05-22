import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { resolve, relative, sep } from 'path';

const ROOT = resolve(import.meta.dirname, '..');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_NAME = process.env.REPO_NAME || 'growth-os';
const REPO_DESCRIPTION = 'Growth OS - AI销售增长系统 (全栈 + 游戏化 + AI)';

if (!GITHUB_TOKEN) {
  console.error('请设置 GITHUB_TOKEN 环境变量');
  console.error('例如: $env:GITHUB_TOKEN="ghp_xxx"; node scripts/push-to-github.mjs');
  process.exit(1);
}

const GIT_DIR = resolve(ROOT, '.git');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'scripts']);
const IGNORE_FILES = new Set(['.env', 'package-lock.json']);
const IGNORE_EXTS = new Set(['.lock']);

function walkDir(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = resolve(dir, name);
    const rel = relative(ROOT, full);
    if (statSync(full).isDirectory()) {
      files.push(...walkDir(full));
    } else {
      if (IGNORE_FILES.has(name)) continue;
      const ext = name.slice(name.lastIndexOf('.'));
      if (IGNORE_EXTS.has(ext)) continue;
      files.push(rel);
    }
  }
  return files;
}

async function createGithubRepo() {
  console.log('正在创建 GitHub 仓库...');
  const res = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'growth-os-script',
    },
    body: JSON.stringify({
      name: REPO_NAME,
      description: REPO_DESCRIPTION,
      private: false,
      auto_init: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    if (res.status === 422 && err.errors?.[0]?.code === 'already_exists') {
      console.log(`仓库 ${REPO_NAME} 已存在，将推送至现有仓库`);
      return;
    }
    throw new Error(`创建仓库失败: ${err.message || res.status}`);
  }

  const data = await res.json();
  console.log(`仓库创建成功: ${data.html_url}`);
}

async function uploadFiles() {
  console.log('正在收集文件...');
  const files = walkDir(ROOT);
  console.log(`找到 ${files.length} 个文件`);

  // Get user info
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'growth-os-script',
    },
  });
  const user = await userRes.json();
  const owner = user.login;

  // Check if repo exists
  const repoCheck = await fetch(`https://api.github.com/repos/${owner}/${REPO_NAME}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'growth-os-script',
    },
  });

  const repoExists = repoCheck.ok;
  if (!repoExists) {
    await createGithubRepo();
  }

  // Upload each file via Contents API
  let successCount = 0;
  let errorCount = 0;

  for (const filePath of files) {
    const fullPath = resolve(ROOT, filePath);
    const content = readFileSync(fullPath, 'base64');

    // Check if file exists in repo
    const checkRes = await fetch(
      `https://api.github.com/repos/${owner}/${REPO_NAME}/contents/${filePath.replace(/\\/g, '/')}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'growth-os-script',
        },
      }
    );

    const existingSha = checkRes.ok ? (await checkRes.json()).sha : null;

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${REPO_NAME}/contents/${filePath.replace(/\\/g, '/')}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'growth-os-script',
        },
        body: JSON.stringify({
          message: existingSha ? `Update ${filePath}` : `Add ${filePath}`,
          content,
          sha: existingSha || undefined,
        }),
      }
    );

    if (putRes.ok) {
      successCount++;
      process.stdout.write(`\r✅ 已上传 ${successCount}/${files.length} 个文件`);
    } else {
      errorCount++;
      console.error(`\n❌ 上传 ${filePath} 失败: ${putRes.status}`);
    }
  }

  console.log(`\n\n上传完成！成功: ${successCount}, 失败: ${errorCount}`);
  console.log(`仓库地址: https://github.com/${owner}/${REPO_NAME}`);
}

uploadFiles().catch((err) => {
  console.error('错误:', err.message);
  process.exit(1);
});
