// === Data & Config ===
const SECTIONS = [
  { id: 'three_top', title: 'สามตัวบน',   digits: 3, rate: 850, color: 'green', rowClass: '' },
  { id: 'three_tod', title: 'สามตัวโต๊ด', digits: 3, rate: 120, color: 'orange', rowClass: 'red-bg' },
  { id: 'two_top',   title: 'สองตัวบน',   digits: 2, rate: 90,  color: 'green', rowClass: '' },
  { id: 'two_bot',   title: 'สองตัวล่าง', digits: 2, rate: 90,  color: 'orange', rowClass: 'red-bg' },
];

const BET_TYPE_CONFIG = {
  'three_top':     { digits: 3, label: '3ตัวบน',   sections: ['three_top'], reverse: false },
  'three_tod':     { digits: 3, label: '3ตัวโต๊ด', sections: ['three_tod'], reverse: false },
  'two_top':       { digits: 2, label: '2ตัวบน',   sections: ['two_top'],   reverse: false },
  'two_bot':       { digits: 2, label: '2ตัวล่าง', sections: ['two_bot'],   reverse: false },
  'three_reverse': { digits: 3, label: '3ตัวกลับ', sections: ['three_top', 'three_tod'], reverse: true },
  'two_reverse':   { digits: 2, label: '2ตัวกลับ', sections: ['two_top', 'two_bot'],     reverse: true },
};

let data = {};
let selectedTypes = new Set(['three_top']); // Multi-select: starts with 3ตัวบน
let currentNumberStr = '';

SECTIONS.forEach(s => { data[s.id] = []; });

// === Toggle Add Panel ===
function toggleAddPanel() {
  const panel = document.getElementById('addPanel');
  const isOpen = panel.style.display !== 'none';
  
  if (isOpen) {
    panel.style.display = 'none';
  } else {
    panel.style.display = 'block';
    // Focus the number input when opening
    setTimeout(() => {
      document.getElementById('inputNumber').focus();
    }, 100);
  }
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

// === Bet Type Selection (Multi-Select Toggle) ===
function toggleBetType(type) {
  if (selectedTypes.has(type)) {
    // Don't allow deselecting if it's the last one
    if (selectedTypes.size > 1) {
      selectedTypes.delete(type);
    }
  } else {
    // Check digit compatibility — can't mix 2-digit and 3-digit
    const newDigits = BET_TYPE_CONFIG[type].digits;
    const currentDigits = getSelectedDigits();

    if (currentDigits !== null && currentDigits !== newDigits) {
      // Switching digit group — clear previous selections and start fresh
      selectedTypes.clear();
      currentNumberStr = '';
    }
    selectedTypes.add(type);
  }

  updateUI();
}

// Get the digit count of currently selected types (null if none)
function getSelectedDigits() {
  for (const t of selectedTypes) {
    return BET_TYPE_CONFIG[t].digits;
  }
  return null;
}

// Update all UI elements based on current selection
function updateUI() {
  // Update button active states
  document.querySelectorAll('.bet-btn').forEach(btn => {
    btn.classList.toggle('active', selectedTypes.has(btn.dataset.type));
  });

  updateNumberDisplay();
  updateSelectedTags();
  showPreview();
}

// === Numpad Functions ===
function updateNumberDisplay() {
  const digits = getSelectedDigits() || 3;
  const numberBoxes = document.getElementById('numberBoxes');
  if (numberBoxes) {
    numberBoxes.innerHTML = '';
    for(let i=0; i<digits; i++) {
      const box = document.createElement('div');
      box.className = 'num-box';
      box.textContent = currentNumberStr[i] || '';
      numberBoxes.appendChild(box);
    }
  }

  const hiddenInput = document.getElementById('inputNumber');
  if (hiddenInput) hiddenInput.value = currentNumberStr;

  showPreview();
}

function numpadPress(num) {
  const digits = getSelectedDigits() || 3;
  if (currentNumberStr.length < digits) {
    currentNumberStr += num;
    updateNumberDisplay();
  }
}

function numpadDelete() {
  if (currentNumberStr.length > 0) {
    currentNumberStr = currentNumberStr.slice(0, -1);
    updateNumberDisplay();
  }
}

// Note: numpadClear is no longer needed since the cancel button was removed.

function numpadClearAll() {
  currentNumberStr = '';
  const amtInput = document.getElementById('inputAmount');
  if (amtInput) amtInput.value = '';
  const amtArea = document.getElementById('amountEntryArea');
  if (amtArea) amtArea.style.display = 'none';
  selectedTypes.clear();
  selectedTypes.add('three_top');
  updateUI();
}

function showAmountInput() {
  const digits = getSelectedDigits() || 3;
  if (currentNumberStr.length !== digits) {
    const numberBoxes = document.getElementById('numberBoxes');
    if (numberBoxes) shakeElement(numberBoxes);
    return;
  }
  const amtArea = document.getElementById('amountEntryArea');
  if (amtArea) amtArea.style.display = 'flex';
  const amtInput = document.getElementById('inputAmount');
  if (amtInput) amtInput.focus();
}

// Show selected types as tags
function updateSelectedTags() {
  const container = document.getElementById('selectedTags');
  container.innerHTML = '';
  selectedTypes.forEach(type => {
    const config = BET_TYPE_CONFIG[type];
    const isReverse = config.reverse;
    const colorClass = config.digits === 2 ? 'bg-blue' : 'bg-red';
    const tag = document.createElement('span');
    tag.className = `selected-tag ${colorClass} ${isReverse ? 'reverse-tag' : ''}`;
    tag.textContent = config.label;
    container.appendChild(tag);
  });
}

// === Permutation Generator ===
function getPermutations(str) {
  if (str.length <= 1) return [str];
  const perms = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const remaining = str.slice(0, i) + str.slice(i + 1);
    const subPerms = getPermutations(remaining);
    for (const sub of subPerms) {
      perms.push(char + sub);
    }
  }
  return [...new Set(perms)];
}

