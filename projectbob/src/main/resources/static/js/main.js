
// 전역 변수 및 기본 세팅
let selectedMenuId = null;
let selectedMenuName = '';
let selectedMenuPrice = 0;
let selectedShopId = null;
let count = 1;
let selectedOptionIds = [];
window.currentUserId = null;  // 로그인 시 서버에서 주입하거나 할당
window.currentGuestId = null; // 서버에서 발급받아 세션에 있으면 가져옴

const defaultMenuImage = "https://i.imgur.com/Sg4b61a.png";

// 메뉴카드 클릭시 모달창
$(document).on("click", ".menu-card", function () {
  selectedMenuId = parseInt($(this).data("id"));
  selectedMenuName = $(this).data("name");
  selectedMenuPrice = parseInt($(this).data("price"));
  selectedShopId = parseInt($(this).data("shop-id"));
  const menuImage = $(this).find("img").attr("src") || defaultMenuImage;

  $("#modalMenuName").text(selectedMenuName);
  $("#modalMenuPrice").text(`${selectedMenuPrice.toLocaleString()}원`);
  $("#modalMenuImage").attr("src", menuImage);
  $("#modalMenuInfo").text("");

  count = 1;
  $("#modalCount").val(count);
  $("#optionArea").empty();

  $.ajax({
    url: "/ajax/menu/options",
    data: { mId: selectedMenuId },
    success: function (options) {
      const html = options.map(option => `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="option-${option.moId}" value="${option.moId}" data-price="${option.price}">
          <label class="form-check-label" for="option-${option.moId}">
            ${option.content} (+${option.price.toLocaleString()}원)
          </label>
        </div>
      `).join('');

      $("#optionArea").html(html);
      new bootstrap.Modal(document.getElementById("addMenuModal")).show();
    },
    error: () => alert("옵션을 불러오는데 실패했습니다."),
  });
});

// 수량버튼 조절
$(document).ready(function () {
  $("#btnCountMinus").click(() => {
    if (count > 1) {
      count--;
      $("#modalCount").val(count);
    }
  });

  $("#btnCountPlus").click(() => {
    count++;
    $("#modalCount").val(count);
  });

  $('#addMenuModal').on('show.bs.modal', function () {
    count = 1;
    $('#modalCount').val(count);
  });
});


// 장바구니 추가버튼
$(document).on("click", "#btnAddExtras", function () {
  if (!selectedMenuId) {
    alert("메뉴를 선택해주세요.");
    return;
  }

  let quantity = parseInt($("#modalCount").val()) || 1;

  selectedOptionIds = [];
  $("#optionArea input[type=checkbox]:checked").each(function () {
    selectedOptionIds.push(parseInt($(this).val()));
  });

  console.log("selectedMenuId:", selectedMenuId);
  console.log("selectedShopId:", selectedShopId);

  let cartItems = [];

  if (selectedOptionIds.length > 0) {
    selectedOptionIds.forEach((moId) => {
      cartItems.push({
        mId: selectedMenuId,
        moId: moId,
        quantity: quantity,
        sId: selectedShopId
      });
    });
  } else {
    cartItems.push({
      mId: selectedMenuId,
      moId: null,
      quantity: quantity,
      sId: selectedShopId
    });
  }

  console.log("장바구니에 담기는 데이터:", cartItems);

  $.ajax({
    type: "POST",
    url: "/addCart",
    contentType: "application/json",
    data: JSON.stringify(cartItems),
    success: function (response) {
      if (response.cartList) {
        console.log("장바구니에 추가되었습니다.");
        updateOrderSummary(response.cartList);

        const modalEl = document.getElementById("addMenuModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
      } else {
        console.log("장바구니 추가 실패");
      }
    },
    error: function (xhr, status, error) {
      console.error("서버 오류:", status, error);
      console.log("서버 오류로 인해 장바구니 추가 실패");
    }
  });
});

//주문표
$(document).ready(function() {
   // JSP/서버에서 session guestId 값 받아오기 (예: JSTL 사용 시)
   const guestId = "${sessionScope.guestId}";

   if (guestId && guestId.trim() !== '') {
     // guestId가 있으면 ajax로 장바구니 조회
     $.ajax({
       url: '/cart/getCartByGuest',  // 서버에서 guestId 기반 장바구니 조회 API 주소 (예시)
       type: 'GET',
       data: { guestId: guestId },
       success: function(response) {
         if (response.success && response.cartList.length > 0) {
           updateOrderSummary(response.cartList);
           $('#emptyOrderMessage').hide();
         } else {
           $('#emptyOrderMessage').show();
         }
       },
       error: function() {
         $('#emptyOrderMessage').show();
       }
     });
   } else {
     // guestId 없으면 주문 내역 없음 메시지 표시
     $('#emptyOrderMessage').show();
   }
 });

// ==============================
// 주문표(장바구니) UI 업데이트 함수
// ==============================
function updateOrderSummary(cartList) {
  const $list = $(".order-item-list");
  const $emptyMessage = $("#emptyOrderMessage");

  if (!cartList || cartList.length === 0) {
    $list.empty();
    $emptyMessage.show();
    $("#itemCount").text(0);
    $("#totalPrice").text("0원");
    $("#deliveryInfo").hide();
    return;
  }

  let totalQuantity = 0;
  let totalPrice = 0;

  let html = "";
  cartList.forEach((cart, idx) => {
    const menuPrice = cart.menuPrice || 0;
    const optionPrice = cart.optionPrice || 0;
    const quantity = cart.quantity || 0;
    const itemTotal = (menuPrice + optionPrice) * quantity;

    html += `
      <div class="mb-2">
        <div class="fw-bold fs-8">${cart.menuName} x${quantity}</div>  
    `;

    if (cart.optionName || cart.optionContent) {
      const optName = cart.optionName || cart.optionContent || "";
      html += `
        <div class="text-muted fs-8 ms-3">└ 옵션: ${optName} (${optionPrice.toLocaleString()}원)</div>
      `;
    }

    html += `
        <div class="ms-3 fw-bold fs-8">→ 총: ${itemTotal.toLocaleString()}원</div>
      </div>
    `;

    // 마지막 항목 제외하고 구분선 삽입
    if (idx < cartList.length - 1) {
      html += `<hr class="my-1" />`;
    }

    totalQuantity += quantity;
    totalPrice += itemTotal;
  });

  $list.html(html);
  $emptyMessage.hide();

  $("#itemCount").text(totalQuantity);
  $("#totalPrice").text(totalPrice.toLocaleString() + "원");

  if (totalPrice > 0) {
    $("#deliveryInfo").show();
  } else {
    $("#deliveryInfo").hide();
  }
}

//전체 삭제시 
$("#btnRemoveItem").click(function() {
  const itemCount = parseInt($("#itemCount").text());
  if (itemCount === 0) {
    console.log("장바구니에 삭제할 항목이 없습니다.");
    return;
  }

  $.ajax({
    url: '/cart/removeAll',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({}), // 요청 바디는 없어도 됨, 서버에서 세션으로 처리
    success: function(res) {
      if (res.success) {
        console.log("장바구니가 모두 삭제되었습니다.");
        // 주문표 업데이트 함수 호출하거나 페이지 갱신
        updateOrderSummary([]);
      } else {
        console.log("삭제 중 오류가 발생했습니다.");
      }
    },
    error: function() {
      console.log("서버 요청 중 오류가 발생했습니다.");
    }
  });
});



// ==============================
// 기존 DOMContentLoaded 내 기존 스크립트
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  if (typeof updateOrder === 'function') updateOrder();

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
  const sId = $(this).data("sid") || $("input[name='sId']").val();
  if (!sId) return alert('가게 정보를 찾을 수 없습니다.');

  $.ajax({
    url: "/heart.ajax",
    type: "post",
    data: { sId },
    dataType: "json",
    success: function (data) {
      $("#heartCount").text(data.heartCount);
      alert("찜하기가 반영되었습니다.");
    },
    error: function (xhr, status, error) {
      alert(`error : ${xhr.statusText}, ${status}, ${error}`);
    }
  });
});

