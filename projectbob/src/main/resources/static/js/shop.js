/*
// ==== 알림 렌더링 헬퍼 함수 ====
// 기존 리스트를 완전히 지우는 함수
function clearHeaderList() {
  document.getElementById('header-notif-list').innerHTML = '';
}

// 주문 ID 배열을 받아서 헤더 알림(뱃지 + 리스트)을 그려주는 함수
/**
 * PENDING 주문 ID 배열을 받아 헤더 알림 UI(뱃지, 드롭다운 목록)를 렌더링합니다.
 * @param {number[]} orderIds PENDING 상태인 주문 ID 배열
 
function renderPendingOrders(orderIds) {
  // 1. 헤더에서 알림 뱃지와 리스트 요소를 찾습니다.
  const badge = document.getElementById('header-notif-badge');
  const ul    = document.getElementById('header-notif-list');

  // 2. (핵심 수정사항) 뱃지(badge)나 리스트(ul)가 존재하는지 먼저 확인합니다.
  //    로그아웃 상태에서는 이 요소들이 없으므로(null), 오류를 방지하기 위해 함수를 즉시 종료합니다.
  if (!badge || !ul) {
    return; 
  }

  // 3. 요소가 존재할 경우에만 아래의 UI 업데이트 로직을 실행합니다.
  badge.textContent = orderIds.length;
  if (orderIds.length > 0) {
    badge.classList.remove('d-none');
    clearHeaderList();
    ul.innerHTML = '<li><h6 class="dropdown-header">새로운 알림</h6></li>';
    orderIds.forEach(oNo => {
      const li = document.createElement('li');
      // 다른 함수들과의 일관성을 위해 클래스명을 'notif-item'으로 통일합니다.
      li.className = 'notif-item'; 
      li.dataset.orderNo = oNo;

      const a = document.createElement('a');
      a.className = 'dropdown-item text-truncate';
      a.href = `/shop/newOrders?sOrderNo=${oNo}`;
      // 사용자가 어떤 주문인지 알 수 있도록 주문 번호를 텍스트에 추가합니다.
      a.textContent = `🚨 신규 주문이 도착했습니다. (#${oNo})`;

      li.appendChild(a);
      ul.appendChild(li);
    });
    markBellAsUnread();
  } else {
    badge.classList.add('d-none');
    clearBellBlink();
    // "알림 없음" 메시지를 좀 더 보기 좋게 수정합니다.
    ul.innerHTML = '<li><p class="text-center text-muted my-2 mb-0">새로운 알림이 없습니다.</p></li>';
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
	
	if ($("#sNumber").val().replace(/-/g, '').length !== 10) {
		alert("사업자 등록번호는 10자리입니다.");
		$("#sNumber").focus();
		return false;
	}
	if ($("#owner").val().length == 0) {
		alert("대표자 명을 입력해주세요.");
		return false;
	}
	const rawPhoneNumber = $("#phone").val();
	if (rawPhoneNumber.length !== 13) {
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
    return true; // 모든 검증 통과 시 true 반환
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
    return true; // 모든 검증 통과 시 true 반환
}


// ==== 2. jQuery Document Ready - 모든 이벤트 리스너 및 기능 실행 ====
$(function() {

    // ===== 2.1. 폼 검증 및 공통 이벤트 바인딩 =====
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
								
								$('#btnConfirmDispatch').on('click', async function() {
								    const selectedOrder = orderList.find(order => order.ono === currentSelectedOrderId);
								    if (!selectedOrder) {
								        alert("오류: 선택된 주문을 없습니다.");
								        return;
								    }

								    // 1. 모달에서 선택된 배달 정보 가져오기
								    const agency = $('#deliveryAgencySelect').val();
								    const pickupAfterMinutes = parseInt($('#pickupTimeSelect').val());
								    const deliveryAfterMinutes = parseInt($('#deliveryTimeSelect').val());
								    
								    const now = new Date();
								    const formatTime = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
								    const pickupTime = new Date(now.getTime() + pickupAfterMinutes * 60000);
								    const deliveryTime = new Date(now.getTime() + deliveryAfterMinutes * 60000);
								    
								    const pickupTimeStr = `${pickupAfterMinutes}분 후 (${formatTime(pickupTime)})`;
								    const deliveryTimeStr = `${deliveryAfterMinutes}분 후 (${formatTime(deliveryTime)})`;

								    // 2. 서버에 보낼 데이터 (Request Body)
								    const dispatchDataForServer = {
								        agency: agency,
								        pickupTime: pickupTimeStr,
								        deliveryTime: deliveryTimeStr
								    };

								    try {
								        // ✨✨✨ 3. 서버에 배차 요청을 보내는 HTTP POST 요청 (fetch) ✨✨✨
								        const response = await fetch(`/shop/orders/${selectedOrder.ono}/dispatch`, {
								            method: 'POST',
								            headers: { 'Content-Type': 'application/json' },
								            body: JSON.stringify(dispatchDataForServer)
								        });

								        if (!response.ok) {
								            throw new Error('서버에 배차 요청을 보내는 데 실패했습니다.');
								        }

								        const result = await response.json();

								        if (result.success) {
								            alert(`주문번호 ${selectedOrder.ono}에 대한 배차를 요청했습니다.`);
														// 모달 닫기 및 UI 업데이트
								            const modal = bootstrap.Modal.getInstance(document.getElementById('dispatchModal'));
								            modal.hide();
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
    }
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

// ================================================================
// SECTION: 최종 WebSocket 초기화 및 이벤트 처리 로직
// - 페이지 로드 완료 후, 안정적인 시점에 웹소켓 연결을 설정합니다.
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 페이지의 다른 스크립트가 모두 준비될 시간을 벌기 위해 0.15초 지연 실행
    setTimeout(() => {
        const notifyContainer = document.getElementById('notifyContainer');
        // notifyContainer가 없는 페이지(예: 로그인 페이지)에서는 웹소켓을 연결하지 않습니다.
        if (!notifyContainer) {
            return; 
        }

        const shopId = notifyContainer.dataset.shopId;
        if (!shopId) {
            console.error('[WebSocket] 가게 ID(shopId)를 찾을 수 없어 연결을 시작할 수 없습니다.');
            return;
        }

        const socket = new SockJS('/ws');
        const stompClient = Stomp.over(socket);
        stompClient.debug = null; // 콘솔에 STOMP 상세 로그를 출력하지 않음

        stompClient.connect({}, () => {
            console.log(`[WebSocket] STOMP 연결 성공 (가게 ID: ${shopId})`);

            // 구독 1: 신규 주문 알림 채널 (`/topic/newOrder/{shopId}`)
            stompClient.subscribe(`/topic/newOrder/${shopId}`, (msg) => {
                console.log('[WS] 신규 주문 수신:', msg.body);
                renderHeaderNotification(msg);
                markBellAsUnread();
                if (window.location.pathname.includes('/shop/newOrders')) {
                    location.reload();
                }
            });

            // 구독 2: 주문 상태 변경 알림 채널 (`/topic/orderStatus/shop/{shopId}`)
            stompClient.subscribe(`/topic/orderStatus/shop/${shopId}`, (msg) => {
                console.log('[WS] 주문 상태 변경 수신:', msg.body);
                const payload = JSON.parse(msg.body);
                
                // 2-1. 헤더 알림 UI 업데이트
                const badge = document.getElementById('header-notif-badge');
                if (badge) {
                    badge.textContent = payload.newPendingCount;
                    if (payload.newPendingCount > 0) {
                        badge.classList.remove('d-none');
                    } else {
                        badge.classList.add('d-none');
                        clearBellBlink();
                    }
                }
                const notifItem = document.querySelector(`#header-notif-list .notif-item[data-order-no="${payload.oNo}"]`);
                if (notifItem) {
                    notifItem.remove();
                }

                // 2-2. 주문 관리 페이지에 있을 경우, 실시간 처리
                if (window.location.pathname.includes('/shop/orderManage')) {
                    if (payload.newStatus === 'DISPATCHED') {
                        markBellAsUnread();
                        alert('라이더 배차가 완료되었습니다!');
                        location.reload();
                    }
                }
            });

        }); // connect callback 끝
    }, 150); // 0.15초 지연
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
  })
  .catch(() => alert('주문 수락에 실패했습니다.'));
};

// 주문 거절 함수 (추가)
window.rejectOrder = function(oNo) {
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
*/