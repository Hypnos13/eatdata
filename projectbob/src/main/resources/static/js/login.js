$(function(){
	// 회원가입시 유효성 검사
	$("#joinMemberForm").on("submit",async function(e){
		
		let phoneIsReadOnly = $("#phone").prop("readonly");
		
		e.preventDefault();
		
		let check = 0;
		
		check += await CheckId();	
		
		check += CheckPass();		

    	check += CheckName();		

		check += CheckBirthday();	
			
		check += CheckAddress();
		
		check += CheckEmail();
		
		check += CheckPhone();
		
		if(phoneIsReadOnly){
			check += 1;
		}else{
			alert("핸드폰 인증을 완료해주세요.");
		}
		
		if(check != 8){
			return false;
		}
		
		this.submit();
	});
	
	// 상시 적용
	$("#userid").on("focusout",CheckId);
	$("#password").on("focusout",CheckPass);
	$("#name").on("focusout",CheckName);
	$("#birthday").on("focusout",CheckBirthday);
	$("#address1").on("focusout",CheckAddress);
	$("#email").on("focusout",CheckEmail);
	$("#phone").on("focusout",CheckPhone);
	$("#btnAdress").on("click", findAddress);
	
	
	// 내정보 수정하기 유효성 검사
	$("#updateMemberForm").on("submit",function(){
			
			let check = 0;	
			let oldPhone = $("#oldPhone").val();
			let phone = $("#phone").val();
			let phoneIsReadOnly = $("#phone").prop("readonly");
			
			check += CheckPass();			
			check += CheckAddress();
			check += CheckEmail();
			check += CheckPhone();
			
			if(oldPhone == phone){
				check += 1;
			}else{
				if(phoneIsReadOnly){
					check += 1;
				}else{
					alert("핸드폰 인증을 완료해주세요.");
				}
			}
			
			
			if(check != 5){	return false; }
		});
	
	
	
	// 로그인 시
	$("#loginForm").on("submit",function(){
		if($("#id").val().length <= 0){
			alert("아이디를 입력해주세요.");
			return false;
		}
		
		if($("#pass").val().length <= 0){
			alert("비밀번호를 입력해주세요.");
			return false;
		}
	});
	
	
	// 회원 탈퇴 시
	$("#deleteMemberForm").on("submit",function(){
			let check = 0;
			
			check += CheckPass();
			
			if(check != 1){
				return false;
			}
			
			if (!confirm("정말로 탈퇴 하시겠습니까? (복원이 불가능합니다.)")) {
			      return false;
			} else {
			    $("#userPass").val($("#password").val());
			}
				
	});
	

	
	// 아이디 비밀번호 찾기 : 라디오 버튼
	$(".inputForm").hide();
	$(".emailRow").hide();
	$(".phoneRow").hide();
	
	$("input[name='receive']").on("change",function(){
		$(".inputForm").show();
		
		if($("#rEmail:checked").val()){
			$(".emailRow").show();
			$(".phoneRow").hide();
		}else if($("#rPhone:checked").val()){
			$(".emailRow").hide();
			$(".phoneRow").show();
		}
	
	});
	
	
	$("#searchIdPassForm").on("submit",function(){
		let check = 0;	
		let phoneIsReadOnly = $("#phone").prop("readonly");
		
		if($("#search").val() == "false"){
			check += 1;
		}else{
			check += SearchCheckId();	
		}			
		
		check += CheckName();	
		
		if($("#rEmail:checked").val()){			
			check += CheckEmail();
		}else if($("#rPhone:checked").val()){
			check += CheckPhone();
		}
		
		if(phoneIsReadOnly){
			check += 1;
		}else{
			alert("핸드폰 인증을 완료해주세요.");
		}
		
		if(check != 4){
			return false;
		}
		
	});
	
	
	// 관리자 페이지 - 사용자관리 - 사용여부 저장
	$(".btn-save").on("click",function(){
		let id = $(this).parent().parent().find('#id').text();
		let isuse = $(this).parent().parent().find('#isuse').val();
		
		window.location.href="updateIsuse?id="+id+"&isuse="+isuse;
	});
	
	
	// 관리자 페이지 - 사용자관리 - 검색어 검색
	$("#btn_search").on("click",function(){
		let searchDivision = $("#searchDivision").val();
		let keyword = $("#keyword").val();
		
		window.location.href="userList?division="+searchDivision+"&keyword="+keyword;		
	});
	
	// 관리자 페이지 - 사용자관리 - 검색어 검색시
	$("#keyword").on("keydown",function(e){
		if(e.key == 'Enter'){
			let searchDivision = $("#searchDivision").val();
			let keyword = $("#keyword").val();
					
			window.location.href="userList?division="+searchDivision+"&keyword="+keyword;	
		}
	});
	
	
	// 네이버로 가입시 로그인 검사
	$("#naverJoinForm").on("submit", function(){
			
		let check = 0;		
		let phoneIsReadOnly = $("#phone").prop("readonly");

		check += CheckBirthday();	
				
		check += CheckAddress();
			
		check += CheckPhone();
		
		if(phoneIsReadOnly){
			check += 1;
		}else{
			alert("핸드폰 인증을 완료해주세요.");
		}
			
		if(check != 4){
			return false;
		}
	});
	
	// 네이버로 로그인 후 내정보 수정하기 유효성 검사
	$("#updateNaverMemberForm").on("submit",function(){
				
		let check = 0;	
		let oldPhone = $("#oldPhone").val();
		let phone = $("#phone").val();
		let phoneIsReadOnly = $("#phone").prop("readonly");
					
		check += CheckAddress();
		check += CheckPhone();
		
		if(oldPhone == phone){
			check += 1;
		}else{
			if(phoneIsReadOnly){
				check += 1;
			}else{
				alert("핸드폰 인증을 완료해주세요.");
			}
		}
				
		if(check != 3){	return false; }
	});
	
	// 네이버 아이디 회원 탈퇴 시
	$("#deleteNaverMemberForm").on("submit",function(){
		if (!confirm("정말로 탈퇴 하시겠습니까? (복원이 불가능합니다.)")) {
		      return false;
		} else {
		    $("#userPass").val($("#password").val());
		}			
	});
	
	// 휴대폰 인증
	$("#btn-phoneCertify").on("click",function(){
		var regExp = /^(01[016789]{1})-?[0-9]{3,4}-?[0-9]{4}$/;
		var phone = $("#phone").val();
		
		
		if($("#phone").val().length <= 0){
			$("#phoneInfo").text("연락처를 입력해주세요.");	
			$("#phone").css("border-color", "#F76159");
			$("#phone").css("color", "#F76159");	
			$("#phone").focus();			
			return false;
		}else if(!regExp.test($("#phone").val())){
			$("#phoneInfo").text("연락처가 올바르지 않습니다. (ex.010-0000-0000)");	
			$("#phone").css("border-color", "#F76159");
			$("#phone").css("color", "#F76159");		
			$("#phone").focus();		
			return false;
		}else{
			$("#phoneInfo").text("");
			$("#phone").css("border-color", "#DEE2E6");
			$("#phone").css("color", "black");
		}
		
		window.open("/phoneCertify?phone="+phone, "phoneCheckPopup",`width=500,height=300,scrollbar=no`);
	});
	
	// 휴대폰 인증 - 인증하기
	$("#phoneCertifyForm").on("submit",function(){
		let certifyNumber = $("#certifyNumber").val();
		let phone = $("#phone").val();
		
		
		
		if(certifyNumber.length < 6){
			alert("인증번호 6자리를 입력해주세요.");
			return false;
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
	
	$("#address1Info").text("");
	$("#address1").css("border-color", "#DEE2E6");
	$("#address1").css("color", "black");
}


// 아이디 체크
async function CheckId(){
	var idregExp = /^[A-Za-z0-9]*$/;
	
	if($("#userid").val().length <= 0){
		$("#idInfo").text("아이디를 입력해주세요.");
		$("#userid").css("border-color", "#F76159");
		$("#userid").css("color", "#F76159");
		return 0;
	}else if($("#userid").val().length < 5 || $("#userid").val().length > 20){
		$("#idInfo").text("아이디를 5~20자 내로 입력주세요.");
		$("#userid").css("border-color", "#F76159");
		$("#userid").css("color", "#F76159");
		return 0;
	}else if(!idregExp.test($("#userid").val())){
		$("#idInfo").text("영문, 숫자만 사용 가능합니다.");
		$("#userid").css("border-color", "#F76159");
		$("#userid").css("color", "#F76159");
		return 0;
	}else{
		$("#idInfo").text("");
		$("#userid").css("border-color", "#DEE2E6");
		$("#userid").css("color", "black");
	}
	
	
	const checkOverlap = await new Promise((resolve) =>{
		$.ajax({
				url : "overlapId.ajax",
				type : "GET",
				data : { userId : $("#userid").val() },
				dataType: "json",
				success: function(resData){
					if(!resData.result){
						$("#idInfo").text("이미 존재하는 아이디 입니다.");
						$("#userid").css("border-color", "#F76159");
						$("#userid").css("color", "#F76159");	
						resolve(0);	
					}else{
						$("#idInfo").text("");
						$("#userid").css("border-color", "#DEE2E6");
						$("#userid").css("color", "black");
						resolve(1);	
					}
				},
				error : function(xhr, status, error){
					alert("error : " + xhr.statusText + ", " + status + ", " + error);
					resolve(0);	
				}
			});
	});
	
	
	return checkOverlap;
}

// 아이디 체크2
function SearchCheckId(){
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


// 비밀번호 체크
function CheckPass(){
	if($("#password").val().length <= 0){
		$("#passInfo").text("비밀번호를 입력해주세요.");	
		$("#password").css("border-color", "#F76159");
		$("#password").css("color", "#F76159");
		return 0;	
	}else{
		$("#passInfo").text("");
		$("#password").css("border-color", "#DEE2E6");
		$("#password").css("color", "black");
		return 1;
	}
}


// 이름 체크
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

// 생일 체크
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

// 주소 체크
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

// 이메일 체크
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

// 휴대폰 체크
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

// 타이머 시작
function startTimer(duration) {
        let time = duration;
        interval = setInterval(function () {
            const min = String(Math.floor(time / 60)).padStart(2, '0');
            const sec = String(time % 60).padStart(2, '0');
            $(".timer").text(`${min}:${sec}`);

            if (time <= 0) {
                clearInterval(interval);
                $(".timer").text("만료됨");
                $("#btn-phoneCheck").val("재인증 요청").removeClass("btn-success").addClass("btn-warning");
                sessionStorage.removeItem("phoneAuthEnd");
            }

            time--;
        }, 1000);
}

// 타이머 체크
function checkAndStartTimer() {
        const endTime = sessionStorage.getItem("phoneAuthEnd");
        if (endTime) {
            const remainSec = Math.floor((new Date(endTime) - new Date()) / 1000);
            if (remainSec > 0) {
                startTimer(remainSec);
            }else{
                $(".timer").text("만료됨");
                $("#btn-phoneCheck").val("재인증 요청").removeClass("btn-success").addClass("btn-warning");
                sessionStorage.removeItem("phoneAuthEnd");
            }
        }
}