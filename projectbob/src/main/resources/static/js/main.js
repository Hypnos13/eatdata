
// ==============================
// 전역 변수 및 기본 세팅
// ==============================

let orderList = []; // 여러 주문 메뉴 저장
let selectedMenuId = null;
let selectedMenuName = '';
let selectedMenuPrice = 0;
let count = 1;
let addedExtras = [];
const deliveryFee = 3000;
let previewUrl = null; // 댓글 사진 미리보기용

// ==============================
// 주문 관련 함수 및 이벤트
// ==============================

// 메뉴 클릭 -> 옵션 모달 열기 및 옵션 불러오기
$(document).on('click', '.menu-card', function () {
  selectedMenuId = $(this).data('id');
  selectedMenuName = $(this).data('name');
  selectedMenuPrice = $(this).data('price');
  count = 1;
  addedExtras = [];

  $.ajax({
    url: '/ajax/menu/options',
    data: { mId: selectedMenuId },
    success: function (options) {
      let html = '';
      options.forEach(option => {
        html += `
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="option-${option.moId}" value="${option.moId}">
            <label class="form-check-label" for="option-${option.moId}">
              ${option.content} (+${option.price.toLocaleString()}원)
            </label>
          </div>`;
      });
      $('#optionArea').html(html);

      const modal = new bootstrap.Modal(document.getElementById("addMenuModal"));
      modal.show();
    },
    error: function () {
      alert('옵션을 불러오는데 실패했습니다.');
    }
  });
});

// 추가 옵션 선택 후 주문표에 메뉴 추가
$(document).on('click', '#btnAddExtras', function () {
  addedExtras = [];

  $('#addMenuModal .form-check-input:checked').each(function () {
    const moId = $(this).val();
    const label = $(this).next('label').text();
    const priceMatch = label.match(/\+([\d,]+)원/);
    const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
    const content = label.split('(+')[0].trim();

    addedExtras.push({ moId, content, price });
  });

  // 이미 같은 메뉴 + 옵션이 주문 리스트에 있는지 검사
  const existingIndex = orderList.findIndex(item => {
    if (item.menuId !== selectedMenuId) return false;
    if (item.extras.length !== addedExtras.length) return false;
    const itemExtrasIds = item.extras.map(e => e.moId).sort().join(',');
    const newExtrasIds = addedExtras.map(e => e.moId).sort().join(',');
    return itemExtrasIds === newExtrasIds;
  });

  if (existingIndex !== -1) {
    // 기존 주문 수량 증가
    orderList[existingIndex].count += count;
  } else {
    // 새 주문 항목 추가
    orderList.push({
      menuId: selectedMenuId,
      menuName: selectedMenuName,
      menuPrice: selectedMenuPrice,
      count: count,
      extras: addedExtras
    });
  }

  updateOrder();
  bootstrap.Modal.getOrCreateInstance(document.getElementById('addMenuModal')).hide();
});



// 주문표 업데이트 함수 (주문 리스트 전체를 화면에 렌더링)
function updateOrder() {
  const orderListEl = document.querySelector('.order-item-list');
  const itemCountEl = document.getElementById("itemCount");
  const totalPriceEl = document.getElementById("totalPrice");
  const deliveryInfoEl = document.getElementById("deliveryInfo");

  if (!orderListEl || !itemCountEl || !totalPriceEl) return;

  if (orderList.length === 0) {
    orderListEl.innerHTML = '<div class="text-muted fst-italic">주문한 메뉴가 없습니다.</div>';
    itemCountEl.innerText = 0;
    totalPriceEl.innerText = '0원';
    if (deliveryInfoEl) deliveryInfoEl.style.display = 'none';
    return;
  }

  orderListEl.innerHTML = '';

  let totalCount = 0;
  let totalPrice = deliveryFee;

  orderList.forEach((item, index) => {
    totalCount += item.count;
    const extrasTotal = item.extras.reduce((sum, e) => sum + e.price, 0);
    const itemTotalPrice = (item.menuPrice + extrasTotal) * item.count;
    totalPrice += itemTotalPrice;

    // 주문 아이템 div 생성
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('mb-3', 'border', 'p-2', 'rounded');

    // 메뉴명, 수량, 가격
    const title = document.createElement('div');
    title.classList.add('fw-bold');
    title.innerText = `${item.menuName} × ${item.count} (${itemTotalPrice.toLocaleString()}원)`;
    itemDiv.appendChild(title);

    // 추가 옵션 표시
    if (item.extras.length === 0) {
      const noExtras = document.createElement('div');
      noExtras.classList.add('text-muted', 'fst-italic', 'ms-3');
      noExtras.innerText = '추가 메뉴 없음';
      itemDiv.appendChild(noExtras);
    } else {
      item.extras.forEach(extra => {
        const extraDiv = document.createElement('div');
        extraDiv.classList.add('text-muted', 'ms-3');
        extraDiv.innerText = `- ${extra.content} (+${extra.price.toLocaleString()}원)`;
        itemDiv.appendChild(extraDiv);
      });
    }

    // 수량 조절 버튼 영역
    const qtyControls = document.createElement('div');
    qtyControls.classList.add('d-flex', 'align-items-center', 'mt-2', 'gap-2');

    const btnMinus = document.createElement('button');
    btnMinus.classList.add('btn', 'btn-outline-secondary', 'btn-sm');
    btnMinus.innerText = '-';
    btnMinus.onclick = () => {
      if (orderList[index].count > 1) {
        orderList[index].count--;
      } else {
        orderList.splice(index, 1);
      }
      updateOrder();
    };

    const qtySpan = document.createElement('span');
    qtySpan.innerText = item.count;

    const btnPlus = document.createElement('button');
    btnPlus.classList.add('btn', 'btn-outline-secondary', 'btn-sm');
    btnPlus.innerText = '+';
    btnPlus.onclick = () => {
      orderList[index].count++;
      updateOrder();
    };

    const btnRemove = document.createElement('button');
    btnRemove.classList.add('btn', 'btn-outline-danger', 'btn-sm', 'ms-auto');
    btnRemove.innerText = '삭제';
    btnRemove.onclick = () => {
      orderList.splice(index, 1);
      updateOrder();
    };

    qtyControls.appendChild(btnMinus);
    qtyControls.appendChild(qtySpan);
    qtyControls.appendChild(btnPlus);
    qtyControls.appendChild(btnRemove);

    itemDiv.appendChild(qtyControls);

    orderListEl.appendChild(itemDiv);
  });

  itemCountEl.innerText = totalCount;
  totalPriceEl.innerText = totalPrice.toLocaleString() + '원';
  if (deliveryInfoEl) deliveryInfoEl.style.display = 'inline';
}

