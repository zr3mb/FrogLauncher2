class FrogVersionsUI {
    // Открыть UI версий
    static open = () => {
        if (FrogModals.isModalShown("versions")) {
            return FrogModals.hideModal("versions");
        }
        return FrogModals.showModal("versions");
    }

    // Загрузить список версий в UI
    static loadVersions = async () => {
        const $versionsList = $("#modal-versions .versions-list");

        // Показываем и скрываем нужное и ненужное
        $(".flyout #versionSelectPlaceholder").show();
        $(".flyout #versionSelect, .flyout #playButton").hide();

        // Очищаем список версий и показываем прелоадер
        $versionsList.find(".item").unbind("click");
        $versionsList.find(".item:not(.placeholder)").remove();
        $("#modal-versions .preloader").show();
        $versionsList.hide();

        try {
            // Получаем все данные для загрузки
            const versions = await FrogVersionsManager.getPreparedVersions();
            const placeholder = $versionsList.find(".item.placeholder")[0].outerHTML.replace(' placeholder', '');
            const activeVersion = FrogVersionsManager.getActiveVersion();
            const favoritesAllowed = FrogVersionsManager.getFavoriteVersions();
            const installedOnly = FrogVersionsUI.getVersionsTypeSelected().includes("installed");
            const onlyFavorites = FrogVersionsUI.getVersionsTypeSelected().includes("favorite");

            // Добавляем версии в список
            Object.values(versions).forEach(ver => {
                if ((!onlyFavorites || favoritesAllowed.includes(ver.id)) && (!installedOnly || ver.installed)) {
                    let versionIcon = ver.type === "pack" ? "assets/icon.png" : `assets/versions/${ver.type}.webp`;
                    let displayName = ver.displayName;

                    // Если это модпак - получаем его данные
                    if (ver.type === "pack") {
                        const modpackData = FrogPacks.getModpackManifest(ver.id.replace("pack-", ""));
                        if (modpackData.icon && modpackData.icon !== "pack") {
                            versionIcon = modpackData.icon;
                        } else if (modpackData.icon === "pack") {
                            versionIcon = path.join(GAME_DATA, "modpacks", modpackData.id, "icon.png");
                        }
                        if (!displayName.includes(modpackData.baseVersion.number)) {
                            displayName += ` (${modpackData.baseVersion.number})`;
                        }
                    }

                    // Заполняем и добавляем плейсхолдер
                    const preparedPlaceholder = placeholder
                        .replaceAll("$1", displayName)
                        .replaceAll("$2", ver.type)
                        .replaceAll("$3", ver.id)
                        .replaceAll("$4", ver.installed)
                        .replaceAll("$5", versionIcon);
                    $versionsList.append(preparedPlaceholder);
                }
            });

            // Помечаем активные версии и избранные
            $versionsList.find(".item").each(function () {
                if (!$(this).hasClass("placeholder")) {
                    if ($(this).data("version") === activeVersion) {
                        $(this).addClass("active");
                    }
                    if (favoritesAllowed.includes($(this).data("version"))) {
                        $(this).find(".favorite").addClass("active");
                    }
                    $(this).show();
                }
            });

            // Вешаем клики на выбор версии
            $versionsList.find(".item").click(function () {
                $versionsList.find(".item.active").removeClass("active");
                $(this).addClass("active");
                FrogVersionsManager.setActiveVersion($(this).data("version"));
                FrogVersionsUI.clearSearch();
                FrogModals.hideModal("versions");
            });

            // Вешаем клики на избранное
            $versionsList.find(".item .favorite").click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                const versionId = $(this).parent().data("version");
                FrogVersionsManager.addOrRemoveFavorite(versionId);
                $(this).toggleClass("active");
            });

            // Всё готово
            $("#modal-versions .preloader").hide();
            $versionsList.show();
            FrogVersionsUI.reloadButtonUI();
            return true;
        } catch (error) {
            console.error("Error loading versions:", error);
            FrogAlerts.create("Ошибка!", "Не удалось загрузить список версий", "Понятно", "error");
            return false;
        }
    };

    // Перезагрузить кнопку в Flyout (при смене активной версии)
    static reloadButtonUI = () => {
        let $activeVersionItem = $("#modal-versions .versions-list .item.active");
        if ($activeVersionItem.length === 0) {
            $("#versionSelect .title").text(MESSAGES.commons.notSelected);
            $("#versionSelect .icon").hide();
        } else {
            // Проверяем на модпак и на его существование
            let versionName = $activeVersionItem.data("version");
            if (FrogVersionsManager.parseVersionID(versionName).type === "pack") {
                if (!FrogPacks.isModpackExists(versionName.replace("pack-", ""))) {
                    return FrogVersionsManager.setActiveVersion("none");
                }
            }
            if ($activeVersionItem.length < 2) {
                $("#versionSelect .title").text($activeVersionItem.find("span.title").text());
            }
            $("#versionSelect .icon").show();
            $("#versionSelect .icon").attr("src", $activeVersionItem.find("img.icon").attr("src"));
        }
        $(".flyout #versionSelectPlaceholder").hide();
        $(".flyout #versionSelect").show();
        $(".flyout #playButton").show();
        return true;
    }

    // Искать по версиям
    static searchByInput = () => {
        let text = $("#modal-versions input.search").val();
        let searchRegex = new RegExp(text, "gmi");
        $("#modal-versions .versions-list .item:not(.placeholder)").each(function () {
            let versionDisplay = $(this).find(".title").text();

            if (versionDisplay.match(searchRegex) !== null) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }

    // Сбросить поиск
    static clearSearch = () => {
        $("#modal-versions input.search").val("");
        $("#modal-versions .versions-list .item:not(.placeholder)").each(function () {
            $(this).show();
        });
    }

    // Получить выбранные типы версий
    static getVersionsTypeSelected = () => {
        let selectedList = [];
        $("#modal-versions #versionTypeSelect .chip.active").each(function () {
            selectedList.push($(this).data("type"));
        })
        return selectedList;
    }
}