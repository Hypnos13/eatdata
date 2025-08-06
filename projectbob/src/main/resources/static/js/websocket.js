// 웹소켓 연결 및 알림 처리

// 종 모양 알림 관련 DOM 요소들 (전역 변수로 선언)
let notifyContainer = null;
let notifBadge = null;
let notifList = null;

// sessionStorage 키 (사용자 ID에 따라 동적으로 생성)
let SESSION_STORAGE_KEY = 'bellNotifications'; // 초기값 설정

// 페이지 로드 시 웹소켓 연결 시도 및 DOM 요소 초기화
$(document).ready(function() {
    console.log("websocket.js: $(document).ready() 실행됨.");

    // 1. DOM 요소 초기화 (웹소켓 연결 시도보다 먼저 실행)
    notifyContainer = document.getElementById('notifyContainer');
    if (notifyContainer) {
        console.log('[BellIcon] notifyContainer found. Initializing bell icon notification setup.');
        notifBadge = document.getElementById('header-notif-badge');
        notifList = document.getElementById('header-notif-list');
        
        // 사용자 ID에 따라 sessionStorage 키 설정 및 알림 불러오기
        if (window.currentUserId) {
            SESSION_STORAGE_KEY = `bellNotifications_${window.currentUserId}`;
            loadNotificationsFromSessionStorage(); // DOM 요소 초기화 후 알림 불러오기
        } else {
            console.log('[BellIcon] User not logged in. Skipping loading notifications from sessionStorage.');
            // 비로그인 시 기존 알림 삭제 (선택 사항)
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    } else {
        console.log('[BellIcon] notifyContainer not found. Skipping bell icon notification setup.');
    }
    
    // 2. 웹소켓 연결 시도 (DOM 요소 초기화 후에 실행)
    // window.currentUserId는 main_layout.html에서 주입됨
    if (window.currentUserId) {
        console.log("[WebSocket] User logged in, attempting to connect...");
        connectWebSocket();
    } else {
        console.log("[WebSocket] User not logged in, skipping connection.");
    }
});

// 종 모양 알림 처리 함수
function handleBellIconNotification(notification) {
    console.log('[BellIcon] handleBellIconNotification called with:', notification);

    // DOM 요소가 초기화되지 않았다면 다시 시도
    if (!notifyContainer) {
        notifyContainer = document.getElementById('notifyContainer');
        if (!notifyContainer) {
            console.log('[BellIcon] notifyContainer still not found. Cannot process bell icon notification.');
            return;
        }
        notifBadge = document.getElementById('header-notif-badge');
        notifList = document.getElementById('header-notif-list');
    }

    const oNo = notification.oNo;
    const newStatus = notification.status;
    let existingItem = null;

    if (oNo) {
        existingItem = notifList.querySelector(`li[data-o-no="${oNo}"]`);
        console.log('[BellIcon] Existing item for oNo', oNo, ':', existingItem);
    }

    let listItem;
    if (existingItem) {
        listItem = existingItem;
        console.log('[BellIcon] Updating existing notification for oNo:', oNo);
        listItem.dataset.status = newStatus;
        let messageText = notification.message || '새로운 알림이 도착했습니다.';
        messageText += ` (주문번호: ${oNo})`;
        listItem.textContent = messageText;
    } else {
        const noNotifMessage = notifList.querySelector('li.text-muted');
        if (noNotifMessage) {
            console.log('[BellIcon] Removing "알림이 없습니다." message.');
            noNotifMessage.remove();
        }

        listItem = document.createElement('li');
        listItem.classList.add('dropdown-item');
        listItem.style.whiteSpace = 'normal';
        listItem.style.wordBreak = 'break-word';
        listItem.dataset.oNo = oNo; // Store order number
        listItem.dataset.status = newStatus; // Store status

        let messageText = notification.message || '새로운 알림이 도착했습니다.';
        if (oNo) {
            messageText += ` (주문번호: ${oNo})`;
        }
        listItem.textContent = messageText;
        notifList.appendChild(listItem); // Add new item
        console.log('[BellIcon] Adding new notification for oNo:', oNo);
        updateBellIconNotificationCount(1); // Increment count for new item
    }

    listItem.onclick = function() { // Use onclick to easily overwrite previous handler
        console.log('[BellIcon] Notification clicked for oNo:', listItem.dataset.oNo, 'status:', listItem.dataset.status);
        window.location.href = '/end?orderId=' + listItem.dataset.oNo; // Redirect to /end with orderId

        // If the status is COMPLETED, remove the notification from the list
        if (listItem.dataset.status === 'COMPLETED') {
            console.log('[BellIcon] Status is COMPLETED. Removing notification.');
            listItem.remove();
            updateBellIconNotificationCount(-1);
            if (notifList.children.length === 1) { // Only "새로운 알림" header remains
                console.log('[BellIcon] No more notifications. Adding "알림이 없습니다." message.');
                const newNoNotifMessage = document.createElement('li');
                newNoNotifMessage.classList.add('text-muted', 'mb-0');
                newNoNotifMessage.textContent = '알림이 없습니다.';
                notifList.appendChild(newNoNotifMessage);
            }
        }
    };

    // 알림을 sessionStorage에 저장
    saveNotificationsToSessionStorage();

    // 종 모양 아이콘 깜빡임 효과 추가
    const notifyIconElement = document.getElementById('notifyIcon');
    if (notifyIconElement) {
        notifyIconElement.classList.add('bell-animated');
        setTimeout(() => {
            notifyIconElement.classList.remove('bell-animated');
        }, 500); // 0.5초 후에 애니메이션 클래스 제거
    }
}

// 종 모양 알림 카운트 업데이트 함수
function updateBellIconNotificationCount(change) {
    console.log('[BellIcon] updateBellIconNotificationCount called with change:', change);
    if (!notifBadge) { // notifBadge가 null일 경우를 대비
        console.log('[BellIcon] notifBadge is null. Cannot update count.');
        return;
    }

    let currentCount = parseInt(notifBadge.textContent);
    currentCount += change;
    notifBadge.textContent = currentCount;

    if (currentCount > 0) {
        notifBadge.classList.remove('d-none');
    } else {
        notifBadge.classList.add('d-none');
    }
    console.log('[BellIcon] New bell icon notification count:', currentCount);
}

// sessionStorage에 알림 저장
function saveNotificationsToSessionStorage() {
    if (!notifList) { // notifList가 null일 경우를 대비
        console.log('[BellIcon] notifList is null. Cannot save notifications.');
        return;
    }
    const notifications = [];
    notifList.querySelectorAll('li.dropdown-item').forEach(item => {
        if (item.dataset.oNo) { // oNo가 있는 알림만 저장
            notifications.push({
                oNo: item.dataset.oNo,
                status: item.dataset.status,
                message: item.textContent // 현재 표시된 메시지 저장
            });
        }
    });
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(notifications));
    console.log('[BellIcon] Notifications saved to sessionStorage:', notifications);
}

