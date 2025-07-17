$(function() {
	
	$("#shopJoinForm").on("submit", shopJoinFormCheck);
	$("#menuJoinForm").on("submit", menuJoinFormCheck);

	//우편번호찾기
	$("#btnZipcode").click(findZipcode);
	
	//로그인 필요한 메뉴 클릭 이벤트
	$(".login-required").on("click", requireLogin);
	
	// 폰 자동 하이픈 입력
    const phoneNumberInput = document.getElementById('phone');
    if (phoneNumberInput) {
        phoneNumberInput.addEventListener('input', function(event) {
            let value = event.target.value.replace(/[^0-9]/g, '');
            if (value.length > 11) value = value.substring(0, 11);
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
	
	// 페이지 로드시 기존 주소로 지도 띄우기 (kakao 준비 되었을 때만)
    setTimeout(function() {
        var addr = $("#address1").val();
        if (addr && window.kakao && kakao.maps) showMap(addr);
    }, 300);
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
				
				// 주소 선택 시 지도에 표시 (아래 함수 호출)
	            showMap(addr);
    	}
	}).open();
}

// 지도 표시 함수
function showMap(address) {
	// kakao 객체 체크
    if (!(window.kakao && kakao.maps && kakao.maps.services)) return;

    var mapContainer = document.getElementById('shop-map');
    // 맵 영역이 숨겨져있으면 보여줌
    if (mapContainer && mapContainer.style.display === "none") {
        mapContainer.style.display = "block";
    }
	var mapOption = {
        center: new kakao.maps.LatLng(37.566826, 126.9786567), // 초기 중심 좌표 (서울시청)
        level: 3
    };
    var map = new kakao.maps.Map(mapContainer, mapOption);

    // 주소로 좌표 검색
    var geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, function(result, status) {
        if (status === kakao.maps.services.Status.OK) {
            var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            // 결과값으로 받은 위치에 마커 표시
            var marker = new kakao.maps.Marker({
                map: map,
                position: coords
            });
            // 지도의 중심을 결과값으로 받은 위치로 이동
            map.setCenter(coords);
        }
    });
}


// 로그인 여부 읽기 (body가 있는지, 속성이 있는지 확인)
function requireLogin(event) {
    var isLogin = false;
    if (document.body && document.body.dataset && document.body.dataset.login) {
        isLogin = document.body.dataset.login === "true";
    }
    if (!isLogin) {
        event.preventDefault();
        window.location.href = '/login';
        return false;
    }
    return true;
}


// 에러 메시지 함수 (필드 아래에 동적으로 생성)
function setError(fieldName, msg) {
    let input = document.querySelector(`[name="${fieldName}"]`);
    if (!input) return;
    let errorSpan = input.parentNode.querySelector('.js-err-msg');
    if (!errorSpan) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'js-err-msg text-danger small';
        input.parentNode.appendChild(errorSpan);
    }
    errorSpan.innerText = msg;
}

if (window.kakao && kakao.maps && kakao.maps.load) {
  kakao.maps.load(function() {
    // 페이지 열릴 때, 기존에 주소가 있으면 지도 표시
    const addr = document.getElementById('address1').value;
    if (addr) {
      const mapContainer = document.getElementById('shop-map');
      mapContainer.style.display = 'block';
      showMap(addr);
    }
  });
}
