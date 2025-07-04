$(function(){
	
	$(document).ready(function(){
		// 전체보기 버튼 클릭 이벤트
		$('#allCategoryBtn').on('click', function(){
			window.location.href = '/shopList';
		});
		
		// 검색 버튼 클릭 이벤트
		const $searchInput = $('.search-box input[type="text"]');
		const $searchButton = $('.search-box button.btn.text-dark');
		
		$searchButton.on('click', function(){
			const searchValue = $searchInput.val().trim();
			if(searchValue == ""){
				alert('주소를 입력해주세요.');
				$searchInput.focus();
				return;
			}
			window.location.href = '/search?address=' + encodeURIComponent(searchValue);
		});
		
		// 다른 버튼 클릭 이벤트
		$('.category-card').on('click', function(){
			const categoryTitle = $(this).find('.category-title').text().trim();
			if(categoryTitle =='전체보기'){
				window.location.href = '/shopList';
			} else {
				window.location.href = '/shopList?category=' + encodeURIComponent(categoryTitle);
			}
		});
	});
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
});