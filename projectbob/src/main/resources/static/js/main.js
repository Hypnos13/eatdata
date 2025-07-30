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
        success: function(response) {
            if (response.success && response.redirectUrl) {
                // 서버가 지시하는 URL로 페이지를 리디렉션합니다.
                window.location.href = response.redirectUrl;
            } else {
                alert('주문 처리 중 오류가 발생했습니다.');
            }
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
    const $emptyOrderMessage = $(".empty-order-message"); // 클래스 선택자로 변경
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
        const menuBasePrice = mainItem.menuPrice || 0;

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
  // `updateOrder()` 함수는 이전에 제거되었거나 다른 용도로 사용될 수 있습니다.
  // 현재 `loadCartItems()`가 페이지 로드 시 장바구니를 로드합니다.
  // if (typeof updateOrder === 'function') updateOrder();

  document.querySelector('a[href="#info"]')?.addEventListener('shown.bs.tab', () => {
    showStoreOnMap();
  });

  // 카카오맵 스크립트 로딩 및 실행 로직
  // 이 부분은 카카오맵 스크립트가 <head>에 비동기로 로드되는 경우에 필요합니다.
  // 현재 HTML에는 <script> 태그가 직접 포함되어 있으므로, 이미 로드되어 있을 가능성이 높습니다.
  // 하지만 안전을 위해 유지합니다.
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
    if (keyword) window.location.href = `/shopList?keyword=${encodeURIComponent(keyword)}`;
  });
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

// ==============================
// 찜하기 기능
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  const noReviewElement = document.getElementById("noReview");
  if (noReviewElement) {
    if(document.querySelectorAll("#reviewList .reviewRow").length > 0){
      noReviewElement.style.display = "none";
    } else {
      noReviewElement.style.display = "block";
    }
  }
	


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

	
	//검색버튼
	document.getElementById('searchSubmitBtn').addEventListener('click', function () {
	    const keyword = document.querySelector('#searchBox input[type="text"]').value.trim();

	    // 현재 선택된 카테고리도 함께 보내고 싶다면 추가로 처리 가능
	    // 예: const category = '치킨'; 또는 URL에서 파싱 가능

	    // URL 구성
	    const searchUrl = `/shopList?keyword=${encodeURIComponent(keyword)}`;

	    // 페이지 이동
	    window.location.href = searchUrl;
	});
	
});








// 찜하기 하트
/*$(function(){
	
	$("#btnHeart").click(function(){
		let sId = $(this).data("sid") || $("input[name='sId']").val();
		if (!sId){
			alert('가게 정보를 찾을 수 없습니다.');
			return;
		}
		
		$.ajax({
			url: "/heart.ajax",
			type: "post",
			data : { sId : sId },
			dataType: "json",
			success: function(data){
			$("#heartCount").text(data.heartCount);
				alert("찜하기가 반영되었습니다.");
			},
			error: function(xhr, status, error){
				alert("error : " + xhr.statusText + "," + status + "," + error);
			}
		});
	});
});
*/

//찜하기~
$(function(){
	$('#btnLikeList').click(function(){
		const loginId = $('#loginId').val();
		if (!loginId){
			alert('로그인 후 이용가능함');
			return;
		}
		
		const $btn = $(this);	
		const sId = $btn.data('sid');
		console.log('trying to like shop:', sId);
		const dto = { id: loginId, sId: sId};
		
		$.ajax({
			url: '/like.ajax',
			type: 'POST',
			contentType: 'application/json; charset=UTF-8',
			dataType:'json',
			data: JSON.stringify(dto),
			success(res){
		if(res.liked){
			$btn.addClass('btn-danger liked').removeClass('btn-outline-secondary');
			$('#likeText').text('찜');
			alert('찜!💖');
		} else {
			$btn.removeClass('btn-danger liked').addClass('btn-outline-secondary');
			$('#likeText').text('찜하기');
			alert('찜 해제!💔');
			}
			$('#likeCount').text(res.heartCount != null ?  res.heartCount : 0);
				
			
		},
		error(xhr, status, error){
			console.error(error);
			alert('찜 처리 오류');
		}
		});
	});
});



