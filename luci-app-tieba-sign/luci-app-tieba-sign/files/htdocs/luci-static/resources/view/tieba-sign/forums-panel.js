'use strict';
'require baseclass';
'require uci';
'require view.tieba-sign.rpc as tsRpc';

function _collect(inst) {
    const r = {};
    let p = inst;
    while (p && p !== Object.prototype) {
        for (const k of Object.getOwnPropertyNames(p))
            if (k !== 'constructor' && !(k in r)) r[k] = p[k];
        p = Object.getPrototypeOf(p);
    }
    return r;
}

const {
    callForumsList,
    callSignResult,
    callForumsUpdate,
    callForumsDebugRaw,
    callUnfollow,
    callLog,
    callClearLog,
    FORUMS_UPDATE_TIMEOUT_MS,
} = _collect(tsRpc);

/** 解析 tieba-sign RPC 返回值（ubus 元组、result 包裹、纯对象） */
function unwrapTiebaRpcObject(res) {
    if (res == null) return null;
    if (Array.isArray(res) && res.length >= 2 && typeof res[0] === 'number') {
        if (res[0] !== 0)
            return { ok: false, error: `ubus_${res[0]}`, _tuple: res };
        const inner = res[1];
        return typeof inner === 'object' && inner !== null ? inner : { _data: inner };
    }
    if (res.result !== undefined) {
        const r = res.result;
        if (typeof r === 'object' && r !== null && !Array.isArray(r)) return r;
        if (typeof r === 'string') {
            try {
                return JSON.parse(r);
            } catch (_) {
                return res;
            }
        }
        return res;
    }
    return res;
}

