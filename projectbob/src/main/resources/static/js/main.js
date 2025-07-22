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
	
	if(document.querySelectorAll("#reviewList .reviewRow").length > 0){
		document.getElementById("noReview").style.display = "none";
	} else {
		document.getElementById("noReview").style.display = "block";
	}
	
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
	console.log("리뷰쓰기 버튼 클릭");
	resetReviewForm();
		$("#reviewFormOriginalContainer").append($("#reviewForm").removeClass("d-none"));
		$("#reviewForm form").attr("id", "reviewWriteForm").removeAttr("data-no");
		$("#reviewForm input[type='submit']").val("댓글쓰기").text("댓글쓰기");
		$("#reviewContent").val("");
		$('input[name="rating"]').prop('checked', false);
		$("#imgPreview").hide().attr('src', '');
		if(previewUrl){URL.revokeObjectURL(previewUrl); previewUrl = null;}
		lastEditRno = null;
	});
	
	$(document).on("submit", "#reviewWriteForm", function(e){
		e.preventDefault();
		/*if($("#reviewContent").val().length < 5){
			alert("댓글은 5자 이상 입력하세요~");
			return false;
		}*/
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
				console.log('resData: ' ,resData);
				
				recallReviewList(resData.reviewList, resData.reviewReplyMap);
				resetReviewForm();
				
				console.log('버튼 찾기:', $("#reviewFormMode"));

								
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
lastEditRno = null;
$(document).on("click", ".modifyReview", function(){
	resetReviewForm();
	console.log("수정 버튼 클릭");
	console.log($("#reviewForm").css("display"));
	console.log($("#reviewForm").is(":visible"));
	
	console.log($(this).parents(".reviewRow"));
	let $reviewRow = $(this).closest(".reviewRow");
	if(!$reviewRow.length){
		alert("리뷰 요소를 못찾음");
		return;
	}
	let rno = $(this).attr("data-no");
	lastEditRno = rno;
	console.log("폼을 해당리뷰 아래로 이동:", $reviewRow, "rno", rno);
	
	$reviewRow.after($("#reviewForm").removeClass("d-none"));
	console.log("폼 실제 위치:", $("#reviewForm").parent()[0]);
	
	let $form = $("#reviewForm").find("form");
	let reviewContent = $reviewRow.find(".review-content").text();
	$form.find("#reviewContent").val($.trim(reviewContent));			
	$form.attr("id", "reviewUpdateForm").attr("data-no", rno);		
	$("#reviewForm input[type='submit']").val("댓글수정").text("댓글수정");
		
});

// 댓글 수정 폼 submit
$(document).on("submit", "#reviewUpdateForm", function(e){
	e.preventDefault();
	
	/*if($("#reviewContent").val().length <= 5){
		alert("댓글은 5자 이상 입력해야 합니다.");
		return false;
	}*/
	//$("#global-content > div").append($("#reviewForm"));
	
	let form = this;
	let formData = new FormData(form);
	formData.append("rNo", $(form).attr("data-no"));
	
	console.log("전송할 rNo (수정):", $(form).attr("data-no"));
	console.log("전송할 FormData:", formData);
	
	$.ajax({
			"url": "reviewUpdate.ajax",
			"data": formData,
			"type": "patch",
			"processData": false,
			"contentType": false,
			"dataType": "json",
			"success": function(resData){
				console.log('resData: ' ,resData);
				
				recallReviewList(resData.reviewList, resData.reviewReplyMap);
				resetReviewForm();
										
				console.log("리뷰 다시 그림. 폼 숨기기");			
				console.log('버튼 찾기:', $("#reviewFormMode"));
				
		
			},
			"error": function(xhr, status){
				console.log("error : " + status);
			}
		});
		return false;
});


// 댓글 삭제하기
$(document).on("click", ".deleteReview", function(){
	
//	$("#global-content > div").append($("#reviewForm"));
	$("#reviewContent").val("");
	$("#reviewForm").addClass("d-none");
	
	let rNo = $(this).data("no");
	console.log('삭제할 rNo:' , rNo);
	let sId = $(this).data("sid");
	let id = $(this).closest(".border-bottom").find(".fw-bold").first().text().replace('님', '');
	
	
	let params = {rNo: rNo, sId: sId};
	console.log(params);
	
	let result = confirm(id + "님이 작성한 " + rNo + "번 댓글을 삭제하시봉?");
	
	console.log("전송할 rNo (삭제):", rNo);
	console.log("전송할 params:", params);
	
	if(result){
	$.ajax({
				"url": "reviewDelete.ajax",
				"data": { rNo: rNo, sId: sId },
				"type": "delete",				
				"dataType": "json",
				"success": function(resData, status, xhr){
					console.log('resData: ' ,resData);
					
				recallReviewList(resData.reviewList, resData.reviewReplyMap);
				resetReviewForm();

				},
				"error": function(xhr, status){
					console.log("error : " + status);
				}
			});
			}
			return false;
	
});


// 신고하기 버튼
function reportReview(elemId){
	let result = confirm("이 댓글을 신고하시봉?");
	if(result == true){
		alert("report - " + result);
	}
}

// 사장님 댓글쓰기 버튼 클릭 시
$(document).on('click', '.review-reply-btn', function(){
	const rNo = $(this).data('review-no');
	const $replyForm = $(this).closest('.reviewRow').find('.reviewReplyForm');
	const sId = Number($form.find("input[name='sId']").val());
	$replyForm.find('input[name="rNo"]').val(rNo);
	$replyForm.find('input[name="sId"]').val(sId);
	$('.reviewReplyForm').addClass('d-none');
	$replyForm.removeClass('d-none');	
	
	console.log('사장님 대댓글쓰기 버튼 클릭 rNo:', rNo, 'sId', sId);	
	console.log('폼 input[name="rNo"] 값:', $replyForm.find('input[name="rNo"]').val());
});
// 사장님 댓글쓰기 submit
$(document).on('submit', '.review-reply-form', function(e){
	e.preventDefault();
	
	const $form = $(this);
	const rNo = $form.find('input[name="rNo"]').val();	
	const rrNo = $form.find('input[name="rrNo"]').val();	
	const sId = $form.find('input[name="sId"]').val();
	const content = $form.find('textarea[name="content"]').val();
	const shopOwnerId = $("#shopOwnerId").val();

	console.log('ajax전송 전 rrNo:', rrNo, 'sId:' , sId, 'shopOwnerId:', shopOwnerId, '대댓글 content값:', content);
	
	if(!content || content.trim().length == 0){
		alert('댓글을 입력하세요.');
		return;
	}
	$.ajax({
		url: '/reviewReplyWrite.ajax',
		type: 'post',
		data: JSON.stringify({
			rNo: Number(rNo),
			sId: Number(sId),
			id: shopOwnerId,
			content: content
		}),
		contentType: "application/json",
		dataType: 'json',
		success: function(resData){
			recallReviewList(resData.reviewList, resData.reviewReplyMap);
			
			$form.closest('.reviewReplyForm').addClass('d-none');
			$form[0].reset();
		},
		error: function(xhr, status){
			alert('사장님 댓글 등록 오류: ' + status);
		}
	});
});

// 사장님 댓글 수정 클릭
$(document).on("click", ".modifyReviewReply", function(){
	console.log("modifyReviewReply 클릭!",{
		thisElem: this,
		dataRno: $(this).data('rno'),
		dataRrno: $(this).data('rrno')
	})
		const rNo = $(this).data('rno');		
		const rrNo = $(this).data('rrno');
		const $reviewRow = $(this).closest('.reviewRow');
		const $replyForm = $reviewRow.find('.reviewReplyForm');
		console.log("$replyForm length:", $replyForm.length);
		console.log("$replyForm hasClass('d-none') before toggle:", $replyForm.hasClass("d-none"));
		const sId = $("input[name='sId']").first().val();
		const content = $reviewRow.find('.ms-3.fs-5.py-2').text().trim();
		
		$replyForm.find('.review-reply-submit-btn').text('수정하기');
		$replyForm.find('.modifyReviewReply, .deleteReviewReply').hide();
		$replyForm.find('input[name="rNo"]').val(rNo);
		$replyForm.find('input[name="rrNo"]').val(rrNo);
		$replyForm.find('input[name="sId"]').val(sId);
		$replyForm.find('textarea[name="content"]').val(content);
		$replyForm.attr('id', 'reviewReplyUpdateForm');
		$('.reviewReplyForm').addClass('d-none');
		$replyForm.removeClass('d-none');	
			
});

// 사장님 댓글수정 submit
$(document).on("submit", "#reviewReplyUpdateForm", function(e){
	e.preventDefault();
		
		const $form = $(this);
		const rNo = $form.find('input[name="rNo"]').val();	
		const rrNo = $form.find('input[name="rrNo"]').val();	
		const sId = $form.find('input[name="sId"]').val();
		const content = $form.find('[name="content"]').val();
		const shopOwnerId = $("#shopOwnerId").val();

		console.log('수정ajax전송 전 rrNo:', rrNo,'rNo', rNo, 'sId:' , sId, 'shopOwnerId:', shopOwnerId, '대댓글 content값:', content);
		console.log('shopOwnerId:', $('#shopOwnerId').val());
		
		if(!content || content.trim().length == 0){
			alert('댓글을 입력하세요.');
			return;
		}
		$.ajax({
			url: '/reviewReplyUpdate.ajax',
			type: 'patch',
			data: JSON.stringify({
				rrNo: Number(rrNo),
				rNo: Number(rNo),
				sId: Number(sId),
				id: shopOwnerId,
				content: content
			}),
			contentType: "application/json",
			dataType: 'json',
			success: function(resData){
				console.log("✔ reviewReplyWrite.ajax resData:", resData);				    
				    console.log("   → reviewReplyMap keys:", Object.keys(resData.reviewReplyMap));
				    console.log("   → reviewReplyMap[rNo]:", resData.reviewReplyMap[resData.reviewList[0].rNo]);
				recallReviewList(resData.reviewList, resData.reviewReplyMap);
				
				const $replyForm = $form.closest('.reviewReplyForm');
				$replyForm.addClass('d-none');
				if($form[0] && $form[0].tagName == "FORM") $form[0].reset();
				$form.removeAttr('id');				
				$replyForm.find('.review-reply-submit-btn').text('등록');
				$replyForm.find('.modifyReviewReply, .deleteReviewReply').show();
			},
			error: function(xhr, status){
				alert('사장님 댓글 수정 오류: ' + status);
			}
		});
});

// 사장님 댓글 삭제
$(document).on("click", ".deleteReviewReply", function(){
	const rrNo = $(this).data("rrno");
	const sId = Number($(this).data('sid'));
	console.log("대댓글 삭제 클릭 ->", {rrNo: $(this).data("rrno"), sId: $(this).data("sid")});
	
	if (!confirm("댓글을 정말 삭제하시겠습니까?")) return;
	
	$.ajax({
		url: "/reviewReplyDelete.ajax",
		type: "delete",
		data: { rrNo: rrNo, sId: sId },
		dataType: "json",
		success: function(resData){
			delete resData.reviewReplyMap[rrNo];
			recallReviewList(resData.reviewList, resData.reviewReplyMap);		
		},
		error: function(xhr, status){
			alert("사장님 댓글 삭제 중 오류:" + status);
		}
	});
});


// 리뷰쓰기/수정/삭제 AJAX 성공 후~
function recallReviewList(reviewArr, reviewreplyMap){
	console.log("recallReviewList 호출!:", reviewArr, reviewreplyMap);
	$("#reviewFormOriginalContainer").append($("#reviewForm").addClass("d-none"));
	const loginId = $("#loginId").val();	
	const shopOwnerId = $("#shopOwnerId").val();
//	const shopId = $("input[name='sId']").first().val();
	const $list = $("#reviewList");
	const $none = $("#noReview");	
	
	if(!reviewArr.length){
		$list.empty();
		$none.show();
		return;
	}
	$none.hide();
	$list.empty();
	
	console.log('shopOwnerId:', $('#shopOwnerId').val());
		
	$("#reviewList").empty();	
	reviewArr.forEach(r => {
		const reply = reviewreplyMap[r.rno];	
		const shopId = r.sId;
		console.log(`-- 리뷰 ${r.rno} 에 대한 ownerReplyHtml:`, reviewreplyMap[r.rno]);
		console.log('loginId:', loginId, 'shopOwnerId:', shopOwnerId, 'reply', reply);
		let isMine = (loginId && r.id == loginId);
		let buttons = '';
		if(isMine){
			buttons += `
				<button class="modifyReview btn btn-outline-success btn-sm" data-no="${r.rno}" data-sid="${shopId}">
					<i class="bi bi-journal-text">수정</i>
				</button>
				<button class="deleteReview btn btn-outline-dark btn-sm" data-no="${r.rno}" data-sid="${shopId}">
					<i class="bi bi-telephone-outbound">삭제</i>
				</button>				
			`;
		} else {
			buttons += `
				<button class="btn btn-outline-danger btn-sm" onclick="reportReview('${r.rno}')">
					<i class="bi bi-telephone-outbound">신고</i>
				</button>
			`;
		}
		let date = new Date(r.regDate);
							let strDate = date.getFullYear() + "-" + ((date.getMonth() + 1 < 10)
															? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)) + "-"
															+ (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + " "
															+ (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + ":"
															+ (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) + ":"
															+ (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds());
	
		
		let ownerReplyHtml = '';
		if(reviewreplyMap[r.rno]){
			if(loginId == shopOwnerId){
			ownerReplyHtml =`
			<div class="card p-2 bg-light border-info" style="border-left:4px solid #3498db;">
													<div class="d-flex align-items-center mb-1">
														<span class="fw-bold text-primary">
															<i class="bi bi-person-badge"></i>사장님
														</span>
														<span class="text-muted small ms-2">${new Date(r.regDate).toLocaleString()}</span>
														<div class="ms-auto">
															<button type="button" class="btn btn-outline-primary btn-sm px-3 modifyReviewReply" 
															data-rrno="${reply.rrNo}" 
															data-rno="${r.rno}"
															data-sid="${shopId}">수정</button>
														  <button type="button" class="btn btn-outline-danger btn-sm px-3 deleteReviewReply" 
															data-rrno="${reply.rrNo}" 
															data-sid="${shopId}">삭제</button>
														</div>										
													</div>
													<div class="ms-3 fs-5 py-2">${reply.content}</div>
												</div>
												<div class="reviewReplyForm d-none mt-2">
													<form>			
												   <input type="hidden" name="rNo"  value="${r.rno}">
													 <input type="hidden" name="sId"  value="${shopOwnerId}">
													 <input type="hidden" name="rrNo" value="${reply.rrNo}">											
														<textarea name="content" class="form-control fs-5 py-3 mb-2" rows="3" maxlength="250" placeholder="사장님 댓글 수정"></textarea>
														<div class="text-end">
															<button type="submit" class="btn btn-success px-4 me-1">수정완료</button>															
														</div>
													</form>
												</div>
			`;
			
		} else {
			ownerReplyHtml =`
			<div class="card p-3 bg-light border-info mt-3" style="border-left:4px solid #3498db;">
				<div class="d-flex align-items-center mb-1">
					<span class="fw-bold text-primary">
						<i class="bi bi-person-badge"></i>사장님
					</span>
					<span class="text-muted small ms-2">${childDate(reviewreplyMap[r.rno].regDate)}</span>
				</div>
				<div class="ms-3 fs-5 py-2">${reviewreplyMap[r.rno].content}</div>
			</div>
			`;
		}
		} else if (loginId == shopOwnerId) {			
			ownerReplyHtml =	`
			<div class="mt-2 text-end">
					<button type="button" class="btn btn-outline-primary btn-sm px-2 py-0 review-reply-btn" data-review-no="${r.rno}">
							<i class="bi bi-person-badge"></i>사장님 댓글쓰기
					</button>
			</div>
			<div class="reviewReplyForm d-none p-3 rounded shadow-sm mt-2" style="background:#f8fafc;">
					<form class="review-reply-form">
						<input type="hidden" name="rNo" value="${r.rno}">
						<input type="hidden" name="sId" value="${shopId}">						
						<textarea name="content" class="form-control fs-5 py-3 mb-2" rows="3" maxlength="250" placeholder="사장님 댓글을 입력하세요" style="resize: none;"></textarea>
						<div class="text-end mt-2">
							<button type="submit" class="btn btn-success px-4 me-1">등록</button>
						</div>
					</form>
			</div>
			`;
		}
		let reviewHtml = `
		<div class="reviewRow border-bottom pb-3 mb-3" data-rno="${r.rno}">
						<div class="d-flex align-items-center mb-1">
							<span class="fw-bold">${r.id.substr(0,2)}**님</span>
							<span class="text-muted small ms-2">${new Date(r.regDate).toLocaleString()}</span>
							<div class="ms-auto">
								${buttons}
							</div>
					</div>
					<div class="mb-1">
						<span class="me-2 text-warning"><i class="bi bi-star-fill"></i></span>
						<span class="fw-bold ms-1">${r.rating}점</span>
					</div>
					${r.rpicture ? `<div>
							<img src="/images/review/${r.rpicture}?t=${Date.now()}" alt="리뷰사진" 
								style="max-width:200px;" class="rounded shadow-sm mb-2" />
					</div>` : ''}
					<div class="text-secondary small mb-1"><span>${r.menuName}</span></div>
					<div class="review-content">${r.content}</div>
					${ownerReplyHtml}
					</div>
		`;
		
		console.log("   appending reviewHtml:", /* reviewHtml 변수 */);
		$list.append(reviewHtml);		
	});
}

// 대댓글 날짜 함수
function childDate(rawDate) {
    const date = new Date(rawDate);
    return date.getFullYear() + "-"
        + ((date.getMonth() + 1 < 10) ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)) + "-"
        + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + " "
        + (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + ":"
        + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) + ":"
        + (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds());
}

// 리뷰 폼 리셋
function resetReviewForm(){
	$("#reviewFormOriginalContainer").append($("#reviewForm").addClass("d-none"));
	let $form = $("#reviewForm").find("form");
	console.log('$form.length:', $form.length, '$form:', $form);
	if($form.length && $form[0]){
		$form.attr("id", "reviewWriteForm").removeAttr("data-no");
		$form[0].reset();
		$form.find("#reviewSubmitButton").val("댓글쓰기").text("댓글쓰기");
		$form.find("#reviewContent").val("");
		$form.find('input[name="rating"]').prop('checked',false);
		$form.find("#imgPreview").hide().attr('src', '');
		
		//console.log("리뷰폼 구조:", $("#reviewForm").html());
		console.log("폼 개수:", $("#reviewForm").find("form").length);
	}
	
	if(previewUrl){URL.revokeObjectURL(previewUrl); previewUrl = null;}
	lastEditRno = null;
}