// 댓글쓰기 버튼 클릭 이벤트
$("#reviewWrite").on("click", function(){
	console.log("리뷰쓰기 버튼 클릭");
	resetReviewForm();
		$("#reviewFormOriginalContainer").append($("#reviewForm").removeClass("d-none"));
		$("#reviewForm form").attr("id", "reviewWriteForm").removeAttr("data-no");
		$("#reviewForm input[type='submit']").val("댓글쓰기").text("댓글쓰기");
		$("#reviewContent").val("");
		$('input[name="rating"]').prop('checked', false);
		$("#imgPreview").hide().attr('src', '');
		if(previewUrl){URL.revokeObjectURL(previewUrl); previewUrl = null;}
		lastEditRno = null;
	});
	
	$(document).on("submit", "#reviewWriteForm", function(e){
		e.preventDefault();
		/*if($("#reviewContent").val().length < 5){
			alert("댓글은 5자 이상 입력하세요~");
			return false;
		}*/
		if (!$('input[name="rating"]:checked').val()){
			alert("별점을 선택하세요~!");
			return false;
		}
		let formData = new FormData(this);
		
		let params = $(this).serialize();
		console.log(params);
		
		$.ajax({
			"url": "reviewWrite.ajax",
			"data": formData,
			"type": "post",
			"processData": false,
			"contentType": false,
			"dataType": "json",
			"success": function(resData){
				console.log('resData: ' ,resData);
				
				recallReviewList(resData.reviewList, resData.reviewReplyMap);
				resetReviewForm();
				
				console.log('버튼 찾기:', $("#reviewFormMode"));

								
			},
			"error": function(xhr, status){
				console.log("error : " + status);
			}
		});
		return false;
	});


//댓글 사진 미리보기
let previewUrl = null;

$("#rPicture").on('change', function(e){
	const [file] = e.target.files;
	if(file){
		if(previewUrl){
			URL.revokeObjectURL(previewUrl);
		}
		previewUrl = URL.createObjectURL(file);
		$("#imgPreview").attr('src', previewUrl).show();
	} else {
		if(previewUrl){
			URL.revokeObjectURL(previewUrl);
			previewUrl = null;
		}
		$("#imgPreview").hide();
	}
});



//댓글 수정하기 버튼클릭
lastEditRno = null;
$(document).on("click", ".modifyReview", function(){
	resetReviewForm();
	console.log("수정 버튼 클릭");
	console.log($("#reviewForm").css("display"));
	console.log($("#reviewForm").is(":visible"));
	
	console.log($(this).parents(".reviewRow"));
	let $reviewRow = $(this).closest(".reviewRow");
	if(!$reviewRow.length){
		alert("리뷰 요소를 못찾음");
		return;
	}
	let rno = $(this).attr("data-no");
	lastEditRno = rno;
	console.log("폼을 해당리뷰 아래로 이동:", $reviewRow, "rno", rno);
	
	$reviewRow.after($("#reviewForm").removeClass("d-none"));
	console.log("폼 실제 위치:", $("#reviewForm").parent()[0]);
	
	let $form = $("#reviewForm").find("form");
	let reviewContent = $reviewRow.find(".review-content").text();
	$form.find("#reviewContent").val($.trim(reviewContent));			
	$form.attr("id", "reviewUpdateForm").attr("data-no", rno);		
	$("#reviewForm input[type='submit']").val("댓글수정").text("댓글수정");
		
});

