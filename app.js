const $ = (sel) => document.querySelector(sel);
const ROWS = 14;

// Format helpers
function formatDateISO(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function formatDateShort(d){
  return d.toLocaleDateString(undefined, { month:"short", day:"2-digit", year:"numeric" });
}

function dayName(d){
  return d.toLocaleDateString(undefined, { weekday:"long" });
}

// 🔹 NEW: 24h → 12h time formatter
function formatTime12h(timeStr){
  if(!timeStr) return "";
  let [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12;
  if(h === 0) h = 12;
  return `${h}:${m.toString().padStart(2,"0")} ${ampm}`;
}

function parseTimeToMinutes(timeStr){
  if(!timeStr) return null;
  const [hh, mm] = timeStr.split(":").map(Number);
  if(Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh*60 + mm;
}

function minutesDiff(startMin, endMin){
  if(startMin == null || endMin == null) return 0;
  let diff = endMin - startMin;
  if(diff < 0) diff += 24*60;
  return diff;
}

function round2(n){ return Math.round(n*100)/100; }

function anyHoursEntered(){
  const inputs = $("#tableBody").querySelectorAll('input[type="time"], input[type="text"]');
  for(const inp of inputs){
    if((inp.value || "").trim() !== "") return true;
  }
  return false;
}

// Build rows
function buildRowsFromWeekStarting(){
  const weekStr = $("#weekStarting").value;

  if(!weekStr){
    $("#tableBody").innerHTML = `
      <tr><td colspan="8" style="text-align:center; padding:16px;">
        Please select <strong>Week Starting</strong> to generate the dates.
      </td></tr>
    `;
    $("#grandTotal").textContent = "0.00";
    $("#grandTotal2").textContent = "0.00";
    return;
  }

  const startDate = new Date(weekStr + "T00:00:00");
  const body = $("#tableBody");
  body.innerHTML = "";

  for(let i=0;i<ROWS;i++){
    if(i===0){
      body.insertAdjacentHTML("beforeend", `<tr class="week-divider"><td colspan="8">Week 1</td></tr>`);
    }
    if(i===7){
      body.insertAdjacentHTML("beforeend", `<tr class="week-divider"><td colspan="8">Week 2</td></tr>`);
    }

    const d = new Date(startDate);
    d.setDate(d.getDate()+i);

    body.insertAdjacentHTML("beforeend", `
      <tr>
        <td class="center">
          <div class="dateText">${formatDateShort(d)}</div>
          <input type="hidden" value="${formatDateISO(d)}">
        </td>
        <td class="center">${dayName(d)}</td>

        <td><input type="time" data-role="in1"><span class="print-value" data-role="p_in1"></span></td>
        <td><input type="time" data-role="out1"><span class="print-value" data-role="p_out1"></span></td>
        <td><input type="time" data-role="in2"><span class="print-value" data-role="p_in2"></span></td>
        <td><input type="time" data-role="out2"><span class="print-value" data-role="p_out2"></span></td>

        <td class="total-cell"><span data-role="dayTotal">0.00</span></td>
        <td><input type="text" data-role="notes"><span class="print-value" data-role="p_notes"></span></td>
      </tr>
    `);
  }

  body.querySelectorAll("input").forEach(inp => inp.addEventListener("input", recalcAll));
  recalcAll();
}

function computeRowHours(tr){
  const in1 = parseTimeToMinutes(tr.querySelector('[data-role="in1"]').value);
  const out1 = parseTimeToMinutes(tr.querySelector('[data-role="out1"]').value);
  const in2 = parseTimeToMinutes(tr.querySelector('[data-role="in2"]').value);
  const out2 = parseTimeToMinutes(tr.querySelector('[data-role="out2"]').value);
  return round2((minutesDiff(in1,out1) + minutesDiff(in2,out2)) / 60);
}

function recalcAll(){
  let grand = 0;
  $("#tableBody").querySelectorAll("tr").forEach(tr => {
    if(tr.classList.contains("week-divider")) return;
    if(!tr.querySelector('[data-role="in1"]')) return;
    const hrs = computeRowHours(tr);
    tr.querySelector('[data-role="dayTotal"]').textContent = hrs.toFixed(2);
    grand += hrs;
  });
  grand = round2(grand);
  $("#grandTotal").textContent = grand.toFixed(2);
  $("#grandTotal2").textContent = grand.toFixed(2);
}

// 🔹 UPDATED PRINT VALUES (12-hour format)
function fillPrintValues(){
  ["employeeName","employeeTitle","weekStarting"].forEach(id => {
    const inp = document.getElementById(id);
    const span = document.querySelector(`[data-print-for="${id}"]`);
    if(span) span.textContent = inp.value || "";
  });

  $("#tableBody").querySelectorAll("tr").forEach(tr => {
    if(tr.classList.contains("week-divider")) return;
    if(!tr.querySelector('[data-role="in1"]')) return;

    tr.querySelector('[data-role="p_in1"]').textContent = formatTime12h(tr.querySelector('[data-role="in1"]').value);
    tr.querySelector('[data-role="p_out1"]').textContent = formatTime12h(tr.querySelector('[data-role="out1"]').value);
    tr.querySelector('[data-role="p_in2"]').textContent = formatTime12h(tr.querySelector('[data-role="in2"]').value);
    tr.querySelector('[data-role="p_out2"]').textContent = formatTime12h(tr.querySelector('[data-role="out2"]').value);
    tr.querySelector('[data-role="p_notes"]').textContent = tr.querySelector('[data-role="notes"]').value || "";
  });

  recalcAll();
}

function init(){
  $("#weekStarting").value = "";
  buildRowsFromWeekStarting();

  $("#weekStarting").addEventListener("change", () => {
    if(anyHoursEntered() && !confirm("Changing Week Starting will clear current entries. Continue?")) return;
    buildRowsFromWeekStarting();
  });

  $("#btnPrint").addEventListener("click", () => {
    fillPrintValues();
    window.print();
  });

  $("#btnClear").addEventListener("click", () => {
    if(confirm("Clear all entries?")){
      $("#employeeName").value = "";
      $("#employeeTitle").value = "";
      buildRowsFromWeekStarting();
    }
  });

  window.addEventListener("beforeprint", fillPrintValues);
}

document.addEventListener("DOMContentLoaded", init);
