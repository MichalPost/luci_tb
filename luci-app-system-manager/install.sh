#!/bin/sh
# 系统管理器插件安装脚本
# 用法：将整个 luci-app-system-manager 目录传到路由器任意位置，然后运行此脚本
# 示例：sh /tmp/luci-app-system-manager/install.sh
#
# 目标环境：ImmortalWrt / OpenWrt 24.10，LuCI openwrt-24.10 分支，Node.js 20 LTS。
# 硬件要求：Node.js 二进制需要硬浮点（FPU），无 FPU 的老 MIPS SoC 通常无法运行。

set -e

# 自我修复：去除 Windows 换行符
sed -i 's/\r//' "$0" 2>/dev/null || true

BASE="$(cd "$(dirname "$0")" && pwd)"
BACKEND_FILES="$BASE/system-manager-backend/files"
FRONTEND_FILES="$BASE/luci-app-system-manager/files"

VIEW_SRC="$FRONTEND_FILES/htdocs/luci-static/resources/view/system-manager"
VIEW_DST="/www/luci-static/resources/view/system-manager"

RPCD_SRC="$BACKEND_FILES/usr/libexec/rpcd"
RPCD_DST="/usr/libexec/rpcd"

echo "========================================"
echo "  系统管理器插件 安装程序 v1.0.0"
echo "  源目录: $BASE"
echo "========================================"

# ── [1/5] 检查源文件完整性 ───────────────────
echo ""
echo "[1/5] 检查源文件..."

for f in \
    "$RPCD_SRC/sm-common.js" \
    "$RPCD_SRC/sm-files" \
    "$RPCD_SRC/sm-usb" \
    "$RPCD_SRC/sm-packages" \
    "$RPCD_SRC/sm-cron" \
    "$FRONTEND_FILES/usr/share/luci/menu.d/luci-app-system-manager.json" \
    "$FRONTEND_FILES/usr/share/rpcd/acl.d/luci-app-system-manager.json" \
    "$VIEW_SRC/main.js" \
    "$VIEW_SRC/rpc.js" \
    "$VIEW_SRC/tab-files.js" \
    "$VIEW_SRC/tab-usb.js" \
    "$VIEW_SRC/tab-packages.js" \
    "$VIEW_SRC/tab-cron.js" \
    "$VIEW_SRC/cron-builder.js"
do
    if [ ! -f "$f" ]; then
        echo "  ✗ 缺少文件: $f"
        echo "  请确保 luci-app-system-manager 目录完整"
        exit 1
    fi
done
echo "  源文件完整 ✓"

# ── [2/5] 检查运行时依赖 ─────────────────────
echo ""
echo "[2/5] 检查运行时依赖..."

if ! command -v node >/dev/null 2>&1; then
    echo "  未找到 Node.js，尝试安装..."
    opkg update 2>/dev/null || true
    opkg install node || {
        echo "  ✗ Node.js 安装失败，请手动执行: opkg update && opkg install node"
        exit 1
    }
fi

NODE_VER="$(node -e 'process.stdout.write(process.version)' 2>/dev/null || echo 'v0')"
NODE_MAJOR="$(printf '%s' "$NODE_VER" | sed 's/v\([0-9]*\).*/\1/')"
if [ "$NODE_MAJOR" -lt 20 ] 2>/dev/null; then
    echo "  ⚠ Node.js 版本 $NODE_VER，建议使用 v20 LTS（最低 v18）"
    if [ "$NODE_MAJOR" -lt 18 ] 2>/dev/null; then
        echo "  ✗ Node.js 版本过低（< v18），fs.statfsSync 不可用，请升级后重试"
        exit 1
    fi
else
    echo "  Node.js $NODE_VER ✓"
fi

# ── [3/5] 创建目标目录 ───────────────────────
echo ""
echo "[3/5] 创建目标目录..."

mkdir -p "$RPCD_DST"
mkdir -p "$VIEW_DST"
mkdir -p /usr/share/luci/menu.d
mkdir -p /usr/share/rpcd/acl.d

echo "  目录创建完成 ✓"

# ── [4/5] 安装后端文件 ───────────────────────
echo ""
echo "[4/5] 安装后端文件..."

# sm-common.js（库文件，不需要可执行权限）
cp "$RPCD_SRC/sm-common.js" "$RPCD_DST/sm-common.js"
sed -i 's/\r//' "$RPCD_DST/sm-common.js"
echo "  sm-common.js ✓"

# rpcd 可执行脚本
for script in sm-files sm-usb sm-packages sm-cron; do
    cp "$RPCD_SRC/$script" "$RPCD_DST/$script"
    sed -i 's/\r//' "$RPCD_DST/$script"
    chmod +x "$RPCD_DST/$script"
    echo "  $script ✓"
done

# ACL 配置
cp "$FRONTEND_FILES/usr/share/rpcd/acl.d/luci-app-system-manager.json" \
   /usr/share/rpcd/acl.d/luci-app-system-manager.json
echo "  rpcd ACL 配置 ✓"

echo "  后端安装完成 ✓"

# ── [5/5] 安装前端文件 ───────────────────────
echo ""
echo "[5/5] 安装前端文件..."

# LuCI 菜单配置
cp "$FRONTEND_FILES/usr/share/luci/menu.d/luci-app-system-manager.json" \
   /usr/share/luci/menu.d/luci-app-system-manager.json
echo "  菜单配置 ✓"

# JS 视图文件
for jsfile in main.js rpc.js tab-files.js tab-usb.js tab-packages.js tab-cron.js cron-builder.js; do
    cp "$VIEW_SRC/$jsfile" "$VIEW_DST/$jsfile"
    echo "  $jsfile ✓"
done

echo "  前端安装完成 ✓"

# ── 重启服务 ─────────────────────────────────
echo ""
echo "重启 rpcd 服务..."
/etc/init.d/rpcd restart 2>/dev/null && echo "  rpcd 重启成功 ✓" || echo "  ⚠ rpcd 重启失败，请手动执行: /etc/init.d/rpcd restart"

# 清除 LuCI 缓存
rm -rf /tmp/luci-* 2>/dev/null || true
echo "  LuCI 缓存已清除 ✓"

# ── 完成 ─────────────────────────────────────
echo ""
echo "========================================"
echo "  安装完成！"
echo ""
echo "  访问路由器管理页面："
echo "  服务 → 系统管理器"
echo ""
echo "  如页面未出现，请尝试强制刷新浏览器（Ctrl+F5）"
echo "  或重新登录 LuCI"
echo "========================================"
