const MouseSelection = {
  getSelectContent(sourceId, element) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return null;

    // 检查选区是否在当前 element 内部
    if (!element.contains(selection.anchorNode) || !element.contains(selection.focusNode)) {
      return null;
    }

    const textContent = selection.toString().trim();
    if (textContent.length) {
      return {
        source: sourceId,  // 选中内容的来源（Div1 或 Div3）
        content: textContent
      };
    }
    return null;
  },

  selectionChangeFun(callback, sourceId, element) {
    element.addEventListener("mouseup", () => {
      const selectContent = MouseSelection.getSelectContent(sourceId, element);
      if (selectContent) {
        callback(selectContent);
      }
    });
  },

  start(sourceId, element, callback) {
    MouseSelection.selectionChangeFun(callback, sourceId, element);
  }
};

export default MouseSelection;
