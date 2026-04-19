'use strict';
'require baseclass';

return baseclass.extend({

    /* ── CronBuilder.build(options) → cron expression string ── */
    build: function(options) {
        var freq     = options.frequency;
        var hour     = options.hour     != null ? options.hour     : 0;
        var minute   = options.minute   != null ? options.minute   : 0;
        var weekday  = options.weekday  != null ? options.weekday  : 0;
        var monthday = options.monthday != null ? options.monthday : 1;
        var interval = options.interval != null ? options.interval : 15;

        switch (freq) {
            case 'hourly':   return '0 * * * *';
            case 'daily':    return minute + ' ' + hour + ' * * *';
            case 'weekly':   return minute + ' ' + hour + ' * * ' + weekday;
            case 'monthly':  return minute + ' ' + hour + ' ' + monthday + ' * *';
            case 'interval': return '*/' + interval + ' * * * *';
            default:         return '0 * * * *';
        }
    },

    /* ── CronParser.parse(expr) → Chinese description ── */
    parse: function(expr) {
        var parts = (expr || '').trim().split(/\s+/);
        if (parts.length < 5) return expr;
        var min = parts[0], hour = parts[1], dom = parts[2], mon = parts[3], dow = parts[4];
        var DAYS = ['\u5468\u65E5','\u5468\u4E00','\u5468\u4E8C','\u5468\u4E09','\u5468\u56DB','\u5468\u4E94','\u5468\u516D'];

        if (min === '0' && hour === '*' && dom === '*' && mon === '*' && dow === '*')
            return '\u6BCF\u5C0F\u65F6\u6574\u70B9\u6267\u884C';
        if (/^\*\/\d+$/.test(min) && hour === '*' && dom === '*' && mon === '*' && dow === '*')
            return '\u6BCF ' + min.slice(2) + ' \u5206\u949F\u6267\u884C';
        if (dom === '*' && mon === '*' && /^\d$/.test(dow))
            return '\u6BCF' + DAYS[+dow] + ' ' + hour.padStart(2,'0') + ':' + min.padStart(2,'0') + ' \u6267\u884C';
        if (/^\d+$/.test(dom) && mon === '*' && dow === '*')
            return '\u6BCF\u6708 ' + dom + ' \u65E5 ' + hour.padStart(2,'0') + ':' + min.padStart(2,'0') + ' \u6267\u884C';
        if (dom === '*' && mon === '*' && dow === '*')
            return '\u6BCF\u5929 ' + hour.padStart(2,'0') + ':' + min.padStart(2,'0') + ' \u6267\u884C';
        return expr;
    },

    /* ── CronParser.toOptions(expr) → CronOptions ── */
    toOptions: function(expr) {
        var parts = (expr || '').trim().split(/\s+/);
        if (parts.length < 5) return { frequency: 'custom', expr: expr };
        var min = parts[0], hour = parts[1], dom = parts[2], mon = parts[3], dow = parts[4];

        if (min === '0' && hour === '*' && dom === '*' && mon === '*' && dow === '*')
            return { frequency: 'hourly', hour: 0, minute: 0 };
        if (/^\*\/\d+$/.test(min) && hour === '*' && dom === '*' && mon === '*' && dow === '*')
            return { frequency: 'interval', interval: parseInt(min.slice(2), 10) };
        if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && mon === '*' && /^\d$/.test(dow))
            return { frequency: 'weekly',  hour: parseInt(hour,10), minute: parseInt(min,10), weekday: parseInt(dow,10) };
        if (/^\d+$/.test(min) && /^\d+$/.test(hour) && /^\d+$/.test(dom) && mon === '*' && dow === '*')
            return { frequency: 'monthly', hour: parseInt(hour,10), minute: parseInt(min,10), monthday: parseInt(dom,10) };
        if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && mon === '*' && dow === '*')
            return { frequency: 'daily',   hour: parseInt(hour,10), minute: parseInt(min,10) };
        return { frequency: 'custom', expr: expr };
    },
});
