require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../db/database');

(async () => {
  await db.initialize();
  
  // 先查询报价单
  const q = await db.getPool().query("SELECT id, quotation_no FROM quotations WHERE quotation_no = 'MK20251225-004'");
  console.log('报价单:', q.rows);
  
  if (q.rows.length === 0) {
    console.log('报价单不存在');
    await db.close();
    return;
  }
  
  const quotationId = q.rows[0].id;
  console.log('报价单ID:', quotationId);
  
  const r = await db.getPool().query(
    'SELECT item_name, usage_amount, unit_price, subtotal, category FROM quotation_items WHERE quotation_id = $1',
    [quotationId]
  );
  
  console.log('\n所有明细 (' + r.rows.length + ' 条):');
  r.rows.forEach(row => {
    console.log(`[${row.category}] ${row.item_name}: subtotal=${row.subtotal}`);
  });
  
  const processItems = r.rows.filter(row => row.category === 'process');
  console.log('\n工序明细 (' + processItems.length + ' 条):');
  processItems.forEach(row => {
    const calculated = parseFloat(row.usage_amount) * parseFloat(row.unit_price);
    console.log(`${row.item_name}: usage=${row.usage_amount}, price=${row.unit_price}, subtotal=${row.subtotal}, calculated=${calculated.toFixed(4)}`);
  });
  
  const total = processItems.reduce((sum, row) => sum + parseFloat(row.subtotal), 0);
  console.log('\n工序总计:', total);
  console.log('乘以1.56后:', (total * 1.56).toFixed(4));
  
  await db.close();
})();
