// ==== 0. 벨 아이콘 깜빡임 제어 ========================
function markBellAsUnread() {
  const icon = document.getElementById('notifyIcon');
  if (icon && !icon.classList.contains('blink')) {
    icon.classList.add('blink');
  }
}
function clearBellBlink() {
  const icon = document.getElementById('notifyIcon');
  if (icon && icon.classList.contains('blink')) {
    icon.classList.remove('blink');
  }
}

// ==== 1. 주문 상세 토글 & 아이콘 변경 ================
function toggleDetail(oNo) {
  const detail = document.getElementById(`detail-${oNo}`);
  const btn    = document.querySelector(`button[aria-controls="detail-${oNo}"]`);
  if (!detail || !btn) return;
  const icon      = btn.querySelector('i');
  const isOpening = detail.classList.toggle('d-none') === false;
  btn.setAttribute('aria-expanded', isOpening);
  icon.classList.toggle('bi-chevron-down', !isOpening);
  icon.classList.toggle('bi-chevron-up',   isOpening);
}

// ==== 2. 벨 깜빡임 재시작 ============================
document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('header-notif-badge');
  if (badge && +badge.textContent > 0) {
    markBellAsUnread();
  }
});

// ==== 3. WebSocket 초기화 & 이벤트 처리 ==============
document.addEventListener('DOMContentLoaded', () => {
  const notifyContainer = document.getElementById('notifyContainer');
  if (!notifyContainer) return;
  const shopId = notifyContainer.dataset.shopId;

  const socket      = new SockJS('/ws');
  const stompClient = Stomp.over(socket);

  stompClient.connect({}, () => {
    // ─── 3.1 신규 주문 알림 구독 ─────────────────────────
    stompClient.subscribe(`/topic/newOrder/${shopId}`, msg => {
      renderHeaderNotification(msg);
      markBellAsUnread();
    });

    // ─── 3.2 주문 상태 변경(헤더) ────────────────────────
    stompClient.subscribe(`/topic/orderStatus/shop/${shopId}`, msg => {
      const { oNo } = JSON.parse(msg.body);
      removeHeaderNotification(oNo);
    });

    // ─── 3.3 주문 상태 변경(테이블) ──────────────────────
    document.querySelectorAll('tr[data-order-no]').forEach(row => {
      const oNo = row.dataset.orderNo;
      stompClient.subscribe(`/topic/orderStatus/order/${oNo}`, msg => {
        const { newStatus } = JSON.parse(msg.body);
        const cell = document.querySelector(`.status-cell[data-order-no="${oNo}"]`);
        if (cell) cell.textContent = newStatus;
      });
    });
  });
});

// ==== 4. 헤더 알림 추가/제거 헬퍼 ======================
function renderHeaderNotification(msg) {
  const data  = JSON.parse(msg.body);
  const badge = document.getElementById('header-notif-badge');
  const list  = document.getElementById('header-notif-list');
  if (!badge || !list) return;

  // 배지 업데이트
  badge.textContent = String((parseInt(badge.textContent,10)||0) + 1);
  badge.classList.remove('d-none');
  list.querySelector('li.text-muted')?.remove();

  // 새 알림 아이템 생성
  const item = document.createElement('li');
  item.className       = 'notif-item d-flex justify-content-between align-items-center';
  item.dataset.orderNo = data.oNo;
  item.innerHTML = `
    <a class="dropdown-item flex-grow-1 text-truncate"
       href="/shop/orderManage?status=PENDING">
      새 주문이 도착했습니다.
    </a>
  `;
  list.prepend(item);
}

function removeHeaderNotification(oNo) {
  document
    .querySelector(`#header-notif-list .notif-item[data-order-no="${oNo}"]`)
    ?.remove();

  const badge = document.getElementById('header-notif-badge');
  if (!badge) return;
  const cnt = Math.max(0, parseInt(badge.textContent||'0', 10) - 1);
  badge.textContent = cnt;

  if (cnt === 0) {
    badge.classList.add('d-none');
    clearBellBlink();
  }
}

