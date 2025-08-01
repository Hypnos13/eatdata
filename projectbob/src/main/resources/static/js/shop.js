// ==== 1. Shop / Menu 가입 폼 검증 ============================
$(function() {
	
	$("#shopJoinForm").on("submit", shopJoinFormCheck);
	$("#menuJoinForm").on("submit", menuJoinFormCheck);

	//우편번호찾기
	$("#btnZipcode").click(findZipcode);
	
});

function shopJoinFormCheck(isShopJoinForm) {
	if($("#sNumber").val().length != 10 ) {
		alert("사업자 등록번호는 10자리입니다.")
		$("#sNumber").focus();
		return false;
	}
	/*if(isShopJoinForm && $("#isSNumCheck").val() == 'false') {
		alert("사업자번호 체크를 해주세요");
		return false;
	}*/
	if($("#owner").val().length ==0 ) {
		alert("대표자 명을 입력해주세요.")
		return false;
	}
	const rawPhoneNumber = $("#phone").val();
	if (rawPhoneNumber.length !== 13) {
		alert("연락처는 '-'을 포함하여 13자리를 입력해주세요.");
		$("#phone").focus();
		return false;
	}
	if($("#name").val().length ==0 ) {
		alert("가게 이름을 입력해주세요.")
		return false;
	}
	if($("#zipcode").val().length ==0 ) {
		alert("우편번호를 입력해주세요.")
		return false;
	}
	if($("#address2").val().length ==0 ) {
		alert("상세주소를 입력해주세요.")
		return false;
	}
}

function menuJoinFormCheck() {
	if($("#category").val().length ==0 ) {
		alert("카테고리를 입력해주세요.")
		return false;
	}
	if($("#name").val().length ==0 ) {
		alert("메뉴 이름을 입력해주세요.")
		return false;
	}
	if($("#price").val().length ==0 ) {
		alert("가격을 입력해주세요.")
		return false;
	}
	if($("#mInfo").val().length ==0 ) {
		alert("메뉴 설명을 입력해주세요.")
		return false;
	}
}

