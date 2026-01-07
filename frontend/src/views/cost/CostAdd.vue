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
              <el-select
                v-model="form.regulation_id"
                placeholder="请选择法规标准"
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
              <el-radio-group v-model="isNewCustomer" @change="onCustomerTypeChange">
                <el-radio :label="true">是</el-radio>
                <el-radio :label="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customer_name">
              <el-input v-if="isNewCustomer" v-model="form.customer_name" placeholder="请输入客户名称" clearable />
              <el-select
                v-else
                v-model="selectedCustomerId"
                filterable
                remote
                reserve-keyword
                clearable
                :remote-method="searchCustomers"
                :loading="customerSearchLoading"
                placeholder="输入关键词搜索客户"
                style="width: 100%"
                @change="onCustomerSelect"
                @focus="customerSelectFocused = true"
                @blur="customerSelectFocused = false"
              >
                <el-option
                  v-for="c in customerOptions"
                  :key="c.id"
                  :label="customerSelectFocused ? `${c.vc_code} - ${c.name}` : c.name"
                  :value="c.id"
                >
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

      <!-- 销售类型 - 卡片式选择器 -->
      <div class="cost-section">
        <div class="cost-section-header">
          <h3 class="cost-section-title">销售类型</h3>
        </div>
        <div class="cost-section-body">

        <div class="sales-type-group">
          <div
            class="sales-type-card"
            :class="{ active: form.sales_type === 'domestic' }"
            @click="form.sales_type = 'domestic'; onSalesTypeChange()"
          >
            <div class="sales-type-header">
              <span class="sales-type-title">内销</span>
              <span class="sales-type-badge">CNY</span>
            </div>
            <div class="sales-type-desc">含 {{ ((form.vat_rate || 0.13) * 100).toFixed(0) }}% 增值税</div>
          </div>
          <div
            class="sales-type-card"
            :class="{ active: form.sales_type === 'export' }"
            @click="form.sales_type = 'export'; onSalesTypeChange()"
          >
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
            <el-select v-model="form.vat_rate" placeholder="请选择增值税率" @change="calculateCost" style="width: 200px">
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
                      <el-button 
                        :type="form.shipping_method === 'fcl_20' ? 'primary' : 'default'"
                        @click="form.shipping_method = 'fcl_20'; onShippingMethodChange()"
                      >20GP 小柜</el-button>
                      <el-button 
                        :type="form.shipping_method === 'fcl_40' ? 'primary' : 'default'"
                        @click="form.shipping_method = 'fcl_40'; onShippingMethodChange()"
                      >40GP 大柜</el-button>
                      <el-button 
                        :type="form.shipping_method === 'lcl' ? 'primary' : 'default'"
                        @click="form.shipping_method = 'lcl'; onShippingMethodChange()"
                      >LCL 散货</el-button>
                    </div>
                  </div>
                </el-col>
              </el-row>

              <el-row :gutter="24" v-if="form.shipping_method">
                <el-col :span="12">
                  <div class="freight-field">
                    <span class="freight-label">起运港口:</span>
                    <el-radio-group v-model="form.port_type" @change="onPortTypeChange">
                      <el-radio label="fob_shenzhen">FOB 深圳</el-radio>
                      <el-radio label="other">其他港口</el-radio>
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
                    <el-radio-group v-model="quantityUnit" @change="onQuantityUnitChange" :disabled="!shippingInfo.pcsPerCarton">
                      <el-radio label="pcs">按片</el-radio>
                      <el-radio label="carton">按箱</el-radio>
                    </el-radio-group>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="freight-field">
                    <span class="freight-label">订购数量:</span>
                    <el-input-number
                      v-model="quantityInput"
                      :min="1"
                      :precision="0"
                      :controls="false"
                      @change="onQuantityInputChange"
                      style="width: 150px"
                      :disabled="(form.shipping_method === 'fcl_20' || form.shipping_method === 'fcl_40') && form.port_type === 'fob_shenzhen'"
                    />
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

              <!-- FOB深圳运费计算明细 - 现代化卡片设计 -->
              <div v-if="form.port_type === 'fob_shenzhen' && freightCalculation" class="mt-4 mb-2">
                
                <!-- 整柜 (FCL) 卡片 -->
                <div v-if="(form.shipping_method === 'fcl_20' || form.shipping_method === 'fcl_40')" 
                     class="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 shadow-sm overflow-hidden relative group transition-all duration-300 hover:shadow-md">
                  
                  <!-- 装饰背景 -->
                  <div class="absolute right-0 top-0 w-32 h-32 bg-blue-100/40 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <div class="p-5 relative z-10 flex flex-col md:flex-row md:items-stretch gap-6">
                    <!-- 左侧：核心费用 -->
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

                    <!-- 分割线 -->
                    <div class="hidden md:block w-px bg-gradient-to-b from-transparent via-blue-200 to-transparent"></div>

                    <!-- 右侧：装箱参数 -->
                    <div class="flex-1 grid grid-cols-2 gap-y-3 gap-x-4">
                       <div class="space-y-1">
                          <div class="text-xs text-gray-400">单箱材积</div>
                          <div class="font-medium text-gray-700">{{ freightCalculation.cartonVolume || '-' }} ft³</div>
                       </div>
                       <div class="space-y-1">
                          <div class="text-xs text-gray-400">最大可装</div>
                          <div class="font-medium text-blue-700">{{ freightCalculation.maxCartons ? Number(freightCalculation.maxCartons).toLocaleString() : '-' }} 箱</div>
                       </div>
                       <div class="space-y-1">
                          <div class="text-xs text-gray-400">每箱只数</div>
                          <div class="font-medium text-gray-700">{{ freightCalculation.pcsPerCarton || '-' }} pcs</div>
                       </div>
                       <div class="space-y-1">
                          <div class="text-xs text-gray-400">本次数量</div>
                          <div class="font-medium text-gray-700">{{ form.quantity ? Number(form.quantity).toLocaleString() : '-' }} pcs</div>
                       </div>
                    </div>
                  </div>
                </div>

                <!-- 散货 (LCL) 卡片 -->
                <div v-else-if="form.shipping_method === 'lcl'" 
                     class="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 shadow-sm overflow-hidden relative group transition-all duration-300 hover:shadow-md">
                  
                  <!-- 装饰背景 -->
                  <div class="absolute right-0 top-0 w-32 h-32 bg-orange-100/40 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                  <div class="p-5 relative z-10 flex flex-col md:flex-row md:items-stretch gap-6">
                    <!-- 左侧：核心费用 -->
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
                        <span class="bg-white/60 px-2 py-1 rounded border border-gray-100">
                          计费体积: <span class="font-bold text-gray-800">{{ freightCalculation.ceiledCBM }}</span> CBM
                        </span>
                      </div>
                    </div>

                     <!-- 分割线 -->
                    <div class="hidden md:block w-px bg-gradient-to-b from-transparent via-orange-200 to-transparent"></div>

                    <!-- 右侧：费用明细 -->
                    <div class="flex-1 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                       <div class="flex justify-between">
                          <span class="text-gray-500">基础运费:</span>
                          <span class="font-medium text-gray-700">¥{{ freightCalculation.baseFreight }}</span>
                       </div>
                       <div class="flex justify-between">
                          <span class="text-gray-500">操作费:</span>
                          <span class="font-medium text-gray-700">¥{{ freightCalculation.handlingCharge }}</span>
                       </div>
                       <div class="flex justify-between">
                          <span class="text-gray-500">拼箱费:</span>
                          <span class="font-medium text-gray-700">¥{{ freightCalculation.cfs }}</span>
                       </div>
                       <div class="flex justify-between">
                          <span class="text-gray-500">文件费:</span>
                          <span class="font-medium text-gray-700">¥{{ freightCalculation.documentFee }}</span>
                       </div>
                       <div class="col-span-2 mt-1 pt-2 border-t border-orange-100 flex justify-between items-center">
                          <span class="text-xs text-gray-400">实际CBM: {{ freightCalculation.cbm }}</span>
                       </div>
                    </div>
                  </div>
                </div>

              </div>

              <!-- 运费总价（非FOB深圳时手动输入） -->
              <el-row :gutter="24" v-if="form.port_type !== 'fob_shenzhen'">
                <el-col :span="12">
                  <div class="freight-field">
                    <span class="freight-label">运费总价:</span>
                    <el-input-number v-model="form.freight_total" :min="0" :precision="4" :controls="false" @change="calculateCost" style="width: 200px" />
                    <span class="freight-unit">CNY</span>
                  </div>
                </el-col>
              </el-row>

              <el-row :gutter="24">
                <el-col :span="24">
                  <div class="freight-field freight-field-wide">
                    <span class="freight-label freight-label-wide">运费计入成本:</span>
                    <el-radio-group v-model="form.include_freight_in_base" @change="calculateCost">
                      <el-radio :label="true">是</el-radio>
                      <el-radio :label="false">否（运费在管销价基础上单独计算）</el-radio>
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
                <el-radio-group v-model="quantityUnit" @change="onQuantityUnitChange" :disabled="!shippingInfo.pcsPerCarton">
                  <el-radio label="pcs">按片</el-radio>
                  <el-radio label="carton">按箱</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="quantityUnit === 'pcs' ? '购买数量(片)' : '购买数量(箱)'" prop="quantity">
                <el-input-number v-model="quantityInput" :min="1" :precision="0" :controls="false" @change="onQuantityInputChange" style="width: 100%" />
                <div v-if="quantityUnit === 'carton' && shippingInfo.pcsPerCarton" class="quantity-hint">
                  = {{ form.quantity }} 片（{{ quantityInput }}箱 × {{ shippingInfo.pcsPerCarton }}片/箱）
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="5" v-if="shippingInfo.cartons !== null">
              <el-form-item label="箱数">
                <el-input :value="shippingInfo.cartons" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="5" v-if="shippingInfo.cbm !== null">
              <el-form-item label="CBM">
                <el-input :value="shippingInfo.cbm" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="48" class="domestic-freight-row">
            <el-col :span="6">
              <el-form-item label="每CBM单价">
                <el-input-number v-model="domesticCbmPrice" :min="0" :precision="2" :controls="false" @change="onDomesticCbmPriceChange" style="width: 100%" placeholder="0" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="运费总价" prop="freight_total">
                <el-input-number v-model="form.freight_total" :min="0" :precision="2" :controls="false" @change="calculateCost" style="width: 100%" />
                <div v-if="domesticCbmPrice && shippingInfo.cbm" class="freight-hint">= {{ domesticCbmPrice }} × {{ Math.ceil(parseFloat(shippingInfo.cbm)) }} CBM</div>
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <el-form-item label="运费计入成本">
                <el-radio-group v-model="form.include_freight_in_base" @change="calculateCost">
                  <el-radio :label="true">是</el-radio>
                  <el-radio :label="false">否</el-radio>
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
              <template #label>
                <span class="tab-label">原料 <el-badge :value="form.materials.length" :max="99" class="tab-badge" /></span>
              </template>
              <div class="tab-pane-content">
                <div class="tab-pane-actions">
                  <el-button v-if="!editMode.materials && form.materials.some(p => p.from_standard)" type="warning" size="small" @click="toggleEditMode('materials')">解锁编辑</el-button>
                  <el-button v-if="editMode.materials" type="success" size="small" @click="toggleEditMode('materials')">锁定编辑</el-button>
                  <el-button type="primary" size="small" @click="addMaterialRow">添加原料</el-button>
                </div>
                <el-table :data="form.materials" border size="small">
                  <el-table-column width="60" align="center">
                    <template #header>
                      <el-tooltip content="勾选后，该原料将在管销价计算后再加入成本" placement="top">
                        <span class="cursor-help text-xs whitespace-nowrap">管销后</span>
                      </el-tooltip>
                    </template>
                    <template #default="{ row }">
                      <el-checkbox v-model="row.after_overhead" @change="calculateCost" :disabled="row.from_standard && !editMode.materials" />
                    </template>
                  </el-table-column>
                  <el-table-column label="原料名称" min-width="200">
                    <template #default="{ row, $index }">
                      <el-select v-if="!row.from_standard || editMode.materials" v-model="row.material_id" filterable remote reserve-keyword clearable :remote-method="searchMaterials" :loading="materialSearchLoading" placeholder="输入名称或料号搜索" @change="onMaterialSelect(row, $index)" style="width: 100%">
                        <el-option v-for="material in materialSearchOptions" :key="material.id" :label="`${material.name} (${material.item_no})`" :value="material.id">
                          <div class="flex justify-between w-full">
                            <span>{{ material.name }}</span>
                            <span class="text-slate-400 text-xs">¥{{ material.price }}/{{ material.unit }}</span>
                          </div>
                        </el-option>
                      </el-select>
                      <span v-else>{{ row.item_name }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="基本用量" width="100">
                    <template #default="{ row }">
                      <el-input-number v-model="row.usage_amount" :min="0" :precision="4" :controls="false" @change="calculateItemSubtotal(row)" size="small" style="width: 100%" :disabled="row.from_standard && !editMode.materials" />
                    </template>
                  </el-table-column>
                  <el-table-column label="单价(CNY)" width="100">
                    <template #default="{ row }">{{ formatNumber(row.unit_price) || '-' }}</template>
                  </el-table-column>
                  <el-table-column label="小计" width="100">
                    <template #default="{ row }">{{ formatNumber(row.subtotal) || '-' }}</template>
                  </el-table-column>
                  <el-table-column label="操作" width="70" fixed="right">
                    <template #default="{ $index, row }">
                      <el-button type="danger" size="small" link @click="removeMaterialRow($index)" :disabled="row.from_standard && !editMode.materials">删除</el-button>
                    </template>
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
              <template #label>
                <span class="tab-label">工序 <el-badge :value="form.processes.length" :max="99" class="tab-badge" /></span>
              </template>
              <div class="tab-pane-content">
                <div class="tab-pane-actions">
                  <el-button v-if="!editMode.processes && form.processes.some(p => p.from_standard)" type="warning" size="small" @click="toggleEditMode('processes')">解锁编辑</el-button>
                  <el-button v-if="editMode.processes" type="success" size="small" @click="toggleEditMode('processes')">锁定编辑</el-button>
                  <el-button type="primary" size="small" @click="addProcessRow">添加工序</el-button>
                </div>
                <el-table :data="form.processes" border size="small">
                  <el-table-column label="工序名称" min-width="150">
                    <template #default="{ row }">
                      <el-input v-model="row.item_name" @change="calculateItemSubtotal(row)" :disabled="row.from_standard && !editMode.processes" />
                    </template>
                  </el-table-column>
                  <el-table-column label="基本用量" width="100">
                    <template #default="{ row }">
                      <el-input-number v-model="row.usage_amount" :min="0" :precision="4" :controls="false" @change="calculateItemSubtotal(row)" size="small" style="width: 100%" :disabled="row.from_standard && !editMode.processes" />
                    </template>
                  </el-table-column>
                  <el-table-column label="工价(CNY)" width="100">
                    <template #default="{ row }">
                      <el-input-number v-model="row.unit_price" :min="0" :precision="4" :controls="false" @change="calculateItemSubtotal(row)" size="small" style="width: 100%" :disabled="row.from_standard && !editMode.processes" />
                    </template>
                  </el-table-column>
                  <el-table-column label="小计" width="100">
                    <template #default="{ row }">{{ formatNumber(row.subtotal) }}</template>
                  </el-table-column>
                  <el-table-column label="操作" width="70" fixed="right">
                    <template #default="{ $index, row }">
                      <el-button type="danger" size="small" link @click="removeProcessRow($index)" :disabled="row.from_standard && !editMode.processes">删除</el-button>
                    </template>
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
              <template #label>
                <span class="tab-label">包材 <el-badge :value="form.packaging.length" :max="99" class="tab-badge" /></span>
              </template>
              <div class="tab-pane-content">
                <div class="tab-pane-actions">
                  <el-button v-if="!editMode.packaging && form.packaging.some(p => p.from_standard)" type="warning" size="small" @click="toggleEditMode('packaging')">解锁编辑</el-button>
                  <el-button v-if="editMode.packaging" type="success" size="small" @click="toggleEditMode('packaging')">锁定编辑</el-button>
                  <el-button type="primary" size="small" @click="addPackagingRow">添加包材</el-button>
                </div>
                <el-table :data="form.packaging" border size="small">
                  <el-table-column label="包材名称" min-width="180">
                    <template #default="{ row, $index }">
                      <el-select v-if="!row.from_standard || editMode.packaging" v-model="row.material_id" filterable remote reserve-keyword clearable :remote-method="searchMaterials" :loading="materialSearchLoading" placeholder="输入名称或料号搜索" @change="onPackagingMaterialSelect(row, $index)" style="width: 100%">
                        <el-option v-for="material in materialSearchOptions" :key="material.id" :label="`${material.name} (${material.item_no})`" :value="material.id">
                          <div class="flex justify-between w-full">
                            <span>{{ material.name }}</span>
                            <span class="text-slate-400 text-xs">¥{{ material.price }}/{{ material.unit }}</span>
                          </div>
                        </el-option>
                      </el-select>
                      <span v-else>{{ row.item_name }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="基本用量" width="100">
                    <template #default="{ row }">
                      <el-input-number v-model="row.usage_amount" :min="0" :precision="4" :controls="false" @change="calculateItemSubtotal(row)" size="small" style="width: 100%" :disabled="row.from_standard && !editMode.packaging" />
                    </template>
                  </el-table-column>
                  <el-table-column label="单价(CNY)" width="100">
                    <template #default="{ row }">{{ formatNumber(row.unit_price) || '-' }}</template>
                  </el-table-column>
                  <el-table-column label="小计" width="100">
                    <template #default="{ row }">{{ formatNumber(row.subtotal) || '-' }}</template>
                  </el-table-column>
                  <el-table-column label="操作" width="70" fixed="right">
                    <template #default="{ $index, row }">
                      <el-button type="danger" size="small" link @click="removePackagingRow($index)" :disabled="row.from_standard && !editMode.packaging">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="tab-pane-footer">
                  <span>∑ 包材小计: <strong>{{ formatNumber(packagingTotal) }}</strong></span>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 成本计算 -->
      <div class="cost-section cost-section-highlight" v-if="calculation">
        <div class="cost-section-header">
          <h3 class="cost-section-title">成本计算</h3>
        </div>
        <div class="cost-section-body">

        <!-- 成本卡片展示 -->
        <div class="cost-summary-grid">
          <div class="cost-summary-card">
            <div class="cost-summary-label">基础成本价</div>
            <div class="cost-summary-value">{{ formatNumber(calculation.baseCost) }} CNY</div>
          </div>
          <div class="cost-summary-card">
            <div class="cost-summary-label">运费成本</div>
            <div class="cost-summary-value">{{ formatNumber(calculation.freightCost) }} CNY</div>
          </div>
          <div class="cost-summary-card">
            <div class="cost-summary-label">管销价</div>
            <div class="cost-summary-value">{{ formatNumber(calculation.overheadPrice) }} CNY</div>
            <el-button size="small" type="primary" link @click="showAddFeeDialog" class="cost-summary-action">添加费用项</el-button>
          </div>
        </div>

        <!-- 自定义费用项 -->
        <div v-if="customFeesWithValues.length > 0" class="custom-fee-list">
          <div v-for="(fee, index) in customFeesWithValues" :key="'fee-' + index" class="custom-fee-item">
            <span class="custom-fee-name">{{ fee.name }} ({{ (fee.rate * 100).toFixed(0) }}%)</span>
            <div class="flex items-center gap-3">
              <span class="custom-fee-value">{{ formatNumber(fee.calculatedValue) }}</span>
              <el-button size="small" type="danger" link @click="removeCustomFee(index)">删除</el-button>
            </div>
          </div>
        </div>

        <!-- 管销后算原料 -->
        <div v-if="calculation.afterOverheadMaterialTotal > 0" class="cost-tip warning">
          管销后算原料: <strong>{{ formatNumber(calculation.afterOverheadMaterialTotal) }}</strong>
        </div>

        <!-- 最终成本价 -->
        <div class="cost-final-box">
          <div class="cost-final-label">最终成本价</div>
          <div class="cost-final-value">
            <span v-if="form.sales_type === 'domestic'">{{ formatNumber(calculation.domesticPrice) }} CNY</span>
            <span v-else>{{ formatNumber(calculation.insurancePrice) }} USD</span>
          </div>
          <div class="cost-final-info">
            <span v-if="form.sales_type === 'export'">汇率: {{ formatNumber(calculation.exchangeRate) }} | 保险: 0.3%</span>
            <span v-else>含 {{ ((form.vat_rate || 0.13) * 100).toFixed(0) }}% 增值税</span>
          </div>
        </div>
        </div>
      </div>

      <!-- 利润区间 -->
      <div class="cost-section" v-if="calculation && calculation.profitTiers">
        <div class="cost-section-header">
          <h3 class="cost-section-title">利润区间</h3>
          <el-button type="primary" size="small" @click="addCustomProfitTier">添加档位</el-button>
        </div>
        <div class="cost-section-body">

        <div class="profit-tier-grid">
          <div v-for="tier in allProfitTiers" :key="tier.isCustom ? 'custom-' + tier.customIndex : 'system-' + tier.profitPercentage" class="profit-tier-card" :class="{ custom: tier.isCustom }">
            <div class="profit-tier-label">
              <span v-if="!tier.isCustom">{{ tier.profitPercentage }} 利润</span>
              <div v-else class="flex items-center gap-1">
                <el-input v-model="tier.originalTier.profitRate" placeholder="如0.35" size="small" style="width: 60px" @input="updateCustomTierPrice(tier.originalTier)" />
                <span v-if="tier.originalTier.profitRate" class="text-xs text-blue-600">{{ (parseFloat(tier.originalTier.profitRate) * 100).toFixed(0) }}%</span>
              </div>
            </div>
            <div class="profit-tier-value">{{ formatNumber(tier.price) }} {{ calculation.currency }}</div>
            <el-button v-if="tier.isCustom" type="danger" size="small" link @click="removeCustomProfitTier(tier.customIndex)" class="profit-tier-remove">删除</el-button>
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
            <span class="sticky-price-value">
              <template v-if="form.sales_type === 'domestic'">{{ formatNumber(calculation.domesticPrice) }} CNY</template>
              <template v-else>{{ formatNumber(calculation.insurancePrice) }} USD</template>
            </span>
          </div>
          <div class="sticky-price-divider"></div>
          <div class="sticky-price-item secondary">
            <span class="sticky-price-label">基础成本</span>
            <span class="sticky-price-value">{{ formatNumber(calculation.baseCost) }}</span>
          </div>
          <div class="sticky-price-item secondary">
            <span class="sticky-price-label">运费</span>
            <span class="sticky-price-value">{{ formatNumber(calculation.freightCost) }}</span>
          </div>
          <div class="sticky-price-item secondary">
            <span class="sticky-price-label">管销价</span>
            <span class="sticky-price-value">{{ formatNumber(calculation.overheadPrice) }}</span>
          </div>
        </template>
        <span v-else class="sticky-placeholder">请完成表单填写以计算成本</span>
      </div>
      <div class="sticky-footer-right">
        <el-button @click="goBack" size="large">取消</el-button>
        <el-button type="info" @click="saveDraft" :loading="saving" size="large">保存草稿</el-button>
        <el-button type="primary" @click="submitQuotation" :loading="submitting" size="large">提交审核</el-button>
      </div>
    </div>

    <!-- 添加自定义费用对话框 -->
    <el-dialog v-model="addFeeDialogVisible" title="添加自定义费用" width="400px" :close-on-click-modal="false" append-to-body>
      <el-form :model="newFee" :rules="feeRules" ref="feeFormRef" label-width="80px">
        <el-form-item label="费用项" prop="name">
          <el-input v-model="newFee.name" placeholder="" />
        </el-form-item>
        <el-form-item label="费率" prop="rate">
          <el-input v-model="newFee.rate" placeholder="如 0.04 表示 4%" style="width: 180px;" @blur="newFee.rate = newFee.rate ? parseFloat(newFee.rate) : null" />
          <span v-if="newFee.rate && !isNaN(newFee.rate)" style="margin-left: 10px; color: #409eff;">{{ (parseFloat(newFee.rate) * 100).toFixed(0) }}%</span>
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
import { ArrowLeft, Plus, Delete, InfoFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { formatNumber } from '@/utils/format'
import { useConfigStore } from '@/store/config'
import logger from '@/utils/logger'
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
const activeDetailTab = ref('materials')

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
const materialSearchOptions = ref([])
const materialSearchLoading = ref(false)

// 客户相关
const isNewCustomer = ref(true)
const selectedCustomerId = ref(null)
const customerOptions = ref([])
const customerSearchLoading = ref(false)
const customerSelectFocused = ref(false)

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

// 选中的配置信息（用于头部显示）
const selectedConfigInfo = computed(() => {
  if (!form.packaging_config_id || !packagingConfigs.value.length) return ''
  const config = packagingConfigs.value.find(c => c.id === form.packaging_config_id)
  if (config) {
    return `${config.model_name} - ${config.config_name}`
  }
  return ''
})

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
    { validator: (rule, value, callback) => { const num = parseFloat(value); if (isNaN(num) || num < 0.0001 || num > 1) { callback(new Error('费率必须在0.0001到1之间')); } else { callback(); } }, trigger: 'blur' }
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

// 内销每CBM单价
const domesticCbmPrice = ref(null)

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
    logger.error('加载法规列表失败:', error)
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
    logger.error('加载包装配置列表失败:', error)
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
        subtotal: 0, // 先设为0，后面统一应用原料系数计算
        is_changed: 0,
        from_bom: true, // 标记来自BOM
        from_standard: true, // 标记为标准数据（锁定编辑）
        after_overhead: false
      }))
      // 应用原料系数计算小计（口罩/0.97，半面罩/0.99）
      form.materials.forEach(row => {
        const coefficient = materialCoefficient.value || 1
        const rawSubtotal = (row.usage_amount || 0) * (row.unit_price || 0)
        row.subtotal = coefficient !== 0 ? rawSubtotal / coefficient : rawSubtotal
        row.subtotal = Math.round(row.subtotal * 10000) / 10000 // 四舍五入到4位小数
        row.coefficient_applied = true // 标记已应用系数
      })
      editMode.materials = false // 重置编辑状态
      logger.debug('已加载BOM原料:', form.materials.length, '条，原料系数:', materialCoefficient.value)
    } else {
      form.materials = [] // 无BOM数据时清空
    }
  } catch (e) { logger.error('加载BOM原料失败:', e) }
}

