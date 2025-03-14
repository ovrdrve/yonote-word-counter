// Рендер окна аддона после загрузки базового html
document.addEventListener("DOMContentLoaded", async function () {
  document.getElementById("to-settings").addEventListener("click", toSettings);
  document.getElementById("to-main").addEventListener("click", toMain);
  document.getElementById("add-record").addEventListener("click", addRecord);
  document.getElementById("clear-all").addEventListener("click", clearAll);
  document.getElementById("copy-all").addEventListener("click", copyAll);
  document.getElementById("debug").addEventListener("click", debug);
  renderMain();
});

// Рендер главной страницы
async function renderMain() {
  let tab = (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0];
  let records = (await chrome.storage.local.get("records")).records;
  let settings = (await chrome.storage.local.get("settings")).settings;

  // Подменить слова "words" или "symbols" в зависимости от настроек
  if (settings.count_type == "count_words") {
    Array.from(document.getElementsByClassName("if-words")).forEach((elem) => {
      elem.style.display = "inline";
    });
    Array.from(document.getElementsByClassName("if-symbols")).forEach((elem) => {
      elem.style.display = "none";
    });
  } else {
    Array.from(document.getElementsByClassName("if-words")).forEach((elem) => {
      elem.style.display = "none";
    });
    Array.from(document.getElementsByClassName("if-symbols")).forEach((elem) => {
      elem.style.display = "inline";
    });
  }

  let isUpdate = false;

  if (Object.keys(records).length > 0) {
    // Если есть записи то отсоритровываем их по времени добавления
    let records_sort = Object.keys(records).sort((a, b) => records[a].time - records[b].time);
    let summary = 0;

    // Добавляем записи в таблицу
    let records_table = document.getElementById("records");
    records_table.replaceChildren();

    records_sort.forEach((record) => {
      // Если сейчас отрисовывается текущая страница то выделить её
      let sel = false;
      if (tab.url == record) {
        isUpdate = true;
        if (Object.keys(records).length != 1) {
          sel = true;
        }
      }
      // Отобразить символы или слова в зависимости от настроек
      let val =
        settings.count_type == "count_words" ? records[record].words : records[record].symbols;
      let rec = renderRecord(record, records[record].title, val, sel);
      records_table.appendChild(rec);

      summary += Number(val);
    });

    let words_summary = document.getElementById("words-summary");
    words_summary.innerHTML = summary;

    document.getElementById("table").style.display = "inline";
    document.getElementById("clear").style.display = "none";
  } else {
    // Если записей нет то отрисовываем плейсхолдер
    document.getElementById("table").style.display = "none";
    document.getElementById("clear").style.display = "inline";
  }

  // Заменяем кнопку на обновление если это текущая страница или выключаем если это не Yonote
  let btn_add_record = document.getElementById("add-record");
  let btn_add_record_icon = btn_add_record.getElementsByTagName("use")[0];
  if (isUpdate) {
    btn_add_record_icon.setAttribute("href", "/icons.svg#sync");
  } else {
    btn_add_record_icon.setAttribute("href", "/icons.svg#plus");
    if (new RegExp(".*.yonote.ru").test(new URL(tab.url).hostname)) {
      btn_add_record.classList.remove("disabled");
      btn_add_record.classList.add("action");
    } else {
      btn_add_record.classList.add("disabled");
      btn_add_record.classList.remove("action");
    }
  }

  // Включаем или выклюаем кнопку дебага в настройках
  let btn_debug = document.getElementById("debug");
  if (new RegExp(".*.yonote.ru").test(new URL(tab.url).hostname)) {
    btn_debug.classList.remove("disabled");
    btn_debug.classList.add("action");
  } else {
    btn_debug.classList.add("disabled");
    btn_debug.classList.remove("action");
  }
}

// Функция отрисовки записи
function renderRecord(record, title, value, selected) {
  let sel = selected ? "selected" : "";
  let btn = selected ? "remove-selected" : "remove";
  var div = document.createElement("div");
  div.innerHTML = `<div class="record ${sel}">
      <div class="button danger record-remove">
          <svg><use href="icons.svg#${btn}"></use></svg>
      </div>
      <div class="title">
          <span>${title}</span>
      </div>
      <div class="button action record-counter">
          <svg><use href="icons.svg#copy"></use></svg>
          ${value}
      </div>
  </div>`;
  div.getElementsByClassName("record-remove")[0].addEventListener("click", function () {
    removeRecord(record);
  });
  div.getElementsByClassName("record-counter")[0].addEventListener("click", function () {
    copyCounter(value);
  });

  return div.firstChild;
}

// Функция добавления записи
async function addRecord() {
  let tab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  let settings = (await chrome.storage.local.get("settings")).settings;

  chrome.tabs.sendMessage(tab.id, settings, async function (response) {
    let records = (await chrome.storage.local.get("records")).records;
    records[tab.url] = {
      time: records[tab.url] != null ? records[tab.url].time : Date.now(),
      title: response.title,
      words: response.words,
      symbols: response.symbols,
    };
    chrome.storage.local.set({ records: records }).then((result) => {
      renderMain();
    });
  });
}

// Функция удаления записи
async function removeRecord(url) {
  let records = (await chrome.storage.local.get("records")).records;
  delete records[url];
  chrome.storage.local.set({ records: records });
  renderMain();
}

