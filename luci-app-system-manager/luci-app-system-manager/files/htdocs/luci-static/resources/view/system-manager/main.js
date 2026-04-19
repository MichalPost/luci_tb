'use strict';
'require view';
'require view.system-manager.tab-files as TabFiles';
'require view.system-manager.tab-usb as TabUsb';
'require view.system-manager.tab-packages as TabPackages';
'require view.system-manager.tab-cron as TabCron';

var STORAGE_KEY = 'system-manager-tab';

/* 
 * LuCI module loader does: instance = new _class(); return instance;
 * So TabFiles etc. are already instances with prototype methods and default properties.
 * Use them directly — no new, no _collect needed.
 */
var TABS = [
    { id: 'files',    label: '\u6587\u4EF6\u7BA1\u7406', icon: '\uD83D\uDCC1', module: TabFiles    },
    { id: 'usb',      label: 'U\u76D8\u7BA1\u7406',      icon: '\uD83D\uDCBE', module: TabUsb      },
    { id: 'packages', label: '\u8F6F\u4EF6\u5305',        icon: '\uD83D\uDCE6', module: TabPackages },
    { id: 'cron',     label: '\u5B9A\u65F6\u4EFB\u52A1', icon: '\u23F0',       module: TabCron     },
];

var SM_CSS = [
':root{--sm-blue:#1a6cf5;--sm-blue-dark:#1254c4;--sm-blue-light:#e8f0fe;',
'--sm-blue-glow:rgba(26,108,245,.18);--sm-accent:#00c2ff;',
'--sm-bg:#f0f4fb;--sm-surface:#fff;--sm-surface2:#f7f9fd;',
'--sm-border:#dce4f0;--sm-text:#1a2340;--sm-muted:#6b7a99;',
'--sm-red:#e53935;--sm-red-bg:#fdecea;--sm-orange:#f57c00;--sm-green:#1b8a4e;',
'--sm-r:10px;--sm-rs:6px;',
'--sm-shadow:0 2px 12px rgba(26,108,245,.10);--sm-shadow-lg:0 8px 32px rgba(26,108,245,.16);',
'--sm-t:.18s cubic-bezier(.4,0,.2,1);}',

'.sm-container{font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;',
'font-size:14px;color:var(--sm-text);background:var(--sm-bg);min-height:400px;',
'border-radius:var(--sm-r);overflow:hidden;}',

'.sm-tab-nav{display:flex;align-items:stretch;background:var(--sm-surface);',
'border-bottom:2px solid var(--sm-border);padding:0 20px;gap:2px;}',

'.sm-tab-btn{display:inline-flex;align-items:center;gap:6px;padding:14px 20px 12px;',
'border:none;background:transparent;color:var(--sm-muted);font-size:14px;font-weight:500;',
'cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px;',
'transition:color var(--sm-t),border-color var(--sm-t),background var(--sm-t);white-space:nowrap;}',
'.sm-tab-btn:hover{color:var(--sm-blue);background:var(--sm-blue-light);',
'border-radius:var(--sm-rs) var(--sm-rs) 0 0;}',
'.sm-tab-btn--active{color:var(--sm-blue)!important;border-bottom-color:var(--sm-blue)!important;font-weight:600;}',

'.sm-tab-panel{padding:24px;background:var(--sm-bg);min-height:360px;}',

'.sm-card{background:var(--sm-surface);border-radius:var(--sm-r);',
'border:1px solid var(--sm-border);box-shadow:var(--sm-shadow);overflow:hidden;}',

'.sm-breadcrumb{display:flex;align-items:center;flex-wrap:wrap;padding:10px 16px;',
'background:var(--sm-surface2);border-bottom:1px solid var(--sm-border);font-size:13px;gap:2px;}',
'.sm-breadcrumb-sep{color:var(--sm-muted);margin:0 2px;}',
'.sm-breadcrumb-item{color:var(--sm-blue);cursor:pointer;padding:2px 6px;border-radius:4px;',
'transition:background var(--sm-t);}',
'.sm-breadcrumb-item:hover{background:var(--sm-blue-light);}',
'.sm-breadcrumb-item.last,.sm-breadcrumb-item:last-child{color:var(--sm-text);cursor:default;font-weight:500;}',
'.sm-breadcrumb-item.last:hover,.sm-breadcrumb-item:last-child:hover{background:transparent;}',

'.sm-toolbar{display:flex;align-items:center;gap:8px;padding:12px 16px;',
'background:var(--sm-surface);border-bottom:1px solid var(--sm-border);}',

'.sm-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;',
'border-radius:var(--sm-rs);border:1.5px solid var(--sm-border);background:var(--sm-surface);',
'color:var(--sm-text);font-size:13px;font-weight:500;cursor:pointer;',
'transition:all var(--sm-t);white-space:nowrap;}',
'.sm-btn:hover{border-color:var(--sm-blue);color:var(--sm-blue);background:var(--sm-blue-light);}',
'.sm-btn-primary{background:var(--sm-blue);border-color:var(--sm-blue);color:#fff;}',
'.sm-btn-primary:hover{background:var(--sm-blue-dark);border-color:var(--sm-blue-dark);color:#fff;}',
'.sm-btn-danger{color:var(--sm-red);border-color:#f5c6c6;}',
'.sm-btn-danger:hover{background:var(--sm-red-bg);border-color:var(--sm-red);color:var(--sm-red);}',
'.sm-btn:disabled{opacity:.45;cursor:not-allowed;pointer-events:none;}',

'.sm-action-btn{display:inline-flex;align-items:center;padding:3px 10px;border-radius:4px;',
'border:1.5px solid var(--sm-border);background:var(--sm-surface);color:var(--sm-text);',
'font-size:12px;cursor:pointer;transition:all var(--sm-t);margin-right:4px;}',
'.sm-action-btn:hover:not(:disabled){border-color:var(--sm-blue);color:var(--sm-blue);background:var(--sm-blue-light);}',
'.sm-action-btn.danger{color:var(--sm-red);border-color:#f5c6c6;}',
'.sm-action-btn.danger:hover:not(:disabled){background:var(--sm-red-bg);border-color:var(--sm-red);}',
'.sm-action-btn:disabled{opacity:.4;cursor:not-allowed;}',

'.sm-table{width:100%;border-collapse:collapse;font-size:13.5px;}',
'.sm-table th{padding:10px 14px;text-align:left;background:var(--sm-surface2);',
'color:var(--sm-muted);font-weight:600;font-size:12px;text-transform:uppercase;',
'letter-spacing:.04em;border-bottom:2px solid var(--sm-border);}',
'.sm-table td{padding:10px 14px;border-bottom:1px solid var(--sm-border);vertical-align:middle;}',
'.sm-table tbody tr:last-child td{border-bottom:none;}',
'.sm-table tbody tr:hover td{background:var(--sm-blue-light);}',

'.sm-entry-dir{color:var(--sm-blue);cursor:pointer;font-weight:500;}',
'.sm-entry-dir:hover{text-decoration:underline;}',

'.sm-empty{padding:48px 24px;text-align:center;color:var(--sm-muted);font-size:15px;}',
'.sm-empty-icon{font-size:40px;margin-bottom:12px;opacity:.5;display:block;}',
'.sm-error{display:flex;align-items:center;gap:10px;padding:12px 16px;',
'background:var(--sm-red-bg);border:1px solid #f5c6c6;border-radius:var(--sm-rs);',
'color:var(--sm-red);margin:12px 0;font-size:13px;}',

'.sm-input{padding:7px 12px;border:1.5px solid var(--sm-border);border-radius:var(--sm-rs);',
'font-size:13px;color:var(--sm-text);background:var(--sm-surface);',
'transition:border-color var(--sm-t),box-shadow var(--sm-t);outline:none;}',
'.sm-input:focus{border-color:var(--sm-blue);box-shadow:0 0 0 3px var(--sm-blue-glow);}',
'.sm-select{padding:6px 10px;border:1.5px solid var(--sm-border);border-radius:var(--sm-rs);',
'font-size:13px;color:var(--sm-text);background:var(--sm-surface);cursor:pointer;outline:none;}',
'.sm-select:focus{border-color:var(--sm-blue);box-shadow:0 0 0 3px var(--sm-blue-glow);}',

'.sm-badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.03em;}',
'.sm-badge-orange{background:#fff3e0;color:var(--sm-orange);border:1px solid #ffe0b2;}',
'.sm-badge-blue{background:var(--sm-blue-light);color:var(--sm-blue);border:1px solid #c5d8fd;}',

'.sm-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;',
'background:rgba(10,20,50,.55);backdrop-filter:blur(3px);z-index:9999;',
'display:flex;align-items:center;justify-content:center;animation:smFadeIn .15s ease;}',
'@keyframes smFadeIn{from{opacity:0}to{opacity:1}}',
'.sm-modal{background:var(--sm-surface);border-radius:14px;box-shadow:var(--sm-shadow-lg);',
'width:82%;max-width:820px;max-height:82vh;display:flex;flex-direction:column;overflow:hidden;',
'animation:smSlideUp .2s cubic-bezier(.4,0,.2,1);}',
'@keyframes smSlideUp{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}',
'.sm-modal-header{display:flex;align-items:center;justify-content:space-between;',
'padding:16px 20px;border-bottom:1px solid var(--sm-border);background:var(--sm-surface2);}',
'.sm-modal-title{font-weight:600;font-size:15px;color:var(--sm-text);}',
'.sm-modal-body{flex:1;overflow:auto;padding:16px 20px;}',
'.sm-modal-textarea{width:100%;min-height:320px;',
'font-family:"JetBrains Mono","Fira Code","Consolas",monospace;',
'font-size:13px;line-height:1.6;border:1.5px solid var(--sm-border);',
'border-radius:var(--sm-rs);padding:12px;resize:vertical;',
'color:var(--sm-text);background:var(--sm-surface2);box-sizing:border-box;outline:none;}',
'.sm-modal-textarea:focus{border-color:var(--sm-blue);box-shadow:0 0 0 3px var(--sm-blue-glow);}',
'.sm-modal-footer{display:flex;gap:8px;justify-content:flex-end;',
'padding:14px 20px;border-top:1px solid var(--sm-border);background:var(--sm-surface2);}',

'.sm-log{display:none;background:#0d1117;color:#c9d1d9;padding:12px 16px;',
'max-height:220px;overflow-y:auto;font-size:12px;',
'font-family:"JetBrains Mono","Fira Code","Consolas",monospace;',
'border-radius:var(--sm-rs);margin:12px 0;white-space:pre-wrap;',
'line-height:1.6;border:1px solid #30363d;}',

'.sm-device-card{padding:14px 18px;border:2px solid var(--sm-border);',
'border-radius:var(--sm-r);background:var(--sm-surface);cursor:pointer;min-width:210px;',
'transition:all var(--sm-t);box-shadow:var(--sm-shadow);}',
'.sm-device-card:hover{border-color:var(--sm-blue);',
'box-shadow:0 4px 16px var(--sm-blue-glow);transform:translateY(-1px);}',
'.sm-device-card.active{border-color:var(--sm-blue);background:var(--sm-blue-light);',
'box-shadow:0 4px 16px var(--sm-blue-glow);}',
'.sm-device-name{font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px;}',
'.sm-device-cap{font-size:12px;color:var(--sm-muted);margin-top:5px;}',
'.sm-cap-bar{height:4px;background:var(--sm-border);border-radius:2px;margin-top:6px;overflow:hidden;}',
'.sm-cap-bar-fill{height:100%;background:linear-gradient(90deg,var(--sm-blue),var(--sm-accent));',
'border-radius:2px;transition:width .4s ease;}',

'.sm-subtabs{display:flex;border-bottom:2px solid var(--sm-border);margin-bottom:16px;}',
'.sm-subtab{padding:9px 22px;cursor:pointer;font-size:13.5px;font-weight:500;',
'color:var(--sm-muted);border-bottom:3px solid transparent;margin-bottom:-2px;',
'transition:all var(--sm-t);}',
'.sm-subtab:hover{color:var(--sm-blue);}',
'.sm-subtab.active{color:var(--sm-blue);border-bottom-color:var(--sm-blue);font-weight:600;}',

'.sm-form-card{background:var(--sm-surface);border:1px solid var(--sm-border);',
'border-radius:var(--sm-r);padding:20px 24px;margin-top:20px;box-shadow:var(--sm-shadow);}',
'.sm-form-row{display:flex;align-items:center;gap:10px;margin-bottom:14px;}',
'.sm-form-label{width:88px;flex-shrink:0;font-size:13px;color:var(--sm-muted);font-weight:500;}',
'.sm-preview-box{padding:10px 14px;background:var(--sm-surface2);border:1px solid var(--sm-border);',
'border-radius:var(--sm-rs);font-family:"JetBrains Mono","Fira Code","Consolas",monospace;',
'font-size:13px;color:var(--sm-blue);letter-spacing:.02em;}',
'.sm-cmd-error{color:var(--sm-red);font-size:12px;margin-top:4px;display:none;}',

'.sm-section-title{font-size:16px;font-weight:700;color:var(--sm-text);',
'margin:0 0 16px;display:flex;align-items:center;gap:8px;}',
'.sm-section-title::after{content:"";flex:1;height:1px;background:var(--sm-border);margin-left:8px;}',

'.sm-devices-row{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px;}',
].join('');

