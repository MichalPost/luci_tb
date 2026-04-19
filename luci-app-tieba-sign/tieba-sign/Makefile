include $(TOPDIR)/rules.mk

PKG_NAME:=tieba-sign
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=tieba-sign
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/tieba-sign
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=Tieba Auto Sign-in Backend
  DEPENDS:=+node +curl +coreutils-sleep
endef

define Package/tieba-sign/description
  Backend for Baidu Tieba auto sign-in (Node.js + curl).
  UCI config, init script and rpcd interface; signing/list logic in /usr/bin/tieba-sign.
endef

define Package/tieba-sign/conffiles
/etc/config/tieba-sign
endef

define Build/Compile
endef

define Package/tieba-sign/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/tieba-sign $(1)/usr/bin/tieba-sign

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/tieba-sign $(1)/etc/config/tieba-sign

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/tieba-sign $(1)/etc/init.d/tieba-sign

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./files/usr/libexec/rpcd/tieba-sign $(1)/usr/libexec/rpcd/tieba-sign

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./files/usr/share/rpcd/acl.d/tieba-sign.json \
		$(1)/usr/share/rpcd/acl.d/tieba-sign.json
endef

$(eval $(call BuildPackage,tieba-sign))
