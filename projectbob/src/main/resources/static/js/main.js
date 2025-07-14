console.log('main.js 실행 시작');
console.log('orderMenuId 존재 여부:', document.getElementById('orderMenuId'));
// 메뉴 클릭 -> 모달
// 메뉴 옵션 모달창 불러오기

let selectedMenuId = null;
let selectedMenuName = '';
let selectedMenuPrice = 0;
let count = 1;
let addedExtras = [];

const deliveryFee = 3000;

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
function updateOrder() {
	console.log('updateOrder 실행:', selectedMenuName, count, addedExtras);	
  const itemCountEl = document.getElementById("itemCount");
  const totalPriceEl = document.getElementById("totalPrice");
  const orderList = document.querySelector('.order-item-list');
	console.log('updateOrder, 주문표 div:', orderList);

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
	
  /*document.getElementById('btnOrderNow')?.addEventListener('click', () => {
    if (!selectedMenuId) {
      alert('메뉴를 선택해주세요.');
      return;
    }
    alert('주문이 완료되었습니다!');
  });
	*/

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

	// 메인화면 위치 불러오기
  // Kakao SDK 로딩 검사
  if (typeof kakao === 'undefined' || !kakao.maps) {
    const interval = setInterval(() => {
      if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.load) {
        clearInterval(interval);
        showStoreOnMap();
      }
    }, 300);
  } else {		
		runKakaoScript();
    showStoreOnMap();
  }
	
	

});




