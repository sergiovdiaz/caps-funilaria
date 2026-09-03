Set WshShell = CreateObject("WScript.Shell")
' Obtém o diretório do próprio VBS
Set fso = CreateObject("Scripting.FileSystemObject")
folderPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Caminho do BAT
batPath = Chr(34) & folderPath & "\run_border_frontend.bat" & Chr(34)

' Executa o BAT sem mostrar terminal
WshShell.Run batPath, 0, False
