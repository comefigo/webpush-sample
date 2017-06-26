'use strict';

// pushされた時のイベント
self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

    const pushData = JSON.parse(event.data.text());
    event.waitUntil(self.registration.showNotification(pushData.title, pushData));
});

// 通知をクリックした際のイベント
self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click Received.');
    // 送信されたデータはevent.notificationに格納される
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});