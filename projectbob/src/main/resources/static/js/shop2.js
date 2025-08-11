/**
 * ================================================================
 * SECTION 1: 헬퍼 함수 (Helper Functions)
 * - 재사용 가능한 범용 함수들을 모아놓은 영역입니다.
 * ================================================================
 */

// ==== 1.1. 알림(Notification) 관련 헬퍼 함수 ====

// [신규] 주문 정보를 받아 헤더 알림 목록(li) DOM 요소를 생성하는 함수
function createNotificationElement(order) {
    const li = document.createElement('li');
    li.className = 'notif-item';
    li.dataset.orderNo = order.id;

    const a = document.createElement('a');
    a.className = 'dropdown-item text-truncate';
    a.href = `/shop/newOrders?sOrderNo=${order.id}`;
    a.textContent = order.text;

    li.appendChild(a);
    return li;
}

// [개선] 기존 리스트를 지우고 "알림 없음" 메시지를 표시하는 기능까지 포함하도록 개선
function clearHeaderList() {
    const ul = document.getElementById('header-notif-list');
    if (ul) {
        ul.innerHTML = '<li><p class="text-center text-muted my-2 mb-0">새로운 알림이 없습니다.</p></li>';
    }
}

// [개선] PENDING 주문 ID 배열을 받아 헤더 알림 UI를 렌더링
function renderPendingOrders(orderIds) {
    const badge = document.getElementById('header-notif-badge');
    const ul = document.getElementById('header-notif-list');

    if (!badge || !ul) return;

    badge.textContent = orderIds.length;

    if (orderIds.length > 0) {
        badge.classList.remove('d-none');
        ul.innerHTML = '<li><h6 class="dropdown-header">새로운 알림</h6></li>';
        orderIds.forEach(oNo => {
            const orderInfo = { id: oNo, text: `🚨 신규 주문이 도착했습니다. (#${oNo})` };
            const li = createNotificationElement(orderInfo);
            ul.appendChild(li);
        });
        markBellAsUnread();
    } else {
        badge.classList.add('d-none');
        clearBellBlink();
        clearHeaderList();
    }
}

// [개선] WebSocket 메시지를 받아 헤더에 실시간 알림을 추가
function renderHeaderNotification(msg) {
    const data = JSON.parse(msg.body);
    const badge = document.getElementById('header-notif-badge');
    const list = document.getElementById('header-notif-list');
    if (!badge || !list) return;

    badge.textContent = parseInt(badge.textContent || '0', 10) + 1;
    badge.classList.remove('d-none');
    list.querySelector('p.text-center.text-muted')?.parentElement.remove();

    const orderInfo = { id: data.orderId, text: `신규 주문이 도착했습니다.` };
    const item = createNotificationElement(orderInfo);
    
    list.appendChild(item);

    const pending = JSON.parse(sessionStorage.getItem('pendingOrders') || '[]');
    pending.push(data.orderId);
    sessionStorage.setItem('pendingOrders', JSON.stringify(Array.from(new Set(pending))));
}

// [개선] 헤더 알림 아이템 제거 (UI와 SessionStorage 동기화)
function removeHeaderNotification(oNo) {
    document.querySelector(`#header-notif-list .notif-item[data-order-no="${oNo}"]`)?.remove();
    const pending = JSON.parse(sessionStorage.getItem('pendingOrders') || '[]');
    const filtered = pending.filter(id => id != oNo);
    sessionStorage.setItem('pendingOrders', JSON.stringify(filtered));

    const badge = document.getElementById('header-notif-badge');
    if (!badge) return;
    
    const count = filtered.length;
    badge.textContent = count;

    if (count === 0) {
        badge.classList.add('d-none');
        clearBellBlink();
        clearHeaderList();
    }
}

