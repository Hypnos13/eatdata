

// ==============================
// 찜하기 기능
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  const noReviewElement = document.getElementById("noReview");
  if (noReviewElement) {
    if(document.querySelectorAll("#reviewList .reviewRow").length > 0){
      noReviewElement.style.display = "none";
    } else {
      noReviewElement.style.display = "block";
    }
  }
	


$("#btnHeart").click(function () {
  const sId = $(this).data("sid");
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
      if (data && typeof data.heartCount !== 'undefined') {
        $("#heartCount").text(data.heartCount);
        alert("찜하기가 반영되었습니다.");
      } else {
        alert("찜하기 처리 결과가 올바르지 않습니다.");
      }
    },
    error: function (xhr, status, error) {
      alert(`찜하기 오류: ${xhr.statusText}, ${status}, ${error}`);
      console.error("찜하기 오류:", xhr.responseText);
    }
  });
});

// ==============================
// 리뷰 기능
// ==============================
$("#reviewWrite").click(() => $("#reviewForm").toggleClass("d-none"));

$(document).on("submit", "#reviewWriteForm", function (e) {
  e.preventDefault();

  /*const reviewContent = $("#reviewContent").val().trim();
  if (reviewContent.length === 0) {
      alert("리뷰 내용을 입력하세요~!!!");
      return false; // 제출을 막기 위해 false 반환
  }*/
  if (!$('input[name="rating"]:checked').val()) {
      alert("별점을 선택하세요~!");
      return false;
  }

  const formData = new FormData(this);
  formData.append("oNo", $("#reviewOrdersSelect").val()); // oNo 추가

  // 유효성 검사를 통과했을 때만 AJAX 호출
  if (reviewContent.length > 0 && $('input[name="rating"]:checked').val()) {
      $.ajax({
        url: "reviewWrite.ajax",
        data: formData,
        type: "post",
        processData: false, 
        contentType: false, 
        dataType: "json",
        success: function (resData) {
          console.log('resData: ' ,resData);					
          recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId); // 리뷰 목록 새로고침
          $("#reviewWriteForm")[0].reset(); 
          $("#reviewForm").addClass("d-none"); 
        },
        error: function (xhr, status, error) {
          alert("댓글 등록 오류: " + (xhr.responseText || error));
          console.error("댓글 등록 오류:", xhr.responseText);
        }
      });
  }
});

// 리뷰 사진 미리보기
$("#rPicture").on("change", function () { 
  const file = this.files[0];
  const $imgPreview = $('#imgPreview');

  if (!file) {
      $imgPreview.hide().attr('src', ''); 
      return;
  }
	const reader = new FileReader();
	 reader.onload = function (e) {
	   $imgPreview.attr('src', e.target.result).show();
	 };
	 reader.readAsDataURL(file);
	});

	
	//검색버튼
	const searchSubmitBtn = document.getElementById('searchSubmitBtn');
if (searchSubmitBtn) {
    searchSubmitBtn.addEventListener('click', function () {
	    const keyword = document.querySelector('#searchBox input[type="text"]').value.trim();

		const locationInput = document.getElementById('location-input');
		      const address = locationInput ? locationInput.value.trim() : '';

		      // URL 구성 (keyword, address 둘 다 포함)
			  let searchUrl = `/shopList?keyword=${encodeURIComponent(keyword)}`;
			  if (address) {
			      searchUrl += `&address=${encodeURIComponent(address)}`;
			  }

	    // 페이지 이동
	    window.location.href = searchUrl;
	});
	
};




// 찜하기 하트
/*$(function(){
	
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
*/

