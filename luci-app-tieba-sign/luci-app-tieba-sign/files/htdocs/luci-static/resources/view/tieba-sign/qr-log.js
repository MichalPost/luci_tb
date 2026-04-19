'use strict';
'require baseclass';
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

const { callQrStart, callQrPoll, callClearLog } = _collect(tsRpc);

return baseclass.extend({
    /* ── QR Login Modal ── */
    _openQrModal(accountIdx, itemEl) {
        // Remove any existing modal
        document.getElementById('ts-qr-modal')?.remove();

        const modal = document.createElement('div');
        modal.className = 'ts-qr-modal';
        modal.id = 'ts-qr-modal';
        modal.innerHTML = `
<div class="ts-qr-box">
  <div class="ts-qr-title">🏮 扫码登录百度</div>
  <div class="ts-qr-sub">使用百度 App 扫描二维码</div>
  <div class="ts-qr-img-wrap" id="ts-qr-img-wrap">
    <div class="ts-qr-overlay">
      <span class="ts-spinner dark"></span>
      <span>加载中...</span>
    </div>
  </div>
  <div class="ts-qr-status" id="ts-qr-status">正在获取二维码...</div>
  <div class="ts-qr-actions">
    <button class="ts-qr-close" id="ts-qr-close">取消</button>
    <button class="ts-qr-refresh" id="ts-qr-refresh" style="display:none">刷新二维码</button>
  </div>
</div>`;

        document.body.appendChild(modal);

        // Close handlers
        const close = () => { modal.remove(); this._stopQrPoll(); };
        modal.addEventListener('click', e => { if (e.target === modal) close(); });
        modal.querySelector('#ts-qr-close').addEventListener('click', close);
        modal.querySelector('#ts-qr-refresh').addEventListener('click', () => {
            this._stopQrPoll();
            this._startQrFlow(accountIdx, itemEl, modal);
        });

        this._startQrFlow(accountIdx, itemEl, modal);
    },

    _qrPollTimer: null,
    _qrSign: '',
    _qrPolling: false,

    _stopQrPoll() {
        if (this._qrPollTimer) { clearInterval(this._qrPollTimer); this._qrPollTimer = null; }
        this._qrPolling = false;
    },

    async _startQrFlow(accountIdx, itemEl, modal) {
        const imgWrap  = modal.querySelector('#ts-qr-img-wrap');
        const statusEl = modal.querySelector('#ts-qr-status');
        const refreshBtn = modal.querySelector('#ts-qr-refresh');

        const setStatus = (msg, cls = '') => {
            statusEl.textContent = msg;
            statusEl.className = 'ts-qr-status' + (cls ? ' ' + cls : '');
        };
        const setOverlay = (msg) => {
            imgWrap.innerHTML = `
<div class="ts-qr-overlay">
  <span class="ts-spinner dark"></span>
  <span>${msg}</span>
</div>`;
        };

        setOverlay('获取二维码中...');
        setStatus('正在连接百度服务器...');
        refreshBtn.style.display = 'none';

        try {
            const res = await callQrStart();
            if (!res || res.errno !== 0) {
                setOverlay('');
                imgWrap.innerHTML = '<div class="ts-qr-overlay"><span style="font-size:24px">❌</span><span>获取失败</span></div>';
                setStatus(res?.msg || '获取二维码失败，请检查网络', 'error');
                refreshBtn.style.display = '';
                return;
            }

            this._qrSign = res.sign;

            // Show QR image - use base64 data to avoid CORS issues
            if (res.imgdata) {
                imgWrap.innerHTML = `<img src="data:image/png;base64,${res.imgdata}" alt="QR Code">`;
            } else {
                imgWrap.innerHTML = `<img src="${this._esc(res.imgurl)}" alt="QR Code">`;
            }
            setStatus('请用百度 App 扫描二维码');

            // Start polling
            this._stopQrPoll();
            let pollCount = 0;
            const maxPolls = 60; // 2 min timeout

            this._qrPollTimer = setInterval(async () => {
                // Prevent concurrent polls
                if (this._qrPolling) return;
                this._qrPolling = true;
                pollCount++;
                if (pollCount > maxPolls) {
                    this._stopQrPoll();
                    imgWrap.innerHTML = '<div class="ts-qr-overlay"><span style="font-size:24px">⏰</span><span>二维码已过期</span></div>';
                    setStatus('二维码已过期，请刷新', 'error');
                    refreshBtn.style.display = '';
                    this._qrPolling = false;
                    return;
                }

                try {
                    const poll = await callQrPoll(this._qrSign);
                    if (!poll) { this._qrPolling = false; return; }

                    if (poll.status === 1) {
                        imgWrap.innerHTML = '<div class="ts-qr-overlay"><span style="font-size:32px">✅</span><span>已扫码</span><span style="font-size:11px;color:#64748b">请在手机上确认登录</span></div>';
                        setStatus('已扫码，请在手机上点击确认', 'scan');
                    } else if (poll.status === 2 && poll.bduss) {
                        this._stopQrPoll();
                        this._accounts[accountIdx].bduss = poll.bduss;
                        const bdussInput = itemEl.querySelector('.acc-bduss');
                        if (bdussInput) bdussInput.value = poll.bduss;
                        this._markDirty();
                        imgWrap.innerHTML = '<div class="ts-qr-overlay" style="background:rgba(240,253,244,.95)"><span style="font-size:40px">🎉</span><span style="color:#059669;font-weight:600">登录成功</span></div>';
                        setStatus('BDUSS 已自动填入，请保存配置', 'ok');
                        setTimeout(() => {
                            document.getElementById('ts-qr-modal')?.remove();
                            this._toast('BDUSS 获取成功，请点击保存配置', 'ok');
                        }, 1800);
                    } else if (poll.errno !== 0 && poll.status !== 0 && poll.status !== 1) {
                        this._stopQrPoll();
                        setStatus(poll.msg || '登录失败', 'error');
                        refreshBtn.style.display = '';
                    }
                    // status === 0: still waiting, do nothing
                } catch (_) { /* ignore individual poll errors silently */ }
                this._qrPolling = false;
            }, 2000);

        } catch (e) {
            setOverlay('');
            imgWrap.innerHTML = '<div class="ts-qr-overlay"><span style="font-size:24px">❌</span><span>请求失败</span></div>';
            setStatus('网络错误: ' + e.message, 'error');
            refreshBtn.style.display = '';
        }
    },

    _bindLogFilters(container) {
        const logBox = container.querySelector('#ts-log-box');
        if (!logBox) return;
        if (container._tsLogBoundFlag) return;
        container._tsLogBoundFlag = 1;
        container.addEventListener('click', (e) => {
            const t = e.target;
            if (t && t.closest && t.closest('#ts-refresh-btn')) {
                e.preventDefault();
                this._refreshStatus();
                return;
            }
            const filterBtn = t && t.closest && t.closest('.ts-log-filter');
            if (filterBtn) {
                container.querySelectorAll('.ts-log-filter').forEach(b => {
                    b.style.background = 'none';
                    b.style.color = 'var(--slate-500)';
                    b.style.borderColor = 'var(--slate-200)';
                });
                filterBtn.style.background = 'var(--blue-500)';
                filterBtn.style.color = '#fff';
                filterBtn.style.borderColor = 'var(--blue-500)';
                const raw = logBox.dataset.raw || '';
                const level = filterBtn.dataset.level;
                logBox.innerHTML = this._filterLog(raw, level);
                logBox.scrollTop = logBox.scrollHeight;
                return;
            }
            if (t && t.closest && t.closest('#ts-clear-log-btn')) {
                (async () => {
                    if (!confirm('确定清空所有日志？')) return;
                    await callClearLog().catch(() => {});
                    logBox.dataset.raw = '';
                    logBox.innerHTML = '<span style="color:#475569">日志已清空</span>';
                    this._toast('日志已清空', 'ok');
                    this._refreshStatus();
                })();
            }
        });
    },

    _filterLog(raw, level) {
        if (!raw) return '<span style="color:#475569">暂无日志</span>';
        const lines = raw.split('\n');
        const filtered = lines.filter(line => {
            if (level === 'all') return true;
            if (level === 'ok')   return /\[OK   \]/.test(line);
            if (level === 'info') return /\[(OK   |INFO |WARN |ERROR)\]/.test(line);
            return true;
        });
        return this._colorLog(filtered.join('\n') || '（当前级别无日志）');
    },
});
