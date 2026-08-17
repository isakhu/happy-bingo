!include LogicLib.nsh

Var HB_INSTALL_PASSWORD

Function .onGUIInit
  StrCpy $HB_INSTALL_PASSWORD ""
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  nsDialogs::CreateControl EDIT ${__NSD_Text} ${__NSD_Text_Style} 0u 0u 100% 13u ""
  Pop $1
  ${NSD_SetText} $1 ""
  nsDialogs::CreateControl LABEL ${__NSD_Text} 0 0u 15u 100% 12u "Installer password:"
  Pop $2
  nsDialogs::Show
FunctionEnd

Function .onNextPage
  ${If} $mui.next == ${MUI_PAGE_WELCOME}
    Abort
  ${EndIf}
FunctionEnd
