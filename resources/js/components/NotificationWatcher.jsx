import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function NotificationWatcher() {
    const [lastCount, setLastCount] = useState(0);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const checkNotifications = async () => {
        try {
            const res = await axios.get('/api/notifications/unread-count');
            const newCount = res.data.count;

            if (!isFirstLoad && newCount > lastCount) {
                // Get latest notification
                const notifRes = await axios.get('/api/notifications');
                const latest = notifRes.data[0];
                if (latest) {
                    toast.success(latest.title + ': ' + latest.message, {
                        duration: 5000,
                        icon: '🔔',
                    });
                }
            }
            setLastCount(newCount);
            setIsFirstLoad(false);
        } catch (e) {
            // Silently fail if not logged in
        }
    };

    useEffect(() => {
        checkNotifications();
        const interval = setInterval(checkNotifications, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, [lastCount, isFirstLoad]);

    return null;
}
