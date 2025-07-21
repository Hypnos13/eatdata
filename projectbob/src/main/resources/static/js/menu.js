document.addEventListener('DOMContentLoaded', function () {
	// 메뉴 옵션 관련 공통 함수
	const optionsContainer = document.getElementById('menuOptionsContainer');
	const addOptionBtn = document.getElementById('addOptionBtn');
	// 옵션 인덱스 초기화
	let optionIndex = optionsContainer ? optionsContainer.children.length : 0;
	//옵션 행 추가 함수
	function addOptionRow(moId = 0, mOption = '', content = '', price = '', status = 'active' ) {
		if (!optionsContainer) return;
		const newOptionDiv = document.createElement('div');
		newOptionDiv.classList.add('input-group', 'mb-2', 'menu-option-item');
		if(status == 'deleted') {
			newOptionDiv.style.display = 'none';
		}
		newOptionDiv.innerHTML = `
					<input type="hidden" name="options[${optionIndex}].moId" value=${moId} />
					<input type="text" name="options[${optionIndex}].mOption" class="form-control" placeholder="옵션 이름" value="${mOption}" ${status != 'deleted' ? 'required' : ''} />
					<input type="text" name="options[${optionIndex}].content" class="form-control" placeholder="옵션 내용" value="${content}" ${status != 'deleted' ? 'required' : ''} />
					<input type="number" name="options[${optionIndex}].price" class="form-control" placeholder="가격" value="${price}" />
					<input type="hidden" name="options[${optionIndex}].status" value=${status} />
					<button type="button" class="btn btn-outline-danger remove-option-btn">삭제</button> `;
		optionsContainer.appendChild(newOptionDiv);
		optionIndex++;
	}
	// 옵션 추가 버튼 이벤트 리스너
	if(addOptionBtn) {
		addOptionBtn.addEventListener('click', function () {
			addOptionRow();
		});
	}
	// 삭제 버튼 이벤트 위임
	if(optionsContainer) {
		optionsContainer.addEventListener('click', function (e) {
			if(e.target.classList.contains('remove-option-btn')) {
				const optionItem = e.target.closest('.menu-option-item');
				if(optionItem) {
					const moIdInput = optionItem.querySelector('input[name$=".moid"]');
					const statusInput = optionItem.querySelector('input[name$=".status"]');
					
					if(moIdInput && parseInt(moIdInput.value)>0) {
						// 기존 옵션인 경우: status를 'deleted' 로 변경하고 숨김
						if(statusInput) {
							statusInput.value = 'deleted';
						}
						optionItem.style.display = 'none';
						optionItem.querySelectorAll('input[required], textarea[required]').forEach(input => {
							input.removeAttribute('required');
						});
					} else {
						//새롭게 추가된 옵션인 경우: DOM에서 즉시 제거
						optionItem.remove();
					}
					reindexOptions();
				}
			}
		});
	}
	// 폼 제출전에 input들의 name 속성 인덱스를 재정렬 하는 함수
	function reindexOptions() {
		if(!optionsContainer) return;
		const activeOptionItems = optionsContainer.querySelectorAll('.menu-option-item');
		let currentIndex = 0;
		activeOptionItems.forEach(item => {
			// 삭제되지 않은 항목들만 재인덱싱
			if(item.style.display != 'none') {
				item.querySelectorAll('input').forEach(input => {
					const currentName = input.name;
					// name 속성이 'options[숫자].필드명' 형태의 경우에만 재정렬
					if(currentName && currentName.startsWith('options[')) {
						input.name = currentName.replace(/options\[\d+\]/, `options[${currentIndex}]`);
					}
				});
				currentIndex++;
			}
		});
		optionIndex = currentIndex; // 다음에 추가될 옵션의 인덱스 업데이트
	}
	// 메뉴 등록 폼
	const menuRegisterForm = document.getElementById('menuRegisterForm');
	if(menuRegisterForm) {
		menuRegisterForm.addEventListener('submit', function(e) {
			if(document.getElementById("category").value.length == 0 ) {
				alert("카테고리를 입력해주세요.");
				e.preventDefault(); // 폼 제출 방지
				return false;
			}
	    if(document.getElementById("name").value.length == 0 ) {
				alert("메뉴 이름을 입력해주세요.");
				e.preventDefault();
        return false;
			}
	    if(document.getElementById("price").value.length == 0 ) {
        alert("가격을 입력해주세요.");
        e.preventDefault();
        return false;
			}
	    if(document.getElementById("mInfo").value.length == 0 ) {
        alert("메뉴 설명을 입력해주세요.");
        e.preventDefault();
        return false;
			}
			// 옵션이 없는 경우
			const activeOption = optionsContainer ? 
			 optionsContainer.querySelectorAll('.menu-option-item:not([style*="display: none"])') : [];
			 if(activeOption.length == 0 && confirm("옵션 없이 메뉴를 등록하시겠습니까?")) {
				//사용자가 확인하면 제출 허용
			 } else if(activeOption.length == 0) {
				e.preventDefault(); // 옵션이 없는데 사용자가 취소하면 제출 방지
				return false;
			 }
			 //모든 유효성 검사 통과 시 폼 제출 허용
			 return true;
		});
	}
	// 메뉴 수정 폼
	const menuSelect = document.getElementById('menuSelect');
	const menuUpdateForm = document.getElementById('menuUpdateForm');
	//드롭다운 메뉴 변경 시 메뉴 정보 로드
	if(menuSelect) {
		menuSelect.addEventListener('change', function () {
			const selectedMenuId = this.value;
			if(selectedMenuId) {
				window.location.href = '/shop/menuUpdateForm?mId=' + selectedMenuId // 페이지 리로드 방식으로 메뉴 정보 로드
			} else {
				// "메뉴를 선택하세요" 를 선택한 경우 폼 필드 초기화(mId 없이 페이지 재로드)
				window.location.href = '/shop/menuUpdateForm';
			}
		});
	}
	// 페이지 로드 시 초기 메뉴 데이터 설정(수정 폼)
	if(menuUpdateForm) {
		const initialMenuDataElement = document.getElementById('initialMenuDataJson');
		let initialMenu = null;
		
		if(initialMenuDataElement && initialMenuDataElement.dataset.menuJson) {
			try {
				// 컨트롤러에서 ObjectMapper로 변환된 JSON 문자열을 파싱
				initialMenu = JSON.parse(initialMenuDataElement.dataset.menuJson);
			} catch (e) {
				console.error("Failed to parse initial menu JSON: ", e);
				initialMenu = null;
			}
		}
		if (initialMenu && initialMenu.options && initialMenu.options.length > 0 ) {
			optionsContainer.innerHTML = '';// 기본에 Thymeleaf 로 렌더링된 옵션들을 초기화
			optionIndex = 0; // 인덱스 초기화
			initialMenu.options.forEach(option => {
				addOptionRow(option.moId, option.moption, option.content, option.price, option.status);
			})
		}
	}
	// 메뉴 목록 페이지
	const deleteMenuButtons = document.querySelectorAll('.delete-menu-btn');// 클래스명으로 변경
	
	if (deleteMenuButtons.length > 0) {
		deleteMenuButtons.forEach(button => {
			button.addEventListener('click', function(e) {
				const form = this.closest('form');
				if(form) {
					if (confirm('정말로 이 메뉴를 삭제하시겠습니까?')) {
						form.submit(); // 확인 시 폼 제출
					} else {
						e.preventDefault(); // 취소 시 폼 제출 방지
					}
				}
			})
		})
	}
	
})

