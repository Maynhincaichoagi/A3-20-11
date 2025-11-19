/* ============================================
   TIM & HOA RƠI
============================================ */
function createHeart() {
    const h = document.createElement("div");
    h.classList.add("heart");
    h.style.left = Math.random()*100 + "vw";
    h.style.animationDuration = (3 + Math.random()*3) + "s";
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 6000);
}
function createFlower() {
    const f = document.createElement("div");
    f.classList.add("flower");
    f.style.left = Math.random()*100 + "vw";
    f.style.animationDuration = (3 + Math.random()*4) + "s";
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 6000);
}
setInterval(createHeart, 900);
setInterval(createFlower, 1300);

/* ============================================
   NHẠC
============================================ */
const music = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");
if (music && musicBtn) {
    musicBtn.onclick = () => music.paused ? music.play() : music.pause();
}

/* ============================================
   LƯU LỜI CHÚC – FIREBASE (THAY CHO localStorage)
============================================ */
const db = firebase.database();
let wishStorage = [];

// Lắng nghe realtime từ Firebase
db.ref("wishes").on("value", snap => {
    const arr = [];
    snap.forEach(child => {
        arr.push({ id: child.key, ...child.val() });
    });
    wishStorage = arr;

    const listPopup = document.getElementById("listPopup");
    if (listPopup && !listPopup.classList.contains("hidden")) {
        renderItems();
    }
});

function addWishToDB(obj) {
    return db.ref("wishes").push(obj);
}
function deleteWishFromDB(id) {
    return db.ref("wishes/" + id).remove();
}
function deleteAllWishesFromDB() {
    return db.ref("wishes").remove();
}

/* ============================================
   BOT TOXIC (STRICT)
============================================ */
function checkToxic(msg) {
    const text = msg.toLowerCase().trim();

    // lol/loll/l0ll → 'lồn'
    if (/l[\W_]*[o0óòôöø][\W_]*l[\W_]*l*/.test(text))
        return { level: 100, word: "lol / loll / l0ll" };

    // duma / đụ má / đu ma...
    if (/d[ưu][\W_]*ma/.test(text) || /đ[ụu][\W_]*m[aá]/.test(text))
        return { level: 100, word: "duma / đu ma / đụ má" };

    const strong = [
        "địt","lồn","buồi","cặc","đụ",
        "đm","dm","dmm","đmm","dcm","đcm",
        "đjt","djt","óc chó","óc lợn","óc bò",
        "cặc","cak","kak","mẹ mày","cmm"
    ];
    for (let w of strong)
        if (text.includes(w)) return { level: 100, word: w };

    const medium = ["ngu","đần","câm","khốn","láo","mất dạy","vô học","óc"];
    for (let w of medium)
        if (text.includes(w)) return { level: 60, word: w };

    const light = ["buồn","chán","stress","khó chịu","không vui"];
    for (let w of light)
        if (text.includes(w)) return { level: 30, word: w };

    return { level: 0, word: "" };
}

function isSpam(x) {
    x = x.toLowerCase().replace(/\s+/g,"");
    if (x.length < 2) return true;
    if (/^[0-9]+$/.test(x)) return true;
    if (/^([^\s])\1{3,}$/.test(x)) return true;
    if (/^[\W_]+$/.test(x)) return true;
    return false;
}

/* ============================================
   POPUP GỬI LỜI CHÚC
============================================ */
const popup       = document.getElementById("popup");
const openPopup   = document.getElementById("openPopup");
const cancelBtn   = document.getElementById("cancelBtn");
const sendBtn     = document.getElementById("sendBtn");
const resultBox   = document.getElementById("resultBox");
const closeResult = document.getElementById("closeResult");

if (openPopup) openPopup.onclick = () => popup.classList.remove("hidden");
if (cancelBtn) cancelBtn.onclick = () => popup.classList.add("hidden");

if (sendBtn) {
    sendBtn.onclick = () => {
        const nameInput = document.getElementById("nameInput");
        const wishInput = document.getElementById("wishInput");
        const name = nameInput.value.trim();
        const wish = wishInput.value.trim();

        if (!name || !wish) {
            alert("⚠ Vui lòng nhập đầy đủ tên và lời chúc!");
            return;
        }

        if (isSpam(wish)) {
            alert("⚠ Lời chúc quá ngắn hoặc không hợp lệ.");
            return;
        }

        const toxic = checkToxic(wish);

        if (toxic.level === 100) {
            alert(`❌ Lời chúc chứa từ ngữ không phù hợp (“${toxic.word}”). Không thể gửi!`);
            return;
        }
        if (toxic.level === 60) {
            alert(`❌ Lời chúc mang tính xúc phạm (“${toxic.word}”). Không được gửi!`);
            return;
        }
        if (toxic.level === 30) {
            alert("⚠ Lời chúc hơi tiêu cực nhưng vẫn hợp lệ. Mình vẫn gửi giúp bạn.");
        }

        const obj = {
            name,
            wish,
            toxicLevel: toxic.level,
            time: new Date().toLocaleString("vi-VN")
        };

        // Ghi lên Firebase
        addWishToDB(obj)
            .then(() => {
                const resultText = document.getElementById("resultText");
                resultText.innerHTML = `<b>${name}</b> gửi lời chúc:<br><br>“${wish}”`;

                popup.classList.add("hidden");
                resultBox.classList.remove("hidden");

                nameInput.value = "";
                wishInput.value = "";
            })
            .catch(err => {
                console.error("Firebase error:", err);
                alert("Lỗi khi lưu lời chúc lên Firebase: " + err.message);
            });
    };
}
if (closeResult) closeResult.onclick = () => resultBox.classList.add("hidden");

