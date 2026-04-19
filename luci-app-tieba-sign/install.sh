#!/bin/sh
# 贴吧签到插件安装脚本
# 用法：把整个 luci-app-tieba-sign 目录传到路由器任意位置，然后运行此脚本
# 示例：sh /tmp/luci-app-tieba-sign/install.sh
#
# 目标环境：ImmortalWrt / OpenWrt 24.10、LuCI openwrt-24.10 分支、Node.js 18+（推荐 20 LTS）。
# Node：官方 feeds 的 node 可能较旧；若需固定 Node 20，可加入 nxhack 的 openwrt-node-packages
#       仓库对应 openwrt-24.10 分支后再 opkg install node（参见该仓库 README）。
# 硬件：Node 二进制需硬浮点（FPU）；无 FPU 的老 mips 等 SoC 通常无法运行。
# 网络：扫码登录等 HTTPS 请求建议安装 ca-bundle；保持系统时间同步（NTP）。

set -e

# 自我修复：去除 Windows 换行符（如果有）
sed -i 's/\r//' "$0" 2>/dev/null || true

# 脚本所在目录（即 luci-app-tieba-sign/）
BASE="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$BASE/tieba-sign/files"
FRONTEND="$BASE/luci-app-tieba-sign/files"

echo "========================================"
echo "  贴吧签到插件 安装程序"
echo "  源目录: $BASE"
echo "========================================"

# ── 检查依赖 ──────────────────────────────────
echo ""
echo "[1/5] 检查运行时依赖..."
MISSING=""
for pkg in curl node; do
    if ! command -v "$pkg" >/dev/null 2>&1; then
        MISSING="$MISSING $pkg"
    fi
done
if [ -n "$MISSING" ]; then
    echo "  安装缺失依赖:$MISSING"
    opkg update 2>/dev/null || true
    opkg install $MISSING || echo "  ⚠ 部分依赖安装失败，请手动安装"
else
    echo "  依赖已满足 ✓"
fi

# 检查 node 版本 >= 18（需要内置 fetch / AbortSignal.timeout；推荐 v20 LTS）
NODE_VER="$(node -e 'process.stdout.write(process.version)' 2>/dev/null || echo 'v0')"
NODE_MAJOR="$(printf '%s' "$NODE_VER" | sed 's/v\([0-9]*\).*/\1/')"
if [ "$NODE_MAJOR" -lt 18 ] 2>/dev/null; then
    echo "  ⚠ Node.js 版本 $NODE_VER 过低，需要 >= v18（推荐 v20）"
    echo "  请先升级 Node：opkg update && opkg install node"
    echo "  ImmortalWrt 24.10 可配合 https://github.com/nxhack/openwrt-node-packages 的 openwrt-24.10 分支"
    exit 1
else
    echo "  Node.js $NODE_VER ✓"
fi

# ── 创建目录 ──────────────────────────────────
echo ""
echo "[2/5] 创建目录..."
mkdir -p /usr/bin
mkdir -p /usr/libexec/rpcd
mkdir -p /etc/init.d
mkdir -p /usr/share/rpcd/acl.d
mkdir -p /usr/share/luci/menu.d
mkdir -p /www/luci-static/resources/view/tieba-sign
mkdir -p /etc/tieba-sign
mkdir -p /tmp/tieba-sign
echo "  目录创建完成 ✓"

# ── 安装后端文件 ──────────────────────────────
echo ""
echo "[3/5] 安装后端文件..."

cp "$BACKEND/usr/bin/tieba-sign"              /usr/bin/tieba-sign
cp "$BACKEND/usr/libexec/rpcd/tieba-sign"     /usr/libexec/rpcd/tieba-sign
cp "$BACKEND/etc/init.d/tieba-sign"           /etc/init.d/tieba-sign
cp "$BACKEND/usr/share/rpcd/acl.d/tieba-sign.json" /usr/share/rpcd/acl.d/tieba-sign.json

# 去除 Windows 换行符
sed -i 's/\r//' /usr/bin/tieba-sign
sed -i 's/\r//' /usr/libexec/rpcd/tieba-sign
sed -i 's/\r//' /etc/init.d/tieba-sign

chmod +x /usr/bin/tieba-sign
chmod +x /usr/libexec/rpcd/tieba-sign
chmod +x /etc/init.d/tieba-sign

echo "  后端文件安装完成 ✓"

# ── 安装前端文件 ──────────────────────────────
echo ""
echo "[4/5] 安装前端文件..."

VIEW_SRC="$FRONTEND/htdocs/luci-static/resources/view/tieba-sign"
VIEW_DST="/www/luci-static/resources/view/tieba-sign"

if [ ! -d "$VIEW_SRC" ]; then
    echo "  找不到前端源目录: $VIEW_SRC"
    exit 1
fi

cp "$FRONTEND/usr/share/luci/menu.d/luci-app-tieba-sign.json" \
   /usr/share/luci/menu.d/luci-app-tieba-sign.json
cp "$FRONTEND/usr/share/rpcd/acl.d/luci-app-tieba-sign.json" \
   /usr/share/rpcd/acl.d/luci-app-tieba-sign.json

for jsfile in main.js main-ui.js main-stats.js main-actions.js main-monitor.js forums.js css.js rpc.js forums-panel.js qr-log.js; do
    if [ -f "$VIEW_SRC/$jsfile" ]; then
        cp "$VIEW_SRC/$jsfile" "$VIEW_DST/$jsfile"
        echo "  安装 $jsfile ✓"
    else
        echo "  跳过 $jsfile（不存在）"
    fi
done

echo "  前端文件安装完成 ✓"

# ── 安装默认配置（不覆盖已有配置）──────────────
if [ ! -f /etc/config/tieba-sign ]; then
    cp "$BACKEND/etc/config/tieba-sign" /etc/config/tieba-sign
    echo "  默认配置已写入 /etc/config/tieba-sign ✓"
else
    echo "  已有配置文件，跳过覆盖 ✓"
fi

# ── 启动服务 ──────────────────────────────────
echo ""
echo "[5/5] 启动服务..."

/etc/init.d/tieba-sign enable
/etc/init.d/tieba-sign start
/etc/init.d/rpcd restart

# 清除 LuCI 缓存
rm -rf /tmp/luci-*

echo "  服务启动完成 ✓"

# ── 验证 ──────────────────────────────────────
echo ""
echo "========================================"
echo "  安装完成！"
echo ""
echo "  验证："
node /usr/bin/tieba-sign status && echo "  tieba-sign 运行正常 ✓" || echo "  ⚠ 请检查配置"
echo ""
echo "  访问路由器管理页面："
echo "  服务 → 贴吧签到"
echo "========================================"
