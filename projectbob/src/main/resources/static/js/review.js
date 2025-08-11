
// A reset function is called but not defined. Let's define a basic one.
function resetReviewForm() {
    const $reviewFormContainer = $("#reviewForm");
    if (!$reviewFormContainer.length) return;

    const $form = $reviewFormContainer.find("form");

    if ($form.length && $form[0].reset) {
        $form[0].reset();
    }

    $form.attr("id", "reviewWriteForm").removeAttr("data-no");
    $reviewFormContainer.find("#reviewSubmitButton").val("댓글쓰기").text("댓글쓰기");
    $reviewFormContainer.find("#imgPreview").hide().attr('src', '');

    // Move the form back to its original place and hide it
    $("#reviewFormOriginalContainer").append($reviewFormContainer.addClass("d-none"));
}

// 리뷰 목록 다시 그리기
function recallReviewList(reviewArr, reviewreplyMap, shopOwnerId){
	console.log("recallReviewList 호출!:", reviewArr, reviewreplyMap);
	$("#reviewFormOriginalContainer").append($("#reviewForm").addClass("d-none"));
	let loginId = window.currentUserId;
	const $list = $("#reviewList");
	const $none = $("#noReview");	
	
	if(!reviewArr || reviewArr.length === 0){
		$list.empty();
		$none.show();
		return;
	}
	$none.hide();
	$list.empty();
	
	reviewArr.forEach(r => {
		const reply = reviewreplyMap[r.rno];		
		const shopId = r.s_id;
								
		let isMine = (loginId && r.id == loginId);
		let buttons = '';
		if(isMine){
			buttons += `
				<button class="modifyReview btn btn-outline-success btn-sm" data-no="${r.rno}" data-sid="${shopId}" data-ono="${r.ono}" data-menus="${r.menus}">
					<i class="bi bi-journal-text">수정</i>
				</button>
				<button class="deleteReview btn btn-outline-dark btn-sm" data-no="${r.rno}" data-sid="${shopId}">
					<i class="bi bi-trash">삭제</i>
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
        let strDate = date.getFullYear() + "-" + ((date.getMonth() + 1 < 10) ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)) + "-" + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate());

		let ownerReplyHtml = '';
		if(reply){
            let replyDate = new Date(reply.regDate);
            let replyStrDate = replyDate.getFullYear() + "-" + ((replyDate.getMonth() + 1 < 10) ? "0" + (replyDate.getMonth() + 1) : (replyDate.getMonth() + 1)) + "-" + (replyDate.getDate() < 10 ? "0" + replyDate.getDate() : replyDate.getDate());
			ownerReplyHtml =`
			<div class="mt-3">
				<div class="card p-2 bg-light border-info" style="border-left:4px solid #3498db;">
					<div class="d-flex align-items-center mb-1">
						<span class="fw-bold text-primary">
							<i class="bi bi-person-badge"></i>사장님
						</span>
						<span class="text-muted small ms-2">${replyStrDate}</span>
						<div class="ms-auto">
							<button type="button" class="btn btn-outline-primary btn-sm px-3 modifyReviewReply"
									data-rrno="${reply.rrNo}" data-rno="${r.rno}"
									data-content="${reply.content}">수정</button>
							<button type="button" class="btn btn-outline-danger btn-sm px-3 deleteReviewReply"
									data-rrno="${reply.rrNo}" data-sid="${shopId}">삭제</button>
						</div>						
					</div>
					<div class="ms-3">${reply.content}</div>
				</div>
			</div>
			`;
		} else if (loginId == shopOwnerId) {
            ownerReplyHtml = `
            <div class="mt-2 text-end">
                <button type="button" class="btn btn-outline-primary btn-sm px-2 py-0 review-reply-btn" data-review-no="${r.rno}">
                    <i class="bi bi-person-badge"></i>사장님 댓글쓰기
                </button>
            </div>
            `;
        }

        // A reset function is called but not defined. Let's define a basic one.
function resetReviewForm() {
    const $reviewFormContainer = $("#reviewForm");
    if (!$reviewFormContainer.length) return;

    const $form = $reviewFormContainer.find("form");

    if ($form.length && $form[0].reset) {
        $form[0].reset();
    }

    $form.attr("id", "reviewWriteForm").removeAttr("data-no");
    $reviewFormContainer.find("#reviewSubmitButton").val("댓글쓰기").text("댓글쓰기");
    $reviewFormContainer.find("#imgPreview").hide().attr('src', '');

    // Move the form back to its original place and hide it
    $("#reviewFormOriginalContainer").append($reviewFormContainer.addClass("d-none"));
}

// 리뷰 목록 다시 그리기
function recallReviewList(reviewArr, reviewreplyMap, shopOwnerId){
	console.log("recallReviewList 호출!:", reviewArr, reviewreplyMap);
	$("#reviewFormOriginalContainer").append($("#reviewForm").addClass("d-none"));
	let loginId = window.currentUserId;
	const $list = $("#reviewList");
	const $none = $("#noReview");	
	
	if(!reviewArr || reviewArr.length === 0){
		$list.empty();
		$none.show();
		return;
	}
	$none.hide();
	$list.empty();
	
	reviewArr.forEach(r => {
		const reply = reviewreplyMap[r.rno];		
		const shopId = r.s_id;
								
		let isMine = (loginId && r.id == loginId);
		let buttons = '';
		if(isMine){
			buttons += `
				<button class="modifyReview btn btn-outline-success btn-sm" data-no="${r.rno}" data-sid="${shopId}" data-ono="${r.ono}" data-menus="${r.menus}">
					<i class="bi bi-journal-text">수정</i>
				</button>
				<button class="deleteReview btn btn-outline-dark btn-sm" data-no="${r.rno}" data-sid="${shopId}">
					<i class="bi bi-trash">삭제</i>
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
        let strDate = date.getFullYear() + "-" + ((date.getMonth() + 1 < 10) ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)) + "-" + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate());

		let ownerReplyHtml = '';
		if(reply){
            let replyDate = new Date(reply.regDate);
            let replyStrDate = replyDate.getFullYear() + "-" + ((replyDate.getMonth() + 1 < 10) ? "0" + (replyDate.getMonth() + 1) : (replyDate.getMonth() + 1)) + "-" + (replyDate.getDate() < 10 ? "0" + replyDate.getDate() : replyDate.getDate());
			
            let ownerButtons = '';
            if (loginId == shopOwnerId) {
                ownerButtons = `
                <div class="ms-auto">
                    <button type="button" class="btn btn-outline-primary btn-sm px-3 modifyReviewReply"
                            data-rrno="${reply.rrNo}" data-rno="${r.rno}"
                            data-content="${reply.content}">수정</button>
                    <button type="button" class="btn btn-outline-danger btn-sm px-3 deleteReviewReply"
                            data-rrno="${reply.rrNo}" data-sid="${shopId}">삭제</button>
                </div>`;
            }

            ownerReplyHtml =`
			<div class="mt-3">
				<div class="card p-2 bg-light border-info" style="border-left:4px solid #3498db;">
					<div class="d-flex align-items-center mb-1">
						<span class="fw-bold text-primary">
							<i class="bi bi-person-badge"></i>사장님
						</span>
						<span class="text-muted small ms-2">${replyStrDate}</span>
						${ownerButtons}
					</div>
					<div class="ms-3">${reply.content}</div>
				</div>
			</div>
			`;
		} else if (loginId == shopOwnerId) {
            ownerReplyHtml = `
            <div class="mt-2 text-end">
                <button type="button" class="btn btn-outline-primary btn-sm px-2 py-0 review-reply-btn" data-review-no="${r.rno}">
                    <i class="bi bi-person-badge"></i>사장님 댓글쓰기
                </button>
            </div>
            `;
        }

        const reviewHtml = `
        <div class="reviewRow border-bottom pb-3 mb-3" data-rno="${r.rno}">
            <div class="d-flex align-items-center mb-1">
                <span class="fw-bold">${r.id.substring(0,2)}**님</span>
                <span class="text-muted small ms-2">${strDate}</span>
                <div class="ms-auto">${buttons}</div>
            </div>
            <div class="mb-1">
                <span class="me-2 text-warning"><i class="bi bi-star-fill"></i></span>
                <span class="fw-bold ms-1">${r.rating}점</span>
            </div>
            ${r.rPicture ? `<div><img src="${r.rPicture}" alt="리뷰사진" style="max-width:200px;" class="rounded shadow-sm mb-2" /></div>` : ''}
            <div class="text-secondary small mb-1">
                <span>${r.menuName}</span>
            </div>
            <div class="review-content">${r.content}</div>
            ${ownerReplyHtml}
            <!-- 사장님 댓글 폼이 들어갈 자리 -->
            <div class="reviewReplyForm d-none p-3 mt-2 rounded shadow-sm" style="background:#f8fafc;">
                <form class="review-reply-form">
                    <input type="hidden" name="rNo" value="${r.rno}">
                    <input type="hidden" name="sId" value="${shopId}">
                    <input type="hidden" name="id" value="${shopOwnerId}">
                    <div class="mb-2">
                        <textarea name="content" class="form-control" rows="3" placeholder="사장님 댓글을 입력하세요"></textarea>
                    </div>
                    <div class="text-end">
                        <button class="btn btn-success px-4 me-1 review-reply-submit-btn" type="submit">등록</button>
                    </div>
                </form>
            </div>
        </div>
        `;
		$list.append(reviewHtml);
	});
}

