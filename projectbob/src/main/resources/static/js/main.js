document.addEventListener('DOMContentLoaded', () => {
  console.log('main.js loaded');

  // kakao 객체가 아직 로드되지 않았다면 기다린다
  if (typeof kakao === 'undefined' || !kakao.maps) {
    console.error('❌ Kakao 객체가 아직 정의되지 않았습니다. SDK가 먼저 로드되었는지 확인하세요.');

    // ✅ 폴링 방식으로 retry (0.5초 간격 최대 10초까지 기다림)
    let retryCount = 0;
    const maxRetries = 20;

    const interval = setInterval(() => {
      if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.load) {
        clearInterval(interval);
        console.log('✅ Kakao SDK 로드 확인됨, 실행 시작');
        runKakaoScript(); // 아래 정의된 함수 실행
      } else {
        retryCount++;
        if (retryCount > maxRetries) {
          clearInterval(interval);
          console.error('❌ Kakao SDK 로드 시간 초과');
        }
      }
    }, 500);

    return; // 아래 로직 바로 실행 안 되도록 중단
  }

  // 즉시 실행 가능한 경우
  runKakaoScript();
});

// ✅ 실제 기능 실행 함수
function runKakaoScript() {
  kakao.maps.load(() => {
    console.log('📌 Kakao 지도 API 완전 로드됨');

    const searchButton = document.getElementById('btn-search-toggle');
    const inputField = document.getElementById('location-input');

    if (!searchButton || !inputField) {
      console.error('버튼 또는 입력 필드를 찾을 수 없습니다.');
      return;
    }

    searchButton.addEventListener('click', () => {
      console.log('📍 위치 버튼 클릭됨');

      if (!navigator.geolocation) {
        alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          console.log(`🧭 위도: ${lat}, 경도: ${lon}`);

          const geocoder = new kakao.maps.services.Geocoder();
          const coord = new kakao.maps.LatLng(lat, lon);

          geocoder.coord2Address(coord.getLng(), coord.getLat(), (result, status) => {
            if (status === kakao.maps.services.Status.OK) {
              const address = result[0].address.address_name;
              inputField.value = address;
              console.log(`📬 주소: ${address}`);
            } else {
              alert('주소 변환 실패');
            }
          });
        },
        (error) => {
          alert('위치 정보를 가져오지 못했습니다: ' + error.message);
        }
      );
    });
  });
}
