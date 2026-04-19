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

const { callStatusLog } = _collect(tsRpc);

/** 仅当 state===running 时轮询；空闲不调度定时器，降低路由器上 rpcd 压力。间隔由 UCI poll_interval_sec / poll_interval_hidden_sec（及表单）配置 */

function unwrapStatusLog(res) {
    if (res == null) return { status: { state: 'idle', accounts: [] }, result: '' };
    let o = res;
    if (Array.isArray(o) && o.length >= 2 && typeof o[0] === 'number') {
        if (o[0] !== 0) return { status: { state: 'idle', accounts: [] }, result: '' };
        o = o[1];
    }
    if (o && typeof o === 'object' && o.status && o.result !== undefined)
        return { status: o.status, result: o.result };
    return { status: { state: 'idle', accounts: [] }, result: '' };
}

return baseclass.extend({
    /* ── Status render ── */
    _statsFromStatus(st) {
        const accounts = Array.isArray(st.accounts) ? st.accounts : [];
        let success = 0, signed = 0, fail = 0, banned = 0, exp = 0;
        for (const acc of accounts) {
            const m = acc.message || '';
            success += this._parseNum(m, '新签到:(\\d+)');
            signed  += this._parseNum(m, '已签:(\\d+)');
            fail    += this._parseNum(m, '失败:(\\d+)');
            banned  += this._parseNum(m, '封禁:(\\d+)');
            exp     += this._parseNum(m, '\\+(\\d+)exp');
        }
        return { success, signed, fail, banned, exp };
    },

    _renderStatusHTML(status, logText) {
        const st = (status && typeof status === 'object') ? status : { state: 'idle', accounts: [] };
        const { success, signed, fail, banned, exp } = this._statsFromStatus(st);

        const stateLabel = { running:'运行中', stopped:'已停止', success:'成功', partial:'部分失败', failed:'失败', idle:'未运行' };

        let html = `
<div class="ts-meta">
  <div class="ts-meta-item">状态 <strong>${this._statePill(st.state, stateLabel[st.state] || st.state)}</strong></div>
  ${st.timestamp ? `<div class="ts-meta-item">时间 <strong>${st.timestamp}</strong></div>` : ''}
</div>`;

        html += `<div class="ts-status-grid">
  <div class="ts-stat-box success"><div class="ts-stat-num">${success}</div><div class="ts-stat-label">新签到</div></div>
  <div class="ts-stat-box"><div class="ts-stat-num" style="color:var(--blue-600)">${exp}</div><div class="ts-stat-label">获得经验</div></div>
  <div class="ts-stat-box"><div class="ts-stat-num" style="color:var(--slate-500)">${signed}</div><div class="ts-stat-label">已签到</div></div>
  <div class="ts-stat-box warn"><div class="ts-stat-num">${banned}</div><div class="ts-stat-label">封禁</div></div>
  <div class="ts-stat-box danger"><div class="ts-stat-num">${fail}</div><div class="ts-stat-label">失败</div></div>
</div>`;

        html += `<details class="ts-log-details" open>
  <summary>运行日志</summary>
  <div class="ts-log-tools">
    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
      <button type="button" class="ts-btn ts-btn-secondary ts-log-filter" data-level="all" style="padding:4px 10px;font-size:12px;background:var(--blue-500);color:#fff;border-color:var(--blue-500)">全部</button>
      <button type="button" class="ts-btn ts-btn-secondary ts-log-filter" data-level="ok" style="padding:4px 10px;font-size:12px">成功</button>
      <button type="button" class="ts-btn ts-btn-secondary ts-log-filter" data-level="info" style="padding:4px 10px;font-size:12px">信息</button>
      <button type="button" class="ts-btn ts-btn-secondary" id="ts-clear-log-btn" style="padding:4px 10px;font-size:12px">清空日志</button>
    </div>
    <button type="button" class="ts-btn ts-btn-secondary" id="ts-refresh-btn" style="padding:4px 12px;font-size:12px">刷新状态</button>
  </div>
  <div class="ts-log" id="ts-log-box"></div>
</details>`;

        return html;
    },

    _patchStatusIncremental(body, status, logText) {
        if (!body || !body.querySelector('.ts-status-grid') || !body.querySelector('.ts-meta')) return false;
        const st = (status && typeof status === 'object') ? status : { state: 'idle', accounts: [] };
        const { success, signed, fail, banned, exp } = this._statsFromStatus(st);
        const stateLabel = { running:'运行中', stopped:'已停止', success:'成功', partial:'部分失败', failed:'失败', idle:'未运行' };
        const nums = body.querySelectorAll('.ts-status-grid .ts-stat-num');
        const vals = [success, exp, signed, banned, fail];
        for (let i = 0; i < Math.min(nums.length, vals.length); i++)
            nums[i].textContent = String(vals[i]);

        const meta = body.querySelector('.ts-meta');
        if (meta) {
            meta.innerHTML = `
  <div class="ts-meta-item">状态 <strong>${this._statePill(st.state, stateLabel[st.state] || st.state)}</strong></div>
  ${st.timestamp ? `<div class="ts-meta-item">时间 <strong>${this._esc(st.timestamp)}</strong></div>` : ''}`;
        }
        this._applyLogToStatusBody(body, logText);
        const logBox = body.querySelector('#ts-log-box');
        if (logBox) logBox.scrollTop = logBox.scrollHeight;
        return true;
    },

    _applyLogToStatusBody(body, logText) {
        const logBox = body && body.querySelector('#ts-log-box');
        if (!logBox || typeof this._filterLog !== 'function') return;
        logBox.dataset.raw = String(logText || '');
        logBox.innerHTML = this._filterLog(logText, 'all');
    },

    _statePill(state, label) {
        return `<span class="ts-state-pill ${state || 'idle'}">${label}</span>`;
    },

    _parseNum(str, pattern) {
        const m = str.match(new RegExp(pattern));
        return m ? parseInt(m[1], 10) : 0;
    },

    _colorLog(text) {
        return this._esc(text)
            .replace(/\[OK   \][^\n]*/g, m => `<span class="log-ok">${m}</span>`)
            .replace(/\[WARN \][^\n]*/g, m => `<span class="log-warn">${m}</span>`)
            .replace(/\[ERROR\][^\n]*/g, m => `<span class="log-error">${m}</span>`)
            .replace(/\[INFO \][^\n]*/g, m => `<span class="log-info">${m}</span>`);
    },

    _esc(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    },

    _escAttr(s) {
        return this._esc(s).replace(/'/g, '&#39;');
    },

    _readPollIntervalsSec() {
        let v = 4;
        let h = 10;
        try {
            const gv = typeof this._getVal === 'function' ? this._getVal('ts-poll-visible') : '';
            const gh = typeof this._getVal === 'function' ? this._getVal('ts-poll-hidden') : '';
            v = parseInt(gv || uci.get('tieba-sign', 'main', 'poll_interval_sec') || '4', 10);
            h = parseInt(gh || uci.get('tieba-sign', 'main', 'poll_interval_hidden_sec') || '10', 10);
        } catch (_) {}
        if (!Number.isFinite(v)) v = 4;
        if (!Number.isFinite(h)) h = 10;
        v = Math.min(30, Math.max(2, v));
        h = Math.min(120, Math.max(5, h));
        return { visible: v, hidden: h };
    },

    _nextPollDelayMs(running) {
        if (!running) return 0;
        const { visible, hidden } = this._readPollIntervalsSec();
        try {
            if (typeof document !== 'undefined' && document.hidden) return hidden * 1000;
        } catch (_) {}
        return visible * 1000;
    },

    /** 前台/后台切换时按新间隔重排定时器；回到前台且仍在签到时立即拉一次 */
    _bindVisibilityResumeRefresh() {
        if (this._tsVisBound) return;
        this._tsVisBound = true;
        try {
            document.addEventListener('visibilitychange', () => {
                try {
                    if (!this._root || !this._wasRunning) return;
                    this._stopPolling();
                    this._startPolling();
                    if (!document.hidden) this._refreshStatus();
                } catch (_) {}
            });
        } catch (_) {}
    },

    /* ── Polling ── */
    async _refreshStatus() {
        try {
            const raw = await callStatusLog();
            const { status: statusRaw, result: logText } = unwrapStatusLog(raw);
            const logStr = logText !== undefined && logText !== null ? String(logText) : '暂无日志';
            const status = (statusRaw && typeof statusRaw === 'object')
                ? statusRaw
                : { state: 'idle', accounts: [] };
            const root = this._root || document;
            const body = root.querySelector('#ts-status-body');
            if (body) {
                const patched = this._patchStatusIncremental(body, status, logStr);
                if (!patched) {
                    body.innerHTML = this._renderStatusHTML(status, logStr);
                    this._applyLogToStatusBody(body, logStr);
                    this._bindLogFilters(body);
                }
            }
            const dot   = root.querySelector('.ts-hero-badge .dot');
            const label = root.querySelector('#ts-hero-label');
            const stateMap = { running:'running', success:'', partial:'', stopped:'off', failed:'off', idle:'off' };
            if (dot)   dot.className = 'dot ' + (stateMap[status.state] ?? 'off');
            if (label) label.textContent = { running:'运行中', stopped:'已停止', success:'上次成功', partial:'部分失败', failed:'上次失败', idle:'未运行' }[status.state] || status.state;

            const btn = root.querySelector('#ts-run-btn');
            const resumeBtn = root.querySelector('#ts-resume-btn');
            const stopBtn = root.querySelector('#ts-stop-btn');
            const running = status.state === 'running';
            if (btn) {
                if (running) {
                    btn.disabled = true;
                    btn.innerHTML = '<span class="ts-spinner"></span> 签到中...';
                } else {
                    btn.disabled = false;
                    btn.innerHTML = '<span>▶</span> 立即签到';
                }
            }
            if (resumeBtn) {
                resumeBtn.disabled = running;
                resumeBtn.style.opacity = running ? '0.5' : '';
            }
            if (stopBtn) stopBtn.style.display = running ? '' : 'none';

            if (!running) this._stopPolling();
            else this._startPolling();

            const prevRun = this._wasRunning;
            this._wasRunning = status.state === 'running';
            if (this._statsLoaded && prevRun && status.state !== 'running')
                this._loadStatsPanel();
        } catch (_) { /* ignore */ }
    },

    _startPolling() {
        if (this._pollTimer) return;
        const tick = () => {
            this._pollTimer = null;
            this._refreshStatus();
        };
        const delay = this._nextPollDelayMs(true);
        this._pollTimer = setTimeout(tick, delay);
        const root = this._root || document;
        const logBox = root.querySelector('#ts-log-box');
        if (logBox) logBox.scrollTop = logBox.scrollHeight;
    },

    _stopPolling() {
        if (this._pollTimer) {
            clearTimeout(this._pollTimer);
            this._pollTimer = null;
        }
    },

    /* ── Toast ── */
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
        t.innerHTML = `<span>${icons[type] || '•'}</span><span>${this._esc(msg)}</span>`;
        wrap.appendChild(t);
        setTimeout(() => {
            t.style.animation = 'fadeOut .3s ease forwards';
            setTimeout(() => t.remove(), 300);
        }, 3000);
    },
});