// sessionStorage에서 알림 불러오기
function loadNotificationsFromSessionStorage() {
    if (!notifList) { // notifList가 null일 경우를 대비
        console.log('[BellIcon] notifList is null. Cannot load notifications.');
        return;
    }
    const storedNotifications = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (storedNotifications) {
        const notifications = JSON.parse(storedNotifications);
        console.log('[BellIcon] Notifications loaded from sessionStorage:', notifications);
        // 기존 알림 목록 초기화 (알림 없음 메시지 포함)
        notifList.innerHTML = '<li><h6 class="dropdown-header">새로운 알림</h6></li><li class="text-muted mb-0">알림이 없습니다.</li>';

        notifications.forEach(notification => {
            // 알림을 다시 DOM에 추가
            const noNotifMessage = notifList.querySelector('li.text-muted');
            if (noNotifMessage) {
                noNotifMessage.remove();
            }

            const listItem = document.createElement('li');
            listItem.classList.add('dropdown-item');
            listItem.style.whiteSpace = 'normal';
            listItem.style.wordBreak = 'break-word';
            listItem.dataset.oNo = notification.oNo;
            listItem.dataset.status = notification.status;
            listItem.textContent = notification.message;

            listItem.onclick = function() {
                console.log('[BellIcon] Stored notification clicked for oNo:', listItem.dataset.oNo, 'status:', listItem.dataset.status);
                window.location.href = '/end?orderId=' + listItem.dataset.oNo;

                if (listItem.dataset.status === 'COMPLETED') {
                    console.log('[BellIcon] Stored notification status is COMPLETED. Removing.');
                    listItem.remove();
                    updateBellIconNotificationCount(-1);
                    if (notifList.children.length === 1) {
                        const newNoNotifMessage = document.createElement('li');
                        newNoNotifMessage.classList.add('text-muted', 'mb-0');
                        newNoNotifMessage.textContent = '알림이 없습니다.';
                        notifList.appendChild(newNoNotifMessage);
                    }
                }
                saveNotificationsToSessionStorage(); // 상태 변경 후 저장
            };
            notifList.appendChild(listItem);
            updateBellIconNotificationCount(1); // 카운트 증가
        });
    } else {
        console.log('[BellIcon] No notifications found in sessionStorage.');
    }
    // 초기 로드 시 알림이 없으면 '알림이 없습니다.' 메시지 표시
    if (notifList.querySelectorAll('li.dropdown-item').length === 0) {
        if (!notifList.querySelector('li.text-muted')) {
            const newNoNotifMessage = document.createElement('li');
            newNoNotifMessage.classList.add('text-muted', 'mb-0');
            newNoNotifMessage.textContent = '알림이 없습니다.';
            notifList.appendChild(newNoNotifMessage);
        }
    }
}


