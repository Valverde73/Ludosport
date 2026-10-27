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
