var gmailDisplayLanguage;

function processAriaLabel(t) {
    //returns own, or parent's or grand-parent's or empty aria-label  
    al = t.attr('aria-label');
    if (typeof al === "undefined") {
        al = t.parent().attr('aria-label');
        if (typeof al === "undefined") {
            al = t.parent().parent().attr('aria-label');
            if (typeof al === "undefined") { al = ''; }
        }
    }
    t.processedAriaLabel = al;
	cw(al);
}
function processText(t) {
    // remove E-Mail Count strips _(4) from 'Inbox (4)' and (45)_ from '(45) Inbox' in right-to-left languages
    // zero or 1 whitespace, any digits in brackets and zero or one whitespace
    text = t.text().replace(/\W?\([\d]*\)\W?/g, "");
	t.processedText = text;
}

function notify_gmail_settings_confirm(text) {

    button_done = jQuery('<div/>', {
      id: 'kr_button_done',
      class: 'btn btn-primary',
      text: chrome.i18n.getMessage("gmailSettingsMessage_Done")
    });

    button_not_now = jQuery('<a/>', {
      id: 'kr_button_not_now',
      class: 'kr_secondary',
      text: chrome.i18n.getMessage("gmailSettingsMessage_Not_Now")
    });
    buttons = "<div class='kr_buttons'>" + jQuery("<p>").append(button_done.clone()).html() + "</br>" + jQuery("<p>").append(button_not_now.clone()).html() +"</div>";
    
    text = text + buttons;

    notify(text, "settings", 300000);
    $('#kr_button_done').click(function() {
        chrome.extension.sendRequest({ method: "setLocalStorage", key: "gmail_settings_information_shown", value: "confirmed" }, function (response) {
            cw('gmail_setting_information_shown stored?:' + response.data);
        });
        $notificationClose = $('#notification a.close');
        $notificationClose.click();
        chrome.extension.sendRequest({
            method: "trackEvent",
            eventCategory: "Gmail Installation",
            eventAction: "Done",
            eventLabel: "Gmail Settings",
            eventValue: 0,
            eventNonInteractive:true
        });
    });
    
   $('#kr_button_not_now').click(function() {
       chrome.extension.sendRequest({ method: "setLocalStorage", key: "gmail_settings_information_shown", value: "remind_again" }, function (response) {
            cw('gmail_setting_information_shown stored?:' + response.data);
        });
        $notificationClose = $('#notification a.close');
        $notificationClose.click();
        chrome.extension.sendRequest({
            method: "trackEvent",
            eventCategory: "Gmail Installation",
            eventAction: "Later",
            eventLabel: "Gmail Settings",
            eventValue: 0,
            eventNonInteractive: true
        });
    }); 
}
function getGmailDisplayLanguage() {
    lang = $('html').first().attr('lang');
    if (lang === undefined) {
        lang = 'en-US' //if the display language is set to English (US) no lang attribute is provided
    }
    return lang;
}

