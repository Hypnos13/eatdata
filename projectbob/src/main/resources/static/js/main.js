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

    if (!window.currentUserId || window.currentUserId.trim() === '') {
      alert('로그인이 필요합니다.');
      console.log('로그인 필요 - currentUserId:', window.currentUserId);
      return;
    }

    if (!currentCartData || currentCartData.length === 0) {
      alert('장바구니가 비어있습니다. 메뉴를 추가해주세요.');
      console.log('장바구니 비어있음 - currentCartData:', currentCartData);
      return;
    }

    const totalText = $('#totalOrderPrice').text();
    console.log('총 결제 금액 텍스트:', totalText);
    const totalMatch = totalText.match(/([\d,]+)원/);
    const totalPrice = totalMatch ? parseInt(totalMatch[1].replace(/,/g, '')) : NaN;
    console.log('파싱된 총 결제 금액 (숫자):', totalPrice);

    const shopMinPriceStr = $('.shopMinPrice').val();
    const shopMinPrice = parseInt(shopMinPriceStr);
    console.log('최소 주문 금액 (문자열):', shopMinPriceStr);
    console.log('최소 주문 금액 (숫자):', shopMinPrice);
		/*
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
    }*/

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
						loadAndPopulateSavedAddresses(); 
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
            const postcode = searchedPostcodeP.textContent.replace('우편번호: ', '');
            const basicAddress = searchedAddressP.textContent.replace('기본 주소: ', '');
            const detailAddress = searchedDetailAddressInput.value.trim();

            if (basicAddress && basicAddress !== '기본 주소: ') { // 실제 주소가 있는지 확인
                mainAddressInput.value = `${basicAddress} ${detailAddress}`.trim();
                closeAddressPopup(); // 팝업 닫기
            } else {
                alert('선택할 주소가 없습니다. 먼저 주소를 검색해주세요.');
            }
        });
    }

    // --- (이전에 작성했던 다른 JavaScript 코드들은 여기에 유지) ---
    // 돋보기 버튼, 검색 제출 등 기존 기능들은 이 아래에 그대로 붙여넣으시면 됩니다.
    // 카카오맵 API 관련 함수 (handleCurrentLocationSearch, triggerKakaoPostcodeSearch)는 삭제되었습니다.
});

