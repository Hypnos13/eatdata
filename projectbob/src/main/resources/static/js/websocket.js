// 웹소켓 연결 및 알림 처리

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
    let onClickAction = function() {}; // 기본 클릭 동작 없음
    let toastOptions = {
        duration: 5000, // 기본 5초
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
    };

    // 상태에 따라 메시지, 색상, 동작 정의
    if (payload.status === 'ACCEPTED') {
        notificationMessage = `✅ 주문 #${payload.oNo}이(가) 수락되었습니다! 곧 준비가 시작됩니다.`;
        toastOptions.backgroundColor = "linear-gradient(to right, #00b09b, #96c93d)";
        toastOptions.duration = -1; // 사용자가 닫을 때까지 유지
        onClickAction = function() {
            // 사용자가 알림을 클릭하면 completed.html로 이동
            window.location.href = '/end?orderId=' + payload.oNo;
        };
    } else if (payload.status === 'REJECTED') {
        notificationMessage = `❌ 주문 #${payload.oNo}이(가) 가게 사정으로 취소되었습니다. 결제 금액은 자동으로 환불됩니다.`;
        toastOptions.backgroundColor = "linear-gradient(to right, #ff5f6d, #ffc371)";
        // 거절 알림은 특별한 클릭 동작이 필요 없음
        onClickAction = function() { alert(notificationMessage); };
    } else {
        // DELIVERING 등 다른 상태는 나중에 구현될 것이므로, 지금은 기본 알림만 처리
        notificationMessage = `🔔 주문 #${payload.oNo} 상태 업데이트: ${payload.status}`;
        toastOptions.backgroundColor = "#4e54c8";
    }

    // Toastify 라이브러리 사용 또는 alert/confirm으로 대체
    if (typeof Toastify === 'function') {
        toastOptions.text = notificationMessage;
        toastOptions.onClick = onClickAction;
        Toastify(toastOptions).showToast();
    } else {
        // Toastify 없을 때의 대체 동작
        if (payload.status === 'REJECTED') {
            alert(notificationMessage);
        } else if (payload.status === 'ACCEPTED') {
            if (confirm(notificationMessage + "\n\n주문 내역을 확인하시겠습니까?")) {
                 window.location.href = '/end?oNo=' + payload.oNo;
            }
        } else {
            alert(notificationMessage);
        }
    }
}

// 페이지 로드 시 웹소켓 연결 시도
$(document).ready(function() {
    console.log("websocket.js: $(document).ready() 실행됨.");
    
    // window.currentUserId는 main_layout.html에서 주입됨
    if (window.currentUserId) {
        console.log("[WebSocket] User logged in, attempting to connect...");
        connectWebSocket();
    } else {
        console.log("[WebSocket] User not logged in, skipping connection.");
    }
});