function fillGMailShortcuts() {
	switch (gmailDisplayLanguage) {
        // case 'de':
			// shortcuts.push(createshortcut('t.processedtext == "schreiben"',['c'],'um eine neue nachricht zu <u>s</u>chreiben.'));
			// shortcuts.push(createshortcut('t.processedtext == "" && t.attr("name") == "q"',['/'],'um zu suchen.'));
			// shortcuts.push(createshortcut('t.processedtext == "" && -1 !=t.processedarialabel.indexof("neuere konversation")',['k'],'um zu den nächsten/jüngeren konversation zu wechseln.'));
			// shortcuts.push(createshortcut('t.processedtext == "" && -1 !=t.processedarialabel.indexof("ältere konversation")',['j'],'um zu den vorherigen/älteren konversation zu wechseln.'));
			// shortcuts.push(createshortcut('t.processedtext == "" && -1 !=t.processedarialabel.indexof("zurück zum")',['u'],'um zurück zur konversationsliste zu kommen.'));
			// shortcuts.push(createshortcut('t.processedarialabel == "archivieren"',['e'],'um die nachricht zu archivieren.'));
			// shortcuts.push(createshortcut('t.processedtext == "ignorieren" || t.processedtext == "nicht mehr ignorieren"',['m'],'um die konversation "stumm" zu schalten'));
			// break;
		case 'iw': //hebrew seems to be iw there?
			shortcuts.push(createShortcut('t.processedText == "חבר הודעה"',['c'],'כדי לחבר הודעה'));
			shortcuts.push(createShortcut('t.processedText == "חבר הודעהחבר הודעה"', ['c'], 'כדי לחבר הודעה'));
			shortcuts.push(createShortcut('t.processedText == "דואר נכנס" && (typeof t.attr("title") != "undefined")', ['g i'], 'כדי לעבור לדואר נכנס'));
			shortcuts.push(createShortcut('t.processedText == "מסומן בכוכב" && (t.is("a") || t.find("a").length > 0)',['g s'],'כדי לעבור אל \'מסומן בכוכב\''));
			shortcuts.push(createShortcut('t.processedText == "דואר יוצא"',['g t'],'כדי לעבור אל \'דואר שנשלח\''));
			shortcuts.push(createShortcut('t.processedText == "טיוטות"',['g d'],'כדי לעבור אל \'טיוטות\''));
			shortcuts.push(createShortcut('t.processedText == "אנשי קשר"',['g c'],'כדי לעבור אל \'אנשי קשר\'.'));
			shortcuts.push(createShortcut('t.processedText == "משימות"',['g k'],'כדי לעבור ל\'משימות\''));
			shortcuts.push(createShortcut('t.processedText == "הכל"',['* a'],'כדי לבחור את כל הדואר'));
			shortcuts.push(createShortcut('t.processedText == "כלום"',['* n'],'כדי לבטל את הבחירה של כל ההודעות'));
			shortcuts.push(createShortcut('t.processedText == "נקרא"',['* r'],'כדי לבחור את כל ההודעות שנקראו'));
			shortcuts.push(createShortcut('t.processedText == "לא נקרא"',['* u'],'כדי לבחור את כל ההודעות שלא נקראו'));
			shortcuts.push(createShortcut('t.processedText == "מסומן בכוכב" && (!t.is("a") && !t.find("a").length)',['* s'],'כדי לבחור שיחות שסומנו בכוכב'));
			shortcuts.push(createShortcut('t.processedText == "לא מסומן בכוכב"',['* t'],'כדי לבחור שיחות שלא סומנו בכוכב'));
			shortcuts.push(createShortcut('t.processedText == "" && -1 !=t.processedAriaLabel.indexOf("חזרה אל ")',['u'],'כדי לחזור לרשימת השיחות'));
			shortcuts.push(createShortcut('t.processedText == "" && -1 !=t.processedAriaLabel.indexOf("חדש יותר")',['k'],'לשיחה חדשה יותר'));
			shortcuts.push(createShortcut('t.processedText == "" && -1 !=t.processedAriaLabel.indexOf("ישן יותר")',['j'],'לשיחה ישנה יותר'));
			shortcuts.push(createShortcut('t.processedText == "" && t.attr("שם") == "q"',['/'],'כדי לחפש דואר'));
			shortcuts.push(createShortcut('t.processedText == "" && t.attr("label") == "חפש אנשי קשר"',['q'],'כדי לחפש אנשי קשר בצ\'אט'));
			shortcuts.push(createShortcut('t.processedText == "" && t.parent().attr("תפקיד")=="checkbox" && -1==t.processedAriaLabel.indexOf("tar")',['x'],'כדי לבחור\לבטל בחירה של הודעה'));
			shortcuts.push(createShortcut('t.processedAriaLabel == "ארכיון"',['e'],'כדי לשלוח לארכיון'));
			shortcuts.push(createShortcut('t.processedText == "השתק" || t.processedText == "בטל השתקה"',['m'],'כדי להשתיק\להתעלם משיחה'));
			shortcuts.push(createShortcut('t.processedAriaLabel == "דווח על ספאם" || t.processedText == "דווח על ספאם"',['!'],'כדי לדווח על דואר זבל'));
			shortcuts.push(createShortcut('t.processedAriaLabel == "מחק"',['#'],'כדי למחוק הודעה'));
			shortcuts.push(createShortcut('t.processedAriaLabel == "השב" || t.processedText == "השב"',['r'],'כדי להשיב'));
			shortcuts.push(createShortcut('t.processedAriaLabel == "השב לכולם" || t.processedText == "השב לכולם"',['a'],'כדי להשיב לכולם'));
			shortcuts.push(createShortcut('t.processedText == "העבר"',['f'],'כדי להעביר הודעה'));
			shortcuts.push(createShortcut('t.processedText == "עדכן שיחה"',['<Shift> + n'],'כדי לעדכן שיחה'));
			shortcuts.push(createShortcut('t.processedText == "שלח"',['(Tab) Enter'],'כדי לשלוח הודעה'));
			shortcuts.push(createShortcut('t.processedText == "בטל"',['z'],'כדי לבטל את הפעולה הקודמת'));
			shortcuts.push(createShortcut('t.processedText == "סמן כדואר שנקרא"',['<Shift> + i'],'כדי לסמן כ\'דואר שנקרא\''));
			shortcuts.push(createShortcut('t.processedText == "סמן כדואר שלא נקרא"',['<Shift> + u'],'כדי לסמן כ\'דואר שלא נקרא\''));
			shortcuts.push(createShortcut('t.processedText == "סמן כדואר שלא נקרא מכאן והלאה"',['_'],'כדי לסמן כ\'דואר שנקרא\' החל מההודעה המסומנת'));
			shortcuts.push(createShortcut('t.processedAriaLabel == "לא חשוב"',['+'],'כדי לסמן כ\'חשוב\''));
			shortcuts.push(createShortcut('-1 != t.processedAriaLabel.indexOf("ההודעה חשובה בעיקר מכיוון ש")',['-'],'כדי לסמן כ\'לא חשוב\''));
			shortcuts.push(createShortcut('t.processedText == "התקשר לטלפון"',['g p'],'כדי להתקשר לטלפון'));
			console.log(shortcuts);
			break;
        case 'fr':
            shortcuts.push(createShortcut('t.processedText == "NOUVEAU MESSAGE"', ['c'], 'pour <u>C</u>omposer un nouveau message.'));
            shortcuts.push(createShortcut('t.processedText == "Boîte de réception" && (typeof t.attr("title") != "undefined")', [' g i'], 'pour ouvrir la Boite de réception.'));
            shortcuts.push(createShortcut('t.processedText == "Messages suivis" && (t.is("a") || t.find("a").length > 0)', ['g s'], 'pour ouvrir le dossier Message suivis.'));
            shortcuts.push(createShortcut('t.processedText == "Messages envoyés"', ['g t'], 'pour ouvrir les Messages envoyés.'));
            shortcuts.push(createShortcut('t.processedText == "Brouillons"', ['g d'], 'pour ouvrir les Brouillons.'));
            shortcuts.push(createShortcut('t.processedText == "Contacts"', ['g c'], 'pour ouvrir les Contacts.'));
            shortcuts.push(createShortcut('t.processedText == "Liste de tâches"', ['g k'], 'pour ouvrir la Liste de tâches.'));
            shortcuts.push(createShortcut('t.processedText == "Tous"', ['* a'], 'pour sélectionner tous les messages.'));
            shortcuts.push(createShortcut('t.processedText == "Aucun"', ['* n'], 'pour désélectionner tous les messages.'));
            shortcuts.push(createShortcut('t.processedText == "Lus"', ['* r'], 'pour sélectionner les messages lus.'));
            shortcuts.push(createShortcut('t.processedText == "Non lus"', ['* u'], 'pour sélectionner les messages non lus.'));
            shortcuts.push(createShortcut('t.processedText == "Suivis" && (!t.is("a") && !t.find("a").length)', ['* s'], 'pour sélectionner les messages suivis.'));
            shortcuts.push(createShortcut('t.processedText == "Non suivis"', ['* t'], 'pour sélectionner les messages non suivis.'));
            shortcuts.push(createShortcut('t.processedText == "" && -1 !=t.processedAriaLabel.indexOf("Retour au dossier")', ['u'], 'pour retourner à la liste des messages.'));
            shortcuts.push(createShortcut('t.processedText == "" && -1 !=t.processedAriaLabel.indexOf("Suiv.")', ['k'], 'pour accéder au message suivant.'));
            shortcuts.push(createShortcut('t.processedText == "" && -1 !=t.processedAriaLabel.indexOf("Préc.")', ['j'], 'pour accéder au message précédent.'));
            shortcuts.push(createShortcut('t.processedText == "" && t.attr("name") == "q"', ['/'], 'pour faire une recherche dans les messages.'));
            shortcuts.push(createShortcut('t.processedText == "" && t.attr("label") == "Rechercher des contacts..."', ['q'], 'pour rechercher dans les contacts du chat.'));
            shortcuts.push(createShortcut('t.processedText == "" && t.parent().attr("role")=="checkbox" && -1==t.processedAriaLabel.indexOf("tar")', ['x'], 'pour (dé)sélectionner le message.'));
            shortcuts.push(createShortcut('t.processedAriaLabel == "Archiver"', ['e'], 'pour archiver.'));
            shortcuts.push(createShortcut('t.processedText == "Ignorer la conversation" || t.processedText == "Réactiver la conversation"', ['m'], 'pour ignorer/réactiver la conversation.'));
            shortcuts.push(createShortcut('t.processedAriaLabel == "Signaler comme spam" || t.processedText == "Report spam"', ['!'], 'pour signaler comme spam.'));
            shortcuts.push(createShortcut('t.processedAriaLabel == "Supprimer"', ['#'], 'pour supprimer.'));
            shortcuts.push(createShortcut('t.processedAriaLabel == "Répondre" || t.processedText == "Répondre"', ['r'], 'pour répondre.'));
            shortcuts.push(createShortcut('t.processedAriaLabel == "Répondre à tous" || t.processedText == "Répondre à tous"', ['a'], 'pour répondre à tous.'));
            shortcuts.push(createShortcut('t.processedText == "Transférer"', ['f'], 'pour transférer.'));
            shortcuts.push(createShortcut('t.processedText == "Envoyer"', ['(Tab) Entrée'], 'pour envoyer ce message.'));
            shortcuts.push(createShortcut('t.processedText == "Marquer comme lu"', ['(Shift) i'], 'pour marquer comme lu.'));
            shortcuts.push(createShortcut('t.processedText == "Marquer comme non lu"', ['(Shift) u'], 'pour marquer comme non lu.'));
            shortcuts.push(createShortcut('t.processedText == "Marquer comme non lu à partir d\'ici"', ['_'], 'pour marquer comme non lu à partir du message sélectionné.'));
            shortcuts.push(createShortcut('t.processedAriaLabel == "Importance faible"', ['+', '='], 'pour marquer comme important.'));
            shortcuts.push(createShortcut('-1 != t.processedAriaLabel.indexOf("Ce message est important")', ['-'], 'pour marquer comme peu important.'));
            shortcuts.push(createShortcut('t.processedText == "Appel téléphonique"', ['g p'], 'pour passer un appel téléphonique.'));
	    case 'ru':
	        shortcuts.push(createShortcut('t.processedText == "НАПИСАТЬ"', ['c'], 'написать письмо.'));
	        shortcuts.push(createShortcut('t.processedText == "Входящие"', ['g i'], 'перейти во входящие.'));
	        shortcuts.push(createShortcut('t.processedText == "Помеченные" && (t.is("a") || t.find("a").length > 0)', ['g s'], 'перейти к помеченным сообщениям'));
	        shortcuts.push(createShortcut('t.processedText == "Отправленные"', ['g t'], 'перейти к Отправленным'));
	        shortcuts.push(createShortcut('t.processedText == "Черновики"', ['g d'], 'перейти к Черновикам'));
	        shortcuts.push(createShortcut('t.processedText == "Контакты"', ['g c'], 'перейти к Контактам'));
	        shortcuts.push(createShortcut('t.processedText == "Задачи"', ['g k'], 'перейти к Задачам'));
	        shortcuts.push(createShortcut('t.processedText == "Все"', ['* a'], 'выбрать все цепочки'));
	        shortcuts.push(createShortcut('t.processedText == "Ни одного"', ['* n'], 'снять всё выделение'));
	        shortcuts.push(createShortcut('t.processedText == "Прочитанные"', ['* r'], 'выбрать прочитанные цепочки'));
	        shortcuts.push(createShortcut('t.processedText == "Непрочитанные"', ['* u'], 'выбрать непрочтенные цепочки'));
	        shortcuts.push(createShortcut('t.processedText == "Помеченные" && (!t.is("a") && !t.find("a").length)', ['* s'], 'выбрать помеченные цепочки'));
	        shortcuts.push(createShortcut('t.processedText == "Без пометок"', ['* t'], 'выбрать непомеченные цепочки'));
	        shortcuts.push(createShortcut('t.processedText == "" && -1 !=t.processedAriaLabel.indexOf("Назад в список цепочек ")', ['u'], 'вернуться в список цепочек'));
	        shortcuts.push(createShortcut('t.processedText == "" && -1 !=t.processedAriaLabel.indexOf("Более поздняя цепочка писем")', ['k'], 'к более поздним цепочкам'));
	        shortcuts.push(createShortcut('t.processedText == "" && -1 !=t.processedAriaLabel.indexOf("Более ранняя цепочка писем")', ['j'], 'к более ранним цепочкам'));
	        shortcuts.push(createShortcut('t.processedText == "" && t.attr("name") == "q"', ['/'], 'для поиска писем'));
	        shortcuts.push(createShortcut('t.processedText == "" && t.attr("label") == "Поиск контактов из чата..."', ['q'], 'для поиска контактов чата.'));
	        shortcuts.push(createShortcut('t.processedText == "" && t.parent().attr("role")=="checkbox" && -1==t.processedAriaLabel.indexOf("tar")', ['x'], 'для выбора/снятия выбора цепочек'));
	        shortcuts.push(createShortcut('t.processedAriaLabel == "Архивировать"', ['e'], 'для Архивирования'));
	        shortcuts.push(createShortcut('t.processedText == "Игнорировать цепочку писем" || t.processedText == "Следить за цепочкой писем"', ['m'], 'для Игнорирования цепочки'));
	        shortcuts.push(createShortcut('t.processedAriaLabel == "Спам" || t.processedText == "В спам!"', ['!'], 'Сообщить о спаме'));
	        shortcuts.push(createShortcut('t.processedAriaLabel == "Удалить"', ['#'], 'для Перемещения в корзину'));
	        shortcuts.push(createShortcut('t.processedAriaLabel == "Ответить" || t.processedText == "Ответить"', ['r'], 'для Ответа'));
	        shortcuts.push(createShortcut('t.processedAriaLabel == "Ответить всем" || t.processedText == "Ответить всем"', ['a'], 'для Ответа всем'));
	        shortcuts.push(createShortcut('t.processedText == "Переслать"', ['f'], 'для Пересылки'));
	        shortcuts.push(createShortcut('t.processedText == "Обновить цепочку писем"', ['(Shift) + n'], 'для Обновления цепочки сообщений'));
	        shortcuts.push(createShortcut('t.processedText == "Отправить почту"', ['(Tab) Enter'], 'к отправленным сообщениям'));
	        shortcuts.push(createShortcut('t.processedText == "Отменить"', ['z'], 'для отмены последнего действия'));
	        shortcuts.push(createShortcut('t.processedText == "Отметить как прочитанное"', ['(Shift) + i'], 'пометить как прочитанное'));
	        shortcuts.push(createShortcut('t.processedText == "Пометить как непрочитанное"', ['(Shift) + u'], 'пометить как непрочитанное'));
	        shortcuts.push(createShortcut('t.processedText == "Пометить как непрочитанное, начиная с выбранного сообщения"', ['_'], 'пометить как прочитанное, начиная с выбранного сообщения'));
	        shortcuts.push(createShortcut('t.processedAriaLabel == "Неважное"', ['+'], 'пометить как важное'));
	        shortcuts.push(createShortcut('-1 != t.processedAriaLabel.indexOf("Отмечено как важное потому, что")', ['-'], 'пометить как неважное'));
	        shortcuts.push(createShortcut('t.processedText == "Позвонить по телефону"', ['g p'], 'позвонить по телефону'));
	    case 'en - GB': case 'en - US': default:
			shortcuts.push(createShortcut('t.processedText == "COMPOSE"',['c'],'to <u>C</u>ompose a message.'));
			shortcuts.push(createShortcut('t.processedText == "Inbox" && (typeof t.attr("title") != "undefined")', ['g i'], 'to <u>G</u>o to <u>I</u>nbox.'));
			shortcuts.push(createShortcut('t.processedText == "Starred" && (t.is("a") || t.find("a").length > 0)',['g s'],'to Go to Starred conversations'));
			shortcuts.push(createShortcut('t.processedText == "Sent Mail"',['g t'],'to Go to Sent messages'));
			shortcuts.push(createShortcut('t.processedText == "Drafts"',['g d'],'to Go to Drafts'));
			shortcuts.push(createShortcut('t.processedText == "Contacts"',['g c'],'to Go to Contacts'));
			shortcuts.push(createShortcut('t.processedText == "Tasks"',['g k'],'to Go to Tasks'));
			shortcuts.push(createShortcut('t.processedText == "All"',['* a'],'to Select all conversations'));
			shortcuts.push(createShortcut('t.processedText == "None"',['* n'],'to Deselect all conversations'));
			shortcuts.push(createShortcut('t.processedText == "Read"',['* r'],'to Select read conversations'));
			shortcuts.push(createShortcut('t.processedText == "Unread"',['* u'],'to Select unread conversations'));
			shortcuts.push(createShortcut('t.processedText == "Starred" && (!t.is("a") && !t.find("a").length)',['* s'],'to Select starred conversations'));
			shortcuts.push(createShortcut('t.processedText == "Unstarred"',['* t'],'to Select unstarred conversations'));
			shortcuts.push(createShortcut('t.processedText == "" && -1 !=t.processedAriaLabel.indexOf("Back to ")',['u'],'to return to conversation list'));
			shortcuts.push(createShortcut('t.processedText == "" && -1 !=t.processedAriaLabel.indexOf("Newer Conversation")',['k'],'for "Newer conversation"'));
			shortcuts.push(createShortcut('t.processedText == "" && -1 !=t.processedAriaLabel.indexOf("Older Conversation")',['j'],'for "Older conversation"'));
			shortcuts.push(createShortcut('t.processedText == "" && t.attr("name") == "q"',['/'],'to Search email'));
			shortcuts.push(createShortcut('t.processedText == "" && t.attr("label") == "Search people..."',['q'],'to search chat contacts.'));
			shortcuts.push(createShortcut('t.processedText == "" && t.parent().attr("role")=="checkbox" && -1==t.processedAriaLabel.indexOf("tar")',['x'],'to (un)select conversation'));
			shortcuts.push(createShortcut('t.processedAriaLabel == "Archive"',['e'],'to Archive'));
			shortcuts.push(createShortcut('t.processedText == "Mute" || t.processedText == "Unmute"',['m'],'to Mute/Ignore conversation'));
			shortcuts.push(createShortcut('t.processedAriaLabel == "Report spam" || t.processedText == "Report spam"',['!'],'to Report as spam'));
			shortcuts.push(createShortcut('t.processedAriaLabel == "Delete"',['#'],'to Move to bin'));
			shortcuts.push(createShortcut('t.processedAriaLabel == "Reply" || t.processedText == "Reply"',['r'],'to Reply'));
			shortcuts.push(createShortcut('t.processedAriaLabel == "Reply to all" || t.processedText == "Reply to all"',['a'],'to Reply all'));
			shortcuts.push(createShortcut('t.processedText == "Forward"',['f'],'to Forward'));
			shortcuts.push(createShortcut('t.processedText == "Update conversation"',['<Shift> + n'],'to Update conversation'));
			shortcuts.push(createShortcut('t.processedText == "Send"',['(Tab) Enter'],'to Send mail'));
			shortcuts.push(createShortcut('t.processedText == "Undo"',['z'],'to Undo last action'));
			shortcuts.push(createShortcut('t.processedText == "Mark as read"',['(Shift) + i'],'to Mark as read'));
			shortcuts.push(createShortcut('t.processedText == "Mark as unread"',['(Shift) + u'],'to Mark as unread'));
			shortcuts.push(createShortcut('t.processedText == "Mark unread from here"',['_'],'to Mark unread from the selected message'));
			shortcuts.push(createShortcut('t.processedAriaLabel == "Not important"',['+','='],'to Mark as important'));
			shortcuts.push(createShortcut('-1 != t.processedAriaLabel.indexOf("Important mainly because")',['-'],'to Mark as not important'));
			shortcuts.push(createShortcut('t.processedText == "Call phone"',['g p'],'to Make a phone call'));
    }
}
	
