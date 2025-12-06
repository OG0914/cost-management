const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../db/cost_analysis.db');
const db = new Database(dbPath);

// 查询报价单
const quotation = db.prepare(`
  SELECT q.*, m.model_name, m.model_category, r.name as regulation_name
  FROM quotations q
  LEFT JOIN models m ON q.model_id = m.id
  LEFT JOIN regulations r ON q.regulation_id = r.id
  WHERE q.quotation_no LIKE '%MK20251207-003%'
`).get();

console.log('=== 报价单信息 ===');
console.log(JSON.stringify(quotation, null, 2));

if (quotation) {
  // 查询报价单明细
  const items = db.prepare(`
    SELECT * FROM quotation_items WHERE quotation_id = ?
  `).all(quotation.id);
  
  console.log('\n=== 报价单明细 ===');
  console.log(JSON.stringify(items, null, 2));
  
  // 按类别汇总
  const materials = items.filter(i => i.category === 'material');
  const processes = items.filter(i => i.category === 'process');
  const packaging = items.filter(i => i.category === 'packaging');
  
  console.log('\n=== 汇总 ===');
  console.log('原料总计:', materials.reduce((s, i) => s + i.subtotal, 0));
  console.log('工序总计:', processes.reduce((s, i) => s + i.subtotal, 0));
  console.log('包材总计:', packaging.reduce((s, i) => s + i.subtotal, 0));
  console.log('运费/数量:', quotation.freight_per_unit);
  
  // 计算基础成本
  const materialTotal = materials.filter(i => !i.after_overhead).reduce((s, i) => s + i.subtotal, 0);
  const processTotal = processes.reduce((s, i) => s + i.subtotal, 0);
  const packagingTotal = packaging.reduce((s, i) => s + i.subtotal, 0);
  const freightCost = quotation.include_freight_in_base ? quotation.freight_per_unit : 0;
  
  const calculatedBaseCost = materialTotal + processTotal + packagingTotal + freightCost;
  
  console.log('\n=== 基础成本计算 ===');
  console.log('原料(不含管销后算):', materialTotal);
  console.log('工序:', processTotal);
  console.log('包材:', packagingTotal);
  console.log('运费:', freightCost);
  console.log('计算的基础成本:', calculatedBaseCost);
  console.log('数据库中的基础成本:', quotation.base_cost);
}

// 查询系统配置
const configs = db.prepare('SELECT * FROM system_config').all();
console.log('\n=== 系统配置 ===');
configs.forEach(c => console.log(`${c.config_key}: ${c.config_value}`));

db.close();
