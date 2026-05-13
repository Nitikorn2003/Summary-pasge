// === Data & Config (shared with index page via localStorage) ===
const SECTIONS = [
  { id: 'three_top', title: 'สามตัวบน',   digits: 3, rate: 800, color: 'green', rowClass: 'bg-top-3' },
  { id: 'three_tod', title: 'สามตัวโต๊ด', digits: 3, rate: 100, color: 'orange', rowClass: 'bg-tod-3' },
  { id: 'two_top',   title: 'สองตัวบน',   digits: 2, rate: 80,  color: 'green', rowClass: 'bg-top-2' },
  { id: 'two_bot',   title: 'สองตัวล่าง', digits: 2, rate: 80,  color: 'orange', rowClass: 'bg-bot-2' },
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
let selectedTypes = new Set(['three_top']);
let currentNumberStr = '';

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

// === Bet Type Selection (Multi-Select Toggle) ===
function toggleBetType(type) {
  if (selectedTypes.has(type)) {
    if (selectedTypes.size > 1) {
      selectedTypes.delete(type);
    }
  } else {
    const newDigits = BET_TYPE_CONFIG[type].digits;
    const currentDigits = getSelectedDigits();

    if (currentDigits !== null && currentDigits !== newDigits) {
      selectedTypes.clear();
      currentNumberStr = '';
    }

    // Exclusion logic: 3ตัวกลับ and 3ตัวโต๊ด cannot be together
    if (type === 'three_tod' && selectedTypes.has('three_reverse')) {
      selectedTypes.delete('three_reverse');
    } else if (type === 'three_reverse' && selectedTypes.has('three_tod')) {
      selectedTypes.delete('three_tod');
    }

    selectedTypes.add(type);
  }

  updateUI();
}

function getSelectedDigits() {
  for (const t of selectedTypes) {
    return BET_TYPE_CONFIG[t].digits;
  }
  return null;
}

function updateUI() {
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

    // Auto-save when digits are full
    if (currentNumberStr.length === digits) {
      setTimeout(() => {
        addEntry();
      }, 100); // Small delay for visual feedback
    }
  }
}

function numpadDelete() {
  if (currentNumberStr.length > 0) {
    currentNumberStr = currentNumberStr.slice(0, -1);
    updateNumberDisplay();
  }
}

function numpadClearAll() {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.style.display = 'flex';
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.style.display = 'none';
}

function confirmClearAll() {
  currentNumberStr = '';
  // Clear all entries in the data object
  SECTIONS.forEach(s => { data[s.id] = []; });
  saveData();
  updateUI();
  renderSidebar();
  closeConfirmModal();
}

