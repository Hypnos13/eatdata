// ==============================
// 전역 변수 및 기본 세팅
// ==============================
let selectedMenuId = null;
let selectedMenuName = '';
let selectedMenuPrice = 0;
let count = 1;
let previewUrl = null;
let selectedOptions = [];

// ==============================
// 메뉴 카드 클릭 시 모달 띄우기
// ==============================
$(document).on("click", ".menu-card", function () {
  selectedMenuId = $(this).data("id");
  selectedMenuName = $(this).data("name");
  selectedMenuPrice = $(this).data("price");

  const menuImage = "https://i.imgur.com/Sg4b61a.png"; // 실제 이미지 경로로 변경 가능
  const menuInfo = "";

  $("#modalMenuName").text(selectedMenuName);
  $("#modalMenuPrice").text(`${selectedMenuPrice.toLocaleString()}원`);
  $("#modalMenuImage").attr("src", menuImage);
  $("#modalMenuInfo").text(menuInfo);

  count = 1;
  $("#modalCount").val(count);
  $("#optionArea").empty();

  $.ajax({
    url: "/ajax/menu/options",
    data: { mId: selectedMenuId },
    success: function (options) {
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

// 모달 초기화 (열릴 때 수량 초기화)
$('#addMenuModal').on('show.bs.modal', function () {
  count = 1;
  $('#modalCount').val(count);
});

// ==============================
// 장바구니에 메뉴+옵션 추가 및 주문표 업데이트
// ==============================
$(document).on("click", "#btnAddExtras", function () {
  if (!selectedMenuId) return alert("메뉴를 선택해주세요.");

  let quantity = parseInt($("#modalCount").val());
  if (quantity < 1) quantity = 1;

  // 선택된 옵션 아이디 배열 수집
  let selectedOptionIds = [];
  $("#optionArea input[type=checkbox]:checked").each(function () {
    selectedOptionIds.push(parseInt($(this).val()));
  });

  // 현재 로그인된 회원 아이디, 예시: 전역 JS 변수 혹은 서버 렌더링 시 주입 필요
  const userId = CURRENT_USER_ID || "guest"; // 꼭 실제 로그인 아이디로 변경하세요!

  // 서버에 장바구니 추가 요청
  $.ajax({
    type: "POST",
    url: "/cart/add",
    contentType: "application/json",
    data: JSON.stringify({
      mId: selectedMenuId,
      quantity: quantity,
      optionIds: selectedOptionIds,
      userId: userId
    }),
    success: function (response) {
      if (response.status === "success") {
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
    error: () => alert("서버 오류로 인해 장바구니 추가 실패"),
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
