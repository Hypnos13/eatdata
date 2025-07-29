$(function() {
	
	$("#shopJoinForm").on("submit", shopJoinFormCheck);
	$("#menuJoinForm").on("submit", menuJoinFormCheck);

	//우편번호찾기
	$("#btnZipcode").click(findZipcode);
	
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
				showMap(addr); // 지도 AIP 때문에 한줄 추가함
    	}
	}).open();
}

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== 1. 입력 시 하이픈(-) 자동 생성 기능 =====
    const sNumberInputForFormatting = document.getElementById('sNumber');
    if (sNumberInputForFormatting) {
        sNumberInputForFormatting.addEventListener('input', function(event) {
            let value = event.target.value.replace(/[^0-9]/g, '');
            if (value.length > 10) {
                value = value.substring(0, 10);
            }

            let formattedValue = '';
            if (value.length < 4) {
                formattedValue = value;
            } else if (value.length < 6) {
                formattedValue = value.substring(0, 3) + '-' + value.substring(3);
            } else {
                formattedValue = value.substring(0, 3) + '-' + value.substring(3, 5) + '-' + value.substring(5);
            }
            event.target.value = formattedValue;
        });
    }

    // ===== 2. 폼 제출 시 하이픈(-) 제거 기능 (새로 추가된 부분) =====
    const shopJoinForm = document.getElementById('shopJoinForm');
    if (shopJoinForm) {
        shopJoinForm.addEventListener('submit', function(event) {
            event.preventDefault(); // 폼 자동 전송 중단

            const sNumberInput = document.getElementById('sNumber');
            // 사업자등록번호 값에서 하이픈 제거
            sNumberInput.value = sNumberInput.value.replace(/-/g, '');

            // 다른 전화번호 필드 등도 숫자만 보내고 싶다면 아래처럼 추가 가능
            // const phoneInput = document.getElementById('phone');
            // phoneInput.value = phoneInput.value.replace(/-/g, '');

            this.submit(); // 정리된 값으로 폼 전송
        });
    }
		
		// 폰번호 포맷팅
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
				
		// 영양성분 검색
		const btnSearch = document.getElementById('btnSearchNutrition');
		const menuNameInput = document.getElementById('name');
		const resultsList = document.getElementById('nutrition-results');
		const selectedInfoDiv = document.getElementById('selected-nutrition-info');

		if (btnSearch) {
		    // '영양성분 검색' 버튼 클릭 이벤트
		    btnSearch.addEventListener('click', async function() {
		        const foodName = menuNameInput.value;
		        if (!foodName) {
		            alert('메뉴 이름을 먼저 입력해주세요.');
		            return;
		        }

		        try {
		            const response = await fetch(`/api/nutrition-search?foodName=${encodeURIComponent(foodName)}`);
		            const resultStr = await response.text();
		            const result = JSON.parse(resultStr);
		            
		            resultsList.innerHTML = ''; // 이전 결과 초기화
		            
		            if (result.body && result.body.items && result.body.items.length > 0) {
		                resultsList.style.display = 'block';
		                result.body.items.forEach(item => {
		                    const li = document.createElement('li');
		                    li.className = 'list-group-item list-group-item-action';
		                    li.style.cursor = 'pointer';
		                    li.textContent = `${item.FOOD_NM_KR} (1회 제공량: ${item.SERVING_SIZE}, 열량: ${item.AMT_NUM1}kcal)`;
		                    
												li.dataset.servingSize = item.SERVING_SIZE.replace(/[^0-9.]/g, '');
		                    li.dataset.calories = item.AMT_NUM1;
		                    li.dataset.carbs = item.AMT_NUM6;
		                    li.dataset.protein = item.AMT_NUM3;
		                    li.dataset.fat = item.AMT_NUM4;
												li.dataset.sfa = item.AMT_NUM24;
												li.dataset.sugar = item.AMT_NUM7;
		                    li.dataset.sodium = item.AMT_NUM13;
		                    
		                    resultsList.appendChild(li);
		                });
		            } else {
		                resultsList.innerHTML = '<li class="list-group-item">검색 결과가 없습니다.</li>';
		                resultsList.style.display = 'block';
		            }
		        } catch (error) {
		            console.error('Error fetching nutrition data:', error);
		            alert('영양 정보를 불러오는 데 실패했습니다.');
		        }
		    });
		    
		    // 검색 결과 리스트에서 항목을 클릭했을 때의 동작
		    resultsList.addEventListener('click', function(e) {
		        // 클릭된 요소가 LI 태그일 때만 실행
		        if (e.target && e.target.nodeName === 'LI') {
		            const selectedItem = e.target;
		            const { servingSize, calories, carbs, protein, fat, sfa, sugar, sodium } = selectedItem.dataset;

		            // form 안에 있는 hidden input들을 찾아서 값을 채워줍니다.
		            document.querySelector('input[name="servingSize"]').value = servingSize || 0;
		            document.querySelector('input[name="calories"]').value = calories || 0;
		            document.querySelector('input[name="carbs"]').value = carbs || 0;
		            document.querySelector('input[name="protein"]').value = protein || 0;
		            document.querySelector('input[name="fat"]').value = fat || 0;
								document.querySelector('input[name="sfa"]').value = sfa || 0;
								document.querySelector('input[name="sugar"]').value = sugar || 0;
		            document.querySelector('input[name="sodium"]').value = sodium || 0;
		            
		            selectedInfoDiv.textContent = `✅ ${selectedItem.textContent} 의 영양성분이 선택되었습니다.`;
		            selectedInfoDiv.style.display = 'block';
		            
		            resultsList.style.display = 'none';
		        }
		    });
		}
		
});

