<template>
  <div class="cost-add-container">
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <h2>{{ pageTitle }}</h2>
        </div>
      </div>
    </el-card>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" class="cost-form">
      <!-- 基本信息 -->
      <el-card class="form-section">
        <template #header>
          <span class="section-title">基本信息</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="法规类别" prop="regulation_id">
              <el-select
                v-model="form.regulation_id"
                placeholder="请选择法规类别"
                @change="onRegulationChange"
                style="width: 100%"
                :disabled="isEditMode"
              >
                <el-option
                  v-for="reg in regulations"
                  :key="reg.id"
                  :label="reg.name"
                  :value="reg.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="型号配置" prop="packaging_config_id">
              <el-select
                v-model="form.packaging_config_id"
                placeholder="请选择型号和包装配置"
                @change="onPackagingConfigChange"
                style="width: 100%"
                :disabled="!form.regulation_id || isEditMode"
                filterable
              >
                <!-- 按包装类型分组显示 -->
                <el-option-group
                  v-for="group in groupedPackagingConfigs"
                  :key="group.type"
                  :label="group.typeName"
                >
                  <el-option
                    v-for="config in group.configs"
                    :key="config.id"
                    :label="`${config.model_name} - ${config.config_name} (${formatPackagingMethodFromConfig(config)})`"
                    :value="config.id"
                  >
                    <div style="display: flex; justify-content: space-between;">
                      <span><strong>{{ config.model_name }}</strong> - {{ config.config_name }}</span>
                      <span style="color: #8492a6; font-size: 12px;">
                        {{ formatPackagingMethodFromConfig(config) }}
                      </span>
                    </div>
                  </el-option>
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customer_name">
              <el-input v-model="form.customer_name" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="客户地区" prop="customer_region">
              <el-input v-model="form.customer_region" placeholder="请输入客户地区" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="销售类型" prop="sales_type">
              <el-radio-group v-model="form.sales_type" @change="onSalesTypeChange">
                <el-radio label="domestic">内销</el-radio>
                <el-radio label="export">外销</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="8" v-if="form.sales_type === 'domestic'">
            <el-form-item label="增值税率" prop="vat_rate">
              <el-select
                v-model="form.vat_rate"
                placeholder="请选择增值税率"
                @change="calculateCost"
                style="width: 100%"
              >
                <el-option
                  v-for="rate in vatRateOptions"
                  :key="rate"
                  :label="`${(rate * 100).toFixed(0)}%`"
                  :value="rate"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8" v-if="form.sales_type === 'export'">
            <el-form-item label="货运方式" prop="shipping_method">
              <el-radio-group v-model="form.shipping_method" @change="onShippingMethodChange">
                <el-radio label="fcl_40">40尺整柜</el-radio>
                <el-radio label="fcl_20">20尺整柜</el-radio>
                <el-radio label="lcl">散货</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="8" v-if="form.sales_type === 'export' && form.shipping_method">
            <el-form-item label="港口类型" prop="port_type">
              <el-radio-group v-model="form.port_type" @change="onPortTypeChange">
                <el-radio label="fob_shenzhen">FOB深圳</el-radio>
                <el-radio label="other">其他港口</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="8" v-if="form.sales_type === 'export' && form.shipping_method && form.port_type === 'other'">
            <el-form-item label="港口名称" prop="port">
              <el-input 
                v-model="form.port" 
                placeholder="请输入港口名称"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="4">
            <el-form-item label="数量单位">
              <el-radio-group v-model="quantityUnit" @change="onQuantityUnitChange" :disabled="!shippingInfo.pcsPerCarton">
                <el-radio label="pcs">按片</el-radio>
                <el-radio label="carton">按箱</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item :label="quantityUnit === 'pcs' ? '购买数量（片）' : '购买数量（箱）'" prop="quantity">
              <el-input-number
                v-model="quantityInput"
                :min="1"
                :precision="0"
                :controls="false"
                @change="onQuantityInputChange"
                style="width: 100%"
                :disabled="form.sales_type === 'export' && (form.shipping_method === 'fcl_20' || form.shipping_method === 'fcl_40') && form.port_type === 'fob_shenzhen'"
              />
              <div v-if="quantityUnit === 'carton' && shippingInfo.pcsPerCarton" style="color: #67c23a; font-size: 12px; margin-top: 5px;">
                = {{ form.quantity }} 片（{{ quantityInput }}箱 × {{ shippingInfo.pcsPerCarton }}片/箱）
              </div>
              <div v-if="form.sales_type === 'export' && form.shipping_method === 'fcl_20' && form.port_type === 'fob_shenzhen'" style="color: #909399; font-size: 12px; margin-top: 5px;">
                20尺整柜FOB深圳自动计算数量：950÷单箱材积×每箱只数
              </div>
              <div v-if="form.sales_type === 'export' && form.shipping_method === 'fcl_40' && form.port_type === 'fob_shenzhen'" style="color: #909399; font-size: 12px; margin-top: 5px;">
                40尺整柜FOB深圳自动计算数量：1950÷单箱材积×每箱只数
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="6" v-if="shippingInfo.cartons !== null">
            <el-form-item label="箱数">
              <el-input
                :value="shippingInfo.cartons"
                disabled
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6" v-if="shippingInfo.cbm !== null">
            <el-form-item label="CBM">
              <el-input
                :value="shippingInfo.cbm"
                disabled
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- FOB深圳运费计算明细 - 整柜 -->
        <el-row :gutter="20" v-if="form.sales_type === 'export' && form.port_type === 'fob_shenzhen' && (form.shipping_method === 'fcl_20' || form.shipping_method === 'fcl_40') && freightCalculation">
          <el-col :span="24">
            <el-card class="freight-detail-card">
              <template #header>
                <span style="font-weight: bold;">FOB深圳运费计算明细（{{ form.shipping_method === 'fcl_40' ? '40尺整柜' : '20尺整柜' }}）</span>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="单箱材积（立方英尺）" v-if="freightCalculation.cartonVolume">
                  {{ freightCalculation.cartonVolume }}
                </el-descriptions-item>
                <el-descriptions-item label="可装箱数" v-if="freightCalculation.maxCartons">
                  {{ freightCalculation.maxCartons }}箱 ({{ freightCalculation.containerVolume }} ÷ {{ freightCalculation.cartonVolume }})
                </el-descriptions-item>
                <el-descriptions-item label="每箱只数" v-if="freightCalculation.pcsPerCarton">
                  {{ freightCalculation.pcsPerCarton }}pcs
                </el-descriptions-item>
                <el-descriptions-item label="建议数量" v-if="freightCalculation.suggestedQuantity">
                  <span style="color: #67c23a; font-weight: bold;">
                    {{ freightCalculation.suggestedQuantity }}pcs
                  </span>
                  <span style="color: #909399; font-size: 12px; margin-left: 5px;">
                    ({{ freightCalculation.maxCartons }} × {{ freightCalculation.pcsPerCarton }})
                  </span>
                </el-descriptions-item>
                <el-descriptions-item label="运费（美金）">
                  ${{ freightCalculation.freightUSD }}
                </el-descriptions-item>
                <el-descriptions-item label="运费汇率（USD/CNY）">
                  {{ freightCalculation.exchangeRate }}
                </el-descriptions-item>
                <el-descriptions-item label="运费总计（人民币）" :span="2">
                  <span style="color: #409eff; font-weight: bold; font-size: 16px;">
                    ¥{{ freightCalculation.totalFreight }}
                  </span>
                  <span style="color: #909399; font-size: 12px; margin-left: 10px;">
                    (${{ freightCalculation.freightUSD }} × {{ freightCalculation.exchangeRate }})
                  </span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>

        <!-- FOB深圳运费计算明细 - 散货 -->
        <el-row :gutter="20" v-if="form.sales_type === 'export' && form.port_type === 'fob_shenzhen' && form.shipping_method === 'lcl' && freightCalculation">
          <el-col :span="24">
            <el-card class="freight-detail-card">
              <template #header>
                <span style="font-weight: bold;">FOB深圳运费计算明细（散货）</span>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="CBM（实际）">
                  {{ freightCalculation.cbm }}
                </el-descriptions-item>
                <el-descriptions-item label="CBM（向上取整）">
                  {{ freightCalculation.ceiledCBM }}
                </el-descriptions-item>
                <el-descriptions-item label="基础运费">
                  ¥{{ freightCalculation.baseFreight }}
                </el-descriptions-item>
                <el-descriptions-item label="操作费（Handling charge）">
                  ¥{{ freightCalculation.handlingCharge }}
                </el-descriptions-item>
                <el-descriptions-item label="拼箱费（CFS）">
                  ¥{{ freightCalculation.cfs }} (¥170 × {{ freightCalculation.ceiledCBM }})
                </el-descriptions-item>
                <el-descriptions-item label="文件费">
                  ¥{{ freightCalculation.documentFee }}
                </el-descriptions-item>
                <el-descriptions-item label="运费总计" :span="2">
                  <span style="color: #409eff; font-weight: bold; font-size: 16px;">
                    ¥{{ freightCalculation.totalFreight }}
                  </span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="运费总价" prop="freight_total">
              <el-input-number
                v-model="form.freight_total"
                :min="0"
                :precision="4"
                :controls="false"
                @change="calculateCost"
                style="width: 100%"
                :disabled="form.sales_type === 'export' && form.port_type === 'fob_shenzhen'"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="运费计入成本" prop="include_freight_in_base">
              <el-radio-group v-model="form.include_freight_in_base" @change="calculateCost">
                <el-radio :label="true">是</el-radio>
                <el-radio :label="false">否</el-radio>
              </el-radio-group>
              <div style="color: #909399; font-size: 12px; margin-top: 5px;">
                选择"否"时，运费将在管销价基础上单独计算
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 原料明细 -->
      <el-card class="form-section">
        <template #header>
          <div class="section-header">
            <span class="section-title">原料明细</span>
            <div>
              <el-button 
                v-if="!editMode.materials && form.materials.some(p => p.from_standard)" 
                type="warning" 
                size="small" 
                @click="toggleEditMode('materials')"
              >
                解锁编辑
              </el-button>
              <el-button 
                v-if="editMode.materials" 
                type="success" 
                size="small" 
                @click="toggleEditMode('materials')"
              >
                锁定编辑
              </el-button>
              <el-button type="primary" size="small" @click="addMaterialRow">添加原料</el-button>
            </div>
          </div>
        </template>

        <el-table :data="form.materials" border style="width: 100%">
          <el-table-column width="60" align="center">
            <template #header>
              <el-tooltip content="勾选后，该原料将在管销价计算后再加入成本" placement="top">
                <span style="cursor: help;">管销后算</span>
              </el-tooltip>
            </template>
            <template #default="{ row }">
              <el-checkbox 
                v-model="row.after_overhead" 
                @change="calculateCost"
                :disabled="row.from_standard && !editMode.materials"
              />
            </template>
          </el-table-column>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="原料名称" min-width="250">
            <template #default="{ row, $index }">
              <el-select
                v-if="!row.from_standard || editMode.materials"
                v-model="row.material_id"
                filterable
                clearable
                placeholder="输入关键词搜索原料"
                @change="onMaterialSelect(row, $index)"
                style="width: 100%"
              >
                <el-option
                  v-for="material in allMaterials"
                  :key="material.id"
                  :label="`${material.name} (${material.item_no})${material.manufacturer ? ' - ' + material.manufacturer : ''}`"
                  :value="material.id"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <span>{{ material.name }}</span>
                      <span v-if="material.manufacturer" style="color: #909399; font-size: 12px; margin-left: 8px;">
                        [{{ material.manufacturer }}]
                      </span>
                    </div>
                    <span style="color: #8492a6; font-size: 13px; margin-left: 12px;">
                      ¥{{ material.price }}/{{ material.unit }}
                    </span>
                  </div>
                </el-option>
              </el-select>
              <span v-else>{{ row.item_name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="用量" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.usage_amount"
                :min="0"
                :precision="4"
                :controls="false"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
                :disabled="row.from_standard && !editMode.materials"
              />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <span>{{ formatNumber(row.unit_price) || '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span>{{ formatNumber(row.subtotal) || '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ $index, row }">
              <el-button 
                type="danger" 
                size="small" 
                @click="removeMaterialRow($index)"
                :disabled="row.from_standard && !editMode.materials"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="total-row">
          <span>原料总计（管销前）：</span>
          <span class="total-value">{{ formatNumber(materialBeforeOverheadTotal) }}</span>
          <span style="margin-left: 20px; color: #909399;">管销后算：</span>
          <span class="total-value" style="color: #E6A23C;">{{ formatNumber(materialAfterOverheadTotal) }}</span>
        </div>
      </el-card>

      <!-- 工序明细 -->
      <el-card class="form-section">
        <template #header>
          <div class="section-header">
            <span class="section-title">工序明细</span>
            <div>
              <el-button 
                v-if="!editMode.processes && form.processes.some(p => p.from_standard)" 
                type="warning" 
                size="small" 
                @click="toggleEditMode('processes')"
              >
                解锁编辑
              </el-button>
              <el-button 
                v-if="editMode.processes" 
                type="success" 
                size="small" 
                @click="toggleEditMode('processes')"
              >
                锁定编辑
              </el-button>
              <el-button type="primary" size="small" @click="addProcessRow">添加工序</el-button>
            </div>
          </div>
        </template>

        <el-table :data="form.processes" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="工序名称" min-width="150">
            <template #default="{ row }">
              <el-input 
                v-model="row.item_name" 
                @change="calculateItemSubtotal(row)"
                :disabled="row.from_standard && !editMode.processes"
              />
            </template>
          </el-table-column>
          <el-table-column label="用量" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.usage_amount"
                :min="0"
                :precision="4"
                :controls="false"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
                :disabled="row.from_standard && !editMode.processes"
              />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.unit_price"
                :min="0"
                :precision="4"
                :controls="false"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
                :disabled="row.from_standard && !editMode.processes"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span>{{ formatNumber(row.subtotal) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ $index, row }">
              <el-button 
                type="danger" 
                size="small" 
                @click="removeProcessRow($index)"
                :disabled="row.from_standard && !editMode.processes"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="total-row">
          <span>工序小计：</span>
          <span class="total-value">{{ formatNumber(processSubtotal) }}</span>
        </div>
        <div class="total-row" style="margin-top: 5px;">
          <span>工序总计（×{{ configStore.config.process_coefficient || 1.56 }}）：</span>
          <span class="total-value" style="color: #67c23a; font-weight: bold;">{{ formatNumber(processSubtotal * (configStore.config.process_coefficient || 1.56)) }}</span>
        </div>
      </el-card>

      <!-- 包材明细 -->
      <el-card class="form-section">
        <template #header>
          <div class="section-header">
            <span class="section-title">包材明细</span>
            <div>
              <el-button 
                v-if="!editMode.packaging && form.packaging.some(p => p.from_standard)" 
                type="warning" 
                size="small" 
                @click="toggleEditMode('packaging')"
              >
                解锁编辑
              </el-button>
              <el-button 
                v-if="editMode.packaging" 
                type="success" 
                size="small" 
                @click="toggleEditMode('packaging')"
              >
                锁定编辑
              </el-button>
              <el-button type="primary" size="small" @click="addPackagingRow">添加包材</el-button>
            </div>
          </div>
        </template>

        <el-table :data="form.packaging" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="包材名称" min-width="200">
            <template #default="{ row, $index }">
              <el-select
                v-if="!row.from_standard || editMode.packaging"
                v-model="row.material_id"
                filterable
                clearable
                placeholder="输入关键词搜索原料"
                @change="onPackagingMaterialSelect(row, $index)"
                style="width: 100%"
              >
                <el-option
                  v-for="material in allMaterials"
                  :key="material.id"
                  :label="`${material.name} (${material.item_no})`"
                  :value="material.id"
                >
                  <span>{{ material.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    ¥{{ material.price }}/{{ material.unit }}
                  </span>
                </el-option>
              </el-select>
              <span v-else>{{ row.item_name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="用量" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.usage_amount"
                :min="0"
                :precision="4"
                :controls="false"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
                :disabled="row.from_standard && !editMode.packaging"
              />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <span>{{ formatNumber(row.unit_price) || '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="外箱材积" width="120">
            <template #default="{ row }">
              <span v-if="row.carton_volume">{{ row.carton_volume }}</span>
              <span v-else style="color: #909399;">-</span>
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span>{{ formatNumber(row.subtotal) || '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ $index, row }">
              <el-button 
                type="danger" 
                size="small" 
                @click="removePackagingRow($index)"
                :disabled="row.from_standard && !editMode.packaging"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="total-row">
          <span>包材总计：</span>
          <span class="total-value">{{ formatNumber(packagingTotal) }}</span>
        </div>
      </el-card>

      <!-- 成本计算结果 -->
      <el-card class="form-section" v-if="calculation">
        <template #header>
          <span class="section-title">成本计算</span>
        </template>

        <el-descriptions :column="1" border direction="vertical">
          <el-descriptions-item label="运费成本（每片）">
            {{ formatNumber(calculation.freightCost) || '' }}
          </el-descriptions-item>
          <el-descriptions-item label="基础成本价">
            {{ formatNumber(calculation.baseCost) || '' }}
          </el-descriptions-item>
          <el-descriptions-item label="管销价">
            <div class="overhead-price-row">
              <span>{{ formatNumber(calculation.overheadPrice) || '' }}</span>
              <el-button size="small" type="primary" @click="showAddFeeDialog">
                <el-icon><Plus /></el-icon>
                添加管销后费用项
              </el-button>
            </div>
          </el-descriptions-item>
          <!-- 自定义费用项 - 每个费用独立一行 -->
          <el-descriptions-item 
            v-for="(fee, index) in customFeesWithValues" 
            :key="'fee-' + index"
            :label="fee.name + ' ' + (fee.rate * 100).toFixed(0) + '%'"
          >
            <div class="fee-value-row">
              <span>{{ formatNumber(fee.calculatedValue) }}</span>
              <el-button size="small" type="danger" link @click="removeCustomFee(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="管销后算原料" v-if="calculation.afterOverheadMaterialTotal > 0">
            <span style="color: #E6A23C; font-weight: bold;">
              {{ formatNumber(calculation.afterOverheadMaterialTotal) || '' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="汇率（CNY/USD）" v-if="form.sales_type === 'export'">
            {{ formatNumber(calculation.exchangeRate) || '' }}
          </el-descriptions-item>
          <el-descriptions-item :label="form.sales_type === 'domestic' ? `最终成本价（含${((form.vat_rate || 0) * 100).toFixed(0)}%增值税）` : '最终成本价（不含增值税）'">
            <span v-if="form.sales_type === 'domestic'">
              {{ formatNumber(calculation.domesticPrice) || '' }} CNY
            </span>
            <span v-else>
              {{ formatNumber(calculation.insurancePrice) || '' }} USD
            </span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 利润区间报价表 -->
        <div class="profit-tiers" v-if="calculation.profitTiers">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="margin: 0;">利润区间报价</h4>
            <el-button type="primary" size="small" @click="addCustomProfitTier">
              <el-icon><Plus /></el-icon>
              添加档位
            </el-button>
          </div>
          <el-table :data="allProfitTiers" border style="width: 100%">
            <el-table-column label="利润率" width="150">
              <template #default="{ row, $index }">
                <span v-if="!row.isCustom">{{ row.profitPercentage }}</span>
                <el-input
                  v-else
                  v-model.number="row.originalTier.profitRate"
                  type="number"
                  placeholder="如：0.35"
                  size="small"
                  @input="updateCustomTierPrice(row.originalTier)"
                  style="width: 100%"
                >
                  <template #append>
                    <span v-if="row.originalTier.profitRate !== null && row.originalTier.profitRate !== ''">
                      {{ (row.originalTier.profitRate * 100).toFixed(0) }}%
                    </span>
                  </template>
                </el-input>
              </template>
            </el-table-column>
            <el-table-column label="报价" width="180">
              <template #default="{ row }">
                {{ formatNumber(row.price) }} {{ calculation.currency }}
              </template>
            </el-table-column>
            <el-table-column label="说明">
              <template #default="{ row }">
                <span v-if="!row.isCustom">在基础价格上增加 {{ row.profitPercentage }} 利润</span>
                <span v-else style="color: #E6A23C;">自定义利润档位</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row, $index }">
                <el-button
                  v-if="row.isCustom"
                  type="danger"
                  size="small"
                  @click="removeCustomProfitTier(row.customIndex)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>

      <!-- 操作按钮 -->
      <el-card class="form-section">
        <div class="button-group">
          <el-button @click="goBack">取消</el-button>
          <el-button type="info" @click="saveDraft" :loading="saving">保存草稿</el-button>
          <el-button type="primary" @click="submitQuotation" :loading="submitting">提交审核</el-button>
        </div>
      </el-card>
    </el-form>

    <!-- 添加自定义费用对话框 -->
    <el-dialog v-model="addFeeDialogVisible" title="添加自定义费用" width="400px" :close-on-click-modal="false">
      <el-form :model="newFee" :rules="feeRules" ref="feeFormRef" label-width="80px">
        <el-form-item label="费用项" prop="name">
          <el-input v-model="newFee.name" placeholder="" />
        </el-form-item>
        <el-form-item label="费率" prop="rate">
          <el-input 
            v-model="newFee.rate" 
            placeholder="如 0.04 表示 4%"
            style="width: 180px;"
            @blur="newFee.rate = newFee.rate ? parseFloat(newFee.rate) : null"
          />
          <span v-if="newFee.rate && !isNaN(newFee.rate)" style="margin-left: 10px; color: #409eff;">
            {{ (parseFloat(newFee.rate) * 100).toFixed(0) }}%
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFeeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddFee">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { formatNumber } from '@/utils/format'
import { useConfigStore } from '@/store/config'
import { 
  getPackagingTypeName, 
  formatPackagingMethodFromConfig,
  calculateTotalFromConfig,
  PACKAGING_TYPES
} from '@/config/packagingTypes'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const configStore = useConfigStore()

// 增值税率选项列表
const vatRateOptions = computed(() => {
  return configStore.config.vat_rate_options || [0.13, 0.10]
})

// 是否编辑模式
const isEditMode = computed(() => {
  return !!route.params.id
})

// 当前选择的产品类别
const currentModelCategory = ref('')

// 原料系数
const materialCoefficient = ref(1)

// 页面标题
const pageTitle = computed(() => {
  if (route.params.id) {
    return '编辑报价单'
  } else if (route.query.copyFrom) {
    return '复制报价单'
  } else if (currentModelCategory.value) {
    return `新增报价单 - ${currentModelCategory.value}`
  } else {
    return '新增报价单'
  }
})

// 表单数据
const form = reactive({
  regulation_id: null,
  model_id: null,
  packaging_config_id: null,
  customer_name: '',
  customer_region: '',
  sales_type: 'domestic',
  shipping_method: '',
  port_type: 'fob_shenzhen', // FOB深圳 或 其他港口
  port: '',
  quantity: null,
  freight_total: null,
  include_freight_in_base: true,
  vat_rate: null, // 增值税率，null表示使用全局配置
  materials: [],
  processes: [],
  packaging: [],
  customFees: [] // 自定义费用列表
})

// 编辑状态控制
const editMode = reactive({
  materials: false,
  processes: false,
  packaging: false
})

// 原料库数据（用于搜索选择）
const allMaterials = ref([])

// 表单验证规则
const rules = {
  regulation_id: [{ required: true, message: '请选择法规类别', trigger: 'change' }],
  packaging_config_id: [{ required: true, message: '请选择型号配置', trigger: 'change' }],
  customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  customer_region: [{ required: true, message: '请输入客户地区', trigger: 'blur' }],
  sales_type: [{ required: true, message: '请选择销售类型', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入购买数量', trigger: 'blur' }],
  freight_total: [{ required: true, message: '请输入运费总价', trigger: 'blur' }]
}

// 数据列表
const regulations = ref([])
const packagingConfigs = ref([])
const calculation = ref(null)
const saving = ref(false)
const submitting = ref(false)

// 自定义利润档位
const customProfitTiers = ref([])

// 自定义费用相关
const addFeeDialogVisible = ref(false)
const feeFormRef = ref(null)
const newFee = reactive({
  name: '',
  rate: null
})
const feeRules = {
  name: [{ required: true, message: '请输入费用项', trigger: 'blur' }],
  rate: [
    { required: true, message: '请输入费率', trigger: 'blur' },
    { type: 'number', min: 0.0001, max: 1, message: '费率必须在0.0001到1之间', trigger: 'blur' }
  ]
}

// 货运信息（箱数和CBM）
const shippingInfo = reactive({
  cartons: null,
  cbm: null,
  cartonVolume: null, // 外箱材积
  pcsPerCarton: null  // 每箱只数
})

// 数量单位选择（pcs=按片，carton=按箱）
const quantityUnit = ref('pcs')
// 数量输入值（根据单位不同，可能是片数或箱数）
const quantityInput = ref(null)

// FOB深圳运费计算结果
const freightCalculation = ref(null)

// 系统配置
const systemConfig = ref({
  fobShenzhenExchangeRate: 7.1, // 默认值
  fcl20FreightUsd: 840, // 20尺整柜运费（美金）
  fcl40FreightUsd: 940,  // 40尺整柜运费（美金）
  lclBaseFreight1_3: 800,
  lclBaseFreight4_10: 1000,
  lclBaseFreight11_15: 1500,
  lclHandlingCharge: 500,
  lclCfsPerCbm: 170,
  lclDocumentFee: 500
})

// 过滤后的包装配置列表（根据法规和产品类别过滤）
const filteredPackagingConfigs = computed(() => {
  if (!form.regulation_id) return []
  
  let filtered = packagingConfigs.value.filter(c => c.regulation_id === form.regulation_id)
  
  // 如果有产品类别参数，进一步按 model_category 过滤
  if (currentModelCategory.value) {
    filtered = filtered.filter(c => c.model_category === currentModelCategory.value)
  }
  
  return filtered
})

// 按包装类型分组的配置列表
const groupedPackagingConfigs = computed(() => {
  const configs = filteredPackagingConfigs.value
  if (!configs.length) return []
  
  // 按包装类型分组
  const groups = {}
  for (const config of configs) {
    const type = config.packaging_type || 'standard_box'
    if (!groups[type]) {
      groups[type] = {
        type,
        typeName: getPackagingTypeName(type) || '标准彩盒',
        configs: []
      }
    }
    groups[type].configs.push(config)
  }
  
  // 按预定义顺序排列分组
  const orderedTypes = Object.keys(PACKAGING_TYPES)
  const result = []
  for (const type of orderedTypes) {
    if (groups[type] && groups[type].configs.length > 0) {
      result.push(groups[type])
    }
  }
  
  return result
})

// 计算总计
const materialBeforeOverheadTotal = computed(() => {
  return form.materials
    .filter(item => !item.after_overhead)
    .reduce((sum, item) => sum + item.subtotal, 0)
})

const materialAfterOverheadTotal = computed(() => {
  return form.materials
    .filter(item => item.after_overhead)
    .reduce((sum, item) => sum + item.subtotal, 0)
})

// 工序总计（工序单价已包含工价系数）
const processSubtotal = computed(() => {
  return form.processes.reduce((sum, item) => sum + item.subtotal, 0)
})

// 保留processTotal用于兼容性
const processTotal = processSubtotal

const packagingTotal = computed(() => {
  return form.packaging.reduce((sum, item) => sum + item.subtotal, 0)
})

// 合并系统利润档位和自定义档位（不排序，保持添加顺序）
const allProfitTiers = computed(() => {
  if (!calculation.value || !calculation.value.profitTiers) {
    return []
  }
  
  // 系统档位（已排序）
  const systemTiers = calculation.value.profitTiers.map(tier => ({
    ...tier,
    isCustom: false,
    originalTier: null,
    customIndex: -1
  }))
  
  // 自定义档位 - 保留对原始对象的引用，保持添加顺序
  const customTiers = customProfitTiers.value.map((tier, index) => ({
    profitRate: tier.profitRate,
    profitPercentage: tier.profitPercentage,
    price: tier.price,
    isCustom: true,
    originalTier: tier, // 保留对原始对象的引用
    customIndex: index  // 保存在customProfitTiers中的索引
  }))
  
  // 合并但不排序，先显示系统档位，再显示自定义档位
  const allTiers = [...systemTiers, ...customTiers]
  
  return allTiers
})

// 自定义费用总结金额
const customFeeSummary = computed(() => {
  if (!calculation.value || !calculation.value.overheadPrice) {
    return 0
  }
  if (form.customFees.length === 0) {
    return calculation.value.overheadPrice
  }
  let result = calculation.value.overheadPrice
  for (const fee of form.customFees) {
    result = result * (1 + fee.rate)
  }
  return Math.round(result * 10000) / 10000
})

// 带计算值的自定义费用列表（每项显示累乘后的值）
const customFeesWithValues = computed(() => {
  if (!calculation.value || !calculation.value.overheadPrice) {
    return []
  }
  let currentValue = calculation.value.overheadPrice
  return form.customFees.map((fee) => {
    currentValue = currentValue * (1 + fee.rate)
    return {
      ...fee,
      calculatedValue: Math.round(currentValue * 10000) / 10000
    }
  })
})

// 加载法规列表
const loadRegulations = async () => {
  try {
    const res = await request.get('/regulations')
    if (res.success) {
      regulations.value = res.data
    }
  } catch (error) {
    console.error('加载法规列表失败:', error)
  }
}

// 加载包装配置列表
const loadPackagingConfigs = async () => {
  try {
    const res = await request.get('/cost/packaging-configs')
    if (res.success) {
      packagingConfigs.value = res.data
    }
  } catch (error) {
    console.error('加载包装配置列表失败:', error)
  }
}

// 法规变化
const onRegulationChange = () => {
  form.packaging_config_id = null
  form.model_id = null
  form.materials = []
  form.processes = []
  form.packaging = []
  calculation.value = null
}

// 加载型号BOM原料
const loadBomMaterials = async (modelId) => {
  if (!modelId) return
  try {
    const res = await request.get(`/bom/${modelId}`)
    if (res.success && res.data && res.data.length > 0) {
      form.materials = res.data.map(b => ({
        category: 'material',
        material_id: b.material_id,
        item_name: b.material_name,
        usage_amount: parseFloat(b.usage_amount) || 0,
        unit_price: parseFloat(b.unit_price) || 0,
        subtotal: (parseFloat(b.usage_amount) || 0) * (parseFloat(b.unit_price) || 0),
        is_changed: 0,
        from_bom: true, // 标记来自BOM
        from_standard: true, // 标记为标准数据（锁定编辑）
        after_overhead: false
      }))
      editMode.materials = false // 重置编辑状态
      console.log('已加载BOM原料:', form.materials.length, '条')
    } else {
      form.materials = [] // 无BOM数据时清空
    }
  } catch (e) { console.error('加载BOM原料失败:', e) }
}

// 包装配置变化 - 加载该配置的工序和包材
const onPackagingConfigChange = async () => {
  if (!form.packaging_config_id) return

  console.log('开始加载包装配置数据，config_id:', form.packaging_config_id)

  try {
    const res = await request.get(`/cost/packaging-configs/${form.packaging_config_id}/details`)
    console.log('接口返回数据:', res)
    
    if (res.success) {
      const { config, processes, materials } = res.data
      
      // 设置 model_id
      form.model_id = config.model_id
      
      // 根据包装配置的 model_category 更新原料系数
      const selectedConfig = packagingConfigs.value.find(c => c.id === form.packaging_config_id)
      if (selectedConfig && selectedConfig.model_category) {
        currentModelCategory.value = selectedConfig.model_category
        // 从缓存中获取原料系数，如果缓存为空则重新加载
        if (Object.keys(materialCoefficientsCache.value).length === 0) {
          await loadMaterialCoefficients()
        } else if (materialCoefficientsCache.value[selectedConfig.model_category]) {
          materialCoefficient.value = materialCoefficientsCache.value[selectedConfig.model_category]
          console.log(`更新原料系数: ${selectedConfig.model_category} = ${materialCoefficient.value}`)
        }
      }
      
      console.log('工序数据:', processes)
      console.log('包材数据:', materials)

      // 计算每箱只数：根据包装类型使用正确的计算方式
      const pcsPerCarton = calculateTotalFromConfig(config)
      shippingInfo.pcsPerCarton = pcsPerCarton
      
      // 查找外箱材积（从包材中查找）
      const cartonMaterial = materials.find(m => m.carton_volume && m.carton_volume > 0)
      shippingInfo.cartonVolume = cartonMaterial ? cartonMaterial.carton_volume : null
      
      // 同步数量输入值
      if (form.quantity) {
        if (quantityUnit.value === 'carton') {
          quantityInput.value = Math.ceil(form.quantity / pcsPerCarton)
        } else {
          quantityInput.value = form.quantity
        }
      }
      
      console.log('每箱只数:', pcsPerCarton)
      console.log('外箱材积:', shippingInfo.cartonVolume)

      // 加载BOM原料
      await loadBomMaterials(config.model_id)

      // 加载工序
      form.processes = (processes || []).map(p => {
        const unitPrice = parseFloat(p.unit_price) || 0
        return {
          category: 'process',
          item_name: p.process_name,
          usage_amount: 1,
          unit_price: unitPrice,
          subtotal: unitPrice,
          is_changed: 0,
          from_standard: true // 标记为标准数据
        }
      })

      // 加载包材
      form.packaging = (materials || []).map(m => {
        const unitPrice = parseFloat(m.unit_price) || 0
        const basicUsage = parseFloat(m.basic_usage) || 0
        return {
          category: 'packaging',
          item_name: m.material_name,
          usage_amount: basicUsage,
          unit_price: unitPrice,
          carton_volume: m.carton_volume ? parseFloat(m.carton_volume) : null,
          subtotal: basicUsage !== 0 ? unitPrice / basicUsage : 0,
          is_changed: 0,
          from_standard: true // 标记为标准数据
        }
      })

      console.log('加载后的工序:', form.processes)
      console.log('加载后的包材:', form.packaging)

      // 重置编辑状态
      editMode.processes = false
      editMode.packaging = false

      // 计算箱数和CBM
      calculateShippingInfo()

      // 自动计算
      calculateCost()
      
      if (form.processes.length > 0 || form.packaging.length > 0) {
        ElMessage.success(`已加载 ${config.config_name}：${form.processes.length} 个工序和 ${form.packaging.length} 个包材`)
      } else {
        ElMessage.warning('该配置暂无绑定的工序和包材数据')
      }
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch (error) {
    console.error('加载包装配置数据失败:', error)
    ElMessage.error('加载包装配置数据失败: ' + (error.message || '未知错误'))
  }
}

// 销售类型变化
const onSalesTypeChange = () => {
  // 如果切换到内销，清空货运方式和港口
  if (form.sales_type === 'domestic') {
    form.shipping_method = ''
    form.port_type = 'fob_shenzhen'
    form.port = ''
    freightCalculation.value = null
  }
  calculateCost()
}

// 货运方式变化
const onShippingMethodChange = () => {
  // 清空港口信息，让用户重新填写
  form.port_type = 'fob_shenzhen'
  form.port = ''
  freightCalculation.value = null
  // 先计算箱数和CBM，再计算运费
  calculateShippingInfo()
}

// 港口类型变化
const onPortTypeChange = () => {
  if (form.port_type === 'fob_shenzhen') {
    form.port = 'FOB深圳'
    // 先计算箱数和CBM，再计算运费
    calculateShippingInfo()
  } else {
    form.port = ''
    form.freight_total = null
    freightCalculation.value = null
  }
}

// 数量单位切换
const onQuantityUnitChange = () => {
  if (!shippingInfo.pcsPerCarton) {
    quantityUnit.value = 'pcs'
    return
  }
  
  if (quantityUnit.value === 'carton') {
    // 从片切换到箱：将当前片数转换为箱数（向上取整）
    if (form.quantity && form.quantity > 0) {
      quantityInput.value = Math.ceil(form.quantity / shippingInfo.pcsPerCarton)
      // 重新计算片数（确保是整箱）
      form.quantity = quantityInput.value * shippingInfo.pcsPerCarton
    }
  } else {
    // 从箱切换到片：直接使用当前片数
    quantityInput.value = form.quantity
  }
  
  calculateShippingInfo()
  calculateCost()
}

// 数量输入变化
const onQuantityInputChange = () => {
  if (quantityUnit.value === 'carton' && shippingInfo.pcsPerCarton) {
    // 按箱输入：片数 = 箱数 × 每箱片数
    form.quantity = quantityInput.value * shippingInfo.pcsPerCarton
  } else {
    // 按片输入：直接使用输入值
    form.quantity = quantityInput.value
  }
  
  calculateShippingInfo()
  calculateCost()
}

// 数量变化（兼容旧逻辑）
const onQuantityChange = () => {
  // 同步quantityInput
  if (quantityUnit.value === 'carton' && shippingInfo.pcsPerCarton) {
    quantityInput.value = Math.ceil(form.quantity / shippingInfo.pcsPerCarton)
  } else {
    quantityInput.value = form.quantity
  }
  
  calculateShippingInfo()
  calculateCost()
}

// 计算箱数和CBM
const calculateShippingInfo = () => {
  // 重置
  shippingInfo.cartons = null
  shippingInfo.cbm = null
  
  // 检查必要条件
  if (!form.quantity || form.quantity <= 0) {
    return
  }
  
  if (!shippingInfo.pcsPerCarton || shippingInfo.pcsPerCarton <= 0) {
    return
  }
  
  // 计算箱数（精确值）
  const exactCartons = form.quantity / shippingInfo.pcsPerCarton
  const cartons = Math.ceil(exactCartons)
  shippingInfo.cartons = cartons
  
  // 只有按片输入时才检查是否除不尽
  if (quantityUnit.value === 'pcs' && exactCartons !== cartons) {
    // 计算建议的准确数量
    const suggestedQuantity = cartons * shippingInfo.pcsPerCarton
    
    // 获取包装配置信息用于提示
    const selectedConfig = packagingConfigs.value.find(c => c.id === form.packaging_config_id)
    let packagingInfo = ''
    if (selectedConfig) {
      packagingInfo = formatPackagingMethodFromConfig(selectedConfig)
    }
    
    ElMessage.warning({
      message: `当前数量 ${form.quantity} 除不尽！\n包装配置：${packagingInfo}\n建议数量为 ${suggestedQuantity}pcs（${cartons}箱 × ${shippingInfo.pcsPerCarton}pcs/箱），或切换到"按箱"输入。`,
      duration: 8000,
      showClose: true,
      dangerouslyUseHTMLString: false
    })
  }
  
  // 计算CBM（如果有外箱材积）
  if (shippingInfo.cartonVolume && shippingInfo.cartonVolume > 0) {
    // 总材积 = 外箱材积 * 箱数
    const totalVolume = shippingInfo.cartonVolume * cartons
    // CBM = 总材积 / 35.32（保留一位小数）
    const cbm = (totalVolume / 35.32).toFixed(1)
    shippingInfo.cbm = cbm
  }
  
  // 如果是FOB深圳，自动计算运费
  if (form.sales_type === 'export' && form.port_type === 'fob_shenzhen') {
    calculateFOBFreight()
  }
}

// 计算FOB深圳运费
const calculateFOBFreight = () => {
  // 重置
  freightCalculation.value = null
  
  if (form.sales_type !== 'export' || form.port_type !== 'fob_shenzhen') {
    return
  }
  
  // 整柜（FCL）运费计算
  if (form.shipping_method === 'fcl_20' || form.shipping_method === 'fcl_40') {
    // 根据整柜类型设置参数
    const containerVolume = form.shipping_method === 'fcl_40' ? 1950 : 950
    const freightUSD = form.shipping_method === 'fcl_40' 
      ? systemConfig.value.fcl40FreightUsd 
      : systemConfig.value.fcl20FreightUsd
    
    const exchangeRate = systemConfig.value.fobShenzhenExchangeRate // 从系统配置获取运费汇率
    const totalFreight = freightUSD * exchangeRate
    
    // 计算建议数量
    let suggestedQuantity = null
    let maxCartons = null
    let cartonVolume = null
    let pcsPerCarton = null
    
    if (shippingInfo.cartonVolume && shippingInfo.cartonVolume > 0 && shippingInfo.pcsPerCarton && shippingInfo.pcsPerCarton > 0) {
      cartonVolume = shippingInfo.cartonVolume
      pcsPerCarton = shippingInfo.pcsPerCarton
      // 容积 ÷ 单箱材积 = 可装箱数（向上取整）
      maxCartons = Math.ceil(containerVolume / cartonVolume)
      // 建议数量 = 可装箱数 × 每箱只数
      suggestedQuantity = maxCartons * pcsPerCarton
      
      // 自动设置数量
      form.quantity = suggestedQuantity
      // 同步数量输入值（整柜自动计算时按箱显示更直观）
      quantityUnit.value = 'carton'
      quantityInput.value = maxCartons
    }
    
    freightCalculation.value = {
      freightUSD,
      exchangeRate,
      totalFreight,
      containerVolume,
      cartonVolume,
      maxCartons,
      pcsPerCarton,
      suggestedQuantity
    }
    
    // 自动填充运费总价
    form.freight_total = totalFreight
    
    // 重新计算成本
    calculateCost()
    return
  }
  
  // 散货（LCL）运费计算
  if (form.shipping_method === 'lcl') {
    // 检查必要条件
    if (!shippingInfo.cbm || shippingInfo.cbm <= 0) {
      return
    }
    
    const cbm = parseFloat(shippingInfo.cbm)
    const ceiledCBM = Math.ceil(cbm)
    
    // 基础运费（从系统配置读取）
    let baseFreight = 0
    if (ceiledCBM >= 1 && ceiledCBM <= 3) {
      baseFreight = systemConfig.value.lclBaseFreight1_3
    } else if (ceiledCBM > 3 && ceiledCBM <= 10) {
      baseFreight = systemConfig.value.lclBaseFreight4_10
    } else if (ceiledCBM > 10 && ceiledCBM <= 15) {
      baseFreight = systemConfig.value.lclBaseFreight11_15
    } else if (ceiledCBM > 15) {
      // 超过15CBM，可以提示用户或使用其他计算方式
      ElMessage.warning('CBM超过15，建议选择整柜运输或联系物流确认运费')
      return
    }
    
    // 固定费用（从系统配置读取）
    const handlingCharge = systemConfig.value.lclHandlingCharge
    const cfs = systemConfig.value.lclCfsPerCbm * ceiledCBM
    const documentFee = systemConfig.value.lclDocumentFee
    
    // 总运费
    const totalFreight = baseFreight + handlingCharge + cfs + documentFee
    
    freightCalculation.value = {
      cbm: cbm.toFixed(1),
      ceiledCBM,
      baseFreight,
      handlingCharge,
      cfs,
      documentFee,
      totalFreight
    }
    
    // 自动填充运费总价
    form.freight_total = totalFreight
    
    // 重新计算成本
    calculateCost()
  }
}

// 计算明细小计
const calculateItemSubtotal = (row) => {
  if (row.category === 'packaging') {
    // 包材：单价 / 基本用量
    row.subtotal = (row.usage_amount && row.usage_amount !== 0) 
      ? (row.unit_price || 0) / row.usage_amount 
      : 0
  } else if (row.category === 'material') {
    // 原料：用量 * 单价 / 原料系数
    const coefficient = materialCoefficient.value || 1
    const rawSubtotal = (row.usage_amount || 0) * (row.unit_price || 0)
    row.subtotal = coefficient !== 0 ? rawSubtotal / coefficient : rawSubtotal
    // 四舍五入到4位小数
    row.subtotal = Math.round(row.subtotal * 10000) / 10000
    // 标记已应用系数
    row.coefficient_applied = true
  } else {
    // 工序：用量 * 单价
    row.subtotal = (row.usage_amount || 0) * (row.unit_price || 0)
  }
  calculateCost()
}

// 原料选择处理
const onMaterialSelect = (row, index) => {
  if (!row.material_id) {
    row.item_name = ''
    row.unit_price = 0
    row.usage_amount = 0
    row.subtotal = 0
    return
  }
  
  const material = allMaterials.value.find(m => m.id === row.material_id)
  if (material) {
    row.item_name = material.name
    row.unit_price = material.price
    row.usage_amount = row.usage_amount || 0
    calculateItemSubtotal(row)
  }
}

// 包材原料选择处理
const onPackagingMaterialSelect = (row, index) => {
  if (!row.material_id) {
    row.item_name = ''
    row.unit_price = 0
    row.usage_amount = 0
    row.subtotal = 0
    return
  }
  
  const material = allMaterials.value.find(m => m.id === row.material_id)
  if (material) {
    row.item_name = material.name
    row.unit_price = material.price
    row.usage_amount = row.usage_amount || 0
    calculateItemSubtotal(row)
  }
}

// 添加行
const addMaterialRow = () => {
  form.materials.push({
    category: 'material',
    material_id: null,
    item_name: '',
    usage_amount: null,
    unit_price: null,
    subtotal: 0,
    is_changed: 1,
    from_standard: false,
    after_overhead: false
  })
}

const addProcessRow = () => {
  form.processes.push({
    category: 'process',
    item_name: '',
    usage_amount: null,
    unit_price: null,
    subtotal: 0,
    is_changed: 1,
    from_standard: false
  })
}

const addPackagingRow = () => {
  form.packaging.push({
    category: 'packaging',
    material_id: null,
    item_name: '',
    usage_amount: null,
    unit_price: null,
    carton_volume: null,
    subtotal: 0,
    is_changed: 1,
    from_standard: false
  })
}

// 删除行
const removeMaterialRow = (index) => {
  form.materials.splice(index, 1)
  calculateCost()
}

const removeProcessRow = (index) => {
  form.processes.splice(index, 1)
  calculateCost()
}

const removePackagingRow = (index) => {
  form.packaging.splice(index, 1)
  calculateCost()
}

// 计算成本
const calculateCost = async () => {
  if (!form.quantity || form.quantity <= 0) return

  const items = [
    ...form.materials,
    ...form.processes,
    ...form.packaging
  ]

  if (items.length === 0) return

  try {
    const res = await request.post('/cost/calculate', {
      quantity: form.quantity,
      freight_total: form.freight_total || 0,
      sales_type: form.sales_type,
      include_freight_in_base: form.include_freight_in_base,
      model_id: form.model_id, // 传递model_id用于获取原料系数
      vat_rate: form.vat_rate, // 传递自定义增值税率
      custom_fees: form.customFees, // 传递自定义费用
      items
    })

    if (res.success) {
      calculation.value = res.data
      
      // 重新计算所有自定义档位的价格
      customProfitTiers.value.forEach(tier => {
        updateCustomTierPrice(tier)
      })
    }
  } catch (error) {
    console.error('计算成本失败:', error)
  }
}

// 保存草稿
const saveDraft = async () => {
  try {
    await formRef.value.validate()

    const items = [
      ...form.materials,
      ...form.processes,
      ...form.packaging
    ]

    if (items.length === 0) {
      ElMessage.warning('请至少添加一项明细')
      return
    }

    saving.value = true

    const quotationId = route.params.id
    
    // 准备自定义利润档位数据（过滤空值并排序）
    const customProfitTiersData = prepareCustomProfitTiersForSave()
    
    if (quotationId) {
      // 编辑模式：更新报价单
      const res = await request.put(`/cost/quotations/${quotationId}`, {
        customer_name: form.customer_name,
        customer_region: form.customer_region,
        packaging_config_id: form.packaging_config_id,
        quantity: form.quantity,
        freight_total: form.freight_total || 0,
        sales_type: form.sales_type,
        shipping_method: form.shipping_method || null,
        port: form.port || null,
        include_freight_in_base: form.include_freight_in_base,
        vat_rate: form.vat_rate,
        custom_profit_tiers: customProfitTiersData,
        custom_fees: form.customFees,
        items
      })

      if (res.success) {
        ElMessage.success('更新成功')
        router.push('/cost/records')
      }
    } else {
      // 新增模式：创建报价单
      const res = await request.post('/cost/quotations', {
        customer_name: form.customer_name,
        customer_region: form.customer_region,
        model_id: form.model_id,
        regulation_id: form.regulation_id,
        packaging_config_id: form.packaging_config_id,
        quantity: form.quantity,
        freight_total: form.freight_total || 0,
        sales_type: form.sales_type,
        shipping_method: form.shipping_method || null,
        port: form.port || null,
        include_freight_in_base: form.include_freight_in_base,
        vat_rate: form.vat_rate,
        custom_profit_tiers: customProfitTiersData,
        custom_fees: form.customFees,
        items
      })

      if (res.success) {
        ElMessage.success('保存成功')
        router.push('/cost/records')
      }
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 提交审核
const submitQuotation = async () => {
  try {
    await formRef.value.validate()

    const items = [
      ...form.materials,
      ...form.processes,
      ...form.packaging
    ]

    if (items.length === 0) {
      ElMessage.warning('请至少添加一项明细')
      return
    }

    submitting.value = true

    const quotationId = route.params.id
    
    // 准备自定义利润档位数据（过滤空值并排序）
    const customProfitTiersData = prepareCustomProfitTiersForSave()
    
    if (quotationId) {
      // 编辑模式：先更新，再提交
      const updateRes = await request.put(`/cost/quotations/${quotationId}`, {
        customer_name: form.customer_name,
        customer_region: form.customer_region,
        packaging_config_id: form.packaging_config_id,
        quantity: form.quantity,
        freight_total: form.freight_total || 0,
        sales_type: form.sales_type,
        shipping_method: form.shipping_method || null,
        port: form.port || null,
        include_freight_in_base: form.include_freight_in_base,
        vat_rate: form.vat_rate,
        custom_profit_tiers: customProfitTiersData,
        custom_fees: form.customFees,
        items
      })

      if (updateRes.success) {
        // 提交审核
        const submitRes = await request.post(`/cost/quotations/${quotationId}/submit`)
        
        if (submitRes.success) {
          ElMessage.success('提交成功')
          router.push('/cost/records')
        }
      }
    } else {
      // 新增模式：先创建，再提交
      const createRes = await request.post('/cost/quotations', {
        customer_name: form.customer_name,
        customer_region: form.customer_region,
        model_id: form.model_id,
        regulation_id: form.regulation_id,
        packaging_config_id: form.packaging_config_id,
        quantity: form.quantity,
        freight_total: form.freight_total || 0,
        sales_type: form.sales_type,
        shipping_method: form.shipping_method || null,
        port: form.port || null,
        include_freight_in_base: form.include_freight_in_base,
        vat_rate: form.vat_rate,
        custom_profit_tiers: customProfitTiersData,
        custom_fees: form.customFees,
        items
      })

      if (createRes.success) {
        // 提交审核
        const submitRes = await request.post(`/cost/quotations/${createRes.data.quotation.id}/submit`)
        
        if (submitRes.success) {
          ElMessage.success('提交成功')
          router.push('/cost/records')
        }
      }
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 加载原料库
const loadAllMaterials = async () => {
  try {
    const res = await request.get('/materials')
    if (res.success) {
      allMaterials.value = res.data
    }
  } catch (error) {
    console.error('加载原料库失败:', error)
  }
}

// 切换编辑模式
const toggleEditMode = (section) => {
  editMode[section] = !editMode[section]
  if (editMode[section]) {
    ElMessage.info(`${section === 'materials' ? '原料' : section === 'processes' ? '工序' : '包材'}明细已解锁，可以编辑`)
  }
}

// 加载报价单数据（用于编辑和复制）
const loadQuotationData = async (id, isCopy = false) => {
  try {
    const res = await request.get(`/cost/quotations/${id}`)
    
    if (res.success) {
      const { quotation, items } = res.data
      
      // 填充基本信息
      form.regulation_id = quotation.regulation_id
      form.packaging_config_id = quotation.packaging_config_id || null
      form.model_id = quotation.model_id
      form.customer_name = isCopy ? `${quotation.customer_name}（复制）` : quotation.customer_name
      form.customer_region = quotation.customer_region
      form.sales_type = quotation.sales_type
      form.shipping_method = quotation.shipping_method || ''
      // 判断港口类型
      if (quotation.port === 'FOB深圳') {
        form.port_type = 'fob_shenzhen'
        form.port = 'FOB深圳'
      } else {
        form.port_type = 'other'
        form.port = quotation.port || ''
      }
      form.quantity = quotation.quantity
      form.freight_total = quotation.freight_total
      form.include_freight_in_base = quotation.include_freight_in_base !== false
      // 加载增值税率，如果报价单有保存的值则使用，否则使用全局配置
      form.vat_rate = quotation.vat_rate !== null && quotation.vat_rate !== undefined 
        ? quotation.vat_rate 
        : (configStore.config.vat_rate || 0.13)
      
      // 填充明细数据 - 保留完整的数据结构，PostgreSQL DECIMAL返回字符串需转换
      form.materials = items.material.items.map(item => ({
        category: 'material',
        material_id: item.material_id || null,
        item_name: item.item_name,
        usage_amount: parseFloat(item.usage_amount) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        subtotal: parseFloat(item.subtotal) || 0,
        is_changed: item.is_changed || 0,
        from_standard: true,
        after_overhead: item.after_overhead || false,
        coefficient_applied: true // 数据库中的subtotal已应用原料系数
      }))
      
      form.processes = items.process.items.map(item => ({
        category: 'process',
        item_name: item.item_name,
        usage_amount: parseFloat(item.usage_amount) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        subtotal: parseFloat(item.subtotal) || 0,
        is_changed: item.is_changed || 0,
        from_standard: true
      }))
      
      form.packaging = items.packaging.items.map(item => ({
        category: 'packaging',
        material_id: item.material_id || null,
        item_name: item.item_name,
        usage_amount: parseFloat(item.usage_amount) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        carton_volume: item.carton_volume ? parseFloat(item.carton_volume) : null,
        subtotal: parseFloat(item.subtotal) || 0,
        is_changed: item.is_changed || 0,
        from_standard: true
      }))
      
      // 尝试从原料库匹配原料ID（如果没有的话）
      form.materials.forEach(material => {
        if (!material.material_id) {
          const found = allMaterials.value.find(m => m.name === material.item_name)
          if (found) {
            material.material_id = found.id
          }
        }
      })
      
      // 尝试从原料库匹配包材ID（如果没有的话）
      form.packaging.forEach(pkg => {
        if (!pkg.material_id) {
          const found = allMaterials.value.find(m => m.name === pkg.item_name)
          if (found) {
            pkg.material_id = found.id
          }
        }
      })
      
      // 设置货运信息以便计算箱数和CBM
      if (quotation.pc_per_bag && quotation.bags_per_box && quotation.boxes_per_carton) {
        // 计算每箱只数
        const pcsPerCarton = quotation.pc_per_bag * quotation.bags_per_box * quotation.boxes_per_carton
        shippingInfo.pcsPerCarton = pcsPerCarton
        
        // 查找外箱材积（从包材中查找）
        const cartonMaterial = items.packaging.items.find(item => item.carton_volume && item.carton_volume > 0)
        shippingInfo.cartonVolume = cartonMaterial ? cartonMaterial.carton_volume : null
        
        // 同步数量输入值
        quantityInput.value = form.quantity
        quantityUnit.value = 'pcs'
        
        // 计算箱数和CBM
        calculateShippingInfo()
      }
      
      // 加载自定义利润档位
      if (quotation.custom_profit_tiers) {
        try {
          const customTiers = JSON.parse(quotation.custom_profit_tiers)
          customProfitTiers.value = customTiers.map(tier => ({
            profitRate: tier.profitRate,
            profitPercentage: tier.profitPercentage,
            price: tier.price
          }))
        } catch (e) {
          console.error('解析自定义利润档位失败:', e)
          customProfitTiers.value = []
        }
      }
      
      // 加载自定义费用
      if (res.data.customFees && res.data.customFees.length > 0) {
        form.customFees = res.data.customFees.map((fee, index) => ({
          name: fee.name,
          rate: fee.rate,
          sortOrder: fee.sortOrder !== undefined ? fee.sortOrder : index
        }))
      } else {
        form.customFees = []
      }
      
      // 计算成本
      calculateCost()
      
      if (isCopy) {
        ElMessage.success('报价单数据已复制，请修改后保存')
      } else {
        ElMessage.success('报价单数据已加载')
      }
    }
  } catch (error) {
    console.error('加载报价单数据失败:', error)
    ElMessage.error('加载报价单数据失败')
  }
}

// 加载标准成本数据（用于复制）
const loadStandardCostData = async (id) => {
  try {
    const res = await request.get(`/standard-costs/${id}`)
    
    if (res.success) {
      const { standardCost, items } = res.data
      
      console.log('标准成本数据:', standardCost)
      
      // 设置产品类别（用于过滤包装配置）
      if (standardCost.model_category) {
        currentModelCategory.value = standardCost.model_category
        // 设置对应的原料系数
        if (materialCoefficientsCache.value[standardCost.model_category]) {
          materialCoefficient.value = materialCoefficientsCache.value[standardCost.model_category]
        }
      }
      
      // 填充基本信息 - 先设置 regulation_id，这样 filteredPackagingConfigs 才能正确过滤
      form.regulation_id = standardCost.regulation_id || null
      
      // 使用 nextTick 确保 filteredPackagingConfigs 已更新后再设置 packaging_config_id
      await nextTick()
      
      form.packaging_config_id = standardCost.packaging_config_id || null
      form.model_id = standardCost.model_id || null
      form.customer_name = ''  // 标准成本复制时客户名称为空
      form.customer_region = ''
      form.sales_type = standardCost.sales_type
      form.shipping_method = ''  // 默认不设置货运方式，让用户选择
      form.port_type = 'fob_shenzhen'  // 默认FOB深圳
      form.port = ''
      form.quantity = standardCost.quantity
      form.freight_total = 0
      form.include_freight_in_base = true
      // 标准成本复制时使用全局配置的增值税率
      form.vat_rate = configStore.config.vat_rate || 0.13
      
      // 设置货运信息（用于计算箱数、CBM和运费）
      if (standardCost.pc_per_bag && standardCost.bags_per_box && standardCost.boxes_per_carton) {
        // 计算每箱只数
        const pcsPerCarton = standardCost.pc_per_bag * standardCost.bags_per_box * standardCost.boxes_per_carton
        shippingInfo.pcsPerCarton = pcsPerCarton
        console.log('每箱只数:', pcsPerCarton)
        
        // 同步数量输入值
        quantityInput.value = standardCost.quantity
        quantityUnit.value = 'pcs'
      }
      
      // 填充明细数据（确保数值类型正确）
      if (items && items.material) {
        form.materials = items.material.items.map(item => ({
          category: 'material',
          material_id: item.material_id || null,
          item_name: item.item_name,
          usage_amount: parseFloat(item.usage_amount) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          subtotal: parseFloat(item.subtotal) || 0,
          is_changed: 0,
          from_standard: true,
          after_overhead: item.after_overhead || false,
          coefficient_applied: true // 数据库中的subtotal已应用原料系数，避免后端重复计算
        }))
      }
      
      if (items && items.process) {
        form.processes = items.process.items.map(item => ({
          category: 'process',
          item_name: item.item_name,
          usage_amount: parseFloat(item.usage_amount) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          subtotal: parseFloat(item.subtotal) || 0,
          is_changed: 0,
          from_standard: true
        }))
      }
      
      if (items && items.packaging) {
        form.packaging = items.packaging.items.map(item => ({
          category: 'packaging',
          material_id: item.material_id || null,
          item_name: item.item_name,
          usage_amount: parseFloat(item.usage_amount) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          carton_volume: item.carton_volume ? parseFloat(item.carton_volume) : null,
          subtotal: parseFloat(item.subtotal) || 0,
          is_changed: 0,
          from_standard: true
        }))
      }
      
      // 尝试从原料库匹配原料ID
      form.materials.forEach(material => {
        if (!material.material_id) {
          const found = allMaterials.value.find(m => m.name === material.item_name)
          if (found) {
            material.material_id = found.id
          }
        }
      })
      
      // 尝试从原料库匹配包材ID
      form.packaging.forEach(pkg => {
        if (!pkg.material_id) {
          const found = allMaterials.value.find(m => m.name === pkg.item_name)
          if (found) {
            pkg.material_id = found.id
          }
        }
      })
      
      // 查找外箱材积（从包材中查找）
      if (items && items.packaging) {
        const cartonMaterial = items.packaging.items.find(item => item.carton_volume && item.carton_volume > 0)
        shippingInfo.cartonVolume = cartonMaterial ? cartonMaterial.carton_volume : null
        console.log('外箱材积:', shippingInfo.cartonVolume)
      }
      
      // 计算箱数和CBM（如果有数量和每箱只数）
      if (form.quantity && shippingInfo.pcsPerCarton) {
        calculateShippingInfo()
      }
      
      // 计算成本
      calculateCost()
      
      ElMessage.success('标准成本数据已复制，请填写客户信息后保存')
    }
  } catch (error) {
    console.error('加载标准成本数据失败:', error)
    ElMessage.error('加载标准成本数据失败')
  }
}

// 加载系统配置
const loadSystemConfig = async () => {
  try {
    const response = await request.get('/config')
    if (response.success && response.data) {
      systemConfig.value.fobShenzhenExchangeRate = response.data.fob_shenzhen_exchange_rate || 7.1
      systemConfig.value.fcl20FreightUsd = response.data.fcl_20_freight_usd || 840
      systemConfig.value.fcl40FreightUsd = response.data.fcl_40_freight_usd || 940
      systemConfig.value.lclBaseFreight1_3 = response.data.lcl_base_freight_1_3 || 800
      systemConfig.value.lclBaseFreight4_10 = response.data.lcl_base_freight_4_10 || 1000
      systemConfig.value.lclBaseFreight11_15 = response.data.lcl_base_freight_11_15 || 1500
      systemConfig.value.lclHandlingCharge = response.data.lcl_handling_charge || 500
      systemConfig.value.lclCfsPerCbm = response.data.lcl_cfs_per_cbm || 170
      systemConfig.value.lclDocumentFee = response.data.lcl_document_fee || 500
    }
  } catch (error) {
    console.error('加载系统配置失败:', error)
  }
}

// 准备保存的自定义利润档位数据（过滤空值并排序）
const prepareCustomProfitTiersForSave = () => {
  return customProfitTiers.value
    .filter(tier => tier.profitRate !== null && tier.profitRate !== undefined && tier.profitRate !== '')
    .map(tier => ({
      profitRate: tier.profitRate,
      profitPercentage: tier.profitPercentage,
      price: tier.price
    }))
    .sort((a, b) => a.profitRate - b.profitRate) // 保存时排序
}

// 添加自定义利润档位
const addCustomProfitTier = () => {
  if (!calculation.value) {
    ElMessage.warning('请先完成基础信息填写')
    return
  }
  
  customProfitTiers.value.push({
    profitRate: null, // 不设置默认值
    profitPercentage: '',
    price: 0
  })
}

// 更新自定义档位价格
const updateCustomTierPrice = (tier) => {
  if (!calculation.value) {
    return
  }
  
  // 如果利润率为空或无效，清空价格和百分比
  if (tier.profitRate === null || tier.profitRate === undefined || tier.profitRate === '') {
    tier.price = 0
    tier.profitPercentage = ''
    return
  }
  
  // 获取基础价格（根据销售类型）
  let basePrice
  if (calculation.value.salesType === 'domestic') {
    basePrice = calculation.value.domesticPrice
  } else if (calculation.value.salesType === 'export') {
    basePrice = calculation.value.insurancePrice
  }
  
  if (!basePrice) {
    return
  }
  
  const rate = parseFloat(tier.profitRate)
  
  if (isNaN(rate) || rate < 0 || rate > 10) {
    tier.price = 0
    tier.profitPercentage = ''
    return
  }
  
  // 更新百分比显示
  tier.profitPercentage = `${(rate * 100).toFixed(0)}%`
  
  // 计算价格：利润报价 = 基础价 / (1 - 利润率)
  tier.price = basePrice / (1 - rate)
}

// 删除自定义利润档位
const removeCustomProfitTier = (customIndex) => {
  if (customIndex >= 0 && customIndex < customProfitTiers.value.length) {
    customProfitTiers.value.splice(customIndex, 1)
  }
}

// 显示添加费用对话框
const showAddFeeDialog = () => {
  newFee.name = ''
  newFee.rate = null
  addFeeDialogVisible.value = true
}

// 确认添加费用
const confirmAddFee = async () => {
  if (!feeFormRef.value) return
  
  try {
    await feeFormRef.value.validate()
    
    form.customFees.push({
      name: newFee.name,
      rate: newFee.rate,
      sortOrder: form.customFees.length
    })
    
    addFeeDialogVisible.value = false
    calculateCost()
  } catch (error) {
    // 验证失败
  }
}

// 删除自定义费用
const removeCustomFee = (index) => {
  form.customFees.splice(index, 1)
  // 更新排序
  form.customFees.forEach((fee, i) => {
    fee.sortOrder = i
  })
  calculateCost()
}

// 原料系数配置缓存
const materialCoefficientsCache = ref({})

// 加载原料系数配置
const loadMaterialCoefficients = async () => {
  try {
    const res = await request.get('/cost/material-coefficients')
    if (res.success && res.data) {
      // 缓存所有系数配置
      materialCoefficientsCache.value = res.data
      console.log('原料系数配置:', res.data)
      
      // 根据当前产品类别获取对应的原料系数
      if (currentModelCategory.value && res.data[currentModelCategory.value]) {
        materialCoefficient.value = res.data[currentModelCategory.value]
        console.log(`当前产品类别: ${currentModelCategory.value}, 原料系数: ${materialCoefficient.value}`)
      } else {
        materialCoefficient.value = 1
        console.log('未找到对应的原料系数，使用默认值 1')
      }
    }
  } catch (error) {
    console.error('加载原料系数配置失败:', error)
    materialCoefficient.value = 1
  }
}

// 初始化
onMounted(async () => {
  // 加载系统配置（包括工价系数）
  await configStore.loadConfig()
  await loadSystemConfig()
  await loadRegulations()
  await loadPackagingConfigs()
  await loadAllMaterials()
  
  // 始终加载原料系数配置（缓存起来）
  await loadMaterialCoefficients()
  
  // 初始化增值税率为全局配置的默认值
  form.vat_rate = configStore.config.vat_rate || 0.13
  
  // 获取产品类别参数
  if (route.query.model_category) {
    currentModelCategory.value = route.query.model_category
    // 根据产品类别设置原料系数
    if (materialCoefficientsCache.value[route.query.model_category]) {
      materialCoefficient.value = materialCoefficientsCache.value[route.query.model_category]
      console.log(`从URL参数设置原料系数: ${route.query.model_category} = ${materialCoefficient.value}`)
    }
  }
  
  // 检查是否是编辑模式
  if (route.params.id) {
    const id = route.params.id
    await loadQuotationData(id, false)
  }
  // 检查是否是从标准成本复制
  else if (route.query.copyFromStandardCost) {
    const id = route.query.copyFromStandardCost
    await loadStandardCostData(id)
  }
  // 检查是否是复制模式
  else if (route.query.copyFrom) {
    const id = route.query.copyFrom
    await loadQuotationData(id, true)
  }
})
</script>

<style scoped>
.cost-add-container {
  /* padding 由 MainLayout 提供 */
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.form-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-row {
  margin-top: 10px;
  text-align: right;
  font-size: 16px;
  font-weight: bold;
}

.total-value {
  color: #409eff;
  margin-left: 10px;
}

.profit-tiers {
  margin-top: 20px;
}

.profit-tiers h4 {
  margin-bottom: 10px;
  color: #303133;
}

.custom-profit-section {
  margin-top: 24px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.custom-profit-section h4 {
  margin-bottom: 12px;
  color: #303133;
  font-size: 14px;
}

.custom-profit-input {
  display: flex;
  align-items: center;
  gap: 12px;
}

.custom-profit-input .label {
  font-weight: 500;
  color: #606266;
}

.custom-profit-input .unit {
  color: #909399;
  font-size: 13px;
}

.custom-profit-input .result {
  margin-left: 20px;
  color: #606266;
}

.custom-profit-input .result strong {
  color: #67c23a;
  font-size: 16px;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 20px;
}

:deep(.el-input-number) {
  width: 100%;
}

.freight-detail-card {
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
}

.freight-detail-card :deep(.el-card__header) {
  background-color: #ecf5ff;
  border-bottom: 1px solid #d9ecff;
}

/* 管销价行样式 */
.overhead-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 费用值行样式 */
.fee-value-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
