console.log('main.js 실행 시작');
console.log('orderMenuId 존재 여부:', document.getElementById('orderMenuId'));
// 메뉴 클릭 -> 모달
// 메뉴 옵션 모달창 불러오기

<<<<<<< HEAD
// ==============================
// 전역 변수 정의
// ==============================
let count = 0;
=======
>>>>>>> 130f8f81b288a67cb501674aeff56a07357a0569
let selectedMenuId = null;
let selectedMenuName = '';
let selectedMenuPrice = 0;
let count = 1;
let addedExtras = [];

const deliveryFee = 3000;

<<<<<<< HEAD
// ==============================
// 주문표 업데이트 함수
// ==============================
=======
$(document).on('click','.menu-card', function(){
	var mId = $(this).data('id');
	selectedMenuId = $(this).data('id');
	selectedMenuName = $(this).data('name');
	selectedMenuPrice = $(this).data('price');
	count = 1;
	addedExtras = [];
	console.log(count, selectedMenuId, selectedMenuName, selectedMenuPrice,addedExtras)

	
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
>>>>>>> 130f8f81b288a67cb501674aeff56a07357a0569
function updateOrder() {
	console.log('updateOrder 실행:', selectedMenuName, count, addedExtras);	
  const itemCountEl = document.getElementById("itemCount");
  const totalPriceEl = document.getElementById("totalPrice");
  const orderList = document.querySelector('.order-item-list');
	console.log('updateOrder, 주문표 div:', orderList);

  const plusBtn = document.getElementById('btnPlus');
  const minusBtn = document.getElementById('btnMinus');

  if (!itemCountEl || !totalPriceEl || !orderList || !plusBtn || !minusBtn) return;

  if (!selectedMenuId || count <= 0) {
    itemCountEl.innerText = "";
    totalPriceEl.innerText = "0원";
    orderList.innerHTML = '<div class="text-muted fst-italic">주문한 메뉴가 없습니다.</div>';

    // 수량 조절 버튼 숨기기
    plusBtn.style.display = 'none';
    minusBtn.style.display = 'none';
    return;
  }
	
	plusBtn.style.display = '';
	minusBtn.style.display = '';


  itemCountEl.innerText = count;
  //const mainMenu = menuMap[selectedMenuId];

  orderList.innerHTML = '';

  const mainMenuDiv = document.createElement('div');
  mainMenuDiv.classList.add('fw-bold');
  mainMenuDiv.innerText = `${selectedMenuName} × ${count} (${(selectedMenuPrice * count).toLocaleString()}원)`;
  orderList.appendChild(mainMenuDiv);

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

<<<<<<< HEAD
// ==============================
// 수량 조절 함수
// ==============================
=======
  // 추가 메뉴 선택 후 추가하기
$(document).on('click','#btnAddExtras', function(){
	console.log('1.추가하기 버튼 클릭됨');	
	addedExtras = [];
	$('#addMenuModal .form-check-input:checked').each(function(){
		const moId = $(this).val();
		const label = $(this).next('label').text();
		const priceMatch = label.match(/\+([\d,]+)원/);
		const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
		const content = label.split('(+')[0].trim();
		addedExtras.push({
			moId: moId,
			content: content,
			price: price
		});
	});
	console.log('2.추가옵션:', addedExtras);
	console.log('주문정보:', selectedMenuName, count, addedExtras);
    updateOrder();
		console.log('3. 모달 닫기 시도');
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('addMenuModal'));
   // const modalInstance = bootstrap.Modal.getInstance(modalEl);
    //if (modalInstance) modalInstance.hide();
		modal.hide();
  });


>>>>>>> 130f8f81b288a67cb501674aeff56a07357a0569
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

<<<<<<< HEAD
=======


>>>>>>> 130f8f81b288a67cb501674aeff56a07357a0569
// ==============================
// Kakao 지도 (사용자 위치 검색용)
// ==============================
function runKakaoScript() {
  kakao.maps.load(() => {
    const searchButton = document.getElementById('btn-search-toggle');
    const inputField = document.getElementById('location-input');
    if (!searchButton || !inputField) return;

    searchButton.addEventListener('click', () => {
<<<<<<< HEAD
      if (!navigator.geolocation) {
        alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
        return;
      }
=======
      if (!navigator.geolocation) return alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
>>>>>>> 130f8f81b288a67cb501674aeff56a07357a0569

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

<<<<<<< HEAD
// ==============================
// 가게 주소로 지도 표시 (정보 탭)
// ==============================
=======

// 가게 지도
>>>>>>> 130f8f81b288a67cb501674aeff56a07357a0569
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
    } else {
      console.warn("지도 좌표 변환 실패");
    }
  });
	
}

// ==============================
// DOMContentLoaded 이벤트 내 실행
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  updateOrder();

<<<<<<< HEAD
  // 메뉴 카드 클릭 시 모달 띄우기
=======
// 주문표 전송하기~
document.getElementById('btnOrderNow')?.addEventListener('click', function(){
	if (!selectedMenuId){
		alert('메뉴를 선택해주세요.');
		return;
	}
	// 주문 정보를 form에 채워넣기
	document.getElementById('orderMenuId').value = selectedMenuId;
	document.getElementById('orderCount').value = count;
	// 옵션 id를 ,로 구분해 넘긴다(optionIds)
	document.getElementById('orderOptionIds').value =
		addedExtras.map(e => e.moId || e.id || e.content).join(',');
	document.getElementById('orderTotalPrice').value = 
		selectedMenuPrice * count + 
		addedExtras.reduce((sum, item) => sum + item.price, 0) +
		deliveryFee;
		
		console.log({
			menuId: selectedMenuId,
			count: count,
			optionIds: addedExtras.map(e =>e.moId).join(','),
			totalPrice: document.getElementById('orderTotalPrice').value
		});
		
	document.getElementById('orderForm').submit();
});
	
	
	
  // 메뉴 클릭 -> 모달
	/*
>>>>>>> 130f8f81b288a67cb501674aeff56a07357a0569
  document.querySelectorAll('.card.text-center.p-3').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const menuId = card.getAttribute('data-id');
      if (!menuMap[menuId]) return alert('메뉴 정보를 찾을 수 없습니다.');

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

<<<<<<< HEAD
  // 추가 메뉴 선택 후 버튼 클릭
  document.getElementById('btnAddExtras')?.addEventListener('click', () => {
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
=======

  // 주문하기 버튼
	
  /*document.getElementById('btnOrderNow')?.addEventListener('click', () => {
>>>>>>> 130f8f81b288a67cb501674aeff56a07357a0569
    if (!selectedMenuId) {
      alert('메뉴를 선택해주세요.');
      return;
    }
    alert('주문이 완료되었습니다!');
  });
	*/

  // 주문 취소 버튼 클릭
  document.getElementById('btnRemoveItem')?.addEventListener('click', () => {
    selectedMenuId = null;
    count = 0;
    addedExtras = [];
    updateOrder();
  });

  // 수량 조절 버튼 클릭 이벤트 연결
  document.getElementById('btnPlus')?.addEventListener('click', plus);
  document.getElementById('btnMinus')?.addEventListener('click', minus);

  // 정보 탭 클릭 시 지도 표시 (Bootstrap 탭 이벤트)
  const infoTab = document.querySelector('a[href="#info"]');
  infoTab?.addEventListener('shown.bs.tab', () => {
    showStoreOnMap();
  });

<<<<<<< HEAD
  // Kakao SDK 로드 확인 후 위치검색 기능 실행 및 지도 표시
=======
	// 메인화면 위치 불러오기
  // Kakao SDK 로딩 검사
>>>>>>> 130f8f81b288a67cb501674aeff56a07357a0569
  if (typeof kakao === 'undefined' || !kakao.maps) {
    let retryCount = 0;
    const interval = setInterval(() => {
      if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.load) {
        clearInterval(interval);
        runKakaoScript();
        showStoreOnMap();
      } else if (++retryCount > 20) {
        clearInterval(interval);
        console.warn('Kakao SDK 로드 실패');
      }
<<<<<<< HEAD
    }, 500);
  } else {
    runKakaoScript();
    showStoreOnMap();
  }

  // 돋보기 버튼 클릭 시 검색창 토글
  const searchBtn = document.getElementById('searchBtn');
  const searchBox = document.getElementById('searchBox');

  searchBtn?.addEventListener('click', () => {
    searchBox?.classList.toggle('d-none');
  });
=======
    }, 300);
  } else {		
		runKakaoScript();
    showStoreOnMap();
  }
	
	

>>>>>>> 130f8f81b288a67cb501674aeff56a07357a0569
});