function reportReview(elemId){
	let result = confirm("이 댓글을 신고하시겠습니까?");
	if(result){
		alert("신고가 접수되었습니다.");
        // 실제 신고 로직은 여기에 추가
	}
}


$(document).ready(function() {
    // =============================
    // 찜하기 기능
    // =============================
    $(document).on('click', '#btnLikeList', function() {
        const loginId = window.currentUserId;
        if (!loginId) {
            alert('로그인 후 이용가능합니다.');
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `/login?redirectURL=${currentUrl}`; // Changed to /login
            return;
        }

        const $btn = $(this);
        const sId = $btn.data('sid');
        const dto = { id: loginId, sId: sId };

        $.ajax({
            url: '/like.ajax',
            type: 'POST',
            contentType: 'application/json; charset=UTF-8',
            dataType: 'json',
            data: JSON.stringify(dto),
            success: function(res) {
                if (res.liked) {
                    $btn.removeClass('btn-outline-secondary btn-secondary').addClass('btn-danger liked');
                    $('#likeText').text('찜');
                    alert('찜!💖');
                } else {
                    $btn.removeClass('btn-danger btn-secondary liked').addClass('btn-outline-secondary');
                    $('#likeText').text('찜하기');
                    alert('찜 해제!💔');
                }
                $('#likeCount').text(res.heartCount != null ? res.heartCount : 0);
            },
            error: function() {
                alert('찜 처리 중 오류가 발생했습니다.');
            }
        });
    });

    // =============================
    // 리뷰 기능
    // =============================

    // 리뷰 쓰기 버튼 클릭
    $(document).on("click", "#reviewWrite", function() {
        resetReviewForm();
        $("#reviewForm").removeClass("d-none");

        const sId = $("#shopId").val();
        if (window.currentUserId && sId) {
            $.ajax({
                url: "/ajax/reviewableOrders",
                type: "GET",
                data: { sId: sId },
                success: function(response) {
                    const $orderSelect = $("#reviewOrdersSelect");
                    $orderSelect.empty().append('<option value="">주문을 선택하세요</option>');
                    if (response && response.length > 0) {
                        response.forEach(order => {
                            const orderText = `${order.menus} (${new Date(order.regDate).toLocaleDateString()})`;
                            $orderSelect.append(`<option value="${order.ono}">${orderText}</option>`);
                        });
                    } else {
                        $orderSelect.append('<option value="" disabled>리뷰 가능한 주문이 없습니다.</option>');
                    }
                },
                error: function() {
                    alert("리뷰 가능한 주문 목록을 불러오는 데 실패했습니다.");
                }
            });
        }
    });

    // 리뷰 쓰기/수정 폼 공통 제출 로직
    $(document).on("submit", "#reviewWriteForm, #reviewUpdateForm", function(e) {
        e.preventDefault();
        const isUpdate = this.id === 'reviewUpdateForm';
        const url = isUpdate ? "reviewUpdate.ajax" : "reviewWrite.ajax";
        const method = isUpdate ? "patch" : "post";

        if (!$(this).find('input[name="rating"]:checked').val()) {
            alert("별점을 선택하세요!");
            return false;
        }
        if ($(this).find("#reviewContent").val().trim().length === 0) {
            alert("리뷰 내용을 입력하세요.");
            return false;
        }

        let formData = new FormData(this);
        if (isUpdate) {
            formData.append("rNo", $(this).attr("data-no"));
            formData.append("oNo", $(this).data("ono"));
            formData.append("sId", $(this).data("sid"));
        } else {
            formData.append("oNo", $("#reviewOrdersSelect").val());
        }

        $.ajax({
            url: url,
            data: formData,
            type: method,
            processData: false,
            contentType: false,
            dataType: "json",
            success: function(resData) {
                recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
                resetReviewForm();
            },
            error: function(xhr) {
                alert(`댓글 ${isUpdate ? '수정' : '등록'} 오류: ` + xhr.responseText);
            }
        });
    });
    
    // 리뷰 수정 버튼 클릭
    $(document).on("click", ".modifyReview", function() {
        resetReviewForm();
        const $reviewRow = $(this).closest(".reviewRow");
        const rno = $(this).data("no");
        const ono = $(this).data("ono");
        const menus = $(this).data("menus");

        $reviewRow.after($("#reviewForm").removeClass("d-none"));

        const $form = $("#reviewForm").find("form");
        const reviewContent = $reviewRow.find(".review-content").text();
        
        $form.find("#reviewContent").val($.trim(reviewContent));
        $form.attr("id", "reviewUpdateForm").attr("data-no", rno);
        $form.data("ono", ono);
        $form.data("sid", $(this).data("sid"));
        $("#reviewSubmitButton").val("댓글수정");

        const $orderSelect = $("#reviewOrdersSelect");
        $orderSelect.empty().append(`<option value="${ono}">${menus}</option>`).prop("disabled", false);
    });

    // 리뷰 삭제 버튼 클릭
    $(document).on("click", ".deleteReview", function() {
        if (!confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;
        
        const rNo = $(this).data("no");
        const sId = $(this).data("sid");

        $.ajax({
            url: "reviewDelete.ajax",
            data: { rNo: rNo, sId: sId },
            type: "delete",
            dataType: "json",
            success: function(resData) {
                recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
                resetReviewForm();
            },
            error: function(xhr) {
                alert("댓글 삭제 오류: " + xhr.responseText);
            }
        });
    });

    // 리뷰 사진 미리보기
    $(document).on("change", "#rPicture", function() {
        const file = this.files[0];
        const $imgPreview = $('#imgPreview');
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $imgPreview.attr('src', e.target.result).show();
            };
            reader.readAsDataURL(file);
        } else {
            $imgPreview.hide().attr('src', '');
        }
    });

    // 사장님 댓글쓰기 버튼 클릭
    $(document).on('click', '.review-reply-btn', function(){
        const $reviewRow = $(this).closest('.reviewRow');
        // 모든 다른 폼은 숨김
        $('.reviewReplyForm').addClass('d-none');
        // 현재 폼만 보여줌
        $reviewRow.find('.reviewReplyForm').removeClass('d-none');
    });

    // 사장님 댓글 폼 제출 (등록/수정)
    $(document).on('submit', '.review-reply-form form', function(e){
        e.preventDefault();
        const $form = $(this);
        const content = $form.find('textarea[name="content"]').val();
        if(!content || content.trim().length == 0){
            alert('댓글을 입력하세요.');
            return;
        }

        const isUpdate = $form.find('input[name="rrNo"]').length > 0 && $form.find('input[name="rrNo"]').val() !== '';
        const url = isUpdate ? '/reviewReplyUpdate.ajax' : '/reviewReplyWrite.ajax';
        const type = isUpdate ? 'patch' : 'post';
        
        const data = {
            rNo: Number($form.find('input[name="rNo"]').val()),
            sId: Number($form.find('input[name="sId"]').val()),
            id: $form.find('input[name="id"]').val(),
            content: content,
            rrNo: isUpdate ? Number($form.find('input[name="rrNo"]').val()) : undefined
        };

        $.ajax({
            url: url,
            type: type,
            contentType: "application/json", // ADDED
            data: JSON.stringify(data), // CHANGED
            dataType: 'json',
            success: function(resData){
                recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
            },
            error: function() {
                alert(`사장님 댓글 ${isUpdate ? '수정' : '등록'} 오류`);
            }
        });
    });

    // 사장님 댓글 수정 클릭
    $(document).on("click", ".modifyReviewReply", function(){
        const $reviewRow = $(this).closest('.reviewRow');
        const $replyFormContainer = $reviewRow.find('.reviewReplyForm');
        const $form = $replyFormContainer.find('form');

        // 데이터 채우기
        $form.find('textarea[name="content"]').val($(this).data('content'));
        $form.find('.review-reply-submit-btn').text('수정');
        // rrNo를 폼에 추가하여 수정 모드임을 알림
        if($form.find('input[name="rrNo"]').length === 0) {
            $form.append(`<input type="hidden" name="rrNo" value="${$(this).data('rrno')}">`);
        } else {
            $form.find('input[name="rrNo"]').val($(this).data('rrno'));
        }
        
        $('.reviewReplyForm').addClass('d-none');
        $replyFormContainer.removeClass('d-none');
        $form.find('textarea[name="content"]').focus();
    });

    // 사장님 댓글 삭제
    $(document).on("click", ".deleteReviewReply", function(){
        if (!confirm("사장님 댓글을 정말 삭제하시겠습니까?")) return;

        const rrNo = $(this).data("rrno");
        const sId = $(this).data("sid");
        
        $.ajax({
            url: "/reviewReplyDelete.ajax",
            type: "delete",
            data: { rrNo: rrNo, sId: sId },
            dataType: "json",
            success: function(resData){
                recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
            },
            error: function() {
                alert("사장님 댓글 삭제 중 오류가 발생했습니다.");
            }
        });
    });
});

		$list.append(reviewHtml);
	});
}