/* ============================================
   DANH SÁCH + ADMIN
============================================ */
let isAdmin = false;
let currentFilter = "all";
let currentSearch = "";

const listPopup = document.getElementById("listPopup");
const viewList  = document.getElementById("viewList");
const closeList = document.getElementById("closeList");
const adminBtn  = document.getElementById("adminBtn");

const adminLogin  = document.getElementById("adminLogin");
const adminPass   = document.getElementById("adminPass");
const submitAdmin = document.getElementById("submitAdmin");
const cancelAdmin = document.getElementById("cancelAdmin");

// đổi pass tại đây nếu muốn
const ADMIN_PASSWORD = "14102008";

if (viewList)  viewList.onclick = () => openListPopup();
if (closeList) closeList.onclick = () => { listPopup.classList.add("hidden"); isAdmin = false; };

if (adminBtn) {
    adminBtn.onclick = () => {
        adminPass.value = "";
        adminLogin.classList.remove("hidden");
    };
}

if (cancelAdmin) {
    cancelAdmin.onclick = () => {
        adminLogin.classList.add("hidden");
        adminPass.value = "";
    };
}

if (submitAdmin) {
    submitAdmin.onclick = () => {
        if (adminPass.value !== ADMIN_PASSWORD) {
            alert("❌ Sai mật khẩu!");
            return;
        }
        isAdmin = true;
        adminLogin.classList.add("hidden");
        adminPass.value = "";
        buildList();   // reload list ở chế độ admin
    };
}

/* mở popup danh sách */
function openListPopup() {
    currentFilter = "all";
    currentSearch = "";
    listPopup.classList.remove("hidden");
    buildList();
}

/* build khung search + filter + list */
function buildList() {
    const wrap = document.getElementById("wishList");
    if (!wrap) return;

    wrap.innerHTML = `
        <input id="searchInput" type="text" placeholder="Tìm theo tên...">
        ${isAdmin ? `
        <div class="filter-row">
            <button class="filterBtn" data-filter="all">Tất cả</button>
            <button class="filterBtn" data-filter="clean">Sạch</button>
            <button class="filterBtn" data-filter="light">Nghi ngờ</button>
            <button class="filterBtn" data-filter="medium">Xúc phạm</button>
            <button id="delAll" class="danger">Xóa tất cả</button>
        </div>` : ``}
        <div id="wishItems"></div>
    `;

    const searchInput = document.getElementById("searchInput");
    searchInput.value = currentSearch;
    searchInput.oninput = e => {
        currentSearch = e.target.value.toLowerCase();
        renderItems();
    };

    if (isAdmin) {
        document.querySelectorAll(".filterBtn").forEach(btn => {
            btn.onclick = () => {
                currentFilter = btn.dataset.filter;
                renderItems();
            };
        });
        document.getElementById("delAll").onclick = () => deleteAllWishes();
    }

    renderItems();
}

/* render từng lời chúc */
function renderItems() {
    const container = document.getElementById("wishItems");
    if (!container) return;

    let list = wishStorage.slice();

    if (currentSearch) {
        list = list.filter(w => w.name.toLowerCase().includes(currentSearch));
    }

    if (isAdmin) {
        list = list.filter(w => {
            if (currentFilter === "clean")  return w.toxicLevel === 0;
            if (currentFilter === "light")  return w.toxicLevel === 30;
            if (currentFilter === "medium") return w.toxicLevel >= 60;
            return true;
        });
    }

    if (list.length === 0) {
        container.innerHTML = "<p>Không có lời chúc nào.</p>";
        return;
    }

    container.innerHTML = list.map(w => {
        if (!isAdmin) {
            return `
                <div class="wishItem user">
                    <div class="wish-header">
                        <span class="wish-name">${w.name}</span>
                        <span class="wish-time">${w.time}</span>
                    </div>
                    <div class="wish-text">${w.wish}</div>
                </div>
            `;
        }

        let typeClass = "clean", label = "Sạch";
        if (w.toxicLevel === 30) { typeClass = "light";  label = "Nghi ngờ"; }
        if (w.toxicLevel >= 60)  { typeClass = "medium"; label = "Xúc phạm"; }

        return `
            <div class="wishItem admin ${typeClass}">
                <div class="wish-header">
                    <span class="wish-name">${w.name}</span>
                    <span class="wish-time">${w.time}</span>
                </div>
                <div class="wish-text">${w.wish}</div>
                <div class="wish-meta">Mức: ${label}</div>
                <div class="wish-actions">
                    <button data-id="${w.id}" class="delOne">Xóa</button>
                </div>
            </div>
        `;
    }).join("");

    if (isAdmin) {
        container.querySelectorAll(".delOne").forEach(btn => {
            btn.onclick = () => deleteWish(btn.dataset.id);
        });
    }
}

/* xóa từng lời chúc (admin đã đăng nhập) */
function deleteWish(id) {
    deleteWishFromDB(id);
}

/* xóa tất cả */
function deleteAllWishes() {
    if (!wishStorage.length) {
        alert("Không có lời chúc nào để xóa.");
        return;
    }
    if (!confirm("Bạn có chắc chắn muốn xóa TẤT CẢ lời chúc?")) return;

    deleteAllWishesFromDB();
}
