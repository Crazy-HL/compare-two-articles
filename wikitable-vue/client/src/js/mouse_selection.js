import HighlightText from './highlight';  // 导入高亮工具包
const MouseSelection = {
  debounce(fn, time = 500) {
    let timeout = null;
    return function () {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        fn.apply(this, arguments);
      }, time);
    };
  },

  // 获取选中的内容，分为文本和 HTML 类型
  getSelectContent(customId = null) {
    const selection = window.getSelection();
    if (selection) {
      if (selection.isCollapsed) {
        return selection.toString().trim().length ? {
          type: 'text',
          content: selection.toString().trim(),
          customId: customId // 将 customId 加入返回数据
        } : null;
      }

      const range = selection.getRangeAt(0);
      const rangeClone = range.cloneContents();
      if (rangeClone.childElementCount > 0) {
        const container = document.createElement('div');
        container.appendChild(rangeClone);
        if (!selection.toString().trim().length) {
          const hasSpNode = MouseSelection.getSpNode(container);
          return hasSpNode ? {
            type: 'html',
            content: container.innerHTML,
            customId: customId // 将 customId 加入返回数据
          } : null;
        }
        return {
          type: 'html',
          content: container.innerHTML,
          customId: customId // 将 customId 加入返回数据
        };
      } else {
        return selection.toString().trim().length ? {
          type: 'text',
          content: selection.toString().trim(),
          customId: customId // 将 customId 加入返回数据
        } : null;
      }
    } else {
      return null;
    }
  },

  // 获取选区中的特殊节点（如 iframe, img 等）
  getSpNode(parent) {
    const nodeNameList = ['iframe', 'svg', 'img', 'audio', 'video'];
    const inpList = ['input', 'textarea', 'select'];
    return Array.from(parent.children).some((node) => {
      if (nodeNameList.includes(node.nodeName.toLowerCase())) return true;
      if (inpList.includes(node.nodeName.toLowerCase()) && node.value.trim().length) return true;
      if (node.children) {
        return MouseSelection.getSpNode(node);
      }
      return false;
    });
  },

  // 处理选区变动后的回调，并返回选中的内容
  selectionChangeFun(callback, customId) {
    const selectContent = MouseSelection.getSelectContent(customId);
    if (selectContent) {
      callback(selectContent); // 调用回调并传递选中的内容
      return selectContent; // 返回选中的内容
    } else {
      callback(null); // 如果没有选中内容，返回 null
      return null;
    }
  },

  // 启动选择功能，支持范围配置
  start(options = {}) {
    const { rangeSelector, customId } = options; // 获取范围配置
    const rangeElement = rangeSelector ? document.querySelector(rangeSelector) : document;

    if (!rangeElement) {
      console.error('Invalid range selector');
      return;
    }

    let selectionchangeMouseTrack = false;

    // 鼠标按下事件
    rangeElement.addEventListener('mousedown', () => {
      selectionchangeMouseTrack = true;
    });

    // 鼠标抬起事件
    rangeElement.addEventListener('mouseup', MouseSelection.debounce(() => {
      const selectedContent = MouseSelection.selectionChangeFun((selectContent) => {
        if (selectContent) {
          // 返回选中的内容，这里可以处理选中的内容
          console.log(`选中的内容来自 ${customId}:`, selectContent);
          HighlightText.highlightSelection(); // 调用高亮工具包中的方法进行高亮
        } else {
          console.log("没有选择内容");
        }
      }, customId); // 传递 customId
      return selectedContent;
    }, 100));

    // 选择区域发生变化时
    rangeElement.addEventListener('selectionchange', MouseSelection.debounce(() => {
      if (selectionchangeMouseTrack) return;
      const selectedContent = MouseSelection.selectionChangeFun((selectContent) => {
        if (selectContent) {
          // 返回选中的内容，这里可以处理选中的内容
          // console.log(`选中的内容来自 ${customId}:`, selectContent);
        } else {
          console.log("没有选择内容");
        }
      }, customId); // 传递 customId
      return selectedContent;
    }));

    // // 双击事件
    // rangeElement.addEventListener('dblclick', () => {
    //   const selectedContent = MouseSelection.selectionChangeFun((selectContent) => {
    //     if (selectContent) {
    //       // 返回选中的内容，这里可以处理选中的内容
    //       // console.log(`选中的内容来自 ${customId}:`, selectContent);
    //     } else {
    //       console.log("没有选择内容");
    //     }
    //   }, customId); // 传递 customId
    //   return selectedContent;
    // });

    // // 右键事件
    // rangeElement.addEventListener('contextmenu', MouseSelection.debounce(() => {
    //   const selectedContent = MouseSelection.selectionChangeFun((selectContent) => {
    //     if (selectContent) {
    //       // 返回选中的内容，这里可以处理选中的内容
    //       // console.log(`选中的内容来自 ${customId}:`, selectContent);
    //     } else {
    //       console.log("没有选择内容");
    //     }
    //   }, customId); // 传递 customId
    //   return selectedContent;
    // }, 100));
  }
};

export default MouseSelection;
