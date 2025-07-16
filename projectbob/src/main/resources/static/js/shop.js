$(function() {
	
	$("#shopJoinForm").on("submit", shopJoinFormCheck);
	$("#menuJoinForm").on("submit", menuJoinFormCheck);

	//우편번호찾기
	$("#btnZipcode").click(findZipcode);
	
	//로그인 필요한 메뉴 클릭 이벤트
	$(".login-required").on("click", requireLogin);
});

function menuJoinFormCheck() {
	if($("#category").val().length ==0 ) {
		alert("카테고리를 입력해주세요.")
		return false;
	}
	if($("#name").val().length ==0 ) {
		alert("메뉴 이름을 입력해주세요.")
		return false;
	}
	if($("#price").val().length ==0 ) {
		alert("가격을 입력해주세요.")
		return false;
	}
	if($("#mInfo").val().length ==0 ) {
		alert("메뉴 설명을 입력해주세요.")
		return false;
	}
}


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
	const rawPhoneNumber = $("#phone").val();
	if (rawPhoneNumber.length !== 13) {
		alert("연락처는 '-'을 포함하여 13자리를 입력해주세요.");
		$("#phone").focus();
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

//로그인 여부 읽기
var isLogin = document.body.dataset.login === "true";

//로그인상태 확인
function requireLogin(event) {
    if (!isLogin) {
        event.preventDefault();
        window.location.href = '/login';
        return false;
    }
    return true;
}


// name 기준으로 에러메시지 출력하는 함수 (필드 아래에 동적으로 만듦)
function setError(fieldName, msg) {
    let input = document.querySelector(`[name="${fieldName}"]`);
    let errorSpan = input.parentNode.querySelector('.js-err-msg');
    if (!errorSpan) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'js-err-msg text-danger small';
        input.parentNode.appendChild(errorSpan);
    }
    errorSpan.innerText = msg;
}


document.addEventListener('DOMContentLoaded', function() {
    const phoneNumberInput = document.getElementById('phone');

    if (phoneNumberInput) { // 요소가 존재하는지 확인
        phoneNumberInput.addEventListener('input', function(event) {
            let value = event.target.value.replace(/[^0-9]/g, ''); // 숫자 이외의 문자 제거

            if (value.length > 11) {
                value = value.substring(0, 11); // 11자리 초과 시 잘라냄
            }

            let formattedValue = '';
            if (value.length < 4) {
                formattedValue = value;
            } else if (value.length < 8) {
                formattedValue = value.substring(0, 3) + '-' + value.substring(3);
            } else {
                formattedValue = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7);
            }

            event.target.value = formattedValue;
        });
    }
});

