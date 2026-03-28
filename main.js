'use strict';

// ===== タブ切替 =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    // タブボタン切替
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // パネル切替＋リセット
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    const panel = document.getElementById('panel-' + target);
    if (panel) {
      panel.classList.add('active');
      resetPanel(panel);
    }
  });
});

// ===== パネルリセット =====
function resetPanel(panel) {
  // テキスト・数値入力をクリア
  panel.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => {
    el.value = '';
  });
  // セレクトを先頭に戻す
  panel.querySelectorAll('select').forEach(el => {
    el.selectedIndex = 0;
  });
  // チェックボックスをOFFに
  panel.querySelectorAll('input[type="checkbox"]').forEach(el => {
    el.checked = false;
  });
  // 条件付きエリアを非表示
  panel.querySelectorAll('.conditional-area').forEach(el => {
    el.classList.remove('visible');
  });
  // 追加された時間外申請行を削除（1行目は残す）
  panel.querySelectorAll('.overtime-rows').forEach(container => {
    const rows = container.querySelectorAll('.overtime-row');
    rows.forEach((row, i) => {
      if (i > 0) row.remove();
    });
    // 1行目の入力値もクリア
    if (rows[0]) {
      rows[0].querySelectorAll('input').forEach(el => el.value = '');
      rows[0].querySelectorAll('select').forEach(el => { el.selectedIndex = 0; });
    }
  });
  // コピーガイドを非表示
  panel.querySelectorAll('.copy-guide').forEach(el => el.classList.remove('visible'));
  // プレビュー更新
  updatePreview(panel);
  // コピーボタンリセット
  const copyBtn = panel.querySelector('.btn-copy');
  if (copyBtn) {
    copyBtn.textContent = 'コピー';
    copyBtn.classList.remove('copied');
  }
}

// ===== リアルタイムプレビュー =====
document.querySelectorAll('.tab-panel').forEach(panel => {
  panel.addEventListener('input', () => updatePreview(panel));
  panel.addEventListener('change', () => updatePreview(panel));
});

function updatePreview(panel) {
  const panelId = panel.id;
  let text = '';

  if (panelId === 'panel-admission') {
    text = generateAdmission(panel);
  } else if (panelId === 'panel-break') {
    text = generateBreak(panel);
  } else if (panelId === 'panel-timeout') {
    text = generateTimeout(panel);
  }

  const preview = panel.querySelector('.preview-text');
  if (preview) preview.textContent = text;

  validatePanel(panel);
}

// ===== バリデーション =====
function validatePanel(panel) {
  const copyBtn = panel.querySelector('.btn-copy');
  if (!copyBtn) return;

  let valid = true;
  panel.querySelectorAll('[data-required="true"]').forEach(el => {
    // 非表示の祖先を持つ場合はスキップ
    if (el.closest('.conditional-area') && !el.closest('.conditional-area').classList.contains('visible')) {
      return;
    }
    if (!el.value || el.value.trim() === '') {
      valid = false;
    }
  });

  const admNeedSelect = panel.querySelector('#tmt-admneed');
  const admNeedCount = panel.querySelector('#tmt-admneed-count');
  if (valid && admNeedSelect && admNeedSelect.value === 'yes') {
    const countValue = admNeedCount ? Number(admNeedCount.value) : 0;
    if (!admNeedCount || !admNeedCount.value || admNeedCount.value.trim() === '' || Number.isNaN(countValue) || countValue < 1) {
      valid = false;
    }
  }

  const overtimeSelect = panel.querySelector('#tmt-overtime');
  if (valid && overtimeSelect && overtimeSelect.value === 'yes') {
    panel.querySelectorAll('.overtime-row').forEach(row => {
      const role = row.querySelector('.ot-role');
      const name = row.querySelector('.ot-name');
      const until = row.querySelector('.ot-until');
      const reason = row.querySelector('.ot-reason');
      if (!role || !name || !until || !reason) return;

      if (!role.value.trim() || !name.value.trim() || !until.value.trim() || !reason.value.trim()) {
        valid = false;
      }
    });
  }

  copyBtn.disabled = !valid;
}

