include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-tieba-sign
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=tieba-sign
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI support for Tieba Sign-in
LUCI_DEPENDS:=+tieba-sign

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-tieba-sign
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=$(LUCI_TITLE)
  DEPENDS:=$(LUCI_DEPENDS)
endef

define Package/luci-app-tieba-sign/description
  LuCI web interface for Baidu Tieba auto sign-in.
  Provides configuration, manual trigger, status view and log viewer.
endef

define Package/luci-app-tieba-sign/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./files/usr/share/luci/menu.d/luci-app-tieba-sign.json \
		$(1)/usr/share/luci/menu.d/luci-app-tieba-sign.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./files/usr/share/rpcd/acl.d/luci-app-tieba-sign.json \
		$(1)/usr/share/rpcd/acl.d/luci-app-tieba-sign.json

	$(INSTALL_DIR) $(1)/htdocs/luci-static/resources/view/tieba-sign
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/tieba-sign/main.js \
		$(1)/htdocs/luci-static/resources/view/tieba-sign/main.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/tieba-sign/about.js \
		$(1)/htdocs/luci-static/resources/view/tieba-sign/about.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/tieba-sign/main-ui.js \
		$(1)/htdocs/luci-static/resources/view/tieba-sign/main-ui.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/tieba-sign/main-stats.js \
		$(1)/htdocs/luci-static/resources/view/tieba-sign/main-stats.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/tieba-sign/main-actions.js \
		$(1)/htdocs/luci-static/resources/view/tieba-sign/main-actions.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/tieba-sign/main-monitor.js \
		$(1)/htdocs/luci-static/resources/view/tieba-sign/main-monitor.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/tieba-sign/css.js \
		$(1)/htdocs/luci-static/resources/view/tieba-sign/css.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/tieba-sign/rpc.js \
		$(1)/htdocs/luci-static/resources/view/tieba-sign/rpc.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/tieba-sign/forums-panel.js \
		$(1)/htdocs/luci-static/resources/view/tieba-sign/forums-panel.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/tieba-sign/qr-log.js \
		$(1)/htdocs/luci-static/resources/view/tieba-sign/qr-log.js
	$(INSTALL_DATA) ./files/htdocs/luci-static/resources/view/tieba-sign/forums.js \
		$(1)/htdocs/luci-static/resources/view/tieba-sign/forums.js
endef

$(eval $(call BuildPackage,luci-app-tieba-sign))
