'use strict';
'require baseclass';
'require view.system-manager.rpc as smRpc';

/* smRpc is already an instance (LuCI does new _class() internally).
   The declared call functions are on its prototype — access directly. */

function formatSize(bytes) {
    if (bytes == null) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatMtime(ts) {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleString();
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

function mkBtn(label, cls, onClick) {
    var b = el('button', 'sm-action-btn' + (cls ? ' ' + cls : ''));
    b.type = 'button'; b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
}

return baseclass.extend({
    _currentPath: '/etc',
    _container: null,

    load: function() {
        return smRpc.callFileList(this._currentPath);
    },

    render: function(data) {
        var self = this;
        var wrap = el('div', 'sm-card');
        self._container = wrap;
        self._renderAll(wrap, data);
        return wrap;
    },

    _renderAll: function(wrap, data) {
        var self = this;
        wrap.innerHTML = '';
        wrap.appendChild(self._buildBreadcrumb());
        wrap.appendChild(self._buildToolbar());
        if (data && data.error) {
            var e = el('div', 'sm-error');
            e.textContent = '\u26A0 ' + data.error;
            wrap.appendChild(e);
            return;
        }
        wrap.appendChild(self._buildTable((data && data.entries) ? data.entries : []));
    },

    _buildBreadcrumb: function() {
        var self = this;
        var bar = el('div', 'sm-breadcrumb');
        var path = self._currentPath;
        var parts = path.replace(/\/+$/, '').split('/').filter(function(p) { return p !== ''; });
        var cumulative = ['/'];
        parts.forEach(function(p) {
            cumulative.push(cumulative[cumulative.length - 1].replace(/\/$/, '') + '/' + p);
        });
        cumulative.forEach(function(segPath, i) {
            if (i > 0) bar.appendChild(el('span', 'sm-breadcrumb-sep', ['/']));
            var label = segPath === '/' ? '/' : segPath.split('/').pop();
            var isLast = (i === cumulative.length - 1);
            var item = el('span', 'sm-breadcrumb-item' + (isLast ? ' last' : ''), [label]);
            if (!isLast) {
                (function(p) { item.addEventListener('click', function() { self._navigate(p); }); })(segPath);
            }
            bar.appendChild(item);
        });
        return bar;
    },

    _buildToolbar: function() {
        var self = this;
        var toolbar = el('div', 'sm-toolbar');
        var fileInput = document.createElement('input');
        fileInput.type = 'file'; fileInput.style.display = 'none';
        fileInput.addEventListener('change', function() {
            var file = fileInput.files && fileInput.files[0];
            if (!file) return;
            if (file.size > 50 * 1024 * 1024) {
                alert('\u6587\u4EF6\u8FC7\u5927\uFF08\u6700\u5927 50MB\uFF09');
                fileInput.value = ''; return;
            }
            var targetPath = self._currentPath.replace(/\/$/, '') + '/' + file.name;
            self._uploadFile(targetPath, file).then(function() {
                fileInput.value = '';
                self._navigate(self._currentPath);
            }).catch(function(err) {
                alert('\u4E0A\u4F20\u5931\u8D25\uFF1A' + String(err));
                fileInput.value = '';
            });
        });
        var btnUpload = el('button', 'sm-btn sm-btn-primary');
        btnUpload.type = 'button';
        btnUpload.textContent = '\u2B06 \u4E0A\u4F20\u6587\u4EF6';
        btnUpload.addEventListener('click', function() { fileInput.click(); });
        toolbar.appendChild(fileInput);
        toolbar.appendChild(btnUpload);
        return toolbar;
    },

    _uploadFile: function(targetPath, file) {
        var form = new FormData();
        form.append('sessionid', L.env.sessionid || '');
        form.append('filename', targetPath);
        form.append('filedata', file);
        return fetch('/cgi-bin/luci-upload', { method: 'POST', body: form })
            .then(function(resp) { return resp.json(); });
    },

    _buildTable: function(entries) {
        var self = this;
        if (!entries || entries.length === 0) {
            var empty = el('div', 'sm-empty');
            empty.innerHTML = '<span class="sm-empty-icon">\uD83D\uDCC2</span>\u76EE\u5F55\u4E3A\u7A7A';
            return empty;
        }
        var sorted = entries.slice().sort(function(a, b) {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'dir' ? -1 : 1;
        });
        var table = el('table', 'sm-table');
        var thead = el('thead'); var htr = el('tr');
        ['\u540D\u79F0', '\u5927\u5C0F', '\u4FEE\u6539\u65F6\u95F4', '\u6743\u9650', '\u64CD\u4F5C'].forEach(function(h) {
            htr.appendChild(el('th', null, [h]));
        });
        thead.appendChild(htr); table.appendChild(thead);
        var tbody = el('tbody');
        sorted.forEach(function(entry) {
            var isDir = entry.type === 'dir';
            var icon = isDir ? '\uD83D\uDCC1 ' : '\uD83D\uDCC4 ';
            var tr = el('tr');
            var nameCell = el('td');
            if (isDir) {
                var link = el('span', 'sm-entry-dir', [icon + entry.name]);
                link.addEventListener('click', (function(p) {
                    return function() { self._navigate(p); };
                })(entry.path));
                nameCell.appendChild(link);
            } else {
                nameCell.textContent = icon + entry.name;
            }
            tr.appendChild(nameCell);
            tr.appendChild(el('td', null, [isDir ? '-' : formatSize(entry.size)]));
            tr.appendChild(el('td', null, [formatMtime(entry.mtime)]));
            tr.appendChild(el('td', null, [entry.mode || '-']));
            var actions = el('td');
            if (!isDir) {
                actions.appendChild(mkBtn('\u7F16\u8F91', '', (function(p) {
                    return function() { self._openEditor(p); };
                })(entry.path)));
                actions.appendChild(mkBtn('\u4E0B\u8F7D', '', (function(p) {
                    return function() { self._downloadFile(p); };
                })(entry.path)));
            }
            actions.appendChild(mkBtn('\u5220\u9664', 'danger', (function(p) {
                return function() { self._deleteEntry(p); };
            })(entry.path)));
            tr.appendChild(actions);
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        return table;
    },

    _downloadFile: function(path) {
        var sid = L.env.sessionid || '';
        var url = '/cgi-bin/luci-download?sessionid=' + encodeURIComponent(sid) + '&path=' + encodeURIComponent(path);
        var a = document.createElement('a');
        a.href = url; a.download = path.split('/').pop(); a.style.display = 'none';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    },

    _deleteEntry: function(path) {
        var self = this;
        if (!window.confirm('\u786E\u5B9A\u8981\u5220\u9664 "' + path.split('/').pop() + '" \u5417\uFF1F')) return;
        smRpc.callFileDelete(path).then(function() {
            self._navigate(self._currentPath);
        }).catch(function(err) { alert('\u5220\u9664\u5931\u8D25\uFF1A' + String(err)); });
    },

    _openEditor: function(path) {
        var self = this;
        smRpc.callFileRead(path).then(function(data) {
            var overlay = el('div', 'sm-modal-overlay');
            var modal   = el('div', 'sm-modal');
            var header  = el('div', 'sm-modal-header');
            header.appendChild(el('span', 'sm-modal-title', ['\u7F16\u8F91\uFF1A' + path.split('/').pop()]));
            var closeBtn = el('button', 'sm-btn');
            closeBtn.textContent = '\u2715';
            closeBtn.addEventListener('click', function() { document.body.removeChild(overlay); });
            header.appendChild(closeBtn);
            var body = el('div', 'sm-modal-body');
            var textarea = document.createElement('textarea');
            textarea.className = 'sm-modal-textarea';
            textarea.value = data.content || '';
            body.appendChild(textarea);
            var footer = el('div', 'sm-modal-footer');
            var saveBtn = el('button', 'sm-btn sm-btn-primary', ['\u4FDD\u5B58']);
            saveBtn.addEventListener('click', function() {
                smRpc.callFileWrite(path, textarea.value).then(function() {
                    document.body.removeChild(overlay);
                }).catch(function(err) { alert('\u4FDD\u5B58\u5931\u8D25\uFF1A' + String(err)); });
            });
            var cancelBtn = el('button', 'sm-btn', ['\u53D6\u6D88']);
            cancelBtn.addEventListener('click', function() { document.body.removeChild(overlay); });
            footer.appendChild(saveBtn); footer.appendChild(cancelBtn);
            modal.appendChild(header); modal.appendChild(body); modal.appendChild(footer);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            textarea.focus();
        }).catch(function(err) { alert('\u8BFB\u53D6\u5931\u8D25\uFF1A' + String(err)); });
    },

    _navigate: function(path) {
        var self = this;
        self._currentPath = path;
        smRpc.callFileList(path).then(function(data) {
            self._renderAll(self._container, data);
        }).catch(function(err) {
            self._renderAll(self._container, { error: String(err) });
        });
    }
});