function reportReview(elemId){
	let result = confirm("이 댓글을 신고하시겠습니까?");
	if(result){
		alert("신고가 접수되었습니다.");
        // 실제 신고 로직은 여기에 추가
	}
}


$(document).ready(function() {
    // =============================
    // 찜하기 기능
    // =============================
    $(document).on('click', '#btnLikeList', function() {
        const loginId = window.currentUserId;
        if (!loginId) {
            alert('로그인 후 이용가능합니다.');
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `/login?redirectURL=${currentUrl}`;
            return;
        }

        const $btn = $(this);
        const sId = $btn.data('sid');
        const dto = { id: loginId, sId: sId };

        $.ajax({
            url: '/like.ajax',
            type: 'POST',
            contentType: 'application/json; charset=UTF-8',
            dataType: 'json',
            data: JSON.stringify(dto),
            success: function(res) {
                if (res.liked) {
                    $btn.removeClass('btn-outline-secondary btn-secondary').addClass('btn-danger liked');
                    $('#likeText').text('찜');
                    alert('찜!💖');
                } else {
                    $btn.removeClass('btn-danger btn-secondary liked').addClass('btn-outline-secondary');
                    $('#likeText').text('찜하기');
                    alert('찜 해제!💔');
                }
                $('#likeCount').text(res.heartCount != null ? res.heartCount : 0);
            },
            error: function() {
                alert('찜 처리 중 오류가 발생했습니다.');
            }
        });
    });

    // =============================
    // 리뷰 기능
    // =============================

    // 리뷰 쓰기 버튼 클릭
    $(document).on("click", "#reviewWrite", function() {
        resetReviewForm();
        $("#reviewForm").removeClass("d-none");

        const sId = $("#shopId").val();
        if (window.currentUserId && sId) {
            $.ajax({
                url: "/ajax/reviewableOrders",
                type: "GET",
                data: { sId: sId },
                success: function(response) {
                    const $orderSelect = $("#reviewOrdersSelect");
                    $orderSelect.empty().append('<option value="">주문을 선택하세요</option>');
                    if (response && response.length > 0) {
                        response.forEach(order => {
                            const orderText = `${order.menus} (${new Date(order.regDate).toLocaleDateString()})`;
                            $orderSelect.append(`<option value="${order.ono}">${orderText}</option>`);
                        });
                    } else {
                        $orderSelect.append('<option value="" disabled>리뷰 가능한 주문이 없습니다.</option>');
                    }
                },
                error: function() {
                    alert("리뷰 가능한 주문 목록을 불러오는 데 실패했습니다.");
                }
            });
        }
    });

    // 리뷰 쓰기/수정 폼 공통 제출 로직
    $(document).on("submit", "#reviewWriteForm, #reviewUpdateForm", function(e) {
        e.preventDefault();
        const isUpdate = this.id === 'reviewUpdateForm';
        const url = isUpdate ? "reviewUpdate.ajax" : "reviewWrite.ajax";
        const method = isUpdate ? "patch" : "post";

        if (!$(this).find('input[name="rating"]:checked').val()) {
            alert("별점을 선택하세요!");
            return false;
        }
        if ($(this).find("#reviewContent").val().trim().length === 0) {
            alert("리뷰 내용을 입력하세요.");
            return false;
        }

        let formData = new FormData(this);
        if (isUpdate) {
            formData.append("rNo", $(this).attr("data-no"));
            formData.append("oNo", $(this).data("ono"));
            formData.append("sId", $(this).data("sid"));
        } else {
            formData.append("oNo", $("#reviewOrdersSelect").val());
        }

        $.ajax({
            url: url,
            data: formData,
            type: method,
            processData: false,
            contentType: false,
            dataType: "json",
            success: function(resData) {
                recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
                resetReviewForm();
            },
            error: function(xhr) {
                alert(`댓글 ${isUpdate ? '수정' : '등록'} 오류: ` + xhr.responseText);
            }
        });
    });
    
    // 리뷰 수정 버튼 클릭
    $(document).on("click", ".modifyReview", function() {
        resetReviewForm();
        const $reviewRow = $(this).closest(".reviewRow");
        const rno = $(this).data("no");
        const ono = $(this).data("ono");
        const menus = $(this).data("menus");

        $reviewRow.after($("#reviewForm").removeClass("d-none"));

        const $form = $("#reviewForm").find("form");
        const reviewContent = $reviewRow.find(".review-content").text();
        
        $form.find("#reviewContent").val($.trim(reviewContent));
        $form.attr("id", "reviewUpdateForm").attr("data-no", rno);
        $form.data("ono", ono);
        $form.data("sid", $(this).data("sid"));
        $("#reviewSubmitButton").val("댓글수정");

        const $orderSelect = $("#reviewOrdersSelect");
        $orderSelect.empty().append(`<option value="${ono}">${menus}</option>`).prop("disabled", false);
    });

    // 리뷰 삭제 버튼 클릭
    $(document).on("click", ".deleteReview", function() {
        if (!confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;
        
        const rNo = $(this).data("no");
        const sId = $(this).data("sid");

        $.ajax({
            url: "reviewDelete.ajax",
            data: { rNo: rNo, sId: sId },
            type: "delete",
            dataType: "json",
            success: function(resData) {
                recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
                resetReviewForm();
            },
            error: function(xhr) {
                alert("댓글 삭제 오류: " + xhr.responseText);
            }
        });
    });

    // 리뷰 사진 미리보기
    $(document).on("change", "#rPicture", function() {
        const file = this.files[0];
        const $imgPreview = $('#imgPreview');
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $imgPreview.attr('src', e.target.result).show();
            };
            reader.readAsDataURL(file);
        } else {
            $imgPreview.hide().attr('src', '');
        }
    });

    // 사장님 댓글쓰기 버튼 클릭
    $(document).on('click', '.review-reply-btn', function(){
        const $reviewRow = $(this).closest('.reviewRow');
        // 모든 다른 폼은 숨김
        $('.reviewReplyForm').addClass('d-none');
        // 현재 폼만 보여줌
        $reviewRow.find('.reviewReplyForm').removeClass('d-none');
    });

    // 사장님 댓글 폼 제출 (등록/수정)
    $(document).on('submit', '.review-reply-form form', function(e){
        e.preventDefault();
        const $form = $(this);
        const content = $form.find('textarea[name="content"]').val();
        if(!content || content.trim().length == 0){
            alert('댓글을 입력하세요.');
            return;
        }

        const isUpdate = $form.find('input[name="rrNo"]').length > 0 && $form.find('input[name="rrNo"]').val() !== '';
        const url = isUpdate ? '/reviewReplyUpdate.ajax' : '/reviewReplyWrite.ajax';
        const type = isUpdate ? 'patch' : 'post';
        
        const data = {
            rNo: Number($form.find('input[name="rNo"]').val()),
            sId: Number($form.find('input[name="sId"]').val()),
            id: $form.find('input[name="id"]').val(),
            content: content,
            rrNo: isUpdate ? Number($form.find('input[name="rrNo"]').val()) : undefined
        };

        $.ajax({
            url: url,
            type: type,
            data: data,
            dataType: 'json',
            success: function(resData){
                recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
            },
            error: function() {
                alert(`사장님 댓글 ${isUpdate ? '수정' : '등록'} 오류`);
            }
        });
    });

    // 사장님 댓글 수정 클릭
    $(document).on("click", ".modifyReviewReply", function(){
        const $reviewRow = $(this).closest('.reviewRow');
        const $replyFormContainer = $reviewRow.find('.reviewReplyForm');
        const $form = $replyFormContainer.find('form');

        // 데이터 채우기
        $form.find('textarea[name="content"]').val($(this).data('content'));
        $form.find('.review-reply-submit-btn').text('수정');
        // rrNo를 폼에 추가하여 수정 모드임을 알림
        if($form.find('input[name="rrNo"]').length === 0) {
            $form.append(`<input type="hidden" name="rrNo" value="${$(this).data('rrno')}">`);
        } else {
            $form.find('input[name="rrNo"]').val($(this).data('rrno'));
        }
        
        $('.reviewReplyForm').addClass('d-none');
        $replyFormContainer.removeClass('d-none');
        $form.find('textarea[name="content"]').focus();
    });

    // 사장님 댓글 삭제
    $(document).on("click", ".deleteReviewReply", function(){
        if (!confirm("사장님 댓글을 정말 삭제하시겠습니까?")) return;

        const rrNo = $(this).data("rrno");
        const sId = $(this).data("sid");
        
        $.ajax({
            url: "/reviewReplyDelete.ajax",
            type: "delete",
            data: { rrNo: rrNo, sId: sId },
            dataType: "json",
            success: function(resData){
                recallReviewList(resData.reviewList, resData.reviewReplyMap, resData.shopOwnerId);
            },
            error: function() {
                alert("사장님 댓글 삭제 중 오류가 발생했습니다.");
            }
        });
    });
});
