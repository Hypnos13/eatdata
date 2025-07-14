$(function(){
	// FAQ에 유형 버튼 누를 때
	$(".faq-type").on("click",function(){
		let from = $("#from").val();
		window.location.replace("/faqList?type=" + $(this).text()+"&from="+from);
	});
	
	
	// FAQ 작성 시 유효성 검사
	$("#writeFAQform").on("submit",function(){

		if($("#title").val().length <= 0){
			alert("질문을 작성해주세요.");
			return false;
		}
		
		if($("#content").val().length <= 0){
			alert("답변을 작성해주세요.");
			return false;
		}
	});
	
	
	// 관리자가 FAQ 수정 버튼을 누를 때
	$(".uBtn").on("click", function(e){
		let csNo = $(this).attr("data-btn-no");
		window.location.href="/updateFAQForm?csNo="+csNo;
	});
	
	
	// 관리자가 FAQ 삭제 버튼을 누를 때
	$(".dBtn").on("click", function(e){
		let csNo = $(this).attr("data-btn-no");
		
		if (!confirm("정말로 글을 삭제 하시겠습니까?")) {
			return false;
		} else {
			window.location.href="/deleteFAQ?csNo="+csNo;
		}				
	});
	
	// 공지사항 글 게시하기
	$("#writeNoticeform").on("submit",function(){
		
		if($("#start").val().length <= 0){
			alert("게시 시작 일을 정해주세요.");
			return false;
		}
		
		if($("#end").val().length <= 0){
			alert("게시 종료 일을 정해주세요.");
			return false;
		}
		
		if($("#title").val().length <= 0){
			alert("공지 제목을 정해주세요.");
			return false;
		}
		
		if($("#content").val().length <= 0){
			alert("공지 제목을 정해주세요.");
			return false;
		}
	
	});
	
	// 공지사항을 클릭
	$(".noticeContain").on("click",function(){
		let no =  $(this).attr("data-no")
		let from = $("#from").val();
		window.location.href="noticeDetail?no="+no+"&from="+from;
	});
	
	//공지사항 수정하기 버튼 누를 때
	$("#uNotice").on("click", function(){
		let no =  $("#no").val();
		window.location.href="updateNoticeForm?no="+no;
	});
	
	//공지사항 삭제하기 버튼 누를 때
	$("#dNotice").on("click", function(){
		let no =  $("#no").val();
			
		if (!confirm("정말로 공지사항을 삭제 하시겠습니까?")) {
			return false;
		} else {
			window.location.href="/deleteNotice?no="+no;
		}				
	});
	
});


	