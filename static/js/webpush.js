'use strict';

const applicationServerPublicKey = '<public key>';

let isSubscribed = false;
let swRegistration = null;
const activeButton = document.querySelector('#active-push');
const pushButton = document.querySelector('#send-push');
const norticePushArea = document.querySelector('.nortice-push-area');
const status = document.querySelector('#webpush-status');
const webpushKey = document.querySelector('#webpush-key');

// service worker / push managerが使えるかどうか
if ('serviceWorker' in navigator && 'PushManager' in window) {
    console.log('Service Worker and Push is supported');

    // service workerを登録
    navigator.serviceWorker.register('js/webpush-sw.js').then(function(swReg) {
        console.log('Service Worker is registered', swReg);

        status.textContent = 'Push messaging is support';
        status.style.color = '#4169e1';

        swRegistration = swReg;

        // 通知許可のダイアログの初期化
        initialiseUI();
    }).catch(function(error) {
        // service workerの登録ができなかった場合
        console.error('Service Worker Error', error);
    });
} else {
    status.textContent = 'Push messaging is not supported';
    status.style.color = '#d7003a';
}

// 通知許可UIの表示/非表示
function initialiseUI() {

    pushButton.addEventListener('click', function() {
        //console.log('ok');
        sendPush();
    });

    activeButton.addEventListener('click', function() {
        if (isSubscribed) {
            unsubscribeUser();
        } else {
            subscribeUser();
        }
    });

    // Set the initial subscription value
    swRegistration.pushManager.getSubscription().then(function(subscription) {

        isSubscribed = !(subscription === null);

        updateSubscriptionOnServer(subscription);

        if (isSubscribed) {
            console.log('User IS subscribed.');
        } else {
            console.log('User is NOT subscribed.');
        }

        updateBtn();
    });
}

// 購読
function subscribeUser() {
    const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
    swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    }).then(function(subscription) {
        console.log('User is subscribed:', subscription);

        updateSubscriptionOnServer(subscription);

        isSubscribed = true;

        updateBtn();
    }).catch(function(err) {
        console.log('Failed to subscribe the user: ', err);
        updateBtn();
    });
}

// 購読の解除
function unsubscribeUser() {
    swRegistration.pushManager.getSubscription().then(function(subscription) {
        if (subscription) {
            return subscription.unsubscribe();
        }
    }).catch(function(error) {
        console.log('Error unsubscribing', error);
    }).then(function() {
        updateSubscriptionOnServer(null);

        console.log('User is unsubscribed.');
        isSubscribed = false;

        updateBtn();
    });
}


// 購読キーの保存と削除
function updateSubscriptionOnServer(subscription) {
    console.log(subscription);
    webpushKey.textContent = subscription ? JSON.stringify(subscription) : '未登録';
    subscription = !subscription ? {} : subscription;

    saveSubscriptionState(JSON.stringify(subscription));
}

// 購読情報の更新（保存）
function sendPush() {
    const objData = {
        title: 'Push nortification',
        text: 'Web push sample',
        url: 'http://localhost:3000/static/success.html'
    };
    const q = new Promise(function(resolve, reject) {
        $.ajax({
            url: 'http://localhost:3000/api/subscription/push',
            method: 'POST',
            cache: false,
            data: JSON.stringify(objData),
            contentType: 'application/json;charset=UTF-8'
        }).done(function(msg) {
            console.log(msg);
            return resolve(msg);
        }).fail(function(xhr, status, err) {
            console.error(err);
            return reject(err);
        });
    });
    return q;
}

// 購読情報の更新（保存）
function saveSubscriptionState(objUserSubscription) {
    const q = new Promise(function(resolve, reject) {
        $.ajax({
            url: 'http://localhost:3000/api/subscription/upsert',
            method: 'POST',
            cache: false,
            data: objUserSubscription,
            contentType: 'application/json;charset=UTF-8'
        }).done(function(msg) {
            console.log(msg);
            return resolve(msg);
        }).fail(function(xhr, status, err) {
            console.error(err);
            return reject(err);
        });
    });
    return q;
}

// 表示領域の更新
function updateBtn() {
    // 通知拒否の場合は、エリアを非表示
    if (Notification.permission === 'denied') {
        activeButton.textContent = 'プッシュ通知を有効';
        updateSubscriptionOnServer(null);
        return;
    }
    // 購読していない場合は、エリアを表示
    if (!isSubscribed) {
        activeButton.textContent = 'プッシュ通知を有効';
    } else {
        activeButton.textContent = 'プッシュ通知を無効';
    }
}

// encode
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}