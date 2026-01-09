# 产品型号图片功能 实施计划

**目标：** 为产品型号添加多图片管理功能，支持主图和附图

**架构：** 新建 model_images 表存储图片信息，使用 multer 处理上传，图片存储在本地 `uploads/models/{model_id}/` 目录

**技术栈：** Node.js, Express, Multer, PostgreSQL, Vue 3, Element Plus

---

## 任务 1: 创建数据库表

**文件：**
- 执行: SQL 脚本

**步骤1: 创建 model_images 表**

```sql
CREATE TABLE IF NOT EXISTS model_images (
  id SERIAL PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_images_model_id ON model_images(model_id);
CREATE INDEX IF NOT EXISTS idx_model_images_primary ON model_images(model_id, is_primary) WHERE is_primary = true;
```

**步骤2: 验证表创建成功**

运行: `SELECT * FROM model_images LIMIT 1;`
预期: 空结果，无错误

---

## 任务 2: 创建 ModelImage 模型

**文件：**
- 创建: `backend/models/ModelImage.js`

**步骤1: 创建模型文件**

```javascript
/** 型号图片数据模型 */
const dbManager = require('../db/database');

class ModelImage {
  /** 根据型号ID获取所有图片 */
  static async findByModelId(modelId) {
    const result = await dbManager.query(
      `SELECT * FROM model_images WHERE model_id = $1 ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
      [modelId]
    );
    return result.rows;
  }

  /** 获取型号主图 */
  static async findPrimaryByModelId(modelId) {
    const result = await dbManager.query(
      `SELECT * FROM model_images WHERE model_id = $1 AND is_primary = true LIMIT 1`,
      [modelId]
    );
    return result.rows[0] || null;
  }

  /** 根据ID查找图片 */
  static async findById(id) {
    const result = await dbManager.query(`SELECT * FROM model_images WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  /** 创建图片记录 */
  static async create(data) {
    const { model_id, file_name, file_path, file_size, is_primary = false, sort_order = 0 } = data;
    const result = await dbManager.query(
      `INSERT INTO model_images (model_id, file_name, file_path, file_size, is_primary, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [model_id, file_name, file_path, file_size, is_primary, sort_order]
    );
    return result.rows[0];
  }

  /** 设置主图（同时取消其他主图） */
  static async setPrimary(modelId, imageId) {
    await dbManager.transaction(async (client) => {
      await client.query(`UPDATE model_images SET is_primary = false WHERE model_id = $1`, [modelId]);
      await client.query(`UPDATE model_images SET is_primary = true WHERE id = $1 AND model_id = $2`, [imageId, modelId]);
    });
  }

  /** 删除图片记录 */
  static async delete(id) {
    const result = await dbManager.query(`DELETE FROM model_images WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0];
  }

  /** 检查型号是否有主图 */
  static async hasPrimary(modelId) {
    const result = await dbManager.query(
      `SELECT COUNT(*) as count FROM model_images WHERE model_id = $1 AND is_primary = true`,
      [modelId]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  /** 获取型号图片数量 */
  static async countByModelId(modelId) {
    const result = await dbManager.query(
      `SELECT COUNT(*) as count FROM model_images WHERE model_id = $1`,
      [modelId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = ModelImage;
```

**步骤2: 提交**

```bash
git add backend/models/ModelImage.js
git commit -m "feat: add ModelImage model"
```

---

## 任务 3: 创建图片上传控制器

**文件：**
- 创建: `backend/controllers/master/modelImageController.js`

**步骤1: 创建控制器文件**

```javascript
/** 型号图片控制器 */
const path = require('path');
const fs = require('fs').promises;
const ModelImage = require('../../models/ModelImage');
const Model = require('../../models/Model');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/models');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** 确保上传目录存在 */
const ensureDir = async (dir) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

/** 上传图片 */
exports.uploadImages = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要上传的图片' });
    }

    const model = await Model.findById(id);
    if (!model) {
      return res.status(404).json({ success: false, message: '型号不存在' });
    }

    const modelDir = path.join(UPLOAD_DIR, String(id));
    await ensureDir(modelDir);

    const hasPrimary = await ModelImage.hasPrimary(id);
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPrimary = !hasPrimary && i === 0;
      const fileName = `${Date.now()}_${file.originalname}`;
      const filePath = `/uploads/models/${id}/${fileName}`;
      const fullPath = path.join(modelDir, fileName);

      await fs.rename(file.path, fullPath);

      const image = await ModelImage.create({
        model_id: id,
        file_name: file.originalname,
        file_path: filePath,
        file_size: file.size,
        is_primary: isPrimary
      });
      results.push(image);
    }

    res.json({ success: true, data: results, message: '上传成功' });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({ success: false, message: '上传失败' });
  }
};

/** 获取型号所有图片 */
exports.getImages = async (req, res) => {
  try {
    const { id } = req.params;
    const images = await ModelImage.findByModelId(id);
    res.json({ success: true, data: images });
  } catch (error) {
    console.error('获取图片失败:', error);
    res.status(500).json({ success: false, message: '获取图片失败' });
  }
};

/** 设置主图 */
exports.setPrimary = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const image = await ModelImage.findById(imageId);
    
    if (!image || image.model_id !== parseInt(id)) {
      return res.status(404).json({ success: false, message: '图片不存在' });
    }

    await ModelImage.setPrimary(id, imageId);
    res.json({ success: true, message: '设置成功' });
  } catch (error) {
    console.error('设置主图失败:', error);
    res.status(500).json({ success: false, message: '设置主图失败' });
  }
};

/** 删除图片 */
exports.deleteImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const image = await ModelImage.findById(imageId);
    
    if (!image || image.model_id !== parseInt(id)) {
      return res.status(404).json({ success: false, message: '图片不存在' });
    }

    const fullPath = path.join(__dirname, '../../', image.file_path);
    try {
      await fs.unlink(fullPath);
    } catch (e) {
      console.warn('删除文件失败:', e.message);
    }

    await ModelImage.delete(imageId);

    if (image.is_primary) {
      const remaining = await ModelImage.findByModelId(id);
      if (remaining.length > 0) {
        await ModelImage.setPrimary(id, remaining[0].id);
      }
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({ success: false, message: '删除图片失败' });
  }
};
```

**步骤2: 提交**

```bash
git add backend/controllers/master/modelImageController.js
git commit -m "feat: add model image controller"
```

---

## 任务 4: 添加图片路由

**文件：**
- 修改: `backend/routes/modelRoutes.js`

**步骤1: 添加图片上传配置和路由**

在文件顶部导入部分添加：
```javascript
const modelImageController = require('../controllers/master/modelImageController');
```

修改 multer 配置（在现有配置后添加图片上传配置）：
```javascript
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/temp'));
  },
  filename: (req, file, cb) => {
    cb(null, `temp_${Date.now()}_${file.originalname}`);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPG/PNG/WEBP 格式'));
    }
  }
});
```

在 `router.get('/:id', ...)` 之后添加图片路由：
```javascript
// 型号图片管理
router.get('/:id/images', modelImageController.getImages);
router.post('/:id/images', checkRole('admin', 'purchaser', 'producer'), imageUpload.array('images', 10), modelImageController.uploadImages);
router.put('/:id/images/:imageId/primary', checkRole('admin', 'purchaser', 'producer'), modelImageController.setPrimary);
router.delete('/:id/images/:imageId', checkRole('admin', 'purchaser', 'producer'), modelImageController.deleteImage);
```

**步骤2: 创建临时上传目录**

```bash
mkdir -p backend/uploads/temp
mkdir -p backend/uploads/models
```

**步骤3: 提交**

```bash
git add backend/routes/modelRoutes.js
git commit -m "feat: add model image routes"
```

---

## 任务 5: 修改 Model 查询返回主图

**文件：**
- 修改: `backend/models/Model.js`

**步骤1: 修改 findAll 方法**

在 `findAll` 方法的 SQL 中添加主图子查询：
```javascript
static async findAll() {
  const result = await dbManager.query(`
    SELECT m.*, r.name as regulation_name, 
           COALESCE(bom.bom_count, 0)::int as bom_count,
           img.file_path as primary_image
    FROM models m
    LEFT JOIN regulations r ON m.regulation_id = r.id
    LEFT JOIN (SELECT model_id, COUNT(*) as bom_count FROM model_bom_materials WHERE is_active = true GROUP BY model_id) bom ON m.id = bom.model_id
    LEFT JOIN (SELECT DISTINCT ON (model_id) model_id, file_path FROM model_images WHERE is_primary = true) img ON m.id = img.model_id
    ORDER BY m.created_at DESC
  `);
  return result.rows;
}
```

**步骤2: 类似修改其他查询方法**

修改 `findAllWithBomCount`、`findActive`、`findByRegulationId`、`findByModelCategoryAndRegulation`、`findByModelCategory`、`findBySeries` 等方法，添加 `primary_image` 字段。

**步骤3: 提交**

```bash
git add backend/models/Model.js
git commit -m "feat: add primary_image to model queries"
```

---

## 任务 6: 添加静态文件服务

**文件：**
- 修改: `backend/app.js`

**步骤1: 添加静态文件路由**

在 app.js 中添加（如果尚未存在）：
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

**步骤2: 提交**

```bash
git add backend/app.js
git commit -m "feat: add static file serving for uploads"
```

---

## 任务 7: 前端 - 添加图片 API

**文件：**
- 修改或创建: `frontend/src/api/model.js`

**步骤1: 添加图片相关 API 方法**

```javascript
// 获取型号图片
export const getModelImages = (modelId) => request.get(`/models/${modelId}/images`);

// 上传型号图片
export const uploadModelImages = (modelId, formData) => request.post(`/models/${modelId}/images`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// 设置主图
export const setModelPrimaryImage = (modelId, imageId) => request.put(`/models/${modelId}/images/${imageId}/primary`);

// 删除图片
export const deleteModelImage = (modelId, imageId) => request.delete(`/models/${modelId}/images/${imageId}`);
```

**步骤2: 提交**

```bash
git add frontend/src/api/model.js
git commit -m "feat: add model image API methods"
```

---

## 任务 8: 前端 - 修改型号管理页面

**文件：**
- 修改: `frontend/src/views/model/ModelManage.vue`

**步骤1: 表格添加产品图列**

在表格列中添加：
```vue
<el-table-column label="产品图" width="80" align="center">
  <template #default="{ row }">
    <el-image 
      v-if="row.primary_image"
      :src="row.primary_image"
      :preview-src-list="[row.primary_image]"
      fit="cover"
      style="width: 50px; height: 50px; border-radius: 4px;"
    />
    <el-icon v-else :size="24" color="#c0c4cc"><Picture /></el-icon>
  </template>
</el-table-column>
```

**步骤2: 编辑弹窗添加图片上传区域**

在表单中添加图片上传组件：
```vue
<el-form-item label="产品图片">
  <el-upload
    v-model:file-list="imageList"
    :action="`${baseURL}/models/${editForm.id}/images`"
    :headers="uploadHeaders"
    :on-success="handleUploadSuccess"
    :on-error="handleUploadError"
    :before-upload="beforeImageUpload"
    list-type="picture-card"
    accept=".jpg,.jpeg,.png,.webp"
    multiple
  >
    <el-icon><Plus /></el-icon>
    <template #tip>
      <div class="el-upload__tip">支持 JPG/PNG/WEBP，单张最大 5MB</div>
    </template>
    <template #file="{ file }">
      <div class="image-item">
        <el-image :src="file.url" fit="cover" />
        <div class="image-actions">
          <el-button v-if="!file.is_primary" size="small" @click="setAsPrimary(file)">设为主图</el-button>
          <el-button size="small" type="danger" @click="removeImage(file)">删除</el-button>
        </div>
        <el-tag v-if="file.is_primary" type="success" size="small" class="primary-tag">主图</el-tag>
      </div>
    </template>
  </el-upload>
</el-form-item>
```

**步骤3: 添加相关方法和样式**

添加图片处理相关的方法（上传成功、删除、设为主图等）。

**步骤4: 提交**

```bash
git add frontend/src/views/model/ModelManage.vue
git commit -m "feat: add image management to model page"
```

---

## 任务 9: 测试验证

**步骤1: 启动后端服务**
```bash
cd backend && npm run dev
```

**步骤2: 启动前端服务**
```bash
cd frontend && npm run dev
```

**步骤3: 测试流程**
1. 打开型号管理页面
2. 编辑一个型号，上传图片
3. 验证图片显示、设为主图、删除功能
4. 验证列表页主图显示

**步骤4: 最终提交**
```bash
git add .
git commit -m "feat: complete model image feature"
```

---

## 文件清单

| 操作 | 文件路径 |
|------|----------|
| 创建 | `backend/models/ModelImage.js` |
| 创建 | `backend/controllers/master/modelImageController.js` |
| 修改 | `backend/routes/modelRoutes.js` |
| 修改 | `backend/models/Model.js` |
| 修改 | `backend/app.js` |
| 修改 | `frontend/src/api/model.js` |
| 修改 | `frontend/src/views/model/ModelManage.vue` |
