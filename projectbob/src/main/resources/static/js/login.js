$(function(){
	// 회원가입시 유효성 검사
	$("#joinMemberForm").on("submit",function(){
		
		let check = 0;
			
		check += CheckId();	
		
		check += CheckPass();		

    	check += CheckName();		

		check += CheckBirthday();	
			
		check += CheckAddress();
		
		check += CheckEmail();
		
		check += CheckPhone();
		
		if(check != 7){
			return false;
		}
	});
	
	$("#id").on("focusout",CheckId);
	$("#pass").on("focusout",CheckPass);
	$("#name").on("focusout",CheckName);
	$("#birthday").on("focusout",CheckBirthday);
	$("#address1").on("focusout",CheckAddress);
	$("#email").on("focusout",CheckEmail);
	$("#phone").on("focusout",CheckPhone);
	
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
	
	$("#address1Info").text("");
	$("#address1").css("border-color", "#DEE2E6");
	$("#address1").css("color", "black");
}

function CheckId(){
	var idregExp = /^[A-Za-z0-9]*$/;
	
	if($("#id").val().length <= 0){
		$("#idInfo").text("아이디를 입력해주세요.");
		$("#id").css("border-color", "#F76159");
		$("#id").css("color", "#F76159");
		return 0;
	}else if($("#id").val().length < 5 || $("#id").val().length > 20){
		$("#idInfo").text("아이디를 5~20자 내로 입력주세요.");
		$("#id").css("border-color", "#F76159");
		$("#id").css("color", "#F76159");
		return 0;
	}else if(!idregExp.test($("#id").val())){
		$("#idInfo").text("영문, 숫자만 사용 가능합니다.");
		$("#id").css("border-color", "#F76159");
		$("#id").css("color", "#F76159");
		return 0;
	}else{
		$("#idInfo").text("");
		$("#id").css("border-color", "#DEE2E6");
		$("#id").css("color", "black");
		return 1;
	}
}

function CheckPass(){
	if($("#pass").val().length <= 0){
		$("#passInfo").text("비밀번호를 입력해주세요.");	
		$("#pass").css("border-color", "#F76159");
		$("#pass").css("color", "#F76159");
		return 0;	
	}else{
		$("#passInfo").text("");
		$("#pass").css("border-color", "#DEE2E6");
		$("#pass").css("color", "black");
		return 1;
	}
}

function CheckName(){
	var regExp = /^[가-힣]*$/;
	
	if($("#name").val().length <= 0){
		$("#nameInfo").text("이름을 입력해주세요.");	
		$("#name").css("border-color", "#F76159");
		$("#name").css("color", "#F76159");	
		return 0;
	}else if(!regExp.test($("#name").val())){
		$("#nameInfo").text("이름을 한글로 작성해주세요.");
		$("#name").css("border-color", "#F76159");
		$("#name").css("color", "#F76159");
		return 0;
	}else{
		$("#nameInfo").text("");
		$("#name").css("border-color", "#DEE2E6");
		$("#name").css("color", "black");
		return 1;
	}
}

function CheckBirthday(){
	var regExp = /^[0-9]*$/;
	if($("#birthday").val().length <= 0){
		$("#birthdayInfo").text("생년월일을 입력해주세요.");	
		$("#birthday").css("border-color", "#F76159");
		$("#birthday").css("color", "#F76159");		
		return 0;	
	}else if($("#birthday").val().length != 8){
		$("#birthdayInfo").text("생년월일을 잘못 입력하셨습니다. (ex.YYYYMMDD)");	
		$("#birthday").css("border-color", "#F76159");
		$("#birthday").css("color", "#F76159");	
		return 0;
	}else if(!regExp.test($("#birthday").val())){
		$("#birthdayInfo").text("생년월일을 숫자로 입력해주세요.");	
		$("#birthday").css("border-color", "#F76159");
		$("#birthday").css("color", "#F76159");	
		return 0;
	}else{
		$("#birthdayInfo").text("");
		$("#birthday").css("border-color", "#DEE2E6");
		$("#birthday").css("color", "black");
		return 1;
	}
}

function CheckAddress(){
	if($("#address1").val().length <= 0){
		$("#address1Info").text("주소 찾기로 주소를 입력해주세요.");	
		$("#address1").css("border-color", "#F76159");
		$("#address1").css("color", "#F76159");				
		return 0;
	}else{
		$("#address1Info").text("");
		$("#address1").css("border-color", "#DEE2E6");
		$("#address1").css("color", "black");
		return 1;
	}
}

function CheckEmail(){
	if($("#email").val().length <= 0){
		$("#emailInfo").text("이메일을 입력해주세요.");	
		$("#email").css("border-color", "#F76159");
		$("#email").css("color", "#F76159");				
		return 0;
	}else{
		$("#emailInfo").text("");
		$("#email").css("border-color", "#DEE2E6");
		$("#email").css("color", "black");
		return 1;
	}
}

function CheckPhone(){
	var regExp = /^(01[016789]{1})-?[0-9]{3,4}-?[0-9]{4}$/;
	
	if($("#phone").val().length <= 0){
		$("#phoneInfo").text("연락처를 입력해주세요.");	
		$("#phone").css("border-color", "#F76159");
		$("#phone").css("color", "#F76159");				
		return 0;
	}else if(!regExp.test($("#phone").val())){
		$("#phoneInfo").text("연락처가 올바르지 않습니다. (ex.010-0000-0000)");	
		$("#phone").css("border-color", "#F76159");
		$("#phone").css("color", "#F76159");				
		return 0;
	}else{
		$("#phoneInfo").text("");
		$("#phone").css("border-color", "#DEE2E6");
		$("#phone").css("color", "black");
		return 1;
	}
}