// 댓글 수정 폼 submit
$(document).on("submit", "#reviewUpdateForm", function(e){
	e.preventDefault();
	
	/*if($("#reviewContent").val().length <= 5){
		alert("댓글은 5자 이상 입력해야 합니다.");
		return false;
	}*/
	//$("#global-content > div").append($("#reviewForm"));
	
	let form = this;
	let formData = new FormData(form);
	formData.append("rNo", $(form).attr("data-no"));
	
	console.log("전송할 rNo (수정):", $(form).attr("data-no"));
	console.log("전송할 FormData:", formData);
	
	$.ajax({
			"url": "reviewUpdate.ajax",
			"data": formData,
			"type": "patch",
			"processData": false,
			"contentType": false,
			"dataType": "json",
			"success": function(resData){
				console.log('resData: ' ,resData);
				
				recallReviewList(resData.reviewList, resData.reviewReplyMap);
				resetReviewForm();
										
				console.log("리뷰 다시 그림. 폼 숨기기");			
				console.log('버튼 찾기:', $("#reviewFormMode"));
				
		
			},
			"error": function(xhr, status){
				console.log("error : " + status);
			}
		});
		return false;
});


// 댓글 삭제하기
$(document).on("click", ".deleteReview", function(){
	
//	$("#global-content > div").append($("#reviewForm"));
	$("#reviewContent").val("");
	$("#reviewForm").addClass("d-none");
	
	let rNo = $(this).data("no");
	console.log('삭제할 rNo:' , rNo);
	let sId = $(this).data("sid");
		if(sId == undefined || sId == 'undefined'){
			sId = $('#reviewWriteForm input[name="sId"]').val();
		}
	let id = $(this).closest(".border-bottom").find(".fw-bold").first().text().replace('님', '');
	
	
	let params = {rNo: rNo, sId: sId};
	console.log(params);
	
	let result = confirm(id + "님이 작성한 " + rNo + "번 댓글을 삭제하시봉?");
	
	console.log("전송할 rNo (삭제):", rNo);
	console.log("전송할 params:", params);
	
	if(result){
	$.ajax({
				"url": "reviewDelete.ajax",
				"data": { rNo: rNo, sId: sId },
				"type": "delete",				
				"dataType": "json",
				"success": function(resData, status, xhr){
					console.log('resData: ' ,resData);
					
				recallReviewList(resData.reviewList, resData.reviewReplyMap);
				resetReviewForm();

				},
				"error": function(xhr, status){
					console.log("error : " + status);
				}
			});
			}
			return false;
	
});


// 신고하기 버튼
function reportReview(elemId){
	let result = confirm("이 댓글을 신고하시봉?");
	if(result == true){
		alert("report - " + result);
	}
}

// 사장님 댓글쓰기 버튼 클릭 시
$(document).on('click', '.review-reply-btn', function(){
	const rNo = $(this).data('review-no');
	const $replyFormContainer = $(this).closest('.reviewRow').find('.reviewReplyForm');
	const sId = $replyFormContainer.find("input[name='sId']").val();
	$('.reviewReplyForm').addClass('d-none');
	$replyFormContainer.removeClass('d-none');
	$replyFormContainer.find('input[name="rNo"]').val(rNo);
	
	console.log('사장님 대댓글쓰기 버튼 클릭 rNo:', rNo, 'sId', sId);	
	console.log('폼 input[name="rNo"] 값:', $replyFormContainer.find('input[name="rNo"]').val());
});
// 사장님 댓글쓰기 submit
$(document).on('submit', '.review-reply-form', function(e){
	e.preventDefault();
	
	const $form = $(this);
	const rNo = $form.find('input[name="rNo"]').val();	
	const rrNo = $form.find('input[name="rrNo"]').val();	
	
	const $sIdInput = $form.find('input[name="sId"]'); // Get the sId input element
	const sId = $sIdInput.val(); // Get its value

	console.log('main.js - $sIdInput found:', $sIdInput.length > 0); // Check if element is found
	console.log('main.js - sId from form:', sId); 

	const content = $form.find('textarea[name="content"]').val();
	const shopOwnerId = $("#shopOwnerId").val();

	console.log('ajax전송 전 rrNo:', rrNo, 'sId:' , sId, 'shopOwnerId:', shopOwnerId, '대댓글 content값:', content);
	
	if(!content || content.trim().length == 0){
		alert('댓글을 입력하세요.');
		return;
	}
	$.ajax({
		url: '/reviewReplyWrite.ajax',
		type: 'post',
		data: JSON.stringify({
			rNo: Number(rNo),
			sId: Number(sId),
			id: shopOwnerId,
			content: content
		}),
		contentType: "application/json",
		dataType: 'json',
		success: function(resData){
			recallReviewList(resData.reviewList, resData.reviewReplyMap);
			
			$form.closest('.reviewReplyForm').addClass('d-none');
			$form[0].reset();
		},
		error: function(xhr, status){
			alert('사장님 댓글 등록 오류: ' + status);
		}
	});
});

