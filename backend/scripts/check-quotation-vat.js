require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const logger = require('../utils/logger');
const db = require('../db/database');

(async () => {
  await db.initialize();
  
  const pool = db.getPool();
  const result = await pool.query("SELECT id, quotation_no, vat_rate FROM quotations WHERE quotation_no = 'MK20251225-004'");
  
  if (result.rows.length > 0) {
    const q = result.rows[0];
    logger.info('报价单:', q.quotation_no);
    logger.info('vat_rate:', q.vat_rate);
    logger.info('vat_rate type:', typeof q.vat_rate);

    // 测试 parseFloat
    const parsed = parseFloat(q.vat_rate);
    logger.info('parseFloat(vat_rate):', parsed);

    // 测试计算
    const priceBase = 17.2364;
    logger.info('\n计算测试:');
    logger.info('priceBase * (1 + vat_rate):', priceBase * (1 + q.vat_rate));
    logger.info('priceBase * (1 + parseFloat(vat_rate)):', priceBase * (1 + parsed));
  }
  
  await db.close();
})();
