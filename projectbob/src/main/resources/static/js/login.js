$(function(){
	// 회원가입시 유효성 검사
	$("#joinMemberForm").on("submit",function(){
		
		if($("#id").val().length <= 0){
			alert("아이디를 입력해주세요.");		
			return false;
		}else if($("#id").val().length < 5 || $("#id").val().length > 20){
			alert("아이디를 5~20자 내로 입력주세요.");		
			return false;
		}
		
		if($("#pass").val().length <= 0){
			alert("비밀번호를 입력해주세요.");		
			return false;
		}
		
		if($("#name").val().length <= 0){
			alert("이름을 입력해주세요.");		
			return false;
		}
		
		if($("#birthday").val().length <= 0){
			alert("생년월일을 입력해주세요.");		
			return false;
		}else if($("#birthday").val().length != 8){
			alert("생년월일을 잘못 입력하셨습니다. 다시 입력해주세요.");	
			return false;
		}
		
		if($("#address1").val().length <= 0){
			alert("주소 찾기로 주소를 입력해주세요.");		
			return false;
		}
		
		if($("#email").val().length <= 0){
			alert("이메일을 입력해주세요.");		
			return false;
		}

		if($("#phone").val().length <= 0){
			alert("연락처를 입력해주세요.");		
			return false;
		}
		
	});
	
	$("#id").on("focusout",function(){
		if($("#id").val().length <= 0){
			$("#idInfo").val("아이디를 입력해주세요.");
			$("#id").css("border-color", "#F76159");
			$("#id").css("color", "#F76159");
		}else if($("#id").val().length < 5 || $("#id").val().length > 20){
			$("#idInfo").val("아이디를 5~20자 내로 입력주세요.");
			$("#id").css("border-color", "#F76159");
			$("#id").css("color", "#F76159");
		}
	});
	
	
	$("#btnAdress").on("click", findAddress);
	
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
			
			// 커서를 상세주소 입력상자로 이동한다.
			$("#address2").focus();
       	}
	}).open();
}



