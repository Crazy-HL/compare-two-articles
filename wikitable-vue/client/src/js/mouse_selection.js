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

  getSelectContent() {
    const selection = window.getSelection();
    if (selection) {
      if (selection.isCollapsed) {
        return selection.toString().trim().length ? {
          type: 'text',
          content: selection.toString().trim()
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
            content: container.innerHTML
          } : null;
        }
        return {
          type: 'html',
          content: container.innerHTML
        };
      } else {
        return selection.toString().trim().length ? {
          type: 'text',
          content: selection.toString().trim()
        } : null;
      }
    } else {
      return null;
    }
  },

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

  selectionChangeFun(callback) {
    const debounced = MouseSelection.debounce(callback, 500);
    const selectContent = MouseSelection.getSelectContent();
    if (selectContent) {
      debounced(selectContent);
    } else {
      debounced(null);
    }
  },

  // 启动选择功能，支持范围配置
  start(options = {}) {
    const { rangeSelector } = options; // 获取范围配置
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
      MouseSelection.selectionChangeFun((selectContent) => {
        if (selectContent) {
          console.log('选中的内容:', selectContent);
        } else {
          console.log('没有选择内容');
        }
      });
    }, 100));

    // 选择区域发生变化时
    rangeElement.addEventListener('selectionchange', MouseSelection.debounce(() => {
      if (selectionchangeMouseTrack) return;
      MouseSelection.selectionChangeFun((selectContent) => {
        if (selectContent) {
          console.log('选中的内容:', selectContent);
        } else {
          console.log('没有选择内容');
        }
      });
    }));

    // 双击事件
    rangeElement.addEventListener('dblclick', () => {
      MouseSelection.selectionChangeFun((selectContent) => {
        if (selectContent) {
          console.log('选中的内容:', selectContent);
        } else {
          console.log('没有选择内容');
        }
      });
    });

    // 右键事件
    rangeElement.addEventListener('contextmenu', MouseSelection.debounce(() => {
      MouseSelection.selectionChangeFun((selectContent) => {
        if (selectContent) {
          console.log('选中的内容:', selectContent);
        } else {
          console.log('没有选择内容');
        }
      });
    }, 100));
  }
};

export default MouseSelection;
