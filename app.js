// === Data & Config ===
const SECTIONS = [
  { id: 'three_top', title: 'สามตัวบน', digits: 3, rate: 800, color: 'green', rowClass: 'bg-top-3' },
  { id: 'three_tod', title: 'สามตัวโต๊ด', digits: 3, rate: 100, color: 'orange', rowClass: 'bg-tod-3' },
  { id: 'two_top', title: 'สองตัวบน', digits: 2, rate: 80, color: 'green', rowClass: 'bg-top-2' },
  { id: 'two_bot', title: 'สองตัวล่าง', digits: 2, rate: 80, color: 'orange', rowClass: 'bg-bot-2' },
];

const WHITE_BG_RATES = {
  three_top: 900,
  three_tod: 150,
  two_top: 90,
  two_bot: 90
};

let data = {};
let bulkPriceStr = ''; 
let lastBulkValue = null; 

// Ensure data structure exists
SECTIONS.forEach(s => { data[s.id] = []; });

// === Utilities ===
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// === Persistence ===
function saveData() {
  localStorage.setItem('lotteryData', JSON.stringify(data));
}

function loadData() {
  const saved = localStorage.getItem('lotteryData');
  if (saved) {
    data = JSON.parse(saved);
    SECTIONS.forEach(s => {
      if (!data[s.id]) data[s.id] = [];
    });
  }
}
loadData();

// === Render ===
function render() {
  const wrap = document.getElementById('sectionsWrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  let totalItems = 0;

  SECTIONS.forEach(sec => {
    const entries = data[sec.id];
    if (!Array.isArray(entries) || entries.length === 0) return;

    let html = `
      <div class="section-header">
        <span class="col-idx">#</span>
        <span class="section-title ${sec.color} fw-bold">${sec.title}</span>
        <span class="col-rate">${sec.rate > 0 ? 'อัตราคูณ' : ''}</span>
        <span class="col-win">เรทชนะ</span>
        <span class="col-del"></span>
      </div>`;

    entries.forEach((entry, i) => {
      totalItems++;
      const currentRate = entry.rate || sec.rate;
      const winAmount = entry.amount * currentRate;

      // Original price (amount 1 and specific white-bg rate) gets white background
      // Changed price gets the section's default color (e.g., red-bg or pink)
      const targetWhiteRate = WHITE_BG_RATES[sec.id] || sec.rate;
      const isDefault = entry.amount == 1 && currentRate == targetWhiteRate;
      const rowBgClass = isDefault ? 'white-bg' : (sec.rowClass || '');

      html += `
      <div class="entry-row ${rowBgClass}">
        <span class="col-idx">${i + 1}.</span>
        <span class="col-num"><input type="text" class="highlight-number" value="${escapeHTML(entry.number)}" maxlength="${sec.digits}" onchange="updateNumber('${sec.id}',${i},this.value)"></span>
        <input type="number" class="form-control form-control-sm normal-input input-amount" value="${escapeHTML(entry.amount)}" min="1" onchange="updateAmount('${sec.id}',${i},this.value)">
        <span class="col-rate"><input type="number" class="form-control form-control-sm normal-input input-rate-edit" value="${currentRate.toFixed(2)}" step="0.01" min="0" onchange="updateRate('${sec.id}',${i},this.value)"></span>
        <span class="col-win">
          <input type="text" class="form-control form-control-sm normal-input" value="${winAmount.toLocaleString()}฿" readonly>
        </span>
        <span class="col-del">
          <button class="btn-del" onclick="deleteEntry('${sec.id}',${i})"><i class="bi bi-trash"></i></button>
        </span>
      </div>`;
    });

    wrap.innerHTML += html;
  });

  const totalEl = document.getElementById('totalCount');
  if (totalEl) totalEl.textContent = totalItems + ' รายการ';
}

// === CRUD ===
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

// === Quick Price Selection Logic ===
function setBulkPrice(val) {
  const quickValues = [5, 10, 20, 50, 100];
  bulkPriceStr = '';
  const display = document.getElementById('bulkPriceDisplay');
  if (display) display.textContent = '';

  SECTIONS.forEach(sec => {
    data[sec.id].forEach(entry => {
      // Apply if it's 1 OR if it was set by one of our bulk tools previously
      if (entry.amount == 1 || entry.amount == lastBulkValue || quickValues.includes(Number(entry.amount))) {
        entry.amount = val;
      }
    });
  });
  lastBulkValue = val;
  saveData();
  render();
}

function bulkPricePress(num) {
  bulkPriceStr += num;
  applyBulkPrice();
}

function bulkPriceDelete() {
  bulkPriceStr = bulkPriceStr.slice(0, -1);
  applyBulkPrice();
}

function bulkPriceClear() {
  bulkPriceStr = '';
  applyBulkPrice();
}

function bulkPriceConfirm() {
  const newPrice = parseInt(bulkPriceStr);
  const quickValues = [5, 10, 20, 50, 100];

  if (!isNaN(newPrice) && newPrice > 0) {
    SECTIONS.forEach(sec => {
      data[sec.id].forEach(entry => {
        // Apply if it's 1 OR if it matches the last thing we set OR is a quick value
        if (entry.amount == 1 || entry.amount == lastBulkValue || quickValues.includes(Number(entry.amount))) {
          entry.amount = newPrice;
        }
      });
    });
    lastBulkValue = newPrice;
    saveData();
    render();
  }
  // Clear tracker after applying
  bulkPriceStr = '';
  applyBulkPrice();
}

function applyBulkPrice() {
  const display = document.getElementById('bulkPriceDisplay');
  if (display) display.textContent = bulkPriceStr;
}

// === Keyboard Support ===
document.addEventListener('keydown', (e) => {
  // If we're typing in an input field, don't use global numpad logic
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const key = e.key;

  if (key >= '0' && key <= '9') {
    bulkPricePress(key);
  } else if (key === 'Backspace') {
    bulkPriceDelete();
  } else if (key === 'Enter') {
    bulkPriceConfirm();
  } else if (key === 'Escape') {
    bulkPriceClear();
  }
});

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  render();
});
