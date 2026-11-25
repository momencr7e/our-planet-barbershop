// ==========================================================
// Our Planet Barbershop — app.js
// ضع بيانات Supabase هنا بعد إنشاء المشروع.
// لحد ما تتضبط، الموقع شغال في وضع معاينة وبيحفظ الطلبات على المتصفح ده بس.
// ==========================================================
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const supabaseClient = (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// ---------- Data ----------
const services = [
  {id:"haircut",   name:"حلاقة شعر عادية",     category:"HAIR",  duration:30, price:250},
  {id:"skin-fade", name:"Skin Fade / تدريج",   category:"HAIR",  duration:40, price:300},
  {id:"scissors",  name:"حلاقة بالمقص",        category:"HAIR",  duration:30, price:250},
  {id:"kids",      name:"حلاقة أطفال",         category:"HAIR",  duration:30, price:200},
  {id:"wash",      name:"غسيل شعر",            category:"HAIR",  duration:10, price:80},
  {id:"styling",   name:"تصفيف وتسريح",        category:"HAIR",  duration:15, price:100},
  {id:"beard-line",name:"تحديد دقن",           category:"BEARD", duration:15, price:100},
  {id:"beard-full",name:"حلاقة دقن كاملة",     category:"BEARD", duration:20, price:150},
  {id:"beard-fade",name:"تدريج دقن",           category:"BEARD", duration:25, price:180},
  {id:"hair-beard",name:"تحديد شعر ودقن",      category:"BEARD", duration:20, price:150},
  {id:"facial",    name:"تنظيف بشرة",          category:"CARE",  duration:40, price:300},
  {id:"charcoal",  name:"ماسك فحم",            category:"CARE",  duration:20, price:150},
  {id:"moisture",  name:"تنظيف وترطيب الوجه",  category:"CARE",  duration:30, price:250},
  {id:"wax-face",  name:"واكس للوجه",          category:"CARE",  duration:15, price:120},
  {id:"dye",       name:"صبغة شعر",            category:"EXTRA", duration:45, price:500, starting:true},
  {id:"protein",   name:"بروتين / علاج شعر",   category:"EXTRA", duration:60, price:600, starting:true},
  {id:"wax",       name:"إزالة شعر بالواكس",   category:"EXTRA", duration:20, price:150}
];
const categories = [
  {id:"ALL",   label:"الكل"},
  {id:"HAIR",  label:"الشعر"},
  {id:"BEARD", label:"الدقن"},
  {id:"CARE",  label:"العناية بالبشرة"},
  {id:"EXTRA", label:"خدمات إضافية"}
];
const barbers = ["محمد","محمود","حسين","عمر"];

// Business hours: noon → 02:00 next day. Slot step in minutes.
const OPEN_HOUR = 12, CLOSE_HOUR_NEXT_DAY = 2, SLOT_STEP = 30;

// ---------- Helpers ----------
const $ = id => document.getElementById(id);
const money = n => `${n} ج.م`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad = n => String(n).padStart(2, "0");
const localDateString = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
// Convert Arabic-Indic / Persian digits to Latin and strip spaces/dashes.
const normalizeDigits = s => String(s)
  .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
  .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
  .replace(/[^\d]/g, "");
const selectedService = () => services.find(s => s.id === $("service-select").value);
const selectedSlot = () => document.querySelector('input[name="slot"]:checked');
const timeLabel = d => d.toLocaleTimeString("ar-EG", {hour:"numeric", minute:"2-digit", hour12:true});
const dateLabel = s => new Date(`${s}T12:00:00`).toLocaleDateString("ar-EG", {weekday:"long", day:"numeric", month:"long"});

function scrollToBooking(focusId){
  $("booking").scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
  if (focusId) setTimeout(() => $(focusId)?.focus({preventScroll:true}), 600);
}

// ---------- Render ----------
function renderFilters(){
  $("service-filters").innerHTML = categories.map((c, i) =>
    `<button type="button" class="filter-btn" role="tab" data-cat="${c.id}" aria-selected="${i===0}">${c.label}</button>`
  ).join("");
  $("service-filters").addEventListener("click", e => {
    const btn = e.target.closest(".filter-btn"); if (!btn) return;
    document.querySelectorAll(".filter-btn").forEach(b => b.setAttribute("aria-selected", b === btn));
    renderServices(btn.dataset.cat);
  });
}

function renderServices(cat = "ALL"){
  const list = cat === "ALL" ? services : services.filter(s => s.category === cat);
  $("service-grid").innerHTML = list.map((s, i) => `
    <button type="button" class="service-card" data-service="${s.id}" style="animation-delay:${i*35}ms" aria-label="احجز ${esc(s.name)}">
      <span class="book-hint">احجز ←</span>
      <div><span class="category">${s.category}</span><h3>${esc(s.name)}</h3></div>
      <div class="bottom"><span>${s.duration} دقيقة</span><strong>${s.starting ? "<small>يبدأ من </small>" : ""}${money(s.price)}</strong></div>
    </button>`).join("");
}

function renderCatalog(){
  renderFilters();
  renderServices();

  $("barber-grid").innerHTML = barbers.map(b => `
    <button type="button" class="barber-card" data-barber="${esc(b)}" aria-label="احجز مع ${esc(b)}">
      <div class="barber-avatar" aria-hidden="true">${esc(b.charAt(0))}</div>
      <h3>${esc(b)}</h3>
      <p>Barber Specialist</p>
      <span class="pick">احجز معاه</span>
    </button>`).join("");

  $("service-select").innerHTML = `<option value="">اختار الخدمة</option>` + categories.slice(1).map(c =>
    `<optgroup label="${c.label}">` + services.filter(s => s.category === c.id).map(s =>
      `<option value="${s.id}">${esc(s.name)} — ${s.starting ? "يبدأ من " : ""}${money(s.price)} (${s.duration} د)</option>`
    ).join("") + `</optgroup>`
  ).join("");

  $("barber-select").innerHTML = `<option value="">اختار الحلاق</option>` +
    barbers.map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join("");

  // Clicking a card pre-fills the form.
  $("service-grid").addEventListener("click", e => {
    const card = e.target.closest(".service-card"); if (!card) return;
    $("service-select").value = card.dataset.service;
    onFormChange();
    scrollToBooking($("barber-select").value ? "booking-date" : "barber-select");
  });
  $("barber-grid").addEventListener("click", e => {
    const card = e.target.closest(".barber-card"); if (!card) return;
    $("barber-select").value = card.dataset.barber;
    onFormChange();
    scrollToBooking($("service-select").value ? "booking-date" : "service-select");
  });
}

// ---------- Slots ----------
function buildSlots(){
  const date = $("booking-date").value, barber = $("barber-select").value, service = selectedService();
  const box = $("time-slots"), hint = $("slot-hint");
  const prev = selectedSlot()?.value;
  box.innerHTML = "";

  if (!date || !barber || !service){
    hint.textContent = "اختار الخدمة والحلاق والتاريخ عشان تظهر المواعيد.";
    return;
  }

  const start = new Date(`${date}T${pad(OPEN_HOUR)}:00:00`);
  const close = new Date(start); close.setDate(close.getDate() + 1); close.setHours(CLOSE_HOUR_NEXT_DAY, 0, 0, 0);
  const now = new Date();
  let html = "", count = 0;

  for (let t = new Date(start); t < close; t.setMinutes(t.getMinutes() + SLOT_STEP)){
    const finish = new Date(t.getTime() + service.duration * 60000);
    if (finish > close || t <= now) continue;
    const value = `${localDateString(t)}T${pad(t.getHours())}:${pad(t.getMinutes())}:00`;
    html += `<label class="slot"><input type="radio" name="slot" value="${value}" ${value===prev?"checked":""}><span>${timeLabel(t)}</span></label>`;
    count++;
  }
  box.innerHTML = html;

  if (!count){
    hint.textContent = "مفيش مواعيد متاحة في اليوم ده. جرّب يوم تاني.";
  } else if (supabaseClient){
    hint.textContent = `${count} موعد متاح — الموعد بيتأكد نهائيًا لحظة تأكيد الحجز.`;
  } else {
    hint.textContent = `وضع معاينة: ${count} موعد تجريبي. الحجز الحقيقي بيتفعّل بعد ربط قاعدة البيانات.`;
  }
}

// ---------- Summary ----------
function renderSummary(){
  const s = selectedService(), barber = $("barber-select").value, date = $("booking-date").value, slot = selectedSlot();
  const box = $("booking-summary");
  if (!s){ box.hidden = true; return; }
  const rows = [
    ["الخدمة", esc(s.name)],
    barber ? ["الحلاق", esc(barber)] : null,
    date ? ["اليوم", dateLabel(date)] : null,
    slot ? ["الساعة", timeLabel(new Date(slot.value))] : null,
    ["المدة", `${s.duration} دقيقة`]
  ].filter(Boolean);
  box.innerHTML = rows.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("") +
    `<div class="total"><span>الإجمالي ${s.starting ? "(يبدأ من)" : ""}</span><b>${money(s.price)}</b></div>`;
  box.hidden = false;
}

function onFormChange(){ buildSlots(); renderSummary(); }

// ---------- Submit ----------
function setMessage(type, text){ const m = $("booking-message"); m.className = type; m.textContent = text; }

function validate(){
  const fields = {
    "service-select": !!selectedService(),
    "barber-select": !!$("barber-select").value,
    "booking-date": !!$("booking-date").value,
    "customer-name": $("customer-name").value.trim().length >= 2,
    "customer-phone": /^01[0125]\d{8}$/.test(normalizeDigits($("customer-phone").value))
  };
  Object.entries(fields).forEach(([id, ok]) => $(id).classList.toggle("invalid", !ok));
  if (!fields["customer-phone"] && $("customer-phone").value) return "رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015.";
  if (Object.values(fields).some(ok => !ok)) return "من فضلك كمّل البيانات المطلوبة.";
  if (!selectedSlot()) return "اختار الوقت المناسب ليك.";
  return "";
}

async function submitBooking(e){
  e.preventDefault();
  setMessage("", "");
  const problem = validate();
  if (problem){
    setMessage("error", problem);
    document.querySelector("#booking-form .invalid")?.focus();
    return;
  }

  const service = selectedService(), barber = $("barber-select").value, date = $("booking-date").value;
  const time = selectedSlot().value;
  const name = $("customer-name").value.trim(), phone = normalizeDigits($("customer-phone").value);
  const startsAt = new Date(time);

  if (!supabaseClient){
    try {
      const booking = {id:"DEMO-"+Date.now(), name, phone, barber, service:service.name, date, time, price:service.price, status:"demo_only"};
      const list = JSON.parse(localStorage.getItem("ourplanet_demo_bookings") || "[]");
      list.push(booking);
      localStorage.setItem("ourplanet_demo_bookings", JSON.stringify(list));
    } catch (_) { /* storage unavailable — ignore in demo */ }
    setMessage("info", "ده طلب تجريبي اتحفظ على المتصفح ده بس، ومش حجز مؤكد عند المحل. الحجوزات الحقيقية بتشتغل بعد ربط قاعدة البيانات.");
    return;
  }

  const btn = $("submit-booking");
  btn.disabled = true; btn.textContent = "جارٍ تأكيد الحجز...";
  try {
    const {data, error} = await supabaseClient.rpc("create_booking", {
      p_customer_name: name, p_customer_phone: phone, p_barber_name: barber,
      p_service_code: service.id, p_starts_at: startsAt.toISOString(), p_payment_method: "pay_at_shop"
    });
    if (error) throw error;
    setMessage("success", `تم الحجز بنجاح ✓ رقم الحجز: ${data.booking_code} — ${service.name} مع ${barber}، ${dateLabel(date)} الساعة ${timeLabel(startsAt)}. الدفع في المحل.`);
    $("booking-form").reset();
    $("booking-date").value = localDateString(new Date());
    onFormChange();
  } catch (err){
    setMessage("error", err.message || "معرفناش نكمّل الحجز. جرّب موعد تاني أو كلّمنا على 010 60775666.");
  } finally {
    btn.disabled = false; btn.textContent = "تأكيد الحجز";
  }
}

// ---------- UI: header, menu, reveal ----------
function initUI(){
  const topbar = $("topbar"), nav = $("main-nav"), toggle = $("menu-toggle");

  const onScroll = () => topbar.classList.toggle("scrolled", window.scrollY > 10);
  onScroll(); window.addEventListener("scroll", onScroll, {passive:true});

  const closeMenu = () => { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "فتح القائمة"); };
  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "قفل القائمة" : "فتح القائمة");
  });
  nav.addEventListener("click", e => { if (e.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

  if (!("IntersectionObserver" in window)) return;

  // Highlight current section in the nav.
  const links = [...nav.querySelectorAll("a")];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${en.target.id}`));
    });
  }, {rootMargin:"-45% 0px -50% 0px"});
  ["services","team","booking","contact"].forEach(id => spy.observe($(id)));

  // Hide the floating mobile CTA while the booking form is on screen.
  const mobileBook = $("mobile-book");
  const updateMobileBook = () => {
    const r = $("booking").getBoundingClientRect();
    const onBooking = r.top < innerHeight * .85 && r.bottom > 0;
    mobileBook.classList.toggle("hide", window.scrollY < 300 || onBooking);
  };
  updateMobileBook();
  window.addEventListener("scroll", updateMobileBook, {passive:true});

  // Reveal sections on scroll.
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting){ en.target.classList.add("in"); reveal.unobserve(en.target); } });
  }, {threshold:.12});
  document.querySelectorAll(".section-heading, .booking-intro, .booking-card, .contact-section > div").forEach(el => {
    el.classList.add("reveal"); reveal.observe(el);
  });
}

// ---------- Init ----------
function init(){
  renderCatalog();
  initUI();
  $("year").textContent = new Date().getFullYear();

  const today = localDateString(new Date());
  $("booking-date").min = today;
  $("booking-date").value = today;

  ["service-select","barber-select","booking-date"].forEach(id => $(id).addEventListener("change", onFormChange));
  $("time-slots").addEventListener("change", renderSummary);
  ["customer-name","customer-phone","service-select","barber-select","booking-date"].forEach(id =>
    $(id).addEventListener("input", () => $(id).classList.remove("invalid")));
  $("customer-phone").addEventListener("blur", e => { e.target.value = normalizeDigits(e.target.value).slice(0, 11); });
  $("booking-form").addEventListener("submit", submitBooking);

  onFormChange();
}

init();
