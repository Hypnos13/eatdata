// ==== 주문관리 배달시작/완료 버튼 ====
let stompClient;       // 전역으로 빼서 나중에도 접근 가능하게
window.changeStatus = function(oNo, newStatus) {
  // stompClient 가 아직 연결되기 전일 수도 있으니
  if (!stompClient) return;

  stompClient.send(
    '/app/order/changeStatus',
    {}, 
    JSON.stringify({ oNo: oNo, newStatus: newStatus })
  );
};

// 그 다음에 DOMContentLoaded 안에서 stompClient 연결
document.addEventListener('DOMContentLoaded', () => {
  const socket = new SockJS('/ws');
  stompClient = Stomp.over(socket);

  stompClient.connect({}, () => {
    // (주문 상세 갱신, 리스트 갱신 구독 로직)
  });
});

// ==== 알림 렌더링 헬퍼 함수 ====
// 기존 리스트를 완전히 지우는 함수
function clearHeaderList() {
  document.getElementById('header-notif-list').innerHTML = '';
}

// 주문 ID 배열을 받아서 헤더 알림(뱃지 + 리스트)을 그려주는 함수
function renderPendingOrders(orderIds) {
  const badge = document.getElementById('header-notif-badge');
  const ul    = document.getElementById('header-notif-list');

  badge.textContent = orderIds.length;
  if (orderIds.length > 0) {
    badge.classList.remove('d-none');
    clearHeaderList();
    ul.innerHTML = '<li><h6 class="dropdown-header">새로운 알림</h6></li>';
    orderIds.forEach(oNo => {
      const li = document.createElement('li');
      li.className = 'notif-item';
      li.dataset.orderNo = oNo;
      li.innerHTML = `
        <a class="dropdown-item text-truncate"
           href="/shop/newOrders?sOrderNo=${oNo}">
          신규 주문이 도착했습니다.
        </a>`;
      ul.appendChild(li);
    });
    markBellAsUnread();
  } else {
    badge.classList.add('d-none');
    clearBellBlink();
    clearHeaderList();
    ul.innerHTML = '<li class="text-muted mb-0">알림이 없습니다.</li>';
  }
}