//찜하기~
$(function(){
	$('#btnLikeList').click(function(){
		const loginId = window.currentUserId;
		if (!loginId){
			alert('로그인 후 이용가능함');
			return;
		}
		
		const $btn = $(this);	
		const sId = $btn.data('sid');
		console.log('trying to like shop:', sId);
		const dto = { id: loginId, sId: sId};
		
		$.ajax({
			url: '/like.ajax',
			type: 'POST',
			contentType: 'application/json; charset=UTF-8',
			dataType:'json',
			data: JSON.stringify(dto),
			success(res){
		if(res.liked){
			$btn.addClass('btn-danger liked').removeClass('btn-outline-secondary');
			$('#likeText').text('찜');
			alert('찜!💖');
		} else {
			$btn.removeClass('btn-danger liked').addClass('btn-outline-secondary');
			$('#likeText').text('찜하기');
			alert('찜 해제!💔');
			}
			$('#likeCount').text(res.heartCount != null ?  res.heartCount : 0);
				
			
		},
		error(xhr, status, error){
			console.error(error);
			alert('찜 처리 오류');
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
		
		// 주문 했던 목록 꺼내기
		const sId = $("#shopId").val();
		const userId = window.currentUserId;

		if (userId && sId){
			$.ajax({
				url: "/ajax/reviewableOrders",
				type: "GET",
				data: {sId:sId},
				success: function(response){
					const $orderSelect = $("#reviewOrdersSelect");
					$orderSelect.empty();
					$orderSelect.append('<option value="">주문을 선택하세요</option>');
					
					if (response && response.length > 0){
						response.forEach(order => {
							const orderText = `${order.menus} (${new Date(order.regDate).toLocaleDateString()})`;
							$orderSelect.append(`<option value="${order.ono}">${orderText}</option>`);
						});
					}
						else{
							$orderSelect.append('<option value="">리뷰 가능한 주문이 없습니다.</option>');
						}
					},
					error: function(xhr, status, error){
						console.error("리뷰 가능한 주문을 불러오는데 실패했습니다.:", error);
						alert("리뷰 가능한 주문을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.");
					}
				})
		}else{
			console.warn("리뷰 가능한 주문을 불러오기 위한 사용자 ID  또는 가게 ID가 없습니다.");
			$("#reviewOrderSelect").empty().append('<option value="">로그인 후 이용해주세요.</option>');
		}	


		
	});
	

	
	// 댓글쓰기 submit
	$(document).on("submit", "#reviewWriteForm", function(e){
		e.preventDefault();
		
		const reviewContent = $("#reviewContent").val().trim();
		if (reviewContent.length === 0) {
			alert("리뷰 내용을 입력하세요~");
			return false;
		}

		if (!$('input[name="rating"]:checked').val()){
			alert("별점을 선택하세요~!");
			return false;
		}
		let formData = new FormData(this);
		formData.append("oNo", $("#reviewOrdersSelect").val());
		
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
				
				console.log("새 리뷰 작성 후 서버로부터 받은 리뷰 목록:", JSON.stringify(resData.reviewList,null,2));
				recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
				resetReviewForm();
				
				// 리뷰 작성 성공 후, 주문 선택 목록을 다시 불러와 갱신합니다.
				const sId = $("#shopId").val();
				$.ajax({
					url: "/ajax/reviewableOrders",
					type: "GET",
					data: {sId:sId},
					success: function(orders){
						const $orderSelect = $("#reviewOrdersSelect");
						$orderSelect.empty();
						$orderSelect.append('<option value="">주문을 선택하세요</option>');
						if (orders && orders.length > 0){
							orders.forEach(order => {
								const orderText = `${order.menus} (${new Date(order.regDate).toLocaleDateString()})`;
								$orderSelect.append(`<option value="${order.ono}">${orderText}</option>`);
							});
						} else {
							$orderSelect.append('<option value="" disabled>리뷰를 작성할 주문이 없습니다.</option>');
						}
					}
				});
				
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
	
	let $reviewRow = $(this).closest(".reviewRow");
	if(!$reviewRow.length){
		alert("리뷰 요소를 못찾음");
		return;
	}
	let rno = $(this).data("no");
	let ono = $(this).data("ono");
	let menus = $(this).data("menus");
	let mid = $(this).data("mid"); 
	let sIdFromButton = $(this).data("sid"); 
	console.log("sId from modify button:", sIdFromButton); 
	lastEditRno = rno;
	
	$reviewRow.after($("#reviewForm").removeClass("d-none"));
	
	let $form = $("#reviewForm").find("form");
	let reviewContent = $reviewRow.find(".review-content").text();
	$form.find("#reviewContent").val($.trim(reviewContent));			
	$form.attr("id", "reviewUpdateForm").attr("data-no", rno);
	$form.data("ono", ono); // Store ono in data attribute
	$form.data("sid", $(this).data("sid")); // Store sid in data attribute
	$form.data("mid", mid); // Store mid in data attribute		
	$("#reviewForm input[type='submit']").val("댓글수정").text("댓글수정");

	// 주문 선택 드롭다운 비활성화 및 값 설정
	const $orderSelect = $("#reviewOrdersSelect");
	$orderSelect.empty();
	$orderSelect.append(`<option value="${ono}">${menus}</option>`);
	$orderSelect.prop("disabled", false); // Enable the dropdown
});

// 댓글 수정 폼 submit
$(document).on("submit", "#reviewUpdateForm", function(e){
	e.preventDefault();
	
	const reviewContent = $("#reviewContent").val().trim();
	if (reviewContent.length === 0) {
		alert("리뷰 내용을 입력하세요");
		return false;
	}
	if (!$('input[name="rating"]:checked').val()){
		alert("별점을 선택하세요~!");
		return false;
	}

	let form = this;
	let formData = new FormData(form);
	formData.append("rNo", $(form).attr("data-no"));
	formData.append("oNo", $(form).data("ono"));
	formData.append("sId", $(form).data("sid"));
	formData.append("mId", $(form).data("mid"));

	
	console.log("전송할 rNo (수정):", $(form).attr("data-no"));
	console.log("전송할 FormData:", formData);
	for (let [key, value] of formData.entries()) {
	    console.log(`${key}: ${value}`);
	}
	
	$.ajax({
			"url": "reviewUpdate.ajax",
			"data": formData,
			"type": "patch",
			"processData": false,
			"contentType": false,
			"dataType": "json",
			"success": function(resData){
				console.log('resData: ' ,resData);				
				
				// 서버에서 reviewList를 반환하면 성공으로 간주하고 처리
				recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);				
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
		if(sId == undefined || sId == 'undefined'){
			sId = $('#reviewWriteForm input[name="sId"]').val();
		}
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
					
				recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
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
	const $replyFormContainer = $(this).closest('.reviewRow').find('.reviewReplyForm');
	const sId = $replyFormContainer.find("input[name='sId']").val();
	$('.reviewReplyForm').addClass('d-none');
	$replyFormContainer.removeClass('d-none');
	$replyFormContainer.find('input[name="rNo"]').val(rNo);
	
	console.log('사장님 대댓글쓰기 버튼 클릭 rNo:', rNo, 'sId', sId);	
	console.log('폼 input[name="rNo"] 값:', $replyFormContainer.find('input[name="rNo"]').val());
});
// 사장님 댓글쓰기 submit
$(document).on('submit', '.review-reply-form', function(e){
	e.preventDefault();
	
	const $form = $(this);
	const rNo = $form.find('input[name="rNo"]').val();	
	const rrNo = $form.find('input[name="rrNo"]').val();	
	
	const $sIdInput = $form.find('input[name="sId"]'); // Get the sId input element
	const sId = $sIdInput.val(); // Get its value

	console.log('main.js - $sIdInput found:', $sIdInput.length > 0); // Check if element is found
	console.log('main.js - sId from form:', sId); 

	const content = $form.find('textarea[name="content"]').val();
	const shopOwnerId = $form.find('input[name="id"]').val();

	console.log('ajax전송 전 rrNo:', rrNo, 'sId:' , sId, 'shopOwnerId:', shopOwnerId, '대댓글 content값:', content);
	
	if(!content || content.trim().length == 0){
		alert('댓글을 입력하세요.');
		return;
	}
	$.ajax({
		url: '/reviewReplyWrite.ajax',
		type: 'post',
		data: {
			rNo: Number(rNo),
			sId: Number(sId),
			id: shopOwnerId,
			content: content
		},
		dataType: 'json',
		success: function(resData){
			recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
			
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
				const sId = Number($replyForm.find("input[name='sId']").first().val());
		const content = $reviewRow.find('.ms-3.fs-5.py-2').text().trim();
		
		$replyForm.find('.review-reply-submit-btn').text('수정하기');
		$replyForm.find('.modifyReviewReply, .deleteReviewReply').hide();
		$replyForm.find('input[name="rNo"]').val(rNo);
		$replyForm.find('input[name="rrNo"]').val(rrNo);
		$replyForm.find('input[name="sId"]').val(sId);
		$replyForm.find('textarea[name="content"]').val(content);
		$replyForm.find('form').attr('id', 'reviewReplyUpdateForm');
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
		const shopOwnerId = $form.find('input[name="id"]').val();

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
				recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
				
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
	let sId = $(this).data("sid");
	console.log("대댓글 삭제 클릭 ->", {rrNo: $(this).data("rrno"), sId: $(this).data("sid")});
		if(!sId){
			sId = $('#reviewWriteForm input[name="sId"]').val();
		}
	if (!confirm("댓글을 정말 삭제하시겠습니까?")) return;
	
	$.ajax({
		url: "/reviewReplyDelete.ajax",
		type: "delete",
		data: { rrNo: rrNo, sId: sId },
		dataType: "json",
		success: function(resData){
			delete resData.reviewReplyMap[rrNo];
			recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);		
		},
		error: function(xhr, status){
			alert("사장님 댓글 삭제 중 오류:" + status);
		}
	});
});


// 리뷰쓰기/수정/삭제 AJAX 성공 후~
function recallReviewList(reviewArr, reviewreplyMap, shopOwnerId, loginId){
	console.log("recallReviewList 호출!:", reviewArr, reviewreplyMap);
	$("#reviewFormOriginalContainer").append($("#reviewForm").addClass("d-none"));
	loginId = window.currentUserId;
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
		const shopId = r.s_id;
								
		console.log(`-- 리뷰 ${r.rno} 에 대한 ownerReplyHtml:`, reviewreplyMap[r.rno]);
		console.log('loginId:', loginId, 'shopOwnerId:', shopOwnerId, 'reply', reply);
		let isMine = (loginId && r.id == loginId);
		let buttons = '';
		if(isMine){
			buttons += `
				<button class="modifyReview btn btn-outline-success btn-sm" data-no="${r.rno}" data-sid="${shopId}" data-ono="${r.ono}" data-menus="${r.menus}" data-mid="${r.mid}">
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
													 <input type="hidden" name="sId"  value="${shopId}">
													 <input type="hidden" name="rrNo" value="${reply.rrNo}">
													 <input type="hidden" name="id" value="${shopOwnerId}">											
														<textarea name="content" class="form-control fs-5 py-3 mb-2" rows="3" maxlength="250" placeholder="사장님 댓글 수정"></textarea>
														<div class="text-end">
																										<button type="submit" class="btn btn-success px-4 me-1">수정완료</button>											
										</div>
									</form>
								</div>											
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
					<span class="text-muted small ms-2">${new Date(reviewreplyMap[r.rno].regDate).toLocaleString()}</span>
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
						<input type="hidden" name="id" value="${shopOwnerId}">						
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
							<img src="${r.rpicture}?t=${Date.now()}" alt="리뷰사진" 
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



// 없애면 메뉴 모달창 안뜸
  /*const reader = new FileReader();
  reader.onload = function (e) {
    $imgPreview.attr('src', e.target.result).show();
  };
  reader.readAsDataURL(file);*/
});


// 리뷰 사진 미리보기
/*$("#rPicture").on("change", function () { // ID를 rPicture로 변경
  const file = this.files[0];
  const $imgPreview = $('#imgPreview'); // jQuery 객체로 변경

  if (!file) {
      $imgPreview.hide().attr('src', ''); // 파일 없으면 숨기고 src 초기화
      return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    $imgPreview.attr('src', e.target.result).show();
  };
  reader.readAsDataURL(file);
});*/

