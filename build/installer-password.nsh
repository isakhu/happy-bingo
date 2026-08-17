!include LogicLib.nsh

Var HBPasswordCtl
Var HBPassword

Page custom HBPasswordPage HBPasswordLeave

Function HBPasswordPage
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  ${NSD_CreateLabel} 0 0 100% 13u "Happy Bingo installer password:"
  Pop $1
  ${NSD_CreateText} 0 18u 100% 13u ""
  Pop $HBPasswordCtl
  ${NSD_AddStyle} $HBPasswordCtl ${ES_PASSWORD}
  ${NSD_CreateLabel} 0 38u 100% 28u "Enter the password supplied by the seller to install Happy Bingo."
  Pop $2
  nsDialogs::Show
FunctionEnd

Function HBPasswordLeave
  ${NSD_GetText} $HBPasswordCtl $HBPassword
  ${If} $HBPassword != "0987654321"
    MessageBox MB_ICONSTOP "Incorrect installer password. Installation cannot continue."
    Abort
  ${EndIf}
FunctionEnd
