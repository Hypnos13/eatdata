// ==============================
// 전역 변수 및 기본 세팅
// ==============================

let selectedMenuId = null;
let selectedMenuName = '';
let selectedMenuPrice = 0;
let count = 1;
let previewUrl = null; // 댓글 사진 미리보기용


// 메뉴 카드 클릭 시 모달 띄우기 및 옵션 불러오기
$(document).on("click", ".menu-card", function () {
  selectedMenuId = $(this).data("id");
  selectedMenuName = $(this).data("name");
  selectedMenuPrice = $(this).data("price");


  let menuImage = "https://i.imgur.com/Sg4b61a.png"; // 필요하면 data 속성으로 변경
  let menuInfo = ""; // 필요하면 data 속성으로 변경

  // 모달에 기본 정보 세팅
  $("#modalMenuName").text(selectedMenuName);
  $("#modalMenuPrice").text(selectedMenuPrice.toLocaleString() + "원");
  $("#modalMenuImage").attr("src", menuImage);
  $("#modalMenuInfo").text(menuInfo);

  // 수량 초기화
  count = 1;
  $("#modalCount").val(count);

  // 옵션 영역 비우기 및 AJAX로 옵션 불러오기
  $("#optionArea").empty();

  $.ajax({
    url: "/ajax/menu/options",
    data: { mId: selectedMenuId },
    success: function (options) {
      let html = "";
      options.forEach(option => {
        html += `
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="option-${option.moId}" value="${option.moId}">
            <label class="form-check-label" for="option-${option.moId}">
              ${option.content} (+${option.price.toLocaleString()}원)
            </label>
          </div>`;
      });
      $("#optionArea").html(html);

      // 모달 열기
      const modal = new bootstrap.Modal(document.getElementById("addMenuModal"));
      modal.show();
    },
    error: function () {
      alert("옵션을 불러오는데 실패했습니다.");
    }
  });
});

// 수량 조절 버튼 이벤트
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

$(document).ready(function () {
  let count = 1;

  $('#btnCountPlus').on('click', function () {
    count++;
    $('#modalCount').val(count);
  });

  $('#btnCountMinus').on('click', function () {
    if (count > 1) {
      count--;
      $('#modalCount').val(count);
    }
  });

  // 모달이 열릴 때마다 count를 1로 초기화
  $('#addMenuModal').on('show.bs.modal', function () {
    count = 1;
    $('#modalCount').val(count);
  });
});

// ==============================
// Kakao 지도 관련 함수
// ==============================

// 사용자 위치 검색 후 주소를 input에 넣고 shopList 페이지로 이동
function runKakaoScript() {
  kakao.maps.load(() => {
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
  });
}

// 가게 주소로 지도 표시
function showStoreOnMap() {
  const address = document.getElementById('storeAddress')?.innerText;
  const mapContainer = document.getElementById('map');
  if (!address || !mapContainer) return;

  const map = new kakao.maps.Map(mapContainer, {
    center: new kakao.maps.LatLng(33.450701, 126.570667),
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

// DOMContentLoaded에서 Kakao 관련 함수 실행 및 이벤트 등록
document.addEventListener("DOMContentLoaded", () => {
  // 주문표 초기 업데이트
  updateOrder();

  // 탭 클릭 시 지도 보이기
  document.querySelector('a[href="#info"]')?.addEventListener('shown.bs.tab', () => {
    showStoreOnMap();
  });

  // Kakao SDK가 아직 로딩 안됐으면 반복 체크 후 실행
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

  // 검색창 토글
  const searchBtn = document.getElementById("searchBtn");
  const searchBox = document.getElementById("searchBox");
  if (searchBtn && searchBox) {
    searchBtn.addEventListener("click", () => {
      searchBox.classList.toggle("d-none");
    });
  }

  // 검색 제출 버튼
  const searchSubmitBtn = document.getElementById('searchSubmitBtn');
  if (searchSubmitBtn) {
    searchSubmitBtn.addEventListener('click', () => {
      const inputEl = document.querySelector('#searchBox input[type="text"]');
      const keyword = inputEl ? inputEl.value.trim() : '';
      const searchUrl = `/shopList?keyword=${encodeURIComponent(keyword)}`;
      window.location.href = searchUrl;
    });
  }
});

// ==============================
// 찜하기 하트 기능
// ==============================

$(function () {
  $("#btnHeart").click(function () {
    let sId = $(this).data("sid") || $("input[name='sId']").val();
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
        $("#heartCount").text(data.heartCount);
        alert("찜하기가 반영되었습니다.");
      },
      error: function (xhr, status, error) {
        alert("error : " + xhr.statusText + "," + status + "," + error);
      }
    });
  });
});

// ==============================
// 댓글 기능 (쓰기, 사진 미리보기 등)
// ==============================

// 댓글쓰기 폼 토글
$("#reviewWrite").on("click", function () {
  $("#reviewForm").toggleClass("d-none");
});

// 댓글 쓰기 폼 제출 이벤트
$(document).on("submit", "#reviewWriteForm", function (e) {
  e.preventDefault();

  if ($("#reviewContent").val().length < 5) {
    alert("댓글은 5자 이상 입력하세요~");
    return false;
  }
  if (!$('input[name="rating"]:checked').val()) {
    alert("별점을 선택하세요~!");
    return false;
  }

  let formData = new FormData(this);

  $.ajax({
    url: "reviewWrite.ajax",
    data: formData,
    type: "post",
    processData: false,
    contentType: false,
    dataType: "json",
    success: function (resData) {
      $("#reviewList").empty();
      $.each(resData, function (i, r) {
        let date = new Date(r.regDate);
        let strDate = date.getFullYear() + "-" + ((date.getMonth() + 1 < 10)
          ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)) + "-"
          + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + " "
          + (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + ":"
          + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) + ":"
          + (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds());

        let result = `
          <div class="border-bottom pb-3 mb-3">
            <div class="d-flex align-items-center mb-1">
              <span class="fw-bold">${r.id.substr(0, 2)}**님</span>
              <span class="text-muted small ms-2">${strDate}</span>
              <div class="ms-auto">
                <button class="modifyReview btn btn-outline-success btn-sm" data-no="${r.rNo}">
                  <i class="bi bi-journal-text">수정</i>
                </button>
                <button class="deleteReview btn btn-outline-warning btn-sm" data-no="${r.rNo}">
                  <i class="bi bi-trash">삭제</i>
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="reportReview('${r.rNo}')">
                  <i class="bi bi-telephone-outbound">신고</i>
                </button>
              </div>
            </div>

            <div class="mb-1">
              <span class="me-2 text-warning">
                <i class="bi bi-star-fill"></i>
              </span>
              <span class="fw-bold ms-1">${r.rating}점</span>
            </div>

            <div>${r.content}</div>`;

        if (r.img != null) {
          result += `<img src="/upload/review/${r.img}" alt="review image" class="mt-2" style="max-width: 200px;">`;
        }
        result += `</div>`;

        $("#reviewList").append(result);
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

// 댓글 사진 미리보기
$("#reviewImg").on("change", function () {
  let file = this.files[0];
  if (!file) {
    $('#imgPreview').hide();
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
    previewUrl = e.target.result;
    $('#imgPreview').attr('src', previewUrl).show();
  };
  reader.readAsDataURL(file);
});