function findZipcode() {
	new daum.Postcode({
		oncomplete: function(data) {
			let addr = data.roadAddress;
			let extraAddr = '';
			if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
				extraAddr += data.bname;
			}
			if(data.buildingName !== '' && data.apartment === 'Y'){
			   extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
			}
			if(extraAddr !== ''){
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
	if($("#sNumber").val().replace(/-/g, '').length != 10 ) {
		alert("사업자 등록번호는 10자리입니다.")
		$("#sNumber").focus();
		return false;
	}
	if($("#owner").val().length == 0 ) {
		alert("대표자 명을 입력해주세요.")
		return false;
	}
	const rawPhoneNumber = $("#phone").val();
	if (rawPhoneNumber.length !== 13) {
		alert("연락처는 '-'을 포함하여 13자리를 입력해주세요.");
		$("#phone").focus();
		return false;
	}
	if($("#name").val().length == 0 ) {
		alert("가게 이름을 입력해주세요.")
		return false;
	}
	if($("#zipcode").val().length == 0 ) {
		alert("우편번호를 입력해주세요.")
		return false;
	}
	if($("#address2").val().length == 0 ) {
		alert("상세주소를 입력해주세요.")
		return false;
	}
    return true; // 모든 검증 통과 시 true 반환
}

function menuJoinFormCheck() {
	if($("#category").val().length == 0 ) {
		alert("카테고리를 입력해주세요.")
		return false;
	}
	if($("#name").val().length == 0 ) {
		alert("메뉴 이름을 입력해주세요.")
		return false;
	}
	if($("#price").val().length == 0 ) {
		alert("가격을 입력해주세요.")
		return false;
	}
	if($("#mInfo").val().length == 0 ) {
		alert("메뉴 설명을 입력해주세요.")
		return false;
	}
    return true; // 모든 검증 통과 시 true 반환
}


// ==== 2. jQuery Document Ready - 모든 이벤트 리스너 및 기능 실행 ====
$(function() {

    // ===== 2.1. 폼 검증 및 공통 이벤트 바인딩 =====
    $("#shopJoinForm").on("submit", function(e) {
        if (!shopJoinFormCheck()) {
            e.preventDefault();
        } else {
            // 폼 제출 시 하이픈 제거
            const sNumberInput = document.getElementById('sNumber');
            if (sNumberInput) {
                sNumberInput.value = sNumberInput.value.replace(/-/g, '');
            }
        }
    });

    $("#menuJoinForm").on("submit", function(e) {
        if (!menuJoinFormCheck()) e.preventDefault();
    });

    $("#btnZipcode").on("click", findZipcode);

    // ===== 2.2. 입력값 포맷팅 유틸 =====
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
				
    // ===== 2.3. 영양성분 검색 기능 =====
    const $btnSearch = $('#btnSearchNutrition');
    if ($btnSearch.length) {
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
            $('input[name="sugar"]').val(data.sugar || 0);
            $('input[name="sodium"]').val(data.sodium || 0);
            
            $selectedInfoDiv.text(`✅ ${$selectedItem.text()} 의 영양성분이 선택되었습니다.`).show();
            $resultsList.hide();
        });
    }
		
		// ## [배달 대행 호출] 페이지 전용 스크립트 (최종 완성본) ##
		const $dispatchMapContainer = $('#map');
		if ($dispatchMapContainer.length) {
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
		                currentSelectedOrderId = parseInt($clickedCard.data('orderId')); // 현재 선택된 주문 ID 업데이트
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

		            function formatTime(date) {
		                const hours = String(date.getHours()).padStart(2, '0');
		                const minutes = String(date.getMinutes()).padStart(2, '0');
		                return `${hours}:${minutes}`;
		            }

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
		            
		            $('#dispatchModal').on('show.bs.modal', function () {
		                updateDisplayTimes();
		            });

					$('#btnConfirmDispatch').on('click', function() {
					    // 1. 현재 선택된 주문 정보 가져오기
					    const selectedOrder = orderList.find(order => order.ono === currentSelectedOrderId);
					    if (!selectedOrder) {
					        alert("오류: 선택된 주문이 없습니다.");
					        return;
					    }
	
					    // 2. 모달에서 선택된 배달 정보 가져오기
					    const agency = $('#deliveryAgencySelect').val();
					    const pickupAfterMinutes = parseInt($('#pickupTimeSelect').val());
					    const deliveryAfterMinutes = parseInt($('#deliveryTimeSelect').val());
					    
					    const now = new Date();
					    const pickupTime = new Date(now.getTime() + pickupAfterMinutes * 60000);
					    const deliveryTime = new Date(now.getTime() + deliveryAfterMinutes * 60000);
					    const formatTime = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
	
					    // 3. URL 파라미터로 넘길 데이터 정리
					    const params = new URLSearchParams({
					        orderId: selectedOrder.ono,
					        shopName: shopInfo.name,
					        shopAddress: shopInfo.address1 + ' ' + shopInfo.address2,
					        shopPhone: shopInfo.phone,
					        customerAddress: selectedOrder.oaddress,
					        customerPhone: selectedOrder.clientPhone || '정보 없음',
					        pickupTime: `${pickupAfterMinutes}분 후 (${formatTime(pickupTime)})`,
					        deliveryTime: `${deliveryAfterMinutes}분 후 (${formatTime(deliveryTime)})`
					    });
	
					    // 4. 새 탭에서 라이더 페이지 열기
					    const riderUrl = `/rider/request?${params.toString()}`;
					    window.open(riderUrl, '_blank');
	
					    // 모달 닫기
					    const modal = bootstrap.Modal.getInstance(document.getElementById('dispatchModal'));
					    modal.hide();
					    
					    // (나중에) 좌측 목록에서 해당 주문을 제거하는 로직
					    $(`.order-card[data-order-id="${selectedOrder.ono}"]`).fadeOut();
					});
		        }
		    });
		}
		
});

