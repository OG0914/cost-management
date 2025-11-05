/**
 * 测试千分位格式化功能
 */

// 复制格式化函数
function formatNumber(value, decimals = 4) {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  
  const num = Number(value)
  if (isNaN(num)) {
    return ''
  }
  
  // 保留指定小数位
  const fixed = num.toFixed(decimals)
  
  // 分离整数和小数部分
  const parts = fixed.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]
  
  // 整数部分添加千分位
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  // 组合整数和小数部分
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger
}

function parseFormattedNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  
  // 移除千分位逗号
  const cleaned = String(value).replace(/,/g, '')
  const num = Number(cleaned)
  
  return isNaN(num) ? null : num
}

console.log('测试千分位格式化功能：\n');

const testCases = [
  { input: 1234.5678, expected: '1,234.5678' },
  { input: 1234567.89, expected: '1,234,567.8900' },
  { input: 0.1234, expected: '0.1234' },
  { input: 1000000, expected: '1,000,000.0000' },
  { input: 123, expected: '123.0000' },
  { input: 12345678.9012, expected: '12,345,678.9012' },
  { input: null, expected: '' },
  { input: undefined, expected: '' },
  { input: '', expected: '' }
];

console.log('formatNumber 测试:');
console.log('-----------------------------------');
testCases.forEach(({ input, expected }) => {
  const result = formatNumber(input);
  const status = result === expected ? '✓' : '✗';
  console.log(`${status} formatNumber(${input}) = "${result}" ${result === expected ? '' : `(期望: "${expected}")`}`);
});

console.log('\nparseFormattedNumber 测试:');
console.log('-----------------------------------');
const parseTestCases = [
  { input: '1,234.5678', expected: 1234.5678 },
  { input: '1,234,567.89', expected: 1234567.89 },
  { input: '123', expected: 123 },
  { input: null, expected: null },
  { input: '', expected: null }
];

parseTestCases.forEach(({ input, expected }) => {
  const result = parseFormattedNumber(input);
  const status = result === expected ? '✓' : '✗';
  console.log(`${status} parseFormattedNumber("${input}") = ${result} ${result === expected ? '' : `(期望: ${expected})`}`);
});

console.log('\n自定义小数位测试:');
console.log('-----------------------------------');
console.log('formatNumber(1234.5678, 2) =', formatNumber(1234.5678, 2));
console.log('formatNumber(1234567.89, 0) =', formatNumber(1234567.89, 0));
console.log('formatNumber(0.123456, 6) =', formatNumber(0.123456, 6));

console.log('\n所有测试完成！');
