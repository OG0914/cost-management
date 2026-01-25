import { DEFAULT_MATERIAL_ROW, DEFAULT_PROCESS_ROW, DEFAULT_PACKAGING_ROW } from '../config/costAddConfig'

/**
 * 明细行操作通用函数
 * @param {Object} form - 表单对象
 * @param {Function} calculateCost - 成本计算回调
 */
export function useDetailRows(form, calculateCost) {
    /**
     * 添加明细行
     * @param {'materials' | 'processes' | 'packaging'} type - 明细类型
     */
    const addDetailRow = (type) => {
        const defaultRows = {
            materials: { ...DEFAULT_MATERIAL_ROW },
            processes: { ...DEFAULT_PROCESS_ROW },
            packaging: { ...DEFAULT_PACKAGING_ROW }
        }
        form[type].push(defaultRows[type])
    }

    /**
     * 删除明细行
     * @param {'materials' | 'processes' | 'packaging'} type - 明细类型
     * @param {number} index - 行索引
     */
    const removeDetailRow = (type, index) => {
        form[type].splice(index, 1)
        calculateCost()
    }

    return {
        addDetailRow,
        removeDetailRow,
        addMaterialRow: () => addDetailRow('materials'),
        addProcessRow: () => addDetailRow('processes'),
        addPackagingRow: () => addDetailRow('packaging'),
        removeMaterialRow: (index) => removeDetailRow('materials', index),
        removeProcessRow: (index) => removeDetailRow('processes', index),
        removePackagingRow: (index) => removeDetailRow('packaging', index)
    }
}

/**
 * 地区建议函数
 * @param {string[]} commonRegions - 常用地区列表
 */
export function useRegionSuggestion(commonRegions) {
    const suggestRegions = (queryString, cb) => {
        const results = queryString
            ? commonRegions.filter(r => r.includes(queryString)).map(v => ({ value: v }))
            : commonRegions.map(v => ({ value: v }))
        cb(results)
    }

    return { suggestRegions }
}