// === Show Full Preview (all selected types) ===
function showPreview() {
  const preview = document.getElementById('reversePreview');
  const val = currentNumberStr;
  const digits = getSelectedDigits() || 3;

  if (val.length === 0 || val.length !== digits) {
    preview.style.display = 'none';
    preview.innerHTML = '';
    return;
  }

  let html = '';
  let totalCount = 0;
  const previewKeys = new Set(); // Track duplicates in preview too

  selectedTypes.forEach(type => {
    const config = BET_TYPE_CONFIG[type];

    if (config.reverse) {
      const perms = getPermutations(val);
      // Show each target section
      config.sections.forEach(secId => {
        const sec = SECTIONS.find(s => s.id === secId);
        const uniquePerms = perms.filter(p => {
          const key = `${secId}:${p}`;
          if (previewKeys.has(key)) return false;
          previewKeys.add(key);
          return true;
        });
        if (uniquePerms.length > 0) {
          totalCount += uniquePerms.length;
          html += `
            <div class="preview-group">
              <span class="preview-section-label reverse-label">${config.label} → ${sec.title}</span>
              <div class="preview-nums-wrap">
                ${uniquePerms.map(p => `<span class="preview-num reverse-num">${p}</span>`).join('')}
              </div>
            </div>`;
        }
      });
    } else {
      const secId = config.sections[0];
      const key = `${secId}:${val}`;
      if (!previewKeys.has(key)) {
        previewKeys.add(key);
        totalCount += 1;
        html += `
          <div class="preview-group">
            <span class="preview-section-label">${config.label}</span>
            <div class="preview-nums-wrap">
              <span class="preview-num">${val}</span>
            </div>
          </div>`;
      }
    }
  });

  html += `<div class="preview-total">รวม ${totalCount} รายการ</div>`;

  preview.style.display = 'block';
  preview.innerHTML = html;
}