// 包装配置变化 - 加载该配置的工序和包材
const onPackagingConfigChange = async () => {
  if (!form.packaging_config_id) return

  logger.debug('开始加载包装配置数据，config_id:', form.packaging_config_id)

  try {
    const res = await request.get(`/cost/packaging-configs/${form.packaging_config_id}/details`)
    logger.debug('接口返回数据:', res)
    
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
          logger.debug(`更新原料系数: ${selectedConfig.model_category} = ${materialCoefficient.value}`)
        }
      }
      
      logger.debug('工序数据:', processes)
      logger.debug('包材数据:', materials)

      // 计算每箱只数：根据包装类型使用正确的计算方式
      const pcsPerCarton = calculateTotalFromConfig(config)
      shippingInfo.pcsPerCarton = pcsPerCarton
      
      // 查找外箱材积（从包材中查找）
      const cartonMaterial = materials.find(m => m.carton_volume && parseFloat(m.carton_volume) > 0)
      shippingInfo.cartonVolume = cartonMaterial ? parseFloat(cartonMaterial.carton_volume) : null
      
      // 同步数量输入值
      if (form.quantity) {
        if (quantityUnit.value === 'carton') {
          quantityInput.value = Math.ceil(form.quantity / pcsPerCarton)
        } else {
          quantityInput.value = form.quantity
        }
      }
      
      logger.debug('每箱只数:', pcsPerCarton)
      logger.debug('外箱材积:', shippingInfo.cartonVolume)

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

      logger.debug('加载后的工序:', form.processes)
      logger.debug('加载后的包材:', form.packaging)

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
    logger.error('加载包装配置数据失败:', error)
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
  // 先计算箱数和CBM
  calculateShippingInfo()
  // 整柜模式下无论是否有数量都直接计算运费
  if (form.sales_type === 'export' && (form.shipping_method === 'fcl_20' || form.shipping_method === 'fcl_40')) {
    calculateFOBFreight()
  }
}