// 모든 DOMContentLoaded 관련 스크립트를 하나의 jQuery $(document).ready() 블록으로 통합
$(document).ready(function() {
		
	
	
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

// ==============================
// 저장된 주소 불러오기 및 팝업 탭에 채우는 함수
// ==============================
function loadAndPopulateSavedAddresses() {
    console.log("저장된 주소 불러오기 AJAX 요청 시작: /getAddress (세션 ID 사용)");

    const savedAddressesSection = document.getElementById('savedAddressesSection');


    $.ajax({
        url: "/getAddress", // 저장된 주소를 가져올 URL
        type: "POST",       // POST 메소드 사용
        success: function(response) {
            console.log("저장된 주소 불러오기 성공: /getAddress 응답:", response);
            
            // 응답 성공 시 (로그인 상태), 탭 영역을 보여주고 데이터를 채웁니다.
            if (savedAddressesSection) { // 요소가 존재하는지 확인
                savedAddressesSection.classList.remove('d-none'); 
            }

            if (response.success && response.addressList) {
                populateAddressTabs(response.addressList); // 불러온 주소로 탭 업데이트
            } else {
                console.error("저장된 주소 로드 실패 (서버 응답):", response.message || "알 수 없는 오류");
                populateAddressTabs([]); // 실패 시 빈 목록 표시 (내부에 '저장된 주소 없음' 메시지 처리)
            }
        },
        error: function(xhr, status, error) {
            //console.error("저장된 주소 로드 서버 오류:", status, error, xhr.responseText);
            
            // 어떤 종류의 오류든 (특히 401) 탭 영역을 숨깁니다.
            if (savedAddressesSection) { // 요소가 존재하는지 확인
                savedAddressesSection.classList.add('d-none'); // 탭 영역 전체 숨김
            }

            // 401 Unauthorized (로그인 필요 없음) 경우에만 경고창을 띄우지 않습니다.
            if (xhr.status === 401) {
                // "로그인이 필요합니다." alert 제거 (요청에 따라)
                console.log("로그인되지 않은 사용자: 저장된 주소 탭 숨김.");
            } else {
                // 그 외 다른 서버 오류는 사용자에게 알립니다.
                alert("주소 조회 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            }
            
            // 탭 섹션을 숨겼으므로 populateAddressTabs([]) 호출은 필요 없습니다.
        }
    });
}

// ==============================
// 주소록 탭(집, 회사, 그 외)에 주소 데이터 채우는 함수 - 보류 
// ==============================
function populateAddressTabs(addresses) {
    const $homeAddressesTab = $('#home-addresses');
    const $companyAddressesTab = $('#company-addresses');
    const $etcAddressesTab = $('#etc-addresses');

    // 기존 내용 비우기
    $homeAddressesTab.empty();
    $companyAddressesTab.empty();
    $etcAddressesTab.empty();
		
		console.log("📦 [populateAddressTabs] 호출됨 - 전체 주소 목록:", addresses);

    if (!addresses || addresses.length === 0) {
        $homeAddressesTab.html('<p class="text-muted">저장된 집 주소가 없습니다.</p>');
        $companyAddressesTab.html('<p class="text-muted">저장된 회사 주소가 없습니다.</p>');
        $etcAddressesTab.html('<p class="text-muted">저장된 기타 주소가 없습니다.</p>');
        return;
    }

    // 주소를 카테고리별로 분류하여 HTML 생성 후 추가
		addresses.forEach(addr => {
		
		    const aNameTrimmed = addr.aname ? addr.aname.trim() : '';
				 console.log(` aName:`, addr.aName, '| trim:', aNameTrimmed);

		    const addressHtml = `
		        <div class="saved-address-item border p-2 mb-2 rounded"
		             data-no="${addr.no}"
		             data-address1="${addr.address1}"
		             data-address2="${addr.address2}"
		             data-aname="${addr.aName}">
		            <div>${addr.address1} ${addr.address2 || ''}</div>
		            <button type="button" class="btn btn-sm btn-outline-primary mt-1 select-saved-address-btn">선택</button>
		        </div>
		    `;
		    
			if (aNameTrimmed === '집') {
			       console.log('집 주소 → home-addresses 탭에 추가');
			       $homeAddressesTab.append(addressHtml);
			   } else if (aNameTrimmed === '회사') {
			       console.log('회사 주소 → company-addresses 탭에 추가');
			       $companyAddressesTab.append(addressHtml);
			   } else {
			       console.log('그 외 주소 → etc-addresses 탭에 추가');
			       $etcAddressesTab.append(addressHtml);
			   }
		});

    // 각 탭에 내용이 없으면 "저장된 주소가 없습니다." 메시지 다시 표시
    if ($homeAddressesTab.children().length === 0) {
        $homeAddressesTab.html('<p class="text-muted">저장된 집 주소가 없습니다.</p>');
    }
    if ($companyAddressesTab.children().length === 0) {
        $companyAddressesTab.html('<p class="text-muted">저장된 회사 주소가 없습니다.</p>');
    }
    if ($etcAddressesTab.children().length === 0) {
        $etcAddressesTab.html('<p class="text-muted">저장된 기타 주소가 없습니다.</p>');
    }
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('select-saved-address-btn')) {
        const savedAddressItem = e.target.closest('.saved-address-item');
        if (!savedAddressItem) return;

        const address1 = savedAddressItem.dataset.address1 || '';

        console.log("선택된 주소1:", address1);

        const mainAddressInput = document.getElementById('location-input');
        if (mainAddressInput) {
            mainAddressInput.value = address1;
        }

        // 직접 팝업 닫기 동작 (closeAddressPopup 함수 없이)
        const addressPopupWrapper = document.querySelector('.address-popup-wrapper');
        const popupOverlay = document.querySelector('.popup-overlay');

        if (addressPopupWrapper) {
            addressPopupWrapper.classList.remove('show');
            addressPopupWrapper.classList.add('d-none');
        }
        if (popupOverlay) {
            popupOverlay.classList.add('d-none');
        }
    }
});

//위치버튼 클릭스 주소 
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

  /*const reviewContent = $("#reviewContent").val().trim();
  if (reviewContent.length === 0) {
      alert("리뷰 내용을 입력하세요~!!!");
      return false; // 제출을 막기 위해 false 반환
  }*/
  if (!$('input[name="rating"]:checked').val()) {
      alert("별점을 선택하세요~!");
      return false;
  }

  const formData = new FormData(this);
  formData.append("oNo", $("#reviewOrdersSelect").val()); // oNo 추가

  // 유효성 검사를 통과했을 때만 AJAX 호출
  if (reviewContent.length > 0 && $('input[name="rating"]:checked').val()) {
      $.ajax({
        url: "reviewWrite.ajax",
        data: formData,
        type: "post",
        processData: false, 
        contentType: false, 
        dataType: "json",
        success: function (resData) {
          console.log('resData: ' ,resData);
          recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId); // 리뷰 목록 새로고침
          $("#reviewWriteForm")[0].reset(); 
          $("#reviewForm").addClass("d-none"); 
        },
        error: function (xhr, status, error) {
          alert("댓글 등록 오류: " + (xhr.responseText || error));
          console.error("댓글 등록 오류:", xhr.responseText);
        }
      });
  }
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
		const loginId = window.currentUserId;
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
		
		// 주문 했던 목록 꺼내기
		const sId = $("#shopId").val();
		const userId = window.currentUserId;

		if (userId && sId){
			$.ajax({
				url: "/ajax/reviewableOrders",
				type: "GET",
				data: {sId:sId},
				success: function(response){
					const $orderSelect = $("#reviewOrdersSelect");
					$orderSelect.empty();
					$orderSelect.append('<option value="">주문을 선택하세요</option>');
					
					if (response && response.length > 0){
						response.forEach(order => {
							const orderText = `${order.menus} (${new Date(order.regDate).toLocaleDateString()})`;
							$orderSelect.append(`<option value="${order.ono}">${orderText}</option>`);
						});
					}
						else{
							$orderSelect.append('<option value="">리뷰 가능한 주문이 없습니다.</option>');
						}
					},
					error: function(xhr, status, error){
						console.error("리뷰 가능한 주문을 불러오는데 실패했습니다.:", error);
						alert("리뷰 가능한 주문을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.");
					}
				})
		}else{
			console.warn("리뷰 가능한 주문을 불러오기 위한 사용자 ID  또는 가게 ID가 없습니다.");
			$("#reviewOrderSelect").empty().append('<option value="">로그인 후 이용해주세요.</option>');
		}	


		
	});
	

	
	// 댓글쓰기 submit
	$(document).on("submit", "#reviewWriteForm", function(e){
		e.preventDefault();
		
		const reviewContent = $("#reviewContent").val().trim();
		if (reviewContent.length === 0) {
			alert("리뷰 내용을 입력하세요~");
			return false;
		}

		if (!$('input[name="rating"]:checked').val()){
			alert("별점을 선택하세요~!");
			return false;
		}
		let formData = new FormData(this);
		formData.append("oNo", $("#reviewOrdersSelect").val());
		
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
				
				recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
				resetReviewForm();
				
				// 리뷰 작성 성공 후, 주문 선택 목록을 다시 불러와 갱신합니다.
				const sId = $("#shopId").val();
				$.ajax({
					url: "/ajax/reviewableOrders",
					type: "GET",
					data: {sId:sId},
					success: function(orders){
						const $orderSelect = $("#reviewOrdersSelect");
						$orderSelect.empty();
						$orderSelect.append('<option value="">주문을 선택하세요</option>');
						if (orders && orders.length > 0){
							orders.forEach(order => {
								const orderText = `${order.menus} (${new Date(order.regDate).toLocaleDateString()})`;
								$orderSelect.append(`<option value="${order.ono}">${orderText}</option>`);
							});
						} else {
							$orderSelect.append('<option value="" disabled>리뷰를 작성할 주문이 없습니다.</option>');
						}
					}
				});
				
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
	
	let $reviewRow = $(this).closest(".reviewRow");
	if(!$reviewRow.length){
		alert("리뷰 요소를 못찾음");
		return;
	}
	let rno = $(this).data("no");
	let ono = $(this).data("ono");
	let menus = $(this).data("menus");
	let sIdFromButton = $(this).data("sid"); // Get sId from the button
	console.log("sId from modify button:", sIdFromButton); // Add this line
	lastEditRno = rno;
	
	$reviewRow.after($("#reviewForm").removeClass("d-none"));
	
	let $form = $("#reviewForm").find("form");
	let reviewContent = $reviewRow.find(".review-content").text();
	$form.find("#reviewContent").val($.trim(reviewContent));			
	$form.attr("id", "reviewUpdateForm").attr("data-no", rno);
	$form.data("ono", ono); // Store ono in data attribute
	$form.data("sid", $(this).data("sid")); // Store sid in data attribute		
	$("#reviewForm input[type='submit']").val("댓글수정").text("댓글수정");

	// 주문 선택 드롭다운 비활성화 및 값 설정
	const $orderSelect = $("#reviewOrdersSelect");
	$orderSelect.empty();
	$orderSelect.append(`<option value="${ono}">${menus}</option>`);
	$orderSelect.prop("disabled", false); // Enable the dropdown
});

