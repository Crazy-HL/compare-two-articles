export default class TextSelectionTool {
    constructor(options) {
        // 默认配置
        this.options = Object.assign({
            selector: document.body, // 要在其中进行选择的区域，默认为整个文档
            buttonId: null,          // 重置按钮的ID，若为空则不启用
            outputId: null,          // 显示提取结果的容器ID，若为空则不显示
            boxStyle: {              // 矩形框样式
                border: '2px dashed rgba(0, 0, 0, 0.7)',
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
            }
        }, options);
  
        // 初始化组件
        this.init();
    }
  
    init() {
        // 获取要操作的 DOM 元素
        this.selectionBox = document.createElement('div');
        this.selectionBox.style.position = 'absolute';
        this.selectionBox.style.display = 'none';
        this.selectionBox.className = 'selection-box';
        Object.assign(this.selectionBox.style, this.options.boxStyle);
        document.body.appendChild(this.selectionBox);
  
        console.log('options=>', this.options);
  
        // 获取输出区域
        if (this.options.outputId) {
            this.outputDiv = document.getElementById(this.options.outputId);
        } else {
            this.outputDiv = null;
        }
  
        // 鼠标按下、移动和松开事件
        this.isMouseDown = false;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.clickCount = 0; // 用于记录点击次数
  
        // 绑定事件
        this.bindEvents();
  
        // 如果有按钮，绑定重置按钮事件
        if (this.options.buttonId) {
            this.resetBtn = document.getElementById(this.options.buttonId);
            if (this.resetBtn) {
                this.resetBtn.addEventListener('click', () => this.reset());
            }
        }
    }
  
    bindEvents() {
        this.options.selector.addEventListener('mousedown', (e) => this.onMouseDown(e));
    }
  
    onMouseDown(e) {
        // 第一次点击，确定矩形的起点
        if (this.clickCount === 0) {
            this.isMouseDown = true;
            this.startX = e.pageX;
            this.startY = e.pageY;
  
            console.log('Start at:', this.startX, this.startY);
  
            // 显示选择框
            this.selectionBox.style.display = 'block';
            this.selectionBox.style.left = `${this.startX}px`;
            this.selectionBox.style.top = `${this.startY}px`;
            this.selectionBox.style.width = '0px';
            this.selectionBox.style.height = '0px';
  
            this.clickCount++; // 增加点击次数
        } 
        // 第二次点击，确定矩形的终点
        else if (this.clickCount === 1) {
            this.endX = e.pageX;
            this.endY = e.pageY;
  
            console.log('End at:', this.endX, this.endY);
  
            // 计算矩形框的宽度和高度
            let width = Math.abs(this.endX - this.startX);
            let height = Math.abs(this.endY - this.startY);
  
            // 设置矩形框的大小和位置
            this.selectionBox.style.width = `${width}px`;
            this.selectionBox.style.height = `${height}px`;
            this.selectionBox.style.left = this.endX < this.startX ? `${this.endX}px` : `${this.startX}px`;
            this.selectionBox.style.top = this.endY < this.startY ? `${this.endY}px` : `${this.startY}px`;
  
            // 获取矩形框的坐标和尺寸
            let rect = this.selectionBox.getBoundingClientRect();
  
            // 提取矩形框内的文本
            this.extractTextFromRectangle(rect);
  
            this.clickCount = 0; // 重置点击次数，准备下次选择
        }
    }
  
    extractTextFromRectangle(rect) {
        let selectedText = "";
        let elements = document.body.getElementsByTagName('*');
        
        for (let element of elements) {
            let elementRect = element.getBoundingClientRect();
  
            // 检查元素是否与矩形框相交，并且元素包含可显示文本
            if (this.isIntersect(elementRect, rect) && this.hasTextContent(element)) {
                selectedText += element.innerText.trim() + "\n";
            }
        }
  
        // 如果指定了输出区域，显示提取的文本
        if (this.outputDiv) {
            this.outputDiv.textContent = selectedText ? selectedText : "未选中任何文本！";
        }
    }
  
    isIntersect(rect1, rect2) {
        // 判断两个矩形是否相交
        return !(rect1.right < rect2.left || rect1.left > rect2.right ||
                 rect1.bottom < rect2.top || rect1.top > rect2.bottom);
    }
  
    hasTextContent(element) {
        // 检查元素是否包含可显示文本
        return element.innerText && element.innerText.trim().length > 0;
    }
  
    reset() {
        // 重置选择框和输出区域
        this.selectionBox.style.display = 'none';
        if (this.outputDiv) {
            this.outputDiv.textContent = '';
        }
    }
  }
  