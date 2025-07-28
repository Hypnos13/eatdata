let selectedMenuId = null;
let selectedMenuName = '';
let selectedMenuPrice = 0;
let selectedShopId = null;
let currentQuantity = 1; // 'count' 대신 'currentQuantity'로 변수명 변경 (혼동 방지)
window.currentUserId = null;  // 로그인 시 서버에서 주입 (예: Thymeleaf)
window.currentGuestId = null; // 서버에서 발급받아 세션에 있으면 가져옴
let currentCartData = []; 
let currentTotalPrice = 0;
let currentTotalQuantity = 0;

const defaultMenuImage = "https://i.imgur.com/Sg4b61a.png";

$('#btnOrderNow').on('click', function() {

    // 서버로 보낼 주문 데이터 객체 구성
    const orderData = {
        cartList: currentCartData,       // 현재 장바구니의 모든 아이템 상세 정보
        totalPrice: currentTotalPrice,   // 장바구니 총 가격
        totalQuantity: currentTotalQuantity, // 장바구니 총 수량 (메인 메뉴 기준)
        userId: window.currentUserId,    // 전역 변수 userId 사용
        guestId: window.currentGuestId,  // 전역 변수 guestId 사용
        // shopId는 장바구니 아이템이 하나라도 있다면 첫 번째 아이템의 sId를 사용
        shopId: currentCartData[0] ? currentCartData[0].sId : null
    };

    // AJAX POST 요청으로 서버에 데이터 전송
    $.ajax({
        url: '/payjs', // POST 요청을 보낼 URL
        type: 'POST', // POST 메소드 사용
        contentType: 'application/json', // JSON 형식으로 데이터 전송
        data: JSON.stringify(orderData), // JavaScript 객체를 JSON 문자열로 변환
        success: function(response, textStatus, xhr) {
            // 서버가 HTML 페이지를 반환할 것으로 예상됩니다.
            // 받은 HTML을 현재 페이지의 body에 덮어씌우는 방식으로 처리합니다.
            document.open();
            document.write(response);
            document.close();
        },
        error: function(xhr, status, error) {
            // AJAX 요청 자체에서 오류가 발생한 경우 (네트워크 문제, 서버 응답 없음 등)
            console.error("주문 처리 AJAX 오류:", status, error, xhr.responseText);
            alert('주문 처리 중 서버 통신 오류가 발생했습니다.');
        }
    });
});

// ==============================
// 메뉴카드 클릭 시 모달창 열기 및 옵션 로드
// ==============================
$(document).on("click", ".menu-card", function () {
  selectedMenuId = parseInt($(this).data("id"));
  selectedMenuName = $(this).data("name");
  selectedMenuPrice = parseInt($(this).data("price"));
  selectedShopId = parseInt($(this).data("shop-id"));
  const menuImage = $(this).find("img").attr("src") || defaultMenuImage;
  const menuInfo = $(this).data("info"); // 메뉴 상세 정보 추가

  $("#modalMenuName").text(selectedMenuName);
  $("#modalMenuPrice").text(`${selectedMenuPrice.toLocaleString()}원`);
  $("#modalMenuImage").attr("src", menuImage);
  $("#modalMenuInfo").text(menuInfo); // 메뉴 상세 정보 표시

  currentQuantity = 1; // 모달 열릴 때 수량 초기화
  $("#modalCount").val(currentQuantity);
  $("#optionArea").empty(); // 옵션 영역 초기화

  // 메뉴 옵션 비동기 로드
  $.ajax({
    url: "/ajax/menu/options", // 이 URL은 해당 메뉴의 옵션을 반환해야 합니다.
    data: { mId: selectedMenuId },
    success: function (options) {
      if (options && options.length > 0) {
        const html = options.map(option => `
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="option-${option.moId}" value="${option.moId}" data-price="${option.price}">
            <label class="form-check-label" for="option-${option.moId}">
              ${option.content} (+${option.price.toLocaleString()}원)
            </label>
          </div>
        `).join('');
        $("#optionArea").html(html);
      } else {
        $("#optionArea").html("<p class='text-muted small'>선택 가능한 옵션이 없습니다.</p>");
      }
      new bootstrap.Modal(document.getElementById("addMenuModal")).show(); // 모달 표시
    },
    error: function(xhr, status, error) {
      console.error("옵션을 불러오는데 실패했습니다:", error);
      alert("옵션을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.");
    },
  });
});

