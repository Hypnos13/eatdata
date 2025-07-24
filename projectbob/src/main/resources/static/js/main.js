let selectedMenuId = null;
let selectedMenuName = '';
let selectedMenuPrice = 0;
let selectedShopId = null;
let currentQuantity = 1; // 'count' 대신 'currentQuantity'로 변수명 변경 (혼동 방지)
window.currentUserId = null;  // 로그인 시 서버에서 주입 (예: Thymeleaf)
window.currentGuestId = null; // 서버에서 발급받아 세션에 있으면 가져옴

const defaultMenuImage = "https://i.imgur.com/Sg4b61a.png";

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

  // 옵션 가격 합산 (단위 가격 합산)
  const totalOptionUnitPrice = selectedOptionPrices.reduce((a, b) => a + b, 0);

  // 이 cartItems는 백엔드의 processAndAddCartItems 메서드에서 List<Cart> cartItems 파라미터로 받습니다.
  // 여기서의 totalPrice는 해당 '메뉴 + 선택된 옵션들' 그룹의 총 가격을 의미합니다.
  const cartItemsToSend = [{
    mId: selectedMenuId,
    moIds: selectedOptionIds.length > 0 ? selectedOptionIds : null,
    optionPrices: selectedOptionPrices.length > 0 ? selectedOptionPrices : null,
    quantity: quantity,
    sId: selectedShopId,
    menuPrice: selectedMenuPrice, // 메인 메뉴의 단일 가격
    optionPrice: totalOptionUnitPrice, // 선택된 옵션들의 단일 가격 합계
    totalPrice: (selectedMenuPrice + totalOptionUnitPrice) * quantity, // 이 그룹의 총 가격
    menuName: selectedMenuName, // 메인 메뉴 이름
    id: window.currentUserId, // 전역 변수 userId 사용
    guestId: window.currentGuestId // 전역 변수 guestId 사용
  }];

  console.log("장바구니에 담기는 데이터 (프론트엔드에서 전송):", cartItemsToSend);

  $.ajax({
    type: "POST",
    url: "/addCart", // 컨트롤러의 매핑 경로에 맞게 수정
    contentType: "application/json",
    data: JSON.stringify(cartItemsToSend),
    success: function (response) {
      if (response.success && response.cartList) {
        console.log("장바구니에 추가되었습니다.");
        // 서버에서 반환된 전체 장바구니 목록으로 UI 업데이트
        updateOrderSummary(response.cartList, response.totalPrice);

        const modalEl = document.getElementById("addMenuModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide(); // 모달 닫기
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

  // userId는 로그인 시 서버에서 직접 window.currentUserId에 할당하는 방식이 더 안정적입니다.
  // 예: <script th:inline="javascript"> window.currentUserId = [[${#authentication.name}]]; </script>

  // 장바구니 내용을 불러오는 함수 호출
  loadCartItems();
});

function loadCartItems() {
  // userId와 guestId 중 유효한 값을 사용하여 장바구니 조회
  const requestData = {};
  if (window.currentUserId && window.currentUserId.trim() !== '') {
    requestData.userId = window.currentUserId;
  }
  if (window.currentGuestId && window.currentGuestId.trim() !== '') {
    requestData.guestId = window.currentGuestId;
  }

  // userId와 guestId 둘 다 없으면 장바구니 로드 시도 안 함
  if (Object.keys(requestData).length === 0) {
    $('#emptyOrderMessage').show();
    $("#totalOrderPrice").addClass("d-none"); // 총 가격 숨기기
    $("#orderSummaryInfo").addClass("d-none"); // 배달비 섹션 숨기기
    return;
  }

  $.ajax({
    url: '/cartList', // 컨트롤러의 GET 매핑 경로에 맞게 수정
    type: 'GET',
    data: requestData,
    success: function(response) {
      if (response.success && response.cartList) {
        // 서버에서 반환된 guestId를 전역 변수에 업데이트 (새로 생성된 경우)
        if (response.guestId) {
            window.currentGuestId = response.guestId;
            // HTML의 guestInfo data-guest-id 속성도 업데이트 (선택 사항)
            const guestInfoElem = document.getElementById('guestInfo');
            if (guestInfoElem) {
                guestInfoElem.dataset.guestId = response.guestId;
            }
        }
        updateOrderSummary(response.cartList, response.totalPrice);
      } else {
        console.error("장바구니 로드 실패:", response.message || "알 수 없는 오류");
        $('#emptyOrderMessage').show();
        $("#totalOrderPrice").addClass("d-none"); // 총 가격 숨기기
        $("#orderSummaryInfo").addClass("d-none"); // 배달비 섹션 숨기기
      }
    },
    error: function(xhr, status, error) {
      console.error("장바구니 로드 서버 오류:", status, error, xhr.responseText);
      $('#emptyOrderMessage').show();
      $("#totalOrderPrice").addClass("d-none"); // 총 가격 숨기기
      $("#orderSummaryInfo").addClass("d-none"); // 배달비 섹션 숨기기
    }
  });
}


// ==============================
// 주문표(장바구니) UI 업데이트 함수
// cartList: 서버에서 받은 전체 장바구니 항목 리스트
// totalCartPrice: 서버에서 계산된 전체 장바구니의 총 가격
// ==============================
function updateOrderSummary(cartList, totalCartPrice) {
  const $orderItemList = $(".order-item-list");
  const $emptyOrderMessage = $("#emptyOrderMessage");
  const $totalOrderPriceDisplay = $("#totalOrderPrice"); // HTML에서 ID 변경됨
  const $orderSummaryInfo = $("#orderSummaryInfo"); // 배달비 멘트 포함 섹션

  $orderItemList.empty(); // 기존 목록 비우기

  if (!cartList || cartList.length === 0) {
    $emptyOrderMessage.text("주문한 메뉴가 없습니다.").removeClass("d-none").show();
    $orderSummaryInfo.addClass("d-none").hide(); // 배달비 멘트 숨기기
    $totalOrderPriceDisplay.addClass("d-none").hide(); // 총 결제 금액 숨기기
    return;
  }

  $emptyOrderMessage.addClass("d-none").hide();
  $orderSummaryInfo.removeClass("d-none").show(); // 배달비 멘트 표시

  // 메인 메뉴만 필터링 (ca_pid가 null)
  const mainMenus = cartList.filter(item => item.caPid == null);

  mainMenus.forEach(mainItem => {
    // 해당 메인 메뉴에 딸린 옵션 필터링 (ca_pid가 현재 mainItem의 caId와 일치)
    const options = cartList.filter(opt => opt.caPid != null && opt.caPid === mainItem.caId);

    // 옵션 HTML 생성
    let optionHtml = "";
    options.forEach(opt => {
      const optName = opt.optionName || "옵션명 없음";
      const optPrice = opt.totalPrice || 0; // 옵션 항목의 totalPrice는 이미 (옵션단가 * 수량)
      optionHtml += `
        <div class="text-muted small ms-3 mb-1" data-ca-id="${opt.caId}">
          └ 옵션: ${optName} (${optPrice.toLocaleString()}원)
        </div>
      `;
    });

    const quantity = mainItem.quantity || 0;
    // 메인 메뉴 항목의 totalPrice는 이미 (메뉴단가 * 수량)으로 계산되어 넘어옴
    // 여기에 옵션들의 totalPrice를 합산하여 이 '그룹'의 최종 금액을 표시
    const itemGroupTotal = mainItem.totalPrice + options.reduce((sum, opt) => sum + (opt.totalPrice || 0), 0);


    const html = `
      <div class="pb-3 mb-3 border-bottom cart-main-item" data-ca-id="${mainItem.caId}">
        <div class="mb-2">
          <div class="fw-bold small mb-1">${mainItem.menuName} : ${mainItem.menuPrice.toLocaleString()}원</div>
          ${optionHtml}
          <div>
            총 금액: <span class="item-group-total-price">${itemGroupTotal.toLocaleString()}원</span>
          </div>
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

  // 전체 장바구니 총 결제 금액 업데이트
  $totalOrderPriceDisplay.text(`총 결제 금액: ${totalCartPrice.toLocaleString()}원`).removeClass("d-none").show();
}


// ==============================
// 전체 삭제 버튼 (#btnRemoveAllItems)
// ==============================
$("#btnRemoveAllItems").click(function () { // ID 변경
  if (!confirm("장바구니의 모든 항목을 삭제하시겠습니까?")) { // 사용자 확인 추가
      return;
  }

  // 삭제할 사용자/게스트 ID를 서버에 전달
  const requestData = {};
  if (window.currentUserId && window.currentUserId.trim() !== '') {
    requestData.userId = window.currentUserId;
  }
  if (window.currentGuestId && window.currentGuestId.trim() !== '') {
    requestData.guestId = window.currentGuestId;
  }

  if (Object.keys(requestData).length === 0) {
      alert("삭제할 장바구니 정보가 없습니다.");
      return;
  }

  $.ajax({
    url: "/cart/removeAll", // 컨트롤러에 해당 엔드포인트가 필요합니다.
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(requestData), // 삭제할 사용자/게스트 ID 전달
    success: function (response) {
      if (response.success) {
        console.log("장바구니가 모두 삭제되었습니다.");
        // 서버에서 다시 받아온 cartList와 totalPrice로 주문표 업데이트
        updateOrderSummary(response.cartList || [], response.totalPrice || 0);
        alert("장바구니의 모든 항목이 삭제되었습니다.");
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
        url: "/cart/updateQuantity", // 컨트롤러에 해당 엔드포인트가 필요합니다.
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(requestData),
        success: function(response) {
            if (response.success && response.cartList) {
                console.log(`카트 항목 ${caId} 수량 ${newQuantity}로 업데이트 성공.`);
                updateOrderSummary(response.cartList, response.totalPrice);
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
            if (response.success && response.cartList) {
                console.log(`카트 항목 ${caId} 및 관련 옵션 삭제 성공.`);
                updateOrderSummary(response.cartList, response.totalPrice);
                alert("선택된 메뉴 항목이 장바구니에서 삭제되었습니다.");
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