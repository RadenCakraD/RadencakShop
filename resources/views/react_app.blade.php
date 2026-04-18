<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $seo['title'] ?? 'Radencak Shop' }}</title>
    
    <!-- OpenGraph / SEO Meta Tags -->
    <meta property="og:title" content="{{ $seo['title'] ?? 'Radencak Shop' }}" />
    <meta property="og:description" content="{{ $seo['description'] ?? 'Toko Premium Radencak' }}" />
    <meta property="og:image" content="{{ $seo['image'] ?? asset('/favicon.ico') }}" />
    <meta name="description" content="{{ $seo['description'] ?? 'Toko Premium Radencak' }}" />
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Vite React & Tailwind Hooks -->
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    
</head>
<body class="bg-gray-100">
    <!-- GLOBAL ERROR CATCHER -->
    <div id="global-error-catcher" style="display:none; position:fixed; top:0; left:0; width:100%; z-index:999999; background:red; color:white; padding:20px; font-family:monospace; white-space:pre-wrap;"></div>
    <script>
        window.addEventListener('error', function(e) {
            var el = document.getElementById('global-error-catcher');
            el.style.display = 'block';
            el.innerHTML += "Error: " + e.message + "\nLocation: " + e.filename + ":" + e.lineno + "\n\n";
        });
        window.addEventListener('unhandledrejection', function(e) {
            var el = document.getElementById('global-error-catcher');
            el.style.display = 'block';
            el.innerHTML += "Promise Rejection: " + (e.reason && e.reason.stack ? e.reason.stack : e.reason) + "\n\n";
        });
    </script>
    <!-- Di sinilah seluruh komponen React.js akan dirender -->
    <div id="root"></div>
</body>
</html>