// 사장님 댓글 수정 클릭
$(document).on("click", ".modifyReviewReply", function(){
	console.log("modifyReviewReply 클릭!",{
		thisElem: this,
		dataRno: $(this).data('rno'),
		dataRrno: $(this).data('rrno')
	})
		const rNo = $(this).data('rno');		
		const rrNo = $(this).data('rrno');
		const $reviewRow = $(this).closest('.reviewRow');
		const $replyForm = $reviewRow.find('.reviewReplyForm');
		console.log("$replyForm length:", $replyForm.length);
		console.log("$replyForm hasClass('d-none') before toggle:", $replyForm.hasClass("d-none"));
				const sId = Number($replyForm.find("input[name='sId']").first().val());
		const content = $reviewRow.find('.ms-3.fs-5.py-2').text().trim();
		
		$replyForm.find('.review-reply-submit-btn').text('수정하기');
		$replyForm.find('.modifyReviewReply, .deleteReviewReply').hide();
		$replyForm.find('input[name="rNo"]').val(rNo);
		$replyForm.find('input[name="rrNo"]').val(rrNo);
		$replyForm.find('input[name="sId"]').val(sId);
		$replyForm.find('textarea[name="content"]').val(content);
		$replyForm.attr('id', 'reviewReplyUpdateForm');
		$('.reviewReplyForm').addClass('d-none');
		$replyForm.removeClass('d-none');	
			
});

// 사장님 댓글수정 submit
$(document).on("submit", "#reviewReplyUpdateForm", function(e){
	e.preventDefault();
		
		const $form = $(this);
		const rNo = $form.find('input[name="rNo"]').val();	
		const rrNo = $form.find('input[name="rrNo"]').val();	
		const sId = $form.find('input[name="sId"]').val();
		const content = $form.find('[name="content"]').val();
		const shopOwnerId = $("#shopOwnerId").val();

		console.log('수정ajax전송 전 rrNo:', rrNo,'rNo', rNo, 'sId:' , sId, 'shopOwnerId:', shopOwnerId, '대댓글 content값:', content);
		console.log('shopOwnerId:', $('#shopOwnerId').val());
		
		if(!content || content.trim().length == 0){
			alert('댓글을 입력하세요.');
			return;
		}
		$.ajax({
			url: '/reviewReplyUpdate.ajax',
			type: 'patch',
			data: JSON.stringify({
				rrNo: Number(rrNo),
				rNo: Number(rNo),
				sId: Number(sId),
				id: shopOwnerId,
				content: content
			}),
			contentType: "application/json",
			dataType: 'json',
			success: function(resData){
				console.log("✔ reviewReplyWrite.ajax resData:", resData);				    
				    console.log("   → reviewReplyMap keys:", Object.keys(resData.reviewReplyMap));
				    console.log("   → reviewReplyMap[rNo]:", resData.reviewReplyMap[resData.reviewList[0].rNo]);
				recallReviewList(resData.reviewList, resData.reviewReplyMap);
				
				const $replyForm = $form.closest('.reviewReplyForm');
				$replyForm.addClass('d-none');
				if($form[0] && $form[0].tagName == "FORM") $form[0].reset();
				$form.removeAttr('id');				
				$replyForm.find('.review-reply-submit-btn').text('등록');
				$replyForm.find('.modifyReviewReply, .deleteReviewReply').show();
			},
			error: function(xhr, status){
				alert('사장님 댓글 수정 오류: ' + status);
			}
		});
});