// 주문 초기화 함수 (전체 삭제)
function clearOrder() {
  orderList = [];
  selectedMenuId = null;
  selectedMenuName = '';
  selectedMenuPrice = 0;
  count = 1;
  addedExtras = [];
  updateOrder();
}

// 주문 전송 처리
document.addEventListener('DOMContentLoaded', () => {
  updateOrder();

  document.getElementById('btnOrderNow')?.addEventListener('click', () => {
    if (orderList.length === 0) {
      alert('먼저 메뉴를 선택해주세요.');
      return;
    }

    // 여러 주문 데이터를 쉼표, 파이프로 구분해서 전송 (서버 요구사항에 맞게 수정)
    const menuIds = orderList.map(item => item.menuId).join(',');
    const counts = orderList.map(item => item.count).join(',');
    const optionIds = orderList.map(item => item.extras.map(e => e.moId).join('|')).join(',');
    const totalPrice = orderList.reduce((sum, item) => {
      const extrasTotal = item.extras.reduce((s, e) => s + e.price, 0);
      return sum + (item.menuPrice + extrasTotal) * item.count;
    }, 0) + deliveryFee;

    document.getElementById('orderMenuId').value = menuIds;
    document.getElementById('orderCount').value = counts;
    document.getElementById('orderOptionIds').value = optionIds;
    document.getElementById('orderTotalPrice').value = totalPrice;

    document.getElementById('orderForm').submit();
  });

  document.getElementById('btnRemoveItem')?.addEventListener('click', () => {
    clearOrder();
  });
});

//주문하기버튼 클릭시 pay페이지로 넘어감
$('#btnOrderNow').on('click', function() {
  if (!selectedMenuId || count <= 0) {
    alert('먼저 메뉴를 선택해주세요.');
    return;
  }

  const optionIds = addedExtras.map(e => e.moId || e.id || e.content).join(',');
  const totalPrice = selectedMenuPrice * count + addedExtras.reduce((sum, item) => sum + item.price, 0) + deliveryFee;

  $.ajax({
    url: '/pay',
    method: 'POST',
    data: {
      menuId: selectedMenuId,
      count: count,
      optionIds: optionIds,
      totalPrice: totalPrice
    },
    success: function() {
      // 결제 페이지로 이동 (AJAX 성공 후)
      window.location.href = '/pay';
    },
    error: function() {
      alert('주문 처리 중 오류가 발생했습니다.');
    }
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
  // 기존 주문표 업데이트는 위에 이미 호출됨

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

            ${r.rPicture ? `<div>
              <img src="/images/review/${r.rPicture}" alt="리뷰사진" style="max-width:200px;" class="rounded shadow-sm mb-2" />
            </div>` : ''}

            <div class="text-secondary small mb-1">
              <span>${r.menuName}</span>
            </div>

            <div>${r.content}</div>
          </div>`;
        $("#reviewList").append(result);
      });

      $("#reviewList").removeClass("text-center p-5");
      $("#reviewWriteForm")[0].reset();
      $("#reviewForm").addClass("d-none");
    },
    error: function (xhr, status) {
      console.log("error : " + status);
    }
  });
  return false;
});

// 댓글 사진 미리보기
$("#rPicture").on('change', function (e) {
  const [file] = e.target.files;
  if (file) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    $("#imgPreview").attr('src', previewUrl).show();
  } else {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
    $("#imgPreview").hide();
  }
});