// ==== 4. 카카오맵 표시 =====================================
// 폼 전용 지도 표시 함수
function showMap(address) {
    if (!(window.kakao && kakao.maps && kakao.maps.services)) return;
    var mapContainer = document.getElementById('shop-map');
    var mapOption = {
        center: new kakao.maps.LatLng(37.566826, 126.9786567),
        level: 3
    };
    var map = new kakao.maps.Map(mapContainer, mapOption);
    var geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, function(result, status) {
        if (status === kakao.maps.services.Status.OK) {
            var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            var marker = new kakao.maps.Marker({
                map: map,
                position: coords
            });
            map.setCenter(coords);
        }
    });
}

// 뷰 페이지 전용 지도 함수 (폼에서 사용하는 showMap과 이름 다름)
function shopViewShowMap(address) {
    /*
	alert("지도 함수 실행됨! 주소: " + address); // 진짜 함수 실행되는지 체크
    if (!(window.kakao && kakao.maps && kakao.maps.services)) {
        alert("카카오맵 라이브러리 없음");
        return;
    }*/
    var mapContainer = document.getElementById('shop-map');
    var mapOption = {
        center: new kakao.maps.LatLng(37.566826, 126.9786567),
        level: 3
    };
    var map = new kakao.maps.Map(mapContainer, mapOption);
    var geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, function(result, status) {
        console.log("addressSearch status:", status, result); // ★이 줄 중요!
        if (status === kakao.maps.services.Status.OK) {
            var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            var marker = new kakao.maps.Marker({
                map: map,
                position: coords
            });
            map.setCenter(coords);
        } else {
            alert("카카오맵 주소 검색 실패! status: " + status);
        }
    });
}

// 출력/뷰(shopBasicView) 페이지 전용 지도 표시 코드
$(function() {
    var $map = $("#shop-map");
    var $addr1 = $("#address1");
    var $addr2 = $("#address2");
    if ($map.length && $addr1.length && !$addr1.is("input")) {
        var addr = $addr1.text().trim();
        var addr2 = ($addr2.length && !$addr2.is("input")) ? $addr2.text().trim() : '';
        if (addr2) addr += " " + addr2;
        //console.log("지도에 넘기는 주소:", addr); // ★이 줄 추가
        setTimeout(function() {
            if (addr && window.kakao && kakao.maps) {
                shopViewShowMap(addr);
            } else {
                console.log("카카오맵 준비 안됨 또는 주소 없음");
            }
        }, 300);
    }
});

// 수정/입력(shopBasicSet) 폼 전용 지도 표시 코드
$(function() {
    // 1. 페이지 로드시 초기 지도 표시 (입력폼은 input이니까 .val())
    var addr = $("#address1").val() || "";
    var addr2 = $("#address2").val() || "";
    if (addr) showMap(addr + " " + addr2);

    // 2. 주소 입력/변경 시 지도 즉시 갱신
    $("#address1, #address2").on("input", function() {
        var a1 = $("#address1").val() || "";
        var a2 = $("#address2").val() || "";
        if (a1) showMap(a1 + " " + a2);
    });
});

// ==== 5. 헤더 알림 (새로고침·이동 시 sessionStorage 만으로 복구) ====
document.addEventListener('DOMContentLoaded', function() {
  // sessionStorage에 남아 있는 주문 ID 배열을 읽어서 바로 렌더
  const stored = JSON.parse(sessionStorage.getItem('pendingOrders') || '[]');
  renderPendingOrders(stored);
});

