console.log('main.js 실행 시작');
console.log('orderMenuId 존재 여부:', document.getElementById('orderMenuId'));

let selectedMenuId = null;
let selectedMenuName = '';
let selectedMenuPrice = 0;
let count = 1;
let addedExtras = [];
const deliveryFee = 3000;

// ==============================
// 메뉴 클릭 -> 모달 열기
// ==============================
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
    }
  });
});

// ==============================
// 주문표 업데이트
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
  orderList.innerHTML = '';

  const mainMenuDiv = document.createElement('div');
  mainMenuDiv.classList.add('fw-bold');
  mainMenuDiv.innerText = `${selectedMenuName} × ${count} (${(selectedMenuPrice * count).toLocaleString()}원)`;
  orderList.appendChild(mainMenuDiv);

  if (addedExtras.length === 0) {
    const noExtrasDiv = document.createElement('div');
    noExtrasDiv.classList.add('text-muted', 'fst-italic', 'ms-3');
    noExtrasDiv.innerText = '추가 메뉴 없음';
    orderList.appendChild(noExtrasDiv);
  } else {
    addedExtras.forEach(extra => {
      const extraDiv = document.createElement('div');
      extraDiv.classList.add('text-muted', 'ms-3');
      extraDiv.innerText = `- ${extra.content} (+${extra.price.toLocaleString()}원)`;
      orderList.appendChild(extraDiv);
    });
  }

  const extrasTotal = addedExtras.reduce((sum, item) => sum + item.price, 0);
  const total = selectedMenuPrice * count + extrasTotal + deliveryFee;
  totalPriceEl.innerText = total.toLocaleString() + "원";
}

// ==============================
// 추가 옵션 → 주문표 반영
// ==============================
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

  updateOrder();
  bootstrap.Modal.getOrCreateInstance(document.getElementById('addMenuModal')).hide();
});

// 수량 조절
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
// Kakao 지도: 사용자 위치 검색
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
              const address = result[0].address.address_name;
              inputField.value = address;

              // ✅ shopList로 이동하면서 category=전체보기, address 값도 함께 전달
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


// ==============================
// Kakao 지도: 가게 위치 표시
// ==============================
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

// ==============================
// DOM 로드 후 이벤트 설정
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  updateOrder();

  // 주문 전송
  document.getElementById('btnOrderNow')?.addEventListener('click', () => {
    if (!selectedMenuId) return alert('메뉴를 선택해주세요.');

    document.getElementById('orderMenuId').value = selectedMenuId;
    document.getElementById('orderCount').value = count;
    document.getElementById('orderOptionIds').value = addedExtras.map(e => e.moId || e.id || e.content).join(',');
    document.getElementById('orderTotalPrice').value =
      selectedMenuPrice * count +
      addedExtras.reduce((sum, item) => sum + item.price, 0) +
      deliveryFee;

    document.getElementById('orderForm').submit();
  });

  // 주문 초기화
  document.getElementById('btnRemoveItem')?.addEventListener('click', () => {
    selectedMenuId = null;
    count = 0;
    addedExtras = [];
    updateOrder();
  });

  // 지도 탭 클릭 시 지도 표시
  document.querySelector('a[href="#info"]')?.addEventListener('shown.bs.tab', () => {
    showStoreOnMap();
  });

  // Kakao SDK 로딩 상태 확인
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
	
	//검색버튼
	document.getElementById('searchSubmitBtn').addEventListener('click', function () {
	    const keyword = document.querySelector('#searchBox input[type="text"]').value.trim();

	    // 현재 선택된 카테고리도 함께 보내고 싶다면 추가로 처리 가능
	    // 예: const category = '치킨'; 또는 URL에서 파싱 가능

	    // URL 구성
	    const searchUrl = `/shopList?keyword=${encodeURIComponent(keyword)}`;

	    // 페이지 이동
	    window.location.href = searchUrl;
	});
	
});








