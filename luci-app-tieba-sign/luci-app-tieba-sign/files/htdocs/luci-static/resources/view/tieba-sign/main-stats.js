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

const { callSignHistory } = _collect(tsRpc);

return baseclass.extend({
    _unwrapTiebaHistoryRpc(res) {
        if (res == null) return { days: [] };
        if (Array.isArray(res) && res.length >= 2 && typeof res[0] === 'number') {
            if (res[0] !== 0) return { days: [] };
            const inner = res[1];
            return typeof inner === 'object' && inner !== null ? inner : { days: [] };
        }
        if (res.result !== undefined) {
            const r = res.result;
            if (typeof r === 'object' && r !== null && !Array.isArray(r)) return r;
            if (typeof r === 'string') {
                try { return JSON.parse(r); } catch (_) { return { days: [] }; }
            }
        }
        return typeof res === 'object' && res !== null ? res : { days: [] };
    },

    _aggregateDayStats(accounts) {
        let success = 0, signed = 0, fail = 0, banned = 0, exp = 0;
        for (const acc of accounts || []) {
            const m = acc.message || '';
            success += this._parseNum(m, '新签到:(\\d+)');
            signed += this._parseNum(m, '已签:(\\d+)');
            fail += this._parseNum(m, '失败:(\\d+)');
            banned += this._parseNum(m, '封禁:(\\d+)');
            exp += this._parseNum(m, '\\+(\\d+)exp');
        }
        return { success, signed, fail, banned, exp };
    },

    _renderStatsTableHTML(days) {
        const toolbar = '<div class="ts-stats-toolbar"><button type="button" class="ts-btn ts-btn-secondary" id="ts-stats-reload-btn">🔄 刷新</button></div>';
        if (!days.length) {
            return toolbar + '<div class="ts-stats-empty">暂无历史记录。完成一次签到后会自动写入 <code>/etc/tieba-sign/sign_history.json</code>（最多保留 10 个不同日期）。</div>';
        }
        const stateLabel = { running: '运行中', success: '成功', partial: '部分失败', failed: '失败', idle: '未运行' };
        const rows = days.map(d => {
            const accs = Array.isArray(d.accounts) ? d.accounts : [];
            const agg = this._aggregateDayStats(accs);
            const names = accs.map(a => `${this._esc(a.name)}：${this._esc(a.message || '')}`).join('<br/>');
            const ov = d.overall || 'idle';
            return `<tr>
  <td><code class="ts-stats-code">${this._esc(d.date || '')}</code></td>
  <td>${this._statePill(ov, stateLabel[ov] || ov)}</td>
  <td class="ts-stats-ts">${this._esc(d.timestamp || '')}</td>
  <td class="ts-stats-num">${agg.success}</td>
  <td class="ts-stats-num">${agg.exp}</td>
  <td class="ts-stats-num">${agg.signed}</td>
  <td class="ts-stats-num">${agg.banned}</td>
  <td class="ts-stats-num">${agg.fail}</td>
  <td class="ts-stats-accounts">${names || '—'}</td>
</tr>`;
        }).join('');
        return toolbar + `<div class="ts-stats-scroll"><table class="ts-stats-table"><thead><tr>
  <th>日期(UTC)</th><th>整体</th><th>记录时间</th><th>新签到</th><th>经验</th><th>已签</th><th>封禁</th><th>失败</th><th>各账号摘要</th>
</tr></thead><tbody>${rows}</tbody></table></div>`;
    },

    async _loadStatsPanel() {
        const el = this._root?.querySelector('#ts-stats-inner');
        if (!el) return;
        el.innerHTML = '<div class="ts-stats-empty">加载中...</div>';
        try {
            const raw = await callSignHistory();
            const data = this._unwrapTiebaHistoryRpc(raw);
            const days = Array.isArray(data.days) ? data.days : [];
            el.innerHTML = this._renderStatsTableHTML(days);
            el.querySelector('#ts-stats-reload-btn')?.addEventListener('click', () => this._loadStatsPanel());
        } catch (e) {
            el.innerHTML = `<div class="ts-stats-empty">加载失败：${this._esc(e.message)}</div>`;
        }
    },
});
