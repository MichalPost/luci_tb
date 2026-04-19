'use strict';
'require baseclass';
'require uci';
'require rpc';
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

const { callRun, callResume, callStop, callAccountCheck } = _collect(tsRpc);

return baseclass.extend({
    /* ── Populate form from UCI ── */
    _populateForm(root) {
        const $ = id => root.querySelector('#' + id);
        const g = k => uci.get('tieba-sign', 'main', k);

        const setCheck = (id, val) => { const el = $(id); if (el) el.checked = val; };
        const setVal   = (id, val) => { const el = $(id); if (el) el.value = val; };

        setCheck('ts-enabled',       g('enabled') === '1');
        setCheck('ts-auto-unfollow', g('auto_unfollow_banned') !== '0');
        setCheck('ts-show-signed',   g('show_signed_log') === '1');
        setVal('ts-proxy',     g('proxy') || '');
        setVal('ts-timeout',   g('timeout') || '20');
        setVal('ts-retries',   g('max_retries') || '2');
        setVal('ts-cron-hour', g('cron_hour') || '6');
        setVal('ts-cron-min',  g('cron_minute') || '0');
        setVal('ts-forum-update-days', g('forum_update_days') || '7');
        setVal('ts-concurrency', g('concurrency') || '1');
        setVal('ts-sign-delay-min', g('sign_delay_min') !== undefined && g('sign_delay_min') !== '' ? g('sign_delay_min') : '1');
        setVal('ts-sign-delay-max', g('sign_delay_max') !== undefined && g('sign_delay_max') !== '' ? g('sign_delay_max') : '2');
        setVal('ts-webhook', g('webhook_url') || '');
        setVal('ts-poll-visible', g('poll_interval_sec') || '4');
        setVal('ts-poll-hidden', g('poll_interval_hidden_sec') || '10');
        this._updateCronPreview(root);

        this._blacklist = [];
        const bl = uci.get('tieba-sign', 'main', 'blacklist');
        if (Array.isArray(bl)) this._blacklist = [...bl];
        else if (bl) this._blacklist = [bl];
        this._renderTags(root);

        this._accounts = [];
        const sections = uci.sections('tieba-sign', 'account');
        for (const sec of sections) {
            this._accounts.push({
                _sid: sec['.name'],
                enabled: sec.enabled === '1',
                note: sec.note || '',
                bduss: sec.bduss || '',
            });
        }
        this._renderAccounts(root);
    },

    _getCheck(id) { const el = (this._root || document).querySelector('#' + id); return el ? el.checked : false; },
    _getVal(id)   { const el = (this._root || document).querySelector('#' + id); return el ? el.value.trim() : ''; },

    /* ── Blacklist tags ── */
    _renderTags(root) {
        const wrap = (root || document).querySelector('#ts-tags');
        if (!wrap) return;
        wrap.innerHTML = '';
        for (const tag of this._blacklist) {
            const t = document.createElement('span');
            t.className = 'ts-tag';
            t.innerHTML = `${this._esc(tag)}<button class="ts-tag-del" data-tag="${this._esc(tag)}">×</button>`;
            t.querySelector('.ts-tag-del').addEventListener('click', () => {
                this._blacklist = this._blacklist.filter(x => x !== tag);
                this._renderTags(root); this._markDirty();
            });
            wrap.appendChild(t);
        }
    },

    /* ── Accounts ── */
    _renderAccounts(root) {
        const list = (root || document).querySelector('#ts-account-list');
        if (!list) return;
        list.innerHTML = '';
        this._accounts.forEach((acc, idx) => {
            const item = document.createElement('div');
            item.className = 'ts-account-item' + (acc.enabled ? ' enabled' : '');
            item.dataset.idx = idx;
            item.innerHTML = `
<div class="ts-account-item-head">
  <div class="ts-account-num">${idx + 1}</div>
  <div class="ts-account-name">${this._esc(acc.note) || '未命名账号'}</div>
  <label class="ts-switch" style="margin-right:4px">
    <input type="checkbox" class="acc-enabled" ${acc.enabled ? 'checked' : ''}>
    <span class="ts-switch-track"></span>
  </label>
  <button class="ts-account-del" data-idx="${idx}" title="删除">🗑</button>
</div>
<div class="ts-account-fields">
  <div class="ts-field">
    <label class="ts-label">备注名称</label>
    <input class="ts-input acc-note" type="text" value="${this._esc(acc.note)}" placeholder="我的账号">
  </div>
  <div class="ts-field">
    <label class="ts-label">BDUSS</label>
    <div style="display:flex;gap:6px">
      <input class="ts-input acc-bduss" type="text" value="${this._esc(acc.bduss)}" placeholder="粘贴 BDUSS 值..." style="flex:1">
      <button class="ts-btn ts-btn-secondary acc-eye-btn" title="显示/隐藏" style="padding:8px 12px;font-size:15px;flex-shrink:0">👁</button>
      <button class="ts-btn ts-btn-secondary acc-qr-btn" data-idx="${idx}" style="padding:8px 12px;font-size:13px;white-space:nowrap;flex-shrink:0" title="扫码获取 BDUSS">
        📷 扫码
      </button>
      <button type="button" class="ts-btn ts-btn-secondary acc-verify-btn" data-idx="${idx}" data-sid="@account[${idx}]" style="padding:8px 12px;font-size:13px;white-space:nowrap;flex-shrink:0" title="检测 BDUSS 是否有效">
        ✓ 验证
      </button>
    </div>
  </div>
</div>`;

            item.querySelector('.acc-enabled').addEventListener('change', e => {
                this._accounts[idx].enabled = e.target.checked;
                item.className = 'ts-account-item' + (e.target.checked ? ' enabled' : '');
                this._markDirty();
            });
            item.querySelector('.acc-note').addEventListener('input', e => {
                this._accounts[idx].note = e.target.value;
                item.querySelector('.ts-account-name').textContent = e.target.value || '未命名账号';
                this._markDirty();
            });
            item.querySelector('.acc-bduss').addEventListener('input', e => {
                this._accounts[idx].bduss = e.target.value;
                this._markDirty();
            });
            const eyeBtn = item.querySelector('.acc-eye-btn');
            const bdussInput = item.querySelector('.acc-bduss');
            bdussInput.type = 'password';
            eyeBtn.addEventListener('click', () => {
                const isHidden = bdussInput.type === 'password';
                bdussInput.type = isHidden ? 'text' : 'password';
                eyeBtn.textContent = isHidden ? '🙈' : '👁';
            });
            item.querySelector('.ts-account-del').addEventListener('click', () => {
                this._accounts.splice(idx, 1);
                this._renderAccounts(root); this._markDirty();
            });

            item.querySelector('.acc-qr-btn').addEventListener('click', () => {
                this._openQrModal(idx, item);
            });

            item.querySelector('.acc-verify-btn').addEventListener('click', async () => {
                const sid = `@account[${idx}]`;
                const btn = item.querySelector('.acc-verify-btn');
                if (btn) { btn.disabled = true; btn.textContent = '…'; }
                try {
                    const raw = await callAccountCheck(sid);
                    let o = raw;
                    if (Array.isArray(o) && o.length >= 2 && typeof o[0] === 'number' && o[0] === 0)
                        o = o[1];
                    if (typeof o === 'string') {
                        try { o = JSON.parse(o); } catch (_) {}
                    }
                    if (o && o.ok)
                        this._toast(`「${this._esc(acc.note || '账号')}」登录有效`, 'ok');
                    else
                        this._toast('登录失败：请检查 BDUSS 或网络/代理', 'error');
                } catch (e) {
                    this._toast('验证请求失败: ' + (e.message || e), 'error');
                } finally {
                    if (btn) { btn.disabled = false; btn.textContent = '✓ 验证'; }
                }
            });

            list.appendChild(item);
        });
    },

    /* ── Events ── */
    _bindEvents(root) {
        const $ = id => root.querySelector('#' + id);

        root.addEventListener('change', () => this._markDirty());
        root.addEventListener('input',  () => this._markDirty());

        $('ts-cron-hour')?.addEventListener('change', () => this._updateCronPreview(root));
        $('ts-cron-min')?.addEventListener('change',  () => this._updateCronPreview(root));

        const addTag = () => {
            const inp = $('ts-tag-input');
            if (!inp) return;
            const v = inp.value.trim();
            if (v && !this._blacklist.includes(v)) {
                this._blacklist.push(v); this._renderTags(root); this._markDirty();
            }
            inp.value = '';
        };
        $('ts-tag-add-btn')?.addEventListener('click', addTag);
        $('ts-tag-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });

        $('ts-add-account')?.addEventListener('click', () => {
            this._accounts.push({ _sid: null, enabled: true, note: '', bduss: '' });
            this._renderAccounts(root); this._markDirty();
        });

        $('ts-run-btn')?.addEventListener('click', () => this._doRun(root, false));
        $('ts-resume-btn')?.addEventListener('click', () => this._doRun(root, true));
        $('ts-stop-btn')?.addEventListener('click', () => this._doStop(root));
        $('ts-run-hero-btn')?.addEventListener('click', () => this._doRun(root, false));

        $('ts-save-btn')?.addEventListener('click', () => this._doSave(root));
        $('ts-reset-btn')?.addEventListener('click', () => {
            uci.unload('tieba-sign');
            uci.load('tieba-sign').then(() => {
                this._populateForm(root);
                if (this._forumsLoaded) this._initForumsPanel();
                this._clearDirty(root);
            });
        });
    },

    _updateCronPreview(root) {
        const h = this._getVal('ts-cron-hour') || '6';
        const m = this._getVal('ts-cron-min')  || '0';
        const el = (root || document).querySelector('#ts-cron-preview');
        if (el) el.textContent = `每天 ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} 自动执行  ·  cron: ${m} ${h} * * *`;
    },

    /* ── Dirty state ── */
    _markDirty() {
        this._dirty = true;
        const hint = (this._root || document).querySelector('#ts-save-hint');
        if (hint) { hint.textContent = '有未保存的更改'; hint.className = 'ts-save-hint dirty'; }
    },
    _clearDirty() {
        this._dirty = false;
        const hint = (this._root || document).querySelector('#ts-save-hint');
        if (hint) { hint.textContent = '所有更改将在保存后生效'; hint.className = 'ts-save-hint'; }
    },

    /* ── Save ── */
    async _doSave(root) {
        const r   = root || this._root || document;
        const btn = r.querySelector('#ts-save-btn');
        if (!btn) return;
        btn.disabled = true;
        btn.innerHTML = '<span class="ts-spinner"></span> 保存中...';

        try {
            uci.set('tieba-sign', 'main', 'enabled',              this._getCheck('ts-enabled') ? '1' : '0');
            uci.set('tieba-sign', 'main', 'auto_unfollow_banned', this._getCheck('ts-auto-unfollow') ? '1' : '0');
            uci.set('tieba-sign', 'main', 'show_signed_log',      this._getCheck('ts-show-signed') ? '1' : '0');
            uci.set('tieba-sign', 'main', 'timeout',              this._getVal('ts-timeout') || '20');
            uci.set('tieba-sign', 'main', 'max_retries',          this._getVal('ts-retries') || '2');
            uci.set('tieba-sign', 'main', 'cron_hour',            this._getVal('ts-cron-hour') || '6');
            uci.set('tieba-sign', 'main', 'cron_minute',          this._getVal('ts-cron-min') || '0');
            uci.set('tieba-sign', 'main', 'forum_update_days',    this._getVal('ts-forum-update-days') || '7');
            uci.set('tieba-sign', 'main', 'concurrency',           this._getVal('ts-concurrency') || '1');

            const sdMin = this._getVal('ts-sign-delay-min');
            const sdMax = this._getVal('ts-sign-delay-max');
            if (sdMin !== '' || sdMax !== '') {
                uci.set('tieba-sign', 'main', 'sign_delay_min', sdMin === '' ? '1' : sdMin);
                uci.set('tieba-sign', 'main', 'sign_delay_max', sdMax === '' ? '2' : sdMax);
            } else {
                uci.set('tieba-sign', 'main', 'sign_delay_min', '1');
                uci.set('tieba-sign', 'main', 'sign_delay_max', '2');
            }

            const wh = this._getVal('ts-webhook');
            if (wh) uci.set('tieba-sign', 'main', 'webhook_url', wh);
            else uci.unset('tieba-sign', 'main', 'webhook_url');

            uci.set('tieba-sign', 'main', 'poll_interval_sec',         this._getVal('ts-poll-visible') || '4');
            uci.set('tieba-sign', 'main', 'poll_interval_hidden_sec', this._getVal('ts-poll-hidden') || '10');

            const proxy = this._getVal('ts-proxy');
            if (proxy) uci.set('tieba-sign', 'main', 'proxy', proxy);
            else uci.unset('tieba-sign', 'main', 'proxy');

            if (this._blacklist && this._blacklist.length > 0)
                uci.set('tieba-sign', 'main', 'blacklist', this._blacklist);
            else
                uci.unset('tieba-sign', 'main', 'blacklist');

            for (const s of uci.sections('tieba-sign', 'account'))
                uci.remove('tieba-sign', s['.name']);

            for (const acc of this._accounts) {
                const sid = uci.add('tieba-sign', 'account');
                uci.set('tieba-sign', sid, 'enabled', acc.enabled ? '1' : '0');
                uci.set('tieba-sign', sid, 'note',    acc.note || '账号');
                if (acc.bduss) uci.set('tieba-sign', sid, 'bduss', acc.bduss);
            }

            await uci.save();
            await uci.apply(10).catch(() => {});

            await L.resolveDefault(
                rpc.declare({ object: 'luci', method: 'setInitAction',
                    params: ['name', 'action'], expect: {} })('tieba-sign', 'reload'),
                null
            );

            if (this._forumsLoaded) this._initForumsPanel();
            this._clearDirty();
            this._toast('配置已保存', 'ok');
            if (this._wasRunning && typeof this._stopPolling === 'function' && typeof this._startPolling === 'function') {
                this._stopPolling();
                this._startPolling();
            }
        } catch (e) {
            console.error('Save failed:', e);
            this._toast('保存失败: ' + e.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>💾</span> 保存配置';
        }
    },

    /* ── Run / Resume / Stop ── */
    _setRunButtonsBusy(r, busy) {
        const btn = r.querySelector('#ts-run-btn');
        const resumeBtn = r.querySelector('#ts-resume-btn');
        const stopBtn = r.querySelector('#ts-stop-btn');
        const hero = r.querySelector('#ts-run-hero-btn');
        if (busy) {
            if (btn) { btn.disabled = true; btn.innerHTML = '<span class="ts-spinner"></span> 启动中...'; }
            if (resumeBtn) resumeBtn.disabled = true;
            if (stopBtn) { stopBtn.style.display = 'none'; }
            if (hero) {
                const dot = hero.querySelector('.dot');
                const lbl = hero.querySelector('#ts-hero-label');
                if (dot) dot.className = 'dot running';
                if (lbl) lbl.textContent = '运行中';
            }
        } else {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span id="ts-run-icon">▶</span> 立即签到';
            }
            if (resumeBtn) resumeBtn.disabled = false;
            if (hero) {
                const dot = hero.querySelector('.dot');
                const lbl = hero.querySelector('#ts-hero-label');
                if (dot) dot.className = 'dot off';
                if (lbl) lbl.textContent = '未运行';
            }
        }
    },

    async _doRun(root, resume) {
        const r = root || this._root || document;
        this._setRunButtonsBusy(r, true);

        try {
            if (resume) await callResume();
            else await callRun();
            this._toast(resume ? '断点续签任务已启动' : '签到任务已启动', 'ok');
            this._startPolling();
            const stopBtn = r.querySelector('#ts-stop-btn');
            const btn = r.querySelector('#ts-run-btn');
            const resumeBtn = r.querySelector('#ts-resume-btn');
            if (btn) { btn.disabled = true; btn.innerHTML = '<span class="ts-spinner"></span> 签到中...'; }
            if (resumeBtn) resumeBtn.disabled = true;
            if (stopBtn) stopBtn.style.display = '';
        } catch (e) {
            this._toast('启动失败: ' + e.message, 'error');
            this._setRunButtonsBusy(r, false);
        }
    },

    async _doStop(root) {
        const r = root || this._root || document;
        try {
            await callStop();
            this._toast('已发送停止请求，签到将尽快结束', 'ok');
            this._refreshStatus();
        } catch (e) {
            this._toast('停止请求失败: ' + e.message, 'error');
        }
    },
});