// ===== テキスト生成：入院テンプレート =====
function generateAdmission(panel) {
  const v = (id) => {
    const el = panel.querySelector('#' + id);
    return el ? el.value.trim() : '';
  };

  const lines = [];
  lines.push('【入院】');
  lines.push('診療科：' + v('adm-dept'));
  lines.push('主治医：' + v('adm-doctor'));
  lines.push('患者ID：' + v('adm-pid'));
  lines.push('患者名：' + v('adm-name'));
  lines.push('年齢：' + (v('adm-age') ? v('adm-age') + '歳' : ''));
  lines.push('病名：' + v('adm-diagnosis'));
  lines.push('主訴：' + v('adm-chief'));
  // 入院目的（その他の場合はフリーワード）
  const purposeSel = panel.querySelector('#adm-purpose');
  const purposeOther = panel.querySelector('#adm-purpose-other');
  if (purposeSel) {
    if (purposeSel.value === 'other') {
      lines.push('入院目的：' + (purposeOther ? purposeOther.value.trim() : ''));
    } else {
      lines.push('入院目的：' + purposeSel.value);
    }
  }

  // ADL（その他の場合はフリーワード）
  const adlSel = panel.querySelector('#adm-adl');
  const adlOther = panel.querySelector('#adm-adl-other');
  if (adlSel) {
    if (adlSel.value === 'other') {
      lines.push('ADL：' + (adlOther ? adlOther.value.trim() : ''));
    } else {
      lines.push('ADL：' + adlSel.value);
    }
  }

  // 認知機能
  const cogSelect = panel.querySelector('#adm-cognition');
  const cogDetail = panel.querySelector('#adm-cognition-detail');
  if (cogSelect) {
    const cogVal = cogSelect.value;
    if (cogVal === 'decline' && cogDetail && cogDetail.value.trim()) {
      lines.push('認知機能：低下あり（' + cogDetail.value.trim() + '）');
    } else if (cogVal === 'decline') {
      lines.push('認知機能：低下あり');
    } else if (cogVal === 'none') {
      lines.push('認知機能：低下なし');
    } else {
      lines.push('認知機能：');
    }
  }

  // 医療処置（チェックボックス）
  const checkedItems = [];
  panel.querySelectorAll('.proc-check:checked').forEach(cb => {
    checkedItems.push(cb.dataset.label);
  });
  const otherProc = panel.querySelector('#adm-proc-other-text');
  if (otherProc && otherProc.closest('.conditional-area').classList.contains('visible') && otherProc.value.trim()) {
    checkedItems.push(otherProc.value.trim());
  }
  if (checkedItems.length > 0) {
    lines.push('処置：' + checkedItems.join('・'));
  }

  // 任意項目
  if (v('adm-inputter')) lines.push('入力者：' + v('adm-inputter'));
  if (v('adm-note')) lines.push('備考：' + v('adm-note'));

  return lines.join('\n');
}

// ===== テキスト生成：昼休憩報告 =====
function generateBreak(panel) {
  const v = (id) => {
    const el = panel.querySelector('#' + id);
    return el ? el.value.trim() : '';
  };

  const aidSelect = panel.querySelector('#brk-aid');
  const aidVal = aidSelect ? aidSelect.value : '';
  const aidText = aidVal === 'needed'
    ? '応援が必要（師長へ連絡済み）'
    : aidVal === 'none' ? '応援不要' : '';

  const lines = [];
  lines.push('【昼休憩】14:30時点');
  lines.push('診療科・ブロック：' + v('brk-block'));
  lines.push('未休憩者：' + v('brk-staff'));
  lines.push('応援：' + aidText);

  return lines.join('\n');
}