function connectWebSocket() {
    const socket = new SockJS('/ws');
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        console.log('[WebSocket] Connected: ' + frame);

        // 개인화된 주문 상태 업데이트 채널 구독
        stompClient.subscribe('/user/queue/order-updates', function (message) {
            console.log('--- STOMP SUBSCRIBE CALLBACK ENTERED ---');
            console.log('[WebSocket] Received order update:', message.body);
            const payload = JSON.parse(message.body);

            // 종 모양 알림 처리
            handleBellIconNotification(payload);

            // 토스티파이 알림 처리 (기존 로직)
            showOrderNotification(payload);
        });
    }, function(error) {
        console.error('[WebSocket] Connection error: ' + error);
        // 연결 실패 시 5초 후 재시도
        setTimeout(connectWebSocket, 5000);
    });
}


function showOrderNotification(payload) {
    console.log(">>> showOrderNotification 함수 실행됨. 받은 payload:", payload);

    let notificationMessage = '';
    let onClickAction = function() {};
    let toastOptions = {
        duration: 5000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
    };

    // payload.message가 있으면 그 값을 사용하고, 없으면 기존 로직으로 메시지 생성
    if (payload.message) {
        notificationMessage = payload.message;
        // payload.message가 있을 때도 ACCEPTED 상태면 클릭 액션 할당
        if (payload.status === 'ACCEPTED') {
            onClickAction = function() {
                window.location.href = '/end?orderId=' + payload.oNo;
            };
        } else if (payload.status === 'REJECTED') {
            onClickAction = function() { alert(notificationMessage); };
        }
    } else if (payload.status === 'ACCEPTED') {
        notificationMessage = `✅ 주문 #${payload.oNo}이(가) 수락되었습니다! 곧 준비가 시작됩니다.`;
        onClickAction = function() {
            window.location.href = '/end?orderId=' + payload.oNo;
        };
    } else if (payload.status === 'REJECTED') {
        notificationMessage = `❌ 주문 #${payload.oNo}이(가) 가게 사정으로 취소되었습니다. 결제 금액은 자동으로 환불됩니다.`;
        onClickAction = function() { alert(notificationMessage); };
    } else {
        notificationMessage = `🔔 주문 #${payload.oNo} 상태 업데이트: ${payload.status}`;
    }

    if (typeof Toastify === 'function') {
        toastOptions.text = notificationMessage;
        toastOptions.onClick = onClickAction;
        toastOptions.duration = -1; // <-- 이 줄을 추가하여 클릭할 때까지 유지
        Toastify(toastOptions).showToast();
    } else {
        if (payload.status === 'REJECTED') {
            alert(notificationMessage);
        }
    }
}
