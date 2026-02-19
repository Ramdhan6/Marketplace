param(
  [int]$Port = 8080,
  [string]$Root = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

function Get-ContentType([string]$path) {
  switch -Regex ($path.ToLowerInvariant()) {
    "\.html$" { "text/html; charset=utf-8"; break }
    "\.css$"  { "text/css; charset=utf-8"; break }
    "\.js$"   { "text/javascript; charset=utf-8"; break }
    "\.json$" { "application/json; charset=utf-8"; break }
    "\.png$"  { "image/png"; break }
    "\.jpg$"  { "image/jpeg"; break }
    "\.jpeg$" { "image/jpeg"; break }
    "\.svg$"  { "image/svg+xml; charset=utf-8"; break }
    "\.ico$"  { "image/x-icon"; break }
    "\.woff$" { "font/woff"; break }
    "\.woff2$" { "font/woff2"; break }
    default   { "application/octet-stream"; break }
  }
}

function Send-Text($res, [int]$status, [string]$text, [string]$contentType="text/plain; charset=utf-8") {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
  $res.StatusCode = $status
  $res.ContentType = $contentType
  $res.ContentLength64 = $bytes.Length
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
  $res.OutputStream.Close()
}

function Safe-Combine([string]$root, [string]$relative) {
  $rootFull = (Resolve-Path $root).Path
  $candidate = Join-Path $rootFull $relative
  $candidateFull = [System.IO.Path]::GetFullPath($candidate)
  if (-not $candidateFull.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Invalid path traversal."
  }
  return $candidateFull
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

Write-Host "Serving '$Root' at $prefix"
Write-Host "Press Ctrl+C to stop."

$listener.Start()
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    try {
      $path = $req.Url.AbsolutePath
      if ([string]::IsNullOrWhiteSpace($path) -or $path -eq "/") {
        $path = "/index.html"
      }

      $relative = $path.TrimStart("/") -replace "/", "\"
      $filePath = Safe-Combine $Root $relative

      if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        Send-Text $res 404 "404 Not Found`n$path"
        continue
      }

      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $res.StatusCode = 200
      $res.ContentType = Get-ContentType $filePath
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      $res.OutputStream.Close()
    } catch {
      Send-Text $res 500 ("500 Server Error`n" + $_.Exception.Message)
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}