// ==============================
// 모달 내 수량 조절 버튼 로직
// ==============================
$(document).ready(function () {
  $("#btnCountMinus").click(() => {
    if (currentQuantity > 1) {
      currentQuantity--;
      $("#modalCount").val(currentQuantity);
    }
  });

  $("#btnCountPlus").click(() => {
    currentQuantity++;
    $("#modalCount").val(currentQuantity);
  });

  // 모달이 열릴 때마다 수량 초기화
  $('#addMenuModal').on('show.bs.modal', function () {
    currentQuantity = 1;
    $('#modalCount').val(currentQuantity);
  });
});


// ==============================
// 장바구니 추가 버튼 (모달 내 #btnAddExtras)
// ==============================
$(document).on("click", "#btnAddExtras", function () {
  if (!selectedMenuId) {
    alert("메뉴를 선택해주세요.");
    return;
  }

  const quantity = parseInt($("#modalCount").val()) || 1;

  // 선택한 옵션 아이디, 가격 배열
  const selectedOptionIds = [];
  const selectedOptionPrices = [];

  $("#optionArea input[type=checkbox]:checked").each(function () {
    selectedOptionIds.push(parseInt($(this).val()));
    selectedOptionPrices.push(parseInt($(this).data("price")) || 0);
  });

  const mainMenuCartItem = {
      mId: selectedMenuId,
      moIds: null, // 메인 메뉴 항목에는 moIds를 보내지 않습니다.
      optionPrices: null, // 메인 메뉴 항목에는 optionPrices를 보내지 않습니다.
                          // 이들은 별도의 옵션 Cart 항목으로 처리됩니다.
      quantity: quantity,
      sId: selectedShopId,
      menuPrice: selectedMenuPrice, // 메인 메뉴의 순수 기본 단가 (13000)
      // mainMenuCartItem의 unitPrice는 순수 메뉴 단가만 포함합니다.
      unitPrice: selectedMenuPrice, // 13000
      // mainMenuCartItem의 totalPrice는 순수 메뉴 단가 * 수량입니다.
      totalPrice: selectedMenuPrice * quantity, // 13000 * 1 = 13000
      menuName: selectedMenuName,
      id: window.currentUserId,
      guestId: window.currentGuestId
    };

    // 백엔드로 보낼 최종 장바구니 항목 배열.
    // 첫 번째 요소는 메인 메뉴 항목입니다.
    const cartItemsToSend = [mainMenuCartItem];

    // 선택된 옵션들이 있다면, 각 옵션에 대한 별도의 Cart 항목을 배열에 추가합니다.
    if (selectedOptionIds.length > 0) {
      for (let i = 0; i < selectedOptionIds.length; i++) {
        const optionId = selectedOptionIds[i];
        const optionPrice = selectedOptionPrices[i];

        const optionCartItem = {
          mId: selectedMenuId, // 어떤 메뉴의 옵션인지 알기 위해 mId 포함
          moIds: [optionId], // 단일 옵션 ID 배열
          optionPrices: [optionPrice], // 단일 옵션 가격 배열
          quantity: quantity, // 옵션도 메인 메뉴와 동일한 수량
          sId: selectedShopId,
          menuPrice: 0, // 옵션 항목은 menuPrice가 없습니다.
          // 옵션의 unitPrice는 해당 옵션의 순수 단가입니다.
          unitPrice: optionPrice,
          // 옵션의 totalPrice는 옵션의 순수 단가 * 수량입니다.
          totalPrice: optionPrice * quantity, // 3000 * 1 = 3000
          // menuName은 메인 메뉴에만 있습니다.
          optionName: $(`#option-${optionId}`).siblings('label').text().split('(')[0].trim(), // 옵션명 가져오기
          id: window.currentUserId,
          guestId: window.currentGuestId
        };
        cartItemsToSend.push(optionCartItem);
      }
    }

  console.log("장바구니에 담기는 데이터 (프론트엔드에서 전송):", cartItemsToSend);

  $.ajax({
    type: "POST",
    url: "/addCart", 
    contentType: "application/json",
    data: JSON.stringify(cartItemsToSend),
    success: function (response) {
      if (response.success && response.cartList) {
        console.log("장바구니에 추가되었습니다.");
 
        updateOrderSummary(response.cartList, response.totalPrice);

        const modalEl = document.getElementById("addMenuModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide(); 
      } else {
        console.error("장바구니 추가 실패:", response.message || "알 수 없는 오류");
        alert("장바구니 추가 실패: " + (response.message || "알 수 없는 오류"));
      }
    },
    error: function (xhr, status, error) {
      console.error("서버 오류:", status, error, xhr.responseText);
      alert("서버 오류로 인해 장바구니 추가 실패. 잠시 후 다시 시도해주세요.");
    }
  });
});


// ==============================
// 페이지 로드 시 장바구니 내용 불러오기
// ==============================
$(document).ready(function() {
  // Thymeleaf를 통해 HTML에 주입된 guestId를 전역 변수에 할당
  const guestInfoElem = document.getElementById('guestInfo');
  if (guestInfoElem) {
    window.currentGuestId = guestInfoElem.dataset.guestId;
  }
  loadCartItems();

});


// ==============================
// 주문표(장바구니) UI 업데이트 함수
// cartList: 서버에서 받은 전체 장바구니 항목 리스트
// totalCartPrice: 서버에서 계산된 전체 장바구니의 총 가격
// ==============================
function updateOrderSummary(cartList, totalCartPrice) {
    const $orderItemList = $(".order-item-list");
    const $emptyOrderMessage = $("#emptyOrderMessage");
    const $orderSummaryInfo = $("#orderSummaryInfo");

    $orderItemList.empty(); // 기존 목록 비우기

    if (!cartList || cartList.length === 0) {
        $emptyOrderMessage.text("주문한 메뉴가 없습니다.").removeClass("d-none").show();
        $orderSummaryInfo.addClass("d-none").hide();
        updateOverallTotalPriceDisplay(0); // 총액도 0으로 설정
        return;
    }

    $emptyOrderMessage.addClass("d-none").hide();
    $orderSummaryInfo.removeClass("d-none").show();

    // 메인 메뉴만 필터링 (ca_pid가 null)
    const mainMenus = cartList.filter(item => item.caPid == null);

    mainMenus.forEach(mainItem => {
        // 해당 메인 메뉴에 딸린 옵션 필터링
        const options = cartList.filter(opt => opt.caPid != null && opt.caPid === mainItem.caId);

        let optionHtml = "";
		options.forEach(opt => {
		  
		    const optName = opt.optionName || "옵션명 없음"; // 여기서 정의!
		    const optPrice = opt.unitPrice || 0; // 옵션 가격은 unitPrice를 사용 (totalPrice는 수량까지 곱해진 값)
		    optionHtml += `
		        <div class="text-muted small ms-3 mb-1 cart-option-item" data-ca-id="${opt.caId}">
		          └ 옵션: ${optName} (+${optPrice.toLocaleString()}원)
		        </div>
		    `;
		});

        const quantity = mainItem.quantity || 0;
        const menuBasePrice = mainItem.menuPrice || 0; // 메뉴의 순수 단가

		const html = `
		           <div class="pb-3 mb-3 border-bottom cart-main-item" data-ca-id="${mainItem.caId}">
		               <div class="mb-2">
		                   <div class="fw-bold small mb-1">${mainItem.menuName} : ${menuBasePrice.toLocaleString()}원</div>
		                   ${optionHtml}
		                   <div class="d-flex justify-content-between align-items-center mt-2">
		                       <div class="d-flex align-items-center">
		                           <button class="btn btn-outline-secondary btn-sm py-0 px-1 btn-quantity-minus" data-ca-id="${mainItem.caId}">−</button>
		                           <input type="text" class="form-control form-control-sm mx-1 text-center quantity-input" value="${quantity}" readonly data-ca-id="${mainItem.caId}" style="width: 32px; height: 26px; font-size: 0.75rem; padding: 0;">
		                           <button class="btn btn-outline-secondary btn-sm py-0 px-1 btn-quantity-plus" data-ca-id="${mainItem.caId}">+</button>
		                       </div>
		                       <button class="btn btn-outline-danger btn-sm py-0 px-2 btn-delete-main-item" data-ca-id="${mainItem.caId}">x</button>
		                   </div>
		               </div>
		           </div>
		       `;
		       $orderItemList.append(html);
		   });


		   updateOverallTotalPriceDisplay(totalCartPrice);
}

// ==============================
// 전체 삭제 버튼 (#btnRemoveAllItems)
// ==============================
$("#btnRemoveAllItems").click(function () { // "장바구니 전체 삭제" 버튼의 ID
  // 1. 사용자에게 삭제를 한 번 더 확인합니다.
  if (!confirm("장바구니의 모든 항목을 삭제하시겠습니까?")) {
      return; // '취소'를 누르면 함수를 종료합니다.
  }

  // 2. 서버에 전달할 사용자 ID 또는 게스트 ID를 준비합니다.
  //    'window.currentUserId'와 'window.currentGuestId'는 페이지 로드 시 전역 변수로 설정되어 있다고 가정합니다.
  const requestData = {};
  if (window.currentUserId && window.currentUserId.trim() !== '') {
    requestData.userId = window.currentUserId;
  }
  if (window.currentGuestId && window.currentGuestId.trim() !== '') {
    requestData.guestId = window.currentGuestId;
  }

  // 3. 삭제할 정보(userId 또는 guestId)가 없으면 알림 후 종료합니다.
  if (Object.keys(requestData).length === 0) {
      alert("삭제할 장바구니 정보가 없습니다. 다시 로그인하거나 페이지를 새로고침해주세요.");
      return;
  }

		
	let sId = null;
	   const urlParams = new URLSearchParams(window.location.search); // 현재 URL의 쿼리 파라미터를 파싱
	   if (urlParams.has('sId')) {
	       sId = urlParams.get('sId'); // 'sId' 파라미터 값 가져오기
	   }

	   if (sId === null) {
	       alert("메뉴 상세 페이지로 돌아갈 가게 정보(sId)를 찾을 수 없습니다.");
	       return; // sId가 없으면 더 이상 진행하지 않음
	   }
		 
  // 4. AJAX 요청을 보냅니다.
	    // AJAX 요청
	    $.ajax({
	        url: "/removeAll",
	        method: "POST",
	        contentType: "application/json",
	        data: JSON.stringify(requestData),
	        success: function (response) {
	            if (response.success) {
	                console.log("장바구니가 모두 삭제되었습니다. 서버 응답:", response);
	                alert(response.message || "장바구니의 모든 항목이 삭제되었습니다.");
					loadCartItems();
	            } else {
	                console.error("전체 삭제 중 오류 발생:", response.message || "알 수 없는 오류");
	                alert("장바구니 전체 삭제 실패: " + (response.message || "알 수 없는 오류"));
	            }
	        },
	        error: function (xhr, status, error) {
	            console.error("서버 요청 중 오류 발생:", status, error, xhr.responseText);
	            alert("서버 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
	        }
	    });
	});

// ==============================
// 개별 항목 수량 조절 및 삭제 (이벤트 위임 사용)
// ==============================
$(document).on("click", ".btn-quantity-minus", function() {
    const caId = $(this).data("ca-id");
    const $quantityInput = $(`.quantity-input[data-ca-id="${caId}"]`);
    let currentQty = parseInt($quantityInput.val());

    if (currentQty > 1) {
        currentQty--;
        updateCartItemQuantity(caId, currentQty);
    }
});

$(document).on("click", ".btn-quantity-plus", function() {
    const caId = $(this).data("ca-id");
    const $quantityInput = $(`.quantity-input[data-ca-id="${caId}"]`);
    let currentQty = parseInt($quantityInput.val());

    currentQty++;
    updateCartItemQuantity(caId, currentQty);
});

$(document).on("click", ".btn-delete-main-item", function() {
    const caId = $(this).data("ca-id");
    if (confirm("이 메뉴 항목과 모든 옵션을 장바구니에서 삭제하시겠습니까?")) {
        deleteCartItem(caId);
    }
});


// ==============================
// 장바구니 항목 수량 업데이트 함수 (AJAX)
// ==============================
function updateCartItemQuantity(caId, newQuantity) {
    const requestData = {
        caId: caId,
        quantity: newQuantity,
        id: window.currentUserId,
        guestId: window.currentGuestId
    };

    $.ajax({
        url: "/updateQuantity",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(requestData),
        success: function(response) {
            if (response.success && response.cartList) {
                console.log(`카트 항목 ${caId} 수량 ${newQuantity}로 업데이트 성공.`);
				$(`.quantity-input[data-ca-id="${caId}"]`).val(newQuantity);
                updateOverallTotalPriceDisplay(response.totalPrice);
            } else {
                console.error("수량 업데이트 실패:", response.message || "알 수 없는 오류");
                alert("수량 업데이트 실패: " + (response.message || "알 수 없는 오류"));
            }
        },
        error: function(xhr, status, error) {
            console.error("수량 업데이트 서버 오류:", status, error, xhr.responseText);
            alert("수량 업데이트 중 서버 오류가 발생했습니다.");
        }
    });
}

// ==============================
// 장바구니 개별 항목 삭제 함수 (AJAX)
// ==============================
function deleteCartItem(caId) {
    const requestData = {
        caId: caId,
        id: window.currentUserId,
        guestId: window.currentGuestId
    };

    $.ajax({
        url: "/deleteCart", // 컨트롤러에 해당 엔드포인트가 필요합니다.
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(requestData),
        success: function(response) {
            if (response.success) {
                console.log(`카트 항목 ${caId} 및 관련 옵션 삭제 성공.`);
                console.log("선택된 메뉴 항목이 장바구니에서 삭제되었습니다.");
				$(`.cart-main-item[data-ca-id="${caId}"]`).remove();
				               
				loadCartItems();  // 장바구니 전체를 다시 로드하여 빈 상태를 정확히 반영
            } else {
                console.error("항목 삭제 실패:", response.message || "알 수 없는 오류");
                alert("항목 삭제 실패: " + (response.message || "알 수 없는 오류"));
            }
        },
        error: function(xhr, status, error) {
            console.error("항목 삭제 서버 오류:", status, error, xhr.responseText);
            alert("항목 삭제 중 서버 오류가 발생했습니다.");
        }
    });
}

// ==============================
// **변경:** 전체 장바구니 UI를 다시 그리지 않고, 총 결제 금액만 업데이트하는 새로운 함수
// ==============================
function updateOverallTotalPriceDisplay(totalCartPrice) {
    const $totalOrderPriceDisplay = $("#totalOrderPrice");
    $totalOrderPriceDisplay.text(`총 결제 금액: ${totalCartPrice.toLocaleString()}원`).removeClass("d-none").show();
}

//장바구니 새로고침해주는 함수
function loadCartItems() {
    const requestData = {};
    if (window.currentUserId && window.currentUserId.trim() !== '') {
        requestData.id = window.currentUserId;
    } else if (window.currentGuestId && window.currentGuestId.trim() !== '') {
        requestData.guestId = window.currentGuestId;
    } else {
        console.log("사용자/게스트 ID 없음, 빈 장바구니 표시."); 
        updateOrderSummary([], 0); // 사용자 ID나 게스트 ID가 없으면 즉시 빈 장바구니 표시
        return;
    }

    console.log("AJAX 요청 시작: /getCart", requestData); 
    $.ajax({
        url: "/getCart",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(requestData),
        success: function(response) {
            console.log("AJAX 성공: /getCart 응답:", response); 
            if (response.success && response.cartList) {
                updateOrderSummary(response.cartList, response.totalPrice);
            } else {
                console.error("장바구니 로드 실패 (서버 응답):", response.message || "알 수 없는 오류");
                updateOrderSummary([], 0); // 실패 시에도 빈 장바구니 표시
            }
        },
        error: function(xhr, status, error) {
            console.error("AJAX 오류: /getCart", status, error, xhr.responseText); 
            updateOrderSummary([], 0); // 오류 시에도 빈 장바구니 표시
        }
    });
}

// ==============================
// 기존 DOMContentLoaded 내 기존 스크립트 (변수명 'count' -> 'currentQuantity' 변경)
// ==============================
document.addEventListener("DOMContentLoaded", () => {

	const checkKakaoApi = setInterval(() => {
		if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.services) {
			clearInterval(checkKakaoApi); // API 로드 확인 후 인터벌 중지
			initAddressSearch(); // 주소 검색 기능 초기화
		}
	}, 100); // 0.1초마다 확인	


	document.querySelector('a[href="#info"]')?.addEventListener('shown.bs.tab', () => {
		showStoreOnMap();
	});

	if (typeof kakao === 'undefined' || !kakao.maps) {
		const interval = setInterval(() => {
			if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.load) {
				clearInterval(interval);
				runKakaoScript();
				showStoreOnMap();
			}
		}, 300);
	} else {
		runKakaoScript();
		showStoreOnMap();
	}

	document.getElementById("searchBtn")?.addEventListener("click", () => {
		document.getElementById("searchBox")?.classList.toggle("d-none");
	});

	document.getElementById("searchSubmitBtn")?.addEventListener("click", () => {
		const keyword = document.querySelector('#searchBox input[type="text"]')?.value.trim();
		if (keyword) {
		           window.location.href = `/shopList?keyword=${encodeURIComponent(keyword)}`;
		       } else {
		           alert("검색어를 입력해주세요.");
		       }
					 
					 
					 const locationInput = document.getElementById('location-input');
					    const searchButton = document.getElementById('searchButton'); // HTML에 'id="searchButton"'이 반드시 있어야 합니다.

					    if (locationInput && searchButton) {
					        // 초기 로드 시 버튼 상태 설정
					        updateSearchButtonState();

					        // 입력 필드 내용이 변경될 때마다 버튼 상태 업데이트
					        locationInput.addEventListener('input', updateSearchButtonState);

					        // 검색/지우기 버튼 클릭 이벤트.
					        // 이 클릭 이벤트는 'handleAddressSearch()' 함수를 호출합니다.
					        searchButton.addEventListener('click', () => {
					            const currentAddress = locationInput.value.trim();

					            if (currentAddress === '') {
					                // 주소 입력 필드가 비어 있으면 '검색' 버튼 역할
					                // handleAddressSearch(geocoder, locationInput); // 이 함수는 외부에서 정의되어야 하며, geocoder는 initAddressSearch() 등에서 생성되어야 합니다.
					            } else {
					                // 주소 입력 필드에 값이 있으면 '지우기' 버튼 역할
					                locationInput.value = ''; // 입력 필드 초기화
					                locationInput.focus();    // 커서를 다시 입력 필드로 이동
					                updateSearchButtonState(); // 버튼 텍스트를 '검색'으로 다시 변경
					            }
					        });

					        // --- 검색 버튼 텍스트와 스타일을 업데이트하는 도우미 함수 (DOMContentLoaded 내부 정의) ---
					        function updateSearchButtonState() {
					            if (locationInput.value.trim() !== '') {
					                searchButton.textContent = '지우기';
					                searchButton.style.backgroundColor = '#dc3545'; // 지우기 버튼은 빨간색 (예시)
					                searchButton.style.color = 'white';
					            } else {
					                searchButton.textContent = '검색';
					                searchButton.style.backgroundColor = '#43d091'; // 검색 버튼은 원래 초록색
					                searchButton.style.color = 'black'; // 글자색도 원래대로
					            }
					        }
					    } else {
					        console.warn("경고: 주소 검색 또는 초기화를 위한 HTML 요소('location-input' 또는 'searchButton')를 찾을 수 없습니다.");
					    }
					 			 
	});

	//검색버튼

});

