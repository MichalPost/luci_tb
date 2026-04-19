'use strict';
'require view';
'require uci';
'require rpc';
'require ui';

const callForumsList   = rpc.declare({ object: 'tieba-sign', method: 'forums_list',   params: ['sid'], expect: {} });
const callSignResult   = rpc.declare({ object: 'tieba-sign', method: 'sign_result',   params: ['sid'], expect: {} });
const callForumsUpdate = rpc.declare({ object: 'tieba-sign', method: 'forums_update', params: ['sid'], expect: {} });
const callUnfollow     = rpc.declare({ object: 'tieba-sign', method: 'forum_unfollow',params: ['sid','name','fid'], expect: {} });

const FORUMS_CSS = `
#ts-forums * { box-sizing: border-box; font-family: 'Inter','PingFang SC','Microsoft YaHei',sans-serif; }
#ts-forums {
  max-width: 1200px; margin: 0 auto; padding: 0 0 48px; color: #1e293b;
}
.tf-header {
  background: linear-gradient(135deg,#1d4ed8,#2563eb 40%,#0ea5e9);
  border-radius: 12px; padding: 28px 36px; margin-bottom: 20px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  position: relative; overflow: hidden;
}
.tf-header::before {
  content:''; position:absolute; inset:0;
  background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E");
}
.tf-header h1 { margin:0 0 4px; font-size:22px; font-weight:700; color:#fff; position:relative; }
.tf-header p  { margin:0; font-size:13px; color:rgba(255,255,255,.7); position:relative; }
.tf-header-right { position:relative; display:flex; gap:8px; flex-wrap:wrap; }

.tf-card {
  background:#fff; border:1px solid #e2e8f0; border-radius:12px;
  box-shadow:0 1px 3px rgba(0,0,0,.08); margin-bottom:16px; overflow:hidden;
}
.tf-card-head {
  padding:14px 20px; border-bottom:1px solid #f1f5f9;
  display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
}
.tf-card-title { font-size:14px; font-weight:600; color:#334155; }

/* Stats bar */
.tf-stats { display:flex; gap:12px; flex-wrap:wrap; padding:16px 20px; border-bottom:1px solid #f1f5f9; }
.tf-stat { text-align:center; min-width:80px; }
.tf-stat-num { font-size:22px; font-weight:700; color:#2563eb; line-height:1; }
.tf-stat-num.green { color:#059669; }
.tf-stat-num.gray  { color:#94a3b8; }
.tf-stat-num.red   { color:#dc2626; }
.tf-stat-label { font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:.4px; margin-top:3px; }

/* Toolbar */
.tf-toolbar {
  padding:12px 20px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;
  border-bottom:1px solid #f1f5f9;
}
.tf-search {
  flex:1; min-width:160px; padding:8px 12px;
  border:1.5px solid #e2e8f0; border-radius:8px; font-size:13px; outline:none;
  transition:border-color .18s;
}
.tf-search:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.12); }
.tf-filter-btn {
  padding:7px 14px; border-radius:20px; border:1.5px solid #e2e8f0;
  background:none; font-size:12px; font-weight:600; color:#64748b; cursor:pointer;
  transition:all .18s; white-space:nowrap;
}
.tf-filter-btn.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }

/* Table */
.tf-table { width:100%; border-collapse:collapse; }
.tf-table th {
  padding:10px 16px; text-align:left; font-size:11px; font-weight:600;
  color:#94a3b8; text-transform:uppercase; letter-spacing:.4px;
  background:#f8fafc; border-bottom:1px solid #e2e8f0;
}
.tf-table td {
  padding:10px 16px; font-size:13px; color:#334155;
  border-bottom:1px solid #f1f5f9; vertical-align:middle;
}
.tf-table tr:last-child td { border-bottom:none; }
.tf-table tr:hover td { background:#f8fafc; }
.tf-name { font-weight:500; }
.tf-badge {
  display:inline-block; padding:2px 8px; border-radius:20px;
  font-size:11px; font-weight:600;
}
.tf-badge.signed  { background:#dcfce7; color:#15803d; }
.tf-badge.already { background:#dbeafe; color:#1d4ed8; }
.tf-badge.unsigned{ background:#f1f5f9; color:#64748b; }
.tf-badge.banned  { background:#fee2e2; color:#991b1b; }
.tf-badge.bl      { background:#fef3c7; color:#92400e; }

.tf-btn {
  padding:5px 12px; border-radius:6px; border:1.5px solid #e2e8f0;
  background:none; font-size:12px; font-weight:500; cursor:pointer;
  transition:all .18s; white-space:nowrap;
}
.tf-btn:hover { background:#f1f5f9; }
.tf-btn.danger { color:#dc2626; border-color:#fca5a5; }
.tf-btn.danger:hover { background:#fee2e2; }
.tf-btn.primary { background:#3b82f6; color:#fff; border-color:#3b82f6; }
.tf-btn.primary:hover { background:#2563eb; }

.tf-empty { padding:48px; text-align:center; color:#94a3b8; font-size:14px; }
.tf-updated { font-size:12px; color:#94a3b8; }
.tf-acc-tab {
  padding:8px 16px; border-radius:8px 8px 0 0; border:1.5px solid #e2e8f0;
  border-bottom:none; background:#f8fafc; font-size:13px; font-weight:500;
  color:#64748b; cursor:pointer; transition:all .18s;
}
.tf-acc-tab.active { background:#fff; color:#1e293b; border-color:#3b82f6; border-bottom-color:#fff; }
.tf-acc-tabs { display:flex; gap:4px; padding:16px 20px 0; border-bottom:1px solid #e2e8f0; }
`;

