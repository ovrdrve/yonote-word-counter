chrome.runtime.onMessage.addListener((settings, sender, sendResponse) => {
  let page_text;
  let content_nodes = document.querySelectorAll('[role="textbox"]');

  // Заголовок страницы
  let frame_title = content_nodes[0].textContent;

  // Если разрешен в настройках то добавляем к подсчету
  if (settings.allow_title) {
    page_text = frame_title;
  }

  // Контент страницы
  let page_blocks = content_nodes[1].childNodes;

  is_h1_content = false;
  is_h2_content = false;
  is_h3_content = false;

  page_blocks.forEach((block) => {
    // Определение принадлежности тега к заголовку определенного уровня
    if (block.tagName === "H1") {
      is_h1_content = true;
      is_h2_content = false;
      is_h3_content = false;
    }
    if (block.tagName === "H2") {
      is_h2_content = true;
      is_h3_content = false;
    }
    if (block.tagName === "H3") {
      is_h3_content = true;
    }

    let block_text = getBlockText(block, settings);
    if (block_text) {
      if (page_text) {
        page_text += "\n" + block_text;
      } else {
        page_text = block_text;
      }
    }
  });

  sendResponse({
    title: frame_title != "" ? frame_title : "Untitled",
    words: countWords(page_text),
    symbols: page_text.trim().length,
    raw: page_text,
  });

  function getBlockText(block, settings) {
    let block_text;

    // Сворачиваемые заголовки разных уровней
    if (
      (settings.allow_toggle_h1_title && block.tagName === "H1") ||
      (settings.allow_toggle_h2_title && block.tagName === "H2") ||
      (settings.allow_toggle_h3_title && block.tagName === "H3")
    ) {
      block_text = getRawText(block.childNodes[1], settings);
    }

    if (
      (settings.allow_toggle_h1_content && is_h1_content) ||
      (settings.allow_toggle_h2_content && is_h2_content) ||
      (settings.allow_toggle_h3_content && is_h3_content) ||
      (!is_h1_content && !is_h2_content && !is_h3_content)
    ) {
      if (block.tagName === "A" || block.tagName === "HR") return;

      // Обычный текстовый блок
      if (settings.allow_text && block.tagName === "P") {
        block.childNodes.forEach((node) => {
          if (block_text != null) {
            block_text += getRawText(node, settings);
          } else {
            block_text = getRawText(node, settings);
          }
        });
      }

      // Блок кода
      if (settings.allow_code && block.classList.contains("code_block")) {
        const node = block.childNodes[1].childNodes[0];
        node.childNodes.forEach((node) => {
          block_text += getRawText(node, settings);
        });
      }

      // Блок элемента списка (маркерный, нумерованный, галочка)
      if (
        (settings.allow_bulleted_list && block.classList.contains("bullet_list")) ||
        (settings.allow_numbered_list && block.classList.contains("ordered_list")) ||
        (settings.allow_to_do && block.classList.contains("checkbox_list"))
      ) {
        block.childNodes.forEach((node) => {
          if (block_text != null) {
            block_text += " " + getRawText(node.lastChild, settings);
          } else {
            block_text = getRawText(node.lastChild, settings);
          }
        });
      }

      // Блок текста в рамке
      if (settings.allow_callout && block.classList.contains("notice-block")) {
        const nodes = block.childNodes[1].childNodes;
        for (let i = 1; i < nodes.length; i++) {
          if (block_text != null) {
            block_text += " " + getRawText(nodes[i], settings);
          } else {
            block_text = getRawText(nodes[i], settings);
          }
        }
      }

      // Блок циататы
      if (settings.allow_quote && block.tagName === "BLOCKQUOTE") {
        block.childNodes.forEach((node) => {
          if (block_text != null) {
            block_text += " " + getRawText(node, settings);
          } else {
            block_text = getRawText(node, settings);
          }
        });
      }

      // Блок колонок
      if (settings.allow_column && block.classList.contains("columns")) {
        const node = block.childNodes[1];
        node.childNodes.forEach((node) => {
          node.childNodes[2].childNodes.forEach((_node) => {
            if (block_text != null) {
              block_text += " " + getRawText(_node, settings);
            } else {
              block_text = getRawText(_node, settings);
            }
          });
        });
      }

      // Сворачиваемый блок
      if (
        (settings.allow_toggle_title || settings.allow_toggle_content) &&
        block.classList.contains("toggle")
      ) {
        const nodes = block.childNodes[1].childNodes;
        // Заголовок, если разрешен
        if (settings.allow_toggle_title) {
          block_text = getRawText(nodes[0], settings);
        }
        // Вложенная часть, если разрешена
        if (settings.allow_toggle_content && nodes.length > 1) {
          for (let i = 1; i < nodes.length; i++) {
            if (block_text != null) {
              block_text += " " + getRawText(nodes[i], settings);
            } else {
              block_text = getRawText(nodes[i], settings);
            }
          }
        }
      }
    }

    return block_text ? block_text.trim() : block_text;
  }

  // Получение чистого текста из контента с html тегами с настройкми разрешения типов тегов
  function getRawText(node, settings) {
    let raw_text;
    if (node != null) {
      raw_text = "";
      if (node.childNodes.length == 0) {
        if (node.data) raw_text += node.data;
      } else {
        if (
          (!(node.tagName === "STRONG") || settings.allow_formatting_bold) &&
          (!(node.tagName === "EM") || settings.allow_formatting_italic) &&
          (!(node.tagName === "DEL") || settings.allow_formatting_strike) &&
          (!(node.tagName === "U") || settings.allow_formatting_underline) &&
          (!(node.tagName === "CODE") || settings.allow_formatting_code)
        ) {
          raw_text += getRawText(node.childNodes[0], settings);
        }
      }
    }
    return raw_text;
  }

  // Подсчет слов
  function countWords(v) {
    let regex = `/[${word}\d]+([-'][${word}\d]*)*/g`;
    let word = "";

    if (settings.allow_language_eng) word += "a-zA-Z";
    if (settings.allow_language_rus) word += "а-яА-Я";

    const matches = v.match(new RegExp(regex));
    return matches ? matches.length : 0;
  }
});