function runKakaoScript() {
	if (typeof kakao === 'undefined' || !kakao.maps) return;

	const searchButton = document.getElementById('btn-search-toggle');
	const inputField = document.getElementById('location-input');
	if (!searchButton || !inputField) return;

	searchButton.addEventListener('click', () => {
		if (!navigator.geolocation) {
			alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const lat = position.coords.latitude;
				const lon = position.coords.longitude;
				const geocoder = new kakao.maps.services.Geocoder();
				const coord = new kakao.maps.LatLng(lat, lon);

				geocoder.coord2Address(coord.getLng(), coord.getLat(), (result, status) => {
					if (status === kakao.maps.services.Status.OK) {
						const address = result[0].address.address_name;
						inputField.value = address;

						// shopList 페이지로 category=전체보기, address 전달
						const url = `/shopList?category=전체보기&address=${encodeURIComponent(address)}`;
						window.location.href = url;
					} else {
						alert('주소 변환 실패');
					}
				});
			},
			(error) => alert('위치 정보를 가져오지 못했습니다: ' + error.message),
			{ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
		);
	});
}

// 가게 주소를 받아서 지도에 마커 표시하고 지도 중심을 이동시키는 함수
function showStoreOnMap() {
	const address = document.getElementById('storeAddress')?.innerText;
	const mapContainer = document.getElementById('map');
	if (!address || !mapContainer) return;

	const map = new kakao.maps.Map(mapContainer, {
		center: new kakao.maps.LatLng(33.450701, 126.570667), // 기본 중심 좌표
		level: 3
	});

	const geocoder = new kakao.maps.services.Geocoder();
	geocoder.addressSearch(address, (result, status) => {
		if (status === kakao.maps.services.Status.OK) {
			const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
			new kakao.maps.Marker({ map, position: coords });
			map.setCenter(coords);
		}
	});
}