// 사장님 댓글 삭제
$(document).on("click", ".deleteReviewReply", function(){
	const rrNo = $(this).data("rrno");
	let sId = $(this).data("sid");
	console.log("대댓글 삭제 클릭 ->", {rrNo: $(this).data("rrno"), sId: $(this).data("sid")});
		if(!sId){
			sId = $('#reviewWriteForm input[name="sId"]').val();
		}
	if (!confirm("댓글을 정말 삭제하시겠습니까?")) return;
	
	$.ajax({
		url: "/reviewReplyDelete.ajax",
		type: "delete",
		data: { rrNo: rrNo, sId: sId },
		dataType: "json",
		success: function(resData){
			delete resData.reviewReplyMap[rrNo];
			recallReviewList(resData.reviewList, resData.reviewReplyMap);		
		},
		error: function(xhr, status){
			alert("사장님 댓글 삭제 중 오류:" + status);
		}
	});
});


// 리뷰쓰기/수정/삭제 AJAX 성공 후~
function recallReviewList(reviewArr, reviewreplyMap){
	console.log("recallReviewList 호출!:", reviewArr, reviewreplyMap);
	$("#reviewFormOriginalContainer").append($("#reviewForm").addClass("d-none"));
	const loginId = $("#loginId").val();	
	const shopOwnerId = $("#shopOwnerId").val();
//	const shopId = $("input[name='sId']").first().val();
	const $list = $("#reviewList");
	const $none = $("#noReview");	
	
	if(!reviewArr.length){
		$list.empty();
		$none.show();
		return;
	}
	$none.hide();
	$list.empty();
	
	console.log('shopOwnerId:', $('#shopOwnerId').val());
		
	$("#reviewList").empty();	
	reviewArr.forEach(r => {
		const reply = reviewreplyMap[r.rno];		
		const shopId = r.s_id;
								
		console.log(`-- 리뷰 ${r.rno} 에 대한 ownerReplyHtml:`, reviewreplyMap[r.rno]);
		console.log('loginId:', loginId, 'shopOwnerId:', shopOwnerId, 'reply', reply);
		let isMine = (loginId && r.id == loginId);
		let buttons = '';
		if(isMine){
			buttons += `
				<button class="modifyReview btn btn-outline-success btn-sm" data-no="${r.rno}" data-sid="${shopId}">
					<i class="bi bi-journal-text">수정</i>
				</button>
				<button class="deleteReview btn btn-outline-dark btn-sm" data-no="${r.rno}" data-sid="${shopId}">
					<i class="bi bi-telephone-outbound">삭제</i>
				</button>				
			`;
		} else {
			buttons += `
				<button class="btn btn-outline-danger btn-sm" onclick="reportReview('${r.rno}')">
					<i class="bi bi-telephone-outbound">신고</i>
				</button>
			`;
		}
		let date = new Date(r.regDate);
							let strDate = date.getFullYear() + "-" + ((date.getMonth() + 1 < 10)
															? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)) + "-"
															+ (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + " "
															+ (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + ":"
															+ (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) + ":"
															+ (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds());
	
		
		let ownerReplyHtml = '';
		if(reviewreplyMap[r.rno]){
			if(loginId == shopOwnerId){
			ownerReplyHtml =`
			<div class="card p-2 bg-light border-info" style="border-left:4px solid #3498db;">
													<div class="d-flex align-items-center mb-1">
														<span class="fw-bold text-primary">
															<i class="bi bi-person-badge"></i>사장님
														</span>
														<span class="text-muted small ms-2">${new Date(r.regDate).toLocaleString()}</span>
														<div class="ms-auto">
															<button type="button" class="btn btn-outline-primary btn-sm px-3 modifyReviewReply" 
															data-rrno="${reply.rrNo}" 
															data-rno="${r.rno}"
															data-sid="${shopId}">수정</button>
														  <button type="button" class="btn btn-outline-danger btn-sm px-3 deleteReviewReply" 
															data-rrno="${reply.rrNo}" 
															data-sid="${shopId}">삭제</button>
														</div>										
													</div>
													<div class="ms-3 fs-5 py-2">${reply.content}</div>
												</div>
												<div class="reviewReplyForm d-none mt-2">
													<form>			
												   <input type="hidden" name="rNo"  value="${r.rno}">
													 <input type="hidden" name="sId"  value="${shopId}">
													 <input type="hidden" name="rrNo" value="${reply.rrNo}">											
														<textarea name="content" class="form-control fs-5 py-3 mb-2" rows="3" maxlength="250" placeholder="사장님 댓글 수정"></textarea>
														<div class="text-end">
															<button type="submit" class="btn btn-success px-4 me-1">수정완료</button>															
														</div>
													</form>
												</div>
			`;
			
		} else {
			ownerReplyHtml =`
			<div class="card p-3 bg-light border-info mt-3" style="border-left:4px solid #3498db;">
				<div class="d-flex align-items-center mb-1">
					<span class="fw-bold text-primary">
						<i class="bi bi-person-badge"></i>사장님
					</span>
					<span class="text-muted small ms-2">${childDate(reviewreplyMap[r.rno].regDate)}</span>
				</div>
				<div class="ms-3 fs-5 py-2">${reviewreplyMap[r.rno].content}</div>
			</div>
			`;
		}
		} else if (loginId == shopOwnerId) {			
			ownerReplyHtml =	`
			<div class="mt-2 text-end">
					<button type="button" class="btn btn-outline-primary btn-sm px-2 py-0 review-reply-btn" data-review-no="${r.rno}">
							<i class="bi bi-person-badge"></i>사장님 댓글쓰기
					</button>
			</div>
			<div class="reviewReplyForm d-none p-3 rounded shadow-sm mt-2" style="background:#f8fafc;">
					<form class="review-reply-form">
						<input type="hidden" name="rNo" value="${r.rno}">
						<input type="hidden" name="sId" value="${shopId}">						
						<textarea name="content" class="form-control fs-5 py-3 mb-2" rows="3" maxlength="250" placeholder="사장님 댓글을 입력하세요" style="resize: none;"></textarea>
						<div class="text-end mt-2">
							<button type="submit" class="btn btn-success px-4 me-1">등록</button>
						</div>
					</form>
			</div>
			`;
		}
		let reviewHtml = `
		<div class="reviewRow border-bottom pb-3 mb-3" data-rno="${r.rno}">
						<div class="d-flex align-items-center mb-1">
							<span class="fw-bold">${r.id.substr(0,2)}**님</span>
							<span class="text-muted small ms-2">${new Date(r.regDate).toLocaleString()}</span>
							<div class="ms-auto">
								${buttons}
							</div>
					</div>
					<div class="mb-1">
						<span class="me-2 text-warning"><i class="bi bi-star-fill"></i></span>
						<span class="fw-bold ms-1">${r.rating}점</span>
					</div>
					${r.rpicture ? `<div>
							<img src="/images/review/${r.rpicture}?t=${Date.now()}" alt="리뷰사진" 
								style="max-width:200px;" class="rounded shadow-sm mb-2" />
					</div>` : ''}
					<div class="text-secondary small mb-1"><span>${r.menuName}</span></div>
					<div class="review-content">${r.content}</div>
					${ownerReplyHtml}
					</div>
		`;
		
		console.log("   appending reviewHtml:", /* reviewHtml 변수 */);
		$list.append(reviewHtml);		
	});
}

// 대댓글 날짜 함수
function childDate(rawDate) {
    const date = new Date(rawDate);
    return date.getFullYear() + "-"
        + ((date.getMonth() + 1 < 10) ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)) + "-"
        + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + " "
        + (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + ":"
        + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) + ":"
        + (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds());
}