// 신규 주문 페이지 목록 아이템 렌더링 함수
function renderNewOrderItem(msg) {
    const ul = document.getElementById('newOrderList');
    if (!ul) return;

    ul.querySelector('li.text-center.text-muted')?.remove();

    const o = JSON.parse(msg.body);
    const orderId = o.orderId;

    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-start mb-3 p-3';
    li.innerHTML = `
    <div class="flex-grow-1 pe-3">
      <div class="mb-1">🛒 ${o.menus}</div>
      <div class="mb-1">💬 ${o.request || '요청사항 없음'}</div>
      <div class="text-muted small">
        <i class="bi bi-clock"></i>${new Date(o.regDate).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
      </div>
    </div>
    <div class="d-flex flex-column justify-content-between" style="min-width: 5rem;">
      <button class="btn btn-success btn-sm mb-2" onclick="updateOrderStatus(${orderId}, 'ACCEPTED')">수락</button>
      <button class="btn btn-outline-danger btn-sm" onclick="updateOrderStatus(${orderId}, 'REJECTED')">거절</button>
    </div>
  `;
    ul.prepend(li);
}

// 알림 아이콘 깜빡임 제어 함수
function markBellAsUnread() {
    document.getElementById('notifyIcon')?.classList.add('blink');
}

function clearBellBlink() {
    document.getElementById('notifyIcon')?.classList.remove('blink');
}

// ==== 1.2. 폼(Form) 유효성 검사 및 유틸리티 ====
function findZipcode() {
    new daum.Postcode({
        oncomplete: function(data) {
            let addr = data.roadAddress;
            let extraAddr = '';
            if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                extraAddr += data.bname;
            }
            if (data.buildingName !== '' && data.apartment === 'Y') {
                extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
            }
            if (extraAddr !== '') {
                extraAddr = ' (' + extraAddr + ')';
            }
            addr += extraAddr;
            $("#zipcode").val(data.zonecode);
            $("#address1").val(addr);
            $("#address2").focus();
        }
    }).open();
}

function shopJoinFormCheck() {
    if ($("#sNumber").val().replace(/-/g, '').length !== 10) {
        alert("사업자 등록번호는 10자리입니다.");
        $("#sNumber").focus();
        return false;
    }
    if ($("#owner").val().length == 0) {
        alert("대표자 명을 입력해주세요.");
        return false;
    }
    if ($("#phone").val().length !== 13) {
        alert("연락처는 '-'을 포함하여 13자리를 입력해주세요.");
        $("#phone").focus();
        return false;
    }
    if ($("#name").val().length == 0) {
        alert("가게 이름을 입력해주세요.");
        return false;
    }
    if ($("#zipcode").val().length == 0) {
        alert("우편번호를 입력해주세요.");
        return false;
    }
    if ($("#address2").val().length == 0) {
        alert("상세주소를 입력해주세요.");
        return false;
    }
    return true;
}

function menuJoinFormCheck() {
    if ($("#category").val().length == 0) {
        alert("카테고리를 입력해주세요.");
        return false;
    }
    if ($("#name").val().length == 0) {
        alert("메뉴 이름을 입력해주세요.");
        return false;
    }
    if ($("#price").val().length == 0) {
        alert("가격을 입력해주세요.");
        return false;
    }
    if ($("#mInfo").val().length == 0) {
        alert("메뉴 설명을 입력해주세요.");
        return false;
    }
    return true;
}

// ==== 1.3. 카카오맵(Kakao Map) 관련 헬퍼 ====
function displayKakaoMap(containerId, address) {
    const mapContainer = document.getElementById(containerId);
    if (!mapContainer || !address || !(window.kakao && kakao.maps && kakao.maps.services)) {
        console.warn("지도 생성에 필요한 요소(컨테이너, 주소, 카카오 API)가 준비되지 않았습니다.");
        return;
    }
    const mapOption = {
        center: new kakao.maps.LatLng(37.566826, 126.9786567),
        level: 3
    };
    const map = new kakao.maps.Map(mapContainer, mapOption);
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, function(result, status) {
        if (status === kakao.maps.services.Status.OK && result.length > 0) {
            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            new kakao.maps.Marker({ map: map, position: coords });
            map.setCenter(coords);
        } else {
            console.error(`카카오맵 주소 검색 실패 (주소: '${address}', 상태: ${status})`);
        }
    });
}

