// ID твоего расширения — используется как префикс для ключа в метаданных,
// чтобы не конфликтовать с другими расширениями в той же комнате.
const EXT_ID = "com.heuristicgalileo.factions";

let factions = [];
let players = [];
let isGM = false;
let editingId = null;

OBR.onReady(async () => {
  console.log("Owlbear Rodeo SDK готово!");

  const role = await OBR.player.getRole();
  isGM = role === "GM";

  const tabPlayers = document.getElementById("tab-players");
  const tabGm = document.getElementById("tab-gm");
  const contentPlayers = document.getElementById("content-players");
  const contentGm = document.getElementById("content-gm");

  // Вкладку "Добавить фракцию" видит только мастер
  tabGm.style.display = isGM ? "block" : "none";

  // Переключение вкладок
  tabPlayers.addEventListener("click", () => {
    tabPlayers.classList.add("active");
    tabGm.classList.remove("active");
    contentPlayers.classList.add("active");
    contentGm.classList.remove("active");
  });

  tabGm.addEventListener("click", () => {
    tabGm.classList.add("active");
    tabPlayers.classList.remove("active");
    contentGm.classList.add("active");
    contentPlayers.classList.remove("active");
  });

  // Список игроков в комнате (для выбора в форме фракции)
  players = await OBR.party.getPlayers();
  renderPlayersSelect();
  OBR.party.onChange((updatedPlayers) => {
    players = updatedPlayers;
    renderPlayersSelect();
  });

  // Загружаем сохранённые фракции
  const metadata = await OBR.room.getMetadata();
  factions = metadata[${EXT_ID}/factions] || [];
  renderFactions();

  // Синхронизация: если ГМ что-то поменял, у всех игроков обновится список
  OBR.room.onMetadataChange((updatedMetadata) => {
    factions = updatedMetadata[${EXT_ID}/factions] || [];
    renderFactions();
  });

  // Кнопки формы (только у ГМ есть эта вкладка, но проверка не помешает)
  const saveBtn = document.getElementById("save-fac-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  if (saveBtn) saveBtn.addEventListener("click", saveFaction);
  if (cancelBtn) cancelBtn.addEventListener("click", resetForm);
});

function renderPlayersSelect() {
  const select = document.getElementById("fac-players");
  if (!select) return;
  select.innerHTML = "";
  players.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = p.name;
    select.appendChild(option);
  });
}

async function saveFaction() {
  const name = document.getElementById("fac-name").value.trim();
  const icon = document.getElementById("fac-icon").value.trim() || "🏴";
  const color = document.getElementById("fac-color").value;
  const count = Number(document.getElementById("fac-count").value) || 0;
  const selectedPlayers = Array.from(
    document.getElementById("fac-players").selectedOptions
  ).map((o) => ({ id: o.value, name: o.textContent }));

  if (!name) {
    alert("Введите название фракции");
    return;
  }

  const id = document.getElementById("fac-id").value || crypto.randomUUID();
  const faction = { id, name, icon, color, count, players: selectedPlayers };

  if (editingId) {
    factions = factions.map((f) => (f.id === editingId ? faction : f));
  } else {
    factions.push(faction);
  }

  // setMetadata сохраняет данные в комнате — их увидят все подключённые игроки
  await OBR.room.setMetadata({ [${EXT_ID}/factions]: factions });

  resetForm();
  renderFactions();
}

function resetForm() {
  editingId = null;
  document.getElementById("fac-id").value = "";
  document.getElementById("fac-name").value = "";
  document.getElementById("fac-icon").value = "";
  document.getElementById("fac-color").value = "#8b0000";
  document.getElementById("fac-count").value = "";
  document.getElementById("gm-form-title").textContent = "Добавить фракцию";
  document.getElementById("cancel-edit-btn").style.display = "none";
}
function editFaction(id) {
  const faction = factions.find((f) => f.id === id);
  if (!faction) return;
  editingId = id;
  document.getElementById("fac-id").value = faction.id;
  document.getElementById("fac-name").value = faction.name;
  document.getElementById("fac-icon").value = faction.icon;
  document.getElementById("fac-color").value = faction.color;
  document.getElementById("fac-count").value = faction.count;
  document.getElementById("gm-form-title").textContent = "Редактировать фракцию";
  document.getElementById("cancel-edit-btn").style.display = "inline-block";

  // Переключаемся на вкладку ГМ, если ещё не там
  document.getElementById("tab-gm").click();
}

async function deleteFaction(id) {
  if (!confirm("Удалить эту фракцию?")) return;
  factions = factions.filter((f) => f.id !== id);
  await OBR.room.setMetadata({ [${EXT_ID}/factions]: factions });
  renderFactions();
}

function renderFactions() {
  const list = document.getElementById("fractions-list");
  list.innerHTML = "";

  if (factions.length === 0) {
    list.innerHTML = '<p class="empty-msg">Фракций пока нет...</p>';
    return;
  }

  factions.forEach((f) => {
    const card = document.createElement("div");
    card.className = "fraction-card";
    card.style.borderLeft = 4px solid ${f.color};

    const playersHtml = (f.players || [])
      .map((p) => <div class="fraction-players">${escapeHtml(p.name)}</div>)
      .join("");

    card.innerHTML = 
      <div class="fraction-header">
        <span class="fraction-icon">${escapeHtml(f.icon)}</span>
        <span class="fraction-title">${escapeHtml(f.name)}</span>
        <span class="fraction-count">${f.count} чел.</span>
      </div>
      ${playersHtml}
      ${
        isGM
          ? <div class="gm-actions">
               <button class="edit-btn">Редактировать</button>
               <button class="delete-btn">Удалить</button>
             </div>
          : ""
      }
    ;

    if (isGM) {
      card.querySelector(".edit-btn").addEventListener("click", () => editFaction(f.id));
      card.querySelector(".delete-btn").addEventListener("click", () => deleteFaction(f.id));
    }

    list.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