// Функция очистки списка записей
async function clearAll() {
  chrome.storage.local.set({ records: {} });
  renderMain();
}

// Функция коипрования счетчика отдельной записи
async function copyCounter(value) {
  navigator.clipboard.writeText(value);
}

// Функция коипрования общего счетчика
async function copyAll() {
  navigator.clipboard.writeText(document.getElementById("words-summary").innerHTML);
}

// Функция для копирования в буфер обмена текста страницы
async function debug() {
  let tab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  let settings = (await chrome.storage.local.get("settings")).settings;

  chrome.tabs.sendMessage(tab.id, settings, async function (response) {
    navigator.clipboard.writeText(response.raw);
  });
}

// Рендер страницы настроек
async function renderSettings() {
  // Список заголовков для настроек связанных с разрешением подсчета
  let settings_title = [
    ["allow_title", "Page title"],
    ["allow_quote", "Quote block"],
    ["allow_text", "Text block"],
    ["allow_callout", "Callout block"],
    ["allow_toggle_h1_title", "Toggle H1 title"],
    ["allow_toggle_h1_content", "Toggle H1 content"],
    ["allow_toggle_h2_title", "Toggle H2 title"],
    ["allow_toggle_h2_content", "Toggle H2 content"],
    ["allow_toggle_h3_title", "Toggle H3 title"],
    ["allow_toggle_h3_content", "Toggle H3 content"],
    ["allow_toggle_title", "Toggle title"],
    ["allow_toggle_content", "Toggle content"],
    ["allow_to_do", "To-do list"],
    ["allow_bulleted_list", "Bulleted list"],
    ["allow_numbered_list", "Numbered list"],
    ["allow_column", "Columns"],
    ["allow_table", "Table"],
    ["allow_code", "Code block"],
  ];
  let settings_formatting_title = [
    ["allow_formatting_bold", "Bold"],
    ["allow_formatting_italic", "Italic"],
    ["allow_formatting_underline", "Underline"],
    ["allow_formatting_strike", "Strike"],
    ["allow_formatting_code", "Code"],
  ];
  let settings_language_title = [
    ["allow_language_eng", "English"],
    ["allow_language_rus", "Russian"],
  ];

  chrome.storage.local.get("settings", function (data) {
    // Добавление настроек разрешений
    let settings_allow = document.getElementById("settings-allow");
    settings_allow.replaceChildren();
    for (let i = 0; i < settings_title.length; i++) {
      settings_allow.appendChild(
        renderSetting(
          "checkbox",
          settings_title[i][0],
          settings_title[i][0],
          settings_title[i][1],
          data.settings[settings_title[i][0]]
        )
      );
    }
    // Добавление настроек форматирования текста
    let settings_formatting = document.getElementById("settings-formatting");
    settings_formatting.replaceChildren();
    for (let i = 0; i < settings_formatting_title.length; i++) {
      settings_formatting.appendChild(
        renderSetting(
          "checkbox",
          settings_formatting_title[i][0],
          settings_formatting_title[i][0],
          settings_formatting_title[i][1],
          data.settings[settings_formatting_title[i][0]]
        )
      );
    }
    // Добавление настроек языка
    let settings_language = document.getElementById("settings-language");
    settings_language.replaceChildren();
    for (let i = 0; i < settings_language_title.length; i++) {
      settings_language.appendChild(
        renderSetting(
          "checkbox",
          settings_language_title[i][0],
          settings_language_title[i][0],
          settings_language_title[i][1],
          data.settings[settings_language_title[i][0]]
        )
      );
    }
    // Добавление настойки типа подсчета
    let settings_type = document.getElementById("settings-type");
    settings_type.replaceChildren();
    settings_type.appendChild(
      renderSetting(
        "radio",
        "count_type",
        "count_words",
        "Words",
        data.settings["count_type"] == "count_words"
      )
    );
    settings_type.appendChild(
      renderSetting(
        "radio",
        "count_type",
        "count_symbols",
        "Symbols",
        data.settings["count_type"] == "count_symbols"
      )
    );
  });
}

// Функция отрисовки настройки
function renderSetting(type, name, id, title, value) {
  let val = value ? "checked" : "";
  var div = document.createElement("div");
  div.innerHTML = `<div class="setting">
      <input type="${type}" id="${id}" name="${name}" ${val}/>
      <label for="${id}">
          <svg><use href="icons.svg#${type}-checked"></use></svg>
          <svg><use href="icons.svg#${type}"></use></svg>
          ${title}
      </label>
  </div>`;
  div.getElementsByTagName("input")[0].addEventListener("change", function () {
    let ckd = this.type == "checkbox" ? this.checked : this.id;
    chrome.storage.local.get("settings", function (data) {
      data.settings[name] = ckd;
      chrome.storage.local.set({ settings: data.settings });
    });
  });

  return div.firstChild;
}

// Функция перехода к настройкам
function toSettings() {
  renderSettings();
  document.getElementById("main-page").style.display = "none";
  document.getElementById("settings-page").style.display = "inline";
}

// Функция перехода обратно на главную
function toMain() {
  renderMain();
  document.getElementById("main-page").style.display = "inline";
  document.getElementById("settings-page").style.display = "none";
}
