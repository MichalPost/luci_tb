'use strict';
'require baseclass';
'require view.system-manager.rpc as smRpc';
'require view.system-manager.cron-builder as smCB';

var FREQ_LABELS = {
    hourly:   '\u6BCF\u5C0F\u65F6',
    daily:    '\u6BCF\u5929',
    weekly:   '\u6BCF\u5468',
    monthly:  '\u6BCF\u6708',
    interval: '\u81EA\u5B9A\u4E49\u95F4\u9694'
};
var WEEKDAY_LABELS = [
    '\u5468\u65E5', '\u5468\u4E00', '\u5468\u4E8C',
    '\u5468\u4E09', '\u5468\u56DB', '\u5468\u4E94', '\u5468\u516D'
];

function el(tag, cls, children) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (children) [].concat(children).forEach(function(c) {
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
}

function makeSelect(cls, options, selected) {
    var sel = document.createElement('select'); sel.className = cls || 'sm-select';
    options.forEach(function(o) {
        var opt = document.createElement('option');
        opt.value = o.value; opt.textContent = o.label;
        if (String(o.value) === String(selected)) opt.selected = true;
        sel.appendChild(opt);
    });
    return sel;
}

function rangeOpts(from, to) {
    var opts = [];
    for (var i = from; i <= to; i++) opts.push({ value: i, label: String(i).padStart(2, '0') });
    return opts;
}

function renderList(entries, container, onDelete) {
    container.innerHTML = '';
    if (!entries || !entries.length) {
        var empty = el('div', 'sm-empty');
        empty.innerHTML = '<span class="sm-empty-icon">\u23F0</span>\u6682\u65E0\u5B9A\u65F6\u4EFB\u52A1';
        container.appendChild(empty); return;
    }
    var table = el('table', 'sm-table');
    var thead = el('thead'); var htr = el('tr');
    ['\u63CF\u8FF0', '\u547D\u4EE4', '\u64CD\u4F5C'].forEach(function(h) { htr.appendChild(el('th', null, [h])); });
    thead.appendChild(htr); table.appendChild(thead);
    var tbody = el('tbody');
    entries.forEach(function(entry) {
        var desc = smCB.parse(entry.expr);
        var tr = el('tr');
        tr.appendChild(el('td', null, [desc]));
        var cmdCell = el('td');
        cmdCell.style.fontFamily = '"JetBrains Mono","Fira Code","Consolas",monospace';
        cmdCell.style.wordBreak = 'break-all';
        cmdCell.textContent = entry.command;
        tr.appendChild(cmdCell);
        var delBtn = el('button', 'sm-action-btn danger', ['\u5220\u9664']);
        delBtn.type = 'button';
        delBtn.addEventListener('click', function() { onDelete(entry); });
        var tdAct = el('td'); tdAct.appendChild(delBtn); tr.appendChild(tdAct);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody); container.appendChild(table);
}

function buildForm(listContainer, entriesRef) {
    var card = el('div', 'sm-form-card');
    card.appendChild(el('div', 'sm-section-title', ['\u2795 \u6DFB\u52A0\u5B9A\u65F6\u4EFB\u52A1']));

    var freqSel = makeSelect('sm-select', Object.keys(FREQ_LABELS).map(function(k) {
        return { value: k, label: FREQ_LABELS[k] };
    }), 'daily');
    var freqRow = el('div', 'sm-form-row');
    freqRow.appendChild(el('span', 'sm-form-label', ['\u6267\u884C\u9891\u7387']));
    freqRow.appendChild(freqSel);
    card.appendChild(freqRow);

    var hourSel = makeSelect('sm-select', rangeOpts(0, 23), 0);
    var minSel  = makeSelect('sm-select', rangeOpts(0, 59), 0);
    var timeRow = el('div', 'sm-form-row'); timeRow.id = 'cron-time-row';
    timeRow.appendChild(el('span', 'sm-form-label', ['\u65F6\u95F4']));
    timeRow.appendChild(el('span', null, ['\u5C0F\u65F6 '])); timeRow.appendChild(hourSel);
    timeRow.appendChild(el('span', null, ['\u00A0 \u5206\u949F '])); timeRow.appendChild(minSel);
    card.appendChild(timeRow);

    var wdSel = makeSelect('sm-select', WEEKDAY_LABELS.map(function(l, i) { return { value: i, label: l }; }), 1);
    var wdRow = el('div', 'sm-form-row'); wdRow.id = 'cron-wd-row'; wdRow.style.display = 'none';
    wdRow.appendChild(el('span', 'sm-form-label', ['\u661F\u671F'])); wdRow.appendChild(wdSel);
    card.appendChild(wdRow);

    var mdSel = makeSelect('sm-select', rangeOpts(1, 28), 1);
    var mdRow = el('div', 'sm-form-row'); mdRow.id = 'cron-md-row'; mdRow.style.display = 'none';
    mdRow.appendChild(el('span', 'sm-form-label', ['\u65E5\u671F'])); mdRow.appendChild(mdSel);
    card.appendChild(mdRow);

    var ivInput = document.createElement('input');
    ivInput.className = 'sm-input'; ivInput.type = 'number'; ivInput.min = '1'; ivInput.max = '59'; ivInput.value = '15'; ivInput.style.width = '72px';
    var ivRow = el('div', 'sm-form-row'); ivRow.id = 'cron-iv-row'; ivRow.style.display = 'none';
    ivRow.appendChild(el('span', 'sm-form-label', ['\u95F4\u9694'])); ivRow.appendChild(ivInput);
    ivRow.appendChild(el('span', null, [' \u5206\u949F\uFF081\u201359\uFF09']));
    card.appendChild(ivRow);

    var cmdInput = document.createElement('input');
    cmdInput.className = 'sm-input'; cmdInput.type = 'text';
    cmdInput.placeholder = '\u8F93\u5165 shell \u547D\u4EE4\uFF0C\u4F8B\u5982 /usr/bin/my-script.sh';
    cmdInput.style.flex = '1';
    var cmdErr = el('span', 'sm-cmd-error', ['\u547D\u4EE4\u4E0D\u80FD\u4E3A\u7A7A']);
    var cmdRow = el('div', 'sm-form-row');
    cmdRow.appendChild(el('span', 'sm-form-label', ['\u547D\u4EE4']));
    var cmdWrap = el('div'); cmdWrap.style.flex = '1';
    cmdWrap.appendChild(cmdInput); cmdWrap.appendChild(cmdErr);
    cmdRow.appendChild(cmdWrap); card.appendChild(cmdRow);

    var previewBox = el('div', 'sm-preview-box', ['']);
    var previewRow = el('div', 'sm-form-row');
    previewRow.appendChild(el('span', 'sm-form-label', ['\u9884\u89C8']));
    previewRow.appendChild(previewBox);
    card.appendChild(previewRow);

    var addBtn = el('button', 'sm-btn sm-btn-primary', ['\u2795 \u6DFB\u52A0\u4EFB\u52A1']); addBtn.type = 'button';
    card.appendChild(addBtn);

    function updateVis() {
        var f = freqSel.value;
        timeRow.style.display = (f === 'hourly' || f === 'interval') ? 'none' : '';
        wdRow.style.display   = f === 'weekly'   ? '' : 'none';
        mdRow.style.display   = f === 'monthly'  ? '' : 'none';
        ivRow.style.display   = f === 'interval' ? '' : 'none';
    }

    function getOpts() {
        return {
            frequency: freqSel.value,
            hour:      parseInt(hourSel.value, 10),
            minute:    parseInt(minSel.value,  10),
            weekday:   parseInt(wdSel.value,   10),
            monthday:  parseInt(mdSel.value,   10),
            interval:  parseInt(ivInput.value, 10) || 15
        };
    }

    function updatePreview() {
        var expr = smCB.build(getOpts());
        previewBox.textContent = expr + '  \u2192  ' + smCB.parse(expr);
    }

    function onChange() { updateVis(); updatePreview(); }
    [freqSel, hourSel, minSel, wdSel, mdSel, ivInput].forEach(function(c) {
        c.addEventListener('change', onChange); c.addEventListener('input', onChange);
    });

    addBtn.addEventListener('click', function() {
        var cmd = cmdInput.value.trim();
        if (!cmd) { cmdErr.style.display = 'block'; return; }
        cmdErr.style.display = 'none';
        var expr = smCB.build(getOpts());
        var updated = entriesRef.entries.concat([{ expr: expr, command: cmd }]).map(function(e, i) {
            return { expr: e.expr, command: e.command, index: i };
        });
        smRpc.callCronWrite(updated).then(function(res) {
            if (res && res.result === 'error') { alert('\u5199\u5165\u5931\u8D25\uFF1A' + (res.error || '\u672A\u77E5\u9519\u8BEF')); return; }
            cmdInput.value = '';
            return smRpc.callCronRead().then(function(data) {
                entriesRef.entries = data.entries || [];
                renderList(entriesRef.entries, listContainer, makeDeleteHandler(listContainer, entriesRef));
            });
        });
    });

    updateVis(); updatePreview();
    return card;
}

function makeDeleteHandler(listContainer, entriesRef) {
    return function onDelete(entry) {
        if (!confirm('\u786E\u8BA4\u5220\u9664\u8BE5\u4EFB\u52A1\uFF1F\n' + entry.command)) return;
        var remaining = entriesRef.entries.filter(function(e) {
            return !(e.expr === entry.expr && e.command === entry.command);
        }).map(function(e, i) { return { expr: e.expr, command: e.command, index: i }; });
        smRpc.callCronWrite(remaining).then(function(res) {
            if (res && res.result === 'error') { alert('\u5220\u9664\u5931\u8D25\uFF1A' + (res.error || '\u672A\u77E5\u9519\u8BEF')); return; }
            return smRpc.callCronRead().then(function(data) {
                entriesRef.entries = data.entries || [];
                renderList(entriesRef.entries, listContainer, makeDeleteHandler(listContainer, entriesRef));
            });
        });
    };
}

return baseclass.extend({
    load: function() { return smRpc.callCronRead(); },

    render: function(data) {
        var entries = (data && data.entries) ? data.entries : [];
        var entriesRef = { entries: entries };
        var container = el('div', 'sm-cron-panel');
        container.appendChild(el('div', 'sm-section-title', ['\u23F0 \u5F53\u524D\u4EFB\u52A1\u5217\u8868']));
        var listCard = el('div', 'sm-card');
        var listContainer = el('div');
        renderList(entries, listContainer, makeDeleteHandler(listContainer, entriesRef));
        listCard.appendChild(listContainer);
        container.appendChild(listCard);
        container.appendChild(buildForm(listContainer, entriesRef));
        return container;
    }
});
