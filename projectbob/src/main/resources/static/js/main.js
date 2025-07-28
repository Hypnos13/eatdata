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

// ==============================
// 주문하기 버튼 클릭 이벤트
// ==============================
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
 
        // 전역 변수 currentCartData와 currentTotalPrice, currentTotalQuantity 업데이트
        currentCartData = response.cartList;
        currentTotalPrice = response.totalPrice;
        // 서버 응답에 totalQuantity가 있다면 여기서 업데이트:
        // currentTotalQuantity = response.totalQuantity;

        updateOrderSummary(currentCartData, currentTotalPrice);

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
  // Thymeleaf를 통해 HTML에 주입된 guestId와 userId를 전역 변수에 할당 (userId도 함께 주입된다고 가정)
  const guestInfoElem = document.getElementById('guestInfo');
  if (guestInfoElem) {
    window.currentGuestId = guestInfoElem.dataset.guestId;
    window.currentUserId = guestInfoElem.dataset.userId; // userId도 HTML에서 주입된다고 가정
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
		    const optName = opt.optionName || "옵션명 없음"; 
		    const optPrice = opt.unitPrice || 0; 
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
$("#btnRemoveAllItems").click(function () {
  if (!confirm("장바구니의 모든 항목을 삭제하시겠습니까?")) {
      return;
  }

  const requestData = {};
  if (window.currentUserId && String(window.currentUserId).trim() !== '') {
    requestData.userId = window.currentUserId;
  }
  if (window.currentGuestId && String(window.currentGuestId).trim() !== '') {
    requestData.guestId = window.currentGuestId;
  }

  if (Object.keys(requestData).length === 0) {
      alert("삭제할 장바구니 정보가 없습니다. 다시 로그인하거나 페이지를 새로고침해주세요.");
      return;
  }
		
	let sId = null;
	   const urlParams = new URLSearchParams(window.location.search);
	   if (urlParams.has('sId')) {
	       sId = urlParams.get('sId');
	   }

	   if (sId === null) {
	       alert("메뉴 상세 페이지로 돌아갈 가게 정보(sId)를 찾을 수 없습니다.");
	       return;
	   }
		 
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
        url: "/deleteCart", 
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
// 전체 장바구니 총 결제 금액만 업데이트하는 함수
// ==============================
function updateOverallTotalPriceDisplay(totalCartPrice) {
    const $totalOrderPriceDisplay = $("#totalOrderPrice");
    $totalOrderPriceDisplay.text(`총 결제 금액: ${totalCartPrice.toLocaleString()}원`).removeClass("d-none").show();
}

//장바구니 새로고침해주는 함수
function loadCartItems() {
    const requestData = {};
    if (window.currentUserId && String(window.currentUserId).trim() !== '') {
        requestData.id = window.currentUserId;
    } else if (window.currentGuestId && String(window.currentGuestId).trim() !== '') {
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
                // 서버에서 받은 최신 장바구니 데이터로 전역 변수 업데이트
                currentCartData = response.cartList;
                currentTotalPrice = response.totalPrice;
                // response에 totalQuantity가 있다면 여기서 업데이트:
                // currentTotalQuantity = response.totalQuantity;

                updateOrderSummary(currentCartData, currentTotalPrice);
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

// =========================================================================
// DOMContentLoaded 이벤트 리스너 통합 및 카카오 지도 API 로드 개선
// =========================================================================

// 모든 DOMContentLoaded 관련 스크립트를 하나의 jQuery $(document).ready() 블록으로 통합
$(document).ready(function() {
	//집버튼 클릭시 주소록 가져오기 
	$("#homeAddressBtn")?.on("click", function() {
	       // 주소 선택 모달 열기
	       const addressSelectModal = new bootstrap.Modal(document.getElementById('addressSelectModal'));
	       addressSelectModal.show();
	       
	       // 데이터 로딩 함수 호출 (모달이 열릴 때 빈 상태로 뜨도록 합니다)
	       loadUserAddressesIntoModal();
	   });

	   // --- 주소 목록 아이템 클릭 시 이벤트 (선택 버튼 클릭 시) ---
	   // (지금은 데이터가 없어 이 이벤트가 발생할 일은 없지만, 나중에 데이터를 추가하면 동작합니다.)
	   $(document).on("click", "#addressTabContent .select-address-btn", function(e) {
	       e.stopPropagation(); // 부모 div의 클릭 이벤트가 발생하지 않도록 방지
	       const selectedAddress = $(this).closest('.address-item').data("full-address");

	       if (selectedAddress) {
	           $("#location-input").val(selectedAddress);
	           const addressSelectModal = bootstrap.Modal.getInstance(document.getElementById('addressSelectModal'));
	           addressSelectModal.hide();
	           $("#addressInputSearchBtn").trigger('click');
	           console.log(`선택된 주소 '${selectedAddress}'로 검색 완료.`);
	       } else {
	           console.error("선택된 주소 데이터를 찾을 수 없습니다.");
	       }
	   });
	
    // 탭 전환 시 가게 지도 표시
    $('a[href="#info"]')?.on('shown.bs.tab', function () {
        showStoreOnMap();
    });
		
		if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.services) {
		      initAddressSearchInput();
		      console.log("주소 검색 기능 초기화 완료.");
		  } else {
		      console.warn("경고: 카카오 지도 API 또는 서비스 라이브러리가 로드되지 않아 주소 검색 기능을 초기화할 수 없습니다.");
		  }


		  // --- 2. 현재 위치 검색 버튼 (currentLocationSearchBtn) 기능 초기화 ---
		  // 카카오 지도 API가 로드된 후에만 이 함수가 호출되도록 조건부 실행
		  if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.services) {
		      handleCurrentLocationSearch();
		      console.log("현재 위치 검색 기능 초기화 완료.");
		  } else {
		      console.warn("경고: 카카오 지도 API 또는 서비스 라이브러리가 로드되지 않아 현재 위치 검색 기능을 초기화할 수 없습니다.");
		  }

    // 검색 제출 버튼 (키워드 검색)
    $("#searchSubmitBtn")?.on("click", function () {
        const keyword = $('#searchBox input[type="text"]')?.val().trim();
        if (keyword) {
            window.location.href = `/shopList?keyword=${encodeURIComponent(keyword)}`;
        } else {
            alert("검색어를 입력해주세요.");
        }
    });

    // 주소 검색/지우기 버튼 로직 
    const locationInput = document.getElementById('location-input');
    const addressInputSearchBtn  = document.getElementById('addressInputSearchBtn'); // HTML에 'id="searchButton"'이 반드시 있어야 합니다.

    if (locationInput && addressInputSearchBtn ) {
        // 초기 로드 시 버튼 상태 설정
        updateSearchButtonState();

        // 입력 필드 내용이 변경될 때마다 버튼 상태 업데이트
        locationInput.addEventListener('input', updateSearchButtonState);


        // --- 검색 버튼 텍스트와 스타일을 업데이트하는 도우미 함수 ---
        function updateSearchButtonState() {
       
                addressInputSearchBtn .textContent = '검색';
                addressInputSearchBtn .style.backgroundColor = '#43d091'; // 검색 버튼은 원래 초록색
                addressInputSearchBtn .style.color = 'black'; // 글자색도 원래대로
            
        }
    } else {
        console.warn("경고: 주소 검색 또는 초기화를 위한 HTML 요소('location-input' 또는 'addressInputSearchBtn')를 찾을 수 없습니다.");
    }

});



function handleCurrentLocationSearch() {
    console.log("handleCurrentLocationSearch 함수 시작");
    if (typeof kakao === 'undefined' || !kakao.maps || !kakao.maps.services) {
        console.error("오류: 카카오 지도 API 또는 서비스 라이브러리가 로드되지 않았습니다. 현재 위치 검색을 실행할 수 없습니다.");
        return;
    }
		console.log("카카오 API 로드 확인 완료");
    const currentLocationSearchBtn = document.getElementById('currentLocationSearchBtn'); // ★ HTML ID: currentLocationSearchBtn ★
    const locationInputField = document.getElementById('location-input'); // 주소 입력 필드 ID

    if (!currentLocationSearchBtn || !locationInputField) {
        console.warn("경고: 'currentLocationSearchBtn' 또는 'location-input' 요소를 찾을 수 없어 현재 위치 검색 기능을 초기화할 수 없습니다.");
        return;
    }
		console.log("HTML 요소 찾음");
		
    currentLocationSearchBtn.addEventListener('click', () => {
			console.log("위치 찾기 버튼 클릭됨");
        if (!navigator.geolocation) {
            alert('이 브라우저는 위치 정보를 지원하지 않습니다. 최신 브라우저를 사용해주세요.');
            return;
        }
	
				console.log("Geolocation 지원됨");	
				
        navigator.geolocation.getCurrentPosition(
            (position) => {
							console.log("위치 정보 가져오기 성공:", position);
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
								console.log(`위치 정보 가져오기 성공: 위도 ${lat}, 경도 ${lon}`);
                const geocoder = new kakao.maps.services.Geocoder();
                const coord = new kakao.maps.LatLng(lat, lon);

                geocoder.coord2Address(coord.getLng(), coord.getLat(), (result, status) => {
                    if (status === kakao.maps.services.Status.OK && result.length > 0) {
                        const address = result[0].address.address_name;
                        locationInputField.value = address; // 입력 필드에 주소 자동 채우기

                        const url = `/shopList?category=전체보기&address=${encodeURIComponent(address)}`;
                        window.location.href = url;
                    } else {
                        alert('위치 정보를 주소로 변환하는 데 실패했습니다. 다시 시도해주세요.');
                        console.error("주소 변환 실패:", status, result);
                    }
                });
            },
            (error) => {
                let errorMessage = '위치 정보를 가져오는 데 실패했습니다.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '위치 정보 사용 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = '위치 정보를 사용할 수 없습니다.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = '위치 정보를 가져오는 요청 시간이 초과되었습니다.';
                        break;
                    default:
                        errorMessage = `알 수 없는 오류: ${error.message}`;
                        break;
                }
                alert(errorMessage);
                console.error("위치 정보 가져오기 오류:", error);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    });
		console.log("이벤트 리스너 등록 완료");
}

/**
 * 주소 입력 필드의 내용을 기반으로 주소 검색을 수행하고 'shopList' 페이지로 이동합니다.
 * HTML에서 주소 입력 필드는 'location-input' ID를, 검색 버튼은 'addressInputSearchBtn' ID를 가정합니다.
 * 이 버튼은 '검색' 역할과 '지우기' 역할을 겸할 수 있습니다 (아래 `$(document).ready` 로직 참고).
 */
function initAddressSearchInput() { // 함수명 변경 (initAddressSearch -> initAddressSearchInput)
    const locationInputField = document.getElementById('location-input');
    const addressInputSearchBtn = document.getElementById('addressInputSearchBtn'); // ★ HTML ID: addressInputSearchBtn ★

    if (!locationInputField || !addressInputSearchBtn) {
        console.warn("경고: 'location-input' 또는 'addressInputSearchBtn' 요소를 찾을 수 없어 주소 검색 기능을 초기화할 수 없습니다.");
        return;
    }
    if (typeof kakao === 'undefined' || !kakao.maps || !kakao.maps.services) {
        console.error("오류: 카카오 맵스 Geocoder API가 로드되지 않았습니다. 주소 검색을 초기화할 수 없습니다.");
        return;
    }

    const geocoder = new kakao.maps.services.Geocoder();

    addressInputSearchBtn.addEventListener('click', () => {
			console.log("주소 검색 버튼 (addressInputSearchBtn) 클릭됨!");
        const addressInput = locationInputField.value.trim();

        // 이 버튼은 $(document).ready()에서 '지우기' 역할을 이미 처리합니다.
        // 따라서 여기서는 '검색' 역할만 수행합니다.
        if (!addressInput) {
            alert('배달받으실 주소를 입력해주세요.');
            return;
        }

        geocoder.addressSearch(addressInput, (result, status) => {
            if (status === kakao.maps.services.Status.OK && result.length > 0) {
                const foundAddress = result[0].address.address_name || result[0].road_address?.address_name || addressInput;
                console.log("카카오 API에서 확인된 주소:", foundAddress);

                const url = `/shopList?category=전체보기&address=${encodeURIComponent(foundAddress)}`;
                window.location.href = url;
            } else {
                alert('입력하신 주소에 대한 검색 결과가 없거나 유효하지 않습니다. 다시 확인해주세요.');
                console.error("카카오 주소 검색 실패 (상태 코드):", status, "입력 주소:", addressInput);
            }
        });
    });
}

/**
 * 가게 주소를 지도에 마커로 표시하고 지도의 중심을 이동시킵니다.
 * HTML에서 가게 주소는 'storeAddress' ID의 요소에서, 지도는 'map' ID의 컨테이너에서 가져옵니다.
 */
function showStoreOnMap() {
	console.log("showStoreOnMap 함수 실행 시작.");
    const address = document.getElementById('storeAddress')?.innerText;
    const mapContainer = document.getElementById('map');

    if (!address || !mapContainer) {
        console.warn("경고: 가게 주소 지도 표시를 위한 HTML 요소('storeAddress' 또는 'map')를 찾을 수 없습니다.");
        return;
    }
    if (typeof kakao === 'undefined' || !kakao.maps) {
        console.error("오류: 카카오 맵스 API가 로드되지 않았습니다. 가게 지도를 표시할 수 없습니다.");
        return;
    }

    const map = new kakao.maps.Map(mapContainer, {
        center: new kakao.maps.LatLng(33.450701, 126.570667), // 기본 중심 좌표 (제주도 카카오 본사)
        level: 3 
    });

    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
        if (status === kakao.maps.services.Status.OK && result.length > 0) {
            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            new kakao.maps.Marker({ map, position: coords });
            map.setCenter(coords);
        } else {
            console.error("가게 주소 검색 실패:", status, "주소:", address);
            alert("가게 주소를 지도에서 찾는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    });
}

function loadUserAddressesIntoModal() {
    console.log("loadUserAddressesIntoModal 함수 호출됨. (데이터 로딩은 현재 비활성화)");
    
    // 모든 탭의 기존 목록을 비우고, 로딩 메시지를 표시합니다.
    $('.tab-pane .list-group').empty();
    $('#loadingHomeAddressMessage, #loadingWorkAddressMessage, #loadingOtherAddressMessage').removeClass("d-none").show();
    $('#noHomeAddressMessage, #noWorkAddressMessage, #noOtherAddressMessage').addClass("d-none").hide();

    // ---------------------------------------------------------------
    // 실제 데이터 로딩 로직 (AJAX 호출 등)은 여기에 들어갈 예정입니다.
    // 지금은 이 부분을 건너뛰어 데이터를 로드하지 않습니다.
    // ---------------------------------------------------------------

    // 일정 시간 후 로딩 메시지를 숨기고, '주소 없음' 메시지를 표시합니다.
    // 이는 데이터가 없음을 시뮬레이션합니다.
    setTimeout(() => {
        $('#loadingHomeAddressMessage, #loadingWorkAddressMessage, #loadingOtherAddressMessage').addClass("d-none").hide();
        // 모든 탭에 '주소 없음' 메시지를 표시합니다.
        $('#noHomeAddressMessage').removeClass("d-none").show();
        $('#noWorkAddressMessage').removeClass("d-none").show();
        $('#noOtherAddressMessage').removeClass("d-none").show();
    }, 500); // 0.5초 후에 메시지 상태 변경
}

/**
 * 주소 목록을 특정 HTML 요소에 렌더링하는 헬퍼 함수
 * (현재는 호출되지 않거나, 데이터가 비어있어 아무것도 렌더링하지 않습니다.)
 */
function renderAddresses(addresses, listSelector, noAddressMessageSelector) {
    const $listElement = $(listSelector);
    const $noMessageElement = $(noAddressMessageSelector);

    $listElement.empty(); // 현재 목록을 비웁니다.

    if (addresses && addresses.length > 0) {
        // 실제 데이터가 있다면 이 곳에서 주소 항목을 생성합니다.
        // 현재는 addresses 배열이 비어있으므로 아무것도 추가되지 않습니다.
        addresses.forEach(addr => {
            // ... (주소 항목 HTML 생성 로직) ...
        });
    } else {
        // 주소 데이터가 없으면 '주소 없음' 메시지를 표시합니다.
        $noMessageElement.removeClass("d-none").show();
    }
}
// ==============================
// 찜하기 기능
// ==============================
$("#btnHeart").click(function () {
  const sId = $(this).data("sid");
  if (!sId) {
      alert('가게 정보를 찾을 수 없습니다.');
      return;
  }

  $.ajax({
    url: "/heart.ajax",
    type: "post",
    data: { sId: sId }, 
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
    processData: false, 
    contentType: false, 
    dataType: "json",
    success: function (resData) {
      // TODO: 리뷰 목록을 새로고침하는 로직 추가 (예: 리뷰 목록을 다시 AJAX로 불러오거나, 응답 데이터로 UI 업데이트)
      // 현재는 단순히 alert만 띄우고 있습니다.
      alert("댓글이 등록되었습니다.");
      $("#reviewWriteForm")[0].reset(); 
      $("#reviewForm").addClass("d-none"); 
      // 예: fetchAndDisplayReviews(); // 리뷰 목록을 다시 불러오는 함수 호출
    },
    error: function (xhr, status, error) {
      alert("댓글 등록 오류: " + (xhr.responseText || error));
      console.error("댓글 등록 오류:", xhr.responseText);
    }
  });
});

// 리뷰 사진 미리보기
$("#rPicture").on("change", function () { 
  const file = this.files[0];
  const $imgPreview = $('#imgPreview');

  if (!file) {
      $imgPreview.hide().attr('src', ''); 
      return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    $imgPreview.attr('src', e.target.result).show();
  };
  reader.readAsDataURL(file);
});

