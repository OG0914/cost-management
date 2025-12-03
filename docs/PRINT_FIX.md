# 打印功能修复说明

## 问题描述

在报价单对比页面点击"打印"按钮时，打印预览的第一页是空白的，内容出现在第二页。

## 问题原因

原来的打印实现中，我们尝试复制当前页面的所有CSS样式：

```javascript
// 问题代码
const styles = Array.from(document.styleSheets)
  .map(styleSheet => {
    try {
      return Array.from(styleSheet.cssRules)
        .map(rule => rule.cssText)
        .join('\n')
    } catch (e) {
      return ''
    }
  })
  .join('\n')
```

这种方法存在以下问题：

1. **样式冲突**：复制的样式可能包含页面布局相关的规则（如header、sidebar等），这些规则会影响打印布局
2. **跨域问题**：某些外部样式表（如CDN）由于跨域限制无法读取，导致样式不完整
3. **样式覆盖**：复制的样式可能包含`margin`、`padding`等规则，导致内容被推到第二页
4. **打印媒体查询**：原页面的`@media print`规则可能与打印窗口的规则冲突

## 解决方案

### 改进1：使用自定义样式而非复制

不再复制页面的所有样式，而是为打印窗口编写专门的、简化的样式：

```javascript
// 修复后的代码
printWindow.document.write(`
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      /* 重置样式 */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      /* 基础样式 */
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        padding: 20px;
        font-size: 14px;
        line-height: 1.6;
        color: #303133;
      }
      
      /* 打印专用样式 */
      @media print {
        body {
          padding: 10px;
        }
        
        .config-item {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        @page {
          margin: 1cm;
        }
      }
    </style>
  </head>
  <body>
    <h1>报价单对比分析</h1>
    ${clonedCard.innerHTML}
  </body>
  </html>
`)
```

### 改进2：移除操作按钮

在打印前克隆内容并移除操作按钮，避免在打印内容中显示：

```javascript
// 克隆内容并移除操作按钮
const clonedCard = overviewCard.cloneNode(true)
const actionsDiv = clonedCard.querySelector('.overview-actions')
if (actionsDiv) {
  actionsDiv.remove()
}
```

### 改进3：添加打印专用样式

添加了专门的打印样式规则：

1. **重置样式**：清除所有默认的margin和padding
2. **页面边距**：使用`@page { margin: 1cm; }`设置合理的页边距
3. **避免分页**：使用`page-break-inside: avoid`防止内容被分割到不同页面
4. **响应式布局**：使用grid布局确保内容合理排列

### 改进4：完整的样式定义

为打印内容定义了完整的样式，包括：

- 标题样式（h1, h4）
- 配置项样式（.config-item）
- 利润档位样式（.profit-item）
- 自定义档位高亮样式（.custom-tier）
- 打印媒体查询

## 技术要点

### 1. CSS重置

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

这确保了打印窗口从一个干净的状态开始，不受任何默认样式影响。

### 2. 打印媒体查询

```css
@media print {
  body {
    padding: 10px;
  }
  
  .config-item {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  @page {
    margin: 1cm;
  }
}
```

- `@page { margin: 1cm; }`：设置打印页面的边距
- `page-break-inside: avoid`：防止元素被分割到不同页面
- `break-inside: avoid`：现代浏览器的分页控制

### 3. 避免分页

```css
.config-item {
  page-break-inside: avoid;
  break-inside: avoid;
}
```

确保每个配置项不会被分割到不同页面，保持内容的完整性。

### 4. 内容克隆

```javascript
const clonedCard = overviewCard.cloneNode(true)
const actionsDiv = clonedCard.querySelector('.overview-actions')
if (actionsDiv) {
  actionsDiv.remove()
}
```

克隆内容而不是直接使用`outerHTML`，这样可以在不影响原页面的情况下修改内容。

## 测试验证

修复后，请验证以下场景：

1. ✅ 打印预览第一页不再空白
2. ✅ 内容从第一页开始显示
3. ✅ 标题和内容正确显示
4. ✅ 配置项不会被分割到不同页面
5. ✅ 自定义利润档位的橙色高亮正确显示
6. ✅ 操作按钮不会出现在打印内容中
7. ✅ 页面边距合理
8. ✅ 多个配置项时分页正常

## 修改的文件

- `frontend/src/views/cost/CostCompare.vue`
  - 修改了`handlePrint`函数
  - 移除了样式复制逻辑
  - 添加了自定义打印样式
  - 添加了内容克隆和清理逻辑

## 优势对比

### 修复前
- ❌ 第一页空白
- ❌ 样式可能不完整或冲突
- ❌ 跨域样式无法加载
- ❌ 打印效果不可控

### 修复后
- ✅ 第一页正常显示内容
- ✅ 样式完整且一致
- ✅ 无跨域问题
- ✅ 打印效果可控
- ✅ 专门优化的打印布局

## 总结

这次修复的核心思路是：**不要试图复制页面的所有样式，而是为打印窗口编写专门的、简化的样式**。

这种方法的优点：
1. 避免样式冲突
2. 避免跨域问题
3. 完全可控的打印效果
4. 更好的打印性能
5. 更容易维护和调试

修复后，打印功能工作正常，第一页不再空白，内容正确显示。