// ==============================
// 댓글 기능
// ==============================
$("#reviewWrite").click(() => $("#reviewForm").toggleClass("d-none"));

$(document).on("submit", "#reviewWriteForm", function (e) {
  e.preventDefault();

  if ($("#reviewContent").val().length < 5) return alert("댓글은 5자 이상 입력하세요~");
  if (!$('input[name="rating"]:checked').val()) return alert("별점을 선택하세요~!");

  const formData = new FormData(this);

  $.ajax({
    url: "reviewWrite.ajax",
    data: formData,
    type: "post",
    processData: false,
    contentType: false,
    dataType: "json",
    success: function (resData) {
      $("#reviewList").empty();
      resData.forEach(r => {
        const date = new Date(r.regDate);
        const strDate = date.toISOString().slice(0, 19).replace("T", " ");
        let html = `
          <div class="border-bottom pb-3 mb-3">
            <div class="d-flex align-items-center mb-1">
              <span class="fw-bold">${r.id.substr(0, 2)}**님</span>
              <span class="text-muted small ms-2">${strDate}</span>
              <div class="ms-auto">
                <button class="modifyReview btn btn-outline-success btn-sm" data-no="${r.rNo}"><i class="bi bi-journal-text">수정</i></button>
                <button class="deleteReview btn btn-outline-warning btn-sm" data-no="${r.rNo}"><i class="bi bi-trash">삭제</i></button>
                <button class="btn btn-outline-danger btn-sm" onclick="reportReview('${r.rNo}')"><i class="bi bi-telephone-outbound">신고</i></button>
              </div>
            </div>
            <div class="mb-1">
              <span class="me-2 text-warning"><i class="bi bi-star-fill"></i></span>
              <span class="fw-bold ms-1">${r.rating}점</span>
            </div>
            <div>${r.content}</div>`;

        if (r.img) html += `<img src="/upload/review/${r.img}" alt="review image" class="mt-2" style="max-width: 200px;">`;

        html += `</div>`;
        $("#reviewList").append(html);
      });
      $("#reviewWriteForm")[0].reset();
      $("#reviewForm").addClass("d-none");
      alert("댓글이 등록되었습니다.");
    },
    error: function (xhr) {
      alert("error : " + xhr.statusText);
    }
  });
});

$("#reviewImg").on("change", function () {
  const file = this.files[0];
  if (!file) return $('#imgPreview').hide();

  const reader = new FileReader();
  reader.onload = function (e) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = e.target.result;
    $('#imgPreview').attr('src', previewUrl).show();
  };
  reader.readAsDataURL(file);
});