function initAddressSearch() {
	const locationInputField = document.getElementById('location-input');
	const searchButton = document.getElementById('searchbtn');

	// 요소가 존재하는지 확인
	if (!locationInputField || !searchButton) {
		console.warn("주소 검색 기능을 위한 HTML 요소를 찾을 수 없습니다.");
		return;
	}

	// 카카오 Geocoder 서비스 객체 생성
	const geocoder = new kakao.maps.services.Geocoder();

	// 검색 버튼 클릭 이벤트 리스너
	searchButton.addEventListener('click', () => {
		const addressInput = locationInputField.value.trim(); // 입력된 주소 가져오기

		if (!addressInput) {
			alert('배달 주소를 입력해주세요.');
			return; // 입력값이 없으면 함수 종료
		}

		// 카카오 지도 API를 사용하여 주소 검색
		geocoder.addressSearch(addressInput, (result, status) => {
			if (status === kakao.maps.services.Status.OK) {
				// 검색 결과가 있을 경우 (유효한 주소)
				if (result.length > 0) {
					// 가장 첫 번째(가장 정확하다고 판단되는) 검색 결과 사용
					const foundAddress = result[0].address_name || result[0].road_address?.address_name || addressInput;
					console.log("카카오 API에서 확인된 주소:", foundAddress);

					// shopList 페이지로 이동
					const url = `/shopList?category=전체보기&address=${encodeURIComponent(foundAddress)}`;
					window.location.href = url;
				} else {
					// 검색 결과는 없지만 status는 OK인 경우 (매우 드물지만 발생 가능)
					alert('입력하신 주소에 대한 검색 결과가 없습니다. 다시 확인해주세요.');
					console.error("카카오 주소 검색 결과 없음:", addressInput);
				}
			} else {
				// 주소 검색 실패 (예: 잘못된 형식, 네트워크 오류 등)
				alert('유효한 배달 주소를 찾을 수 없습니다. 다시 확인해주세요.');
				console.error("카카오 주소 검색 실패 (상태 코드):", status, "입력 주소:", addressInput);
			}
		});
	});
}

