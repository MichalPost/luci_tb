include $(TOPDIR)/rules.mk

PKG_NAME:=system-manager-backend
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=system-manager
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/system-manager-backend
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=System Manager Backend
  DEPENDS:=+node
endef

define Package/system-manager-backend/description
  Backend for LuCI System Manager (Node.js rpcd scripts).
  Provides file management, USB storage, package management and cron job management via rpcd.
endef

define Build/Compile
endef

define Package/system-manager-backend/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_DATA) ./files/usr/libexec/rpcd/sm-common.js \
		$(1)/usr/libexec/rpcd/sm-common.js
	$(INSTALL_BIN) ./files/usr/libexec/rpcd/sm-files \
		$(1)/usr/libexec/rpcd/sm-files
	$(INSTALL_BIN) ./files/usr/libexec/rpcd/sm-usb \
		$(1)/usr/libexec/rpcd/sm-usb
	$(INSTALL_BIN) ./files/usr/libexec/rpcd/sm-packages \
		$(1)/usr/libexec/rpcd/sm-packages
	$(INSTALL_BIN) ./files/usr/libexec/rpcd/sm-cron \
		$(1)/usr/libexec/rpcd/sm-cron
endef

$(eval $(call BuildPackage,system-manager-backend))
