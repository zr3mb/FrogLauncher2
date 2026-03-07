$(document).ready(function() {
    if(FrogConfig.read("eulaConfirmed", false) !== true){
        $("#modal-eula").show();
        $("#modal-eula .data").load("https://refclient.ru/privacy-policy");
    }
})

// При подтверждении
$("#modal-eula .confirm").click(() => {
    $("#modal-eula").hide();
    FrogConfig.write("eulaConfirmed", true);
})

// При отклонении
$("#modal-eula .decline").click(() => {
    FrogUI.closeMainWindow();
})