// ===== テキスト生成：タイムアウト =====
function generateTimeout(panel) {
  const v = (id) => {
    const el = panel.querySelector('#' + id);
    return el ? el.value.trim() : '';
  };

  const admNeedSelect = panel.querySelector('#tmt-admneed');
  const admNeedVal = admNeedSelect ? admNeedSelect.value : '';

  const lines = [];
  lines.push('【タイムアウト】');
  lines.push('診療科：' + v('tmt-dept'));
  lines.push('医師：' + v('tmt-doctor'));
  lines.push('診察未：' + (v('tmt-remaining') ? v('tmt-remaining') + '名' : ''));
  lines.push('終了予定：' + v('tmt-endtime'));

  // 入院の必要な患者
  if (admNeedVal === 'yes') {
    const count = v('tmt-admneed-count');
    lines.push('入院の必要な患者：あり' + (count ? '　' + count + '名' : ''));
    // 患者ごとの行
    panel.querySelectorAll('.admneed-patient-row').forEach((row, i) => {
      const statusItems = [];
      row.querySelectorAll('.admneed-status:checked').forEach(cb => {
        statusItems.push(cb.dataset.label);
      });
      const otherChk = row.querySelector('.admneed-other-chk');
      const otherTxt = row.querySelector('.admneed-other-text');
      if (otherChk && otherChk.checked && otherTxt && otherTxt.value.trim()) {
        statusItems.push(otherTxt.value.trim());
      }
      lines.push('　患者' + (i + 1) + '：' + (statusItems.length > 0 ? statusItems.join('・') : '未選択'));
    });
  } else if (admNeedVal === 'no') {
    lines.push('入院の必要な患者：なし');
  } else {
    lines.push('入院の必要な患者：');
  }

  // 時間外申請
  const otSelect = panel.querySelector('#tmt-overtime');
  if (otSelect && otSelect.value === 'yes') {
    const rows = panel.querySelectorAll('.overtime-row');
    const otLines = [];
    rows.forEach(row => {
      const role  = row.querySelector('.ot-role')  ? row.querySelector('.ot-role').value.trim()  : '';
      const name  = row.querySelector('.ot-name')  ? row.querySelector('.ot-name').value.trim()  : '';
      const until = row.querySelector('.ot-until') ? row.querySelector('.ot-until').value.trim() : '';
      const reason= row.querySelector('.ot-reason')? row.querySelector('.ot-reason').value.trim(): '';
      if (role || name || until || reason) {
        otLines.push('　' + role + ' ' + name + '　' + until + 'まで　理由：' + reason);
      }
    });
    lines.push('時間外：あり');
    otLines.forEach(l => lines.push(l));
  } else {
    lines.push('時間外：なし');
  }

  return lines.join('\n');
}

// ===== コピー機能 =====
document.querySelectorAll('.btn-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const panel = btn.closest('.tab-panel');
    const preview = panel.querySelector('.preview-text');
    if (!preview) return;

    // 更新日時を冒頭に挿入
    const now = new Date();
    const dt = now.getFullYear() + '/'
      + String(now.getMonth() + 1).padStart(2, '0') + '/'
      + String(now.getDate()).padStart(2, '0') + ' '
      + String(now.getHours()).padStart(2, '0') + ':'
      + String(now.getMinutes()).padStart(2, '0');

    const rawText = preview.textContent;
    // 1行目（テンプレートヘッダー）の後に日時を挿入
    const firstNewline = rawText.indexOf('\n');
    const finalText = firstNewline >= 0
      ? rawText.slice(0, firstNewline + 1) + '更新日時：' + dt + '\n' + rawText.slice(firstNewline + 1)
      : rawText + '\n更新日時：' + dt;

    // クリップボードへコピー
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(finalText).then(() => {
        showCopySuccess(btn, panel);
      }).catch(() => {
        fallbackCopy(finalText, btn, panel);
      });
    } else {
      fallbackCopy(finalText, btn, panel);
    }
  });
});

function fallbackCopy(text, btn, panel) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showCopySuccess(btn, panel);
  } catch (e) {
    alert('コピーに失敗しました。テキストを手動で選択してコピーしてください。');
  }
  document.body.removeChild(ta);
}

function showCopySuccess(btn, panel) {
  btn.textContent = 'コピーしました ✓';
  btn.classList.add('copied');
  const guide = panel.querySelector('.copy-guide');
  if (guide) guide.classList.add('visible');

  setTimeout(() => {
    btn.textContent = 'コピー';
    btn.classList.remove('copied');
  }, 2000);
}

// ===== リセットボタン =====
document.querySelectorAll('.btn-reset').forEach(btn => {
  btn.addEventListener('click', () => {
    const panel = btn.closest('.tab-panel');
    if (panel) resetPanel(panel);
  });
});

