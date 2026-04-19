# Top-level convenience Makefile
# Usage (from OpenWrt buildroot):
#   make package/luci-app-system-manager/compile
#   make package/system-manager-backend/compile

.PHONY: all clean

all:
	@echo "Add this directory to your OpenWrt feeds.conf, then:"
	@echo "  ./scripts/feeds update system-manager"
	@echo "  ./scripts/feeds install luci-app-system-manager system-manager-backend"
	@echo "  make menuconfig  # select under LuCI -> Applications"
	@echo "  make package/system-manager-backend/compile"
	@echo "  make package/luci-app-system-manager/compile"