// ==== 5. 주문 관리 함수 (수락 / 거절) ================
window.acceptOrder = oNo => {
  if (!confirm('이 주문을 수락하시겠습니까?')) return;
  fetch(`/shop/orderManage/${oNo}/status`, {
    method:  'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body:    'newStatus=ACCEPTED'
  })
  .then(r => r.json())
  .then(data => {
    if (!data.success) throw new Error();
    // 리스트에서는 해당 주문 삭제
    document.querySelector(`.order-card[data-order-no="${oNo}"]`)?.remove();
    // 상세에서는 IN_PROGRESS로 이동 (필요시만)
    location.href = '/shop/orderManage?status=IN_PROGRESS';
  })
  .catch(() => alert('수락 실패!'));
};

window.rejectOrder = oNo => {
  if (!confirm('이 주문을 거절하시겠습니까?')) return;
  fetch(`/shop/orderManage/${oNo}/status`, {
    method:  'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body:    'newStatus=REJECTED'
  })
  .then(r => r.json())
  .then(data => {
    if (!data.success) throw new Error();
    document.querySelector(`.order-card[data-order-no="${oNo}"]`)?.remove();
    location.href = '/shop/orderManage?status=PENDING';
  })
  .catch(() => alert('거절 실패!'));
};

// ==== 6. 신규주문 리스트에 항목 추가 (타이머 제거) ======
function renderNewOrderItem(msg) {
  const o = JSON.parse(msg.body);
  const ul = document.getElementById('newOrderList');
  ul.querySelector('li.text-center.text-muted')?.remove();

  const li = document.createElement('li');
  li.className       = 'list-group-item d-flex align-items-start mb-3 p-3 notif-item';
  li.dataset.orderNo = o.oNo;
  li.innerHTML = `
    <div class="flex-grow-1 pe-3">
      <div class="mb-1">🛒 ${o.menus}</div>
      <div class="mb-1">💬 ${o.request || '요청사항 없음'}</div>
      <div class="text-muted small">
        <i class="bi bi-clock"></i> ${new Date().toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })}
      </div>
    </div>
    <div class="d-flex flex-column justify-content-between" style="min-width:5rem;">
      <button class="btn btn-success btn-sm mb-2" onclick="acceptOrder(${o.oNo})">수락</button>
      <button class="btn btn-outline-danger btn-sm" onclick="rejectOrder(${o.oNo})">거절</button>
    </div>
  `;
  ul.prepend(li);
}

// ==== 7. 휴무/영업 버튼 ================================
const updateDayRow = ($chk) => {
  const $tr = $chk.closest("tr");
  const idx = $chk.attr("id")
    ? $chk.attr("id").replace("isOpen", "")
    : $chk.attr("name").match(/\[(\d+)\]/)[1];
  const $label = $("#openLabel" + idx);
  const on = $chk.is(":checked");

  $tr.find("select").toggleClass("disabled-look", !on);
  $tr.find(".allDay-check").prop("disabled", !on);

  $label
    .text(on ? "영업일" : "휴무일")
    .toggleClass("bg-success", on)
    .toggleClass("bg-secondary", !on);
};

$(".switch input[type='checkbox'][name^='isOpen']")
  .each(function () { updateDayRow($(this)); })
  .on("change",   function () { updateDayRow($(this)); });

$("#openTimeForm").on("submit", function () {
  $(this).find("select:disabled").prop("disabled", false);
});

// ==== 8. 주문 상세 페이지 픽업/배달 버튼 ===============
document.addEventListener('DOMContentLoaded', () => {
  const btnPickup  = document.getElementById('btnPickup');
  const btnDeliver = document.getElementById('btnDeliver');

  if (btnPickup) {
    btnPickup.addEventListener('click', () => {
      updateStatus('IN_PROGRESS', () => {
        btnPickup.disabled  = true;
        btnDeliver.disabled = false;
      });
    });
  }

  if (btnDeliver) {
    btnDeliver.addEventListener('click', () => {
      updateStatus('COMPLETED', () => {
        window.location.href = '/shop/orderManage?status=PENDING';
      });
    });
  }

  function updateStatus(newStatus, cb) {
    const container = document.querySelector('[data-order-no]');
    const oNo       = container ? container.dataset.orderNo : 0;
    fetch(`/shop/orderManage/${oNo}/status`, {
      method:  'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body:    'newStatus=' + newStatus
    })
    .then(r => r.json())
    .then(d => { if (d.success) cb(); });
  }
});
