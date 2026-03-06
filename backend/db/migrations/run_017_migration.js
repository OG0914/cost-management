/**
 * 执行迁移脚本 017：添加物料价格变更提醒系统
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const dbManager = require('../database');

async function runMigration() {
  try {
    console.log('正在连接数据库...');
    console.log('数据库URL:', process.env.DATABASE_URL ? '已配置' : '未配置');
    await dbManager.initialize();
    console.log('数据库连接成功');

    // 先创建 material_price_changes 表（因为 notifications 表依赖它）
    const checkPriceChanges = await dbManager.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'material_price_changes'
      );
    `);
    
    if (checkPriceChanges.rows[0].exists) {
      console.log('表 material_price_changes 已存在，跳过创建');
    } else {
      console.log('创建 material_price_changes 表...');
      await dbManager.query(`
        CREATE TABLE material_price_changes (
          id SERIAL PRIMARY KEY,
          material_id INTEGER NOT NULL REFERENCES materials(id),
          old_price DECIMAL(12,4) NOT NULL,
          new_price DECIMAL(12,4) NOT NULL,
          price_change_rate DECIMAL(8,6),
          changed_by INTEGER NOT NULL REFERENCES users(id),
          changed_at TIMESTAMP DEFAULT NOW(),
          is_processed BOOLEAN DEFAULT false
        );
      `);
      console.log('✓ material_price_changes 表创建成功');
    }

    // 检查表是否已存在
    const checkTable = await dbManager.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('表 notifications 已存在，跳过创建');
    } else {
      console.log('创建 notifications 表...');
      await dbManager.query(`
        CREATE TABLE notifications (
          id SERIAL PRIMARY KEY,
          type VARCHAR(50) NOT NULL CHECK(type IN ('material_price_changed', 'system', 'review')),
          title VARCHAR(200) NOT NULL,
          content TEXT,
          material_id INTEGER REFERENCES materials(id),
          price_change_id INTEGER REFERENCES material_price_changes(id),
          model_id INTEGER REFERENCES models(id),
          standard_cost_id INTEGER REFERENCES standard_costs(id),
          quotation_id INTEGER REFERENCES quotations(id),
          user_id INTEGER REFERENCES users(id),
          role VARCHAR(20),
          is_read BOOLEAN DEFAULT false,
          is_dismissed BOOLEAN DEFAULT false,
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP
        );
      `);
      console.log('✓ notifications 表创建成功');
    }

    // 检查 user_notifications 表
    const checkUserNotifications = await dbManager.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_notifications'
      );
    `);
    
    if (checkUserNotifications.rows[0].exists) {
      console.log('表 user_notifications 已存在，跳过创建');
    } else {
      console.log('创建 user_notifications 表...');
      await dbManager.query(`
        CREATE TABLE user_notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
          is_read BOOLEAN DEFAULT false,
          is_dismissed BOOLEAN DEFAULT false,
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, notification_id)
        );
      `);
      console.log('✓ user_notifications 表创建成功');
    }

    // 创建索引
    console.log('创建索引...');
    const indexes = [
      { name: 'idx_price_changes_material_id', sql: 'CREATE INDEX IF NOT EXISTS idx_price_changes_material_id ON material_price_changes(material_id);' },
      { name: 'idx_price_changes_changed_at', sql: 'CREATE INDEX IF NOT EXISTS idx_price_changes_changed_at ON material_price_changes(changed_at);' },
      { name: 'idx_notifications_type', sql: 'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);' },
      { name: 'idx_notifications_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);' },
      { name: 'idx_user_notifications_user_id', sql: 'CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);' },
      { name: 'idx_user_notifications_notification_id', sql: 'CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_id ON user_notifications(notification_id);' }
    ];

    for (const idx of indexes) {
      try {
        await dbManager.query(idx.sql);
        console.log(`✓ 索引 ${idx.name} 创建成功`);
      } catch (err) {
        console.log(`⊘ 索引 ${idx.name} 已存在或创建失败: ${err.message}`);
      }
    }

    console.log('\n========================================');
    console.log('迁移完成：物料价格变更提醒系统表结构已创建');
    console.log('========================================');

  } catch (err) {
    console.error('迁移失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await dbManager.close();
    process.exit(0);
  }
}

runMigration();
