$(function(){
	// FAQ에 유형 버튼 누를 때
	$(".faq-type").on("click",function(){
		$(".faq-type-selected").addClass("faq-type");
		$(".faq-type-selected").removeClass("faq-type-selected");
		$(this).addClass("faq-type-selected");
		$(this).removeClass("faq-type");
		window.location.href="/faqList?type=" + $(this).text();
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
});
