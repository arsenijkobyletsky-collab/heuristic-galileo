// Ждем, пока SDK Owlbear Rodeo полностью загрузится
OBR.onReady(() => {
    console.log("Owlbear Rodeo SDK готово!");

    const tabPlayers = document.getElementById("tab-players");
    const tabGm = document.getElementById("tab-gm");
    const contentPlayers = document.getElementById("content-players");
    const contentGm = document.getElementById("content-gm");

    // Переключение вкладок
    if (tabPlayers && tabGm && contentPlayers && contentGm) {
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
    }

    // Проверяем роль пользователя (ГМ или Игрок)
    OBR.player.getRole().then((role) => {
        if (role === "GM") {
            // Показываем кнопку настроек для ГМ
            if (tabGm) tabGm.style.display = "block";
        }
    });
});
