'use strict';
'require baseclass';
'require rpc';

const callStatus       = rpc.declare({ object: 'tieba-sign', method: 'status',        expect: {} });
const callStatusLog    = rpc.declare({ object: 'tieba-sign', method: 'status_log',    expect: {} });
const callRun          = rpc.declare({ object: 'tieba-sign', method: 'run',           expect: {} });
const callResume       = rpc.declare({ object: 'tieba-sign', method: 'resume',        expect: {} });
const callStop         = rpc.declare({ object: 'tieba-sign', method: 'stop',          expect: {} });
const callLog          = rpc.declare({ object: 'tieba-sign', method: 'log',           expect: {} });
const callAccountCheck = rpc.declare({ object: 'tieba-sign', method: 'account_check', params: ['sid'], expect: {} });
const callQrStart      = rpc.declare({ object: 'tieba-sign', method: 'qr_start',      expect: {} });
const callQrPoll       = rpc.declare({ object: 'tieba-sign', method: 'qr_poll',       params: ['sign'], expect: {} });
const callClearLog     = rpc.declare({ object: 'tieba-sign', method: 'clear_log',    expect: {} });
const callForumsList   = rpc.declare({ object: 'tieba-sign', method: 'forums_list',   params: ['sid'], expect: {} });
const callSignResult   = rpc.declare({ object: 'tieba-sign', method: 'sign_result',   params: ['sid'], expect: {} });
const callSignHistory  = rpc.declare({ object: 'tieba-sign', method: 'sign_history',  expect: {} });
const callForumsUpdate = rpc.declare({ object: 'tieba-sign', method: 'forums_update', params: ['sid'], expect: {} });
const callForumsDebugRaw = rpc.declare({ object: 'tieba-sign', method: 'forums_debug_raw', params: ['sid'], expect: {} });
const callUnfollow     = rpc.declare({ object: 'tieba-sign', method: 'forum_unfollow', params: ['sid', 'name', 'fid'], expect: {} });

const FORUMS_UPDATE_TIMEOUT_MS = 120000;

return baseclass.extend({
    callStatus,
    callStatusLog,
    callRun,
    callResume,
    callStop,
    callLog,
    callAccountCheck,
    callQrStart,
    callQrPoll,
    callClearLog,
    callForumsList,
    callSignResult,
    callSignHistory,
    callForumsUpdate,
    callForumsDebugRaw,
    callUnfollow,
    FORUMS_UPDATE_TIMEOUT_MS,
});
