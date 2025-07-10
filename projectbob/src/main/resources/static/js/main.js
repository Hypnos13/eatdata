console.log('main.js 실행 시작');

// 메뉴 클릭 -> 모달
// 메뉴 옵션 모달창 불러오기

let selectedMenuId = null;
let selectedMenuName = '';
let selectedMenuPrice = 0;

const deliveryFee = 3000;

$(document).on('click','.menu-card', function(){
	var mId = $(this).data('id');
	selectedMenuId = $(this).data('id');
	selectedMenuName = $(this).data('name');
	selectedMenuPrice = $(this).data('price');
	
	count = 1;
	addedExtras = [];
	
	$.ajax({
		url: '/ajax/menu/options',
		data: { mId: mId },
		success: function(options){
			let html = '';
			options.forEach(function(option){
				html += `
					<div class="form-check">
						<input class="form-check-input" type="checkbox" id="option-${option.moId}" value="${option.moId}">
						<label class="form-check-label" for="option-${option.moId}">
							${option.content} (+${option.price.toLocaleString()}원)
						</label>
						</div>	`;
			});
			$('#optionArea').html(html);
			
			const modal = new bootstrap.Modal(document.getElementById("addMenuModal"));
			modal.show();
		}
	})
});




// 모달창에서 주문표로
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
  //const mainMenu = menuMap[selectedMenuId];

  orderList.innerHTML = '';

  // 메인 메뉴 표시
  const mainMenuDiv = document.createElement('div');
  mainMenuDiv.classList.add('fw-bold');
  mainMenuDiv.innerText = `${selectedMenuName} × ${count} (${(selectedMenuPrice * count).toLocaleString()}원)`;
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
      extraDiv.innerText = `- ${extra.content} (+${extra.price.toLocaleString()}원)`;
      extraDiv.classList.add('text-muted', 'ms-3');
      orderList.appendChild(extraDiv);
    });
  }

  const extrasTotal = addedExtras.reduce((sum, item) => sum + item.price, 0);
  const total = selectedMenuPrice * count + extrasTotal + deliveryFee;
  totalPriceEl.innerText = total.toLocaleString() + "원";
}

  // 추가 메뉴 선택 후 추가하기
$('#btnAddExtras').on('click', function(){
	addedExtras = [];
	$('#addMenuModal .form-check-input:checked').each(function(){
		const label = $(this).next('label').text();
		const priceMatch = label.match(/\+([\d,]+)원/);
		const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
		const content = label.split('(+')[0].trim();
		addedExtras.push({
			content: content,
			price: price
		});
	});
	console.log('추가옵션:', addedExtras);
    updateOrder();
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('addMenuModal'));
   // const modalInstance = bootstrap.Modal.getInstance(modalEl);
    //if (modalInstance) modalInstance.hide();
		modal.hide();
  });


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

// 가게 지도
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
	/*
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
*/


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