// 리뷰 폼 리셋
function resetReviewForm(){
	$("#reviewFormOriginalContainer").append($("#reviewForm").addClass("d-none"));
	let $form = $("#reviewForm").find("form");
	console.log('$form.length:', $form.length, '$form:', $form);
	if($form.length && $form[0]){
		$form.attr("id", "reviewWriteForm").removeAttr("data-no");
		$form[0].reset();
		$form.find("#reviewSubmitButton").val("댓글쓰기").text("댓글쓰기");
		$form.find("#reviewContent").val("");
		$form.find('input[name="rating"]').prop('checked',false);
		$form.find("#imgPreview").hide().attr('src', '');
		
		//console.log("리뷰폼 구조:", $("#reviewForm").html());
		console.log("폼 개수:", $("#reviewForm").find("form").length);
	}
	
	if(previewUrl){URL.revokeObjectURL(previewUrl); previewUrl = null;}
	lastEditRno = null;
}




  const reader = new FileReader();
  reader.onload = function (e) {
    $imgPreview.attr('src', e.target.result).show();
  };
  reader.readAsDataURL(file);
});

// 리뷰 사진 미리보기
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


// 결제 수단 및 버튼 클릭시
let selectedMethod = null;

$('.payment-method').on('click', function(){
	
	$('.payment-method')
		.removeClass('active')
		.addClass('btn-outline-secondary')
		.removeClass('btn-secondary');

		$(this).addClass('active btn-secondary').removeClass('btn-outline-secondary');
		
		selectedMethod = $(this).data('method');
		
		$('#btnPayNow').prop('disabled', false);
});