return view.extend({

    load: function() {
        return Promise.all(
            TABS.map(function(tab) {
                if (tab.module && typeof tab.module.load === 'function')
                    return tab.module.load().catch(function() { return null; });
                return Promise.resolve(null);
            })
        );
    },

    render: function(data) {
        var self = this;

        if (!document.getElementById('sm-design-system')) {
            var gs = document.createElement('style');
            gs.id = 'sm-design-system';
            gs.textContent = SM_CSS;
            document.head.appendChild(gs);
        }

        var container = document.createElement('div');
        container.className = 'sm-container';

        var nav = document.createElement('div');
        nav.className = 'sm-tab-nav';

        var panels = {};
        TABS.forEach(function(tab, idx) {
            var panel = document.createElement('div');
            panel.className = 'sm-tab-panel';
            panel.id = 'sm-panel-' + tab.id;
            panel.style.display = 'none';

            if (tab.module && typeof tab.module.render === 'function') {
                try {
                    var content = tab.module.render(data ? data[idx] : null);
                    if (content) panel.appendChild(content);
                } catch (e) {
                    var err = document.createElement('div');
                    err.className = 'sm-error';
                    err.textContent = '\u26a0 加载失败：' + e.message;
                    panel.appendChild(err);
                }
            }

            panels[tab.id] = panel;
            container.appendChild(panel);
        });

        TABS.forEach(function(tab) {
            var btn = document.createElement('button');
            btn.className = 'sm-tab-btn';
            btn.dataset.tab = tab.id;
            btn.innerHTML = '<span>' + tab.icon + '</span><span>' + tab.label + '</span>';
            btn.addEventListener('click', function() {
                self._switchTab(tab.id, nav, panels);
            });
            nav.appendChild(btn);
        });

        container.insertBefore(nav, container.firstChild);

        var savedTab = null;
        try { savedTab = localStorage.getItem(STORAGE_KEY); } catch(e) {}
        var initialTab = (savedTab && TABS.some(function(t) { return t.id === savedTab; }))
            ? savedTab : TABS[0].id;
        this._switchTab(initialTab, nav, panels, true);

        return container;
    },

    isDirty: function() {
        var activePanel = document.querySelector('.sm-tab-panel:not([style*="none"])');
        if (!activePanel) return false;
        var inputs = activePanel.querySelectorAll('input, textarea, select');
        for (var i = 0; i < inputs.length; i++) {
            var inp = inputs[i];
            if (inp.type === 'checkbox' || inp.type === 'radio') {
                if (inp.checked !== inp.defaultChecked) return true;
            } else {
                if (inp.value !== inp.defaultValue) return true;
            }
        }
        return false;
    },

    _switchTab: function(tabId, nav, panels, skipDirtyCheck) {
        if (!skipDirtyCheck && this.isDirty()) {
            if (!window.confirm('当前有未保存的修改，确定要切换标签页吗？')) return;
        }
        nav.querySelectorAll('.sm-tab-btn').forEach(function(btn) {
            btn.classList.toggle('sm-tab-btn--active', btn.dataset.tab === tabId);
        });
        Object.keys(panels).forEach(function(id) {
            panels[id].style.display = (id === tabId) ? '' : 'none';
        });
        try { localStorage.setItem(STORAGE_KEY, tabId); } catch(e) {}
    },

    handleSave: null,
    handleSaveApply: null,
    handleReset: null,
});