function handleAddressSearch() {
	const addressInput = locationInput.value.trim();

	if (!addressInput) {
		alert('배달 주소를 입력해주세요.');
		return;
	}

	if (typeof kakao === 'undefined' || !kakao.maps || !kakao.maps.services || !new kakao.maps.services.Geocoder()) {
		console.error("카카오맵 Geocoder API가 로드되지 않았거나 사용할 수 없습니다.");
		alert("주소 검색 기능을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.");
		return;
	}
	const geocoder = new kakao.maps.services.Geocoder();


	geocoder.addressSearch(addressInput, (result, status) => {
		if (status === kakao.maps.services.Status.OK) {
			if (result.length > 0) {
				const foundAddress = result[0].address_name || result[0].road_address?.address_name || addressInput;
				console.log("카카오 API에서 확인된 주소:", foundAddress);

				const url = `/shopList?category=전체보기&address=${encodeURIComponent(foundAddress)}`;
				window.location.href = url;
			} else {
				alert('입력하신 주소에 대한 검색 결과가 없습니다. 다시 확인해주세요.');
			}
		} else {
			alert('유효한 배달 주소를 찾을 수 없습니다. 다시 확인해주세요.');
			console.error("카카오 주소 검색 실패:", status, addressInput);
		}
	});
}