// ==== 2. 입력값 포맷팅 유틸 ================================
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== 1. 입력 시 하이픈(-) 자동 생성 기능 =====
    const sNumberInputForFormatting = document.getElementById('sNumber');
    if (sNumberInputForFormatting) {
        sNumberInputForFormatting.addEventListener('input', function(event) {
            let value = event.target.value.replace(/[^0-9]/g, '');
            if (value.length > 10) {
                value = value.substring(0, 10);
            }

            let formattedValue = '';
            if (value.length < 4) {
                formattedValue = value;
            } else if (value.length < 6) {
                formattedValue = value.substring(0, 3) + '-' + value.substring(3);
            } else {
                formattedValue = value.substring(0, 3) + '-' + value.substring(3, 5) + '-' + value.substring(5);
            }
            event.target.value = formattedValue;
        });
    }

    // ===== 2. 폼 제출 시 하이픈(-) 제거 기능 (새로 추가된 부분) =====
    const shopJoinForm = document.getElementById('shopJoinForm');
    if (shopJoinForm) {
        shopJoinForm.addEventListener('submit', function(event) {
            event.preventDefault(); // 폼 자동 전송 중단

            const sNumberInput = document.getElementById('sNumber');
            // 사업자등록번호 값에서 하이픈 제거
            sNumberInput.value = sNumberInput.value.replace(/-/g, '');

            // 다른 전화번호 필드 등도 숫자만 보내고 싶다면 아래처럼 추가 가능
            // const phoneInput = document.getElementById('phone');
            // phoneInput.value = phoneInput.value.replace(/-/g, '');

            this.submit(); // 정리된 값으로 폼 전송
        });
    }
		
		// 폰번호 포맷팅
		const phoneNumberInput = document.getElementById('phone');

		    if (phoneNumberInput) { // 요소가 존재하는지 확인
		        phoneNumberInput.addEventListener('input', function(event) {
		            let value = event.target.value.replace(/[^0-9]/g, ''); // 숫자 이외의 문자 제거

		            if (value.length > 11) {
		                value = value.substring(0, 11); // 11자리 초과 시 잘라냄
		            }

		            let formattedValue = '';
		            if (value.length < 4) {
		                formattedValue = value;
		            } else if (value.length < 8) {
		                formattedValue = value.substring(0, 3) + '-' + value.substring(3);
		            } else {
		                formattedValue = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7);
		            }

		            event.target.value = formattedValue;
		        });
		    }
				
		// ==== 3. 영양성분 검색 =====================================
		const btnSearch = document.getElementById('btnSearchNutrition');
		const menuNameInput = document.getElementById('name');
		const resultsList = document.getElementById('nutrition-results');
		const selectedInfoDiv = document.getElementById('selected-nutrition-info');

		if (btnSearch) {
		    // '영양성분 검색' 버튼 클릭 이벤트
		    btnSearch.addEventListener('click', async function() {
		        const foodName = menuNameInput.value;
		        if (!foodName) {
		            alert('메뉴 이름을 먼저 입력해주세요.');
		            return;
		        }

		        try {
		            const response = await fetch(`/api/nutrition-search?foodName=${encodeURIComponent(foodName)}`);
		            const resultStr = await response.text();
		            const result = JSON.parse(resultStr);
		            
		            resultsList.innerHTML = ''; // 이전 결과 초기화
		            
		            if (result.body && result.body.items && result.body.items.length > 0) {
		                resultsList.style.display = 'block';
		                result.body.items.forEach(item => {
		                    const li = document.createElement('li');
		                    li.className = 'list-group-item list-group-item-action';
		                    li.style.cursor = 'pointer';
		                    li.textContent = `${item.FOOD_NM_KR} (1회 제공량: ${item.SERVING_SIZE}, 열량: ${item.AMT_NUM1}kcal)`;
		                    
												li.dataset.servingSize = item.SERVING_SIZE.replace(/[^0-9.]/g, '');
		                    li.dataset.calories = item.AMT_NUM1;
		                    li.dataset.carbs = item.AMT_NUM6;
		                    li.dataset.protein = item.AMT_NUM3;
		                    li.dataset.fat = item.AMT_NUM4;
												li.dataset.sfa = item.AMT_NUM24;
												li.dataset.sugar = item.AMT_NUM7;
		                    li.dataset.sodium = item.AMT_NUM13;
		                    
		                    resultsList.appendChild(li);
		                });
		            } else {
		                resultsList.innerHTML = '<li class="list-group-item">검색 결과가 없습니다.</li>';
		                resultsList.style.display = 'block';
		            }
		        } catch (error) {
		            console.error('Error fetching nutrition data:', error);
		            alert('영양 정보를 불러오는 데 실패했습니다.');
		        }
		    });
		    
		    // 검색 결과 리스트에서 항목을 클릭했을 때의 동작
		    resultsList.addEventListener('click', function(e) {
		        // 클릭된 요소가 LI 태그일 때만 실행
		        if (e.target && e.target.nodeName === 'LI') {
		            const selectedItem = e.target;
		            const { servingSize, calories, carbs, protein, fat, sfa, sugar, sodium } = selectedItem.dataset;

		            // form 안에 있는 hidden input들을 찾아서 값을 채워줍니다.
		            document.querySelector('input[name="servingSize"]').value = servingSize || 0;
		            document.querySelector('input[name="calories"]').value = calories || 0;
		            document.querySelector('input[name="carbs"]').value = carbs || 0;
		            document.querySelector('input[name="protein"]').value = protein || 0;
		            document.querySelector('input[name="fat"]').value = fat || 0;
								document.querySelector('input[name="sfa"]').value = sfa || 0;
								document.querySelector('input[name="sugar"]').value = sugar || 0;
		            document.querySelector('input[name="sodium"]').value = sodium || 0;
		            
		            selectedInfoDiv.textContent = `✅ ${selectedItem.textContent} 의 영양성분이 선택되었습니다.`;
		            selectedInfoDiv.style.display = 'block';
		            
		            resultsList.style.display = 'none';
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

// ==== 7. WebSocket 초기화 & 이벤트 처리 ==================  
// 알림버튼 깜박임 기능
document.addEventListener('DOMContentLoaded', () => {
  const socket = new SockJS('/ws');
  const stomp  = Stomp.over(socket);

  stomp.connect({}, () => {
    // 1) 신규주문 구독
    const newOrderList = document.getElementById('newOrderList');
    if (newOrderList) {
      const shopId = newOrderList.dataset.shopId;
      stomp.subscribe('/topic/newOrder/' + shopId, renderNewOrderItem);
    }

    // 2) 헤더 알림용 주문 상태 변경 구독
	const notifyContainer = document.getElementById('notifyContainer');
	if (notifyContainer) {
	  const shopId = notifyContainer.dataset.shopId;
	  stomp.subscribe(`/topic/orderStatus/shop/${shopId}`, msg => {
	    const { oNo } = JSON.parse(msg.body);
	    // 헤더 알림에서 해당 주문 제거 (뱃지 카운트도 갱신)
	    removeHeaderNotification(oNo);
	  });
	}
	
	// 3) 주문내역 테이블용 주문 상태 변경 구독
	document.querySelectorAll('tr[data-order-no]').forEach(row => {
	  const oNo = row.dataset.orderNo;
	  stomp.subscribe(`/topic/orderStatus/order/${oNo}`, msg => {
	    const { newStatus } = JSON.parse(msg.body);
	    const cell = document.querySelector(`.status-cell[data-order-no="${oNo}"]`);
	    if (cell) cell.textContent = newStatus;
	  });
	});
	
	// 드롭다운이 “완전히 열린(shown)” 시점에 깜박임 제거
	  const notifyBtn = document.getElementById('headerNotifyBtn');
	  if (notifyBtn) {
	    notifyBtn.addEventListener('shown.bs.dropdown', () => {
	      clearBellBlink();
	      // (선택) 서버에 읽음 처리 API 호출 등 추가 가능
	    });
	  }
   });
});

// ==== 8. 알림 아이콘 깜박임 제어 ===========================
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

// ==== 9. 주문 관리 함수 (수락 / 거절) =====================
// 주문 수락 함수 (기존)
window.acceptOrder = function(oNo) {
  fetch(`/shop/orderManage/${oNo}/status`, {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: 'newStatus=ACCEPTED'
  })
  .then(res => {
    if (!res.ok) throw new Error('상태 변경 실패');
    // ① 목록에서 해당 주문 항목(li) 제거
    const btn = document.querySelector(`button[onclick="acceptOrder(${oNo})"]`);
    if (btn) btn.closest('li').remove();
    // ② 진행 중 화면으로 이동
    location.href = '/shop/orderManage?status=IN_PROGRESS';
  })
  .catch(err => {
    console.error(err);
    alert('주문 수락에 실패했습니다.');
  });
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
    // 거절된 주문 li 제거
    const btn = document.querySelector(`button[onclick="rejectOrder(${oNo})"]`);
    if (btn) btn.closest('li').remove();
  })
  .catch(() => alert('주문 거절에 실패했습니다.'));
};

// ==== 10. 렌더링 헬퍼 =====================================
function renderNewOrderItem(msg) {
  const o = JSON.parse(msg.body);
  const ul = document.getElementById('newOrderList');
  const li = document.createElement('li');
  li.className = 'list-group-item d-flex align-items-start mb-3 p-3';

  li.innerHTML = `
    <div class="flex-grow-1 pe-3">
      <div class="mb-1">🛒 ${o.menus}</div>
      <div class="mb-1">💬 ${o.request || '요청사항 없음'}</div>
      <div class="text-muted small"><i class="bi bi-clock"></i>
        ${new Date(o.regDate).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
      </div>
    </div>
    <div class="d-flex flex-column justify-content-between" style="min-width: 5rem;">
      <button class="btn btn-success btn-sm mb-2" onclick="acceptOrder(${o.oNo})">수락</button>
      <button class="btn btn-outline-danger btn-sm" onclick="rejectOrder(${o.oNo})">거절</button>
    </div>
  `;

  ul.prepend(li);
}

function renderHeaderNotification(msg) {
  const data = JSON.parse(msg.body);
  const badge = document.getElementById('headerNotifyBadge');
  const list  = document.getElementById('headerNotifyList');
  // 뱃지 카운트 증가
  let cnt = parseInt(badge.textContent) || 0;
  badge.textContent = ++cnt;
  badge.classList.remove('d-none');
  // 알림 리스트에 항목 추가
  if (cnt === 1 && list.firstElementChild.tagName === 'P') {
    list.innerHTML = '';  // “알림이 없습니다.” 문구 제거
  }
  const item = document.createElement('li');
  item.innerHTML = `
    <a class="dropdown-item text-truncate"
       href="/shop/orderDetail?oNo=${data.oNo}">
      새 주문 알림이 도착했습니다.
    </a>
  `;
  list.prepend(item);
}

//헤더 알림에서 아이템 제거 함수
function removeHeaderNotification(oNo) {
  // 1) 드롭다운 아이템 제거
  const notifItem = document.querySelector(`#header-notif-list .notif-item[data-order-no="${oNo}"]`);
  if (notifItem) notifItem.remove();

  // 2) 뱃지 카운트 감소
  const badge = document.querySelector('#header-notif-badge');
  let count = parseInt(badge.textContent, 10) || 0;
  if (count > 0) badge.textContent = --count;

  // 3) (선택) 뱃지가 0이면 숨기기
  if (count === 0) badge.classList.add('d-none');
}

// ==== 11. 주문내역 페이지 실시간 업데이트 ================
// shopOrders.html 전용: 주문 상태 실시간 업데이트
document.addEventListener('DOMContentLoaded', () => {
  // 주문내역 테이블이 없으면 바로 종료
  const rows = document.querySelectorAll('tr[data-order-no]');
  if (rows.length === 0) return;

  const socket = new SockJS('/ws');
  const stomp  = Stomp.over(socket);

  stomp.connect({}, () => {
    rows.forEach(row => {
      const oNo = row.dataset.orderNo;
      stomp.subscribe(`/topic/orderStatus/order/${oNo}`, msg => {
        const { newStatus } = JSON.parse(msg.body);
        const cell = document.querySelector(`.status-cell[data-order-no="${oNo}"]`);
        if (cell) {
          cell.textContent = newStatus;
        }
      });
    });
  });
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
});

document.querySelectorAll('tr[data-order-no]').forEach(row => {
  const oNo = row.dataset.orderNo;
  stompClient.subscribe(`/topic/orderStatus/${oNo}`, msg => {
  	const { oNo: incomingONo, newStatus } = JSON.parse(msg.body);
    // (a) 주문내역 테이블이 보이는 페이지라면 상태 셀 업데이트
	const cell = document.querySelector(`.status-cell[data-order-no="${incomingONo}"]`);
	    if (cell) {
	      cell.textContent = newStatus;
	    }
    // (b) 헤더 알림에서 해당 주문 항목 제거
    removeHeaderNotification(incomingONo);
  });
});

// ==== 12. 주문 상세 페이지 픽업/배달 버튼 ================
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

    fetch(`/shop/orderManage/${oNo}/status`, {
      method:  'POST',
      headers: { 'Content-Type':'application/x-www-form-urlencoded' },
      body:    'newStatus=' + newStatus
    })
    .then(r => r.json())
    .then(d => { if (d.success) cb(); });
  }
});