// ==== 6. 가게 상태 ON/OFF 토글 =============================
$(function() {
    $('#shopStat').on('change', function() {
        const $checkbox = $(this);
        const sId = $checkbox.data('sid');
        const isChecked = $checkbox.is(':checked');
        // AJAX로 상태 변경 요청
        $.post('/shop/statusUpdate', { sId: sId, status: isChecked ? 'Y' : 'N' })
            .done(function() {
                location.reload(); // 새로고침(동적으로 UI만 바꿔도 됨)
            })
            .fail(function() {
                alert('상태 변경에 실패했습니다.');
                // 실패 시 체크박스 원복
                $checkbox.prop('checked', !isChecked);
            });
    });
});

// ==== 7. 리뷰 답글 수정/삭제 모드 토글 =====================
// # 리뷰 답글 “수정/삭제” 바로가기 토글 & AJAX 처리
$(function () {
$('.reply-box')
  // [수정] 버튼 → 수정 모드로 전환
  .on('click', '.btn-edit', function() {
    const $box = $(this).closest('.reply-box');
    $box.find('.view-mode').addClass('d-none');
    $box.find('.edit-mode').removeClass('d-none');
  })
  // [취소] 버튼 → 원래 보기 모드로 복귀
  .on('click', '.btn-cancel', function() {
    const $box = $(this).closest('.reply-box');
    $box.find('.edit-mode').addClass('d-none');
    $box.find('.view-mode').removeClass('d-none');
  })
  // [저장] 버튼 → 서버에 수정 요청 (AJAX)
  .on('click', '.btn-save', function(e) {
    e.preventDefault();
    const $box = $(this).closest('.reply-box');
    const rrNo = $box.data('rrno');
    const sId  = $box.data('sid');
    const newContent = $box.find('.edit-input').val().trim();
    if (!newContent) {
      alert('내용을 입력해주세요.');
      return;
    }
    $.post('/shop/review/reply/update', {
      rrNo: rrNo,
      sId: sId,
      content: newContent
    }).done(function() {
      // 반영 후 UI 복구
      $box.find('.view-mode').text(newContent);
      $box.find('.edit-mode').addClass('d-none');
      $box.find('.view-mode').removeClass('d-none');
    }).fail(function() {
      alert('수정에 실패했습니다. 다시 시도해주세요.');
    });
  })
  // [삭제] 버튼 → 서버에 삭제 요청 (AJAX)
  .on('click', '.btn-delete', function(e) {
    e.preventDefault();
    if (!confirm('이 답글을 삭제하시겠습니까?')) return;
    const $box = $(this).closest('.reply-box');
    const rrNo = $box.data('rrno');
    const sId  = $box.data('sid');
    $.post('/shop/review/reply/delete', {
      rrNo: rrNo,
      sId: sId
    }).done(function() {
      $box.remove();
    }).fail(function() {
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    });
  });
});

// ==== 8. WebSocket 초기화 & 이벤트 처리 =================
// 페이지 로드 후 한 번만 실행됩니다.
document.addEventListener('DOMContentLoaded', () => {
  // 7.0: shopId 조회 (헤더 알림 컨테이너에서)
  const notifyContainer = document.getElementById('notifyContainer');
  if (!notifyContainer) return;
  const shopId = notifyContainer.dataset.shopId;

  // 8.1: SockJS & STOMP 클라이언트 생성
  const socket      = new SockJS('/ws');
  const stompClient = Stomp.over(socket);

  // 8.2: STOMP 연결 후 구독 시작
  stompClient.connect({}, () => {
    console.log('[shop.js] STOMP connected, shopId=', shopId);

	// 8.2.1: 신규 주문 알림 구독
	stompClient.subscribe(`/topic/newOrder/${shopId}`, msg => {
	  console.log('[WS 新주문 콜백]', msg, typeof msg.body, msg.body);
	  try {
	    const o = JSON.parse(msg.body);
	    console.log('[WS 新주문] 주문 객체:', o);
	  } catch(e) {
	    console.error('JSON parse error:', e, msg.body);
	  }

	  // 1) 헤더 알림 + 벨 아이콘 깜빡임 (모든 페이지 공통)
	  renderHeaderNotification(msg);
	  markBellAsUnread();

	  // 2) 신규 주문 리스트가 있는 페이지에서만 렌더링
	  if (document.getElementById('newOrderList')) {
	    renderNewOrderItem(msg);
	  }
	});

    // 8.2.2: 주문 상태 변경 구독 (헤더 알림 제거)
    stompClient.subscribe(`/topic/orderStatus/shop/${shopId}`, msg => {
      console.log('[WS 상태변경_헤더]', msg.body);
      const { oNo } = JSON.parse(msg.body);
      removeHeaderNotification(oNo);
    });

    // 8.2.3: 주문 상태 변경 구독 (테이블 업데이트)
    document.querySelectorAll('tr[data-order-no]').forEach(row => {
      const oNo = row.dataset.orderNo;
      stompClient.subscribe(`/topic/orderStatus/order/${oNo}`, msg => {
        console.log('[WS 상태변경_테이블]', msg.body);
        const { newStatus } = JSON.parse(msg.body);
        const cell = document.querySelector(`.status-cell[data-order-no="${oNo}"]`);
        if (cell) cell.textContent = newStatus;
      });
    });
  });
});

