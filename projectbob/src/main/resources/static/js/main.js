console.log("main.js (top): window.currentUserId =", window.currentUserId);
var selectedMenuId = null;
var selectedMenuName = '';
var selectedMenuPrice = 0;
var selectedShopId = null;
var currentQuantity = 1; // 'count' 대신 'currentQuantity'로 변수명 변경 (혼동 방지)
//window.currentUserId = null;  // 로그인 시 서버에서 주입 (예: Thymeleaf)
//window.currentGuestId = null; // 서버에서 발급받아 세션에 있으면 가져옴
var currentCartData = []; 
var currentTotalPrice = 0;
var currentTotalQuantity = 0;


var defaultMenuImage = "https://i.imgur.com/Sg4b61a.png";

// ==============================
// 주문하기 버튼 클릭 이벤트
// ==============================
$(document).ready(function() {
  $('#btnOrderNow').on('click', function(e) {
    e.preventDefault();

    console.log('주문하기 버튼 클릭 이벤트 시작');
	
    if (!currentCartData || currentCartData.length === 0) {
      alert('장바구니가 비어있습니다. 메뉴를 추가해주세요.');
      console.log('장바구니 비어있음 - currentCartData:', currentCartData);
      return;
    }

    if (!window.currentUserId || window.currentUserId.trim() === '') {
      alert('로그인이 필요합니다.');
      console.log('로그인 필요 - currentUserId:', window.currentUserId);
	  
	const currentUrl = encodeURIComponent(window.location.href);
	   window.location.href = `/login?redirectURL=${currentUrl}`;
      return;
    }


    const totalText = $('#totalOrderPrice').text();
    console.log('총 결제 금액 텍스트:', totalText);
    const totalMatch = totalText.match(/([\d,]+)원/);
    const totalPrice = totalMatch ? parseInt(totalMatch[1].replace(/,/g, '')) : NaN;
    console.log('파싱된 총 결제 금액 (숫자):', totalPrice);

    const shopMinPriceStr = $('.shopMinPrice').val();
    const shopMinPrice = parseInt(shopMinPriceStr) || 0;
    console.log('최소 주문 금액 (문자열):', shopMinPriceStr);
    console.log('최소 주문 금액 (숫자):', shopMinPrice);
		
    if (isNaN(shopMinPrice)) {
      alert('최소 주문 금액이 맞지 않습니다.');
      return;
    }
    if (isNaN(totalPrice)) {
      alert('총 결제 금액이 올바르지 않습니다.');
      return;
    }

    if (totalPrice < shopMinPrice) {
      alert(`최소 주문 금액은 ${shopMinPrice.toLocaleString()}원입니다.\n결제 금액을 추가해주세요.`);
      console.log(`최소 주문 금액 미만 - totalPrice: ${totalPrice}, shopMinPrice: ${shopMinPrice}`);
      return;
    }

    console.log('모든 조건 충족 - 결제 페이지로 이동');
    window.location.href = '/pay';
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
	
	$("#nutritionInfo tbody tr").addClass("d-none");
	  $(`#nutritionInfo tbody tr[data-mid='${selectedMenuId}']`).removeClass("d-none");

  // 메뉴 옵션 비동기 로드
	$.ajax({
	    url: "/ajax/menu/options",
	    data: { mId: selectedMenuId },
			success: function (options) {
			  console.log("옵션 목록 전체:", options);
			  if (options && options.length > 0) {
			    options.forEach(option => {
			      console.log(`moId: ${option.moId}, content: ${option.content}, mOption: ${option.moption}, price: ${option.price}`);
			    });

					const html = options.map(option => `
					  <div class="form-check">
					    <input class="form-check-input" type="checkbox" id="option-${option.moId}" value="${option.moId}" data-price="${option.price}">
							<label class="form-check-label" for="option-${option.moId}">
							  ${option.moption} [ ${option.content} ] - ${option.price.toLocaleString()}원
							</label>
					  </div>
					`).join('');
			    $("#optionArea").html(html);
			  } else {
			    $("#optionArea").html("<p class='text-muted small'>선택 가능한 옵션이 없습니다.</p>");
			  }

			  new bootstrap.Modal(document.getElementById("addMenuModal")).show();
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

// 모달이 완전히 숨겨진 후 이벤트 리스너 추가
$('#addMenuModal').on('hidden.bs.modal', function () {
  console.log("모달이 완전히 숨겨졌습니다. 포커스 관련 문제 확인."); // 추가: 모달 완전 숨김 시점 로그
  // 필요하다면 여기에 포커스를 다른 요소로 옮기는 로직 추가
  // 예: $(document.body).focus();
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

  const $btnAddExtras = $(this);
  $btnAddExtras.prop('disabled', true); // 버튼 비활성화

  $.ajax({
    type: "POST",
    url: "/addCart", 
    contentType: "application/json",
    data: JSON.stringify(cartItemsToSend),
    success: function (response) {
			
      if (response.success && response.cartList) {
        console.log("장바구니에 추가되었습니다.");
        console.log(response);
 
      
        currentCartData = response.cartList;
        currentTotalPrice = response.totalPrice;
     

        updateOrderSummary(currentCartData, currentTotalPrice);

        const modalEl = document.getElementById("addMenuModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide(); 
				
				$(".modal-backdrop").remove();
				$("body").removeClass("modal-open");
				
        console.log("모달이 숨겨졌습니다."); // 추가: 모달 숨김 시점 로그
        $("#btnAddExtras").blur(); // 버튼에서 포커스 제거 
      } else {
        console.error("장바구니 추가 실패:", response.message || "알 수 없는 오류");
        alert("장바구니 추가 실패: " + (response.message || "알 수 없는 오류"));
      }
    },
    error: function (xhr, status, error) {
      console.error("서버 오류:", status, error, xhr.responseText);
      alert("서버 오류로 인해 장바구니 추가 실패. 잠시 후 다시 시도해주세요.");
    },
    complete: function() {
      $btnAddExtras.prop('disabled', false); // 요청 완료 후 버튼 다시 활성화
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
    window.currentUserId = guestInfoElem.dataset.userId; 
    console.log("DEBUG: window.currentUserId after init: ", window.currentUserId);
    console.log("DEBUG: window.currentGuestId after init: ", window.currentGuestId);
  }
  loadCartItems();
});


// ==============================
// 주문표(장바구니) UI 업데이트 함수
// cartList: 서버에서 받은 전체 장바구니 항목 리스트
// totalCartPrice: 서버에서 계산된 전체 장바구니의 총 가격
// ==============================
function updateOrderSummary(cartList, totalCartPrice) {
	console.log(" cartList 전체 확인:", cartList); 
	
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
		console.log(" 메인 메뉴 목록 가져오기:", mainMenus);

    mainMenus.forEach(mainItem => {
        // 해당 메인 메뉴에 딸린 옵션 필터링
        const options = cartList.filter(opt => opt.caPid != null && opt.caPid === mainItem.caId);

        let optionHtml = "";
				options.forEach(opt => {
				    const optName = opt.optionName || "옵션명 없음";
				    const optPrice = opt.unitPrice || 0;
				    const moption = opt.moption || "";
				    const optionGroup = opt.optionGroupName || ""; // ✅ 새로 추가

				    console.log(`   └ 옵션명: ${optName}, moption: ${moption}, 옵션그룹: ${optionGroup}, 가격: ${optPrice}`);

				    optionHtml += `
				        <div class="text-muted small ms-3 mb-1 cart-option-item" data-ca-id="${opt.caId}">
				          └ 옵션: ${optName} ${optionGroup ? `[${optionGroup}]` : ''} (+${optPrice.toLocaleString()}원)
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

$(document).off("click", ".btn-delete-main-item").on("click", ".btn-delete-main-item", function () {
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
                console.log("항목 삭제 실패: " + (response.message || "알 수 없는 오류"));
            }
        },
        error: function(xhr, status, error) {
            console.error("항목 삭제 서버 오류:", status, error, xhr.responseText);
            console.log("항목 삭제 중 서버 오류가 발생했습니다.");
        }
    });
}

function updateOverallTotalPriceDisplay(totalCartPrice){
	const $totalOrderPriceDisplay = $("#totalOrderPrice");
	$totalOrderPriceDisplay.text(`총 결제 금액 : ${totalCartPrice.toLocaleString()}원`).removeClass("d-none").show();
}

// ==============================
// 전체 장바구니 총 결제 금액만 업데이트하는 함수
// ==============================
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

// =====================
//거리정렬 버튼
// =====================

$(document).ready(function () {
  // 정렬 버튼 클릭 이벤트
  $('.sort-distance-option').click(function (e) {
    e.preventDefault();
    const sortOrder = $(this).data('sort'); // 'asc' 또는 'desc'

    // 거리 리스트가 있는 영역으로 스크롤 이동
    const scrollTarget = $('.row.g-4');
    if (scrollTarget.length) {
      $('html, body').animate({
        scrollTop: scrollTarget.offset().top - 70
      }, 400);
    }

    // 카드 컨테이너 안의 가게들
    const container = $('.row.g-4');
    const shops = container.children('.col-12.col-md-6.col-lg-4');

    // 배열로 변환 후 거리 기준 정렬
    const sortedShops = shops.toArray().sort((a, b) => {
      const distA = parseDistance($(a).find('.distance-info').text());
      const distB = parseDistance($(b).find('.distance-info').text());

      if (sortOrder === 'asc') {
        return distA - distB;
      } else {
        return distB - distA;
      }
    });

    // 정렬 결과를 다시 컨테이너에 삽입
    container.empty();
    sortedShops.forEach(el => container.append(el));
  });

  // 거리 텍스트를 숫자(km 단위)로 변환하는 함수
  function parseDistance(text) {
    if (!text || typeof text !== 'string') return Number.MAX_VALUE;

    const mMatch = text.match(/([\d.,]+)\s*m/);
    const kmMatch = text.match(/([\d.,]+)\s*km/);

    if (mMatch) {
      return parseFloat(mMatch[1].replace(',', '.')) / 1000;
    } else if (kmMatch) {
      return parseFloat(kmMatch[1].replace(',', '.'));
    }

    return Number.MAX_VALUE; // 거리 정보 없으면 정렬 맨 뒤로 보내기
  }
});

// =========================================================================
// #location-input 값으로 가게와의 거리 구하기 
// =========================================================================
$(document).ready(function() {
    const geocoder = new kakao.maps.services.Geocoder();

    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    function updateDistances(userLat, userLng) {
        const $shops = $('[data-address]');
        let processedCount = 0;

        $shops.each(function() {
            const $shop = $(this);
            const shopAddress = $shop.attr('data-address');
            if (!shopAddress) {
                $shop.find('.distance-info').text('주소 정보 없음');
                processedCount++;
                if(processedCount === $shops.length) {
                    console.log('모든 거리 계산 완료');
                }
                return true; // continue
            }

            geocoder.addressSearch(shopAddress, function(result, status) {
                if (status === kakao.maps.services.Status.OK) {
                    const shopLat = parseFloat(result[0].y);
                    const shopLng = parseFloat(result[0].x);

                    const distanceKm = getDistanceFromLatLonInKm(userLat, userLng, shopLat, shopLng);
                    const distanceText = distanceKm < 1
                        ? Math.round(distanceKm * 1000) + ' m'
                        : distanceKm.toFixed(2) + ' km';

                    $shop.find('.distance-info').text('거리: ' + distanceText);
                } else {
                    $shop.find('.distance-info').text('거리 계산 실패');
                }
                processedCount++;
                if(processedCount === $shops.length) {
                    console.log('모든 거리 계산 완료');
                }
            });
        });
    }

    function searchAddressAndUpdateDistance() {
        const address = $('#location-input').val().trim();
        if (!address) {
            alert('주소를 입력해주세요.');
            return;
        }

        geocoder.addressSearch(address, function(result, status) {
            if (status === kakao.maps.services.Status.OK) {
                const userLat = parseFloat(result[0].y);
                const userLng = parseFloat(result[0].x);
                updateDistances(userLat, userLng);
            } else {
                alert('주소를 찾을 수 없습니다.');
            }
        });
    }

		if ($('#location-input').length > 0 && $('#location-input').val() && $('#location-input').val().trim() !== '') {
		    searchAddressAndUpdateDistance();
		}

    $('#addressInputSearchBtn').click(function() {
        searchAddressAndUpdateDistance();
    });
});
// =========================================================================
// DOMContentLoaded 이벤트 리스너 통합 및 카카오 지도 API 로드 개선
// =========================================================================
//input버튼 클릭시 주소 검색창
$(document).ready(function() {
    // 필요한 HTML 요소들을 가져옵니다.
    const mainAddressInput = document.getElementById('location-input');
    const addressPopupWrapper = document.querySelector('.address-popup-wrapper');
    const closeAddressSectionBtn = document.getElementById('closeAddressSectionBtn');
    const popupOverlay = document.querySelector('.popup-overlay');

    // 검색된 주소 표시 영역
    const searchedAddressResultDiv = document.getElementById('searchedAddressResult');
    const searchedPostcodeP = document.getElementById('searchedPostcode');
    const searchedAddressP = document.getElementById('searchedAddress');
    const searchedDetailAddressInput = document.getElementById('searchedDetailAddress');
    const selectSearchedAddressBtn = document.getElementById('selectSearchedAddressBtn'); // 검색된 주소 선택 버튼

    // '주소 검색' 버튼 (이전 'open-postcode-search' ID 유지)
    const openPostcodeSearchBtn = document.getElementById('open-postcode-search');
    const searchAddressInput = document.getElementById('searchAddressInput'); // 새로운 검색 입력 필드

    // 팝업 열기 함수
    function openAddressPopup() {
        if (addressPopupWrapper) {
            addressPopupWrapper.classList.add('show');
            addressPopupWrapper.classList.remove('d-none'); 

            if (popupOverlay) {
                popupOverlay.classList.remove('d-none');
            }
            console.log("배달주소입력 필드 클릭됨: 주소 팝업 표시.");
            // 팝업이 열리면 검색 입력 필드에 포커스
            if (searchAddressInput) {
                searchAddressInput.focus();
            }
						//loadAndPopulateSavedAddresses(); 
        }
    }

    // 팝업 닫기 함수
    function closeAddressPopup() {
        if (addressPopupWrapper) {
            addressPopupWrapper.classList.remove('show');
            addressPopupWrapper.classList.add('d-none'); 

            if (popupOverlay) {
                popupOverlay.classList.add('d-none');
            }
            console.log("주소 팝업 닫힘.");
            // 팝업 닫을 때 검색 결과 초기화 (선택 사항)
            searchedAddressResultDiv.classList.add('d-none');
            searchedPostcodeP.textContent = '우편번호: ';
            searchedAddressP.textContent = '기본 주소: ';
            searchedDetailAddressInput.value = '';
            searchAddressInput.value = ''; // 검색창도 비움
        }
    }

    // 1. 'location-input' 클릭 이벤트: 팝업 열기
    if (mainAddressInput) {
        mainAddressInput.addEventListener('click', openAddressPopup);
    }

    // 2. '닫기' 버튼 클릭 이벤트: 팝업 닫기
    if (closeAddressSectionBtn) {
        closeAddressSectionBtn.addEventListener('click', closeAddressPopup);
    }

    // 3. (선택 사항) 오버레이 클릭 시 팝업 닫기
    if (popupOverlay) {
        popupOverlay.addEventListener('click', closeAddressPopup);
    }

    // --- 새로운 기능 관련 JavaScript ---

    // 4. '검색' 버튼 클릭 이벤트 (open-postcode-search): 현재는 alert만 띄움
		if (openPostcodeSearchBtn) {
		    openPostcodeSearchBtn.addEventListener('click', function() {
		        const query = searchAddressInput.value.trim(); // 검색어 가져오기

		        if (!query) {
		            alert('검색어를 입력해주세요.');
		            return;
		        }

		        // 카카오 주소 검색 API 호출을 위한 객체 생성
		        // 이 부분이 실행되려면 HTML에 카카오 지도 API 스크립트가 로드되어 있어야 합니다.
		        // <script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_APP_KEY&libraries=services"></script>
		        if (typeof kakao === 'undefined' || !kakao.maps || !kakao.maps.services) {
		            console.error("카카오 지도 API 또는 서비스 라이브러리가 로드되지 않았습니다. 주소 검색을 수행할 수 없습니다.");
		            alert("주소 검색 기능을 사용할 수 없습니다. 잠시 후 다시 시도하거나 개발자 도구 콘솔을 확인해주세요.");
		            return;
		        }

		        const geocoder = new kakao.maps.services.Geocoder();

		        // 주소 검색 실행
		        geocoder.addressSearch(query, function(result, status) {
		            if (status === kakao.maps.services.Status.OK) {
		                if (result.length > 0) {
		                    // 검색 결과가 있을 경우
		                    const firstResult = result[0]; // 첫 번째 결과 사용
		                    const postCode = firstResult.road_address ? firstResult.road_address.zone_no : firstResult.address.zip_code;
		                    const mainAddress = firstResult.road_address ? firstResult.road_address.address_name : firstResult.address.address_name;

		                    // 결과 표시
		                    searchedPostcodeP.textContent = `우편번호: ${postCode || '정보 없음'}`;
		                    searchedAddressP.textContent = `기본 주소: ${mainAddress}`;
		                    searchedAddressResultDiv.classList.remove('d-none'); // 검색 결과 영역 표시

		                    // 상세 주소 입력 필드를 초기화하거나 유지할 수 있습니다.
		                    searchedDetailAddressInput.value = '';

		                } else {
		                    // 검색 결과가 없을 경우
		                    alert('입력하신 검색어에 대한 주소 검색 결과가 없습니다.');
		                    searchedAddressResultDiv.classList.add('d-none'); // 검색 결과 영역 숨김
		                }
		            } else {
		                // API 호출 자체에 실패한 경우
		                console.error("카카오 주소 검색 실패:", status, result);
		                alert('주소 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
		                searchedAddressResultDiv.classList.add('d-none'); // 검색 결과 영역 숨김
		            }
		        });
		    });
		}

    // 5. '이 주소 선택' 버튼 클릭 이벤트: 메인 input에 반영하고 팝업 닫기
	if (selectSearchedAddressBtn && mainAddressInput) {
	    selectSearchedAddressBtn.addEventListener('click', function() {
	        const basicAddress = searchedAddressP.textContent.replace('기본 주소: ', '');

	        if (basicAddress && basicAddress !== '기본 주소: ') { // 실제 주소가 있는지 확인
	            mainAddressInput.value = basicAddress;
	            closeAddressPopup(); // 팝업 닫기
	        } else {
	            alert('선택할 주소가 없습니다. 먼저 주소를 검색해주세요.');
	        }
	    });
	}


});

//pay 주소변경 버튼
$('#openAddressPopupBtn').on('click', function() {
    const addressModalEl = document.getElementById('addressModal2');
    const addressModal = new bootstrap.Modal(addressModalEl);
    addressModal.show();

    loadAndPopulateSavedAddresses2();
});

// 모든 DOMContentLoaded 관련 스크립트를 하나의 jQuery $(document).ready() 블록으로 통합
$(document).ready(function() {
		
    // 탭 전환 시 가게 지도 표시
    $('a[href="#info"]')?.on('shown.bs.tab', function () {
        showStoreOnMap();
    });

		
		  function waitForKakaoAndInit() {
		       if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.services) {
		           // 주소 검색 초기화
		           initAddressSearchInput();
		           console.log("주소 검색 기능 초기화 완료.");

		           // 현재 위치 검색 초기화
		           handleCurrentLocationSearch();
		           console.log("현재 위치 검색 기능 초기화 완료.");
		       } else {
		           console.warn("카카오 지도 API가 아직 준비되지 않아 200ms 후 재시도");
		           setTimeout(waitForKakaoAndInit, 200);
		       }
		   }
		   waitForKakaoAndInit();

		   // --- 주소 입력값 로컬스토리지 복원 ---
		   const locationInput1 = document.getElementById('location-input');
		   if (locationInput1) {
		       const savedAddress = localStorage.getItem("userAddress");
		       if (savedAddress) {
		           locationInput1.value = savedAddress;
		       }
		       locationInput1.addEventListener("input", () => {
		           localStorage.setItem("userAddress", locationInput1.value);
		       });
		   }
			

	const searchMenuBtn = document.getElementById('searchMenuBtn');
	const searchBox = document.getElementById('searchBox');

	// 검색 버튼에 클릭 이벤트 리스너를 추가합니다.
	if (searchMenuBtn && searchBox) {
	       searchMenuBtn.addEventListener('click', function() {
	           searchBox.classList.toggle('d-none');
	           // 검색창이 나타나면 input에 포커스
	           if (!searchBox.classList.contains('d-none')) {
	               // searchBox 내부의 input에 id가 있다면 사용
	               const inputInsideSearchBox = searchBox.querySelector('input[type="text"]');
	               if (inputInsideSearchBox) {
	                   inputInsideSearchBox.focus();
	               }
	           }
	       });
	       console.log("돋보기 검색창 토글 기능 초기화 완료.");
	   } else {
	       console.warn("경고: 'searchMenuBtn' 또는 'searchBox' 요소를 찾을 수 없어 돋보기 검색 기능을 초기화할 수 없습니다.");
	   }


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
	
	const categoryLinks = document.querySelectorAll('.nav.flex-nowrap li a');

	if (locationInput) {
	  // 로컬스토리지에서 복원 (필요시)
	  const savedInputAddress = localStorage.getItem('inputaddress');
	  if (savedInputAddress) {
	    locationInput.value = savedInputAddress;
	  }

	  // 주소 입력 시 로컬스토리지에 저장
	  locationInput.addEventListener('input', () => {
	    localStorage.setItem('inputaddress', locationInput.value);
	  });
	}

	if (categoryLinks.length > 0) {
	  categoryLinks.forEach(link => {
	    link.addEventListener('click', (e) => {
	      e.preventDefault();
	      const url = new URL(link.href, window.location.origin);
	      const currentAddress = locationInput ? locationInput.value.trim() : '';
	      if (currentAddress) {
	        url.searchParams.set('inputaddress', currentAddress);
	      } else {
	        url.searchParams.delete('inputaddress');
	      }
	      window.location.href = url.toString();
	    });
	  });
	}

});

// ==============================
// 저장된 주소 불러오기 및 팝업 탭에 채우는 함수
// ==============================
function loadAndPopulateSavedAddresses2() {
    $.ajax({
        url: "/getAddress",
        type: "POST",
        success: function(response) {
            if (response.success && response.addressList) {
                populateAddressTabs2(response.addressList);
            } else {
                populateAddressTabs2([]);
            }
        },
        error: function() {
            populateAddressTabs2([]);
        }
    });
}

// ==============================
// 주소록 탭(집, 회사, 그 외)에 주소 데이터 채우는 함수 - 보류 
// ==============================
function populateAddressTabs2(addresses) {
    const $homeTab2 = $('#home-addresses2');
    const $companyTab2 = $('#company-addresses2');
    const $etcTab2 = $('#etc-addresses2');

    $homeTab2.empty();
    $companyTab2.empty();
    $etcTab2.empty();

    if (!addresses || addresses.length === 0) {
        $homeTab2.html('<p class="text-muted">저장된 집 주소가 없습니다.</p>');
        $companyTab2.html('<p class="text-muted">저장된 회사 주소가 없습니다.</p>');
        $etcTab2.html('<p class="text-muted">저장된 기타 주소가 없습니다.</p>');
        return;
    }

    addresses.forEach(addr => {
        const aName2 = (addr.aname || '').trim();
        const addressHtml2 = `
          <div class="saved-address-item2 border p-2 mb-2 rounded" data-address1="${addr.address1}" data-address2="${addr.address2}">
            <div>${addr.address1} ${addr.address2 || ''}</div>
            <button type="button" class="btn btn-sm btn-outline-primary mt-1 select-saved-address-btn2">선택</button>
          </div>
        `;

        if (aName2 === '집') {
            $homeTab2.append(addressHtml2);
        } else if (aName2 === '회사') {
            $companyTab2.append(addressHtml2);
        } else {
            $etcTab2.append(addressHtml2);
        }
    });
}

// ==============================
// 주소 선택 버튼 클릭시 주소 넣고 모달닫기
// ==============================
$(document).on('click', '.select-saved-address-btn2', function() {
    const $parent = $(this).closest('.saved-address-item2');
    const address1 = $parent.data('address1') || '';
    const address2 = $parent.data('address2') || '';

    // 주소 input에 값 설정
    $('input[name="address1"]').val(address1);
    $('input[name="address2"]').val(address2);

    // 모달 닫기
    const modalEl = document.getElementById('addressModal2');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
});


// 쿠폰모달 열기
/*document.getElementById('openCouponModalBtn').addEventListener('click', function() {
  const couponModalEl = document.getElementById('couponModal');
  const couponModal = new bootstrap.Modal(couponModalEl);
  couponModal.show();
});*/

const btn = document.getElementById('openCouponModalBtn');
if (btn) {
  btn.addEventListener('click', function() {
    const couponModalEl = document.getElementById('couponModal');
    const couponModal = new bootstrap.Modal(couponModalEl);
    couponModal.show();
  });
}

// 쿠폰 선택 버튼 클릭 이벤트 예시 (필요 시 추가 동작 구현)
document.addEventListener('click', function(e) {
	if(e.target && e.target.classList.contains('select-coupon-btn')) {
	   const couponName = e.target.dataset.couponName;
	   const disPrice = e.target.dataset.couponDisprice;

	   // input 요소 찾아서 value 세팅 (id로 찾거나 적절히 수정하세요)
	   const couponInput = document.querySelector('input[placeholder^="쿠폰 선택"]');
	   if (couponInput) {
	     couponInput.value = `${couponName} : -${Number(disPrice).toLocaleString()}원`;
	   }
    // 쿠폰모달 닫기
    const couponModalEl = document.getElementById('couponModal');
    const couponModal = bootstrap.Modal.getInstance(couponModalEl);
    if(couponModal) couponModal.hide();
  }
});

//위치찾아주는 함수인듯 ?
function handleCurrentLocationSearch() {
    console.log("handleCurrentLocationSearch 함수 시작");

    if (typeof kakao === 'undefined' || !kakao.maps || !kakao.maps.services) {
        console.error("카카오 지도 API 또는 서비스 라이브러리가 로드되지 않았습니다.");
        return;
    }

    const locationInputField = document.getElementById('location-input');
    const currentLocationSearchBtn = document.getElementById('currentLocationSearchBtn');
    const categoryCards = document.querySelectorAll('.category-card');

    if (!locationInputField || !currentLocationSearchBtn ) {
        console.warn("HTML 요소 누락 - 기능 초기화 실패");
        return;
    }
	
	// categoryCards는 없어도 무방하게 처리하고 싶다면 이벤트 등록도 조건부로
	if (categoryCards.length > 0) {
	  categoryCards.forEach(card => {
	    // ...
	  });
	}

    // 공통 위치 검색 및 페이지 이동 함수
    function searchWithCurrentLocation(categoryTitle) {
       /* if (!navigator.geolocation) {
            alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
            return;
        }*/

/*        navigator.geolocation.getCurrentPosition(
            (position) => {
                //const lat = position.coords.latitude;
                //const lon = position.coords.longitude;
								const lat = 37.4784;  // 관악구청 위도
								const lon = 126.9515; // 관악구청 경도
								
                const geocoder = new kakao.maps.services.Geocoder();
                const coord = new kakao.maps.LatLng(lat, lon);

                geocoder.coord2Address(coord.getLng(), coord.getLat(), (result, status) => {
                    if (status === kakao.maps.services.Status.OK && result.length > 0) {
                        const address = result[0].address.address_name;
                        locationInputField.value = address;

                        const category = encodeURIComponent(categoryTitle || '전체보기');
                        const url = `/shopList?category=${category}&address=${encodeURIComponent(address)}`;
                        window.location.href = url;
                    } else {
                        alert('위치 → 주소 변환 실패');
                        console.error("주소 변환 실패:", status, result);
                    }
                });
            },
            (error) => {
                let errorMessage = '위치 정보를 가져오는 데 실패했습니다.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '위치 정보 권한이 거부되었습니다.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = '위치 정보를 사용할 수 없습니다.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = '위치 요청 시간이 초과되었습니다.';
                        break;
                    default:
                        errorMessage = `알 수 없는 오류: ${error.message}`;
                }
                alert(errorMessage);
                console.error("위치 정보 오류:", error);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );*/
				const lat = 37.4784;  // 관악구청 위도
				const lon = 126.9515; // 관악구청 경도

				const geocoder = new kakao.maps.services.Geocoder();
				const coord = new kakao.maps.LatLng(lat, lon);

				geocoder.coord2Address(coord.getLng(), coord.getLat(), (result, status) => {
				    if (status === kakao.maps.services.Status.OK && result.length > 0) {
				        const address = result[0].address.address_name;
				        locationInputField.value = address;

				        const category = encodeURIComponent(categoryTitle || '전체보기');
				        const url = `/shopList?category=${category}&address=${encodeURIComponent(address)}`;
				        window.location.href = url;
				    } else {
				        alert('위치 → 주소 변환 실패');
				        console.error("주소 변환 실패:", status, result);
				    }
				});
    }

    // 위치찾기 버튼 클릭
	if (currentLocationSearchBtn) {
	  currentLocationSearchBtn.addEventListener('click', () => {
	    console.log("현재 위치 찾기 버튼 클릭");
	    searchWithCurrentLocation("전체보기");
	  });
	} else {
	  console.warn("#currentLocationSearchBtn 버튼을 찾을 수 없습니다.");
	}

    // 카테고리 카드 클릭
    categoryCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault(); // 기존 링크 동작 방지
            const categoryTitle = card.querySelector('.main-category-title')?.innerText || '전체보기';
            console.log(`카테고리 클릭됨: ${categoryTitle}`);
            searchWithCurrentLocation(categoryTitle);
        });
    });

    console.log("이벤트 리스너 등록 완료");
}


// ==============================
// 검색으로 주소 찾기
// ==============================
function initAddressSearchInput() { 
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


//정보탭에서 지도보여주기
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


// 결제 수단 및 버튼 클릭시
var selectedMethod = null;

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
	console.log("DEBUG: selectedMethod:", selectedMethod); // 이 줄 추가
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
					console.log("DEBUG: /preparePayment 응답 전체:", response);
            if (response.success && response.paymentData) {
							console.log("DEBUG: paymentData 전달되는 값:", response.paymentData);
                // PortOne 결제 시작
                // response.orderId를 merchant_uid로 사용 (이전 코드 주석 처리 또는 삭제)
                 response.paymentData.merchant_uid = response.orderId; 
                
								console.log("DEBUG: PortOne.requestPayment에 넘길 config:", response.paymentData);
								
                PortOne.requestPayment(response.paymentData)
                    .then(function(payment) {
                        console.log("Payment object from PortOne.requestPayment:", payment); // 추가된 로그
                        console.log("imp_uid:", payment.imp_uid); // imp_uid 확인
                        console.log("merchant_uid:", payment.merchant_uid); // merchant_uid 확인
												console.log("response.orderId(merchan_uid):", response.orderId);
												console.log("SDK payment object:", payment);
												const merchantUid = response.orderId;
												const paymentId = payment.paymentId;

                        if (payment.code !== undefined) {
                            alert("결제 실패: " + payment.message);
                            console.error("PortOne Error:", payment);														
                        } else {
							const shopId = parseInt($('#shopId').val(), 10);
                            // 결제 성공 시 서버에 최종 확인 요청
														
                            $.ajax({
                                url: "/completePayment", // 서버의 결제 완료 엔드포인트
                                type: "POST",
                                contentType: "application/json",
                                data: JSON.stringify({
																	merchantUid: payment.merchant_uid,
                                    impUid: payment.imp_uid, // PortOne SDK가 반환한 paymentId 사용
                                    //orderId: response.orderId, // 백엔드에서 미리 생성한 orderId 사용
                                    paymentMethod: selectedMethod, // 선택된 결제 수단 추가

                                    // 새로 추가할 필드들
                                    address1: address1,
                                    address2: address2,
                                    phone: phone,
                                    orderRequest: orderRequest,
                                    safeNum: safeNum,
									shopId: shopId,
									totalPrice: finalTotalPrice
                                }),
                                success: function(completeResponse) {
                                    if (completeResponse.success) {
                                        alert("결제가 성공적으로 완료되었습니다!");
                                        window.location.href = "/"; // 메인 페이지로 이동
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
            console.log("Sending to /preparePayment:", requestData); 
        }
    });
});


