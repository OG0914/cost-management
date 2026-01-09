# 原料自动创建与类别识别设计

## 概述
在添加 BOM 或导入原料时，自动检查品号唯一性，不存在则创建原料，并从原料名称自动识别归属类别。

## 类别识别规则

1. 从原料名称中提取冒号（`：`或`:`）前的文字作为前缀
2. 将前缀与系统配置中的类别名称进行精确匹配
3. 匹配成功则设置类别，否则类别留空

**示例**：
- "纸箱：Bin Ali 9500" → 提取 "纸箱" → 匹配类别 "纸箱" ✓
- "塑料-PP颗粒" → 无冒号，类别留空
- "泡沫：EPE" → 若无 "泡沫" 类别，类别留空

## 生效场景

| 场景 | 实现位置 | 说明 |
|------|---------|------|
| BOM导入 | `bomController.importBom` | 已有自动创建原料逻辑，增加类别识别 |
| 手动添加BOM项 | `bomController.createBomItem` | 若品号不存在，自动创建原料并识别类别 |
| 原料管理导入 | `materialController.importMaterials` | 若Excel未填类别，自动从名称识别；重复品号需用户确认 |

## 核心工具函数

文件：`backend/utils/categoryMatcher.js`

```javascript
/**
 * 从原料名称识别类别
 * @param {string} materialName - 原料名称
 * @param {Array} categories - 类别列表 [{name, sort}]
 * @returns {string|null} 匹配的类别名称或null
 */
function matchCategory(materialName, categories) {
  if (!materialName || !categories?.length) return null;
  
  // 查找冒号位置（支持中英文冒号）
  let colonIndex = materialName.indexOf('：');
  if (colonIndex === -1) colonIndex = materialName.indexOf(':');
  if (colonIndex === -1) return null;
  
  const prefix = materialName.substring(0, colonIndex).trim();
  const matched = categories.find(c => c.name === prefix);
  return matched ? matched.name : null;
}

module.exports = { matchCategory };
```

## 品号唯一性检查与处理

### 原料导入时
1. 后端先解析 Excel，检查所有品号
2. 返回重复品号列表给前端
3. 前端弹窗显示重复品号，让用户选择：
   - 跳过这些重复项
   - 更新这些重复项（覆盖现有数据）
   - 取消导入
4. 用户确认后，后端按选择执行

### 手动添加BOM项时
- 输入品号后实时检查
- 不存在时提示创建新原料
- 存在时直接使用

### BOM导入时
- 品号不存在自动创建（保持现有逻辑）
- 增加类别自动识别

## API 变更

| API | 变更 |
|-----|------|
| `POST /materials/import` | 新增两阶段导入：1）预检查返回重复品号 2）确认后执行 |
| `POST /materials/check-or-create` | 新增：检查品号，不存在则创建 |
| `POST /bom` (createBomItem) | 增强：支持传入品号，自动查找或创建原料 |
| `POST /bom/import` | 增强：创建原料时自动识别类别 |

## 前端变更

- **原料导入**：增加重复品号确认弹窗（跳过/更新/取消）
- **BOM添加原料**：支持输入品号，不存在时引导创建新原料
