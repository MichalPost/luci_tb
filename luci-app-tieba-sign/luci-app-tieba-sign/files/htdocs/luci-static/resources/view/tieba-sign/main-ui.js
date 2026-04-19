'use strict';
'require baseclass';
'require view.tieba-sign.css as tsCss';

const CSS = tsCss.css;

return baseclass.extend({
    /* ── CSS injection ── */
    _injectCSS() {
        if (document.getElementById('ts-styles')) return;
        const s = document.createElement('style');
        s.id = 'ts-styles';
        s.textContent = CSS;
        document.head.appendChild(s);

        const override = document.createElement('style');
        override.id = 'ts-override';
        override.textContent = `
#view { max-width: none !important; padding: 20px 24px !important; }
.main-right > .main { max-width: none !important; }
`;
        document.head.appendChild(override);
    },

    _buildTabNav(active) {
        const nav = document.createElement('div');
        nav.style.cssText = 'display:flex;gap:4px;margin-bottom:20px;border-bottom:2px solid #e2e8f0;';
        [
            { key: 'main', label: '⚙️ 签到配置' },
            { key: 'forums', label: '📋 贴吧列表' },
            { key: 'stats', label: '📈 统计' },
        ].forEach(tab => {
            const btn = document.createElement('button');
            btn.dataset.tab = tab.key;
            btn.style.cssText = [
                'padding:10px 20px', 'font-size:14px', 'font-weight:600',
                'border-radius:8px 8px 0 0', 'cursor:pointer',
                'transition:all .18s', 'margin-bottom:-2px', 'border:none',
                tab.key === active
                    ? 'color:#2563eb;border:2px solid #e2e8f0!important;border-bottom-color:#fff!important;background:#fff;'
                    : 'color:#64748b;background:none;border:2px solid transparent;',
            ].join(';');
            btn.textContent = tab.label;
            btn.addEventListener('click', () => this._switchTab(tab.key));
            nav.appendChild(btn);
        });
        return nav;
    },

    _switchTab(tab) {
        const root = this._root;
        if (!root) return;

        root.querySelectorAll('[data-tab]').forEach(btn => {
            const active = btn.dataset.tab === tab;
            btn.style.color = active ? '#2563eb' : '#64748b';
            btn.style.background = active ? '#fff' : 'none';
            btn.style.border = active ? '2px solid #e2e8f0' : '2px solid transparent';
            btn.style.borderBottom = active ? '2px solid #fff' : '2px solid transparent';
        });

        const mainPanel = root.querySelector('#ts-main-panel');
        const forumsPanel = root.querySelector('#ts-forums-panel');
        const statsPanel = root.querySelector('#ts-stats-panel');
        if (mainPanel) mainPanel.style.display = tab === 'main' ? '' : 'none';
        if (forumsPanel) forumsPanel.style.display = tab === 'forums' ? '' : 'none';
        if (statsPanel) statsPanel.style.display = tab === 'stats' ? '' : 'none';

        if (tab === 'forums' && !this._forumsLoaded) {
            this._forumsLoaded = true;
            this._initForumsPanel();
        }
        if (tab === 'stats') {
            this._statsLoaded = true;
            this._loadStatsPanel();
        }
    },

    /* ── Hero ── */
    _buildHero(status) {
        const state = status && status.state || 'idle';
        const dotClass = state === 'running' ? 'running' : (state === 'success' || state === 'partial') ? '' : 'off';
        const labelMap = { running:'运行中', stopped:'已停止', success:'上次成功', partial:'部分失败', failed:'上次失败', idle:'未运行' };

        const hero = document.createElement('div');
        hero.className = 'ts-hero';
        hero.innerHTML = `
<div class="ts-hero-left">
  <h1>🏮 贴吧签到</h1>
  <p>百度贴吧自动签到 · ImmortalWrt / OpenWrt 24.10</p>
</div>
<div class="ts-hero-badge" id="ts-run-hero-btn">
  <span class="dot ${dotClass}"></span>
  <span id="ts-hero-label">${labelMap[state] || state}</span>
</div>`;
        return hero;
    },

    /* ── Main 2-col grid: settings + schedule ── */
    _buildMainGrid() {
        const grid = document.createElement('div');
        grid.className = 'ts-grid';
        grid.appendChild(this._buildSettingsCard());
        grid.appendChild(this._buildScheduleCard());
        return grid;
    },

    _buildSettingsCard() {
        const card = this._card('⚙️', '全局设置');
        card.querySelector('.ts-card-body').innerHTML = `
<div class="ts-toggle-row">
  <div>
    <div class="ts-toggle-label">启用签到服务</div>
    <div class="ts-toggle-desc">关闭后定时任务不会执行</div>
  </div>
  <label class="ts-switch">
    <input type="checkbox" id="ts-enabled">
    <span class="ts-switch-track"></span>
  </label>
</div>
<div class="ts-toggle-row">
  <div>
    <div class="ts-toggle-label">自动取关封禁贴吧</div>
    <div class="ts-toggle-desc">签到时遇到封禁贴吧自动取消关注</div>
  </div>
  <label class="ts-switch">
    <input type="checkbox" id="ts-auto-unfollow">
    <span class="ts-switch-track"></span>
  </label>
</div>
<div class="ts-toggle-row">
  <div>
    <div class="ts-toggle-label">显示已签到日志</div>
    <div class="ts-toggle-desc">在日志中显示"今日已签到"条目</div>
  </div>
  <label class="ts-switch">
    <input type="checkbox" id="ts-show-signed">
    <span class="ts-switch-track"></span>
  </label>
</div>
<div class="ts-field" style="margin-top:14px">
  <label class="ts-label">代理地址（可选）</label>
  <input class="ts-input" id="ts-proxy" type="text" placeholder="http://127.0.0.1:7890">
</div>
<div class="ts-input-row">
  <div class="ts-field" style="flex:1">
    <label class="ts-label">超时（秒）</label>
    <input class="ts-input" id="ts-timeout" type="number" min="5" max="120" placeholder="20">
  </div>
  <div class="ts-field" style="flex:1">
    <label class="ts-label">最大重试</label>
    <input class="ts-input" id="ts-retries" type="number" min="1" max="10" placeholder="2">
  </div>
  <div class="ts-field" style="flex:1">
    <label class="ts-label">并发签到</label>
    <input class="ts-input" id="ts-concurrency" type="number" min="1" max="8" placeholder="1" title="同时进行的贴吧请求数，过大易触发百度限流">
  </div>
</div>
<div class="ts-input-row" style="margin-top:10px">
  <div class="ts-field" style="flex:1">
    <label class="ts-label">签到间隔下限（秒）</label>
    <input class="ts-input" id="ts-sign-delay-min" type="number" min="0" max="120" step="0.1" placeholder="1" title="每次成功签到后随机等待的下限；与上限一起控制请求节奏">
  </div>
  <div class="ts-field" style="flex:1">
    <label class="ts-label">签到间隔上限（秒）</label>
    <input class="ts-input" id="ts-sign-delay-max" type="number" min="0" max="120" step="0.1" placeholder="2" title="随机等待上限，须 ≥ 下限；并发为 1 时在贴吧之间也使用此区间">
  </div>
</div>
<div style="font-size:11px;color:var(--slate-400);margin-top:4px">对应 UCI：sign_delay_min / sign_delay_max。设为 0 表示该步骤不额外等待（仍可能受重试、限流等固定等待影响）。</div>
<div class="ts-field" style="margin-top:10px">
  <label class="ts-label">签到完成 Webhook（可选）</label>
  <input class="ts-input" id="ts-webhook" type="text" placeholder="https://example.com/hook — POST JSON">
  <div style="font-size:11px;color:var(--slate-400);margin-top:4px">任务正常结束时 POST 一次，含 overall、accounts、timestamp</div>
</div>
<div class="ts-field" style="margin-top:10px">
  <label class="ts-label">贴吧列表更新间隔（天）</label>
  <input class="ts-input" id="ts-forum-update-days" type="number" min="0" max="365" placeholder="7"
    style="max-width:120px">
  <div style="font-size:11px;color:var(--slate-400);margin-top:4px">签到时若列表超过此天数自动重新拉取，0 = 每次都拉取</div>
</div>
<div class="ts-field" style="margin-top:14px">
  <label class="ts-label">签到中 · 页面状态刷新间隔（秒）</label>
  <div class="ts-input-row" style="align-items:flex-end">
    <div class="ts-field" style="flex:1">
      <label class="ts-label" style="font-size:12px">前台标签页</label>
      <input class="ts-input" id="ts-poll-visible" type="number" min="2" max="30" placeholder="4" title="本页打开且可见时，轮询 status 的间隔">
    </div>
    <div class="ts-field" style="flex:1">
      <label class="ts-label" style="font-size:12px">后台/切走标签页</label>
      <input class="ts-input" id="ts-poll-hidden" type="number" min="5" max="120" placeholder="10" title="浏览器标签在后台时拉长间隔，减轻路由器负载">
    </div>
  </div>
  <div style="font-size:11px;color:var(--slate-400);margin-top:4px">仅在「运行状态」为运行中时轮询；空闲时不自动请求。保存后立即对下一轮轮询生效。</div>
</div>`;
        return card;
    },

    _buildScheduleCard() {
        const card = this._card('🕐', '定时计划');
        const hours = Array.from({length:24}, (_,i) => `<option value="${i}">${String(i).padStart(2,'0')} 时</option>`).join('');
        const mins  = [0,5,10,15,20,25,30,35,40,45,50,55].map(m => `<option value="${m}">${String(m).padStart(2,'0')} 分</option>`).join('');
        card.querySelector('.ts-card-body').innerHTML = `
<div class="ts-field">
  <label class="ts-label">每天执行时间</label>
  <div class="ts-input-row">
    <select class="ts-select" id="ts-cron-hour">${hours}</select>
    <select class="ts-select" id="ts-cron-min">${mins}</select>
  </div>
  <div style="margin-top:8px;font-size:12px;color:var(--slate-400)" id="ts-cron-preview"></div>
</div>
<div class="ts-field" style="margin-top:6px">
  <label class="ts-label">黑名单贴吧</label>
  <div id="ts-tags" class="ts-tags"></div>
  <div class="ts-tag-input-row">
    <input class="ts-input" id="ts-tag-input" type="text" placeholder="输入贴吧名称后回车">
    <button class="ts-tag-add" id="ts-tag-add-btn">添加</button>
  </div>
</div>
<div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center">
  <button class="ts-btn ts-btn-run" id="ts-run-btn" style="flex:1;min-width:140px">
    <span id="ts-run-icon">▶</span> 立即签到
  </button>
  <button type="button" class="ts-btn ts-btn-secondary" id="ts-resume-btn" style="flex:1;min-width:120px" title="跳过今日已成功签到的贴吧，从未完成处继续">
    ⏩ 断点续签
  </button>
  <button type="button" class="ts-btn" id="ts-stop-btn" style="display:none;flex:1;min-width:120px;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca" title="结束当前网络请求后即停止；与定时签到冲突时此前会失效，现已修复">
    ■ 停止签到
  </button>
</div>`;
        return card;
    },

    /* ── Accounts card ── */
    _buildAccountsCard() {
        const card = this._card('👤', '账号管理', '所有启用的账号将依次执行签到');
        card.style.marginBottom = '16px';
        card.querySelector('.ts-card-body').innerHTML = `
<div class="ts-account-list" id="ts-account-list"></div>
<button class="ts-add-btn" id="ts-add-account" style="margin-top:10px">
  <span style="font-size:18px;line-height:1">＋</span> 添加账号
</button>`;
        return card;
    },

    /* ── Status + log card ── */
    _buildStatusCard(status, logText) {
        const card = this._card('📊', '运行状态');
        card.style.marginBottom = '0';
        const body = card.querySelector('.ts-card-body');
        body.id = 'ts-status-body';
        body.innerHTML = this._renderStatusHTML(status, logText);
        return card;
    },

    _buildForumsCard() {
        const card = this._card('📋', '贴吧列表', '账号详情与签到结果合并展示');
        card.style.marginBottom = '16px';
        const body = card.querySelector('.ts-card-body');
        body.classList.add('ts-forums-section');
        body.innerHTML = `
<div class="ts-forums-head">
  <div>
    <div class="ts-card-title" style="margin:0">已关注贴吧</div>
    <div class="meta">保留 forums.js 能力，但直接在当前页面展示</div>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
    <button class="ts-btn ts-btn-secondary" id="ts-forums-update-btn" type="button">🔄 更新列表</button>
    <button class="ts-btn ts-btn-secondary" id="ts-forums-debug-json-btn" type="button" title="在浏览器 F12 → Console 输出 c/f/forum/like 第 1 页原始 JSON">🐛 调试 JSON</button>
  </div>
</div>
<div class="ts-forums-account-tabs" id="ts-forums-account-tabs"></div>
<div class="ts-card" style="margin:0;box-shadow:none;border-color:var(--slate-200)">
  <div class="ts-forums-stats">
    <div class="ts-forums-stat"><div class="ts-forums-stat-num" id="ts-forums-total">—</div><div class="ts-forums-stat-label">总贴吧</div></div>
    <div class="ts-forums-stat"><div class="ts-forums-stat-num green" id="ts-forums-signed">—</div><div class="ts-forums-stat-label">已签到</div></div>
    <div class="ts-forums-stat"><div class="ts-forums-stat-num gray" id="ts-forums-unsigned">—</div><div class="ts-forums-stat-label">未签到</div></div>
    <div class="ts-forums-stat"><div class="ts-forums-stat-num red" id="ts-forums-banned">—</div><div class="ts-forums-stat-label">封禁</div></div>
    <div class="ts-forums-stat"><div class="ts-forums-stat-num" id="ts-forums-rate" style="color:#7c3aed">—</div><div class="ts-forums-stat-label">签到率</div></div>
    <div class="ts-forums-updated" id="ts-forums-updated"></div>
  </div>
  <div class="ts-forums-toolbar">
    <input class="ts-forums-search" id="ts-forums-search" type="text" placeholder="搜索贴吧名称...">
    <button class="ts-forums-filter active" data-forums-filter="all">全部</button>
    <button class="ts-forums-filter" data-forums-filter="signed">已签到</button>
    <button class="ts-forums-filter" data-forums-filter="unsigned">未签到</button>
    <button class="ts-forums-filter" data-forums-filter="banned">封禁</button>
    <button class="ts-forums-filter" data-forums-filter="blacklist">黑名单</button>
  </div>
<div class="ts-forums-wrap" id="ts-forums-wrap">
    <div class="ts-forums-empty">正在准备贴吧列表...</div>
  </div>
  <div class="ts-forums-console">
    <div class="ts-forums-console-head">
      <span class="ts-forums-console-title">更新控制台</span>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="ts-forums-console-status" id="ts-forums-console-status">等待操作</span>
        <div class="ts-forums-console-actions">
          <button class="ts-forums-console-btn" id="ts-forums-console-refresh">刷新日志</button>
          <button class="ts-forums-console-btn" id="ts-forums-console-clear">清空显示</button>
        </div>
      </div>
    </div>
    <div class="ts-forums-console-body" id="ts-forums-console-body">等待列表更新日志...</div>
  </div>
</div>`;
        return card;
    },

    _buildStatsCard() {
        const card = this._card('📈', '最近 10 天签到', '与同目录 sign_result 使用相同 UTC 日期键；同一天多次运行仅保留最后一次摘要');
        card.style.marginBottom = '16px';
        const body = card.querySelector('.ts-card-body');
        body.id = 'ts-stats-body';
        body.innerHTML = '<div id="ts-stats-inner" class="ts-stats-wrap"><p class="ts-stats-hint">打开本页后将自动加载历史记录。</p></div>';
        return card;
    },

    /* ── Save bar ── */
    _buildSaveBar() {
        const bar = document.createElement('div');
        bar.className = 'ts-save-bar';
        bar.innerHTML = `
<span class="ts-save-hint" id="ts-save-hint">所有更改将在保存后生效</span>
<div class="ts-actions">
  <button class="ts-btn ts-btn-secondary" id="ts-reset-btn">撤销更改</button>
  <button class="ts-btn ts-btn-primary" id="ts-save-btn">
    <span>💾</span> 保存配置
  </button>
</div>`;
        return bar;
    },

    /* ── Card helper ── */
    _card(icon, title, desc) {
        const c = document.createElement('div');
        c.className = 'ts-card';
        c.innerHTML = `
<div class="ts-card-head">
  <div class="ts-card-icon">${icon}</div>
  <div>
    <div class="ts-card-title">${title}</div>
    ${desc ? `<div style="font-size:12px;color:var(--slate-400);margin-top:1px">${desc}</div>` : ''}
  </div>
</div>
<div class="ts-card-body"></div>`;
        return c;
    },
});