// 댓글 수정 폼 submit
$(document).on("submit", "#reviewUpdateForm", function(e){
	e.preventDefault();
	
	const reviewContent = $("#reviewContent").val().trim();
	if (reviewContent.length === 0) {
		alert("리뷰 내용을 입력하세요");
		return false;
	}
	if (!$('input[name="rating"]:checked').val()){
		alert("별점을 선택하세요~!");
		return false;
	}

	let form = this;
	let formData = new FormData(form);
	formData.append("rNo", $(form).attr("data-no"));
	formData.append("oNo", $(form).data("ono"));
	formData.append("sId", $(form).data("sid"));
	
	console.log("전송할 rNo (수정):", $(form).attr("data-no"));
	console.log("전송할 FormData:", formData);
	for (let [key, value] of formData.entries()) {
	    console.log(`${key}: ${value}`);
	}
	
	$.ajax({
			"url": "reviewUpdate.ajax",
			"data": formData,
			"type": "patch",
			"processData": false,
			"contentType": false,
			"dataType": "json",
			"success": function(resData){
				console.log('resData: ' ,resData);
				
				// 서버에서 reviewList를 반환하면 성공으로 간주하고 처리
				recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
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
					
				recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
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
	const shopOwnerId = $form.find('input[name="id"]').val();

	console.log('ajax전송 전 rrNo:', rrNo, 'sId:' , sId, 'shopOwnerId:', shopOwnerId, '대댓글 content값:', content);
	
	if(!content || content.trim().length == 0){
		alert('댓글을 입력하세요.');
		return;
	}
	$.ajax({
		url: '/reviewReplyWrite.ajax',
		type: 'post',
		data: {
			rNo: Number(rNo),
			sId: Number(sId),
			id: shopOwnerId,
			content: content
		},
		dataType: 'json',
		success: function(resData){
			recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
			
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
		$replyForm.find('form').attr('id', 'reviewReplyUpdateForm');
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
		const shopOwnerId = $form.find('input[name="id"]').val();

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
				recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
				
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
			recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);		
		},
		error: function(xhr, status){
			alert("사장님 댓글 삭제 중 오류:" + status);
		}
	});
});


// 리뷰쓰기/수정/삭제 AJAX 성공 후~
function recallReviewList(reviewArr, reviewreplyMap, shopOwnerId, loginId){
	console.log("recallReviewList 호출!:", reviewArr, reviewreplyMap);
	$("#reviewFormOriginalContainer").append($("#reviewForm").addClass("d-none"));
	loginId = window.currentUserId;
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
				<button class="modifyReview btn btn-outline-success btn-sm" data-no="${r.rno}" data-sid="${shopId}" data-ono="${r.ono}" data-menus="${r.menus}">
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
													 <input type="hidden" name="id" value="${shopOwnerId}">											
														<textarea name="content" class="form-control fs-5 py-3 mb-2" rows="3" maxlength="250" placeholder="사장님 댓글 수정"></textarea>
														<div class="text-end">
																										<button type="submit" class="btn btn-success px-4 me-1">수정완료</button>											
										</div>
									</form>
								</div>											
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
					<span class="text-muted small ms-2">${new Date(reviewreplyMap[r.rno].regDate).toLocaleString()}</span>
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
						<input type="hidden" name="id" value="${shopOwnerId}">						
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



// 없애면 메뉴 모달창 안뜸
  /*const reader = new FileReader();
  reader.onload = function (e) {
    $imgPreview.attr('src', e.target.result).show();
  };
  reader.readAsDataURL(file);*/
});


// 리뷰 사진 미리보기
/*$("#rPicture").on("change", function () { // ID를 rPicture로 변경
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
});*/


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
																	merchant_uid: response.orderId,
                                    paymentId: payment.paymentId, // PortOne SDK가 반환한 paymentId 사용
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


//+++
// 웹소켓
//+++


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

$(document).ready(function() {
    console.log("main.js: $(document).ready() 실행됨.");
    // window.currentUserId는 main_layout.html에서 이미 설정됩니다.
    // 사용자 ID가 있을 경우에만 웹소켓 연결 시도
    if (window.currentUserId && window.currentUserId.trim() !== '') {
        console.log("[WebSocket] User logged in, attempting to connect...");
        connectWebSocket();
    } else {
        console.log("[WebSocket] No currentUserId found, WebSocket connection skipped.");
    }
});