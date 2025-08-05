<<<<<<< HEAD
// ==== 0. 벨 아이콘 깜빡임 제어 ========================
function markBellAsUnread() {
  const icon = document.getElementById('notifyIcon');
  if (icon && !icon.classList.contains('blink')) {
    icon.classList.add('blink');
  }
}
function clearBellBlink() {
  const icon = document.getElementById('notifyIcon');
  if (icon && icon.classList.contains('blink')) {
    icon.classList.remove('blink');
  }
}

// ==== 1. 주문 상세 토글 & 아이콘 변경 ================
function toggleDetail(oNo) {
  const detail = document.getElementById(`detail-${oNo}`);
  const btn    = document.querySelector(`button[aria-controls="detail-${oNo}"]`);
  if (!detail || !btn) return;
  const icon      = btn.querySelector('i');
  const isOpening = detail.classList.toggle('d-none') === false;
  btn.setAttribute('aria-expanded', isOpening);
  icon.classList.toggle('bi-chevron-down', !isOpening);
  icon.classList.toggle('bi-chevron-up',   isOpening);
}

// ==== 2. 벨 깜빡임 재시작 ============================
document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('header-notif-badge');
  if (badge && +badge.textContent > 0) {
    markBellAsUnread();
  }
});

// ==== 3. WebSocket 초기화 & 이벤트 처리 ==============
=======
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

// ==== 5. 가게 상태 ON/OFF 토글 =============================
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

// ==== 6. 리뷰 답글 수정/삭제 모드 토글 =====================
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

// ==== 7. WebSocket 초기화 & 이벤트 처리 =================
// 페이지 로드 후 한 번만 실행됩니다.
>>>>>>> develop
document.addEventListener('DOMContentLoaded', () => {
  const notifyContainer = document.getElementById('notifyContainer');
  if (!notifyContainer) return;
  const shopId = notifyContainer.dataset.shopId;

  const socket      = new SockJS('/ws');
  const stompClient = Stomp.over(socket);

  stompClient.connect({}, () => {
    // ─── 3.1 신규 주문 알림 구독 ─────────────────────────
    stompClient.subscribe(`/topic/newOrder/${shopId}`, msg => {
      renderHeaderNotification(msg);
      markBellAsUnread();
    });

    // ─── 3.2 주문 상태 변경(헤더) ────────────────────────
    stompClient.subscribe(`/topic/orderStatus/shop/${shopId}`, msg => {
      const { oNo } = JSON.parse(msg.body);
      removeHeaderNotification(oNo);
    });

    // ─── 3.3 주문 상태 변경(테이블) ──────────────────────
    document.querySelectorAll('tr[data-order-no]').forEach(row => {
      const oNo = row.dataset.orderNo;
      stompClient.subscribe(`/topic/orderStatus/order/${oNo}`, msg => {
        const { newStatus } = JSON.parse(msg.body);
        const cell = document.querySelector(`.status-cell[data-order-no="${oNo}"]`);
        if (cell) cell.textContent = newStatus;
      });
    });
  });
});

// ==== 4. 헤더 알림 추가/제거 헬퍼 ======================
function renderHeaderNotification(msg) {
  const data  = JSON.parse(msg.body);
  const badge = document.getElementById('header-notif-badge');
  const list  = document.getElementById('header-notif-list');
  if (!badge || !list) return;

  // 배지 업데이트
  badge.textContent = String((parseInt(badge.textContent,10)||0) + 1);
  badge.classList.remove('d-none');
  list.querySelector('li.text-muted')?.remove();

  // 새 알림 아이템 생성
  const item = document.createElement('li');
  item.className       = 'notif-item d-flex justify-content-between align-items-center';
  item.dataset.orderNo = data.oNo;
  item.innerHTML = `
    <a class="dropdown-item flex-grow-1 text-truncate"
       href="/shop/orderManage?status=PENDING">
      새 주문이 도착했습니다.
    </a>
  `;
  list.prepend(item);
}

