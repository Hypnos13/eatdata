$(function() {
	
	$("#shopJoinForm").on("submit", shopJoinFormCheck);

	//우편번호찾기
	$("#btnZipcode").click(findZipcode);
	
});

function shopJoinFormCheck(isShopJoinForm) {
	if($("#sNumber").val().length != 10 ) {
		alert("사업자 등록번호는 10자리입니다.")
		$("#sNumber").focus();
		return false;
	}
	/*if(isShopJoinForm && $("#isSNumCheck").val() == 'false') {
		alert("사업자번호 체크를 해주세요");
		return false;
	}*/
	if($("#owner").val().length ==0 ) {
		alert("대표자 명을 입력해주세요.")
		return false;
	}
	if($("#phone").val().length ==0 ) {
		alert("대표자 연락처를 입력해주세요.")
		return false;
	}
	if($("#name").val().length ==0 ) {
		alert("가게 이름을 입력해주세요.")
		return false;
	}
	if($("#zipcode").val().length ==0 ) {
		alert("우편번호를 입력해주세요.")
		return false;
	}
	if($("#address2").val().length ==0 ) {
		alert("상세주소를 입력해주세요.")
		return false;
	}
}


// 카카오 우편번호 API
function findZipcode() {
	new daum.Postcode({
		oncomplete: function(data) {
			var addr = data.roadAddress; // 도로명 주소 변수
			var extraAddr = '';
			if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
					extraAddr += data.bname;
				}
        // 건물명이 있고, 공동주택일 경우 추가한다.
        if(data.buildingName !== '' && data.apartment === 'Y'){
           extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
        }
        // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
        if(extraAddr !== ''){
            extraAddr = ' (' + extraAddr + ')';
        }
				addr+=extraAddr;
				$("#zipcode").val(data.zonecode);
				$("#address1").val(addr);
				$("#address2").focus();
    	}
	}).open();
}

