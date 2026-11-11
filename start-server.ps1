$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "Servidor LudoSport activo en http://localhost:$port"
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq "/" -or $path -eq "") { $path = "/index.html" }

        # Mock /api/config localmente simulando la función serverless de Vercel
        if ($path -eq "/api/config") {
            $url = $env:SUPABASE_URL
            $key = $env:SUPABASE_ANON_KEY
            $envFile = Join-Path $PSScriptRoot ".env"
            if (Test-Path $envFile) {
                Get-Content $envFile | ForEach-Object {
                    if ($_ -match "^\s*SUPABASE_URL\s*=\s*(.*)$") { $url = $matches[1].Trim() }
                    if ($_ -match "^\s*SUPABASE_ANON_KEY\s*=\s*(.*)$") { $key = $matches[1].Trim() }
                }
            }
            $configured = [bool]($url -and $key)
            $json = "{`"url`":`"$url`",`"key`":`"$key`",`"configured`":$($configured.ToString().ToLower())}"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json; charset=utf-8"
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        $filePath = Join-Path $PSScriptRoot $path.TrimStart('/')

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            if ($ext -eq ".html") { $response.ContentType = "text/html; charset=utf-8" }
            elseif ($ext -eq ".js") { $response.ContentType = "application/javascript; charset=utf-8" }
            elseif ($ext -eq ".css") { $response.ContentType = "text/css; charset=utf-8" }
            elseif ($ext -eq ".json") { $response.ContentType = "application/json; charset=utf-8" }
            else { $response.ContentType = "text/plain" }
            
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $err = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($err, 0, $err.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
