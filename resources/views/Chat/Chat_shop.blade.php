<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Raden Chat</title>
    <!-- FontAwesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- SF Pro Display Font -->
    <link href="https://fonts.cdnfonts.com/css/sf-pro-display" rel="stylesheet">
    
    <!-- Reuse Dashboard styling for colors & globals -->
    <link rel="stylesheet" href="{{ asset('css/Dashboard_Shop.css') }}">
    <!-- Specific Chat styling -->
    <link rel="stylesheet" href="{{ asset('css/Chat/Chat_shop.css') }}">
</head>
<body class="chat-page-body">

    <!-- Global Header just for back button and Page Title -->
    <header class="shop-header chat-top-header">
        <div class="header-container" style="justify-content: flex-start; gap: 20px;">
            <a href="{{ route('dashboard') }}" class="back-arrow"><i class="fa-solid fa-arrow-left"></i></a>
            <h2 class="chat-title-brand">Raden <strong>Chat</strong></h2>
        </div>
    </header>

    <!-- Main Chat App Layout -->
    <main class="chat-app-container">
        
        <!-- Left: List of Chats -->
        <div class="chat-list-panel" id="chatListPanel">
            <div class="chat-list-header">
                <h3>Pesan</h3>
            </div>
            <div class="chat-items-container" id="chat-list-dynamic">
                <!-- Chat items dipopulasi oleh JS -->
            </div>
        </div>

        <!-- Right: Active Chat Area -->
        <div class="chat-room-panel" id="chatRoomPanel">
            <!-- Mobile Only Back Button to List -->
            <div class="mobile-back-to-list" onclick="backToList()">
                <i class="fa-solid fa-chevron-left"></i> Kembali ke Daftar
            </div>
            
            <!-- Room Header: Shop Name -->
            <div class="room-header">
                <div class="room-header-left">
                    <img src="" alt="Shop Logo" class="room-shop-logo" id="activeShopLogo" style="display:none;">
                    <div class="room-shop-info">
                        <h3 id="activeShopName">Pilih Obrolan</h3>
                        <span class="shop-status" id="activeShopStatus">Mari terhubung!</span>
                    </div>
                </div>
                <div class="room-header-right">
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                </div>
            </div>

            <!-- Messages Stream -->
            <div class="messages-container" id="messagesContainer">
                <div class="chat-date-divider" style="display:none;"><span id="chat-day-label">Mulai Obrolan Baru</span></div>
            </div>

            <!-- Quick Replies -->
            <div class="quick-replies-wrapper">
                <button class="quick-reply-btn" onclick="sendQuickReply(this)">Masih ada kak produknya?</button>
                <button class="quick-reply-btn" onclick="sendQuickReply(this)">Bisa dikirim hari ini?</button>
                <button class="quick-reply-btn" onclick="sendQuickReply(this)">Gimana detail produknya?</button>
                <button class="quick-reply-btn" onclick="sendQuickReply(this)">Ada garansi resmi?</button>
            </div>

            <!-- Input Form -->
            <div class="chat-input-section">
                <button class="chat-attach-btn"><i class="fa-solid fa-paperclip"></i></button>
                <div class="input-wrapper">
                    <input type="text" id="chatInput" placeholder="Tulis pesan..." autocomplete="off">
                    <button class="chat-emoji-btn"><i class="fa-regular fa-face-smile"></i></button>
                </div>
                <button class="chat-send-btn" id="btnSend"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>

    </main>

    <script src="{{ asset('js/Chat/Chat_shop.js') }}"></script>
</body>
</html>
