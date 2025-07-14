$(function(){
	// FAQ에 유형 버튼 누를 때
	$(".faq-type").on("click",function(){
		window.location.replace("/faqList?type=" + $(this).text());
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
	
});


	