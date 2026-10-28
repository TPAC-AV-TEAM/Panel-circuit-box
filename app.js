// 全域設定與狀態
const CONFIG = {
    STORAGE_KEY: 'avAliases',
    MAX_SUGGESTIONS: 15,
    HALL_MAP: {
        '大劇院': { name: 'GT 大劇院', color: '#FF3B30' },
        '多形式中劇院': { name: 'BB 藍盒子', color: '#5AC8FA' },
        '鏡框式中劇院': { name: 'GP 球劇場', color: '#34C759' },
        '偶劇院': { name: 'PT 偶劇院', color: '#FF9F0A' },
        '排練室': { name: '排練室', color: '#64D2FF' },
        '屋頂劇場': { name: 'RT 屋頂劇場', color: '#BF5AF2' },
        '公共區域': { name: '公共區域', color: '#8E8E93' },
        '卸貨口與外部空間': { name: '外部空間', color: '#636366' },
    },
    DEFAULT_ALIASES: {
        'POWER 1,8 kW 1-PHASE': 'Power 15A / H插座',
        '對講系統-RJ-45': '對講-RJ45',
        '網路-RJ-45': '網路-RJ45',
        '視訊系統-BNC': '視訊-BNC',
        '連接線': '音頻-T/L',
    }
};

let userAliases = { ...CONFIG.DEFAULT_ALIASES, ...JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '{}') };
const searchInput = document.getElementById('searchInput');
const suggestions = document.getElementById('suggestions');
const resultArea = document.getElementById('resultArea');
const placeholderContainer = document.getElementById('placeholderContainer');

// 資料預先分組處理 (以 ID 為群組)
const groupedDB = RAW_DB.reduce((acc, curr) => {
    if (!acc[curr.id]) acc[curr.id] = { id: curr.id, hall: curr.hall, loc: curr.loc, items: [] };
    acc[curr.id].items.push(curr);
    return acc;
}, {});
const uniqueBoxes = Object.values(groupedDB);

// 監聽搜尋輸入
searchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    if (!val) {
        suggestions.style.display = 'none';
        return;
    }
    
    // 模糊比對 ID, Hall 或 Loc
    const matches = uniqueBoxes.filter(box => 
        box.id.toLowerCase().includes(val) || 
        box.hall.includes(val) || 
        box.loc.includes(val)
    ).slice(0, CONFIG.MAX_SUGGESTIONS);

    renderSuggestions(matches);
});

// 渲染下拉建議清單
function renderSuggestions(matches) {
    if (matches.length === 0) {
        suggestions.style.display = 'none';
        return;
    }
    suggestions.innerHTML = matches.map(box => `
        <div class="sug-item" onclick="renderResult('${box.id}')">
            <div class="sug-header">
                <strong>${box.id}</strong>
                <span class="sug-hall" style="background:${(CONFIG.HALL_MAP[box.hall] || {}).color || '#8E8E93'}20; color:${(CONFIG.HALL_MAP[box.hall] || {}).color || '#fff'}">${box.hall}</span>
            </div>
            <div class="sug-loc">${box.loc}</div>
        </div>
    `).join('');
    suggestions.style.display = 'block';
}

// 渲染主結果卡片
window.renderResult = function(id) {
    suggestions.style.display = 'none';
    placeholderContainer.style.display = 'none';
    resultArea.style.display = 'block';
    searchInput.value = id;

    const box = groupedDB[id];
    if(!box) return;

    let tableRows = box.items.map(item => {
        const sysName = userAliases[item.sys] || item.sys;
        const testData = (TEST_DB[id] && TEST_DB[id][item.sys]) || null;
        
        let testHtml = '';
        if (testData) {
            const passCount = testData.filter(t => t.ok).length;
            testHtml = `
                <div class="test-sum" onclick="this.classList.toggle('open'); this.nextElementSibling.classList.toggle('open')">
                    <div class="ts-head">
                        <span style="color:${passCount === testData.length ? 'var(--green)' : 'var(--blue)'}">Fluke 測試 (${passCount}/${testData.length})</span>
                        <span class="arrow">▼</span>
                    </div>
                </div>
                <div class="test-detail">
                    ${testData.map(t => `
                        <div class="test-line">
                            <div class="tl1">
                                <span style="color:${t.ok ? 'var(--green)' : '#FF3B30'}">${t.ok ? 'PASS' : 'FAIL'}</span>
                                ${t.n} <small>${t.len}m</small>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
        }

        return `
        <tr class="data-row">
            <td>
                <div class="sys-name">${sysName}</div>
                <div class="dest-info"><span class="dest-icon">↳</span> ${item.dest} ${item.room}</div>
                ${testHtml}
            </td>
            <td>
                <div class="rack-info">${item.rack}</div>
                <div class="dev-info">${item.dev}</div>
            </td>
            <td>${item.conn}</td>
            <td>${item.qty}</td>
        </tr>`;
    }).join('');

    resultArea.innerHTML = `
        <div class="card">
            <div class="tag">${box.hall}</div>
            <div class="id-label">${box.id}</div>
            <div style="color:var(--text-sub); font-size:14px; margin-top:8px;">${box.loc}</div>
            <hr class="divider">
            <table>
                <thead>
                    <tr><th>系統/目的地</th><th>機櫃/設備</th><th>接頭</th><th>數量</th></tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
    `;
}

// UI 輔助功能
document.getElementById('clearBtn').addEventListener('click', () => {
    searchInput.value = '';
    suggestions.style.display = 'none';
    resultArea.style.display = 'none';
    placeholderContainer.style.display = 'block';
});

// 設定面板邏輯
document.getElementById('settingBtn').addEventListener('click', () => {
    document.getElementById('settingsArea').style.display = 'block';
    renderSettings();
});
document.getElementById('closeSettingBtn').addEventListener('click', () => {
    document.getElementById('settingsArea').style.display = 'none';
});

function renderSettings() {
    const list = document.getElementById('aliasList');
    list.innerHTML = Object.keys(CONFIG.DEFAULT_ALIASES).map(key => `
        <div class="alias-row">
            <div class="alias-orig">${key}</div>
            <input type="text" data-key="${key}" value="${userAliases[key] || ''}">
        </div>
    `).join('');
}

document.getElementById('saveBtn').addEventListener('click', () => {
    const inputs = document.querySelectorAll('#aliasList input');
    inputs.forEach(input => {
        if(input.value.trim()) userAliases[input.dataset.key] = input.value.trim();
    });
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(userAliases));
    alert('設定已儲存');
    document.getElementById('settingsArea').style.display = 'none';
});