return baseclass.extend({
    /* ── Forums panel ── */
    _initForumsPanel() {
        const savedAccounts = uci.sections('tieba-sign', 'account')
            .map((sec, idx) => ({ sec, idx }))
            .filter(({ sec }) => sec.enabled === '1')
            .map(({ sec, idx }) => ({ sid: `@account[${idx}]`, note: sec.note || sec['.name'] }));

        this._forumsAccounts = savedAccounts;
        if (!savedAccounts.length) {
            const tabs = this._root.querySelector('#ts-forums-account-tabs');
            const wrap = this._root.querySelector('#ts-forums-wrap');
            if (tabs) tabs.innerHTML = '';
            if (wrap) wrap.innerHTML = '<div class="ts-forums-empty">暂无启用账号，请先保存账号配置</div>';
            this._setForumsConsoleStatus('暂无启用账号');
            this._setForumsConsole('暂无启用账号，请先保存配置。');
            return;
        }

        if (!savedAccounts.some(acc => acc.sid === this._forumsCurrentSid))
            this._forumsCurrentSid = savedAccounts[0].sid;

        this._renderForumsTabs();
        this._bindForumsEvents();
        this._setForumsConsoleStatus('等待操作');
        this._setForumsConsole('点击“更新列表”后，这里会显示与当前账号相关的调试日志。');
        this._loadForums();
    },

    _renderForumsTabs() {
        const tabs = this._root.querySelector('#ts-forums-account-tabs');
        if (!tabs) return;
        tabs.innerHTML = '';

        this._forumsAccounts.forEach(acc => {
            const btn = document.createElement('button');
            btn.className = 'ts-forums-account-tab' + (acc.sid === this._forumsCurrentSid ? ' active' : '');
            btn.dataset.sid = acc.sid;
            btn.textContent = acc.note;
            tabs.appendChild(btn);
        });
    },

    async _loadForums() {
        const sid = this._forumsCurrentSid;
        const wrap = this._root.querySelector('#ts-forums-wrap');
        if (!sid || !wrap) return null;

        if (!this._forumsUpdating)
            wrap.innerHTML = '<div class="ts-forums-empty">加载中...</div>';

        try {
            const [listRes, signRes] = await Promise.all([
                callForumsList(sid),
                callSignResult(sid),
            ]);

            if (listRes && listRes.error === 'no_data') {
                wrap.innerHTML = '<div class="ts-forums-empty">暂无贴吧列表数据，请先点击上方“更新列表”</div>';
                this._forums = [];
                this._signResults = {};
                this._renderForumsTable();
                return listRes || null;
            }

            this._forums = Array.isArray(listRes && listRes.forums) ? listRes.forums : [];
            this._signResults = (signRes && signRes.results) ? signRes.results : {};
            this._forumsPage = 0;

            const updated = this._root.querySelector('#ts-forums-updated');
            if (updated) updated.textContent = listRes && listRes.updated ? `更新时间：${listRes.updated}` : '';

            this._renderForumsTable();
            return listRes || null;
        } catch (e) {
            wrap.innerHTML = `<div class="ts-forums-empty">加载失败：${this._esc(e.message)}</div>`;
            return null;
        }
    },

    _renderForumsTable() {
        const wrap = this._root.querySelector('#ts-forums-wrap');
        if (!wrap) return;

        const blacklist = Array.isArray(this._blacklist) ? this._blacklist : [];
        const search = (this._forumsSearch || '').trim().toLowerCase();
        const filter = this._forumsFilter || 'all';

        let signed = 0, unsigned = 0, banned = 0;
        const rows = [];

        for (const forum of this._forums) {
            const result = this._signResults[forum.id] || null;
            const inBlacklist = blacklist.includes(forum.name);
            const isBanned = forum.banned === 1 || (result && result.status === 'banned');

            let status = 'unsigned';
            if (result) {
                if (result.status === 'signed') status = 'signed';
                else if (result.status === 'already') status = 'already';
                else if (result.status === 'banned') status = 'banned';
            }
            if (isBanned) status = 'banned';

            if (status === 'signed' || status === 'already') signed++;
            else if (status === 'banned') banned++;
            else unsigned++;

            if (filter === 'signed' && status !== 'signed' && status !== 'already') continue;
            if (filter === 'unsigned' && (status === 'signed' || status === 'already' || status === 'banned')) continue;
            if (filter === 'banned' && status !== 'banned') continue;
            if (filter === 'blacklist' && !inBlacklist) continue;
            if (search && !String(forum.name || '').toLowerCase().includes(search)) continue;

            rows.push({ forum, result, status, inBlacklist, isBanned });
        }

        const total = this._forums.length;
        const rate = total > 0 ? Math.round((signed / total) * 100) : 0;
        const setText = (id, value) => {
            const el = this._root.querySelector('#' + id);
            if (el) el.textContent = value;
        };
        setText('ts-forums-total', total);
        setText('ts-forums-signed', signed);
        setText('ts-forums-unsigned', unsigned);
        setText('ts-forums-banned', banned);
        setText('ts-forums-rate', rate + '%');

        if (!rows.length) {
            wrap.innerHTML = '<div class="ts-forums-empty">没有符合条件的贴吧</div>';
            return;
        }

        const PAGE_SIZE = 80;
        if (typeof this._forumsPage !== 'number' || this._forumsPage < 0) this._forumsPage = 0;
        this._forumsRowsTotal = rows.length;
        const np = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        if (this._forumsPage >= np) this._forumsPage = np - 1;
        const p0 = this._forumsPage * PAGE_SIZE;
        const pageRows = rows.slice(p0, p0 + PAGE_SIZE);

        const statusLabel = { signed: '已签到', already: '已签到', unsigned: '未签到', banned: '封禁' };
        const statusClass = { signed: 'signed', already: 'already', unsigned: 'unsigned', banned: 'banned' };

        let pagerHtml = '';
        if (rows.length > PAGE_SIZE) {
            pagerHtml = `<div class="ts-forums-pager" style="margin:8px 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
<span style="font-size:12px;color:var(--slate-500)">第 ${this._forumsPage + 1} / ${np} 页（每页 ${PAGE_SIZE} 条，共 ${rows.length} 条）</span>
<button type="button" class="ts-btn ts-btn-secondary" data-forums-page="prev" style="padding:4px 10px;font-size:12px"${this._forumsPage <= 0 ? ' disabled' : ''}>上一页</button>
<button type="button" class="ts-btn ts-btn-secondary" data-forums-page="next" style="padding:4px 10px;font-size:12px"${this._forumsPage >= np - 1 ? ' disabled' : ''}>下一页</button>
</div>`;
        }

        let html = pagerHtml + `<table class="ts-forums-table"><thead><tr>
<th>贴吧名称</th><th>等级</th><th>粉丝数</th><th>签到状态</th><th>经验</th><th>排名</th><th>操作</th>
</tr></thead><tbody>`;

        for (const { forum, result, status, inBlacklist, isBanned } of pageRows) {
            const exp = result ? result.exp : '—';
            const rank = result ? result.rank : '—';
            const fans = forum.fans > 10000 ? (forum.fans / 10000).toFixed(1) + 'w' : (forum.fans || 0);

            let badges = `<span class="ts-forums-badge ${statusClass[status]}">${statusLabel[status]}</span>`;
            if (inBlacklist) badges += ' <span class="ts-forums-badge blacklist">黑名单</span>';

            let actions = '<div class="ts-forums-actions">';
            if (inBlacklist)
                actions += `<button class="ts-btn ts-btn-secondary" data-forums-action="unblacklist" data-name="${this._escAttr(forum.name)}">移出黑名单</button>`;
            else
                actions += `<button class="ts-btn ts-btn-secondary" data-forums-action="blacklist" data-name="${this._escAttr(forum.name)}">加入黑名单</button>`;
            if (isBanned)
                actions += `<button class="ts-btn ts-btn-secondary" data-forums-action="unfollow" data-name="${this._escAttr(forum.name)}" data-fid="${forum.id}">取消关注</button>`;
            actions += '</div>';

            html += `<tr>
<td class="ts-forums-name">${this._esc(forum.name)}</td>
<td>Lv.${forum.level || 0}</td>
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

    _bindForumsEvents() {
        if (this._forumsEventsBound) return;
        this._forumsEventsBound = true;

        this._root.querySelector('#ts-forums-update-btn')?.addEventListener('click', () => this._doForumsUpdate());
        this._root.querySelector('#ts-forums-debug-json-btn')?.addEventListener('click', () => this._doForumsDebugJson());
        this._root.querySelector('#ts-forums-console-refresh')?.addEventListener('click', () => {
            this._forumsConsoleCleared = false;
            this._refreshForumsConsole();
        });
        this._root.querySelector('#ts-forums-console-clear')?.addEventListener('click', async () => {
            this._forumsConsoleLines = [];
            this._forumsConsoleCleared = true;
            this._setForumsConsole('控制台已清空。');
            this._setForumsConsoleStatus('清空中...');
            try {
                await callClearLog();
                this._setForumsConsoleStatus('等待操作');
            } catch (e) {
                this._setForumsConsoleStatus('等待操作');
            }
        });
        this._root.querySelector('#ts-forums-search')?.addEventListener('input', e => {
            this._forumsSearch = e.target.value || '';
            this._forumsPage = 0;
            this._renderForumsTable();
        });

        this._root.querySelectorAll('[data-forums-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._root.querySelectorAll('[data-forums-filter]').forEach(item => item.classList.remove('active'));
                btn.classList.add('active');
                this._forumsFilter = btn.dataset.forumsFilter;
                this._forumsPage = 0;
                this._renderForumsTable();
            });
        });

        this._root.querySelector('#ts-forums-account-tabs')?.addEventListener('click', e => {
            const btn = e.target.closest('.ts-forums-account-tab');
            if (!btn) return;
            this._forumsCurrentSid = btn.dataset.sid;
            this._forums = [];
            this._signResults = {};
            this._forumsSearch = '';
            const input = this._root.querySelector('#ts-forums-search');
            if (input) input.value = '';
            this._renderForumsTabs();
            this._setForumsConsoleStatus(`当前账号：${this._getCurrentForumsAccountNote()}`);
            this._refreshForumsConsole();
            this._loadForums();
        });

        this._root.querySelector('#ts-forums-wrap')?.addEventListener('click', async e => {
            const pg = e.target.closest('[data-forums-page]');
            if (pg && pg.dataset.forumsPage) {
                const PAGE_SIZE = 80;
                const total = this._forumsRowsTotal || 0;
                const np = Math.max(1, Math.ceil(total / PAGE_SIZE));
                if (pg.dataset.forumsPage === 'prev')
                    this._forumsPage = Math.max(0, (this._forumsPage || 0) - 1);
                else if (pg.dataset.forumsPage === 'next')
                    this._forumsPage = Math.min(np - 1, (this._forumsPage || 0) + 1);
                this._renderForumsTable();
                return;
            }
            const btn = e.target.closest('[data-forums-action]');
            if (!btn) return;

            const action = btn.dataset.forumsAction;
            const name = btn.dataset.name;
            const fid = btn.dataset.fid;

            if (action === 'blacklist') {
                if (!this._blacklist.includes(name)) {
                    this._blacklist.push(name);
                    this._renderTags(this._root);
                    this._markDirty();
                    this._renderForumsTable();
                }
                return;
            }

            if (action === 'unblacklist') {
                this._blacklist = this._blacklist.filter(item => item !== name);
                this._renderTags(this._root);
                this._markDirty();
                this._renderForumsTable();
                return;
            }

            if (action === 'unfollow') {
                if (!confirm(`确定取消关注「${name}」？`)) return;
                btn.disabled = true;
                btn.textContent = '处理中...';
                try {
                    const res = await callUnfollow(this._forumsCurrentSid, name, fid);
                    if (res && res.result === 'ok') {
                        this._toast(`已取消关注「${name}」`, 'ok');
                        await this._loadForums();
                    } else {
                        throw new Error('取消关注失败');
                    }
                } catch (err) {
                    this._toast(err.message || '取消关注失败', 'error');
                    btn.disabled = false;
                    btn.textContent = '取消关注';
                }
            }
        });
    },

    async _doForumsUpdate() {
        const btn = this._root.querySelector('#ts-forums-update-btn');
        if (!this._forumsCurrentSid) return;
        const sid = this._forumsCurrentSid;
        this._forumsUpdating = true;

        if (btn) {
            btn.disabled = true;
            btn.textContent = '更新中...';
        }

        try {
            this._forumsConsoleCleared = false;
            this._appendForumsConsole(`开始更新账号「${this._getCurrentForumsAccountNote()}」的贴吧列表...`);
            this._setForumsConsoleStatus('更新中');

            // Snapshot current updated timestamp before triggering update
            const prevRes = await callForumsList(sid).catch(() => null);
            const previousUpdated = prevRes && prevRes.updated ? prevRes.updated : '';

            const updateRes = await callForumsUpdate(this._forumsCurrentSid);
            const updateState = String(updateRes && (updateRes.result || updateRes) || '');
            if (updateState === 'already_running') {
                this._appendForumsConsole('检测到已有后台更新任务，切换为跟踪现有任务进度...');
                this._toast('已有更新任务在运行，正在跟踪进度', 'warn');
            } else if (updateState && updateState !== 'started') {
                throw new Error(`更新任务未启动（${updateState}）`);
            } else {
                this._toast('贴吧列表更新任务已启动', 'ok');
            }

            const updatedEl = this._root.querySelector('#ts-forums-updated');
            if (updatedEl) updatedEl.textContent = '正在后台更新贴吧列表，最多等待 120 秒...';
            await this._refreshForumsConsole();

            const ok = await this._waitForForumsUpdate(sid, previousUpdated, FORUMS_UPDATE_TIMEOUT_MS);
            if (!ok) {
                const reason = await this._getLatestForumsError();
                await this._refreshForumsConsole();
                this._toast(reason || '列表更新超时，后台可能仍在运行', 'warn');
                if (updatedEl) updatedEl.textContent = '更新未完成，请查看日志';
                this._setForumsConsoleStatus('更新超时');
                this._appendForumsConsole(reason || '列表更新超时，未检测到新的持久化结果。');
            } else {
                this._setForumsConsoleStatus('更新成功');
                this._appendForumsConsole(`账号「${this._getCurrentForumsAccountNote()}」贴吧列表已更新。`);
            }
        } catch (e) {
            this._setForumsConsoleStatus('启动失败');
            this._appendForumsConsole(`启动失败: ${e.message}`);
            this._toast('启动失败: ' + e.message, 'error');
        } finally {
            this._forumsUpdating = false;
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🔄 更新列表';
            }
        }
    },

    /** 请求路由器抓取 forum/like 第 1 页原始 JSON，并在浏览器 Console 中打印（F12） */
    async _doForumsDebugJson() {
        const sid = this._forumsCurrentSid;
        if (!sid) return;
        const dbgBtn = this._root.querySelector('#ts-forums-debug-json-btn');
        if (dbgBtn) {
            dbgBtn.disabled = true;
            dbgBtn.textContent = '请求中…';
        }
        this._forumsConsoleCleared = false;
        this._setForumsConsoleStatus('抓取第1页 JSON…');
        this._appendForumsConsole(`[调试] 请求当前账号「${this._getCurrentForumsAccountNote()}」的 forum/like 第1页原始响应…`);
        try {
            const res = await callForumsDebugRaw(sid);
            const payload = unwrapTiebaRpcObject(res);
            if (!payload || payload.ok === false) {
                const err = (payload && payload.error) || 'unknown';
                console.warn('[tieba-sign] forums_debug_raw 完整响应:', res);
                console.warn('[tieba-sign] forums_debug_raw 解包后:', payload);
                this._appendForumsConsole(`[调试] 失败: ${err}`);
                this._setForumsConsoleStatus('调试失败');
                this._toast('调试失败: ' + err, 'error');
                return;
            }
            const raw = typeof payload.raw === 'string' ? payload.raw : (payload.raw != null ? String(payload.raw) : '');
            console.log('%c[tieba-sign] c/f/forum/like 第1页 — JSON.parse 结果', 'color:#0a6;font-weight:bold');
            try {
                if (raw) {
                    console.log(JSON.parse(raw));
                } else {
                    console.warn('[tieba-sign] raw 字段为空（若仍异常请展开下方「完整 RPC」）');
                }
            } catch (parseErr) {
                console.warn('[tieba-sign] JSON.parse 失败，打印原始字符串', parseErr);
                console.log(raw);
            }
            console.log('%c[tieba-sign] 元数据', 'color:#64748b', { page: payload.page, endpoint: payload.endpoint });
            console.log('%c[tieba-sign] 原始响应字符串 raw（可复制）', 'color:#94a3b8', raw);
            console.log('%c[tieba-sign] 完整 RPC 原始对象（调试用）', 'color:#cbd5e1', res);
            this._appendForumsConsole('[调试] 已在浏览器开发者工具 → Console 输出（含解析对象与 raw 字符串）。');
            this._setForumsConsoleStatus('已输出到控制台');
            this._toast('已在 Console 输出第1页 JSON', 'ok');
        } catch (e) {
            console.error('[tieba-sign] forums_debug_raw', e);
            this._appendForumsConsole(`[调试] 异常: ${e.message}`);
            this._setForumsConsoleStatus('调试异常');
            this._toast(e.message || '调试失败', 'error');
        } finally {
            if (dbgBtn) {
                dbgBtn.disabled = false;
                dbgBtn.textContent = '🐛 调试 JSON';
            }
        }
    },

    async _waitForForumsUpdate(sid, previousUpdated, timeoutMs) {
        const started = Date.now();
        let loops = 0;
        while (Date.now() - started < timeoutMs) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            if (sid !== this._forumsCurrentSid) return false;
            loops++;

            const listRes = await this._loadForums();
            const nextUpdated = listRes && listRes.updated ? listRes.updated : '';
            const hasForums = !!(listRes && Array.isArray(listRes.forums) && listRes.forums.length > 0);

            await this._refreshForumsConsole();

            // Updated timestamp changed → success
            if (nextUpdated && nextUpdated !== previousUpdated) {
                this._toast('贴吧列表已更新', 'ok');
                return true;
            }

            // No previous data but now have forums → success
            if (!previousUpdated && hasForums) {
                this._toast('贴吧列表已获取', 'ok');
                return true;
            }

            // Detect backend finished via log (success or failure)
            try {
                const logRes = await callLog();
                const logText = String(logRes ? (logRes.result || logRes) : '');
                const lines = logText.split(/\r?\n/).filter(Boolean);
                // Check last 20 lines for completion markers
                const recent = lines.slice(-20);
                const doneLine = (l) =>
                    /\[列表更新\].*(完成|成功更新)/.test(l) ||
                    /\[列表更新\].*没有任何列表被更新/.test(l) ||
                    /更新完成，共\s*\d+\s*个贴吧/.test(l) ||
                    /贴吧列表已持久化/.test(l);
                const done = recent.some(doneLine);
                if (done) {
                    await this._loadForums();
                    this._toast('贴吧列表已更新', 'ok');
                    return true;
                }
            } catch (_) { /* ignore */ }
        }
        return false;
    },

    async _getLatestForumsError() {
        try {
            const logRes = await callLog();
            const logText = logRes ? (logRes.result || logRes) : '';
            const lines = String(logText || '').split('\n').filter(Boolean).reverse();
            const hit = lines.find(line =>
                /更新完成|获取贴吧列表|列表接口返回错误|获取列表为空|请求失败|登录失败|ERROR|WARN/.test(line)
            );
            return hit ? `更新未完成：${hit.replace(/\\n/g, ' ')}` : '';
        } catch (_) {
            return '';
        }
    },

    _getCurrentForumsAccountNote() {
        const account = this._forumsAccounts.find(item => item.sid === this._forumsCurrentSid);
        return account ? account.note : this._forumsCurrentSid;
    },

    _setForumsConsole(text) {
        const body = this._root?.querySelector('#ts-forums-console-body');
        if (!body) return;
        body.innerHTML = this._colorLog(String(text || ''));
        body.scrollTop = body.scrollHeight;
    },

    _appendForumsConsole(text) {
        const line = String(text || '').trim();
        if (!line) return;
        this._forumsConsoleLines.push(line);
        this._forumsConsoleLines = this._forumsConsoleLines.slice(-80);
        this._setForumsConsole(this._forumsConsoleLines.join('\n'));
    },

    _setForumsConsoleStatus(text) {
        const el = this._root?.querySelector('#ts-forums-console-status');
        if (el) el.textContent = text || '';
    },

    async _refreshForumsConsole() {
        // If user manually cleared, don't auto-refill until they explicitly refresh
        if (this._forumsConsoleCleared) return;
        try {
            const note = this._getCurrentForumsAccountNote();
            const logRes = await callLog();
            const raw = String(logRes ? (logRes.result || logRes) : '');
            const lines = raw.split('\n').filter(Boolean);
            const matched = lines.filter(line =>
                line.includes(`[${note}]`) ||
                line.includes('[列表更新]') ||
                /更新完成|获取贴吧列表|从 API 获取贴吧列表|列表接口错误|获取列表为空|请求失败|登录失败/.test(line)
            );
            const recent = matched.slice(-80);
            if (recent.length) {
                this._forumsConsoleLines = recent;
                this._setForumsConsole(recent.join('\n'));
            } else if (!this._forumsConsoleLines.length) {
                this._setForumsConsole('暂时还没有与当前账号相关的更新日志。');
            }
        } catch (e) {
            this._appendForumsConsole(`读取日志失败: ${e.message}`);
        }
    },

});