gmailDisplayLanguage = getGmailDisplayLanguage();
clickTargetProcessors.push(processText);
clickTargetProcessors.push(processAriaLabel);	
fillGMailShortcuts();

chrome.extension.sendRequest({ method: "reportDisplayLanguage", gmailDisplayLanguage: gmailDisplayLanguage });
chrome.extension.sendRequest({ method: "getLocalStorage", key: "gmail_settings_information_shown" }, function (response) {
    if (response.data != 'confirmed') {
        message = chrome.i18n.getMessage("gmailSettingsMessage_Part_01")+"<ol>";
        cw(gmailDisplayLanguage);
        cw(supportedLanguages);
        if (-1 == window.location.href.indexOf("settings/general")) {
            message += "<li>" + chrome.i18n.getMessage("gmailSettingsMessage_Part_02_optional_goTo") 
                    + " <a href='https://mail.google.com/mail/u/0/#settings/general'>'" + chrome.i18n.getMessage("gmailSettingsMessage_Part_02_optional_Settings")
                    + "'</a>.</li>";
        }
        if (-1==$.inArray(gmailDisplayLanguage, supportedLanguages)) {
            message += "<li>"+ chrome.i18n.getMessage("gmailSettingsMessage_Part_03_optional_Set_Display_Language") + ".</li>";
        }
        message += "<li>"+chrome.i18n.getMessage("gmailSettingsMessage_Part_04_Set_KeyboardShortcuts_On")+"</li>";
        message += "<li>" + chrome.i18n.getMessage("gmailSettingsMessage_Part_05_Save_Settings") + "</li></ol>";
        notify_gmail_settings_confirm(message);
    }
}); //Show gmail setting on first run!
