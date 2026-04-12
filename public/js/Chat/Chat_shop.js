document.addEventListener('DOMContentLoaded', () => {
    
    const chatApp = document.querySelector('.chat-app-container');
    const chatListDynamic = document.getElementById('chat-list-dynamic');
    const messagesContainer = document.getElementById('messagesContainer');
    const chatInput = document.getElementById('chatInput');
    const btnSend = document.getElementById('btnSend');
    
    const activeShopName = document.getElementById('activeShopName');
    const activeShopLogo = document.getElementById('activeShopLogo');
    const activeShopStatus = document.getElementById('activeShopStatus');

    const token = localStorage.getItem('auth_token');
    
    let chatList = [];
    window.activeChatId = null;

    // Helper functions
    const scrollToBottom = () => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // Load Chats
    async function loadChats() {
        if (!token) {
            window.location.href = '/login';
            return;
        }

        try {
            const res = await fetch('/api/chat', {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (data.chats) {
                chatList = data.chats;
                
                const urlParams = new URLSearchParams(window.location.search);
                const targetShopId = urlParams.get('shop_id');
                
                if (targetShopId) {
                    await handleTargetShopChat(targetShopId);
                } else {
                    renderChatList();
                }
            }
        } catch (error) {
            console.error('Failed to load chats', error);
        }
    }

    async function handleTargetShopChat(shopId) {
        let existingChat = chatList.find(c => !c.is_seller && c.target_shop_id == shopId); 
        if (existingChat) {
            renderChatList();
            await selectChat(existingChat.id);
            window.history.replaceState({}, document.title, "/chat");
        } else {
            try {
                const formData = new FormData();
                formData.append('shop_id', shopId);
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (res.ok) {
                    window.history.replaceState({}, document.title, "/chat");
                    await loadChats(); 
                } else {
                    renderChatList();
                }
            } catch (e) {
                renderChatList();
            }
        }
    }

    function renderChatList() {
        chatListDynamic.innerHTML = '';
        if(chatList.length === 0) {
            chatListDynamic.innerHTML = '<div style="padding: 20px; color: var(--text-secondary); text-align: center;">Belum ada pesan.</div>';
            return;
        }

        chatList.forEach(chat => {
            const avatarSrc = chat.target_avatar ? chat.target_avatar : 'https://picsum.photos/seed/placeholder/150/150';
            
            const itemHTML = `
                <div class="chat-item" data-id="${chat.id}" onclick="selectChat(${chat.id})">
                    <img src="${avatarSrc}" alt="Avatar" class="chat-shop-avatar">
                    <div class="chat-item-details">
                        <div class="chat-item-top">
                            <h4>${chat.target_name}</h4>
                            <span class="chat-time">${chat.latest_time}</span>
                        </div>
                        <div class="chat-item-bottom">
                            <span class="chat-preview">${chat.latest_message}</span>
                            ${chat.unread_count > 0 ? `<span class="unread-badge">${chat.unread_count}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
            chatListDynamic.insertAdjacentHTML('beforeend', itemHTML);
        });
    }

    // Select Chat function
    window.selectChat = async function(chatId) {
        window.activeChatId = chatId;
        
        // Update UI Active State
        document.querySelectorAll('.chat-item').forEach(item => {
            if(parseInt(item.dataset.id) === chatId) item.classList.add('active');
            else item.classList.remove('active');
        });
        
        const chatData = chatList.find(c => c.id === chatId);
        if (!chatData) return;

        // Set Header
        activeShopName.innerHTML = `${chatData.target_name} <span class="badge-raden-small"><i class="fa-solid fa-check-circle"></i> Raden</span>`;
        activeShopLogo.src = chatData.target_avatar ? chatData.target_avatar : 'https://picsum.photos/seed/placeholder/150/150';
        activeShopLogo.style.display = 'block';
        activeShopStatus.innerText = chatData.is_seller ? 'Pembeli' : 'Penjual';

        // Show chat room on mobile
        chatApp.classList.add('show-room');
        
        // Load messages
        await loadMessages(chatId, chatData.is_seller);
    };

    async function loadMessages(chatId, isSeller) {
        messagesContainer.innerHTML = '<div style="text-align:center; padding: 20px;">Memuat pesan...</div>';
        try {
            const res = await fetch(`/api/chat/${chatId}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const data = await res.json();
            
            messagesContainer.innerHTML = ''; // clear loading
            
            if (data.messages && data.messages.length > 0) {
                messagesContainer.innerHTML = `<div class="chat-date-divider"><span>Awal Obrolan</span></div>`;
                data.messages.forEach(msg => {
                    renderBubble(msg, isSeller);
                });
            } else {
                messagesContainer.innerHTML = `<div class="chat-date-divider"><span id="chat-day-label">Mulai Obrolan Baru</span></div>`;
            }
            scrollToBottom();
            
        } catch (error) {
            console.error('Failed to load messages', error);
            messagesContainer.innerHTML = '<div style="text-align:center; padding: 20px; color:red;">Gagal memuat pesan.</div>';
        }
    }

    function renderBubble(msg, isSeller) {
        // Logic: if we are acting as seller, our messages are sender_type == 'shop'
        // If we are acting as buyer, our messages are sender_type == 'user'
        const isOut = (isSeller && msg.sender_type === 'shop') || (!isSeller && msg.sender_type === 'user');
        const timeStr = formatDate(msg.created_at);
        
        let bubbleHTML = '';
        if (isOut) {
            bubbleHTML = `
                <div class="message-wrapper out">
                    <div class="message-bubble">
                        <div class="message-text">${msg.message}</div>
                        <div class="message-meta">
                            <span class="time">${timeStr}</span>
                            <i class="fa-solid fa-check-double read-receipt"></i>
                        </div>
                    </div>
                </div>
            `;
        } else {
            const currentChat = chatList.find(c => c.id === window.activeChatId);
            const avatarSrc = (currentChat && currentChat.target_avatar) ? currentChat.target_avatar : 'https://picsum.photos/seed/placeholder/150/150';
            bubbleHTML = `
                <div class="message-wrapper in">
                    <img src="${avatarSrc}" class="bubble-avatar" alt="Avatar">
                    <div class="message-bubble">
                        <div class="message-text">${msg.message}</div>
                        <div class="message-meta">
                            <span class="time">${timeStr}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        messagesContainer.insertAdjacentHTML('beforeend', bubbleHTML);
    }

    // Back to list on mobile
    window.backToList = function() {
        chatApp.classList.remove('show-room');
        window.activeChatId = null;
    };

    // Sending a message
    const sendMessage = async () => {
        if (!window.activeChatId) {
            alert('Pilih percakapan dulu.');
            return;
        }

        const text = chatInput.value.trim();
        if (text === '') return;

        const currentChat = chatList.find(c => c.id === window.activeChatId);
        const isSellerParams = currentChat ? currentChat.is_seller : false;

        // Create temporary bubble Out
        const now = new Date();
        const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const tempBubbleHTML = `
            <div class="message-wrapper out temp-msg" style="opacity: 0.5;">
                <div class="message-bubble">
                    <div class="message-text">${text}</div>
                    <div class="message-meta">
                        <span class="time">${timeString}</span>
                        <i class="fa-solid fa-clock"></i>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', tempBubbleHTML);
        const tempBubble = messagesContainer.lastElementChild;
        scrollToBottom();
        
        chatInput.value = '';

        try {
            const formData = new FormData();
            formData.append('message', text);
            formData.append('as_shop', isSellerParams ? 1 : 0);

            const res = await fetch(`/api/chat/${window.activeChatId}/message`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                // Remove temp bubble and render proper one
                tempBubble.remove();
                renderBubble(data.data, isSellerParams);
                scrollToBottom();
                
                // Update side list preview
                currentChat.latest_message = text;
                currentChat.latest_time = timeString;
                renderChatList();
            } else {
                alert('Gagal mengirim pesan');
                tempBubble.style.color = 'red';
            }
        } catch (e) {
            console.error(e);
            alert('Koneksi terputus');
            tempBubble.style.color = 'red';
        }
    };

    // Quick Reply Function
    window.sendQuickReply = function(btnElement) {
        if (chatInput) {
            chatInput.value = btnElement.innerText;
            sendMessage();
        }
    };

    // Events for sending message
    if (btnSend) {
        btnSend.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Call load chats on startup
    loadChats();
});