// ==== 9. 알림 아이콘 깜박임 제어 ===========================
//알림 아이콘 깜박임 시작
function markBellAsUnread() {
  const icon = document.getElementById('notifyIcon');
  if (icon) icon.classList.add('blink');
}

//알림 아이콘 깜박임 종료
function clearBellBlink() {
  const icon = document.getElementById('notifyIcon');
  if (icon) icon.classList.remove('blink');
}

<<<<<<< HEAD
// ==== 9. 주문 관리 함수 (수락 / 거절) =====================
// 주문 수락 함수
window.acceptOrder = function(oNo) {
  if (!confirm(`주문 #${oNo}을(를) 수락하시겠습니까?`)) return;

  fetch(`/shop/orderManage/${oNo}/status?newStatus=ACCEPTED`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
=======
// ==== 10. 주문 관리 함수 (수락 / 거절) =====================
// 주문 수락 함수 (기존)
window.acceptOrder = function(oNo) {
  fetch(`/shop/orderManage/${oNo}/status`, {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: 'newStatus=ACCEPTED'
  })
  .then(res => {
    if (!res.ok) throw new Error('상태 변경 실패');
    return res.json();
  })
  .then(data => {
    if (data.success) {
      // 바로 새 화면으로 이동
      location.href = '/shop/orderManage?status=ACCEPTED';
    } else {
      throw new Error('상태 변경 실패');
    }
>>>>>>> develop
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('주문이 수락되었습니다.');
      // 성공 시 진행중인 주문 관리 페이지로 이동하거나, 현재 페이지를 새로고침 할 수 있습니다.
      window.location.href = '/shop/orderManage?status=ACCEPTED';
    } else {
      alert('오류: ' + (data.message || '알 수 없는 오류로 주문 수락에 실패했습니다.'));
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('요청 중 오류가 발생했습니다.');
  });
};

// 주문 거절 함수 (환불 처리)
window.rejectOrder = function(oNo) {
<<<<<<< HEAD
  if (!confirm(`주문 #${oNo}을(를) 거절하고 환불 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

  fetch(`/shop/orderManage/${oNo}/status?newStatus=REJECTED`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('주문이 거절되고 환불 처리되었습니다.');
      window.location.reload(); // 성공 시 페이지를 새로고침하여 목록에서 제거
    } else {
      alert('오류: ' + (data.message || '알 수 없는 오류로 주문 거절에 실패했습니다.'));
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('요청 중 오류가 발생했습니다.');
  });
};
=======
  fetch(`/shop/orderManage/${oNo}/status`, {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: 'newStatus=REJECTED'
  })
  .then(res => {
    if (!res.ok) throw new Error('거절 실패');
    return res.json();
  })
  .then(data => {
      if (data.success) {
        // 개별 remove 없이 전체 화면 갱신
        location.href = '/shop/orderManage?status=PENDING';
      } else {
        throw new Error('거절 실패');
      }
    })
    .catch(() => alert('주문 거절에 실패했습니다.'));
  };
>>>>>>> develop

// ==== 11. 렌더링 헬퍼 =====================================
function renderNewOrderItem(msg) {
  const ul = document.getElementById('newOrderList');
  if (!ul) return;

  // placeholder 제거
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
      <button class="btn btn-success btn-sm mb-2" onclick="acceptOrder(${orderId})">수락</button>
      <button class="btn btn-outline-danger btn-sm" onclick="rejectOrder(${orderId})">거절</button>
    </div>
  `;
  ul.prepend(li);
}

function renderHeaderNotification(msg) {
  const data  = JSON.parse(msg.body);
  const badge = document.getElementById('header-notif-badge');
  const list  = document.getElementById('header-notif-list');

  // 뱃지 증가
  badge.textContent  = parseInt(badge.textContent || '0',10) + 1;
  badge.classList.remove('d-none');

  // “알림이 없습니다.” 제거
  list.querySelector('li.text-muted')?.remove();

  // 알림 아이템 생성
  const item = document.createElement('li');
  item.className       = 'notif-item';
  // ↓ JSON 필드명이 orderId 로 넘어오므로 oNo 대신 orderId 사용
  const id             = data.orderId;
  item.dataset.orderNo = id;

  // 링크 구성
  const a = document.createElement('a');
  a.className = 'dropdown-item text-truncate';
  a.href = `/shop/newOrders?sOrderNo=${id}`;
  a.textContent = `신규 주문이 도착했습니다.`;

  item.appendChild(a);

  // ↓ prepend → append 로 바꿔서 새 알림이 아래로 쌓이도록
  list.appendChild(item);
  
  // ▶ sessionStorage에도 추가
  const pending = JSON.parse(sessionStorage.getItem('pendingOrders') || '[]');
  pending.push(data.orderId);
  sessionStorage.setItem(
    'pendingOrders',
    JSON.stringify(Array.from(new Set(pending)))
  );
}

//헤더 알림에서 아이템 제거 함수
function removeHeaderNotification(oNo) {
  // (1) 화면에서 아이템 제거
  document.querySelector(
    `#header-notif-list .notif-item[data-order-no="${oNo}"]`
  )?.remove();

// (2) sessionStorage에서도 제거
const pending = JSON.parse(sessionStorage.getItem('pendingOrders') || '[]');
const filtered = pending.filter(id => id !== oNo);
sessionStorage.setItem('pendingOrders', JSON.stringify(filtered));

  // (3) 뱃지 숫자 업데이트
  const badge = document.getElementById('header-notif-badge');
  const cnt   = filtered.length;
  badge.textContent = cnt;
  if (cnt === 0) {
    badge.classList.add('d-none');
    clearBellBlink();
  }
}

  // ==== 12. 휴무/영업 버튼 ================
  // 휴무/영업 스위치
  const updateDayRow = ($chk) => {
    const $tr = $chk.closest("tr");
    const idx = $chk.attr("id")
      ? $chk.attr("id").replace("isOpen", "")
      : $chk.attr("name").match(/\[(\d+)\]/)[1];
    const $label = $("#openLabel" + idx);
    const on = $chk.is(":checked");

    // 값 전송은 그대로, UI만 막기
    $tr.find("select").toggleClass("disabled-look", !on);
    $tr.find(".allDay-check").prop("disabled", !on);

    $label
      .text(on ? "영업일" : "휴무일")
      .toggleClass("bg-success", on)
      .toggleClass("bg-secondary", !on);
  };

  $(".switch input[type='checkbox'][name^='isOpen']")
    .each(function () { updateDayRow($(this)); })
    .on("change", function () { updateDayRow($(this)); });

  // 혹시라도 다른 스크립트가 disabled 걸면 제출 전에 해제
  $("#openTimeForm").on("submit", function () {
    $(this).find("select:disabled").prop("disabled", false);
  });

  // ----- 영업시간 관리 (휴무/전체휴무 토글 등) -----
  $(function () {

    // 전체휴무 체크박스
    $(".allDay-check").on("change", function () {
      const $tr = $(this).closest("tr");
      if (this.checked) {
        $tr.find("select[name^='openHour']").val("00");
        $tr.find("select[name^='openMin']").val("00");
        $tr.find("select[name^='closeHour']").val("23");
        $tr.find("select[name^='closeMin']").val("59");
      }
      // disabled 절대 쓰지 않음
    });
});
// ==== 13. 주문 상세 페이지 픽업/배달 버튼 ================
// 픽업·배달 버튼 처리
document.addEventListener('DOMContentLoaded', () => {
  const btnPickup  = document.getElementById('btnPickup');
  const btnDeliver = document.getElementById('btnDeliver');

  if (btnPickup) {
    btnPickup.addEventListener('click', () => {
      updateStatus('IN_PROGRESS', () => {
        btnPickup.disabled  = true;
        btnDeliver.disabled = false;
      });
    });
  }

  if (btnDeliver) {
    btnDeliver.addEventListener('click', () => {
      updateStatus('COMPLETED', () => {
        window.location.href = '/shop/orderManage?status=PENDING';
      });
    });
  }

  function updateStatus(newStatus, cb) {
    // Thymeleaf 가 주입한 order.oNo 가 필요하므로 data-* 에 담아두면 좋습니다.
    const container = document.querySelector('[data-order-no]');
    const oNo       = container ? container.dataset.orderNo : 0;

    fetch(`/shop/order/${oNo}/status`, {
      method:  'POST',
      headers: { 'Content-Type':'application/x-www-form-urlencoded' },
      body:    'newStatus=' + newStatus
    })
    .then(r => r.json())
    .then(d => { if (d.success) cb(); });
  }
});

// ==== 14. 신규주문(#newOrderList) 전용: 클릭 & 최초 자동 표시 =====
if (document.getElementById('newOrderList')) {

  // 1) selectNewOrder 정의 (이전과 똑같습니다)
  function selectNewOrder(el) {
    // a) active 토글
    document.querySelectorAll('.order-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');

    // b) data-* 값 꺼내기
    const oNo        = el.dataset.orderNo;
    const regDate    = el.dataset.regdate;
    const totalPrice = el.dataset.totalprice;
    const oAddress   = el.dataset.oaddress;
    const menus      = el.dataset.menus;
    const request    = el.dataset.request;

    // c) 상세 패널 갱신
    const panel = document.querySelector('.order-detail-panel');
    if (!panel) return;
    panel.innerHTML = `
      <h4>신규 주문 #${oNo}</h4>
      <p><strong>주문일시:</strong> ${regDate}</p>
      <p><strong>총액:</strong> ${totalPrice}원</p>
      <p><strong>배달/픽업:</strong> ${oAddress ? '배달' : '픽업'}</p>
      ${oAddress ? `<p><strong>주소:</strong> ${oAddress}</p>` : ''}
      <p><strong>메뉴:</strong> ${menus || ''}</p>
      <p><strong>요청사항:</strong> ${request || '없음'}</p>
      <div class="mt-4">
        <button type="button" class="btn btn-success me-2" onclick="acceptOrder(${oNo})">수락</button>
        <button type="button" class="btn btn-outline-danger" onclick="rejectOrder(${oNo})">거절</button>
      </div>
    `;
  }

  // 2) DOMContentLoaded 에 실행: 
  //    - 모든 .order-card 에 클릭 바인딩
  //    - 첫 카드를 자동으로 보여주기
  document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.order-list .order-card');
    cards.forEach(card => {
      card.addEventListener('click', () => selectNewOrder(card));
    });
    if (cards.length) {
      selectNewOrder(cards[0]);
    }
  });

}