// === Add Entry ===
function addEntry() {
  const amtInput = document.getElementById('inputAmount');
  const rateInput = document.getElementById('inputRate');
  const num = currentNumberStr;
  const amt = parseInt(amtInput.value);
  const customRate = parseFloat(rateInput ? rateInput.value : NaN);
  const digits = getSelectedDigits() || 3;

  if (num.length !== digits) {
    shakeElement(document.getElementById('numberBoxes'));
    return;
  }
  if (!amt || amt < 1) {
    shakeElement(amtInput);
    return;
  }

  let totalAdded = 0;
  const addedKeys = new Set(); // Track "sectionId:number" to prevent duplicates

  // Add to ALL selected types
  selectedTypes.forEach(type => {
    const config = BET_TYPE_CONFIG[type];

    if (config.reverse) {
      const perms = getPermutations(num);
      // Add permutations to ALL target sections
      config.sections.forEach(secId => {
        const sec = SECTIONS.find(s => s.id === secId);
        perms.forEach(p => {
          const key = `${secId}:${p}`;
          if (addedKeys.has(key)) return; // Skip duplicate
          addedKeys.add(key);
          data[secId].push({
            number: p,
            amount: amt,
            rate: isNaN(customRate) ? sec.rate : customRate,
            fromReverse: num,
          });
          totalAdded++;
        });
      });
    } else {
      const secId = config.sections[0];
      const key = `${secId}:${num}`;
      if (!addedKeys.has(key)) {
        addedKeys.add(key);
        const sec = SECTIONS.find(s => s.id === secId);
        data[secId].push({
          number: num,
          amount: amt,
          rate: isNaN(customRate) ? sec.rate : customRate,
        });
        totalAdded++;
      }
    }
  });

  saveData();
  render();

  // Show added feedback
  showAddedFeedback(totalAdded);

  // Reset inputs
  currentNumberStr = '';
  updateNumberDisplay();
  if (amtInput) amtInput.value = '';
  if (rateInput) rateInput.value = '';
  const amtArea = document.getElementById('amountEntryArea');
  if (amtArea) amtArea.style.display = 'none';

  // Hide reverse preview
  const preview = document.getElementById('reversePreview');
  preview.style.display = 'none';
  preview.innerHTML = '';
}

// Brief green flash feedback
function showAddedFeedback(count) {
  const btn = document.querySelector('.btn-gold-action');
  if (!btn) return;
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i class="bi bi-check-lg"></i> +${count}`;
  btn.style.background = 'linear-gradient(180deg, #28a745 0%, #1b7a34 100%)';
  btn.style.borderColor = '#1b7a34';
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.background = '';
    btn.style.borderColor = '';
  }, 600);
}

// Shake animation for invalid input
function shakeElement(el) {
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 500);
}

// === Render ===
function render() {
  const wrap = document.getElementById('sectionsWrap');
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

      let rowBgClass = '';
      if (sec.id === 'three_top' && currentRate === 900) rowBgClass = 'white-bg';
      else if (sec.id === 'three_tod' && currentRate === 150) rowBgClass = 'white-bg';
      else if (sec.id === 'two_top' && currentRate === 90) rowBgClass = 'white-bg';
      else if (sec.id === 'two_bot' && currentRate === 90) rowBgClass = 'white-bg';

      html += `
      <div class="entry-row ${rowBgClass}">
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

// === Event Listeners ===
document.addEventListener('DOMContentLoaded', () => {
  const numInput = document.getElementById('inputNumber');
  const amtInput = document.getElementById('inputAmount');

  // Live reverse preview
  numInput.addEventListener('input', () => {
    showPreview();
  });

  // Enter key support
  numInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      amtInput.focus();
    }
  });

  amtInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addEntry();
    }
  });

  // Initial UI update
  updateUI();
  render();
});