// ==============================
// 찜하기 기능
// ==============================
$("#btnHeart").click(function () {
  // sId를 data-sid 속성에서 가져오는 것이 더 안정적입니다.
  const sId = $(this).data("sid");
  if (!sId) {
      alert('가게 정보를 찾을 수 없습니다.');
      return;
  }

  $.ajax({
    url: "/heart.ajax",
    type: "post",
    data: { sId: sId }, // 데이터 객체로 전달
    dataType: "json",
    success: function (data) {
      if (data && typeof data.heartCount !== 'undefined') {
        $("#heartCount").text(data.heartCount);
        alert("찜하기가 반영되었습니다.");
      } else {
        alert("찜하기 처리 결과가 올바르지 않습니다.");
      }
    },
    error: function (xhr, status, error) {
      alert(`찜하기 오류: ${xhr.statusText}, ${status}, ${error}`);
      console.error("찜하기 오류:", xhr.responseText);
    }
  });
});

// ==============================
// 리뷰 기능
// ==============================
$("#reviewWrite").click(() => $("#reviewForm").toggleClass("d-none"));

$(document).on("submit", "#reviewWriteForm", function (e) {
  e.preventDefault();

  if ($("#reviewContent").val().length < 5) {
      alert("댓글은 5자 이상 입력하세요~");
      return;
  }
  if (!$('input[name="rating"]:checked').val()) {
      alert("별점을 선택하세요~!");
      return;
  }

  const formData = new FormData(this);

  $.ajax({
    url: "reviewWrite.ajax",
    data: formData,
    type: "post",
    processData: false, // FormData 사용 시 필수
    contentType: false, // FormData 사용 시 필수
    dataType: "json",
    success: function (resData) {
      // TODO: 리뷰 목록을 새로고침하는 로직 추가 (예: 리뷰 목록을 다시 AJAX로 불러오거나, 응답 데이터로 UI 업데이트)
      // 현재는 단순히 alert만 띄우고 있습니다.
      alert("댓글이 등록되었습니다.");
      $("#reviewWriteForm")[0].reset(); // 폼 초기화
      $("#reviewForm").addClass("d-none"); // 폼 숨기기
      // 예: fetchAndDisplayReviews(); // 리뷰 목록을 다시 불러오는 함수 호출
    },
    error: function (xhr, status, error) {
      alert("댓글 등록 오류: " + (xhr.responseText || error));
      console.error("댓글 등록 오류:", xhr.responseText);
    }
  });
});

// 리뷰 사진 미리보기
// 'previewUrl' 전역 변수는 필요 없으며, 직접 src를 설정하면 됩니다.
$("#rPicture").on("change", function () { // ID를 rPicture로 변경
  const file = this.files[0];
  const $imgPreview = $('#imgPreview'); // jQuery 객체로 변경

  if (!file) {
      $imgPreview.hide().attr('src', ''); // 파일 없으면 숨기고 src 초기화
      return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    $imgPreview.attr('src', e.target.result).show();
  };
  reader.readAsDataURL(file);
});