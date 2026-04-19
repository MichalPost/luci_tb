'use strict';
'require rpc';
'require baseclass';

var callFileList    = rpc.declare({ object: 'sm-files',    method: 'file_list',     params: ['path'],            expect: { entries: [] } });
var callFileRead    = rpc.declare({ object: 'sm-files',    method: 'file_read',     params: ['path'],            expect: { content: '' } });
var callFileWrite   = rpc.declare({ object: 'sm-files',    method: 'file_write',    params: ['path', 'content'], expect: {} });
var callFileDelete  = rpc.declare({ object: 'sm-files',    method: 'file_delete',   params: ['path'],            expect: {} });
var callFileStat    = rpc.declare({ object: 'sm-files',    method: 'file_stat',     params: ['path'],            expect: {} });
var callUsbList     = rpc.declare({ object: 'sm-usb',      method: 'usb_list',      params: [],                  expect: { devices: [] } });
var callPkgInstalled = rpc.declare({ object: 'sm-packages', method: 'pkg_installed', params: [],                 expect: { packages: [] } });
var callPkgAvailable = rpc.declare({ object: 'sm-packages', method: 'pkg_available', params: ['query'],          expect: { packages: [] } });
var callPkgInstall   = rpc.declare({ object: 'sm-packages', method: 'pkg_install',   params: ['name', 'dest'],   expect: {} });
var callPkgRemove    = rpc.declare({ object: 'sm-packages', method: 'pkg_remove',    params: ['name'],           expect: {} });
var callCronRead    = rpc.declare({ object: 'sm-cron',     method: 'cron_read',     params: [],                  expect: { entries: [] } });
var callCronWrite   = rpc.declare({ object: 'sm-cron',     method: 'cron_write',    params: ['entries'],         expect: {} });

return baseclass.extend({
    callFileList:    callFileList,
    callFileRead:    callFileRead,
    callFileWrite:   callFileWrite,
    callFileDelete:  callFileDelete,
    callFileStat:    callFileStat,
    callUsbList:     callUsbList,
    callPkgInstalled: callPkgInstalled,
    callPkgAvailable: callPkgAvailable,
    callPkgInstall:  callPkgInstall,
    callPkgRemove:   callPkgRemove,
    callCronRead:    callCronRead,
    callCronWrite:   callCronWrite,
});
