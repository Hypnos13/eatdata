// ==============================
// 전역 변수 및 기본 세팅
// ==============================
let selectedMenuId = null;
let selectedMenuName = '';
let selectedMenuPrice = 0;
let count = 1;
let previewUrl = null;
let selectedOptions = [];
let selectedOptionIds = [];
// ==============================
// 메뉴 카드 클릭 시 모달 띄우기
// ==============================


$(document).on("click", ".menu-card", function () {
  selectedMenuId = parseInt($(this).data("id"));
  selectedMenuName = $(this).data("name");
	selectedShopId = parseInt($(this).data("shop-id"));
  selectedMenuPrice = parseInt($(this).data("price"));

  const menuImage = "https://i.imgur.com/Sg4b61a.png"; // 실제 이미지 경로로 변경 가능
  const menuInfo = "";

  $("#modalMenuName").text(selectedMenuName);
  $("#modalMenuPrice").text(`${selectedMenuPrice.toLocaleString()}원`);
  $("#modalMenuImage").attr("src", menuImage);
  $("#modalMenuInfo").text(menuInfo);

  count = 1;
  $("#modalCount").val(count);
  $("#optionArea").empty();
	console.log("선택된 메뉴 ID (mId):", selectedMenuId);
	console.log("타입 확인:", typeof selectedMenuId);
  $.ajax({
    url: "/ajax/menu/options",
    data: { mId: selectedMenuId , sId: selectedShopId},
    success: function (options) {
			console.log("받은 옵션 데이터:", options);
      // 기존 options 배열은 MenuOption 도메인 객체 리스트임
      const html = options.map(option => `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="option-${option.moId}" value="${option.moId}">
          <label class="form-check-label" for="option-${option.moId}">
            ${option.content} (+${option.price.toLocaleString()}원)
          </label>
        </div>`).join('');

      $("#optionArea").html(html);
      new bootstrap.Modal(document.getElementById("addMenuModal")).show();
    },
    error: () => alert("옵션을 불러오는데 실패했습니다."),
  });
});

// ==============================
// 수량 조절
// ==============================
$(document).ready(function () {
  // 수량 감소 버튼
  $("#btnCountMinus").click(() => {
    if (count > 1) {
      count--;
      $("#modalCount").val(count);
    }
  });

  // 수량 증가 버튼
  $("#btnCountPlus").click(() => {
    count++;
    $("#modalCount").val(count);
  });

  // 모달이 열릴 때 수량 초기화
  $('#addMenuModal').on('show.bs.modal', function () {
    count = 1;
    $('#modalCount').val(count);
  });
});

// ==============================
// 장바구니에 메뉴+옵션 추가 및 주문표 업데이트
// ==============================
$(document).on("click", "#btnAddExtras", function () {
  if (!selectedMenuId) return alert("메뉴를 선택해주세요.");

  let quantity = parseInt($("#modalCount").val());
  if (quantity < 1) quantity = 1;

	selectedOptionIds = [];
  // 선택된 옵션 아이디 배열 수집
  $("#optionArea input[type=checkbox]:checked").each(function () {
    selectedOptionIds.push(parseInt($(this).val()));
  });
		console.log("selectedOptionIds",selectedOptionIds);

  // 현재 로그인된 회원 아이디, 예시: 전역 JS 변수 혹은 서버 렌더링 시 주입 필요
  const userId = window.currentUserId || null; 

	let cartItems = [];
	
	
	if(selectedOptionIds.length > 0){
		selectedOptionIds.forEach((moId) => {
			cartItems.push({
				mId : selectedMenuId,
				moId:moId,
				quantity : quantity,
				id: userId,
				sId:selectedShopId,
			});
		});
	}else {
		cartItems.push({
			mId : selectedMenuId,
			moId: null,
			quantity: quantity,
			id: userId,
			sId:selectedShopId,
		});
	}
	
	console.log("장바구니에 담기는 데이터:", cartItems);
  // 서버에 장바구니 추가 요청
	 $.ajax({
	    type: "POST",
	    url: "/addCart",
	    contentType: "application/json",
	    data: JSON.stringify(cartItems),
	    success: function (response) {
				console.log(response);
	      if (response.cartList) {
	        alert("장바구니에 추가되었습니다.");
	        updateOrderSummary(response.cartList);

	        // 모달 닫기
	        const modalEl = document.getElementById("addMenuModal");
	        const modal = bootstrap.Modal.getInstance(modalEl);
	        modal.hide();
	      } else {
	        alert("장바구니 추가 실패");
	      }
	    },
			error: ( status, error) => {
			  console.error("서버 오류:", status, error);
			  //console.error("응답 본문:", xhr.responseText);
			  alert("서버 오류로 인해 장바구니 추가 실패");
			}
	  });
	});
// ==============================
// 주문표(장바구니) UI 업데이트 함수
// ==============================
function updateOrderSummary(cartList) {
  const $list = $(".order-item-list");
  if (!cartList || cartList.length === 0) {
    $list.html('<div class="text-muted fst-italic">주문한 메뉴가 없습니다.</div>');
    $("#itemCount").text(0);
    $("#totalPrice").text("0원");
    $("#deliveryInfo").hide();
    return;
  }

  let totalQuantity = 0;
  let totalPrice = 0;

  let html = "";
  cartList.forEach((cart) => {
    let optionsText = "";
    if (cart.options && cart.options.length > 0) {
      optionsText =
        "<small class='text-muted'>옵션: " +
        cart.options.map((opt) => opt.content).join(", ") +
        "</small><br>";
    }

    html += `
      <div class="order-item">
        <div><strong>${cart.menuName}</strong></div>
        <div>${optionsText}수량: ${cart.quantity}개</div>
        <div>가격: ${cart.totalPrice.toLocaleString()}원</div>
      </div>
      <hr>`;
    totalQuantity += cart.quantity;
    totalPrice += cart.totalPrice;
  });

  $list.html(html);
  $("#itemCount").text(totalQuantity);
  $("#totalPrice").text(totalPrice.toLocaleString() + "원");
  if (totalPrice > 0) {
    $("#deliveryInfo").show();
  } else {
    $("#deliveryInfo").hide();
  }
}

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
