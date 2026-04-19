include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-system-manager
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=system-manager
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI support for System Manager
LUCI_DEPENDS:=+luci-base +system-manager-backend

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-system-manager
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=$(LUCI_TITLE)
  DEPENDS:=$(LUCI_DEPENDS)
endef

define Package/luci-app-system-manager/description
  LuCI web interface for system management.
  Provides file management, USB storage, package management and cron job management.
endef

define Package/luci-app-system-manager/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./files/usr/share/luci/menu.d/luci-app-system-manager.json \
		$(1)/usr/share/luci/menu.d/luci-app-system-manager.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./files/usr/share/rpcd/acl.d/luci-app-system-manager.json \
		$(1)/usr/share/rpcd/acl.d/luci-app-system-manager.json

	$(INSTALL_DIR) $(1)/htdocs/luci-static/resources/view/system-manager
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/system-manager/main.js \
		$(1)/htdocs/luci-static/resources/view/system-manager/main.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/system-manager/rpc.js \
		$(1)/htdocs/luci-static/resources/view/system-manager/rpc.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/system-manager/tab-files.js \
		$(1)/htdocs/luci-static/resources/view/system-manager/tab-files.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/system-manager/tab-usb.js \
		$(1)/htdocs/luci-static/resources/view/system-manager/tab-usb.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/system-manager/tab-packages.js \
		$(1)/htdocs/luci-static/resources/view/system-manager/tab-packages.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/system-manager/tab-cron.js \
		$(1)/htdocs/luci-static/resources/view/system-manager/tab-cron.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/system-manager/cron-builder.js \
		$(1)/htdocs/luci-static/resources/view/system-manager/cron-builder.js
endef

$(eval $(call BuildPackage,luci-app-system-manager))
