console.log('main.js 실행 시작');

// ==============================
// 전역 변수 정의
// ==============================
let count = 0;
let selectedMenuId = null;
let addedExtras = [];

const menuMap = {
  "1": { name: "더블 맥스파이시®", price: 12200 },
  "2": { name: "1955® 크리미버거", price: 11300 },
  "3": { name: "치킨버거", price: 11000 },
  "4": { name: "베이컨치즈버거", price: 12500 }
};

const extrasMap = {
  "extra1": { name: "감자튀김", price: 2000 },
  "extra2": { name: "콜라", price: 1500 },
  "extra3": { name: "치즈 추가", price: 1000 }
};

const deliveryFee = 3000;

// ==============================
// 주문표 업데이트 함수
// ==============================
function updateOrder() {
  const itemCountEl = document.getElementById("itemCount");
  const totalPriceEl = document.getElementById("totalPrice");
  const orderList = document.querySelector('.order-item-list');

  if (!itemCountEl || !totalPriceEl || !orderList) return;

  if (!selectedMenuId || count <= 0) {
    itemCountEl.innerText = 0;
    totalPriceEl.innerText = "0원";
    orderList.innerHTML = '<div class="text-muted fst-italic">주문한 메뉴가 없습니다.</div>';
    return;
  }

  itemCountEl.innerText = count;
  const mainMenu = menuMap[selectedMenuId];

  orderList.innerHTML = '';
  const mainMenuDiv = document.createElement('div');
  mainMenuDiv.classList.add('fw-bold');
  mainMenuDiv.innerText = `${mainMenu.name} × ${count} (${(mainMenu.price * count).toLocaleString()}원)`;
  orderList.appendChild(mainMenuDiv);

  if (addedExtras.length === 0) {
    const noExtrasDiv = document.createElement('div');
    noExtrasDiv.innerText = '추가 메뉴 없음';
    noExtrasDiv.classList.add('text-muted', 'fst-italic', 'ms-3');
    orderList.appendChild(noExtrasDiv);
  } else {
    addedExtras.forEach(extra => {
      const extraDiv = document.createElement('div');
      extraDiv.innerText = `- ${extra.name} (+${extra.price.toLocaleString()}원)`;
      extraDiv.classList.add('text-muted', 'ms-3');
      orderList.appendChild(extraDiv);
    });
  }

  const extrasTotal = addedExtras.reduce((sum, item) => sum + item.price, 0);
  const total = mainMenu.price * count + extrasTotal + deliveryFee;
  totalPriceEl.innerText = total.toLocaleString() + "원";
}

// ==============================
// 수량 조절
// ==============================
function plus() {
  if (!selectedMenuId) return alert('먼저 메뉴를 선택해주세요.');
  count++;
  updateOrder();
}

function minus() {
  if (count > 1) {
    count--;
    updateOrder();
  }
}

// ==============================
// Kakao 지도 (사용자 위치 검색용)
// ==============================
function runKakaoScript() {
  kakao.maps.load(() => {
    const searchButton = document.getElementById('btn-search-toggle');
    const inputField = document.getElementById('location-input');
    if (!searchButton || !inputField) return;

    searchButton.addEventListener('click', () => {
      if (!navigator.geolocation) return alert('이 브라우저는 위치 정보를 지원하지 않습니다.');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const geocoder = new kakao.maps.services.Geocoder();
          const coord = new kakao.maps.LatLng(lat, lon);

          geocoder.coord2Address(coord.getLng(), coord.getLat(), (result, status) => {
            if (status === kakao.maps.services.Status.OK) {
              inputField.value = result[0].address.address_name;
            } else {
              alert('주소 변환 실패');
            }
          });
        },
        (error) => alert('위치 정보를 가져오지 못했습니다: ' + error.message)
      );
    });
  });
}

// ==============================
// 가게 주소로 지도 표시 (정보 탭)
function showStoreOnMap() {
  const address = document.getElementById('storeAddress')?.innerText;
  if (!address) return;

  const mapContainer = document.getElementById('storeMap');
  const mapOption = {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 3
  };

  const map = new kakao.maps.Map(mapContainer, mapOption);
  const geocoder = new kakao.maps.services.Geocoder();

  geocoder.addressSearch(address, (result, status) => {
    if (status === kakao.maps.services.Status.OK) {
      const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
      const marker = new kakao.maps.Marker({ map: map, position: coords });
      map.setCenter(coords);
    } else {
      console.warn("지도 좌표 변환 실패");
    }
  });
}

// ==============================
// DOM 로드 후 실행
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  updateOrder();

  // 카카오 위치 검색 버튼 활성화
  if (typeof kakao === 'undefined' || !kakao.maps) {
    let retry = 0;
    const interval = setInterval(() => {
      if (typeof kakao !== 'undefined' && kakao.maps?.load) {
        clearInterval(interval);
        runKakaoScript();
      } else if (++retry > 10) {
        clearInterval(interval);
        console.warn('Kakao 지도 로딩 실패');
      }
    }, 500);
  } else {
    runKakaoScript();
  }

  // 정보 탭 클릭 시 지도 보여주기
  const infoTab = document.querySelector('a[href="#info"]');
  infoTab?.addEventListener('click', () => {
    setTimeout(showStoreOnMap, 300); // 탭 전환 후 약간의 딜레이 필요
  });

  // 메뉴 클릭 시 모달 오픈
  document.querySelectorAll('.card.text-center.p-3').forEach(card => {
    card.style.cursor = 'pointer';

    card.addEventListener('click', () => {
      const menuId = card.getAttribute('data-id');
      if (!menuMap[menuId]) return alert('메뉴 정보를 찾을 수 없습니다.');

      selectedMenuId = menuId;
      count = 1;
      addedExtras = [];

      document.querySelectorAll('#addMenuModal .form-check-input').forEach(chk => chk.checked = false);
      document.getElementById('addMenuModalLabel').innerText = `${menuMap[menuId].name} 추가 메뉴 선택`;

      const modal = new bootstrap.Modal(document.getElementById('addMenuModal'));
      modal.show();

      updateOrder();
    });
  });

  // 추가 메뉴 버튼
  document.getElementById('btnAddExtras')?.addEventListener('click', () => {
    addedExtras = [...document.querySelectorAll('#addMenuModal .form-check-input:checked')]
      .map(chk => extrasMap[chk.id])
      .filter(Boolean);
    updateOrder();

    const modalEl = document.getElementById('addMenuModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance?.hide();
  });

  // 주문하기
  document.getElementById('btnOrderNow')?.addEventListener('click', () => {
    if (!selectedMenuId) return alert('메뉴를 선택해주세요.');
    alert('주문이 완료되었습니다!');
  });

  // 주문 취소
  document.getElementById('btnRemoveItem')?.addEventListener('click', () => {
    selectedMenuId = null;
    addedExtras = [];
    count = 0;
    updateOrder();
  });
});
