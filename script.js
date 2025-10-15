// QR 코드 스캐너 인스턴스 (전역 변수)는 여기에 위치해야 합니다.
let html5QrCode; 
let isScannerRunning = false; // 스캐너 실행 상태 추적

// --- 화면 전환 로직 ---

/**
 * 화면을 전환하는 함수
 * @param {string} targetId 활성화할 화면의 ID
 */
function switchScreen(targetId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(targetId).classList.add('active');
}

// --- 가상 재고 데이터 (DB 역할) ---
let stockData = [
    { id: 1, region: "강남", type: "밥그릇", status: "출고" },
    { id: 2, region: "종로", type: "국그릇", status: "수거" },
    { id: 3, region: "마포", type: "접시", status: "입고" },
    { id: 4, region: "강남", type: "밥그릇", status: "입고" },
];

// --- 이벤트 리스너 설정 ---
document.addEventListener('DOMContentLoaded', () => {

    // 1. 메인 메뉴 화면 (mainMenu)
    document.getElementById('btnCollect').addEventListener('click', () => {
        switchScreen('collectQR');
    });

    document.getElementById('btnAdmin').addEventListener('click', () => {
        switchScreen('adminMenu');
    });

    // 2. 수거 QR 인식 화면 (collectQR) - 카메라 기능 추가
    // '카메라 켜기/스캔 시작' 버튼
    document.getElementById('btnStartScanCollect').addEventListener('click', () => {
        startQrScanner('reader', 'collectComplete');
    });

    // '종료' 버튼 (스캐너 정지 로직 포함)
    document.getElementById('btnExitCollect').addEventListener('click', () => {
        stopQrScanner();
        switchScreen('mainMenu');
    });

    // 3. 수거 완료 확인 화면 (collectComplete) - 클릭/터치 시 스캐너 재시작
    document.getElementById('collectComplete').addEventListener('click', () => {
        switchScreen('collectQR');
        // 다음 스캔을 위해 화면이 돌아오면 스캐너 시작 버튼을 눌러야 함
    });

    // 4. 관리자 메뉴 화면 (adminMenu)
    document.getElementById('btnAdminIn').addEventListener('click', () => {
        switchScreen('inboundQR');
    });
    
    document.getElementById('btnAdminOut').addEventListener('click', () => {
        switchScreen('outboundQR');
    });
    
    document.getElementById('btnAdminStock').addEventListener('click', () => {
        updateStockTable(); // 재고 상황 화면으로 가기 전에 데이터 업데이트
        switchScreen('stockStatus');
    });

    document.getElementById('btnExitAdminMenu').addEventListener('click', () => {
        switchScreen('mainMenu');
    });

    // 5. 입고 QR 인식 화면 (inboundQR)
    document.getElementById('btnScanIn').addEventListener('click', () => {
        console.log("입고 QR 스캔 시도...");
        // DB 업데이트 로직 (프로토타입에서는 가상으로 추가)
        stockData.push({ id: stockData.length + 1, region: "신규", type: "미확인", status: "입고" }); 
        
        switchScreen('inboundComplete');
    });
    
    document.getElementById('btnExitIn').addEventListener('click', () => {
        switchScreen('adminMenu');
    });

    // 6. 입고 완료 확인 화면 (inboundComplete) - 클릭/터치 시 입고 QR 인식 화면으로 복귀
    document.getElementById('inboundComplete').addEventListener('click', () => {
        switchScreen('inboundQR');
    });

    // 7. 출고 QR 인식 화면 (outboundQR)
    document.getElementById('btnScanOut').addEventListener('click', () => {
        console.log("출고 QR 스캔 시도...");
        // DB 업데이트 로직 (프로토타입에서는 가상으로 추가)
        stockData.push({ id: stockData.length + 1, region: "신규", type: "미확인", status: "출고" }); 
        
        switchScreen('outboundComplete');
    });
    
    document.getElementById('btnExitOut').addEventListener('click', () => {
        switchScreen('adminMenu');
    });

    // 8. 출고 완료 확인 화면 (outboundComplete) - 클릭/터치 시 출고 QR 인식 화면으로 복귀
    document.getElementById('outboundComplete').addEventListener('click', () => {
        switchScreen('outboundQR');
    });

    // 9. 재고 상황 조회 화면 (stockStatus)
    document.getElementById('btnExitStock').addEventListener('click', () => {
        switchScreen('adminMenu');
    });
});


// --- 재고 테이블 업데이트 함수 ---
function updateStockTable() {
    const tableBody = document.querySelector('#stockTable tbody');
    tableBody.innerHTML = ''; // 기존 내용 초기화

    stockData.forEach(item => {
        const row = tableBody.insertRow();
        
        // 상태에 따라 색상 클래스 추가 (선택 사항)
        let statusClass = '';
        if (item.status === '입고') statusClass = 'status-in';
        else if (item.status === '출고') statusClass = 'status-out';
        else if (item.status === '수거') statusClass = 'status-collect';

        row.insertCell().textContent = item.region;
        row.insertCell().textContent = item.type;
        const statusCell = row.insertCell();
        statusCell.textContent = item.status;
        statusCell.className = statusClass;
    });
    
    // 재고 상태 변화 시 스크롤을 맨 위로 이동 (사용자 경험 개선)
    const stockScreen = document.getElementById('stockStatus');
    if(stockScreen.classList.contains('active')) {
        stockScreen.scrollTop = 0;
    }
}

// QR 스캐너 시작 함수
function startQrScanner(readerId, successScreenId) {
    if (isScannerRunning) {
        console.warn("스캐너가 이미 실행 중입니다.");
        return;
    }
    
    // 화면에 QR 스캐너가 표시될 영역을 찾습니다.
    html5QrCode = new Html5Qrcode(readerId);
    
    // QR 스캔 성공 시 실행될 콜백 함수
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        stopQrScanner(); // QR 인식 성공 시 스캐너 정지
        console.log(`QR 코드 스캔 성공: ${decodedText}`);

        // 🚨 [임시 데이터 처리 로직]
        let containerId = decodedText.split('id=').pop(); // URL에서 ID 부분만 추출
        
        // 3. 수거 완료 확인 화면의 정보 업데이트
        document.querySelector('#collectComplete .info-text').textContent = 
            `QR 정보: ${containerId ? containerId : 'ID 인식 실패'}`;
        
        // 가상 DB 업데이트 (기존 로직 유지)
        if (containerId) {
             stockData.push({ id: containerId, region: "세종", type: "XL", status: "수거" });
        }
        
        // 완료 화면으로 전환
        switchScreen(successScreenId);
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
    .then(() => {
        isScannerRunning = true;
        document.getElementById('scan-message').textContent = '카메라가 활성화되었습니다. QR을 중앙에 맞춰주세요.';
        // QR 버튼을 잠시 숨김 처리 (선택 사항)
    })
    .catch(err => {
        isScannerRunning = false;
        document.getElementById('scan-message').textContent = '카메라 접근에 실패했습니다. (HTTPS 필요, 권한 확인)';
        console.error("카메라 접근 실패: ", err);
    });
}

// QR 스캐너 정지 함수
function stopQrScanner() {
    if (isScannerRunning && html5QrCode) {
        html5QrCode.stop().then(ignore => {
            isScannerRunning = false;
            console.log("QR 스캐너 정지됨.");
        }).catch(err => {
            console.error("스캐너 정지 실패: ", err);
        });
    }
}
