
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("C:\Users\adamw\.gemini\antigravity-ide\brain\a24881d4-e976-4998-b19d-e348387dcf58\adpro_icon_1783945868641.png")
$stream = New-Object System.IO.FileStream("C:\antigarvity Projects\Adpro mes\adpro_icon.ico", [System.IO.FileMode]::Create)
$bmp = New-Object System.Drawing.Bitmap($img, 256, 256)
$iconHandle = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$icon.Save($stream)
$stream.Close()
$bmp.Dispose()
$img.Dispose()

$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("C:\Users\adamw\Desktop\ADPRO MES.lnk")
$Shortcut.TargetPath = "C:\antigarvity Projects\Adpro mes\ADPRO MES.bat"
$Shortcut.WorkingDirectory = "C:\antigarvity Projects\Adpro mes"
$Shortcut.IconLocation = "C:\antigarvity Projects\Adpro mes\adpro_icon.ico"
$Shortcut.Save()
