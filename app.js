// === Data & Config ===
const SECTIONS = [
  { id: 'two_top',   title: 'สองตัวบน',   digits: 2, rate: 90,  color: 'green', rowClass: '' },
  { id: 'three_top', title: 'สามตัวบน',   digits: 3, rate: 850, color: 'green', rowClass: '' },
  { id: 'two_bot',   title: 'สองตัวล่าง', digits: 2, rate: 90,  color: 'orange', rowClass: 'red-bg' },
  { id: 'three_tod', title: 'สามตัวโต๊ด', digits: 3, rate: 120, color: 'orange', rowClass: 'red-bg' },
];

let data = {};
let currentSection = '';
let bsModal = null;

SECTIONS.forEach(s => { data[s.id] = []; });

// === Persistence ===
function saveData() {
  localStorage.setItem('lotteryData', JSON.stringify(data));
}

function loadData() {
  const saved = localStorage.getItem('lotteryData');
  if (saved) {
    data = JSON.parse(saved);
  }
}
loadData();

// === Render ===
function render() {
  const wrap = document.getElementById('sectionsWrap');
  wrap.innerHTML = '';
  let totalItems = 0;

  SECTIONS.forEach(sec => {
    const entries = data[sec.id];

    // Section header
    let html = `
      <div class="section-header">
        <span class="col-idx">#</span>
        <span class="section-title ${sec.color} fw-bold">${sec.title}</span>
        <span class="col-rate">${sec.rate > 0 ? 'อัตราคูณ' : ''}</span>
        <span class="col-win">เรทชนะ</span>
        <span class="col-del"></span>
      </div>`;

    // Entry rows
    entries.forEach((entry, i) => {
      totalItems++;
      // ใช้ค่าที่กำหนดมาจากหน้าเพิ่มรายการ (ถ้าไม่มีค่อยใช้ค่ามาตรฐาน)
      const currentRate = entry.rate || sec.rate;
      const winAmount = entry.amount * currentRate;

      html += `
      <div class="entry-row ${sec.rowClass}">
        <span class="col-idx">${i + 1}.</span>
        <span class="col-num"><input type="text" class="highlight-number" value="${entry.number}" maxlength="${sec.digits}" onchange="updateNumber('${sec.id}',${i},this.value)"></span>
        <input type="number" class="form-control form-control-sm normal-input input-amount" value="${entry.amount}" min="1" onchange="updateAmount('${sec.id}',${i},this.value)">
        <span class="col-rate"><input type="number" class="form-control form-control-sm normal-input input-rate-edit" value="${currentRate.toFixed(2)}" step="0.01" min="0" onchange="updateRate('${sec.id}',${i},this.value)"></span>
        <span class="col-win">
          <input type="text" class="form-control form-control-sm normal-input" value="${winAmount}฿" readonly>
        </span>
        <span class="col-del">
          <button class="btn-del" onclick="deleteEntry('${sec.id}',${i})"><i class="bi bi-trash"></i></button>
        </span>
      </div>`;
    });

    wrap.innerHTML += html;
  });

  document.getElementById('totalCount').textContent = totalItems + ' รายการ';
}

// === CRUD ===
function openAddGlobal() {
  const container = document.getElementById('bulkAddContainer');
  container.innerHTML = '';
  
  SECTIONS.forEach(sec => {
    const secDiv = document.createElement('div');
    secDiv.className = 'bulk-section';
    secDiv.innerHTML = `
      <div class="bulk-section-label fw-bold text-uppercase">${sec.title} (${sec.digits} หลัก)</div>
      <div id="rows-${sec.id}"></div>
      <div class="mt-2">
        <button class="btn btn-outline-success btn-sm border-0" onclick="addBulkRow('${sec.id}')">
          <i class="bi bi-plus-circle"></i> เพิ่มแถวในหมวดนี้
        </button>
      </div>
    `;
    container.appendChild(secDiv);
    addBulkRow(sec.id); // Add first row by default
  });

  if (!bsModal) bsModal = new bootstrap.Modal(document.getElementById('addModal'));
  bsModal.show();
}

function addBulkRow(secId) {
  const sec = SECTIONS.find(s => s.id === secId);
  const rowsContainer = document.getElementById(`rows-${secId}`);
  const rowDiv = document.createElement('div');
  rowDiv.className = 'bulk-row';
  rowDiv.dataset.secId = secId;
  rowDiv.innerHTML = `
    <input type="text" class="input-num" placeholder="เลข" maxlength="${sec.digits}">
    <input type="number" class="input-amt" placeholder="จำนวน" min="1">
    <input type="number" class="input-rate" placeholder="อัตรา" value="${sec.rate}">
    <button class="btn-remove-row" onclick="this.parentElement.remove()" title="ลบแถวนี้">
      <i class="bi bi-dash"></i>
    </button>
  `;
  rowsContainer.appendChild(rowDiv);
  rowDiv.querySelector('.input-num').focus();
}

function confirmBulkAdd() {
  const rows = document.querySelectorAll('.bulk-row');
  let addedCount = 0;
  
  rows.forEach(row => {
    const secId = row.dataset.secId;
    const sec = SECTIONS.find(s => s.id === secId);
    const num = row.querySelector('.input-num').value.trim();
    const amt = parseInt(row.querySelector('.input-amt').value);
    const rate = parseInt(row.querySelector('.input-rate').value);
    
    // Only add if both number and amount are provided
    if (num && !isNaN(amt)) {
      if (num.length === sec.digits) {
        data[secId].push({ 
          number: num, 
          amount: amt, 
          rate: rate || sec.rate 
        });
        addedCount++;
      }
    }
  });
  
  if (addedCount > 0) {
    saveData();
    bsModal.hide();
    render();
  } else {
    alert('กรุณากรอกข้อมูลให้ครบถ้วนอย่างน้อย 1 รายการ (เลขต้องครบหลัก)');
  }
}

function deleteEntry(sectionId, index) {
  data[sectionId].splice(index, 1);
  saveData();
  render();
}

function updateAmount(sectionId, index, val) {
  data[sectionId][index].amount = parseInt(val) || 1;
  saveData();
  render();
}

function updateNumber(sectionId, index, val) {
  const sec = SECTIONS.find(s => s.id === sectionId);
  val = val.trim();
  if (val.length === sec.digits) {
    data[sectionId][index].number = val;
    saveData();
    render();
  } else {
    alert(`กรุณากรอกเลขให้ครบ ${sec.digits} หลัก`);
    render();
  }
}

function updateRate(sectionId, index, val) {
  const newRate = parseFloat(val);
  if (!isNaN(newRate) && newRate > 0) {
    data[sectionId][index].rate = newRate;
    saveData();
    render();
  } else {
    render();
  }
}

// Initial render
render();
