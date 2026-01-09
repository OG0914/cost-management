/** 创建 model_images 表 */
const { Client } = require('pg');

const sql = `
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
`;

async function main() {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  const client = new Client(process.env.DATABASE_URL);
  try {
    await client.connect();
    await client.query(sql);
    console.log('model_images 表创建成功');
  } catch (e) {
    console.error('创建失败:', e.message);
  } finally {
    await client.end();
  }
}

main();
