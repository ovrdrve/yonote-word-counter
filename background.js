try {
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.scheme == "dark") {
      chrome.action.setIcon({
        path: {
          16: "images/toolbar-icon-16-dark.png",
          19: "images/toolbar-icon-19-dark.png",
          24: "images/toolbar-icon-24-dark.png",
          32: "images/toolbar-icon-32-dark.png",
          38: "images/toolbar-icon-38-dark.png",
          48: "images/toolbar-icon-48-dark.png",
          128: "images/toolbar-icon-128-dark.png",
        },
      });
    }
    if (request.scheme == "light") {
      chrome.action.setIcon({
        path: {
          16: "images/toolbar-icon-16.png",
          19: "images/toolbar-icon-19.png",
          24: "images/toolbar-icon-24.png",
          32: "images/toolbar-icon-32.png",
          38: "images/toolbar-icon-38.png",
          48: "images/toolbar-icon-48.png",
          128: "images/toolbar-icon-128.png",
        },
      });
    }
  });

  // Создание конфигурации при установке аддона
  chrome.runtime.onInstalled.addListener(async function () {
    //await chrome.storage.local.clear();
    chrome.storage.local.set({
      settings: {
        allow_title: false,
        allow_text: true,
        allow_to_do: true,
        allow_bulleted_list: true,
        allow_numbered_list: true,
        allow_toggle_title: true,
        allow_toggle_content: false,
        allow_code: false,
        allow_quote: true,
        allow_callout: true,
        allow_toggle_h1_title: true,
        allow_toggle_h1_content: false,
        allow_toggle_h2_title: true,
        allow_toggle_h2_content: false,
        allow_toggle_h3_title: true,
        allow_toggle_h3_content: false,
        allow_column: true,
        allow_table: true,
        count_type: "count_words",
        allow_formatting_bold: true,
        allow_formatting_italic: true,
        allow_formatting_underline: true,
        allow_formatting_strike: false,
        allow_formatting_code: false,
        allow_language_eng: true,
        allow_language_rus: true,
      },
      records: {},
    });
  });
} catch (e) {
  console.error(e);
}