// 港口类型变化
const onPortTypeChange = () => {
  if (form.port_type === 'fob_shenzhen') {
    form.port = 'FOB深圳'
    // 先计算箱数和CBM
    calculateShippingInfo()
    // 整柜模式下无论是否有数量都直接计算运费
    if (form.sales_type === 'export' && (form.shipping_method === 'fcl_20' || form.shipping_method === 'fcl_40')) {
      calculateFOBFreight()
    }
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

// 内销每CBM单价变化
const onDomesticCbmPriceChange = () => {
  if (domesticCbmPrice.value && domesticCbmPrice.value > 0 && shippingInfo.cbm) {
    const ceiledCbm = Math.ceil(parseFloat(shippingInfo.cbm))
    form.freight_total = Math.round(domesticCbmPrice.value * ceiledCbm * 100) / 100
  }
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
    
    // 内销：如果有每CBM单价，自动计算运费总价
    if (form.sales_type === 'domestic' && domesticCbmPrice.value && domesticCbmPrice.value > 0) {
      const ceiledCbm = Math.ceil(parseFloat(cbm))
      form.freight_total = Math.round(domesticCbmPrice.value * ceiledCbm * 100) / 100
    }
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
    
    const exchangeRate = systemConfig.value.fobShenzhenExchangeRate
    const totalFreight = freightUSD * exchangeRate
    
    // 调试日志
    logger.debug('整柜运费计算 - shippingInfo:', { cartonVolume: shippingInfo.cartonVolume, pcsPerCarton: shippingInfo.pcsPerCarton })
    
    // 计算建议数量
    let suggestedQuantity = null
    let maxCartons = null
    let cartonVolume = shippingInfo.cartonVolume || null
    let pcsPerCarton = shippingInfo.pcsPerCarton || null
    
    // 如果有外箱材积，计算可装箱数
    if (cartonVolume && cartonVolume > 0) {
      maxCartons = Math.floor(containerVolume / cartonVolume)
      // 如果同时有每箱只数，计算建议数量
      if (pcsPerCarton && pcsPerCarton > 0) {
        suggestedQuantity = maxCartons * pcsPerCarton
        // 自动设置数量
        form.quantity = suggestedQuantity
        quantityUnit.value = 'carton'
        quantityInput.value = maxCartons
        shippingInfo.cartons = maxCartons // 同步更新箱数
      }
    } else if (pcsPerCarton && pcsPerCarton > 0) {
      // 没有外箱材积但有每箱只数时，提示用户
      logger.warn('缺少外箱材积(carton_volume)，无法计算可装箱数')
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
    
    // 重新计算成本（如果有数量的话）
    if (form.quantity && form.quantity > 0) {
      calculateCost()
    }
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

// 客户类型切换
const onCustomerTypeChange = (val) => {
  if (val) { // 新客户
    selectedCustomerId.value = null
    customerOptions.value = []
    form.customer_name = ''
    form.customer_region = ''
  }
}

// 搜索客户
const searchCustomers = async (keyword) => {
  if (!keyword) { customerOptions.value = []; return }
  customerSearchLoading.value = true
  try {
    const res = await request.get('/customers/search', { params: { keyword } })
    customerOptions.value = res.success ? res.data : []
  } catch (error) { logger.error('搜索客户失败:', error); customerOptions.value = [] }
  finally { customerSearchLoading.value = false }
}

// 选择客户
const onCustomerSelect = (customerId) => {
  if (!customerId) { form.customer_name = ''; form.customer_region = ''; return }
  const customer = customerOptions.value.find(c => c.id === customerId)
  if (customer) {
    form.customer_name = customer.name
    form.customer_region = customer.region || ''
  }
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
  
  // 优先从搜索结果中查找，其次从全量数据中查找
  const material = materialSearchOptions.value.find(m => m.id === row.material_id) 
    || allMaterials.value.find(m => m.id === row.material_id)
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
  
  // 优先从搜索结果中查找，其次从全量数据中查找
  const material = materialSearchOptions.value.find(m => m.id === row.material_id)
    || allMaterials.value.find(m => m.id === row.material_id)
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
    logger.error('计算成本失败:', error)
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
    logger.error('保存失败:', error)
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
    logger.error('提交失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 加载原料库（用于编辑时查找原料信息）
const loadAllMaterials = async () => {
  try {
    const res = await request.get('/materials', { params: { pageSize: 100 } })
    if (res.success) {
      allMaterials.value = res.data
    }
  } catch (error) {
    logger.error('加载原料库失败:', error)
  }
}

// 远程搜索原料（用于下拉框）
const searchMaterials = async (query) => {
  if (!query || query.length < 1) {
    materialSearchOptions.value = []
    return
  }
  materialSearchLoading.value = true
  try {
    const res = await request.get('/materials', { params: { keyword: query, pageSize: 50 } })
    if (res.success) {
      materialSearchOptions.value = res.data || []
    }
  } catch (e) {
    materialSearchOptions.value = []
  } finally {
    materialSearchLoading.value = false
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
      form.quantity = quotation.quantity ? parseInt(quotation.quantity) : null // 数量应为整数
      form.freight_total = quotation.freight_total ? parseFloat(quotation.freight_total) : null // 运费需转数字
      form.include_freight_in_base = quotation.include_freight_in_base !== false
      // 加载增值税率，如果报价单有保存的值则使用，否则使用全局配置
      form.vat_rate = quotation.vat_rate !== null && quotation.vat_rate !== undefined 
        ? parseFloat(quotation.vat_rate) 
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
      
      // 同步数量输入值（确保在任何情况下都同步）
      if (form.quantity && !quantityInput.value) {
        quantityInput.value = form.quantity
        quantityUnit.value = 'pcs'
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
          logger.error('解析自定义利润档位失败:', e)
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
    logger.error('加载报价单数据失败:', error)
    ElMessage.error('加载报价单数据失败')
  }
}

// 加载标准成本数据（用于复制）
const loadStandardCostData = async (id) => {
  try {
    const res = await request.get(`/standard-costs/${id}`)
    
    if (res.success) {
      const { standardCost, items } = res.data
      
      logger.debug('标准成本数据:', standardCost)
      
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
        logger.debug('每箱只数:', pcsPerCarton)
        
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
        logger.debug('外箱材积:', shippingInfo.cartonVolume)
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
    logger.error('加载标准成本数据失败:', error)
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
    logger.error('加载系统配置失败:', error)
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
      logger.debug('原料系数配置:', res.data)
      
      // 根据当前产品类别获取对应的原料系数
      if (currentModelCategory.value && res.data[currentModelCategory.value]) {
        materialCoefficient.value = res.data[currentModelCategory.value]
        logger.debug(`当前产品类别: ${currentModelCategory.value}, 原料系数: ${materialCoefficient.value}`)
      } else {
        materialCoefficient.value = 1
        logger.debug('未找到对应的原料系数，使用默认值 1')
      }
    }
  } catch (error) {
    logger.error('加载原料系数配置失败:', error)
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
      logger.debug(`从URL参数设置原料系数: ${route.query.model_category} = ${materialCoefficient.value}`)
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
.cost-add-container { padding: 0; }

/* 顶部导航栏 */
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #fff; border-radius: 8px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.page-header .header-left { display: flex; align-items: center; }
.page-header .header-center h2 { margin: 0; font-size: 20px; color: #303133; }
.page-header .back-btn { font-size: 14px; color: #606266; }

/* 表单区块 */
.form-section { margin-bottom: 16px; border-radius: 8px; }
.section-title { font-size: 15px; font-weight: 600; color: #303133; }
.section-header { display: flex; justify-content: space-between; align-items: center; }

/* 配置选项样式 */
.config-option { display: flex; justify-content: space-between; width: 100%; }
.config-method { color: #8492a6; font-size: 12px; }
.customer-region { float: right; color: #8492a6; font-size: 12px; }

/* 销售类型卡片 */
.sales-type-cards { display: flex; gap: 20px; margin-bottom: 20px; }
.sales-card { flex: 1; padding: 20px; border: 2px solid #e4e7ed; border-radius: 8px; cursor: pointer; transition: all 0.3s; text-align: center; }
.sales-card:hover { border-color: #409eff; }
.sales-card.active { border-color: #409eff; background: #ecf5ff; }
.sales-card-title { font-size: 18px; font-weight: 600; color: #303133; margin-bottom: 8px; }
.sales-card-desc { font-size: 13px; color: #909399; line-height: 1.6; }

/* 增值税率选择 */
.vat-rate-section { margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e4e7ed; }

/* 外销运费面板 */
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

/* 智能装箱建议 */
.smart-packing-tip { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 6px; margin: 16px 0; }
.smart-packing-tip .el-icon { color: #1890ff; font-size: 18px; margin-top: 2px; }
.tip-content { flex: 1; }
.tip-title { font-weight: 600; color: #1890ff; margin-bottom: 4px; }
.tip-content div { color: #606266; font-size: 13px; line-height: 1.6; }


/* 内销数量区域 */
.domestic-quantity-section { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #e4e7ed; }
.domestic-freight-row { margin-top: 16px; }
.quantity-hint { color: #67c23a; font-size: 12px; margin-top: 4px; }
.freight-hint { color: #909399; font-size: 12px; margin-top: 4px; }

/* 成本明细区块 */
.cost-detail-section { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #ebeef5; }
.cost-detail-section:last-child { border-bottom: none; margin-bottom: 0; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.detail-title { font-size: 14px; font-weight: 600; color: #606266; }
.detail-actions { display: flex; gap: 8px; }
.detail-table { margin-bottom: 8px; }
.help-cursor { cursor: help; }

/* 小计行 */
.subtotal-row { display: flex; justify-content: flex-end; gap: 24px; padding: 8px 0; font-size: 14px; color: #606266; }
.subtotal-row strong { color: #409eff; }
.subtotal-row .after-overhead strong { color: #e6a23c; }
.subtotal-row .process-total .highlight { color: #67c23a; }

/* 原料选项 */
.material-option { display: flex; justify-content: space-between; width: 100%; }
.material-price { color: #8492a6; font-size: 13px; }

/* 成本卡片 */
.cost-cards { display: flex; gap: 16px; margin-bottom: 20px; }
.cost-card { flex: 1; padding: 16px; background: #f5f7fa; border-radius: 8px; text-align: center; position: relative; }
.cost-card-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.cost-card-value { font-size: 18px; font-weight: 600; color: #303133; }
.add-fee-btn { position: absolute; bottom: 8px; right: 8px; }

/* 自定义费用 */
.custom-fees { margin-bottom: 16px; }
.fee-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #fdf6ec; border-radius: 4px; margin-bottom: 8px; }
.fee-name { color: #e6a23c; font-size: 13px; }
.fee-value { font-weight: 600; color: #303133; }

/* 管销后算原料 */
.after-overhead-material { padding: 8px 12px; background: #fdf6ec; border-radius: 4px; margin-bottom: 16px; color: #e6a23c; }
.after-overhead-material strong { margin-left: 8px; }

/* 最终成本价 */
.final-cost-box { background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%); border-radius: 8px; padding: 20px; text-align: center; color: #fff; }
.final-cost-label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
.final-cost-value { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
.final-cost-info { font-size: 12px; opacity: 0.8; }

/* 利润区间卡片 */
.profit-tier-cards { display: flex; gap: 12px; flex-wrap: wrap; }
.profit-card { flex: 1; min-width: 120px; padding: 16px; border: 1px solid #e4e7ed; border-radius: 8px; text-align: center; position: relative; }
.profit-card.custom { border-color: #e6a23c; background: #fdf6ec; }
.profit-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.profit-price { font-size: 18px; font-weight: 600; color: #303133; }
.remove-tier-btn { position: absolute; top: 4px; right: 4px; }
.custom-rate-input { display: flex; align-items: center; gap: 4px; }
.rate-display { font-size: 12px; color: #409eff; }

/* 操作栏 */
.action-bar { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #fff; border-radius: 8px; margin-top: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.action-right { display: flex; gap: 12px; }

:deep(.el-input-number) { width: 100%; }
</style>