function removeHeaderNotification(oNo) {
  document
    .querySelector(`#header-notif-list .notif-item[data-order-no="${oNo}"]`)
    ?.remove();

  const badge = document.getElementById('header-notif-badge');
  if (!badge) return;
  const cnt = Math.max(0, parseInt(badge.textContent||'0', 10) - 1);
  badge.textContent = cnt;

  if (cnt === 0) {
    badge.classList.add('d-none');
    clearBellBlink();
  }
}

// ==== 5. 주문 관리 함수 (수락 / 거절) ================
window.acceptOrder = oNo => {
  fetch(`/shop/orderManage/${oNo}/status`, {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: 'newStatus=ACCEPTED'
  }).then(r => {
    if (!r.ok) throw new Error();
    document.querySelector(`li[data-order-no="${oNo}"]`)?.remove();
    location.href = '/shop/orderManage?status=IN_PROGRESS';
  }).catch(() => alert('수락 실패'));
};

window.rejectOrder = oNo => {
  fetch(`/shop/orderManage/${oNo}/status`, {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: 'newStatus=REJECTED'
  })
  .then(r => {
    if (!r.ok) throw new Error();
    document.querySelector(`li[data-order-no="${oNo}"]`)?.remove();
    location.href = '/shop/orderManage?status=PENDING';
  })
  .catch(() => alert('거절 실패'));
};

// ==== 6. 신규주문 리스트에 항목 추가 (타이머 제거) ======
function renderNewOrderItem(msg) {
  const o = JSON.parse(msg.body);
  const ul = document.getElementById('newOrderList');
  ul.querySelector('li.text-center.text-muted')?.remove();

  const li = document.createElement('li');
  li.className       = 'list-group-item d-flex align-items-start mb-3 p-3 notif-item';
  li.dataset.orderNo = o.oNo;
  li.innerHTML = `
    <div class="flex-grow-1 pe-3">
      <div class="mb-1">🛒 ${o.menus}</div>
      <div class="mb-1">💬 ${o.request || '요청사항 없음'}</div>
      <div class="text-muted small">
        <i class="bi bi-clock"></i> ${new Date().toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })}
      </div>
    </div>
    <div class="d-flex flex-column justify-content-between" style="min-width:5rem;">
      <button class="btn btn-success btn-sm mb-2" onclick="acceptOrder(${o.oNo})">수락</button>
      <button class="btn btn-outline-danger btn-sm" onclick="rejectOrder(${o.oNo})">거절</button>
    </div>
  `;
  ul.prepend(li);
}

// ==== 7. 휴무/영업 버튼 ================================
const updateDayRow = ($chk) => {
  const $tr = $chk.closest("tr");
  const idx = $chk.attr("id")
    ? $chk.attr("id").replace("isOpen", "")
    : $chk.attr("name").match(/\[(\d+)\]/)[1];
  const $label = $("#openLabel" + idx);
  const on = $chk.is(":checked");

  $tr.find("select").toggleClass("disabled-look", !on);
  $tr.find(".allDay-check").prop("disabled", !on);

  $label
    .text(on ? "영업일" : "휴무일")
    .toggleClass("bg-success", on)
    .toggleClass("bg-secondary", !on);
};

$(".switch input[type='checkbox'][name^='isOpen']")
  .each(function () { updateDayRow($(this)); })
  .on("change",   function () { updateDayRow($(this)); });

$("#openTimeForm").on("submit", function () {
  $(this).find("select:disabled").prop("disabled", false);
});

// ==== 8. 주문 상세 페이지 픽업/배달 버튼 ===============
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
    const container = document.querySelector('[data-order-no]');
    const oNo       = container ? container.dataset.orderNo : 0;
    fetch(`/shop/orderManage/${oNo}/status`, {
      method:  'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body:    'newStatus=' + newStatus
    })
    .then(r => r.json())
    .then(d => { if (d.success) cb(); });
  }
});
