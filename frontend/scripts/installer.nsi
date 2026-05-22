; Growth OS Windows Installer
; 使用 NSIS (Nullsoft Scriptable Install System) 编译
; 下载: https://nsis.sourceforge.io/Download

Unicode true
RequestExecutionLevel admin

!define PRODUCT_NAME "Growth OS"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "Growth OS Team"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "GrowthOS-Setup-${PRODUCT_VERSION}.exe"
InstallDir "$PROGRAMFILES64\${PRODUCT_NAME}"
InstallDirRegKey HKLM "Software\${PRODUCT_NAME}" ""

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "GrowthOS-win32-x64\*.*"

  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\GrowthOS.exe"
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\GrowthOS.exe"

  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayVersion" "${PRODUCT_VERSION}"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\${PRODUCT_NAME}"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
SectionEnd
