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
    console.log(">>> showOrderNotification 함수 실행됨. 받은 payload:", payload); // 이 줄 추가
    let message = payload.message || '주문 상태가 변경되었습니다.';
    let isAccepted = payload.status === 'ACCEPTED';

    // Toastify.js를 사용하여 알림 표시 (라이브러리가 추가되어 있다고 가정)
    // 만약 Toastify.js가 없다면 alert()으로 대체할 수 있습니다.
    if (typeof Toastify === 'function') {
        Toastify({
            text: message,
            duration: isAccepted ? -1 : 5000, // 수락 시에는 사용자가 닫을 때까지 유지
            close: true,
            gravity: "top", 
            position: "right", 
            backgroundColor: isAccepted ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #ff5f6d, #ffc371)",
            stopOnFocus: true, 
            onClick: isAccepted ? function(){
                // 주문 완료 페이지로 이동
                window.location.href = '/end?orderId=' + payload.oNo;
            } : function(){}
        }).showToast();
    } else {
        // Toastify 라이브러리가 없을 경우 alert으로 대체
        alert(message);
        if (isAccepted) {
            if (confirm("주문 완료 페이지로 이동하시겠습니까?")) {
                window.location.href = '/end?orderId=' + payload.oNo;
            }
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