// ---------- [출력/뷰(shopBasicView) 페이지 전용 지도 표시 코드] ----------
$(function() {
    var $map = $("#shop-map");
    var $addr1 = $("#address1");
    var $addr2 = $("#address2");
    if ($map.length && $addr1.length && !$addr1.is("input")) {
        var addr = $addr1.text().trim();
        var addr2 = ($addr2.length && !$addr2.is("input")) ? $addr2.text().trim() : '';
        if (addr2) addr += " " + addr2;
        //console.log("지도에 넘기는 주소:", addr); // ★이 줄 추가
        setTimeout(function() {
            if (addr && window.kakao && kakao.maps) {
                shopViewShowMap(addr);
            } else {
                console.log("카카오맵 준비 안됨 또는 주소 없음");
            }
        }, 300);
    }
});

// 뷰 페이지 전용 지도 함수 (폼에서 사용하는 showMap과 이름 다름)
function shopViewShowMap(address) {
    /*
	alert("지도 함수 실행됨! 주소: " + address); // 진짜 함수 실행되는지 체크
    if (!(window.kakao && kakao.maps && kakao.maps.services)) {
        alert("카카오맵 라이브러리 없음");
        return;
    }*/
    var mapContainer = document.getElementById('shop-map');
    var mapOption = {
        center: new kakao.maps.LatLng(37.566826, 126.9786567),
        level: 3
    };
    var map = new kakao.maps.Map(mapContainer, mapOption);
    var geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, function(result, status) {
        console.log("addressSearch status:", status, result); // ★이 줄 중요!
        if (status === kakao.maps.services.Status.OK) {
            var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            var marker = new kakao.maps.Marker({
                map: map,
                position: coords
            });
            map.setCenter(coords);
        } else {
            alert("카카오맵 주소 검색 실패! status: " + status);
        }
    });
}

// ---------- [수정/입력(shopBasicSet) 폼 전용 지도 표시 코드] ----------
$(function() {
    // 1. 페이지 로드시 초기 지도 표시 (입력폼은 input이니까 .val())
    var addr = $("#address1").val() || "";
    var addr2 = $("#address2").val() || "";
    if (addr) showMap(addr + " " + addr2);

    // 2. 주소 입력/변경 시 지도 즉시 갱신
    $("#address1, #address2").on("input", function() {
        var a1 = $("#address1").val() || "";
        var a2 = $("#address2").val() || "";
        if (a1) showMap(a1 + " " + a2);
    });
});

// 폼 전용 지도 표시 함수
function showMap(address) {
    if (!(window.kakao && kakao.maps && kakao.maps.services)) return;
    var mapContainer = document.getElementById('shop-map');
    var mapOption = {
        center: new kakao.maps.LatLng(37.566826, 126.9786567),
        level: 3
    };
    var map = new kakao.maps.Map(mapContainer, mapOption);
    var geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, function(result, status) {
        if (status === kakao.maps.services.Status.OK) {
            var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            var marker = new kakao.maps.Marker({
                map: map,
                position: coords
            });
            map.setCenter(coords);
        }
    });
}

// 영업상태 ON/OFF 토글
$(function() {
    $('.shop-status-table input[type="checkbox"]').on('change', function() {
        const $checkbox = $(this);
        const sId = $checkbox.data('sid');
        const isChecked = $checkbox.is(':checked');
        // AJAX로 상태 변경 요청
        $.post('/shop/statusUpdate', { sId: sId, status: isChecked ? 'Y' : 'N' })
            .done(function() {
                location.reload(); // 새로고침(동적으로 UI만 바꿔도 됨)
            })
            .fail(function() {
                alert('상태 변경에 실패했습니다.');
                // 실패 시 체크박스 원복
                $checkbox.prop('checked', !isChecked);
            });
    });
});


// ----- 영업시간 관리 (휴무/전체휴무 토글 등) -----
$(function () {

  // 전체휴무 체크박스
  $(".allDay-check").on("change", function () {
    const $tr = $(this).closest("tr");
    if (this.checked) {
      $tr.find("select[name^='openHour']").val("00");
      $tr.find("select[name^='openMin']").val("00");
      $tr.find("select[name^='closeHour']").val("23");
      $tr.find("select[name^='closeMin']").val("59");
    }
    // disabled 절대 쓰지 않음
  });

  // 휴무/영업 스위치
  const updateDayRow = ($chk) => {
    const $tr = $chk.closest("tr");
    const idx = $chk.attr("id")
      ? $chk.attr("id").replace("isOpen", "")
      : $chk.attr("name").match(/\[(\d+)\]/)[1];
    const $label = $("#openLabel" + idx);
    const on = $chk.is(":checked");

    // 값 전송은 그대로, UI만 막기
    $tr.find("select").toggleClass("disabled-look", !on);
    $tr.find(".allDay-check").prop("disabled", !on);

    $label
      .text(on ? "영업중" : "휴무")
      .toggleClass("bg-success", on)
      .toggleClass("bg-secondary", !on);
  };

  $(".switch input[type='checkbox'][name^='isOpen']")
    .each(function () { updateDayRow($(this)); })
    .on("change", function () { updateDayRow($(this)); });

  // 혹시라도 다른 스크립트가 disabled 걸면 제출 전에 해제
  $("#openTimeForm").on("submit", function () {
    $(this).find("select:disabled").prop("disabled", false);
  });
});