// 찜하기 하트
$(function(){
	
	$("#btnHeart").click(function(){
		let sId = $(this).data("sid") || $("input[name='sId']").val();
		if (!sId){
			alert('가게 정보를 찾을 수 없습니다.');
			return;
		}
		
		$.ajax({
			url: "/heart.ajax",
			type: "post",
			data : { sId : sId },
			dataType: "json",
			success: function(data){
			$("#heartCount").text(data.heartCount);
				alert("찜하기가 반영되었습니다.");
			},
			error: function(xhr, status, error){
				alert("error : " + xhr.statusText + "," + status + "," + error);
			}
		});
	});
});

// 댓글쓰기 버튼 클릭 이벤트
$("#reviewWrite").on("click", function(){
		$("#reviewForm").toggleClass("d-none");
	});
	
	$(document).on("submit", "#reviewWriteForm", function(e){
		e.preventDefault();
		if($("#reviewContent").val().length < 5){
			alert("댓글은 5자 이상 입력하세요~");
			return false;
		}
		if (!$('input[name="rating"]:checked').val()){
			alert("별점을 선택하세요~!");
			return false;
		}
		let formData = new FormData(this);
		
		let params = $(this).serialize();
		console.log(params);
		
		$.ajax({
			"url": "reviewWrite.ajax",
			"data": formData,
			"type": "post",
			"processData": false,
			"contentType": false,
			"dataType": "json",
			"success": function(resData){
				console.log(resData);
				
				$("#reviewList").empty();
				$.each(resData,function(i, r){
					
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
													<span class="fw-bold">${r.id.substr(0,2)}**님</span>
													<span class="text-muted small ms-2">${strDate}</span>
													<div class="ms-auto">
													<button class="modifyReview btn btn-outline-success btn-sm" data-no="${r.rno}">
														<i class="bi bi-journal-text">수정</i>									
													</button>
													<button class="deleteReview btn btn-outline-warning btn-sm" data-no="${r.rno}">
														<i class="bi bi-trash">삭제</i>
													</button>
													<button class="btn btn-outline-danger btn-sm" onclick="reportReview('${r.rno}')">
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
												
												${r.rpicture ? `<div>
													<img src="/images/review/${r.rpicture}?t=${Date.now()}" alt="리뷰사진" 
																	style="max-width:200px;" class="rounded shadow-sm mb-2" />
												</div>` : ' '}
											
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
			"error": function(xhr, status){
				console.log("error : " + status);
			}
		});
		return false;
	});


//댓글 사진 미리보기
let previewUrl = null;

$("#rPicture").on('change', function(e){
	const [file] = e.target.files;
	if(file){
		if(previewUrl){
			URL.revokeObjectURL(previewUrl);
		}
		previewUrl = URL.createObjectURL(file);
		$("#imgPreview").attr('src', previewUrl).show();
	} else {
		if(previewUrl){
			URL.revokeObjectURL(previewUrl);
			previewUrl = null;
		}
		$("#imgPreview").hide();
	}
});



//댓글 수정하기 버튼클릭
$(document).on("click", ".modifyReview", function(){
	console.log($("#reviewForm").css("display"));
	console.log($("#reviewForm").is(":visible"));
	
	console.log($(this).parents(".reviewRow"));
	let $reviewRow = $(this).closest(".reviewRow");
	
	$reviewRow.after($("#reviewForm").removeClass("d-none"));
	
	let review = $reviewRow.find(".review-content").text();
		$("#reviewContent").val($.trim(review));
			
	$("#reviewForm").find("form")
		.attr({"id": "reviewUpdateForm", "data-no": $(this).attr("data-no")});
	$("#reviewUpdateButton").val("댓글수정");
		
});

// 댓글 수정 폼 submit
$(document).on("submit", "#reviewUpdateForm", function(e){
	e.preventDefault();
	
	if($("#reviewContent").val().length <= 5){
		alert("댓글은 5자 이상 입력해야 합니다.");
		return false;
	}
	//$("#global-content > div").append($("#reviewForm"));
	
	let form = this;
	let formData = new FormData(form);
	formData.append("rNo", $(form).attr("data-no"));
	
	
	$.ajax({
			"url": "reviewUpdate.ajax",
			"data": formData,
			"type": "patch",
			"processData": false,
			"contentType": false,
			"dataType": "json",
			"success": function(resData){
				console.log(resData);
				
				$("#reviewList").empty();
				$.each(resData,function(i, r){
					console.log('리뷰사진 파일명:' , r.rpicture);
					
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
													<span class="fw-bold">${r.id.substr(0,2)}**님</span>
													<span class="text-muted small ms-2">${strDate}</span>
													<div class="ms-auto">
													<button class="modifyReview btn btn-outline-success btn-sm" data-no="${r.rno}">
														<i class="bi bi-journal-text">수정</i>									
													</button>
													<button class="deleteReview btn btn-outline-warning btn-sm" data-no="${r.rno}">
														<i class="bi bi-trash">삭제</i>
													</button>
													<button class="btn btn-outline-danger btn-sm" onclick="reportReview('${r.rno}')">
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
												
												${r.rpicture ? `<div>
													<img src="/images/review/${r.rpicture}?t=${Date.now()}" alt="리뷰사진" 
																	style="max-width:200px;" class="rounded shadow-sm mb-2" />
												</div>` : ' '}
											
												<div class="text-secondary small mb-1">
													<span>${r.menuName}</span>
												</div>
												
												<div>${r.content}</div>
											</div>`;
					
											$("#reviewList").append(result);
								
				});
				$("#reviewForm").addClass("d-none");
				//$("#reviewWriteButton").val("댓글쓰기");
				$("#reviewForm form").attr("id", "reviewWriteForm").removeAttr("data-no");
				$("#reviewContent").val("");
			},
			"error": function(xhr, status){
				console.log("error : " + status);
			}
		});
		return false;
});


// 댓글 삭제하기
$(document).on("click", ".deleteReview", function(){
	
	$("#global-content > div").append($("#reviewForm"));
	$("#reviewContent").val("");
	
	let rNo = $(this).attr("data-no");
	console.log('삭제할 rNo:' , rNo);
	let id = $(this).closest(".border-bottom").find(".fw-bold").text();
	let sId = $("#reviewForm input[name=sId]").val();
	
	let params = {rNo: rNo, sId: sId};
	console.log(params);
	
	let result = confirm(id + "님이 작성한 " + rNo + "번 댓글을 삭제하시봉?");
	
	if(result){
	$.ajax({
				"url": "reviewDelete.ajax?rNo=" + rNo + "&sId=" + sId,
				"data": params,
				"type": "delete",				
				"dataType": "json",
				"success": function(resData, status, xhr){
					console.log(resData);
					
					$("#reviewList").empty();
					$.each(resData,function(i, r){						
						
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
														<span class="fw-bold">${r.id.substr(0,2)}**님</span>
														<span class="text-muted small ms-2">${strDate}</span>
														<div class="ms-auto">
														<button class="modifyReview btn btn-outline-success btn-sm" data-no="${r.rno}">
															<i class="bi bi-journal-text">수정</i>									
														</button>
														<button class="deleteReview btn btn-outline-warning btn-sm" data-no="${r.rno}">
															<i class="bi bi-trash">삭제</i>
														</button>
														<button class="btn btn-outline-danger btn-sm" onclick="reportReview('${r.rno}')">
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
													
													${r.rpicture ? `<div>
														<img src="/images/review/${r.rpicture}?t=${Date.now()}" alt="리뷰사진" 
																		style="max-width:200px;" class="rounded shadow-sm mb-2" />
													</div>` : ' '}
												
													<div class="text-secondary small mb-1">
														<span>${r.menuName}</span>
													</div>
													
													<div>${r.content}</div>
												</div>`;
						
												$("#reviewList").append(result);
									
					});				
				},
				"error": function(xhr, status){
					console.log("error : " + status);
				}
			});
			}
			return false;
	
});


// 신고하기 버튼
function reportReview(ememId){
	let result = confirm("이 댓글을 신고하시봉?");
	if(result == true){
		alert("report - " + result);
	}
}