// pay.html의 결제하기 버튼 클릭 이벤트
$(document).on("click", "#btnPayNow", function() {
	if(!selectedMethod){
		alert('결제 수단을 선택해주세요');
		return;
	}
    // 1. 입력된 정보 수집
    const address1 = $("input[name='address1']").val();
    const address2 = $("input[name='address2']").val();
    const phone = $("#phone").val();
    const orderRequest = $("#orderRequest").val();
    const safeNum = $("#safeNum").is(":checked");

    // 2. 필수 입력 값 검증
    if (!address1 || !address2 || !phone) {
        alert("필수 입력 항목(주소, 상세주소, 휴대전화번호)을 모두 입력해주세요.");
        return;
    }

    // 3. 주문표에서 정보 수집
    const orderedItems = [];
    $(".cart-main-item").each(function() {
        const mainItem = {
            menuName: $(this).find(".fw-bold.small.mb-1").text().split(' : ')[0],
            totalPrice: parseInt($(this).find(".fw-bold.small.mb-1").text().split(' : ')[1].replace(/[^0-9]/g, '')),
            options: []
        };

        $(this).find(".cart-option-item").each(function() {
            mainItem.options.push($(this).text().trim());
        });
        orderedItems.push(mainItem);
    });

    // --- DEBUGGING finalTotalPrice START ---
    const totalOrderPriceDiv = $("#totalOrderPrice");
    console.log("DEBUG: Parent element #totalOrderPrice:", totalOrderPriceDiv);
    console.log("DEBUG: Parent element #totalOrderPrice length:", totalOrderPriceDiv.length);

    let finalTotalPrice = 0;
    if (totalOrderPriceDiv.length > 0) {
        const totalPriceSpan = totalOrderPriceDiv.find("span");
        console.log("DEBUG: Child span element:", totalPriceSpan);
        console.log("DEBUG: Child span element length:", totalPriceSpan.length);

        if (totalPriceSpan.length > 0) {
            const rawPrice = totalPriceSpan.attr("data-price");
            console.log("DEBUG: Raw data-price attribute value from span:", rawPrice);
            finalTotalPrice = parseInt(rawPrice) || 0;
            console.log("DEBUG: Parsed finalTotalPrice from span:", finalTotalPrice);
        } else {
            console.log("DEBUG: Span element inside #totalOrderPrice not found.");
            // Fallback: try to parse from the text content of the div if span is not found or data-price is missing
            const textPrice = totalOrderPriceDiv.text().replace(/[^0-9]/g, '');
            finalTotalPrice = parseInt(textPrice) || 0;
            console.log("DEBUG: Fallback: Parsed finalTotalPrice from div text:", finalTotalPrice);
        }
    } else {
        console.log("DEBUG: #totalOrderPrice div not found.");
    }
    console.log("--- DEBUGGING finalTotalPrice END ---");

    // 4. 수집된 정보 콘솔에 출력 (확인용)
    console.log("--- 결제 요청 정보 ---");
    console.log("주소:", address1);
    console.log("상세주소:", address2);
    console.log("휴대전화번호:", phone);
    console.log("안심번호 사용:", safeNum);
    console.log("요청사항:", orderRequest);
    // console.log("주문 메뉴:", orderedItems); // 이 값은 preparePayment AJAX 호출에 직접 사용되지 않습니다.
    console.log("총 결제 금액:", finalTotalPrice);
    console.log("----------------------");

    // 5. AJAX로 서버에 결제 준비 요청
    $.ajax({
        url: "/preparePayment", // 서버의 결제 준비 엔드포인트
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            address1: address1,
            address2: address2,
            phone: phone,
            orderRequest: orderRequest,
            safeNum: safeNum,
            finalTotalPrice: finalTotalPrice,
						paymentMethod: selectedMethod,
            // 장바구니 정보는 서버에서 다시 조회하거나, 필요하다면 여기서도 보낼 수 있습니다.
            // 여기서는 서버에서 장바구니 정보를 다시 조회한다고 가정합니다.
            userId: window.currentUserId,   // 로그인한 사용자 ID 명시적으로 전달
            guestId: window.currentGuestId  // 게스트 ID 명시적으로 전달
        }),
        success: function(response) {
            if (response.success && response.paymentData) {
                // PortOne 결제 시작
                // response.orderId를 merchant_uid로 사용
                response.paymentData.merchant_uid = response.orderId; 
                
                PortOne.requestPayment(response.paymentData)
                    .then(function(payment) {
                        console.log("Payment object from PortOne.requestPayment:", payment); // 추가된 로그
                        console.log("imp_uid:", payment.imp_uid); // imp_uid 확인
                        console.log("merchant_uid:", payment.merchant_uid); // merchant_uid 확인

                        if (payment.code !== undefined) {
                            alert("결제 실패: " + payment.message);
                            console.error("PortOne Error:", payment);
                        } else {
                            // 결제 성공 시 서버에 최종 확인 요청
                            $.ajax({
                                url: "/completePayment", // 서버의 결제 완료 엔드포인트
                                type: "POST",
                                contentType: "application/json",
                                data: JSON.stringify({
                                    paymentId: payment.paymentId, // PortOne SDK가 반환한 paymentId 사용
                                    orderId: response.orderId, // 백엔드에서 미리 생성한 orderId 사용
                                    paymentMethod: selectedMethod // 선택된 결제 수단 추가
                                }),
                                success: function(completeResponse) {
                                    if (completeResponse.success) {
                                        alert("결제가 성공적으로 완료되었습니다!");
                                        window.location.href = "/end?orderId=" + encodeURIComponent(completeResponse.orderNo); // 결제 완료 페이지로 이동
                                    } else {
                                        alert("결제 완료 처리 중 오류가 발생했습니다: " + completeResponse.message);
                                    }
                                },
                                error: function(xhr, status, error) {
                                    console.error("결제 완료 서버 통신 오류:", status, error, xhr.responseText);
                                    alert("결제 완료 처리 중 서버 통신 오류가 발생했습니다.");
                                }
                            });
                        }
                    })
                    .catch(function(error) {
                        // PortOne SDK 오류
                        console.error("PortOne SDK 오류:", error);
                        alert("결제 중 오류가 발생했습니다. 다시 시도해주세요.");
                    });
            } else {
                alert("결제 준비 중 오류가 발생했습니다: " + (response.message || "알 수 없는 오류"));
            }
        },
        error: function(xhr, status, error) {
            console.error("결제 준비 서버 통신 오류:", status, error, xhr.responseText);
            alert("결제 준비 중 서버 통신 오류가 발생했습니다.");
        },
        beforeSend: function(xhr) { // 요청 보내기 직전
            const requestData = JSON.parse(this.data); // 보내려는 데이터를 파싱
            console.log("Sending to /preparePayment:", requestData); // 이 로그를 추가
        }
    });
});


