'use strict';
'require view';
'require uci';
'require view.tieba-sign.rpc as tsRpc';
'require view.tieba-sign.main-ui as mainUi';
'require view.tieba-sign.main-stats as mainStats';
'require view.tieba-sign.main-actions as mainActions';
'require view.tieba-sign.main-monitor as mainMonitor';
'require view.tieba-sign.forums-panel as forumsPanel';
'require view.tieba-sign.qr-log as qrLog';

function collectMethods(instance) {
    const result = {};
    let proto = instance;
    while (proto && proto !== Object.prototype) {
        for (const key of Object.getOwnPropertyNames(proto)) {
            if (key !== 'constructor' && !(key in result)) {
                const val = proto[key];
                if (typeof val === 'function' || typeof val !== 'undefined')
                    result[key] = val;
            }
        }
        proto = Object.getPrototypeOf(proto);
    }
    return result;
}

const _rpc = collectMethods(tsRpc);
const { callStatusLog } = _rpc;

return view.extend(Object.assign({

    _pollTimer: null,
    _dirty: false,
    _forumsAccounts: [],
    _forumsCurrentSid: '',
    _forums: [],
    _signResults: {},
    _forumsFilter: 'all',
    _forumsSearch: '',
    _forumsLoaded: false,
    _forumsEventsBound: false,
    _forumsUpdating: false,
    _forumsConsoleLines: [],
    _statsLoaded: false,
    _wasRunning: false,

    load() {
        return Promise.all([
            uci.load('tieba-sign'),
            callStatusLog().catch(() => ({ status: { state: 'idle', accounts: [] }, result: '' })),
        ]);
    },

    render([_uci, slRaw]) {
        const status  = (slRaw && slRaw.status && typeof slRaw.status === 'object')
            ? slRaw.status
            : { state: 'idle', accounts: [] };
        const logText = slRaw && slRaw.result !== undefined ? slRaw.result : '暂无日志';

        this._injectCSS();

        const root = document.createElement('div');
        root.id = 'ts-app';

        root.appendChild(this._buildHero(status));
        root.appendChild(this._buildTabNav('main'));

        const mainPanel = document.createElement('div');
        mainPanel.id = 'ts-main-panel';
        mainPanel.appendChild(this._buildMainGrid());
        mainPanel.appendChild(this._buildAccountsCard());
        mainPanel.appendChild(this._buildStatusCard(status, logText));
        mainPanel.appendChild(this._buildSaveBar());
        root.appendChild(mainPanel);

        const forumsPanel = document.createElement('div');
        forumsPanel.id = 'ts-forums-panel';
        forumsPanel.style.display = 'none';
        forumsPanel.appendChild(this._buildForumsCard());
        root.appendChild(forumsPanel);

        const statsPanel = document.createElement('div');
        statsPanel.id = 'ts-stats-panel';
        statsPanel.style.display = 'none';
        statsPanel.appendChild(this._buildStatsCard());
        root.appendChild(statsPanel);

        this._root = root;

        this._populateForm(root);
        this._bindEvents(root);
        if (typeof this._bindVisibilityResumeRefresh === 'function')
            this._bindVisibilityResumeRefresh();
        this._wasRunning = !!(status && status.state === 'running');
        if (status && status.state === 'running') {
            this._startPolling();
            setTimeout(() => this._refreshStatus(), 0);
        }

        setTimeout(() => {
            const body = root.querySelector('#ts-status-body');
            if (body) {
                this._applyLogToStatusBody(body, logText);
                this._bindLogFilters(body);
            }
        }, 0);

        return root;
    },

    handleSave: null,
    handleSaveApply: null,
    handleReset: null,
}, collectMethods(mainUi), collectMethods(mainStats), collectMethods(mainActions), collectMethods(mainMonitor), collectMethods(forumsPanel), collectMethods(qrLog)));