// ===== 条件付き表示：認知機能（低下あり → 補足入力展開） =====
document.querySelectorAll('#adm-cognition').forEach(sel => {
  sel.addEventListener('change', () => {
    const area = sel.closest('.tab-panel').querySelector('#cognition-detail-area');
    if (!area) return;
    if (sel.value === 'decline') {
      area.classList.add('visible');
    } else {
      area.classList.remove('visible');
      const detail = area.querySelector('#adm-cognition-detail');
      if (detail) detail.value = '';
    }
  });
});

// ===== 条件付き表示：医療処置「その他」 =====
document.querySelectorAll('#adm-proc-other').forEach(cb => {
  cb.addEventListener('change', () => {
    const area = cb.closest('.tab-panel').querySelector('#proc-other-area');
    if (!area) return;
    if (cb.checked) {
      area.classList.add('visible');
    } else {
      area.classList.remove('visible');
      const txt = area.querySelector('#adm-proc-other-text');
      if (txt) txt.value = '';
    }
  });
});

// ===== 条件付き表示：昼休憩「応援が必要」 =====
document.querySelectorAll('#brk-aid').forEach(sel => {
  sel.addEventListener('change', () => {
    const area = sel.closest('.tab-panel').querySelector('#brk-aid-note');
    if (!area) return;
    area.classList.toggle('visible', sel.value === 'needed');
  });
});

// ===== 患者行HTMLを生成する関数 =====
function createPatientRow(idx) {
  const row = document.createElement('div');
  row.className = 'admneed-patient-row';
  row.innerHTML = `
    <div class="overtime-row-header">
      <span class="overtime-row-label">患者 ${idx}</span>
    </div>
    <div class="checkbox-group" style="margin-bottom:6px;">
      <label class="checkbox-item"><input type="checkbox" class="admneed-status" data-label="ベッドコントロールへ連絡済み">ベッドコントロールへ連絡済み</label>
      <label class="checkbox-item"><input type="checkbox" class="admneed-status" data-label="ベッドコントロールへ連絡中">ベッドコントロールへ連絡中</label>
      <label class="checkbox-item"><input type="checkbox" class="admneed-status" data-label="当直看護師長へ連絡済み">当直看護師長へ連絡済み</label>
      <label class="checkbox-item"><input type="checkbox" class="admneed-status" data-label="当直看護師長へ連絡中">当直看護師長へ連絡中</label>
      <label class="checkbox-item"><input type="checkbox" class="admneed-status" data-label="病棟の返事待ち">病棟の返事待ち</label>
      <label class="checkbox-item"><input type="checkbox" class="admneed-status" data-label="担当医の決定待ち">担当医の決定待ち</label>
      <label class="checkbox-item"><input type="checkbox" class="admneed-status" data-label="入院加療要否検討中">入院加療要否検討中</label>
      <label class="checkbox-item"><input type="checkbox" class="admneed-status" data-label="対応済み">対応済み</label>
      <label class="checkbox-item"><input type="checkbox" class="admneed-other-chk" data-label="その他">その他</label>
    </div>
    <div class="conditional-area admneed-other-area">
      <input type="text" class="admneed-other-text" placeholder="状況を入力">
    </div>
  `;
  // その他チェックボックスのイベント
  const otherChk = row.querySelector('.admneed-other-chk');
  const otherArea = row.querySelector('.admneed-other-area');
  otherChk.addEventListener('change', () => {
    otherArea.classList.toggle('visible', otherChk.checked);
    if (!otherChk.checked) row.querySelector('.admneed-other-text').value = '';
  });
  return row;
}

// ===== 条件付き表示：入院の必要な患者「あり」→サブ項目展開 =====
document.querySelectorAll('#tmt-admneed').forEach(sel => {
  sel.addEventListener('change', () => {
    const area = sel.closest('.tab-panel').querySelector('#admneed-detail-area');
    if (!area) return;
    area.classList.toggle('visible', sel.value === 'yes');
    if (sel.value !== 'yes') {
      const countEl = area.querySelector('#tmt-admneed-count');
      if (countEl) countEl.value = '';
      area.querySelector('.admneed-patient-rows').innerHTML = '';
    }
  });
});

