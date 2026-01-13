/**
 * 测试脚本：模拟 /api/dashboard/weekly-quotations 接口逻辑（修复后版本）
 * 直接调用后端函数，检查返回的数据
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

// 格式化日期为本地时区 YYYY-MM-DD 格式（与后端保持一致）
const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

async function testWeeklyQuotations() {
    const client = new Client(process.env.DATABASE_URL);

    try {
        await client.connect();
        console.log('数据库连接成功\n');

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        console.log(`当前时间: ${now.toLocaleString('zh-CN')}`);
        console.log(`当前年份: ${currentYear}, 当前月份: ${currentMonth + 1}\n`);

        // 本月开始和结束
        const thisMonthStart = new Date(currentYear, currentMonth, 1);
        const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0);

        // 上月开始和结束
        const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth, 0);

        console.log('=== 日期范围（修复后：使用本地时区）===');
        console.log(`本月: ${formatLocalDate(thisMonthStart)} ~ ${formatLocalDate(thisMonthEnd)}`);
        console.log(`上月: ${formatLocalDate(lastMonthStart)} ~ ${formatLocalDate(lastMonthEnd)}\n`);

        // 获取本月数据
        const thisMonthData = await getWeeklyData(client, thisMonthStart, thisMonthEnd);
        console.log('=== 本月每周报价数量 (thisMonth) ===');
        console.log(`第1周 (1-7日):   ${thisMonthData[0]}`);
        console.log(`第2周 (8-14日):  ${thisMonthData[1]}`);
        console.log(`第3周 (15-21日): ${thisMonthData[2]}`);
        console.log(`第4周 (22日+):   ${thisMonthData[3]}`);
        console.log(`数组: [${thisMonthData.join(', ')}]\n`);

        // 获取上月数据
        const lastMonthData = await getWeeklyData(client, lastMonthStart, lastMonthEnd);
        console.log('=== 上月每周报价数量 (lastMonth) ===');
        console.log(`第1周 (1-7日):   ${lastMonthData[0]}`);
        console.log(`第2周 (8-14日):  ${lastMonthData[1]}`);
        console.log(`第3周 (15-21日): ${lastMonthData[2]}`);
        console.log(`第4周 (22日+):   ${lastMonthData[3]}`);
        console.log(`数组: [${lastMonthData.join(', ')}]\n`);

        // 模拟API响应
        console.log('=== 模拟 API 响应 ===');
        console.log(JSON.stringify({
            success: true,
            data: {
                thisMonth: thisMonthData,
                lastMonth: lastMonthData
            },
            message: '获取周报价统计成功'
        }, null, 2));

    } catch (err) {
        console.error('测试失败:', err.message);
    } finally {
        await client.end();
        console.log('\n数据库连接已关闭');
    }
}

// 复制自 dashboardController.js 的 getWeeklyData 函数（修复后版本）
async function getWeeklyData(client, monthStart, monthEnd) {
    const weeks = [0, 0, 0, 0];

    const startStr = formatLocalDate(monthStart);
    const endStr = formatLocalDate(monthEnd);

    console.log(`  查询范围: ${startStr} ~ ${endStr}`);

    const result = await client.query(
        `SELECT created_at FROM quotations WHERE created_at >= $1 AND created_at <= $2`,
        [startStr, endStr]
    );

    console.log(`  查询到 ${result.rows.length} 条记录`);

    result.rows.forEach((row, index) => {
        const date = new Date(row.created_at);
        const dayOfMonth = date.getDate();
        const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 3);

        // 详细打印每条记录的分类
        if (index < 10) { // 只打印前10条
            console.log(`    记录${index + 1}: ${row.created_at} -> 日期${dayOfMonth}日 -> 第${weekIndex + 1}周`);
        }

        weeks[weekIndex]++;
    });

    return weeks;
}

testWeeklyQuotations();