// Show selected types as tags
function updateSelectedTags() {
  const container = document.getElementById('selectedTags');
  if (!container) return;
  container.innerHTML = '';
  
  // Also update a label above the number boxes for better context
  const contextLabel = document.querySelector('.number-input-context');
  let labelText = '';

  selectedTypes.forEach(type => {
    const config = BET_TYPE_CONFIG[type];
    const isReverse = config.reverse;
    const colorClass = config.digits === 2 ? 'bg-blue' : 'bg-red';
    
    const tag = document.createElement('span');
    tag.className = `selected-tag ${colorClass} ${isReverse ? 'reverse-tag' : ''}`;
    tag.textContent = config.label;
    container.appendChild(tag);

    labelText += (labelText ? ' + ' : '') + config.label;
  });

  const displayLabel = document.getElementById('currentBetTypeLabel');
  if (displayLabel) {
    displayLabel.textContent = labelText || 'กรุณาเลือกประเภท';
  }
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

// === Show Full Preview ===
function showPreview() {
  const preview = document.getElementById('reversePreview');
  if (!preview) return;
  const val = currentNumberStr;
  const digits = getSelectedDigits() || 3;

  if (val.length === 0) {
    preview.style.display = 'none';
    preview.innerHTML = '';
    return;
  }

  // Create a version with placeholders for display
  const displayVal = val.padEnd(digits, '_');

  let html = '';
  let totalCount = 0;
  const previewKeys = new Set();

  selectedTypes.forEach(type => {
    const config = BET_TYPE_CONFIG[type];

    if (config.reverse) {
      // Only show permutations if the number is complete, otherwise show placeholder
      if (val.length === digits) {
        const perms = getPermutations(val);
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
                <span class="preview-section-label reverse-label">${escapeHTML(config.label)} → ${escapeHTML(sec.title)}</span>
                <div class="preview-nums-wrap">
                  ${uniquePerms.map(p => `<span class="preview-num reverse-num">${escapeHTML(p)}</span>`).join('')}
                </div>
              </div>`;
          }
        });
      } else {
        // Partial reverse preview
        html += `
          <div class="preview-group">
            <span class="preview-section-label reverse-label">${escapeHTML(config.label)}</span>
            <div class="preview-nums-wrap">
              <span class="preview-num reverse-num">${escapeHTML(displayVal)}</span>
              <span class="ms-2 text-muted" style="font-size: 10px;">(รอครบ ${digits} หลักเพื่อสลับเลข)</span>
            </div>
          </div>`;
      }
    } else {
      const secId = config.sections[0];
      const key = `${secId}:${displayVal}`;
      if (!previewKeys.has(key)) {
        previewKeys.add(key);
        totalCount += 1;
        html += `
          <div class="preview-group">
            <span class="preview-section-label">${escapeHTML(config.label)}</span>
            <div class="preview-nums-wrap">
              <span class="preview-num">${escapeHTML(displayVal)}</span>
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
  const rateInput = document.getElementById('inputRate');
  const num = currentNumberStr;
  const amt = 1; // Fixed default amount
  const customRate = parseFloat(rateInput ? rateInput.value : NaN);
  const digits = getSelectedDigits() || 3;

  if (num.length !== digits) {
    shakeElement(document.getElementById('numberBoxes'));
    return;
  }

  let totalAdded = 0;
  const addedKeys = new Set();

  selectedTypes.forEach(type => {
    const config = BET_TYPE_CONFIG[type];

    if (config.reverse) {
      const perms = getPermutations(num);
      config.sections.forEach(secId => {
        const sec = SECTIONS.find(s => s.id === secId);
        perms.forEach(p => {
          const key = `${secId}:${p}`;
          if (addedKeys.has(key)) return;
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

  // Show added feedback
  showAddedFeedback(totalAdded);

  // Reset inputs
  currentNumberStr = '';
  updateNumberDisplay();
  if (rateInput) rateInput.value = '';

  // Show success feedback in preview area instead of just hiding it
  const preview = document.getElementById('reversePreview');
  if (preview) {
    preview.innerHTML = `
      <div class="p-2 text-center text-success fw-bold" style="background: rgba(40, 167, 69, 0.1); border-radius: 4px;">
        <i class="bi bi-check-circle-fill"></i> บันทึกสำเร็จ: ${num}
      </div>`;
    preview.style.display = 'block';
    // Clear after a moment or when user starts typing again
    setTimeout(() => {
      if (currentNumberStr === '') {
        preview.style.display = 'none';
        preview.innerHTML = '';
      }
    }, 1500);
  }

  // Refresh Sidebar instead of redirecting
  renderSidebar();
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

// Render sidebar list
function renderSidebar() {
  const listEl = document.getElementById('sidebarList');
  const countEl = document.getElementById('sidebarCount');
  if (!listEl) return;

  listEl.innerHTML = '';
  let totalCount = 0;

  SECTIONS.forEach(sec => {
    const entries = data[sec.id];
    if (entries.length === 0) return;

    // Header for group
    const header = document.createElement('div');
    header.className = 'sidebar-group-header';
    header.textContent = sec.title;
    listEl.appendChild(header);

    entries.forEach((entry, idx) => {
      totalCount++;
      const item = document.createElement('div');
      item.className = 'sidebar-entry';
      item.innerHTML = `
        <div class="d-flex flex-column">
          <span class="sidebar-num">${escapeHTML(entry.number)}</span>
          <span class="sidebar-meta">${entry.amount}฿ x${entry.rate}</span>
        </div>
        <button class="btn btn-sm text-danger p-0 border-0" onclick="deleteSidebarEntry('${sec.id}', ${idx})" style="font-size: 16px;">
          <i class="bi bi-x-circle-fill"></i>
        </button>
      `;
      listEl.appendChild(item);
    });
  });

  if (countEl) countEl.textContent = totalCount + ' รายการ';
}

function deleteSidebarEntry(sectionId, index) {
  if (data[sectionId]) {
    data[sectionId].splice(index, 1);
    saveData();
    renderSidebar();
  }
}

// Shake animation for invalid input
function shakeElement(el) {
  if (!el) return;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 500);
}

// === Event Listeners ===
// === Keyboard Support ===
document.addEventListener('keydown', (e) => {
  // If we're typing in an input field (like rate), don't use global numpad logic
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const key = e.key;

  if (key >= '0' && key <= '9') {
    numpadPress(key);
  } else if (key === 'Backspace') {
    numpadDelete();
  } else if (key === 'Enter') {
    // If digits are full, addEntry will be called by numpadPress already
    // but we can call it here too for safety or manual confirm
    addEntry();
  } else if (key === 'Escape' || key === 'Delete') {
    numpadClearAll();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Initial UI update
  updateUI();
  renderSidebar();
});