// ===== 人数入力→患者行を動的生成 =====
document.querySelectorAll('#tmt-admneed-count').forEach(input => {
  input.addEventListener('input', () => {
    const panel = input.closest('.tab-panel');
    const container = panel.querySelector('.admneed-patient-rows');
    if (!container) return;
    const count = parseInt(input.value) || 0;
    const current = container.querySelectorAll('.admneed-patient-row').length;

    if (count > current) {
      for (let i = current + 1; i <= count; i++) {
        const row = createPatientRow(i);
        // 行にseparatorスタイルを付与
        row.style.cssText = 'background:#F8FAFC;border:1px solid #C8D6E5;border-radius:6px;padding:10px 12px;margin-bottom:10px;';
        container.appendChild(row);
        // プレビュー更新のためにイベント委譲
        row.querySelectorAll('input').forEach(el => {
          el.addEventListener('change', () => updatePreview(panel));
          el.addEventListener('input', () => updatePreview(panel));
        });
      }
    } else if (count < current) {
      const rows = container.querySelectorAll('.admneed-patient-row');
      for (let i = rows.length - 1; i >= count; i--) {
        rows[i].remove();
      }
    }
    updatePreview(panel);
  });
});

// ===== 条件付き表示：時間外申請「あり」 =====
document.querySelectorAll('#tmt-overtime').forEach(sel => {
  sel.addEventListener('change', () => {
    const area = sel.closest('.tab-panel').querySelector('#overtime-area');
    if (!area) return;
    area.classList.toggle('visible', sel.value === 'yes');
  });
});

// ===== 時間外申請行の追加 =====
document.querySelectorAll('.btn-add-row').forEach(btn => {
  btn.addEventListener('click', () => {
    const container = btn.closest('.tab-panel').querySelector('.overtime-rows');
    if (!container) return;
    const rows = container.querySelectorAll('.overtime-row');
    const newRow = rows[0].cloneNode(true);
    const idx = rows.length + 1;

    // ラベル更新
    const label = newRow.querySelector('.overtime-row-label');
    if (label) label.textContent = '申請者 ' + idx;

    // 入力値クリア
    newRow.querySelectorAll('input').forEach(el => el.value = '');
    newRow.querySelectorAll('select').forEach(el => { el.selectedIndex = 0; });

    // 削除ボタンを有効化（1行目は削除不可のため）
    const removeBtn = newRow.querySelector('.btn-remove-row');
    if (removeBtn) {
      removeBtn.style.display = 'inline-block';
      removeBtn.addEventListener('click', () => {
        newRow.remove();
        // ラベルを再採番
        container.querySelectorAll('.overtime-row').forEach((r, i) => {
          const l = r.querySelector('.overtime-row-label');
          if (l) l.textContent = '申請者 ' + (i + 1);
        });
        const panel = container.closest('.tab-panel');
        if (panel) updatePreview(panel);
      });
    }

    container.insertBefore(newRow, btn.parentElement ? null : undefined);
    container.appendChild(newRow);

    const panel = container.closest('.tab-panel');
    if (panel) updatePreview(panel);
  });
});

// 1行目の削除ボタンは非表示
document.querySelectorAll('.overtime-row').forEach((row, i) => {
  if (i === 0) {
    const removeBtn = row.querySelector('.btn-remove-row');
    if (removeBtn) removeBtn.style.display = 'none';
  }
});

// ===== 初期プレビュー更新 =====
document.querySelectorAll('.tab-panel.active').forEach(panel => {
  updatePreview(panel);
});

// ===== 条件付き表示：入院目的「その他」 =====
document.querySelectorAll('#adm-purpose').forEach(sel => {
  sel.addEventListener('change', () => {
    const area = sel.closest('.tab-panel').querySelector('#purpose-other-area');
    if (!area) return;
    if (sel.value === 'other') {
      area.classList.add('visible');
    } else {
      area.classList.remove('visible');
      const txt = area.querySelector('#adm-purpose-other');
      if (txt) txt.value = '';
    }
  });
});

// ===== 条件付き表示：ADL「その他」 =====
document.querySelectorAll('#adm-adl').forEach(sel => {
  sel.addEventListener('change', () => {
    const area = sel.closest('.tab-panel').querySelector('#adl-other-area');
    if (!area) return;
    if (sel.value === 'other') {
      area.classList.add('visible');
    } else {
      area.classList.remove('visible');
      const txt = area.querySelector('#adm-adl-other');
      if (txt) txt.value = '';
    }
  });
});