// ==== 1.4. 주문(Order) 상태 관리 ====
window.updateOrderStatus = function(oNo, newStatus) {
    const actionMap = {
        'ACCEPTED': { text: '수락', redirect: '/shop/orderManage?status=ACCEPTED' },
        'REJECTED': { text: '거절', redirect: '/shop/orderManage?status=PENDING' },
        'IN_PROGRESS': { text: '픽업 처리' },
        'COMPLETED': { text: '배달 완료', redirect: '/shop/orderManage?status=PENDING' }
    };
    const action = actionMap[newStatus];
    if (!action) {
        console.error("유효하지 않은 주문 상태입니다:", newStatus);
        return;
    }

    fetch(`/shop/orderManage/${oNo}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `newStatus=${newStatus}`
    })
    .then(res => {
        if (!res.ok) throw new Error(`주문 ${action.text} 요청 실패`);
        return res.json();
    })
    .then(data => {
        if (data.success) {
            if (action.redirect) {
                location.href = action.redirect;
            } else if (newStatus === 'IN_PROGRESS') {
                document.getElementById('btnPickup').disabled = true;
                document.getElementById('btnDeliver').disabled = false;
            }
        } else {
            throw new Error(data.message || `주문 ${action.text} 처리 실패`);
        }
    })
    .catch(error => {
        console.error(error);
        alert(`주문 ${action.text} 중 오류가 발생했습니다.`);
    });
};

// ==== 1.5. 신규 주문 상세 정보 표시 헬퍼 ====
function selectNewOrder(el) {
  // 1) 리스트 활성화
  document.querySelectorAll('.order-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  // 2) data- 속성에서 값 꺼내기
  const { orderNo, regdate, totalprice, oaddress, menus, request } = el.dataset;
  const panel = document.querySelector('.order-detail-panel');
  if (!panel) return;

  // 3) 현대식 카드 레이아웃으로 innerHTML 덮어쓰기
  panel.innerHTML = `
    <!-- 1. 헤더 박스 -->
    <div class="order-detail-box order-detail-box--header">
      <div class="d-flex justify-content-between">
        <div>
          <h4 class="mb-1">주문번호 ${orderNo}</h4>
          <div class="text-muted">${oaddress}</div>
        </div>
        <div class="text-end">
          <div class="text-muted mb-1">${regdate}</div>
          <div class="fw-bold">${ oaddress ? '배달' : '픽업' }</div>
        </div>
      </div>
    </div>
    
    <!-- 2. 주문 정보 박스 -->
    <div class="order-detail-box order-detail-box--info">
      <ul class="list-group list-group-flush mt-2">
        <!-- 메뉴 -->
        <li class="list-group-item d-flex align-items-center py-2">
          <div class="flex-shrink-1 fw-bold">메뉴</div>
          <div class="flex-grow-1 text-end">
            ${ menus.replace(/,/g,'<br/>') }
          </div>
        </li>
        <!-- 총액 -->
        <li class="list-group-item d-flex align-items-center py-2">
          <div class="flex-grow-1">총액</div>
          <div class="fw-bold">${totalprice}원</div>
        </li>
        <!-- 요청사항 -->
        <li class="list-group-item d-flex align-items-center py-2">
          <div class="flex-grow-1">요청사항</div>
          <div class="fw-bold">${request || '없음'}</div>
        </li>
      </ul>
    </div>

    <!-- 3. 액션 버튼 박스 -->
    <div class="order-detail-box order-detail-box--actions">
      <button class="btn btn-success me-2"
              onclick="updateOrderStatus(${orderNo}, 'ACCEPTED')">
        수락
      </button>
      <button class="btn btn-outline-danger"
              onclick="updateOrderStatus(${orderNo}, 'REJECTED')">
        거절
      </button>
    </div>
  `;
}

window.acceptOrder = function(oNo) {
  updateOrderStatus(oNo, 'ACCEPTED');
};
window.rejectOrder = function(oNo) {
  updateOrderStatus(oNo, 'REJECTED');
};

/**
 * ================================================================
 * SECTION 2: 기능별 초기화 함수 (Initialization Functions)
 * ================================================================
 */

function initFormHandling() {
    $("#shopJoinForm").on("submit", function(event) {
        if (!shopJoinFormCheck()) {
            event.preventDefault();
            return;
        }
        $('#sNumber').val($('#sNumber').val().replace(/-/g, ''));
    });

    $("#menuJoinForm").on("submit", function(e) {
        if (!menuJoinFormCheck()) e.preventDefault();
    });

    $("#btnZipcode").on("click", findZipcode);
}

function initInputFormatters() {
    $('#sNumber').on('input', function(event) {
        let value = this.value.replace(/[^0-9]/g, '');
        if (value.length > 10) value = value.substring(0, 10);
        
        let formattedValue = '';
        if (value.length < 4) formattedValue = value;
        else if (value.length < 6) formattedValue = value.substring(0, 3) + '-' + value.substring(3);
        else formattedValue = value.substring(0, 3) + '-' + value.substring(3, 5) + '-' + value.substring(5);
        this.value = formattedValue;
    });

    $('#phone').on('input', function(event) {
        let value = this.value.replace(/[^0-9]/g, '');
        if (value.length > 11) value = value.substring(0, 11);

        let formattedValue = '';
        if (value.length < 4) formattedValue = value;
        else if (value.length < 8) formattedValue = value.substring(0, 3) + '-' + value.substring(3);
        else formattedValue = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7);
        this.value = formattedValue;
    });
}

function initNutritionSearch() {
    const $btnSearch = $('#btnSearchNutrition');
    if (!$btnSearch.length) return;

    const $menuNameInput = $('#name');
    const $resultsList = $('#nutrition-results');
    const $selectedInfoDiv = $('#selected-nutrition-info');

    $btnSearch.on('click', async function() {
        const foodName = $menuNameInput.val();
        if (!foodName) {
            alert('메뉴 이름을 먼저 입력해주세요.');
            return;
        }
        try {
            const response = await fetch(`/api/nutrition-search?foodName=${encodeURIComponent(foodName)}`);
            const result = await response.json();
            
            $resultsList.empty(); 
            
            if (result.body && result.body.items && result.body.items.length > 0) {
                $resultsList.show();
                result.body.items.forEach(item => {
                    const $li = $('<li></li>')
                        .addClass('list-group-item list-group-item-action')
                        .css('cursor', 'pointer')
                        .text(`${item.FOOD_NM_KR} (1회 제공량: ${item.SERVING_SIZE}, 열량: ${item.AMT_NUM1}kcal)`)
                        .data({
                            servingSize: item.SERVING_SIZE.replace(/[^0-9.]/g, ''),
                            calories: item.AMT_NUM1,
                            carbs: item.AMT_NUM6,
                            protein: item.AMT_NUM4,
                            fat: item.AMT_NUM5,
														sfa: item.AMT_NUM24,
                            sugar: item.AMT_NUM7,
                            sodium: item.AMT_NUM13
                        });
                    $resultsList.append($li);
                });
            } else {
                $resultsList.html('<li class="list-group-item">검색 결과가 없습니다.</li>').show();
            }
        } catch (error) {
            console.error('Error fetching nutrition data:', error);
            alert('영양 정보를 불러오는 데 실패했습니다.');
        }
    });
    
    $resultsList.on('click', 'li', function() {
        const $selectedItem = $(this);
        const data = $selectedItem.data();

        $('input[name="servingSize"]').val(data.servingSize || 0);
        $('input[name="calories"]').val(data.calories || 0);
        $('input[name="carbs"]').val(data.carbs || 0);
        $('input[name="protein"]').val(data.protein || 0);
        $('input[name="fat"]').val(data.fat || 0);
				$('input[name="sfa"]').val(data.sfa || 0);
        $('input[name="sugar"]').val(data.sugar || 0);
        $('input[name="sodium"]').val(data.sodium || 0);
        
        $selectedInfoDiv.text(`✅ ${$selectedItem.text()} 의 영양성분이 선택되었습니다.`).show();
        $resultsList.hide();
    });
}

function initDispatchPage() {
    const $dispatchMapContainer = $('#map');
    if (!$dispatchMapContainer.length) return;

    kakao.maps.load(function() {
        const $shopInfoEl = $('#shopData');
        const $waitingOrdersEl = $('#waitingOrdersData');

        if ($shopInfoEl.length && $waitingOrdersEl.length) {
            const shopInfo = $shopInfoEl.data('shop');
            const orderList = $waitingOrdersEl.data('orders');
            const shopFullAddress = shopInfo.address1 + ' ' + shopInfo.address2;
            let currentSelectedOrderId = orderList.length > 0 ? orderList[0].ono : null;

            const map = new kakao.maps.Map($dispatchMapContainer[0], {
                center: new kakao.maps.LatLng(37.480987, 126.952227),
                level: 3
            });
            const geocoder = new kakao.maps.services.Geocoder();
            let markers = [];

            function updateMapAndDetails(order) {
                if (!order) return;
                markers.forEach(marker => marker.setMap(null));
                markers = [];

                if (shopFullAddress) {
                    geocoder.addressSearch(shopFullAddress, function(result, status) {
                        if (status === kakao.maps.services.Status.OK && result.length > 0) {
                            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                            markers.push(new kakao.maps.Marker({ map: map, position: coords, title: '픽업지' }));
                            map.setCenter(coords);
                        }
                    });
                }

                if (order.oaddress) {
                    geocoder.addressSearch(order.oaddress, function(result, status) {
                        if (status === kakao.maps.services.Status.OK && result.length > 0) {
                            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                            const markerImage = new kakao.maps.MarkerImage('https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png', new kakao.maps.Size(64, 69), { offset: new kakao.maps.Point(27, 69) });
                            markers.push(new kakao.maps.Marker({ map: map, position: coords, title: '도착지', image: markerImage }));
                        }
                    });
                }
                $('#customerAddress').text(order.oaddress || '주소 정보 없음');
                $('#customerPhone').text(order.clientPhone || '연락처 정보 없음');
            }

            if (orderList && orderList.length > 0) {
                updateMapAndDetails(orderList[0]);
            }

            $('.order-list').on('click', '.order-card', function() {
                const $clickedCard = $(this);
                currentSelectedOrderId = parseInt($clickedCard.data('orderId'));
                const selectedOrder = orderList.find(order => order.ono === currentSelectedOrderId);
                if (!selectedOrder) return;

                $('.order-card').removeClass('active');
                $clickedCard.addClass('active');
                updateMapAndDetails(selectedOrder);
            });

            // --- 모달 관련 스크립트 ---
            const $pickupSelect = $('#pickupTimeSelect');
            const $deliverySelect = $('#deliveryTimeSelect');
            const $pickupDisplay = $('#pickupTimeDisplay');
            const $deliveryDisplay = $('#deliveryTimeDisplay');

            const formatTime = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

            function updateDisplayTimes() {
                const now = new Date();
                const pickupMinutes = parseInt($pickupSelect.val());
                const deliveryMinutes = parseInt($deliverySelect.val());
                const pickupTime = new Date(now.getTime() + pickupMinutes * 60000);
                const deliveryTime = new Date(now.getTime() + deliveryMinutes * 60000);
                $pickupDisplay.text(`(${formatTime(pickupTime)})`);
                $deliveryDisplay.text(`(${formatTime(deliveryTime)})`);
            }

            $pickupSelect.on('change', updateDisplayTimes);
            $deliverySelect.on('change', updateDisplayTimes);

            $('#dispatchModal').on('show.bs.modal', updateDisplayTimes);
            
            $('#btnConfirmDispatch').on('click', async function() {
                const selectedOrder = orderList.find(order => order.ono === currentSelectedOrderId);
                if (!selectedOrder) {
                    alert("오류: 선택된 주문을 찾을 수 없습니다.");
                    return;
                }
                const agency = $('#deliveryAgencySelect').val();
                const pickupAfterMinutes = parseInt($('#pickupTimeSelect').val());
                const deliveryAfterMinutes = parseInt($('#deliveryTimeSelect').val());
                const now = new Date();
                const pickupTime = new Date(now.getTime() + pickupAfterMinutes * 60000);
                const deliveryTime = new Date(now.getTime() + deliveryAfterMinutes * 60000);
                const pickupTimeStr = `${pickupAfterMinutes}분 후 (${formatTime(pickupTime)})`;
                const deliveryTimeStr = `${deliveryAfterMinutes}분 후 (${formatTime(deliveryTime)})`;
                const dispatchDataForServer = {
                    agency: agency,
                    pickupTime: pickupTimeStr,
                    deliveryTime: deliveryTimeStr
                };

                try {
                    const response = await fetch(`/shop/orders/${selectedOrder.ono}/dispatch`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dispatchDataForServer)
                    });
                    if (!response.ok) throw new Error('서버 배차 요청 실패');
                    const result = await response.json();
                    if (result.success) {
                        alert(`주문번호 ${selectedOrder.ono}에 대한 배차를 요청했습니다.`);
                        bootstrap.Modal.getInstance(document.getElementById('dispatchModal')).hide();
                        $(`.order-card[data-order-id="${selectedOrder.ono}"]`).fadeOut();
                    } else {
                        alert(`배차 요청 실패: ${result.message || '알 수 없는 오류'}`);
                    }
                } catch (error) {
                    console.error("배차 요청 실패:", error);
                    alert("배차 요청 중 오류가 발생했습니다.");
                }
            });
        }
    });
}

function initKakaoMapDisplay() {
    const $map = $("#shop-map");
    if (!$map.length) return;

    let address = '';
    const $addr1_input = $("#address1[type='text']");

    if ($addr1_input.length) {
        const getFormAddress = () => ($("#address1").val() || "") + " " + ($("#address2").val() || "");
        address = getFormAddress();
        if (address.trim()) {
            setTimeout(() => displayKakaoMap('shop-map', address), 300);
        }
        $("#address1, #address2").on("input", function() {
            const currentAddress = getFormAddress();
            if (currentAddress.trim()) {
                displayKakaoMap('shop-map', currentAddress);
            }
        });
    } else {
        const $addr1_view = $("#address1");
        const $addr2_view = $("#address2");
        if ($addr1_view.length) {
            let addr = $addr1_view.text().trim();
            let addr2 = ($addr2_view.length) ? $addr2_view.text().trim() : '';
            if (addr2) addr += " " + addr2;
            if (addr) {
                setTimeout(() => displayKakaoMap('shop-map', addr), 300);
            }
        }
    }
}

function initShopStatusToggle() {
    $('#shopStat').on('change', function() {
        const $checkbox = $(this);
        $.post('/shop/statusUpdate', { sId: $checkbox.data('sid'), status: $checkbox.is(':checked') ? 'Y' : 'N' })
            .done(() => location.reload())
            .fail(() => {
                alert('상태 변경에 실패했습니다.');
                $checkbox.prop('checked', !$checkbox.is(':checked'));
            });
    });
}

function initReviewReplyHandlers() {
    $('.review-container').on('click', '.btn', function(e) {
        e.preventDefault();
        const $btn = $(this);
        const $box = $btn.closest('.reply-box');

        if ($btn.hasClass('btn-edit')) {
            $box.find('.view-mode').addClass('d-none');
            $box.find('.edit-mode').removeClass('d-none');
        } else if ($btn.hasClass('btn-cancel')) {
            $box.find('.edit-mode').addClass('d-none');
            $box.find('.view-mode').removeClass('d-none');
        } else if ($btn.hasClass('btn-save')) {
            const { rrno, sid } = $box.data();
            const newContent = $box.find('.edit-input').val().trim();
            if (!newContent) { alert('내용을 입력해주세요.'); return; }
            $.post('/shop/review/reply/update', { rrNo: rrno, sId: sid, content: newContent })
                .done(() => {
                    $box.find('.view-mode').text(newContent).removeClass('d-none');
                    $box.find('.edit-mode').addClass('d-none');
                })
                .fail(() => alert('수정에 실패했습니다.'));
        } else if ($btn.hasClass('btn-delete')) {
            if (!confirm('이 답글을 삭제하시겠습니까?')) return;
            const { rrno, sid } = $box.data();
            $.post('/shop/review/reply/delete', { rrNo: rrno, sId: sid })
                .done(() => $box.remove())
                .fail(() => alert('삭제에 실패했습니다.'));
        }
    });
}

// [최종 수정] 영업시간 관리 UI(휴무/영업일 토글 등) 초기화
function initOpeningHoursUI() {
    
    // [수정] 원본 코드의 로직을 그대로 복원하여 라벨을 정확히 찾도록 수정
    const updateDayRow = ($chk) => {
        const $tr = $chk.closest("tr");
        
        // [복원] 체크박스의 id 또는 name에서 고유 인덱스를 추출하는 핵심 로직
        const idx = $chk.attr("id")
          ? $chk.attr("id").replace("isOpen", "")
          : $chk.attr("name").match(/\[(\d+)\]/)[1];
        
        // [복원] 추출한 인덱스를 사용하여 정확한 ID의 라벨을 선택
        const $label = $("#openLabel" + idx);
        const on = $chk.is(":checked");

        // [복원] 원본과 동일하게 select는 CSS 클래스로, 체크박스는 disabled 속성으로 제어
        $tr.find("select").toggleClass("disabled-look", !on);
        $tr.find(".allDay-check").prop("disabled", !on);

        $label
            .text(on ? "영업일" : "휴무일")
            .toggleClass("bg-success", on)
            .toggleClass("bg-secondary", !on);
    };

    // 아래 로직들은 원본과 동일하게 정상 작동합니다.
    $(".switch input[type='checkbox'][name^='isOpen']")
        .each(function() { updateDayRow($(this)); })
        .on("change", function() { updateDayRow($(this)); });

    $(".allDay-check").on("change", function() {
        const $tr = $(this).closest("tr");
        if (this.checked) {
            $tr.find("select[name^='openHour']").val("00");
            $tr.find("select[name^='openMin']").val("00");
            $tr.find("select[name^='closeHour']").val("23");
            $tr.find("select[name^='closeMin']").val("59");
        }
    });

    // 제출 시 비활성화된 select를 다시 활성화하여 값을 전송하기 위한 로직
    $("#openTimeForm").on("submit", function() {
        // 실제 disabled된 요소뿐 아니라, CSS로 제어된 요소도 고려하여
        // 제출 직전에 모두 정상 상태로 되돌리는 것이 안전할 수 있습니다.
        // 여기서는 원본 코드의 의도를 따라 disabled만 해제합니다.
        $(this).find("select:disabled").prop("disabled", false);
    });
}

function initOrderDetailButtons() {
    const btnPickup = document.getElementById('btnPickup');
    const btnDeliver = document.getElementById('btnDeliver');
    const container = document.querySelector('[data-order-no]');
    
    if (!container) return;
    const oNo = container.dataset.orderNo;

    if (btnPickup) {
        btnPickup.addEventListener('click', () => updateOrderStatus(oNo, 'IN_PROGRESS'));
    }
    if (btnDeliver) {
        btnDeliver.addEventListener('click', () => updateOrderStatus(oNo, 'COMPLETED'));
    }
}

function initNewOrderList() {
    const orderListContainer = document.getElementById('newOrderList');
    if (!orderListContainer) return;
    
    const cards = orderListContainer.querySelectorAll('.order-card');
    cards.forEach(card => {
        card.addEventListener('click', () => selectNewOrder(card));
    });

    if (cards.length) {
        selectNewOrder(cards[0]);
    }
}

function initHeaderNotificationsFromStorage() {
    const stored = JSON.parse(sessionStorage.getItem('pendingOrders') || '[]');
    renderPendingOrders(stored);
}

function initWebSocket() {
    const notifyContainer = document.getElementById('notifyContainer');
    if (!notifyContainer) return;

    const shopId = notifyContainer.dataset.shopId;
    if (!shopId) {
        console.error('[WebSocket] 가게 ID를 찾을 수 없어 연결을 시작할 수 없습니다.');
        return;
    }

    // 1. setTimeout 제거! 즉시 연결 시작
    const socket = new SockJS('/ws');
    const stompClient = Stomp.over(socket);
    stompClient.debug = null; // 디버그 로그를 보려면 이 줄을 주석 처리하거나 stompClient.debug = console.log; 로 변경

    // 2. 연결 콜백 함수 안에서 모든 구독을 처리
    stompClient.connect({}, (frame) => { // frame 인자 추가 (연결 성공 정보)
        console.log(`[WebSocket] STOMP 연결 성공 (가게 ID: ${shopId})`, frame);

        // 신규 주문 알림 구독
        stompClient.subscribe(`/topic/newOrder/${shopId}`, (msg) => {
            console.log('[WS] 신규 주문 수신:', msg.body);
            renderHeaderNotification(msg);
            markBellAsUnread();
            if (window.location.pathname.includes('/shop/newOrders')) {
                renderNewOrderItem(msg);
            }
        });

        // 주문 상태 변경 알림 구독 (라이더 배차 완료 포함)
				
				stompClient.subscribe(`/topic/orderStatus/shop/${shopId}`, (msg) => {
				    console.log('[WS] 주문 상태 변경 수신:', msg.body);
				    const payload = JSON.parse(msg.body);
				    removeHeaderNotification(payload.oNo); 

				    if (window.location.pathname.includes('/shop/orderManage') && payload.newStatus === 'DISPATCHED') {
				        markBellAsUnread();

				        // 기존 alert 대신 SweetAlert2 사용
				        Swal.fire({
				            icon: 'success', // 아이콘 (success, error, warning, info, question)
				            title: '배차 완료!',
				            text: `주문번호 ${payload.oNo}번의 라이더 배차가 완료되었습니다.`,
				            confirmButtonText: '확인' // 버튼 텍스트
				        }).then((result) => {
				            // then() 안의 코드는 사용자가 버튼을 누른 후에만 실행됩니다.
				            if (result.isConfirmed) { // 사용자가 '확인' 버튼을 눌렀다면
				                location.reload(); // 페이지를 새로고침합니다.
				            }
				        });
				    }
				});
				
				
        /*stompClient.subscribe(`/topic/orderStatus/shop/${shopId}`, (msg) => {
            console.log('[WS] 주문 상태 변경 수신:', msg.body);
            const payload = JSON.parse(msg.body);
            
            // 신규주문 목록(PENDING)에서는 이 주문을 제거해야 함
            removeHeaderNotification(payload.oNo); 

            // 현재 페이지가 '주문 관리'이고 상태가 '배차 완료'일 때 알림창 표시
            if (window.location.pathname.includes('/shop/orderManage') && payload.newStatus === 'DISPATCHED') {
                markBellAsUnread();
                alert(`주문번호 ${payload.oNo}의 라이더 배차가 완료되었습니다!`);
								//setTimeout(() => {location.reload();}, 1000);
            }
        });*/

    }, (error) => {
        // 3. 연결 실패 시 에러 처리 로직 추가 (권장)
        console.error('[WebSocket] STOMP 연결 실패:', error);
    });
}

/**
 * ================================================================
 * SECTION 3: 메인 실행 (Main Execution)
 * ================================================================
 */

$(function() {
    initHeaderNotificationsFromStorage();
    initFormHandling();
    initInputFormatters();
    initShopStatusToggle();
    initReviewReplyHandlers();
    initOpeningHoursUI();
    initOrderDetailButtons();
    initNewOrderList();
    initNutritionSearch();
    initKakaoMapDisplay();
    initDispatchPage();
    initWebSocket();
});