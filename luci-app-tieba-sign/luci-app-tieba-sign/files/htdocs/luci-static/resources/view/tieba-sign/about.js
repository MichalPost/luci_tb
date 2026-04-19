'use strict';
'require view';
'require view.tieba-sign.css as tsCss';

return view.extend({
    load() {
        return Promise.resolve();
    },

    render() {
        const wrap = document.createElement('div');
        wrap.id = 'ts-about';
        wrap.style.cssText = 'max-width:720px;padding:20px 24px;line-height:1.6;color:#334155;';
        const s = document.createElement('style');
        s.textContent = tsCss.css + `
#ts-about h2 { font-size:1.25rem; margin:0 0 12px; color:#0f172a; }
#ts-about h3 { font-size:1rem; margin:20px 0 8px; color:#1e293b; }
#ts-about p, #ts-about li { font-size:13px; margin:6px 0; }
#ts-about ul { padding-left:1.2em; margin:8px 0; }
#ts-about code { background:#f1f5f9; padding:1px 6px; border-radius:4px; font-size:12px; }
`;
        wrap.appendChild(s);
        const body = document.createElement('div');
        body.innerHTML = `
<h2>贴吧签到 · 说明</h2>
<p>本页为只读说明；账号、定时与网络相关选项请在侧栏进入 <strong>贴吧签到</strong> 主界面配置。</p>
<h3>LuCI 扩展项</h3>
<ul>
  <li>菜单 <code>服务 → 贴吧签到</code>：主配置与运行控制。</li>
  <li>菜单 <code>服务 → 贴吧签到 · 说明</code>：当前页面（独立视图 <code>tieba-sign/about</code>）。</li>
</ul>
<h3>签到间隔（UCI）</h3>
<p><code>sign_delay_min</code> / <code>sign_delay_max</code>（秒）控制每次<strong>成功签到后</strong>的随机等待区间，以及在<strong>并发为 1</strong>时贴吧之间的等待；与根目录独立脚本 <code>config.json</code> 中的 <code>delay_range</code> 概念一致，由路由器端 Node 进程读取。</p>
<h3>权限</h3>
<p>访问需具备 <code>luci-app-tieba-sign</code> ACL（读 UCI / 读状态；写配置与触发签到需写权限）。</p>`;
        wrap.appendChild(body);
        return wrap;
    },
});