return view.extend({

    _currentSid: '',
    _accounts: [],
    _forums: [],
    _signResults: {},
    _filter: 'all',
    _search: '',

    load() {
        return uci.load('tieba-sign');
    },

    render() {
        if (!document.getElementById('tf-styles')) {
            const s = document.createElement('style');
            s.id = 'tf-styles';
            s.textContent = FORUMS_CSS;
            document.head.appendChild(s);
        }

        // Override LuCI container
        if (!document.getElementById('ts-override')) {
            const o = document.createElement('style');
            o.id = 'ts-override';
            o.textContent = '#view{max-width:none!important;padding:20px 24px!important}';
            document.head.appendChild(o);
        }

        // Load accounts
        this._accounts = [];
        const sections = uci.sections('tieba-sign', 'account');
        sections.forEach((s, idx) => {
            if (s.enabled === '1') {
                this._accounts.push({ sid: `@account[${idx}]`, note: s.note || s['.name'] });
            }
        });

        const root = document.createElement('div');
        root.id = 'ts-forums';
        root.appendChild(this._buildHeader());
        root.appendChild(this._buildBody());

        this._root = root;

        if (this._accounts.length > 0) {
            this._currentSid = this._accounts[0].sid;
            setTimeout(() => this._loadForums(), 0);
        }

        return root;
    },

    _buildHeader() {
        const h = document.createElement('div');
        h.className = 'tf-header';
        h.innerHTML = `
<div>
  <h1>📋 贴吧列表</h1>
  <p>管理关注的贴吧，查看签到状态</p>
</div>
<div class="tf-header-right">
  <button class="tf-btn primary" id="tf-update-btn">🔄 更新列表</button>
</div>`;
        return h;
    },

    _buildBody() {
        const wrap = document.createElement('div');
        wrap.id = 'tf-body';

        if (this._accounts.length === 0) {
            wrap.innerHTML = '<div class="tf-card"><div class="tf-empty">暂无启用的账号，请先在主页配置账号</div></div>';
            return wrap;
        }

        // Account tabs
        const tabs = document.createElement('div');
        tabs.className = 'tf-acc-tabs';
        tabs.id = 'tf-acc-tabs';
        this._accounts.forEach((acc, i) => {
            const tab = document.createElement('button');
            tab.className = 'tf-acc-tab' + (i === 0 ? ' active' : '');
            tab.dataset.sid = acc.sid;
            tab.textContent = acc.note;
            tabs.appendChild(tab);
        });
        wrap.appendChild(tabs);

        // Main card
        const card = document.createElement('div');
        card.className = 'tf-card';
        card.style.borderRadius = '0 12px 12px 12px';
        card.innerHTML = `
<div class="tf-stats" id="tf-stats">
  <div class="tf-stat"><div class="tf-stat-num" id="tf-cnt-total">—</div><div class="tf-stat-label">总贴吧</div></div>
  <div class="tf-stat"><div class="tf-stat-num green" id="tf-cnt-signed">—</div><div class="tf-stat-label">已签到</div></div>
  <div class="tf-stat"><div class="tf-stat-num gray" id="tf-cnt-unsigned">—</div><div class="tf-stat-label">未签到</div></div>
  <div class="tf-stat"><div class="tf-stat-num red" id="tf-cnt-banned">—</div><div class="tf-stat-label">封禁</div></div>
  <div class="tf-stat"><div class="tf-stat-num" id="tf-sign-rate" style="color:#7c3aed">—</div><div class="tf-stat-label">签到率</div></div>
  <div style="flex:1"></div>
  <div class="tf-updated" id="tf-updated"></div>
</div>
<div class="tf-toolbar">
  <input class="tf-search" id="tf-search" type="text" placeholder="🔍 搜索贴吧名称...">
  <button class="tf-filter-btn active" data-f="all">全部</button>
  <button class="tf-filter-btn" data-f="signed">已签到</button>
  <button class="tf-filter-btn" data-f="unsigned">未签到</button>
  <button class="tf-filter-btn" data-f="banned">封禁</button>
  <button class="tf-filter-btn" data-f="blacklist">黑名单</button>
</div>
<div id="tf-table-wrap" style="overflow-x:auto">
  <div class="tf-empty">加载中...</div>
</div>`;
        wrap.appendChild(card);
        return wrap;
    },

    // ── Data loading ──────────────────────────────────────────────────────────

    async _loadForums() {
        const sid = this._currentSid;
        if (!sid) return;

        const tableWrap = this._root.querySelector('#tf-table-wrap');
        if (tableWrap) tableWrap.innerHTML = '<div class="tf-empty">加载中...</div>';

        try {
            const [listRes, signRes] = await Promise.all([
                callForumsList(sid),
                callSignResult(sid),
            ]);

            if (listRes && listRes.error === 'no_data') {
                if (tableWrap) tableWrap.innerHTML = `
<div class="tf-empty">
  暂无贴吧列表数据<br>
  <button class="tf-btn primary" style="margin-top:12px" id="tf-fetch-now">立即拉取</button>
</div>`;
                tableWrap?.querySelector('#tf-fetch-now')?.addEventListener('click', () => this._doUpdate());
                return;
            }

            this._forums = (listRes && listRes.forums) ? listRes.forums : [];
            this._signResults = (signRes && signRes.results) ? signRes.results : {};
            const today = new Date().toISOString().slice(0, 10);
            if (signRes && signRes.date !== today) this._signResults = {};

            const updated = listRes && listRes.updated ? listRes.updated : '';
            const el = this._root.querySelector('#tf-updated');
            if (el) el.textContent = updated ? `更新于 ${updated}` : '';

            this._renderTable();
            this._bindTableEvents();
        } catch (e) {
            if (tableWrap) tableWrap.innerHTML = `<div class="tf-empty">加载失败: ${e.message}</div>`;
        }

        this._bindHeaderEvents();
    },

    // ── Render table ──────────────────────────────────────────────────────────

    _renderTable() {
        const blacklist = this._getBlacklist();
        const search = this._search.toLowerCase();
        const filter = this._filter;

        let signed = 0, unsigned = 0, banned = 0;
        const rows = [];

        for (const f of this._forums) {
            const sr = this._signResults[f.id] || null;
            const inBl = blacklist.includes(f.name);
            const isBanned = f.banned === 1 || (sr && sr.status === 'banned');
            let status = 'unsigned';
            if (sr) {
                if (sr.status === 'signed') status = 'signed';
                else if (sr.status === 'already') status = 'already';
                else if (sr.status === 'banned') status = 'banned';
            }
            if (isBanned) status = 'banned';

            if (status === 'signed' || status === 'already') signed++;
            else if (status === 'banned') banned++;
            else unsigned++;

            // Filter
            if (filter === 'signed'    && status !== 'signed' && status !== 'already') continue;
            if (filter === 'unsigned'  && (status === 'signed' || status === 'already' || status === 'banned')) continue;
            if (filter === 'banned'    && status !== 'banned') continue;
            if (filter === 'blacklist' && !inBl) continue;
            if (search && !f.name.toLowerCase().includes(search)) continue;

            rows.push({ f, sr, status, inBl, isBanned });
        }

        const total = this._forums.length;
        const rate = total > 0 ? Math.round((signed / total) * 100) : 0;

        // Update stats
        const q = id => this._root.querySelector('#' + id);
        if (q('tf-cnt-total'))   q('tf-cnt-total').textContent   = total;
        if (q('tf-cnt-signed'))  q('tf-cnt-signed').textContent  = signed;
        if (q('tf-cnt-unsigned'))q('tf-cnt-unsigned').textContent = unsigned;
        if (q('tf-cnt-banned'))  q('tf-cnt-banned').textContent  = banned;
        if (q('tf-sign-rate'))   q('tf-sign-rate').textContent   = rate + '%';

        const wrap = this._root.querySelector('#tf-table-wrap');
        if (!wrap) return;

        if (rows.length === 0) {
            wrap.innerHTML = '<div class="tf-empty">没有符合条件的贴吧</div>';
            return;
        }

        const statusLabel = { signed:'已签到', already:'已签到', unsigned:'未签到', banned:'封禁' };
        const statusClass = { signed:'signed', already:'already', unsigned:'unsigned', banned:'banned' };

        let html = `<table class="tf-table">
<thead><tr>
  <th>贴吧名称</th><th>等级</th><th>粉丝数</th><th>签到状态</th><th>经验</th><th>排名</th><th>操作</th>
</tr></thead><tbody>`;

        for (const { f, sr, status, inBl, isBanned } of rows) {
            const exp  = sr ? sr.exp  : '—';
            const rank = sr ? sr.rank : '—';
            const fans = f.fans > 10000 ? (f.fans / 10000).toFixed(1) + 'w' : f.fans;
            const esc  = s => String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');

            let badges = `<span class="tf-badge ${statusClass[status]}">${statusLabel[status]}</span>`;
            if (inBl) badges += ' <span class="tf-badge bl">黑名单</span>';

            let actions = '';
            if (inBl) {
                actions += `<button class="tf-btn" data-action="unbl" data-name="${esc(f.name)}">移出黑名单</button> `;
            } else {
                actions += `<button class="tf-btn" data-action="addbl" data-name="${esc(f.name)}">加入黑名单</button> `;
            }
            if (isBanned) {
                actions += `<button class="tf-btn danger" data-action="unfollow" data-name="${esc(f.name)}" data-fid="${f.id}">取消关注</button>`;
            }

            html += `<tr>
  <td class="tf-name">${esc(f.name)}</td>
  <td>Lv.${f.level || 0}</td>
  <td>${fans}</td>
  <td>${badges}</td>
  <td>${exp === 0 ? '—' : '+' + exp}</td>
  <td>${rank === 0 ? '—' : '#' + rank}</td>
  <td>${actions}</td>
</tr>`;
        }
        html += '</tbody></table>';
        wrap.innerHTML = html;
    },

    // ── Events ────────────────────────────────────────────────────────────────

    _bindHeaderEvents() {
        this._root.querySelector('#tf-update-btn')?.addEventListener('click', () => this._doUpdate());

        // Account tabs
        this._root.querySelectorAll('.tf-acc-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this._root.querySelectorAll('.tf-acc-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this._currentSid = tab.dataset.sid;
                this._forums = []; this._signResults = {};
                this._renderTable();
                this._loadForums();
            });
        });
    },

    _bindTableEvents() {
        // Search
        this._root.querySelector('#tf-search')?.addEventListener('input', e => {
            this._search = e.target.value;
            this._renderTable();
            this._bindTableEvents();
        });

        // Filter buttons
        this._root.querySelectorAll('.tf-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._root.querySelectorAll('.tf-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._filter = btn.dataset.f;
                this._renderTable();
                this._bindTableEvents();
            });
        });

        // Table action buttons
        this._root.querySelector('#tf-table-wrap')?.addEventListener('click', async e => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const name   = btn.dataset.name;
            const fid    = btn.dataset.fid;

            if (action === 'addbl') {
                const bl = this._getBlacklist();
                if (!bl.includes(name)) {
                    bl.push(name);
                    this._setBlacklist(bl);
                    this._toast(`已将「${name}」加入黑名单`, 'ok');
                    this._renderTable(); this._bindTableEvents();
                }
            } else if (action === 'unbl') {
                const bl = this._getBlacklist().filter(x => x !== name);
                this._setBlacklist(bl);
                this._toast(`已将「${name}」移出黑名单`, 'ok');
                this._renderTable(); this._bindTableEvents();
            } else if (action === 'unfollow') {
                if (!confirm(`确定取消关注「${name}」？`)) return;
                btn.disabled = true; btn.textContent = '处理中...';
                try {
                    const res = await callUnfollow(this._currentSid, name, fid);
                    if (res && res.result === 'ok') {
                        this._toast(`已取消关注「${name}」`, 'ok');
                        await this._loadForums();
                    } else {
                        this._toast('取消关注失败', 'error');
                        btn.disabled = false; btn.textContent = '取消关注';
                    }
                } catch (err) {
                    this._toast('请求失败: ' + err.message, 'error');
                    btn.disabled = false; btn.textContent = '取消关注';
                }
            }
        });
    },

    async _doUpdate() {
        const btn = this._root.querySelector('#tf-update-btn');
        if (btn) { btn.disabled = true; btn.textContent = '更新中...'; }
        try {
            await callForumsUpdate(this._currentSid);
            this._toast('列表更新任务已启动，请稍后刷新', 'ok');
            // Poll until update completes (simple: wait 5s then reload)
            setTimeout(() => this._loadForums(), 8000);
        } catch (e) {
            this._toast('启动失败: ' + e.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '🔄 更新列表'; }
        }
    },

    // ── Blacklist helpers (read/write UCI) ────────────────────────────────────

    _getBlacklist() {
        const bl = uci.get('tieba-sign', 'main', 'blacklist');
        if (Array.isArray(bl)) return [...bl];
        if (bl) return [bl];
        return [];
    },

    _setBlacklist(list) {
        if (list.length > 0) uci.set('tieba-sign', 'main', 'blacklist', list);
        else uci.unset('tieba-sign', 'main', 'blacklist');
        uci.save().then(() => uci.apply(10).catch(() => {}));
    },

    // ── Toast ─────────────────────────────────────────────────────────────────

    _toast(msg, type = 'ok') {
        let wrap = document.getElementById('ts-toast-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'ts-toast-wrap';
            wrap.className = 'ts-toast-wrap';
            document.body.appendChild(wrap);
        }
        const icons = { ok:'✅', error:'❌', warn:'⚠️' };
        const t = document.createElement('div');
        t.className = `ts-toast ${type}`;
        t.innerHTML = `<span>${icons[type]||'•'}</span><span>${String(msg).replace(/</g,'&lt;')}</span>`;
        wrap.appendChild(t);
        setTimeout(() => { t.style.animation='fadeOut .3s ease forwards'; setTimeout(()=>t.remove(),300); }, 3000);
    },

    handleSave: null,
    handleSaveApply: null,
    handleReset: null,
});
