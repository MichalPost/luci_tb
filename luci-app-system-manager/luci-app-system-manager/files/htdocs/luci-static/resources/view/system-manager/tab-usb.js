'use strict';
'require baseclass';
'require view.system-manager.rpc as smRpc';

function fmtSize(bytes) {
    if (bytes == null) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
}

function fmtMtime(ts) {
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

function actionBtn(label, cls, onClick, disabled) {
    var b = el('button', 'sm-action-btn' + (cls ? ' ' + cls : ''));
    b.type = 'button'; b.textContent = label;
    if (disabled) b.disabled = true;
    b.addEventListener('click', onClick);
    return b;
}

return baseclass.extend({
    _container: null,
    _selectedDevice: null,
    _currentPath: null,

    load: function() { return smRpc.callUsbList(); },

    render: function(data) {
        var self = this;
        var container = el('div', 'sm-usb-panel');
        self._container = container;
        self._renderAll(container, data, null);
        return container;
    },

    _renderAll: function(container, usbData, fileData) {
        var self = this;
        container.innerHTML = '';
        var devices = (usbData && usbData.devices) ? usbData.devices : [];

        if (devices.length === 0) {
            var empty = el('div', 'sm-empty');
            empty.innerHTML = '<span class="sm-empty-icon">\uD83D\uDCBE</span>\u672A\u68C0\u6D4B\u5230 U\u76D8';
            var refreshBtn = el('button', 'sm-btn sm-btn-primary', ['\uD83D\uDD04 \u5237\u65B0']);
            refreshBtn.style.marginTop = '16px';
            refreshBtn.addEventListener('click', function() {
                smRpc.callUsbList().then(function(d) {
                    self._renderAll(container, d, null);
                }).catch(function() { self._renderAll(container, { devices: [] }, null); });
            });
            empty.appendChild(refreshBtn);
            container.appendChild(empty);
            return;
        }

        var devRow = el('div', 'sm-devices-row');
        devices.forEach(function(device) {
            var isActive = self._selectedDevice && self._selectedDevice.mountpoint === device.mountpoint;
            var card = el('div', 'sm-device-card' + (isActive ? ' active' : ''));
            var nameRow = el('div', 'sm-device-name');
            nameRow.appendChild(document.createTextNode('\uD83D\uDCBE ' + device.name));
            if (device.readonly) nameRow.appendChild(el('span', 'sm-badge sm-badge-orange', ['\u53EA\u8BFB']));
            card.appendChild(nameRow);
            card.appendChild(el('div', 'sm-device-cap', [
                '\u5DF2\u7528 ' + fmtSize(device.used) + ' / \u5171 ' + fmtSize(device.total) +
                ' (\u53EF\u7528 ' + fmtSize(device.available) + ')'
            ]));
            var pct = device.total > 0 ? Math.round(device.used / device.total * 100) : 0;
            var bar = el('div', 'sm-cap-bar');
            var fill = el('div', 'sm-cap-bar-fill');
            fill.style.width = pct + '%';
            bar.appendChild(fill); card.appendChild(bar);
            card.addEventListener('click', (function(dev) {
                return function() {
                    self._selectedDevice = dev;
                    self._currentPath = dev.mountpoint;
                    self._loadFiles(container, devices, dev, dev.mountpoint);
                };
            })(device));
            devRow.appendChild(card);
        });
        container.appendChild(devRow);

        if (self._selectedDevice) {
            var currentDev = null;
            devices.forEach(function(d) { if (d.mountpoint === self._selectedDevice.mountpoint) currentDev = d; });
            if (!currentDev) currentDev = self._selectedDevice;
            if (fileData) {
                container.appendChild(self._buildFilePanel(currentDev, fileData));
            } else {
                var path = self._currentPath || currentDev.mountpoint;
                smRpc.callFileList(path).then(function(data) {
                    container.innerHTML = '';
                    container.appendChild(devRow);
                    container.appendChild(self._buildFilePanel(currentDev, data));
                }).catch(function(err) {
                    container.innerHTML = '';
                    container.appendChild(devRow);
                    container.appendChild(self._buildFilePanel(currentDev, { error: String(err) }));
                });
            }
        }
    },

    _loadFiles: function(container, devices, device, path) {
        var self = this;
        self._currentPath = path;
        smRpc.callFileList(path).then(function(data) {
            container.innerHTML = '';
            var devRow = el('div', 'sm-devices-row');
            devices.forEach(function(dev) {
                var card = el('div', 'sm-device-card' + (dev.mountpoint === device.mountpoint ? ' active' : ''));
                var nameRow = el('div', 'sm-device-name');
                nameRow.appendChild(document.createTextNode('\uD83D\uDCBE ' + dev.name));
                if (dev.readonly) nameRow.appendChild(el('span', 'sm-badge sm-badge-orange', ['\u53EA\u8BFB']));
                card.appendChild(nameRow);
                var pct = dev.total > 0 ? Math.round(dev.used / dev.total * 100) : 0;
                card.appendChild(el('div', 'sm-device-cap', ['\u5DF2\u7528 ' + fmtSize(dev.used) + ' / \u5171 ' + fmtSize(dev.total)]));
                var bar = el('div', 'sm-cap-bar');
                var fill = el('div', 'sm-cap-bar-fill');
                fill.style.width = pct + '%';
                bar.appendChild(fill); card.appendChild(bar);
                card.addEventListener('click', (function(d) {
                    return function() {
                        self._selectedDevice = d;
                        self._currentPath = d.mountpoint;
                        self._loadFiles(container, devices, d, d.mountpoint);
                    };
                })(dev));
                devRow.appendChild(card);
            });
            container.appendChild(devRow);
            container.appendChild(self._buildFilePanel(device, data));
        }).catch(function(err) {
            container.innerHTML = '';
            self._renderAll(container, { devices: devices }, { error: String(err) });
        });
    },

    _buildFilePanel: function(device, fileData) {
        var self = this;
        var panel = el('div', 'sm-card sm-usb-file-panel');
        panel.style.marginTop = '4px';
        panel.appendChild(self._buildBreadcrumb(device));
        panel.appendChild(self._buildToolbar(device));
        if (fileData && fileData.error) {
            var errDiv = el('div', 'sm-error');
            errDiv.textContent = '\u26A0 ' + fileData.error;
            panel.appendChild(errDiv);
            return panel;
        }
        panel.appendChild(self._buildTable(device, (fileData && fileData.entries) ? fileData.entries : []));
        return panel;
    },

    _buildBreadcrumb: function(device) {
        var self = this;
        var bar = el('div', 'sm-breadcrumb');
        var path = self._currentPath || device.mountpoint;
        var mountpoint = device.mountpoint;
        var relative = path.substring(mountpoint.length).replace(/^\//, '');
        var parts = relative ? relative.split('/') : [];
        var rootItem = el('span', 'sm-breadcrumb-item' + (parts.length === 0 ? ' last' : ''), [device.name]);
        if (parts.length > 0) rootItem.addEventListener('click', function() { self._navigateTo(device, mountpoint); });
        bar.appendChild(rootItem);
        parts.forEach(function(part, i) {
            bar.appendChild(el('span', 'sm-breadcrumb-sep', ['/']));
            var segPath = mountpoint + '/' + parts.slice(0, i + 1).join('/');
            var isLast = (i === parts.length - 1);
            var item = el('span', 'sm-breadcrumb-item' + (isLast ? ' last' : ''), [part]);
            if (!isLast) {
                (function(p) { item.addEventListener('click', function() { self._navigateTo(device, p); }); })(segPath);
            }
            bar.appendChild(item);
        });
        return bar;
    },

    _buildToolbar: function(device) {
        var self = this;
        var toolbar = el('div', 'sm-toolbar');
        var fileInput = document.createElement('input');
        fileInput.type = 'file'; fileInput.style.display = 'none';
        fileInput.addEventListener('change', function() {
            var file = fileInput.files && fileInput.files[0];
            if (!file) return;
            if (file.size > 50 * 1024 * 1024) { alert('\u6587\u4EF6\u8FC7\u5927\uFF08\u6700\u5927 50MB\uFF09'); fileInput.value = ''; return; }
            var targetPath = (self._currentPath || device.mountpoint).replace(/\/$/, '') + '/' + file.name;
            self._uploadFile(targetPath, file).then(function() {
                fileInput.value = '';
                self._navigateTo(device, self._currentPath || device.mountpoint);
            }).catch(function(err) { alert('\u4E0A\u4F20\u5931\u8D25\uFF1A' + String(err)); fileInput.value = ''; });
        });
        var uploadBtn = el('button', 'sm-btn sm-btn-primary');
        uploadBtn.type = 'button'; uploadBtn.textContent = '\u2B06 \u4E0A\u4F20\u6587\u4EF6';
        if (device.readonly) uploadBtn.disabled = true;
        uploadBtn.addEventListener('click', function() { if (!device.readonly) fileInput.click(); });
        toolbar.appendChild(fileInput); toolbar.appendChild(uploadBtn);
        return toolbar;
    },

    _uploadFile: function(targetPath, file) {
        var form = new FormData();
        form.append('sessionid', L.env.sessionid || '');
        form.append('filename', targetPath);
        form.append('filedata', file);
        return fetch('/cgi-bin/luci-upload', { method: 'POST', body: form }).then(function(r) { return r.json(); });
    },

    _buildTable: function(device, entries) {
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
        ['\u540D\u79F0', '\u5927\u5C0F', '\u4FEE\u6539\u65F6\u95F4', '\u64CD\u4F5C'].forEach(function(h) { htr.appendChild(el('th', null, [h])); });
        thead.appendChild(htr); table.appendChild(thead);
        var tbody = el('tbody');
        sorted.forEach(function(entry) {
            var isDir = entry.type === 'dir';
            var icon = isDir ? '\uD83D\uDCC1 ' : '\uD83D\uDCC4 ';
            var tr = el('tr');
            var nameCell = el('td');
            if (isDir) {
                var link = el('span', 'sm-entry-dir', [icon + entry.name]);
                link.addEventListener('click', (function(p) { return function() { self._navigateTo(device, p); }; })(entry.path));
                nameCell.appendChild(link);
            } else { nameCell.textContent = icon + entry.name; }
            tr.appendChild(nameCell);
            tr.appendChild(el('td', null, [isDir ? '-' : fmtSize(entry.size)]));
            tr.appendChild(el('td', null, [fmtMtime(entry.mtime)]));
            var actions = el('td');
            if (!isDir) {
                actions.appendChild(actionBtn('\u4E0B\u8F7D', '', (function(p) { return function() { self._downloadFile(p); }; })(entry.path)));
            }
            actions.appendChild(actionBtn('\u5220\u9664', 'danger', (function(p) { return function() { self._deleteEntry(device, p); }; })(entry.path), device.readonly));
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

    _deleteEntry: function(device, path) {
        var self = this;
        if (!window.confirm('\u786E\u5B9A\u8981\u5220\u9664 "' + path.split('/').pop() + '" \u5417\uFF1F')) return;
        smRpc.callFileDelete(path).then(function() {
            self._navigateTo(device, self._currentPath || device.mountpoint);
        }).catch(function(err) { alert('\u5220\u9664\u5931\u8D25\uFF1A' + String(err)); });
    },

    _navigateTo: function(device, path) {
        var self = this;
        self._currentPath = path;
        smRpc.callFileList(path).then(function(data) {
            var panel = self._container.querySelector('.sm-usb-file-panel');
            if (panel) self._container.replaceChild(self._buildFilePanel(device, data), panel);
        }).catch(function(err) {
            var panel = self._container.querySelector('.sm-usb-file-panel');
            if (panel) self._container.replaceChild(self._buildFilePanel(device, { error: String(err) }), panel);
        });
    }
});
