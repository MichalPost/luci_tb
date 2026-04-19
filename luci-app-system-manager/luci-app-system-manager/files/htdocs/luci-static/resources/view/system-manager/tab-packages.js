'use strict';
'require baseclass';
'require view.system-manager.rpc as smRpc';

var _installedPkgs = [];

function filterPkgs(pkgs, kw) {
    if (!kw) return pkgs;
    var k = kw.toLowerCase();
    return pkgs.filter(function(p) {
        return (p.name || '').toLowerCase().includes(k) ||
               (p.description || '').toLowerCase().includes(k);
    });
}

function fmtSize(bytes) {
    if (!bytes) return '-';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
}

function appendLog(logEl, text) {
    logEl.textContent += text + '\n';
    logEl.scrollTop = logEl.scrollHeight;
}

function el(tag, cls, children) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (children) children.forEach(function(c) {
        if (c == null) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
}

function renderInstalledTable(pkgs, container) {
    var kw = (document.getElementById('sm-pkg-search') || {}).value || '';
    var filtered = filterPkgs(pkgs, kw);
    container.innerHTML = '';
    if (filtered.length === 0) {
        var empty = el('div', 'sm-empty');
        empty.innerHTML = '<span class="sm-empty-icon">\uD83D\uDCE6</span>\u65E0\u5339\u914D\u5305';
        container.appendChild(empty); return;
    }
    var table = el('table', 'sm-table');
    var thead = el('thead'); var htr = el('tr');
    var cbAll = document.createElement('input');
    cbAll.type = 'checkbox'; cbAll.id = 'sm-pkg-check-all';
    var thCb = el('th'); thCb.appendChild(cbAll); htr.appendChild(thCb);
    ['\u5305\u540D', '\u7248\u672C', '\u5927\u5C0F', '\u63CF\u8FF0', '\u64CD\u4F5C'].forEach(function(h) { htr.appendChild(el('th', null, [h])); });
    thead.appendChild(htr); table.appendChild(thead);
    var tbody = el('tbody');
    filtered.forEach(function(pkg) {
        var cb = document.createElement('input');
        cb.type = 'checkbox'; cb.className = 'sm-pkg-cb'; cb.dataset.name = pkg.name;
        var removeBtn = el('button', 'sm-action-btn danger');
        removeBtn.type = 'button'; removeBtn.textContent = '\u5378\u8F7D';
        removeBtn.addEventListener('click', function() { removePkg(pkg.name); });
        var tr = el('tr');
        var tdCb = el('td'); tdCb.appendChild(cb); tr.appendChild(tdCb);
        tr.appendChild(el('td', null, [pkg.name]));
        tr.appendChild(el('td', null, [pkg.version || '-']));
        tr.appendChild(el('td', null, [fmtSize(pkg.size)]));
        tr.appendChild(el('td', null, [pkg.description || '-']));
        var tdAct = el('td'); tdAct.appendChild(removeBtn); tr.appendChild(tdAct);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody); container.appendChild(table);
    var checkAll = document.getElementById('sm-pkg-check-all');
    if (checkAll) {
        checkAll.addEventListener('change', function() {
            document.querySelectorAll('.sm-pkg-cb').forEach(function(c) { c.checked = checkAll.checked; });
        });
    }
}

function removePkg(name) {
    var logEl = document.getElementById('sm-pkg-log');
    if (logEl) { logEl.style.display = 'block'; appendLog(logEl, '\u6B63\u5728\u5378\u8F7D ' + name + '...'); }
    return smRpc.callPkgRemove(name).then(function(res) {
        if (logEl) appendLog(logEl, res.log || '');
        if (res.result === 'error') {
            if (logEl) appendLog(logEl, '\u2717 \u5378\u8F7D ' + name + ' \u5931\u8D25');
        } else {
            if (logEl) appendLog(logEl, '\u2713 ' + name + ' \u5378\u8F7D\u6210\u529F');
            return refreshInstalled();
        }
    }).catch(function(e) {
        if (logEl) appendLog(logEl, 'RPC \u9519\u8BEF\uFF1A' + (e.message || e));
    });
}

function refreshInstalled() {
    return smRpc.callPkgInstalled().then(function(data) {
        _installedPkgs = data.packages || [];
        var c = document.getElementById('sm-pkg-installed-container');
        if (c) renderInstalledTable(_installedPkgs, c);
    }).catch(function(e) {
        var c = document.getElementById('sm-pkg-installed-container');
        if (c) c.innerHTML = '<div class="sm-error">\u26A0 \u52A0\u8F7D\u5931\u8D25\uFF1A' + (e.message || e) + '</div>';
    });
}

function renderAvailableTable(pkgs, container) {
    container.innerHTML = '';
    if (!pkgs || pkgs.length === 0) {
        var empty = el('div', 'sm-empty');
        empty.innerHTML = '<span class="sm-empty-icon">\uD83D\uDD0D</span>\u65E0\u7ED3\u679C\uFF0C\u8BF7\u8F93\u5165\u5173\u952E\u8BCD\u641C\u7D22';
        container.appendChild(empty); return;
    }
    var table = el('table', 'sm-table');
    var thead = el('thead'); var htr = el('tr');
    ['\u5305\u540D', '\u7248\u672C', '\u63CF\u8FF0', '\u5B89\u88C5\u4F4D\u7F6E', '\u64CD\u4F5C'].forEach(function(h) { htr.appendChild(el('th', null, [h])); });
    thead.appendChild(htr); table.appendChild(thead);
    var tbody = el('tbody');
    pkgs.forEach(function(pkg) {
        var destSel = document.createElement('select'); destSel.className = 'sm-select';
        var optRoot = document.createElement('option'); optRoot.value = 'root'; optRoot.textContent = '\u5185\u7F6E\u5B58\u50A8';
        var optUsb  = document.createElement('option'); optUsb.value  = 'usb';  optUsb.textContent  = 'U\u76D8';
        destSel.appendChild(optRoot); destSel.appendChild(optUsb);
        var installBtn = el('button', 'sm-action-btn');
        installBtn.type = 'button'; installBtn.textContent = '\u5B89\u88C5';
        installBtn.addEventListener('click', function() { installPkg(pkg.name, destSel.value); });
        var tr = el('tr');
        tr.appendChild(el('td', null, [pkg.name]));
        tr.appendChild(el('td', null, [pkg.version || '-']));
        tr.appendChild(el('td', null, [pkg.description || '-']));
        var tdSel = el('td'); tdSel.appendChild(destSel); tr.appendChild(tdSel);
        var tdAct = el('td'); tdAct.appendChild(installBtn); tr.appendChild(tdAct);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody); container.appendChild(table);
}

function installPkg(name, dest) {
    var logEl = document.getElementById('sm-pkg-log');
    var destLabel = dest === 'usb' ? 'U\u76D8' : '\u5185\u7F6E\u5B58\u50A8';
    if (logEl) { logEl.style.display = 'block'; appendLog(logEl, '\u6B63\u5728\u5B89\u88C5 ' + name + ' \u2192 ' + destLabel + '...'); }
    return smRpc.callPkgInstall(name, dest).then(function(res) {
        if (logEl) appendLog(logEl, res.log || '');
        if (res.result === 'error') {
            if (logEl) appendLog(logEl, '\u2717 \u5B89\u88C5 ' + name + ' \u5931\u8D25');
        } else {
            if (logEl) appendLog(logEl, '\u2713 ' + name + ' \u5B89\u88C5\u6210\u529F');
            return refreshInstalled();
        }
    }).catch(function(e) {
        if (logEl) appendLog(logEl, 'RPC \u9519\u8BEF\uFF1A' + (e.message || e));
    });
}

return baseclass.extend({
    load: function() {
        return smRpc.callPkgInstalled().then(function(data) { return data.packages || []; });
    },

    render: function(data) {
        _installedPkgs = data || [];
        var view = el('div', 'sm-pkg-panel');

        var subtabs = el('div', 'sm-subtabs');
        var tabInst  = el('div', 'sm-subtab active', ['\u5DF2\u5B89\u88C5']);
        var tabAvail = el('div', 'sm-subtab',        ['\u53EF\u7528\u5305']);
        subtabs.appendChild(tabInst); subtabs.appendChild(tabAvail);
        view.appendChild(subtabs);

        var logEl = el('pre', 'sm-log'); logEl.id = 'sm-pkg-log';
        view.appendChild(logEl);

        var panelInst = el('div'); panelInst.id = 'sm-pkg-panel-installed';
        var toolbar = el('div', 'sm-toolbar');
        var searchInput = document.createElement('input');
        searchInput.className = 'sm-input'; searchInput.id = 'sm-pkg-search';
        searchInput.type = 'text'; searchInput.placeholder = '\u641C\u7D22\u5DF2\u5B89\u88C5\u5305\uFF08\u5305\u540D\u6216\u63CF\u8FF0\uFF09';
        searchInput.style.flex = '1';
        var batchBtn = el('button', 'sm-btn sm-btn-danger', ['\u5378\u8F7D\u9009\u4E2D']); batchBtn.type = 'button';
        toolbar.appendChild(searchInput); toolbar.appendChild(batchBtn);
        panelInst.appendChild(toolbar);
        var instContainer = el('div', 'sm-card'); instContainer.id = 'sm-pkg-installed-container';
        panelInst.appendChild(instContainer);
        view.appendChild(panelInst);

        var panelAvail = el('div'); panelAvail.id = 'sm-pkg-panel-available'; panelAvail.style.display = 'none';
        var availToolbar = el('div', 'sm-toolbar');
        var availSearch = document.createElement('input');
        availSearch.className = 'sm-input'; availSearch.id = 'sm-pkg-avail-search';
        availSearch.type = 'text'; availSearch.placeholder = '\u8F93\u5165\u5305\u540D\u5173\u952E\u8BCD\u641C\u7D22';
        availSearch.style.flex = '1';
        var availBtn = el('button', 'sm-btn sm-btn-primary', ['\uD83D\uDD0D \u641C\u7D22']); availBtn.type = 'button';
        availToolbar.appendChild(availSearch); availToolbar.appendChild(availBtn);
        panelAvail.appendChild(availToolbar);
        var availContainer = el('div', 'sm-card'); availContainer.id = 'sm-pkg-available-container';
        var hint = el('div', 'sm-empty');
        hint.innerHTML = '<span class="sm-empty-icon">\uD83D\uDD0D</span>\u8BF7\u8F93\u5165\u5173\u952E\u8BCD\u540E\u70B9\u51FB\u641C\u7D22';
        availContainer.appendChild(hint);
        panelAvail.appendChild(availContainer);
        view.appendChild(panelAvail);

        tabInst.addEventListener('click', function() {
            tabInst.className = 'sm-subtab active'; tabAvail.className = 'sm-subtab';
            panelInst.style.display = ''; panelAvail.style.display = 'none';
        });
        tabAvail.addEventListener('click', function() {
            tabAvail.className = 'sm-subtab active'; tabInst.className = 'sm-subtab';
            panelAvail.style.display = ''; panelInst.style.display = 'none';
        });
        searchInput.addEventListener('input', function() { renderInstalledTable(_installedPkgs, instContainer); });
        batchBtn.addEventListener('click', function() {
            var checked = Array.from(document.querySelectorAll('.sm-pkg-cb:checked')).map(function(c) { return c.dataset.name; });
            if (!checked.length) return;
            logEl.style.display = 'block'; logEl.textContent = '';
            var chain = Promise.resolve();
            checked.forEach(function(name) { chain = chain.then(function() { return removePkg(name); }); });
            chain.then(function() { return refreshInstalled(); });
        });
        availBtn.addEventListener('click', function() {
            var q = availSearch.value.trim();
            if (!q) { availContainer.innerHTML = '<div class="sm-empty"><span class="sm-empty-icon">\uD83D\uDD0D</span>\u8BF7\u8F93\u5165\u5173\u952E\u8BCD</div>'; return; }
            availContainer.innerHTML = '<div class="sm-empty">\u641C\u7D22\u4E2D...</div>';
            smRpc.callPkgAvailable(q).then(function(res) {
                renderAvailableTable(res.packages || [], availContainer);
            }).catch(function(e) {
                availContainer.innerHTML = '<div class="sm-error">\u26A0 \u641C\u7D22\u5931\u8D25\uFF1A' + (e.message || e) + '</div>';
            });
        });
        availSearch.addEventListener('keydown', function(e) { if (e.key === 'Enter') availBtn.click(); });

        renderInstalledTable(_installedPkgs, instContainer);
        return view;
    },
});
