<template>
  <div class="cost-page">
    <!-- 顶部导航栏 -->
    <div class="cost-page-header">
      <div class="cost-header-left">
        <button class="cost-back-btn" type="button" @click="goBack">返回</button>
        <h2 class="cost-page-title">{{ pageTitle }}</h2>
        <el-tag v-if="isEditMode" type="warning" size="small">编辑中</el-tag>
      </div>
      <div class="cost-header-right" v-if="form.packaging_config_id || form.customer_name">
        <span v-if="form.packaging_config_id" class="meta-tag">{{ selectedConfigInfo }}</span>
        <span v-if="form.customer_name" class="meta-tag">{{ form.customer_name }}</span>
      </div>
    </div>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" class="cost-form">
      <!-- 基本信息 -->
      <div class="cost-section">
        <div class="cost-section-header">
          <h3 class="cost-section-title">基本信息</h3>
        </div>
        <div class="cost-section-body">

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="法规标准" prop="regulation_id">
              <el-select v-model="form.regulation_id" placeholder="请选择法规标准" @change="onRegulationChange" style="width: 100%" :disabled="isEditMode">
                <el-option v-for="reg in regulations" :key="reg.id" :label="reg.name" :value="reg.id" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="型号配置" prop="packaging_config_id">
              <el-select v-model="form.packaging_config_id" placeholder="请选择型号和包装配置" @change="onPackagingConfigChange" style="width: 100%" :disabled="!form.regulation_id || isEditMode" filterable>
                <el-option-group v-for="group in groupedPackagingConfigs" :key="group.type" :label="group.typeName">
                  <el-option v-for="config in group.configs" :key="config.id" :label="`${config.model_name} - ${config.config_name} (${formatPackagingMethodFromConfig(config)})`" :value="config.id">
                    <div class="config-option">
                      <span><strong>{{ config.model_name }}</strong> - {{ config.config_name }}</span>
                      <span class="config-method">{{ formatPackagingMethodFromConfig(config) }}</span>
                    </div>
                  </el-option>
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="是否新客户">
              <el-radio-group v-model="isNewCustomer" @change="handleCustomerTypeChange">
                <el-radio :value="true">是</el-radio>
                <el-radio :value="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customer_name">
              <el-input v-if="isNewCustomer" v-model="form.customer_name" placeholder="请输入客户名称" clearable />
              <el-select v-else v-model="selectedCustomerId" filterable remote reserve-keyword clearable :remote-method="searchCustomers" :loading="customerSearchLoading" placeholder="输入关键词搜索客户" style="width: 100%" @change="handleCustomerSelect" @focus="customerSelectFocused = true" @blur="customerSelectFocused = false">
                <el-option v-for="c in customerOptions" :key="c.id" :label="customerSelectFocused ? `${c.vc_code} - ${c.name}` : c.name" :value="c.id">
                  <span>{{ c.vc_code }} - {{ c.name }}</span>
                  <span v-if="c.region" class="customer-region">{{ c.region }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="客户地区" prop="customer_region">
              <el-input v-model="form.customer_region" placeholder="请输入客户地区" :disabled="!isNewCustomer && selectedCustomerId" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        </div>
      </div>

      <!-- 销售类型 -->
      <div class="cost-section">
        <div class="cost-section-header">
          <h3 class="cost-section-title">销售类型</h3>
        </div>
        <div class="cost-section-body">

        <div class="sales-type-group">
          <div class="sales-type-card" :class="{ active: form.sales_type === 'domestic' }" @click="form.sales_type = 'domestic'; onSalesTypeChange()">
            <div class="sales-type-header">
              <span class="sales-type-title">内销</span>
              <span class="sales-type-badge">CNY</span>
            </div>
            <div class="sales-type-desc">含 {{ ((form.vat_rate || 0.13) * 100).toFixed(0) }}% 增值税</div>
          </div>
          <div class="sales-type-card" :class="{ active: form.sales_type === 'export' }" @click="form.sales_type = 'export'; onSalesTypeChange()">
            <div class="sales-type-header">
              <span class="sales-type-title">外销</span>
              <span class="sales-type-badge">USD</span>
            </div>
            <div class="sales-type-desc">FOB 条款 / 0% 税率</div>
          </div>
        </div>

        <!-- 内销增值税率选择 -->
        <div v-if="form.sales_type === 'domestic'" class="vat-rate-section">
          <el-form-item label="增值税率" prop="vat_rate">
            <el-select v-model="form.vat_rate" placeholder="请选择增值税率" @change="handleCalculateCost" style="width: 200px">
              <el-option v-for="rate in vatRateOptions" :key="rate" :label="`${(rate * 100).toFixed(0)}%`" :value="rate" />
            </el-select>
          </el-form-item>
        </div>

        <!-- 外销运费明细 -->
        <div v-if="form.sales_type === 'export'" class="export-freight-section">
          <div class="freight-panel">
            <div class="freight-panel-header">外销运费明细</div>
            <div class="freight-panel-body">
              <el-row :gutter="24">
                <el-col :span="24">
                  <div class="freight-field">
                    <span class="freight-label">货柜类型:</span>
                    <div class="container-type-btns">
                      <el-button :type="form.shipping_method === 'fcl_20' ? 'primary' : 'default'" @click="form.shipping_method = 'fcl_20'; handleShippingMethodChange()">20GP 小柜</el-button>
                      <el-button :type="form.shipping_method === 'fcl_40' ? 'primary' : 'default'" @click="form.shipping_method = 'fcl_40'; handleShippingMethodChange()">40GP 大柜</el-button>
                      <el-button :type="form.shipping_method === 'lcl' ? 'primary' : 'default'" @click="form.shipping_method = 'lcl'; handleShippingMethodChange()">LCL 散货</el-button>
                    </div>
                  </div>
                </el-col>
              </el-row>

              <el-row :gutter="24" v-if="form.shipping_method">
                <el-col :span="12">
                  <div class="freight-field">
                    <span class="freight-label">起运港口:</span>
                    <el-radio-group v-model="form.port_type" @change="handlePortTypeChange">
                      <el-radio value="fob_shenzhen">FOB 深圳</el-radio>
                      <el-radio value="other">其他港口</el-radio>
                    </el-radio-group>
                  </div>
                </el-col>
                <el-col :span="12" v-if="form.port_type === 'other'">
                  <div class="freight-field">
                    <span class="freight-label">港口名称:</span>
                    <el-input v-model="form.port" placeholder="请输入港口名称" style="width: 200px" />
                  </div>
                </el-col>
              </el-row>

              <el-row :gutter="24" v-if="form.shipping_method">
                <el-col :span="8">
                  <div class="freight-field">
                    <span class="freight-label">数量单位:</span>
                    <el-radio-group v-model="quantityUnit" @change="handleQuantityUnitChange" :disabled="!shippingInfo.pcsPerCarton">
                      <el-radio value="pcs">按片</el-radio>
                      <el-radio value="carton">按箱</el-radio>
                    </el-radio-group>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="freight-field">
                    <span class="freight-label">订购数量:</span>
                    <el-input-number v-model="quantityInput" :min="1" :precision="0" :controls="false" @change="handleQuantityInputChange" style="width: 150px" :disabled="(form.shipping_method === 'fcl_20' || form.shipping_method === 'fcl_40') && form.port_type === 'fob_shenzhen'" />
                    <span class="freight-unit">{{ quantityUnit === 'pcs' ? 'pcs' : '箱' }}</span>
                  </div>
                </el-col>
                <el-col :span="4" v-if="shippingInfo.cartons !== null">
                  <div class="freight-field">
                    <span class="freight-label">箱数:</span>
                    <span class="freight-value">{{ shippingInfo.cartons }}</span>
                  </div>
                </el-col>
                <el-col :span="4" v-if="shippingInfo.cbm !== null">
                  <div class="freight-field">
                    <span class="freight-label">CBM:</span>
                    <span class="freight-value">{{ shippingInfo.cbm }}</span>
                  </div>
                </el-col>
              </el-row>

              <!-- 智能装箱建议 -->
              <div v-if="freightCalculation && freightCalculation.suggestedQuantity" class="smart-packing-tip">
                <el-icon><InfoFilled /></el-icon>
                <div class="tip-content">
                  <div class="tip-title">智能装箱建议:</div>
                  <div>当前数量: {{ form.quantity }} pcs ≈ {{ shippingInfo.cartons }} 箱</div>
                  <div>建议数量: <strong>{{ freightCalculation.suggestedQuantity }} pcs</strong> ({{ freightCalculation.maxCartons }}箱) 以达到最佳装载率</div>
                </div>
              </div>

              <!-- FOB深圳运费计算明细 - 整柜 (FCL) 卡片 -->
              <div v-if="form.port_type === 'fob_shenzhen' && freightCalculation && (form.shipping_method === 'fcl_20' || form.shipping_method === 'fcl_40')" class="mt-4 mb-2 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 shadow-sm overflow-hidden relative group transition-all duration-300 hover:shadow-md">
                <div class="absolute right-0 top-0 w-32 h-32 bg-blue-100/40 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div class="p-5 relative z-10 flex flex-col md:flex-row md:items-stretch gap-6">
                  <div class="flex-1 flex flex-col justify-center min-w-[200px]">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs font-semibold text-blue-600 uppercase tracking-wider bg-blue-100/50 px-2 py-0.5 rounded">整柜运费 ({{ form.shipping_method === 'fcl_40' ? '40GP' : '20GP' }})</span>
                    </div>
                    <div class="flex items-baseline gap-2">
                      <h3 class="text-3xl font-bold text-gray-900 font-mono tracking-tight">
                        <span class="text-lg text-gray-500 font-normal mr-1">¥</span>{{ Math.round(freightCalculation.totalFreight).toLocaleString() }}
                      </h3>
                    </div>
                    <div class="mt-2 flex items-center gap-3 text-sm text-gray-500">
                      <div class="flex items-center gap-1 bg-white/60 px-2 py-1 rounded border border-gray-100">
                        <span class="font-medium text-gray-700">${{ freightCalculation.freightUSD }}</span>
                        <span class="text-xs">USD</span>
                      </div>
                      <span class="text-gray-300">|</span>
                      <span>汇率 {{ freightCalculation.exchangeRate }}</span>
                    </div>
                  </div>
                  <div class="hidden md:block w-px bg-gradient-to-b from-transparent via-blue-200 to-transparent"></div>
                  <div class="flex-1 grid grid-cols-2 gap-y-3 gap-x-4">
                    <div class="space-y-1"><div class="text-xs text-gray-400">单箱材积</div><div class="font-medium text-gray-700">{{ freightCalculation.cartonVolume || '-' }} ft³</div></div>
                    <div class="space-y-1"><div class="text-xs text-gray-400">最大可装</div><div class="font-medium text-blue-700">{{ freightCalculation.maxCartons ? Number(freightCalculation.maxCartons).toLocaleString() : '-' }} 箱</div></div>
                    <div class="space-y-1"><div class="text-xs text-gray-400">每箱只数</div><div class="font-medium text-gray-700">{{ freightCalculation.pcsPerCarton || '-' }} pcs</div></div>
                    <div class="space-y-1"><div class="text-xs text-gray-400">本次数量</div><div class="font-medium text-gray-700">{{ form.quantity ? Number(form.quantity).toLocaleString() : '-' }} pcs</div></div>
                  </div>
                </div>
              </div>

              <!-- 散货 (LCL) 卡片 -->
              <div v-else-if="form.port_type === 'fob_shenzhen' && freightCalculation && form.shipping_method === 'lcl'" class="mt-4 mb-2 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 shadow-sm overflow-hidden relative group transition-all duration-300 hover:shadow-md">
                <div class="absolute right-0 top-0 w-32 h-32 bg-orange-100/40 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div class="p-5 relative z-10 flex flex-col md:flex-row md:items-stretch gap-6">
                  <div class="flex-1 flex flex-col justify-center min-w-[200px]">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs font-semibold text-orange-600 uppercase tracking-wider bg-orange-100/50 px-2 py-0.5 rounded">散货拼箱运费</span>
                    </div>
                    <div class="flex items-baseline gap-2">
                      <h3 class="text-3xl font-bold text-gray-900 font-mono tracking-tight">
                        <span class="text-lg text-gray-500 font-normal mr-1">¥</span>{{ freightCalculation.totalFreight }}
                      </h3>
                    </div>
                    <div class="mt-2 text-sm text-gray-500">
                      <span class="bg-white/60 px-2 py-1 rounded border border-gray-100">计费体积: <span class="font-bold text-gray-800">{{ freightCalculation.ceiledCBM }}</span> CBM</span>
                    </div>
                  </div>
                  <div class="hidden md:block w-px bg-gradient-to-b from-transparent via-orange-200 to-transparent"></div>
                  <div class="flex-1 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                    <div class="flex justify-between"><span class="text-gray-500">基础运费:</span><span class="font-medium text-gray-700">¥{{ freightCalculation.baseFreight }}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">操作费:</span><span class="font-medium text-gray-700">¥{{ freightCalculation.handlingCharge }}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">拼箱费:</span><span class="font-medium text-gray-700">¥{{ freightCalculation.cfs }}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">文件费:</span><span class="font-medium text-gray-700">¥{{ freightCalculation.documentFee }}</span></div>
                    <div class="col-span-2 mt-1 pt-2 border-t border-orange-100 flex justify-between items-center">
                      <span class="text-xs text-gray-400">实际CBM: {{ freightCalculation.cbm }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 运费总价（非FOB深圳时手动输入） -->
              <el-row :gutter="24" v-if="form.port_type !== 'fob_shenzhen'">
                <el-col :span="12">
                  <div class="freight-field">
                    <span class="freight-label">运费总价:</span>
                    <el-input-number v-model="form.freight_total" :min="0" :precision="4" :controls="false" @change="handleCalculateCost" style="width: 200px" />
                    <span class="freight-unit">CNY</span>
                  </div>
                </el-col>
              </el-row>

              <el-row :gutter="24">
                <el-col :span="24">
                  <div class="freight-field freight-field-wide">
                    <span class="freight-label freight-label-wide">运费计入成本:</span>
                    <el-radio-group v-model="form.include_freight_in_base" @change="handleCalculateCost">
                      <el-radio :value="true">是</el-radio>
                      <el-radio :value="false">否（运费在管销价基础上单独计算）</el-radio>
                    </el-radio-group>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>

        <!-- 内销数量输入 -->
        <div v-if="form.sales_type === 'domestic'" class="domestic-quantity-section">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="数量单位">
                <el-radio-group v-model="quantityUnit" @change="handleQuantityUnitChange" :disabled="!shippingInfo.pcsPerCarton">
                  <el-radio value="pcs">按片</el-radio>
                  <el-radio value="carton">按箱</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="quantityUnit === 'pcs' ? '购买数量(片)' : '购买数量(箱)'" prop="quantity">
                <el-input-number v-model="quantityInput" :min="1" :precision="0" :controls="false" @change="handleQuantityInputChange" style="width: 100%" />
                <div v-if="quantityUnit === 'carton' && shippingInfo.pcsPerCarton" class="quantity-hint">= {{ form.quantity }} 片（{{ quantityInput }}箱 × {{ shippingInfo.pcsPerCarton }}片/箱）</div>
              </el-form-item>
            </el-col>
            <el-col :span="5" v-if="shippingInfo.cartons !== null">
              <el-form-item label="箱数"><el-input :value="shippingInfo.cartons" disabled /></el-form-item>
            </el-col>
            <el-col :span="5" v-if="shippingInfo.cbm !== null">
              <el-form-item label="CBM"><el-input :value="shippingInfo.cbm" disabled /></el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="48" class="domestic-freight-row">
            <el-col :span="6">
              <el-form-item label="每CBM单价">
                <el-input-number v-model="domesticCbmPrice" :min="0" :precision="2" :controls="false" @change="handleDomesticCbmPriceChange" style="width: 100%" placeholder="0" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="运费总价" prop="freight_total">
                <el-input-number v-model="form.freight_total" :min="0" :precision="2" :controls="false" @change="handleCalculateCost" style="width: 100%" />
                <div v-if="domesticCbmPrice && shippingInfo.cbm" class="freight-hint">= {{ domesticCbmPrice }} × {{ Math.ceil(parseFloat(shippingInfo.cbm)) }} CBM</div>
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <el-form-item label="运费计入成本">
                <el-radio-group v-model="form.include_freight_in_base" @change="handleCalculateCost">
                  <el-radio :value="true">是</el-radio>
                  <el-radio :value="false">否</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        </div>
      </div>

      <!-- 成本明细 -->
      <div class="cost-section">
        <div class="cost-section-header">
          <h3 class="cost-section-title">成本明细</h3>
        </div>
        <div class="cost-section-body p-0">
          <el-tabs v-model="activeDetailTab" class="cost-detail-tabs">
            <!-- 原料明细 Tab -->
            <el-tab-pane name="materials">
              <template #label><span class="tab-label">原料 <el-badge :value="form.materials.length" :max="99" class="tab-badge" /></span></template>
              <div class="tab-pane-content">
                <div class="tab-pane-actions">
                  <el-button v-if="!editMode.materials && form.materials.some(p => p.from_standard)" type="warning" size="small" @click="toggleEditMode('materials')">解锁编辑</el-button>
                  <el-button v-if="editMode.materials" type="success" size="small" @click="toggleEditMode('materials')">锁定编辑</el-button>
                  <el-button type="primary" size="small" @click="addMaterialRow">添加原料</el-button>
                </div>
                <el-table :data="form.materials" border size="small">
                  <el-table-column width="60" align="center">
                    <template #header><el-tooltip content="勾选后，该原料将在管销价计算后再加入成本" placement="top"><span class="cursor-help text-xs whitespace-nowrap">管销后</span></el-tooltip></template>
                    <template #default="{ row }"><el-checkbox v-model="row.after_overhead" @change="handleCalculateCost" :disabled="row.from_standard && !editMode.materials" /></template>
                  </el-table-column>
                  <el-table-column label="原料名称" min-width="200">
                    <template #default="{ row, $index }">
                      <el-select v-if="!row.from_standard || editMode.materials" v-model="row.material_id" filterable remote reserve-keyword clearable :remote-method="searchMaterials" :loading="materialSearchLoading" placeholder="输入名称或料号搜索" @change="handleMaterialSelect(row, $index)" style="width: 100%">
                        <el-option v-for="material in materialSearchOptions" :key="material.id" :label="`${material.name} (${material.item_no})`" :value="material.id">
                          <div class="flex justify-between w-full"><span>{{ material.name }}</span><span class="text-slate-400 text-xs">¥{{ material.price }}/{{ material.unit }}</span></div>
                        </el-option>
                      </el-select>
                      <span v-else>{{ row.item_name }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="基本用量" width="100">
                    <template #default="{ row }"><el-input-number v-model="row.usage_amount" :min="0" :precision="4" :controls="false" @change="handleItemSubtotalChange(row)" size="small" style="width: 100%" :disabled="row.from_standard && !editMode.materials" /></template>
                  </el-table-column>
                  <el-table-column label="单价(CNY)" width="100"><template #default="{ row }">{{ formatNumber(row.unit_price) || '-' }}</template></el-table-column>
                  <el-table-column label="小计" width="100"><template #default="{ row }">{{ formatNumber(row.subtotal) || '-' }}</template></el-table-column>
                  <el-table-column label="操作" width="70" fixed="right">
                    <template #default="{ $index, row }"><el-button type="danger" size="small" link @click="removeMaterialRow($index)" :disabled="row.from_standard && !editMode.materials">删除</el-button></template>
                  </el-table-column>
                </el-table>
                <div class="tab-pane-footer">
                  <span>∑ 管销前原料: <strong>{{ formatNumber(materialBeforeOverheadTotal) }}</strong></span>
                  <span>管销后原料: <strong class="text-amber-600">{{ formatNumber(materialAfterOverheadTotal) }}</strong></span>
                </div>
              </div>
            </el-tab-pane>

            <!-- 工序明细 Tab -->
            <el-tab-pane name="processes">
              <template #label><span class="tab-label">工序 <el-badge :value="form.processes.length" :max="99" class="tab-badge" /></span></template>
              <div class="tab-pane-content">
                <div class="tab-pane-actions">
                  <el-button v-if="!editMode.processes && form.processes.some(p => p.from_standard)" type="warning" size="small" @click="toggleEditMode('processes')">解锁编辑</el-button>
                  <el-button v-if="editMode.processes" type="success" size="small" @click="toggleEditMode('processes')">锁定编辑</el-button>
                  <el-button type="primary" size="small" @click="addProcessRow">添加工序</el-button>
                </div>
                <el-table :data="form.processes" border size="small">
                  <el-table-column label="工序名称" min-width="150">
                    <template #default="{ row }"><el-input v-model="row.item_name" @change="handleItemSubtotalChange(row)" :disabled="row.from_standard && !editMode.processes" /></template>
                  </el-table-column>
                  <el-table-column label="基本用量" width="100">
                    <template #default="{ row }"><el-input-number v-model="row.usage_amount" :min="0" :precision="4" :controls="false" @change="handleItemSubtotalChange(row)" size="small" style="width: 100%" :disabled="row.from_standard && !editMode.processes" /></template>
                  </el-table-column>
                  <el-table-column label="工价(CNY)" width="100">
                    <template #default="{ row }"><el-input-number v-model="row.unit_price" :min="0" :precision="4" :controls="false" @change="handleItemSubtotalChange(row)" size="small" style="width: 100%" :disabled="row.from_standard && !editMode.processes" /></template>
                  </el-table-column>
                  <el-table-column label="小计" width="100"><template #default="{ row }">{{ formatNumber(row.subtotal) }}</template></el-table-column>
                  <el-table-column label="操作" width="70" fixed="right">
                    <template #default="{ $index, row }"><el-button type="danger" size="small" link @click="removeProcessRow($index)" :disabled="row.from_standard && !editMode.processes">删除</el-button></template>
                  </el-table-column>
                </el-table>
                <div class="tab-pane-footer">
                  <span>∑ 工序小计: <strong>{{ formatNumber(processSubtotal) }}</strong></span>
                  <span>工价系数({{ configStore.config.process_coefficient || 1.56 }}): <strong class="text-emerald-600">{{ formatNumber(processSubtotal * (configStore.config.process_coefficient || 1.56)) }}</strong></span>
                </div>
              </div>
            </el-tab-pane>

            <!-- 包材明细 Tab -->
            <el-tab-pane name="packaging">
              <template #label><span class="tab-label">包材 <el-badge :value="form.packaging.length" :max="99" class="tab-badge" /></span></template>
              <div class="tab-pane-content">
                <div class="tab-pane-actions">
                  <el-button v-if="!editMode.packaging && form.packaging.some(p => p.from_standard)" type="warning" size="small" @click="toggleEditMode('packaging')">解锁编辑</el-button>
                  <el-button v-if="editMode.packaging" type="success" size="small" @click="toggleEditMode('packaging')">锁定编辑</el-button>
                  <el-button type="primary" size="small" @click="addPackagingRow">添加包材</el-button>
                </div>
                <el-table :data="form.packaging" border size="small">
                  <el-table-column label="包材名称" min-width="180">
                    <template #default="{ row, $index }">
                      <el-select v-if="!row.from_standard || editMode.packaging" v-model="row.material_id" filterable remote reserve-keyword clearable :remote-method="searchMaterials" :loading="materialSearchLoading" placeholder="输入名称或料号搜索" @change="handlePackagingMaterialSelect(row, $index)" style="width: 100%">
                        <el-option v-for="material in materialSearchOptions" :key="material.id" :label="`${material.name} (${material.item_no})`" :value="material.id">
                          <div class="flex justify-between w-full"><span>{{ material.name }}</span><span class="text-slate-400 text-xs">¥{{ material.price }}/{{ material.unit }}</span></div>
                        </el-option>
                      </el-select>
                      <span v-else>{{ row.item_name }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="基本用量" width="100">
                    <template #default="{ row }"><el-input-number v-model="row.usage_amount" :min="0" :precision="4" :controls="false" @change="handleItemSubtotalChange(row)" size="small" style="width: 100%" :disabled="row.from_standard && !editMode.packaging" /></template>
                  </el-table-column>
                  <el-table-column label="单价(CNY)" width="100"><template #default="{ row }">{{ formatNumber(row.unit_price) || '-' }}</template></el-table-column>
                  <el-table-column label="小计" width="100"><template #default="{ row }">{{ formatNumber(row.subtotal) || '-' }}</template></el-table-column>
                  <el-table-column label="操作" width="70" fixed="right">
                    <template #default="{ $index, row }"><el-button type="danger" size="small" link @click="removePackagingRow($index)" :disabled="row.from_standard && !editMode.packaging">删除</el-button></template>
                  </el-table-column>
                </el-table>
                <div class="tab-pane-footer"><span>∑ 包材小计: <strong>{{ formatNumber(packagingTotal) }}</strong></span></div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 成本计算 -->
      <div class="cost-section cost-section-highlight" v-if="calculation">
        <div class="cost-section-header"><h3 class="cost-section-title">成本计算</h3></div>
        <div class="cost-section-body">
        <div class="cost-summary-grid">
          <div class="cost-summary-card"><div class="cost-summary-label">基础成本价</div><div class="cost-summary-value">{{ formatNumber(calculation.baseCost) }} CNY</div></div>
          <div class="cost-summary-card"><div class="cost-summary-label">运费成本</div><div class="cost-summary-value">{{ formatNumber(calculation.freightCost) }} CNY</div></div>
          <div class="cost-summary-card"><div class="cost-summary-label">管销价</div><div class="cost-summary-value">{{ formatNumber(calculation.overheadPrice) }} CNY</div><el-button size="small" type="primary" link @click="showAddFeeDialog" class="cost-summary-action">添加费用项</el-button></div>
        </div>
        <div v-if="customFeesWithValues.length > 0" class="custom-fee-list">
          <div v-for="(fee, index) in customFeesWithValues" :key="'fee-' + index" class="custom-fee-item">
            <span class="custom-fee-name">{{ fee.name }} ({{ (fee.rate * 100).toFixed(0) }}%)</span>
            <div class="flex items-center gap-3"><span class="custom-fee-value">{{ formatNumber(fee.calculatedValue) }}</span><el-button size="small" type="danger" link @click="handleRemoveCustomFee(index)">删除</el-button></div>
          </div>
        </div>
        <div v-if="calculation.afterOverheadMaterialTotal > 0" class="cost-tip warning">管销后算原料: <strong>{{ formatNumber(calculation.afterOverheadMaterialTotal) }}</strong></div>
        <div class="cost-final-box">
          <div class="cost-final-label">最终成本价</div>
          <div class="cost-final-value"><span v-if="form.sales_type === 'domestic'">{{ formatNumber(calculation.domesticPrice) }} CNY</span><span v-else>{{ formatNumber(calculation.insurancePrice) }} USD</span></div>
          <div class="cost-final-info"><span v-if="form.sales_type === 'export'">汇率: {{ formatNumber(calculation.exchangeRate) }} | 保险: 0.3%</span><span v-else>含 {{ ((form.vat_rate || 0.13) * 100).toFixed(0) }}% 增值税</span></div>
        </div>
        </div>
      </div>

      <!-- 利润区间 -->
      <div class="cost-section" v-if="calculation && calculation.profitTiers">
        <div class="cost-section-header"><h3 class="cost-section-title">利润区间</h3><el-button type="primary" size="small" @click="handleAddCustomProfitTier">添加档位</el-button></div>
        <div class="cost-section-body">
        <div class="profit-tier-grid">
          <div v-for="tier in allProfitTiers" :key="tier.isCustom ? 'custom-' + tier.customIndex : 'system-' + tier.profitPercentage" class="profit-tier-card" :class="{ custom: tier.isCustom }">
            <div class="profit-tier-label">
              <span v-if="!tier.isCustom">{{ tier.profitPercentage }} 利润</span>
              <div v-else class="flex items-center gap-1">
                <el-input v-model="tier.originalTier.profitRate" placeholder="如0.35" size="small" style="width: 60px" @input="handleUpdateCustomTierPrice(tier.originalTier)" />
                <span v-if="tier.originalTier.profitRate" class="text-xs text-blue-600">{{ (parseFloat(tier.originalTier.profitRate) * 100).toFixed(0) }}%</span>
              </div>
            </div>
            <div class="profit-tier-value">{{ formatNumber(tier.price) }} {{ calculation.currency }}</div>
            <el-button v-if="tier.isCustom" type="danger" size="small" link @click="handleRemoveCustomProfitTier(tier.customIndex)" class="profit-tier-remove">删除</el-button>
          </div>
        </div>
        </div>
      </div>
    </el-form>

    <!-- 粘性底部栏 -->
    <div class="cost-sticky-footer">
      <div class="sticky-footer-left">
        <template v-if="calculation">
          <div class="sticky-price-item primary">
            <span class="sticky-price-label">最终成本价</span>
            <span class="sticky-price-value"><template v-if="form.sales_type === 'domestic'">{{ formatNumber(calculation.domesticPrice) }} CNY</template><template v-else>{{ formatNumber(calculation.insurancePrice) }} USD</template></span>
          </div>
          <div class="sticky-price-divider"></div>
          <div class="sticky-price-item secondary"><span class="sticky-price-label">基础成本</span><span class="sticky-price-value">{{ formatNumber(calculation.baseCost) }}</span></div>
          <div class="sticky-price-item secondary"><span class="sticky-price-label">运费</span><span class="sticky-price-value">{{ formatNumber(calculation.freightCost) }}</span></div>
          <div class="sticky-price-item secondary"><span class="sticky-price-label">管销价</span><span class="sticky-price-value">{{ formatNumber(calculation.overheadPrice) }}</span></div>
        </template>
        <span v-else class="sticky-placeholder">请完成表单填写以计算成本</span>
      </div>
      <div class="sticky-footer-right">
        <el-button @click="goBack" size="large">取消</el-button>
        <el-button type="info" @click="handleSaveDraft" :loading="saving" size="large">保存草稿</el-button>
        <el-button type="primary" @click="handleSubmitQuotation" :loading="submitting" size="large">提交审核</el-button>
      </div>
    </div>

    <!-- 添加自定义费用对话框 -->
    <el-dialog v-model="addFeeDialogVisible" title="添加自定义费用" width="400px" :close-on-click-modal="false" append-to-body>
      <el-form :model="newFee" :rules="feeRules" ref="feeFormRef" label-width="80px">
        <el-form-item label="费用项" prop="name"><el-input v-model="newFee.name" placeholder="" /></el-form-item>
        <el-form-item label="费率" prop="rate">
          <el-input v-model="newFee.rate" placeholder="如 0.04 表示 4%" style="width: 180px;" @blur="newFee.rate = newFee.rate ? parseFloat(newFee.rate) : null" />
          <span v-if="newFee.rate && !isNaN(newFee.rate)" style="margin-left: 10px; color: #409eff;">{{ (parseFloat(newFee.rate) * 100).toFixed(0) }}%</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFeeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAddFee">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { formatNumber } from '@/utils/format'
import { useConfigStore } from '@/store/config'
import logger from '@/utils/logger'
import { getPackagingTypeName, formatPackagingMethodFromConfig, calculateTotalFromConfig, PACKAGING_TYPES } from '@/config/packagingTypes'
import { useFreightCalculation, useCostCalculation, useQuotationData, useCustomerSearch, useMaterialSearch, useCustomFees } from '@/composables'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const configStore = useConfigStore()
const activeDetailTab = ref('materials')

// 表单数据
const form = reactive({
  regulation_id: null, model_id: null, packaging_config_id: null,
  customer_name: '', customer_region: '', sales_type: 'domestic',
  shipping_method: '', port_type: 'fob_shenzhen', port: '',
  quantity: null, freight_total: null, include_freight_in_base: true,
  vat_rate: null, materials: [], processes: [], packaging: [], customFees: []
})

// 编辑状态控制
const editMode = reactive({ materials: false, processes: false, packaging: false })
const currentModelCategory = ref('')

// Composables
const { freightCalculation, systemConfig, shippingInfo, quantityUnit, quantityInput, domesticCbmPrice, loadSystemConfig, setShippingInfoFromConfig, calculateShippingInfo, calculateFOBFreight, onQuantityUnitChange, onQuantityInputChange, onDomesticCbmPriceChange, onShippingMethodChange, onPortTypeChange, resetShippingInfo } = useFreightCalculation()
const { calculation, customProfitTiers, materialCoefficient, materialCoefficientsCache, loadMaterialCoefficients, calculateItemSubtotal, calculateCost, addCustomProfitTier, updateCustomTierPrice, removeCustomProfitTier, prepareCustomProfitTiersForSave, getAllProfitTiers } = useCostCalculation()
const { saving, submitting, isSaved, loadRegulations, loadPackagingConfigs, loadBomMaterials, loadPackagingConfigDetails, loadQuotationData, loadStandardCostData, saveQuotation, submitQuotation } = useQuotationData()
const { isNewCustomer, selectedCustomerId, customerOptions, customerSearchLoading, customerSelectFocused, onCustomerTypeChange, searchCustomers, onCustomerSelect } = useCustomerSearch()
const { allMaterials, materialSearchOptions, materialSearchLoading, loadAllMaterials, searchMaterials, onMaterialSelect, onPackagingMaterialSelect } = useMaterialSearch()

// 数据列表
const regulations = ref([])
const packagingConfigs = ref([])

// computed
const vatRateOptions = computed(() => configStore.config.vat_rate_options || [0.13, 0.10])
const isEditMode = computed(() => !!route.params.id)
const pageTitle = computed(() => {
  if (route.params.id) return '编辑报价单'
  if (route.query.copyFrom) return '复制报价单'
  if (currentModelCategory.value) return `新增报价单 - ${currentModelCategory.value}`
  return '新增报价单'
})
const selectedConfigInfo = computed(() => {
  if (!form.packaging_config_id || !packagingConfigs.value.length) return ''
  const config = packagingConfigs.value.find(c => c.id === form.packaging_config_id)
  return config ? `${config.model_name} - ${config.config_name}` : ''
})
const filteredPackagingConfigs = computed(() => {
  if (!form.regulation_id) return []
  let filtered = packagingConfigs.value.filter(c => c.regulation_id === form.regulation_id)
  if (currentModelCategory.value) filtered = filtered.filter(c => c.model_category === currentModelCategory.value)
  return filtered
})
const groupedPackagingConfigs = computed(() => {
  const configs = filteredPackagingConfigs.value
  if (!configs.length) return []
  const groups = {}
  for (const config of configs) {
    const type = config.packaging_type || 'standard_box'
    if (!groups[type]) groups[type] = { type, typeName: getPackagingTypeName(type) || '标准彩盒', configs: [] }
    groups[type].configs.push(config)
  }
  const orderedTypes = Object.keys(PACKAGING_TYPES)
  return orderedTypes.filter(type => groups[type]?.configs.length > 0).map(type => groups[type])
})
const materialBeforeOverheadTotal = computed(() => form.materials.filter(item => !item.after_overhead).reduce((sum, item) => sum + item.subtotal, 0))
const materialAfterOverheadTotal = computed(() => form.materials.filter(item => item.after_overhead).reduce((sum, item) => sum + item.subtotal, 0))
const processSubtotal = computed(() => form.processes.reduce((sum, item) => sum + item.subtotal, 0))
const packagingTotal = computed(() => form.packaging.reduce((sum, item) => sum + item.subtotal, 0))
const allProfitTiers = getAllProfitTiers
const hasFormData = computed(() => form.customer_name || form.model_id || form.materials.length > 0 || form.processes.length > 0 || form.packaging.length > 0)

// 自定义费用
const { addFeeDialogVisible, feeFormRef, newFee, feeRules, customFeeSummary, customFeesWithValues, showAddFeeDialog, confirmAddFee, removeCustomFee } = useCustomFees(form, calculation)

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

// 处理函数
const handleCalculateCost = () => calculateCost(form)
const handleQuantityUnitChange = () => onQuantityUnitChange(form, handleCalculateCost)
const handleQuantityInputChange = () => onQuantityInputChange(form, handleCalculateCost)
const handleDomesticCbmPriceChange = () => onDomesticCbmPriceChange(form, handleCalculateCost)
const handleShippingMethodChange = () => onShippingMethodChange(form, handleCalculateCost)
const handlePortTypeChange = () => onPortTypeChange(form, handleCalculateCost)
const handleCustomerTypeChange = (val) => onCustomerTypeChange(val, form)
const handleCustomerSelect = (customerId) => onCustomerSelect(customerId, form)
const handleMaterialSelect = (row, index) => { onMaterialSelect(row, materialCoefficient.value, (r) => { calculateItemSubtotal(r); handleCalculateCost() }) }
const handlePackagingMaterialSelect = (row, index) => { onPackagingMaterialSelect(row, (r) => { calculateItemSubtotal(r); handleCalculateCost() }) }
const handleItemSubtotalChange = (row) => { calculateItemSubtotal(row); handleCalculateCost() }
const handleAddCustomProfitTier = () => { if (!addCustomProfitTier()) ElMessage.warning('请先完成基础信息填写') }
const handleUpdateCustomTierPrice = (tier) => updateCustomTierPrice(tier)
const handleRemoveCustomProfitTier = (index) => removeCustomProfitTier(index)
const handleConfirmAddFee = () => confirmAddFee(handleCalculateCost)
const handleRemoveCustomFee = (index) => removeCustomFee(index, handleCalculateCost)

const onRegulationChange = () => {
  form.packaging_config_id = null
  form.model_id = null
  form.materials = []
  form.processes = []
  form.packaging = []
  calculation.value = null
}

const onSalesTypeChange = () => {
  if (form.sales_type === 'domestic') {
    form.shipping_method = ''
    form.port_type = 'fob_shenzhen'
    form.port = ''
    freightCalculation.value = null
  }
  handleCalculateCost()
}

const onPackagingConfigChange = async () => {
  if (!form.packaging_config_id) return
  try {
    const data = await loadPackagingConfigDetails(form.packaging_config_id)
    if (!data) return
    const { config, processes, materials } = data
    form.model_id = config.model_id
    const selectedConfig = packagingConfigs.value.find(c => c.id === form.packaging_config_id)
    if (selectedConfig?.model_category) {
      currentModelCategory.value = selectedConfig.model_category
      if (Object.keys(materialCoefficientsCache.value).length === 0) await loadMaterialCoefficients(currentModelCategory.value)
      else if (materialCoefficientsCache.value[selectedConfig.model_category]) materialCoefficient.value = materialCoefficientsCache.value[selectedConfig.model_category]
    }
    const pcsPerCarton = calculateTotalFromConfig(config)
    const cartonMaterial = materials.find(m => m.carton_volume && parseFloat(m.carton_volume) > 0)
    setShippingInfoFromConfig(pcsPerCarton, cartonMaterial ? parseFloat(cartonMaterial.carton_volume) : null)
    if (form.quantity) quantityInput.value = quantityUnit.value === 'carton' ? Math.ceil(form.quantity / pcsPerCarton) : form.quantity
    form.materials = await loadBomMaterials(config.model_id, materialCoefficient.value)
    editMode.materials = false
    form.processes = (processes || []).map(p => ({ category: 'process', item_name: p.process_name, usage_amount: 1, unit_price: parseFloat(p.unit_price) || 0, subtotal: parseFloat(p.unit_price) || 0, is_changed: 0, from_standard: true }))
    form.packaging = (materials || []).map(m => ({ category: 'packaging', item_name: m.material_name, usage_amount: parseFloat(m.basic_usage) || 0, unit_price: parseFloat(m.unit_price) || 0, carton_volume: m.carton_volume ? parseFloat(m.carton_volume) : null, subtotal: (parseFloat(m.basic_usage) || 0) !== 0 ? (parseFloat(m.unit_price) || 0) / (parseFloat(m.basic_usage) || 1) : 0, is_changed: 0, from_standard: true }))
    editMode.processes = false
    editMode.packaging = false
    calculateShippingInfo(form, handleCalculateCost)
    handleCalculateCost()
    if (form.processes.length > 0 || form.packaging.length > 0) ElMessage.success(`已加载 ${config.config_name}：${form.processes.length} 个工序和 ${form.packaging.length} 个包材`)
    else ElMessage.warning('该配置暂无绑定的工序和包材数据')
  } catch (error) {
    logger.error('加载包装配置数据失败:', error)
    ElMessage.error('加载包装配置数据失败')
  }
}

const toggleEditMode = (section) => { editMode[section] = !editMode[section]; if (editMode[section]) ElMessage.info(`${section === 'materials' ? '原料' : section === 'processes' ? '工序' : '包材'}明细已解锁，可以编辑`) }
const addMaterialRow = () => form.materials.push({ category: 'material', material_id: null, item_name: '', usage_amount: null, unit_price: null, subtotal: 0, is_changed: 1, from_standard: false, after_overhead: false })
const addProcessRow = () => form.processes.push({ category: 'process', item_name: '', usage_amount: null, unit_price: null, subtotal: 0, is_changed: 1, from_standard: false })
const addPackagingRow = () => form.packaging.push({ category: 'packaging', material_id: null, item_name: '', usage_amount: null, unit_price: null, carton_volume: null, subtotal: 0, is_changed: 1, from_standard: false })
const removeMaterialRow = (index) => { form.materials.splice(index, 1); handleCalculateCost() }
const removeProcessRow = (index) => { form.processes.splice(index, 1); handleCalculateCost() }
const removePackagingRow = (index) => { form.packaging.splice(index, 1); handleCalculateCost() }
const goBack = () => router.back()

const prepareData = () => ({
  customer_name: form.customer_name, customer_region: form.customer_region,
  model_id: form.model_id, regulation_id: form.regulation_id, packaging_config_id: form.packaging_config_id,
  quantity: form.quantity, freight_total: form.freight_total || 0, sales_type: form.sales_type,
  shipping_method: form.shipping_method || null, port: form.port || null,
  include_freight_in_base: form.include_freight_in_base, vat_rate: form.vat_rate,
  custom_profit_tiers: prepareCustomProfitTiersForSave(), custom_fees: form.customFees,
  items: [...form.materials, ...form.processes, ...form.packaging]
})

const handleSaveDraft = async () => {
  try {
    await formRef.value.validate()
    if ([...form.materials, ...form.processes, ...form.packaging].length === 0) { ElMessage.warning('请至少添加一项明细'); return }
    const res = await saveQuotation(route.params.id, prepareData())
    if (res) router.push('/cost/records')
  } catch (error) { logger.error('保存失败:', error); ElMessage.error('保存失败') }
}

const handleSubmitQuotation = async () => {
  try {
    await formRef.value.validate()
    if ([...form.materials, ...form.processes, ...form.packaging].length === 0) { ElMessage.warning('请至少添加一项明细'); return }
    const res = await submitQuotation(route.params.id, prepareData())
    if (res) router.push('/cost/records')
  } catch (error) { logger.error('提交失败:', error); ElMessage.error('提交失败') }
}

const fillQuotationData = async (data, isCopy = false) => {
  const { quotation, items, customFees: fees } = data
  form.regulation_id = quotation.regulation_id
  form.packaging_config_id = quotation.packaging_config_id || null
  form.model_id = quotation.model_id
  form.customer_name = isCopy ? `${quotation.customer_name}（复制）` : quotation.customer_name
  form.customer_region = quotation.customer_region
  form.sales_type = quotation.sales_type
  form.shipping_method = quotation.shipping_method || ''
  form.port_type = quotation.port === 'FOB深圳' ? 'fob_shenzhen' : 'other'
  form.port = quotation.port || ''
  form.quantity = quotation.quantity ? parseInt(quotation.quantity) : null
  form.freight_total = quotation.freight_total ? parseFloat(quotation.freight_total) : null
  form.include_freight_in_base = quotation.include_freight_in_base !== false
  form.vat_rate = quotation.vat_rate !== null ? parseFloat(quotation.vat_rate) : (configStore.config.vat_rate || 0.13)
  form.materials = items.material.items.map(item => ({ category: 'material', material_id: item.material_id || null, item_name: item.item_name, usage_amount: parseFloat(item.usage_amount) || 0, unit_price: parseFloat(item.unit_price) || 0, subtotal: parseFloat(item.subtotal) || 0, is_changed: item.is_changed || 0, from_standard: true, after_overhead: item.after_overhead || false, coefficient_applied: true }))
  form.processes = items.process.items.map(item => ({ category: 'process', item_name: item.item_name, usage_amount: parseFloat(item.usage_amount) || 0, unit_price: parseFloat(item.unit_price) || 0, subtotal: parseFloat(item.subtotal) || 0, is_changed: item.is_changed || 0, from_standard: true }))
  form.packaging = items.packaging.items.map(item => ({ category: 'packaging', material_id: item.material_id || null, item_name: item.item_name, usage_amount: parseFloat(item.usage_amount) || 0, unit_price: parseFloat(item.unit_price) || 0, carton_volume: item.carton_volume ? parseFloat(item.carton_volume) : null, subtotal: parseFloat(item.subtotal) || 0, is_changed: item.is_changed || 0, from_standard: true }))
  // 从原料库匹配原料ID（处理旧数据）
  form.materials.forEach(m => { if (!m.material_id) { const found = allMaterials.value.find(mat => mat.name === m.item_name); if (found) m.material_id = found.id } })
  form.packaging.forEach(p => { if (!p.material_id) { const found = allMaterials.value.find(mat => mat.name === p.item_name); if (found) p.material_id = found.id } })
  if (quotation.pc_per_bag && quotation.bags_per_box && quotation.boxes_per_carton) {
    const pcsPerCarton = quotation.pc_per_bag * quotation.bags_per_box * quotation.boxes_per_carton
    const cartonMaterial = items.packaging.items.find(item => item.carton_volume && item.carton_volume > 0)
    setShippingInfoFromConfig(pcsPerCarton, cartonMaterial?.carton_volume || null)
    quantityInput.value = form.quantity
    quantityUnit.value = 'pcs'
    calculateShippingInfo(form, handleCalculateCost)
  }
  if (!quantityInput.value && form.quantity) { quantityInput.value = form.quantity; quantityUnit.value = 'pcs' }
  if (quotation.custom_profit_tiers) {
    try { const parsed = JSON.parse(quotation.custom_profit_tiers); customProfitTiers.value = parsed.map(t => ({ profitRate: t.profitRate, profitPercentage: t.profitPercentage, price: t.price })) }
    catch (e) { customProfitTiers.value = [] }
  }
  if (fees?.length > 0) form.customFees = fees.map((fee, i) => ({ name: fee.name, rate: fee.rate, sortOrder: fee.sortOrder ?? i }))
  else form.customFees = []
  handleCalculateCost()
  ElMessage.success(isCopy ? '报价单数据已复制，请修改后保存' : '报价单数据已加载')
}

const fillStandardCostData = async (data) => {
  const { standardCost, items } = data
  if (standardCost.model_category) { currentModelCategory.value = standardCost.model_category; if (materialCoefficientsCache.value[standardCost.model_category]) materialCoefficient.value = materialCoefficientsCache.value[standardCost.model_category] }
  form.regulation_id = standardCost.regulation_id || null
  await nextTick()
  form.packaging_config_id = standardCost.packaging_config_id || null
  form.model_id = standardCost.model_id || null
  form.customer_name = ''
  form.customer_region = ''
  form.sales_type = standardCost.sales_type
  form.shipping_method = ''
  form.port_type = 'fob_shenzhen'
  form.port = ''
  form.quantity = standardCost.quantity
  form.freight_total = 0
  form.include_freight_in_base = true
  form.vat_rate = configStore.config.vat_rate || 0.13
  if (standardCost.pc_per_bag && standardCost.bags_per_box && standardCost.boxes_per_carton) {
    const pcsPerCarton = standardCost.pc_per_bag * standardCost.bags_per_box * standardCost.boxes_per_carton
    setShippingInfoFromConfig(pcsPerCarton, null)
    quantityInput.value = standardCost.quantity
    quantityUnit.value = 'pcs'
  }
  if (items?.material) form.materials = items.material.items.map(item => ({ category: 'material', material_id: item.material_id || null, item_name: item.item_name, usage_amount: parseFloat(item.usage_amount) || 0, unit_price: parseFloat(item.unit_price) || 0, subtotal: parseFloat(item.subtotal) || 0, is_changed: 0, from_standard: true, after_overhead: item.after_overhead || false, coefficient_applied: true }))
  if (items?.process) form.processes = items.process.items.map(item => ({ category: 'process', item_name: item.item_name, usage_amount: parseFloat(item.usage_amount) || 0, unit_price: parseFloat(item.unit_price) || 0, subtotal: parseFloat(item.subtotal) || 0, is_changed: 0, from_standard: true }))
  if (items?.packaging) {
    form.packaging = items.packaging.items.map(item => ({ category: 'packaging', material_id: item.material_id || null, item_name: item.item_name, usage_amount: parseFloat(item.usage_amount) || 0, unit_price: parseFloat(item.unit_price) || 0, carton_volume: item.carton_volume ? parseFloat(item.carton_volume) : null, subtotal: parseFloat(item.subtotal) || 0, is_changed: 0, from_standard: true }))
    const cartonMaterial = items.packaging.items.find(item => item.carton_volume && item.carton_volume > 0)
    if (cartonMaterial) shippingInfo.cartonVolume = cartonMaterial.carton_volume
  }
  // 从原料库匹配原料ID（处理旧数据）
  form.materials.forEach(m => { if (!m.material_id) { const found = allMaterials.value.find(mat => mat.name === m.item_name); if (found) m.material_id = found.id } })
  form.packaging.forEach(p => { if (!p.material_id) { const found = allMaterials.value.find(mat => mat.name === p.item_name); if (found) p.material_id = found.id } })
  if (form.quantity && shippingInfo.pcsPerCarton) calculateShippingInfo(form, handleCalculateCost)
  handleCalculateCost()
  ElMessage.success('标准成本数据已复制，请填写客户信息后保存')
}

onMounted(async () => {
  await configStore.loadConfig()
  await loadSystemConfig()
  regulations.value = await loadRegulations()
  packagingConfigs.value = await loadPackagingConfigs()
  await loadAllMaterials()
  await loadMaterialCoefficients(currentModelCategory.value)
  form.vat_rate = configStore.config.vat_rate || 0.13
  if (route.query.model_category) {
    currentModelCategory.value = route.query.model_category
    if (materialCoefficientsCache.value[route.query.model_category]) materialCoefficient.value = materialCoefficientsCache.value[route.query.model_category]
  }
  if (route.params.id) { const data = await loadQuotationData(route.params.id); if (data) await fillQuotationData(data, false) }
  else if (route.query.copyFromStandardCost) { const data = await loadStandardCostData(route.query.copyFromStandardCost); if (data) await fillStandardCostData(data) }
  else if (route.query.copyFrom) { const data = await loadQuotationData(route.query.copyFrom); if (data) await fillQuotationData(data, true) }
})

onBeforeRouteLeave((to, from, next) => {
  if (!isSaved.value && hasFormData.value) { if (window.confirm('您有未保存的数据，确定要离开吗？')) next(); else next(false) }
  else next()
})
</script>

<style scoped>
.cost-add-container { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #fff; border-radius: 8px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.page-header .header-left { display: flex; align-items: center; }
.page-header .header-center h2 { margin: 0; font-size: 20px; color: #303133; }
.page-header .back-btn { font-size: 14px; color: #606266; }
.form-section { margin-bottom: 16px; border-radius: 8px; }
.section-title { font-size: 15px; font-weight: 600; color: #303133; }
.section-header { display: flex; justify-content: space-between; align-items: center; }
.config-option { display: flex; justify-content: space-between; width: 100%; }
.config-method { color: #8492a6; font-size: 12px; }
.customer-region { float: right; color: #8492a6; font-size: 12px; }
.sales-type-cards { display: flex; gap: 20px; margin-bottom: 20px; }
.sales-card { flex: 1; padding: 20px; border: 2px solid #e4e7ed; border-radius: 8px; cursor: pointer; transition: all 0.3s; text-align: center; }
.sales-card:hover { border-color: #409eff; }
.sales-card.active { border-color: #409eff; background: #ecf5ff; }
.sales-card-title { font-size: 18px; font-weight: 600; color: #303133; margin-bottom: 8px; }
.sales-card-desc { font-size: 13px; color: #909399; line-height: 1.6; }
.vat-rate-section { margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e4e7ed; }
.export-freight-section { margin-top: 20px; }
.freight-panel { border: 1px solid #e4e7ed; border-radius: 8px; overflow: hidden; }
.freight-panel-header { background: #f5f7fa; padding: 12px 16px; font-weight: 600; color: #303133; border-bottom: 1px solid #e4e7ed; }
.freight-panel-body { padding: 16px; }
.freight-field { display: flex; align-items: center; margin-bottom: 12px; }
.freight-field-wide { margin-bottom: 16px; }
.freight-label { width: 80px; color: #606266; font-size: 14px; flex-shrink: 0; }
.freight-label-wide { width: 110px; }
.freight-unit { margin-left: 8px; color: #909399; }
.freight-value { font-weight: 600; color: #303133; }
.container-type-btns { display: flex; gap: 10px; }
.smart-packing-tip { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 6px; margin: 16px 0; }
.smart-packing-tip .el-icon { color: #1890ff; font-size: 18px; margin-top: 2px; }
.tip-content { flex: 1; }
.tip-title { font-weight: 600; color: #1890ff; margin-bottom: 4px; }
.tip-content div { color: #606266; font-size: 13px; line-height: 1.6; }
.domestic-quantity-section { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #e4e7ed; }
.domestic-freight-row { margin-top: 16px; }
.quantity-hint { color: #67c23a; font-size: 12px; margin-top: 4px; }
.freight-hint { color: #909399; font-size: 12px; margin-top: 4px; }
.cost-detail-section { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #ebeef5; }
.cost-detail-section:last-child { border-bottom: none; margin-bottom: 0; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.detail-title { font-size: 14px; font-weight: 600; color: #606266; }
.detail-actions { display: flex; gap: 8px; }
.detail-table { margin-bottom: 8px; }
.help-cursor { cursor: help; }
.subtotal-row { display: flex; justify-content: flex-end; gap: 24px; padding: 8px 0; font-size: 14px; color: #606266; }
.subtotal-row strong { color: #409eff; }
.subtotal-row .after-overhead strong { color: #e6a23c; }
.subtotal-row .process-total .highlight { color: #67c23a; }
.material-option { display: flex; justify-content: space-between; width: 100%; }
.material-price { color: #8492a6; font-size: 13px; }
.cost-cards { display: flex; gap: 16px; margin-bottom: 20px; }
.cost-card { flex: 1; padding: 16px; background: #f5f7fa; border-radius: 8px; text-align: center; position: relative; }
.cost-card-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.cost-card-value { font-size: 18px; font-weight: 600; color: #303133; }
.add-fee-btn { position: absolute; bottom: 8px; right: 8px; }
.custom-fees { margin-bottom: 16px; }
.fee-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #fdf6ec; border-radius: 4px; margin-bottom: 8px; }
.fee-name { color: #e6a23c; font-size: 13px; }
.fee-value { font-weight: 600; color: #303133; }
.after-overhead-material { padding: 8px 12px; background: #fdf6ec; border-radius: 4px; margin-bottom: 16px; color: #e6a23c; }
.after-overhead-material strong { margin-left: 8px; }
.final-cost-box { background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%); border-radius: 8px; padding: 20px; text-align: center; color: #fff; }
.final-cost-label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
.final-cost-value { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
.final-cost-info { font-size: 12px; opacity: 0.8; }
.profit-tier-cards { display: flex; gap: 12px; flex-wrap: wrap; }
.profit-card { flex: 1; min-width: 120px; padding: 16px; border: 1px solid #e4e7ed; border-radius: 8px; text-align: center; position: relative; }
.profit-card.custom { border-color: #e6a23c; background: #fdf6ec; }
.profit-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.profit-price { font-size: 18px; font-weight: 600; color: #303133; }
.remove-tier-btn { position: absolute; top: 4px; right: 4px; }
.custom-rate-input { display: flex; align-items: center; gap: 4px; }
.rate-display { font-size: 12px; color: #409eff; }
.action-bar { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #fff; border-radius: 8px; margin-top: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.action-right { display: flex; gap: 12px; }
:deep(.el-input-number) { width: 100%; }
</style>
