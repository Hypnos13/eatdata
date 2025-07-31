$(function(){
	// 주소 찾기
	$("#btnAdress").on("click", findAddress);
	
	// FAQ에 유형 버튼 누를 때
	$(".faq-type").on("click",function(){
		let from = $("#from").val();
		window.location.replace("/faqList?type=" + $(this).text()+"&from="+from);
	});
	
	
	//FAQ 질문 누를 때
	$(".faq-question").on("click",function(){
		$(this).next('.faq-answer').slideToggle(200);
		$('.faq-answer').not($(this).next()).slideUp(200);
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
	
	
	//가게 관리 저장 버튼 누를 때
	$(".btn-save").on("click",function(){
		let sId = $(this).parent().parent().find('#sId').val();
		let category = $(this).parent().parent().find('#category').val();
		let status = $(this).parent().parent().find('#status').val();
				
		window.location.href="updateShopManage?sId="+sId+"&category="+category+"&status="+status;
	});
	
	// 관리자 페이지 - 사용자관리 - 검색어 검색
	$("#btn_search").on("click",function(){
		let searchShop = $("#searchShop").val();
		let keyword = $("#keyword").val();
		
		window.location.href="shopManage?searchShop="+searchShop+"&keyword="+keyword;		
	});
		
	// 관리자 페이지 - 사용자관리 - 검색어 검색시
	$("#keyword").on("keydown",function(e){
		if(e.key == 'Enter'){
			let searchShop = $("#searchShop").val();
			let keyword = $("#keyword").val();
					
			window.location.href="shopManage?searchShop="+searchShop+"&keyword="+keyword;	
		}
	});
	
	// 주소록 추가
	$("#addAddressForm").on("submit", function(){
		if($("#aName").val().length <= 0){
			$("#aNameInfo").text("장소명을 입력해주세요.");	
			$("#aName").css("border-color", "#F76159");
			$("#aName").css("color", "#F76159");	
			$("#aName").focus();			
			return false;
		}else{
			$("#aNameInfo").text("");
			$("#aName").css("border-color", "#DEE2E6");
			$("#aName").css("color", "black");
		}
		
		if($("#address1").val().length <= 0){
			$("#addressInfo").text("주소입력을 입력해주세요.");	
			$("#address1").css("border-color", "#F76159");
			$("#address1").css("color", "#F76159");			
			return false;
		}else{
			$("#addressInfo").text("");
			$("#address1").css("border-color", "#DEE2E6");
			$("#address1").css("color", "black");
		}
	});
	
	// 주소록 수정
	$("#updateAddressForm").on("submit", function(){
		if($("#aName").val().length <= 0){
			$("#aNameInfo").text("장소명을 입력해주세요.");	
			$("#aName").css("border-color", "#F76159");
			$("#aName").css("color", "#F76159");	
			$("#aName").focus();			
			return false;
		}else{
			$("#aNameInfo").text("");
			$("#aName").css("border-color", "#DEE2E6");
			$("#aName").css("color", "black");
		}
			
		if($("#address1").val().length <= 0){
			$("#addressInfo").text("주소입력을 입력해주세요.");	
			$("#address1").css("border-color", "#F76159");
			$("#address1").css("color", "#F76159");			
			return false;
		}else{
			$("#addressInfo").text("");
			$("#address1").css("border-color", "#DEE2E6");
			$("#address1").css("color", "black");
		}
	});
	
	// 찜목록에서 찜 취소
	$(".toggle-heart").on("click",function(){
		let sId = $(this).attr("data-no");
		
		if(confirm("찜목록을 삭제하겠습니까?")){
			location.href = "cancleLike?sId="+sId;
		}else{
			return false;	
		}
	});
	
	// 쿠폰 관리 - 수정 버튼
	$(".btn-coupon-update").on("click",function(){
		let cNo = $(this).attr("data-no");
			
		location.href = "updateCouponForm?cNo="+cNo;
	});
	
	// 쿠폰 관리 - 삭제 버튼
	$(".btn-coupon-delete").on("click",function(){
		let cNo = $(this).attr("data-no");
			
		if(confirm("쿠폰을 삭제하겠습니까?")){
			location.href = "deleteCoupon?cNo="+cNo;
		}else{
			return false;	
		}
	});
	
	// 관리자 페이지 - 쿠폰관리 - 쿠폰 검색
	$("#btn_search_coupon").on("click",function(){
		let searchCoupon = $("#searchCoupon").val();
		let keyword = $("#keyword").val();
		
		window.location.href="couponManage?searchCoupon="+searchCoupon+"&keyword="+keyword;		
	});
	
	// 관리자 페이지 - 쿠폰관리 - 검색어 검색시
	$("#couponKeyword").on("keydown",function(e){
		if(e.key == 'Enter'){
			let searchCoupon = $("#searchCoupon").val();
			let keyword = $("#couponKeyword").val();
					
			window.location.href="couponManage?searchCoupon="+searchCoupon+"&keyword="+keyword;	
		}
	});
});

// 주소 찾기 API 연동
function findAddress() {
	new daum.Postcode({
        oncomplete: function(data) {

            var addr = ''; // 주소 변수
            var extraAddr = ''; // 참고 항목 변수
         
            addr = data.roadAddress;			

            if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
                extraAddr += data.bname;
            }
			
            if(data.buildingName !== '' && data.apartment === 'Y'){
                extraAddr += (extraAddr !== '' ? 
										', ' + data.buildingName : data.buildingName);
            }
            
            if(extraAddr !== ''){
                extraAddr = ' (' + extraAddr + ')';
            }
			
            addr += extraAddr;
            
			$("#address1").val(addr);
			$("#address2").focus();
       	}
	}).open();
	
	$("#address1").css("border-color", "#DEE2E6");
	$("#address1").css("color", "black");
}