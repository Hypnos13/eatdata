console.log('main.js 실행 시작');

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
  if (!mainMenu) {
    orderList.innerHTML = '<div class="text-muted fst-italic">메인 메뉴를 선택하세요.</div>';
    return;
  }

  orderList.innerHTML = '';

  // 메인 메뉴 표시
  const mainMenuDiv = document.createElement('div');
  mainMenuDiv.classList.add('fw-bold');
  mainMenuDiv.innerText = `${mainMenu.name} × ${count} (${(mainMenu.price * count).toLocaleString()}원)`;
  orderList.appendChild(mainMenuDiv);

  // 추가 메뉴 표시
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

function plus() {
  if (!selectedMenuId) {
    alert('먼저 메뉴를 선택해주세요.');
    return;
  }
  count++;
  updateOrder();
}

function minus() {
  if (count > 1) {
    count--;
    updateOrder();
  }
}

// 카카오 지도 검색 함수 (필요 시 사용)
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
              inputField.value = result[0].address.address_name;
            } else {
              alert('주소 변환 실패');
            }
          });
        },
        (error) => {
          alert('위치 정보를 가져오지 못했습니다: ' + error.message);
        }
      );
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateOrder();

  if (typeof kakao === 'undefined' || !kakao.maps) {
    let retryCount = 0;
    const interval = setInterval(() => {
      if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.load) {
        clearInterval(interval);
        runKakaoScript();
      } else if (++retryCount > 20) {
        clearInterval(interval);
        console.error('Kakao SDK 로드 시간 초과');
      }
    }, 500);
  } else {
    runKakaoScript();
  }

  // 메뉴 카드 클릭 -> 메인 메뉴 선택, 모달 띄우기
  document.querySelectorAll('.card.text-center.p-3').forEach(card => {
    card.style.cursor = 'pointer';

    card.addEventListener('click', () => {
      const menuId = card.getAttribute('data-id');
      if (!menuMap[menuId]) {
        alert('해당 메뉴 정보를 찾을 수 없습니다.');
        return;
      }

      selectedMenuId = menuId;
      count = 1;
      addedExtras = [];

      const modalEl = document.getElementById('addMenuModal');
      if (!modalEl) {
        console.error('모달 요소가 없습니다.');
        return;
      }

      const modalLabel = document.getElementById('addMenuModalLabel');
      modalLabel.innerText = `${menuMap[menuId].name} 추가 메뉴 선택`;

      // 체크박스 초기화
      document.querySelectorAll('#addMenuModal .form-check-input').forEach(chk => chk.checked = false);

      const modal = new bootstrap.Modal(modalEl);
      modal.show();

      updateOrder();
    });
  });

  // 추가하기 버튼 - 추가 메뉴 저장 후 주문표 갱신 및 모달 닫기
  const btnAddExtras = document.getElementById('btnAddExtras');
  btnAddExtras?.addEventListener('click', () => {
    addedExtras = [...document.querySelectorAll('#addMenuModal .form-check-input:checked')]
      .map(chk => extrasMap[chk.id])
      .filter(Boolean);

    updateOrder();

    const modalEl = document.getElementById('addMenuModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
  });

  // 주문하기 버튼 클릭
  document.getElementById('btnOrderNow')?.addEventListener('click', () => {
    if (!selectedMenuId) {
      alert('메뉴를 선택해주세요.');
      return;
    }
    alert('주문이 완료되었습니다!');
  });

  // 주문 취소 버튼 클릭 -> 초기화
  const btnRemoveItem = document.getElementById('btnRemoveItem');
  btnRemoveItem?.addEventListener('click', () => {
    count = 0;
    selectedMenuId = null;
    addedExtras = [];
    updateOrder();
  });
});
