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

function showStoreOnMap() {
  const address = document.getElementById('storeAddress')?.innerText;
  if (!address) return;

  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  const map = new kakao.maps.Map(mapContainer, {
    center: new kakao.maps.LatLng(33.450701, 126.570667),
    level: 3
  });

  const geocoder = new kakao.maps.services.Geocoder();

  geocoder.addressSearch(address, function(result, status) {
    if (status === kakao.maps.services.Status.OK) {
      const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
      const marker = new kakao.maps.Marker({ map: map, position: coords });
      map.setCenter(coords);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateOrder();

  // 메뉴 클릭 -> 모달
  document.querySelectorAll('.card.text-center.p-3').forEach(card => {
    card.style.cursor = 'pointer';

    card.addEventListener('click', () => {
      const menuId = card.getAttribute('data-id');
      if (!menuMap[menuId]) return;

      selectedMenuId = menuId;
      count = 1;
      addedExtras = [];

      document.querySelectorAll('#addMenuModal .form-check-input').forEach(chk => chk.checked = false);

      const modalLabel = document.getElementById('addMenuModalLabel');
      modalLabel.innerText = `${menuMap[menuId].name} 추가 메뉴 선택`;

      const modal = new bootstrap.Modal(document.getElementById('addMenuModal'));
      modal.show();

      updateOrder();
    });
  });

  // 추가 메뉴 선택 후 추가하기
  document.getElementById('btnAddExtras')?.addEventListener('click', () => {
    addedExtras = [...document.querySelectorAll('#addMenuModal .form-check-input:checked')]
      .map(chk => extrasMap[chk.id])
      .filter(Boolean);

    updateOrder();
    const modalEl = document.getElementById('addMenuModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
  });

  // 주문하기 버튼
  document.getElementById('btnOrderNow')?.addEventListener('click', () => {
    if (!selectedMenuId) {
      alert('메뉴를 선택해주세요.');
      return;
    }
    alert('주문이 완료되었습니다!');
  });

  // 주문 취소 버튼
  document.getElementById('btnRemoveItem')?.addEventListener('click', () => {
    selectedMenuId = null;
    count = 0;
    addedExtras = [];
    updateOrder();
  });

  // 지도 탭 들어갔을 때 표시
  const infoTab = document.querySelector('a[href="#info"]');
  infoTab?.addEventListener('shown.bs.tab', () => {
    showStoreOnMap();
  });

  // Kakao SDK 로딩 검사
  if (typeof kakao === 'undefined' || !kakao.maps) {
    const interval = setInterval(() => {
      if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.load) {
        clearInterval(interval);
        showStoreOnMap();
      }
    }, 300);
  } else {
    showStoreOnMap();
  }
});
