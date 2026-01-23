<template>
  <div class="cost-page-wrapper">
    <!-- 顶部导航栏 -->
    <!-- 顶部导航栏 -->
    <CostPageHeader :title="pageTitle" :show-back="true" @back="goBack">
      <template #after-title>
        <el-tag v-if="isEditMode" type="warning" size="small">编辑中</el-tag>
      </template>
      <template #actions>
        <div v-if="form.packaging_config_id || form.customer_name">
          <span v-if="form.packaging_config_id" class="meta-tag">{{ selectedConfigInfo }}</span>
          <span v-if="form.customer_name" class="meta-tag">{{ form.customer_name }}</span>
        </div>
      </template>
    </CostPageHeader>

    <!-- 左右分栏主体 -->
    <div class="cost-page-body">
      <!-- 左侧表单区 -->
      <div class="cost-form-panel">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" class="cost-form">
      <!-- 基本信息 -->
      <div class="cost-section">
        <div class="cost-section-header">
          <h3 class="cost-section-title">基本信息</h3>
          <el-tag v-if="isEstimationMode" type="warning" size="small">新产品预估模式</el-tag>
        </div>
        <div class="cost-section-body">

        <!-- 预估模式：新产品型号选择 -->
        <el-row v-if="isEstimationMode" :gutter="24" class="estimation-row">
          <el-col :span="12">
            <el-form-item label="新产品型号" prop="model_id" :rules="[{ required: true, message: '请选择新产品型号', trigger: 'change' }]">
              <el-select v-model="form.model_id" placeholder="请选择新产品型号" @change="onNewProductModelChange" style="width: 100%" filterable :disabled="isEditMode">
                <el-option v-for="model in newProductModels" :key="model.id" :label="`${model.model_name} (${model.model_category})`" :value="model.id">
                  <div class="model-option"><span>{{ model.model_name }}</span><span class="model-category">{{ model.model_category }}</span></div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="参考标准成本">
              <el-select v-model="referenceStandardCostId" placeholder="请选择参考标准成本" @change="onReferenceStandardCostChange" style="width: 100%" filterable clearable :disabled="!form.model_id || isEditMode" :loading="referenceStandardCostsLoading">
                <el-option v-for="sc in referenceStandardCosts" :key="sc.id" :label="`${sc.model_name} - ${sc.customer_name}`" :value="sc.id">
                  <div class="reference-sc-option">
                    <span class="sc-model">{{ sc.model_name }}</span>
                    <span class="sc-customer">{{ sc.customer_name }}</span>
                    <span class="sc-price">¥{{ formatNumber(sc.base_cost) }}</span>
                  </div>
                </el-option>
              </el-select>
              <div v-if="form.model_id && referenceStandardCosts.length === 0 && !referenceStandardCostsLoading" class="no-reference-tip">暂无同法规同分类的标准成本可参考</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="法规标准" prop="regulation_id">
              <el-select v-model="form.regulation_id" placeholder="请选择法规标准" @change="onRegulationChange" style="width: 100%" :disabled="isEditMode || isEstimationMode">
                <el-option v-for="reg in regulations" :key="reg.id" :label="reg.name" :value="reg.id" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="型号配置" prop="packaging_config_id" v-if="!isEstimationMode">
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
            <el-form-item label="产品分类" v-else>
              <el-input :value="selectedNewProductCategory" disabled placeholder="选择新产品型号后自动显示" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customer_name">
              <el-autocomplete v-model="form.customer_name" :fetch-suggestions="handleCustomerSearch" :loading="customerSearchLoading" placeholder="输入客户名称搜索或新建" clearable value-key="name" style="width: 100%" @select="handleCustomerAutoSelect" @clear="handleCustomerClear">
                <template #default="{ item }">
                  <div class="customer-suggestion" :class="{ 'other-salesperson': !item.is_mine && item.user_id }">
                    <span class="customer-suggestion-name">{{ item.name }}</span>
                    <span class="customer-suggestion-code">{{ item.vc_code }}</span>
                    <span v-if="!item.is_mine && item.salesperson_name" class="customer-suggestion-owner">{{ item.salesperson_name }}</span>
                    <span v-else-if="item.region" class="customer-suggestion-region">{{ item.region }}</span>
                  </div>
                </template>
                <template #append v-if="isNewCustomer && form.customer_name">
                  <el-tag size="small" type="success">新客户</el-tag>
                </template>
                <template #append v-else-if="isOtherSalespersonCustomer">
                  <el-tag size="small" type="warning">他人客户</el-tag>
                </template>
              </el-autocomplete>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="客户地区" prop="customer_region">
              <el-autocomplete v-model="form.customer_region" :fetch-suggestions="suggestRegions" placeholder="请输入客户地区" clearable :disabled="!!selectedCustomerId" style="width: 100%">
                <template #default="{ item }">{{ item.value }}</template>
              </el-autocomplete>
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
                      <el-button :type="form.shipping_method === 'cif_lcl' ? 'primary' : 'default'" @click="form.shipping_method = 'cif_lcl'; handleShippingMethodChange()">CIF 深圳</el-button>
                    </div>
                  </div>
                </el-col>
              </el-row>

              <el-row :gutter="24" v-if="form.shipping_method && form.shipping_method !== 'cif_lcl'">
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
                  <el-form-item label="港口名称" prop="port" :rules="[{ required: true, message: '请输入港口名称', trigger: 'blur' }]">
                    <el-input v-model="form.port" placeholder="请输入港口名称" style="width: 200px" />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 散货 (LCL) 数量输入区域 (仿内销布局) -->
              <div v-if="form.shipping_method === 'lcl' || form.shipping_method === 'cif_lcl'" class="lcl-quantity-section mt-4">
                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="数量单位">
                      <el-radio-group v-model="quantityUnit" @change="handleQuantityUnitChange" :disabled="!shippingInfo.pcsPerCarton">
                        <el-radio value="pcs">按片</el-radio>
                        <el-radio value="carton">按箱</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item :label="quantityUnit === 'pcs' ? '订购数量(片)' : '订购数量(箱)'" prop="quantity" class="compact-required-label">
                      <el-input-number v-model="quantityInput" :min="1" :precision="0" :controls="false" @change="handleQuantityInputChange" style="width: 100%" />
                      <div v-if="quantityUnit === 'carton' && shippingInfo.pcsPerCarton" class="quantity-hint">= {{ form.quantity }} 片（{{ quantityInput }}箱 × {{ shippingInfo.pcsPerCarton }}片/箱）</div>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="24" v-if="shippingInfo.cartons !== null || shippingInfo.cbm !== null">
                  <el-col :span="12">
                    <el-form-item label="总箱数">
                      <div class="readonly-value-box">{{ shippingInfo.cartons || '-' }}</div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="总体积(CBM)">
                      <div class="readonly-value-box">{{ shippingInfo.cbm || '-' }}</div>
                    </el-form-item>
                  </el-col>
                </el-row>

                <!-- 智能装箱建议 (仅在按片且除不尽时显示) -->
                <div v-if="quantityUnit === 'pcs' && form.quantity && shippingInfo.pcsPerCarton && (form.quantity % shippingInfo.pcsPerCarton !== 0)" class="smart-packing-tip domestic">
                  <el-icon><InfoFilled /></el-icon>
                  <div class="tip-content">
                    <div class="tip-title">智能装箱建议:</div>
                    <div>当前数量: {{ form.quantity }} pcs ({{ (form.quantity / shippingInfo.pcsPerCarton).toFixed(1) }}箱)</div>
                    <div>建议数量: <strong>{{ Math.ceil(form.quantity / shippingInfo.pcsPerCarton) * shippingInfo.pcsPerCarton }} pcs</strong> ({{ Math.ceil(form.quantity / shippingInfo.pcsPerCarton) }}箱) 以达到整数箱</div>
                  </div>
                </div>

                <!-- CBM过大提示 (仅在散货且CBM>58时显示) -->
                <div v-if="shippingInfo.cbm && parseFloat(shippingInfo.cbm) > 58" class="smart-packing-tip warning">
                  <el-icon><WarningFilled /></el-icon>
                  <div class="tip-content">
                    <div class="tip-title">运输建议:</div>
                    <div>当前CBM为 <strong>{{ shippingInfo.cbm }}</strong> (超过58)，建议选择整柜运输或联系物流单独确认运费。</div>
                  </div>
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
                      <span class="text-gray-300">|</span>
                      <span>CBM <span class="font-medium text-gray-700">{{ shippingInfo.cbm || '-' }}</span></span>
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

              <!-- CIF 深圳运费详情卡片 -->
              <div v-else-if="form.port_type === 'cif_shenzhen' && freightCalculation" class="mt-4 mb-2 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 shadow-sm overflow-hidden relative group transition-all duration-300 hover:shadow-md">
                <div class="absolute right-0 top-0 w-32 h-32 bg-purple-100/40 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div class="p-5 relative z-10 flex flex-col md:flex-row md:items-stretch gap-6">
                  <div class="flex-1 flex flex-col justify-center min-w-[200px]">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs font-semibold text-purple-600 uppercase tracking-wider bg-purple-100/50 px-2 py-0.5 rounded">CIF 深圳运费</span>
                      <el-tag size="small" type="info">{{ freightCalculation.factory === 'hubei_zhiteng' ? '湖北知腾工厂' : '东莞迅安工厂' }}</el-tag>
                    </div>
                    <div class="flex items-baseline gap-2">
                       <h3 class="text-3xl font-bold text-gray-900 font-mono tracking-tight">
                        <span class="text-lg text-gray-500 font-normal mr-1">¥</span>{{ Math.round(freightCalculation.totalFreight).toLocaleString() }}
                      </h3>
                    </div>
                     <div class="mt-2 text-sm text-gray-500">
                      <span class="bg-white/60 px-2 py-1 rounded border border-gray-100">计费体积: <span class="font-bold text-gray-800">{{ freightCalculation.ceiledCBM }}</span> CBM</span>
                    </div>
                  </div>
                  <div class="hidden md:block w-px bg-gradient-to-b from-transparent via-purple-200 to-transparent"></div>
                  <div class="flex-1 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                    <div class="flex justify-between"><span class="text-gray-500">CFS费:</span><span class="font-medium text-gray-700">¥{{ freightCalculation.cfs }}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">文件费:</span><span class="font-medium text-gray-700">¥{{ freightCalculation.docFee }}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">报关费:</span><span class="font-medium text-gray-700">¥{{ freightCalculation.customsFee }}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">仓库费:</span><span class="font-medium text-gray-700">¥{{ freightCalculation.warehouseFee }}</span></div>
                    <div class="flex justify-between items-center col-span-2 border-t border-purple-100 pt-1 mt-1">
                        <span class="text-gray-500">海运费 ({{ freightCalculation.seaFreightUSDPerCbm }} USD/CBM):</span>
                        <span class="font-medium text-gray-700">¥{{ Math.round(freightCalculation.seaFreightCNY) }} ({{ freightCalculation.seaFreightUSDEstimated }} USD)</span>
                    </div>
                    <div class="flex justify-between items-center col-span-2 border-t border-purple-100 pt-1">
                        <span class="text-gray-500">国内运费 ({{ freightCalculation.factory === 'hubei_zhiteng' ? '湖北卡车' : '东莞分档' }}):</span>
                        <span class="font-medium text-gray-700">¥{{ freightCalculation.domesticTransportFee }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 运费总价（非FOB深圳/CIF深圳时手动输入） -->
              <el-row :gutter="24" v-if="form.port_type !== 'fob_shenzhen' && form.port_type !== 'cif_shenzhen'">
                <el-col :span="12">
                  <el-form-item label="运费总价" prop="freight_total" :rules="[{ required: true, message: '请输入运费总价', trigger: 'blur' }]">
                    <el-input-number v-model="form.freight_total" :min="0" :precision="4" :controls="false" @change="handleCalculateCost" style="width: 200px" />
                    <span class="freight-unit">CNY</span>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="24">
                <el-col :span="24">
                  <div class="freight-field freight-field-wide">
                    <el-form-item label="运费计入成本" required class="wide-label-item mb-0">
                      <el-radio-group v-model="form.include_freight_in_base" @change="handleCalculateCost">
                        <el-radio :value="true">是</el-radio>
                        <el-radio :value="false">否（运费在管销价基础上单独计算）</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>

        <!-- 内销数量输入 -->
        <div v-if="form.sales_type === 'domestic'" class="domestic-quantity-section">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="数量单位">
                <el-radio-group v-model="quantityUnit" @change="handleQuantityUnitChange" :disabled="!shippingInfo.pcsPerCarton">
                  <el-radio value="pcs">按片</el-radio>
                  <el-radio value="carton">按箱</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="quantityUnit === 'pcs' ? '购买数量(片)' : '购买数量(箱)'" prop="quantity" class="compact-required-label">
                <el-input-number v-model="quantityInput" :min="1" :precision="0" :controls="false" @change="handleQuantityInputChange" style="width: 100%" />
                <div v-if="quantityUnit === 'carton' && shippingInfo.pcsPerCarton" class="quantity-hint">= {{ form.quantity }} 片（{{ quantityInput }}箱 × {{ shippingInfo.pcsPerCarton }}片/箱）</div>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="24" v-if="shippingInfo.cartons !== null || shippingInfo.cbm !== null">
            <el-col :span="12">
              <el-form-item label="箱数">
                <div class="readonly-value-box">{{ shippingInfo.cartons || '-' }}</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="CBM">
                <div class="readonly-value-box">{{ shippingInfo.cbm || '-' }}</div>
              </el-form-item>
            </el-col>
          </el-row>

          <div v-if="quantityUnit === 'pcs' && form.quantity && shippingInfo.pcsPerCarton && (form.quantity % shippingInfo.pcsPerCarton !== 0)" class="smart-packing-tip domestic">
            <el-icon><InfoFilled /></el-icon>
            <div class="tip-content">
              <div class="tip-title">智能装箱建议:</div>
              <div>当前数量: {{ form.quantity }} pcs ({{ (form.quantity / shippingInfo.pcsPerCarton).toFixed(1) }}箱)</div>
              <div>建议数量: <strong>{{ Math.ceil(form.quantity / shippingInfo.pcsPerCarton) * shippingInfo.pcsPerCarton }} pcs</strong> ({{ Math.ceil(form.quantity / shippingInfo.pcsPerCarton) }}箱) 以达到整数箱</div>
            </div>
          </div>

          <el-row :gutter="24" class="domestic-freight-row">
            <el-col :span="12">
              <el-form-item label="每CBM单价">
                <el-input-number v-model="domesticCbmPrice" :min="0" :precision="2" :controls="false" @change="handleDomesticCbmPriceChange" style="width: 100%" placeholder="0" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="运费总价" prop="freight_total" class="compact-required-label">
                <el-input-number v-model="form.freight_total" :min="0" :precision="2" :controls="false" @change="handleCalculateCost" style="width: 100%" />
                <div v-if="domesticCbmPrice && shippingInfo.cbm" class="freight-hint">= {{ domesticCbmPrice }} × {{ Math.ceil(parseFloat(shippingInfo.cbm)) }} CBM</div>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="运费计入成本" required class="wide-label-item">
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
                    <template #default="{ row }"><el-checkbox v-model="row.after_overhead" @change="handleCalculateCost" :disabled="!!row.from_standard && !editMode.materials" /></template>
                  </el-table-column>
                  <el-table-column label="原料名称" min-width="200">
                    <template #default="{ row, $index }">
                      <el-select v-if="!row.from_standard || editMode.materials" v-model="row.material_id" filterable remote reserve-keyword clearable :remote-method="searchMaterialsByCategory" :loading="materialSearchLoading" :placeholder="row.item_name || '输入名称或料号搜索'" @change="handleMaterialSelect(row, $index)" style="width: 100%">
                        <el-option v-if="row.material_id && row.item_name && !materialSearchOptions.some(o => o.id === row.material_id)" :label="row.item_name" :value="row.material_id" />
                        <el-option v-for="material in materialSearchOptions" :key="material.id" :label="`${material.name} (${material.item_no})`" :value="material.id">
                          <div class="flex justify-between w-full"><span>{{ material.name }}</span><span class="text-slate-400 text-xs">¥{{ material.price }}/{{ material.unit }}</span></div>
                        </el-option>
                      </el-select>
                      <span v-else>{{ row.item_name }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="基本用量" width="100">
                    <template #default="{ row }"><el-input-number v-model="row.usage_amount" :min="0" :precision="4" :controls="false" @change="handleItemSubtotalChange(row)" size="small" style="width: 100%" :disabled="!!row.from_standard && !editMode.materials" /></template>
                  </el-table-column>
                  <el-table-column label="单价(CNY)" width="100"><template #default="{ row }">{{ formatNumber(row.unit_price) || '-' }}</template></el-table-column>
                  <el-table-column label="小计" width="100"><template #default="{ row }">{{ formatNumber(row.subtotal) || '-' }}</template></el-table-column>
                  <el-table-column label="操作" width="70" fixed="right">
                    <template #default="{ $index, row }">
                      <el-button 
                        v-if="!row.from_standard || editMode.materials"
                        size="small" 
                        link 
                        class="text-gray-400 hover:text-red-500 transition-colors"
                        @click="removeMaterialRow($index)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
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
              <template #label><span class="tab-label">工序 <el-badge :value="form.processes.length" :max="99" class="tab-badge" /></span></template>
              <div class="tab-pane-content">
                <div class="tab-pane-actions">
                  <el-button v-if="!editMode.processes && form.processes.some(p => p.from_standard)" type="warning" size="small" @click="toggleEditMode('processes')">解锁编辑</el-button>
                  <el-button v-if="editMode.processes" type="success" size="small" @click="toggleEditMode('processes')">锁定编辑</el-button>
                  <el-button type="primary" size="small" @click="addProcessRow">添加工序</el-button>
                </div>
                <el-table :data="form.processes" border size="small">
                  <el-table-column label="工序名称" min-width="150">
                    <template #default="{ row }"><el-input v-model="row.item_name" @change="handleItemSubtotalChange(row)" size="small" :disabled="!!row.from_standard && !editMode.processes" /></template>
                  </el-table-column>
                  <el-table-column label="基本用量" width="100">
                    <template #default="{ row }"><el-input-number v-model="row.usage_amount" :min="0" :precision="4" :controls="false" @change="handleItemSubtotalChange(row)" size="small" style="width: 100%" :disabled="!!row.from_standard && !editMode.processes" /></template>
                  </el-table-column>
                  <el-table-column label="工价(CNY)" width="100">
                    <template #default="{ row }"><el-input-number v-model="row.unit_price" :min="0" :precision="4" :controls="false" @change="handleItemSubtotalChange(row)" size="small" style="width: 100%" :disabled="!!row.from_standard && !editMode.processes" /></template>
                  </el-table-column>
                  <el-table-column label="小计" width="100"><template #default="{ row }">{{ formatNumber(row.subtotal) }}</template></el-table-column>
                  <el-table-column label="操作" width="70" fixed="right">
                    <template #default="{ $index, row }">
                      <el-button 
                        v-if="!row.from_standard || editMode.processes"
                        size="small" 
                        link 
                        class="text-gray-400 hover:text-red-500 transition-colors"
                        @click="removeProcessRow($index)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
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
                      <el-select v-if="!row.from_standard || editMode.packaging" v-model="row.material_id" filterable remote reserve-keyword clearable :remote-method="searchPackagingByCategory" :loading="materialSearchLoading" :placeholder="row.item_name || '输入名称或料号搜索'" @change="handlePackagingMaterialSelect(row, $index)" style="width: 100%">
                        <el-option v-if="row.material_id && row.item_name && !materialSearchOptions.some(o => o.id === row.material_id)" :label="row.item_name" :value="row.material_id" />
                        <el-option v-for="material in materialSearchOptions" :key="material.id" :label="`${material.name} (${material.item_no})`" :value="material.id">
                          <div class="flex justify-between w-full"><span>{{ material.name }}</span><span class="text-slate-400 text-xs">¥{{ material.price }}/{{ material.unit }}</span></div>
                        </el-option>
                      </el-select>
                      <span v-else>{{ row.item_name }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="基本用量" width="100">
                    <template #default="{ row }"><el-input-number v-model="row.usage_amount" :min="0" :precision="4" :controls="false" @change="handleItemSubtotalChange(row)" size="small" style="width: 100%" :disabled="!!row.from_standard && !editMode.packaging" /></template>
                  </el-table-column>
                  <el-table-column label="外箱材积" width="100">
                    <template #default="{ row }">
                      <span v-if="row.carton_volume">{{ row.carton_volume }}</span>
                      <span v-else class="text-gray-400">-</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="单价(CNY)" width="100"><template #default="{ row }">{{ formatNumber(row.unit_price) || '-' }}</template></el-table-column>
                  <el-table-column label="小计" width="100"><template #default="{ row }">{{ formatNumber(row.subtotal) || '-' }}</template></el-table-column>
                  <el-table-column label="操作" width="70" fixed="right">
                    <template #default="{ $index, row }">
                      <el-button 
                        v-if="!row.from_standard || editMode.packaging"
                        size="small" 
                        link 
                        class="text-gray-400 hover:text-red-500 transition-colors"
                        @click="removePackagingRow($index)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="tab-pane-footer"><span>∑ 包材小计: <strong>{{ formatNumber(packagingTotal) }}</strong></span></div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

        </el-form>
      </div>

      <!-- 右侧成本预览面板 -->
      <div class="cost-preview-panel">
        <div class="cost-preview-sticky">
          <!-- 成本计算 -->
          <div class="preview-section" v-if="calculation">
            <div class="preview-section-title">成本计算</div>
            <div class="preview-cost-grid">
              <div class="preview-cost-item">
                <el-tooltip content="原料 + 工序×系数 + 包材" placement="top">
                  <span class="preview-cost-label cursor-help">基础成本 <el-icon class="text-gray-400"><InfoFilled /></el-icon></span>
                </el-tooltip>
                <span class="preview-cost-value">{{ formatNumber(calculation.baseCost) }}</span>
              </div>
              <div class="preview-cost-item">
                <el-tooltip content="运费总价 ÷ 数量" placement="top">
                  <span class="preview-cost-label cursor-help">运费成本 <el-icon class="text-gray-400"><InfoFilled /></el-icon></span>
                </el-tooltip>
                <span class="preview-cost-value">{{ calculation.freightCost > 0.001 ? formatNumber(calculation.freightCost) : '-' }}</span>
              </div>
              <div class="preview-cost-item">
                <el-tooltip :content="`(基础成本${form.include_freight_in_base ? '+运费' : ''}) ÷ (1-${((configStore.config.overhead_rate || 0.2) * 100).toFixed(0)}%)`" placement="top">
                  <span class="preview-cost-label cursor-help">管销价 <span class="text-blue-500">{{ ((configStore.config.overhead_rate || 0.2) * 100).toFixed(0) }}%</span></span>
                </el-tooltip>
                <span class="preview-cost-value">{{ formatNumber(calculation.overheadPrice) }}</span>
              </div>
            </div>
            <el-button size="small" type="primary" link @click="showAddFeeDialog" class="mt-2">+ 添加管销后费用项</el-button>
            <div v-if="customFeesWithValues.length > 0" class="preview-fee-list">
              <div v-for="(fee, index) in customFeesWithValues" :key="'fee-' + index" class="preview-fee-item">
                <span>{{ fee.name }} ({{ parseFloat((fee.rate * 100).toFixed(2)) }}%)</span>
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ formatNumber(fee.calculatedValue) }}</span>
                  <el-button size="small" link @click="handleRemoveCustomFee(index)" class="p-0 text-gray-400 hover:text-red-500 transition-colors" style="font-size: 14px;">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
            <div v-if="calculation.afterOverheadMaterialTotal > 0" class="preview-tip">管销后原料: <strong>{{ formatNumber(calculation.afterOverheadMaterialTotal) }}</strong></div>
          </div>

          <!-- 最终成本价 -->
          <div class="preview-final-box" v-if="calculation">
            <div class="preview-final-label">最终成本价</div>
            <div class="preview-final-value">
              <span v-if="form.sales_type === 'domestic'">{{ formatNumber(calculation.domesticPrice) }}</span>
              <span v-else>{{ formatNumber(calculation.insurancePrice) }}</span>
              <span class="preview-final-currency">{{ form.sales_type === 'domestic' ? 'CNY' : 'USD' }}</span>
            </div>
            <div class="preview-final-info">
              <span v-if="form.sales_type === 'export'">汇率 {{ formatNumber(calculation.exchangeRate) }} | 保险 0.3%</span>
              <span v-else>含 {{ ((form.vat_rate || 0.13) * 100).toFixed(0) }}% 增值税</span>
            </div>
          </div>

          <!-- 利润区间 -->
          <div class="preview-section" v-if="calculation && calculation.profitTiers">
            <div class="preview-section-header">
              <span class="preview-section-title">利润区间</span>
              <el-button type="primary" size="small" link @click="handleAddCustomProfitTier">+ 添加</el-button>
            </div>
            <!-- 滑块 -->
            <div class="preview-slider">
              <div class="preview-slider-header">
                <span class="text-xs text-gray-400">{{ sliderProfitRate }}%</span>
                <span class="text-sm font-semibold text-blue-600">{{ formatNumber(sliderPrice) }} {{ calculation.currency }}</span>
              </div>
              <el-slider v-model="sliderProfitRate" :min="0" :max="100" :step="1" :show-tooltip="false" @input="updateSliderPrice" />
            </div>
            <!-- 档位 -->
            <div class="preview-tier-list">
              <div v-for="tier in allProfitTiers" :key="tier.isCustom ? 'custom-' + tier.customIndex : 'system-' + tier.profitPercentage" class="preview-tier-item" :class="{ custom: tier.isCustom }" @click="!tier.isCustom && setSliderFromTier(tier)">
                <div class="preview-tier-left">
                  <span v-if="!tier.isCustom" class="preview-tier-rate">{{ tier.profitPercentage }}</span>
                  <el-input v-else v-model="tier.originalTier.profitRate" placeholder="0.35" size="small" style="width: 50px" @input="handleUpdateCustomTierPrice(tier.originalTier)" @click.stop />
                </div>
                <div class="preview-tier-right">
                  <span class="preview-tier-price">{{ formatNumber(tier.price) }}</span>
                  <span v-if="!tier.isCustom" class="preview-tier-profit">+{{ formatNumber(tier.price - (form.sales_type === 'domestic' ? calculation.domesticPrice : calculation.insurancePrice)) }}</span>
                  <el-button v-if="tier.isCustom" type="danger" size="small" link @click.stop="handleRemoveCustomProfitTier(tier.customIndex)">删除</el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!calculation" class="preview-empty">
            <el-icon class="text-4xl text-gray-300 mb-2"><Document /></el-icon>
            <p class="text-sm text-gray-400">选择型号配置后</p>
            <p class="text-sm text-gray-400">将实时显示成本计算</p>
          </div>

          <!-- 操作按钮 -->
          <div class="preview-actions">
            <div class="preview-actions-row">
              <el-button @click="handleSaveDraft" :loading="saving" class="action-draft">
                <el-icon><FolderAdd /></el-icon>草稿
              </el-button>
              <el-button type="primary" @click="handleSubmitQuotation" :loading="submitting" class="action-submit">
                <el-icon><Promotion /></el-icon>提交审核
              </el-button>
            </div>
            <el-button text @click="handleCancel" class="action-cancel">取消</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端底部栏 -->
    <div class="cost-mobile-footer">
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
    <el-dialog v-model="addFeeDialogVisible" title="添加管销后费用项" width="400px" class="minimal-dialog-auto" :close-on-click-modal="false" append-to-body>
      <el-form :model="newFee" :rules="feeRules" ref="feeFormRef" label-width="80px">
        <el-form-item label="费用项" prop="name"><el-input v-model="newFee.name" placeholder="输入在管销后计算的费用项目" /></el-form-item>
        <el-form-item label="费率" prop="rate">
          <el-input-number v-model="customFeeRatePercent" :controls="false" :precision="2" :min="0" :max="100" placeholder="输入数字" style="width: 180px;" />
          <span style="margin-left: 10px; color: #409eff;">%</span>
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
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled, WarningFilled, Document, FolderAdd, Promotion, Delete } from '@element-plus/icons-vue'
import CostPageHeader from '@/components/cost/CostPageHeader.vue'
import { formatNumber } from '@/utils/format'
import { useConfigStore } from '@/store/config'
import logger from '@/utils/logger'
import { getPackagingTypeName, formatPackagingMethodFromConfig, calculateTotalFromConfig, PACKAGING_TYPES } from '@/config/packagingTypes'
import { useFreightCalculation, useCostCalculation, useQuotationData, useCustomerSearch, useMaterialSearch, useCustomFees, useQuotationDraft } from '@/composables'

defineOptions({ name: 'CostAdd' })

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
  vat_rate: null, materials: [], processes: [], packaging: [], customFees: [],
  is_estimation: false, reference_standard_cost_id: null
})

// 编辑状态控制
const editMode = reactive({ materials: false, processes: false, packaging: false })
const currentModelCategory = ref('')

// 预估模式相关
const isEstimationMode = computed(() => route.query.mode === 'estimation' || form.is_estimation)
const newProductModels = ref([])
const referenceStandardCosts = ref([])
const referenceStandardCostsLoading = ref(false)
const referenceStandardCostId = ref(null)
const selectedNewProductCategory = computed(() => {
  if (!form.model_id || !newProductModels.value.length) return ''
  const model = newProductModels.value.find(m => m.id === form.model_id)
  return model?.model_category || ''
})

// Composables
const { freightCalculation, systemConfig, shippingInfo, quantityUnit, quantityInput, domesticCbmPrice, currentFactory, loadSystemConfig, setShippingInfoFromConfig, calculateShippingInfo, calculateFOBFreight, calculateCIFShenzhen, onQuantityUnitChange, onQuantityInputChange, onDomesticCbmPriceChange, onShippingMethodChange, onPortTypeChange, resetShippingInfo } = useFreightCalculation()
const { calculation, customProfitTiers, materialCoefficient, materialCoefficientsCache, loadMaterialCoefficients, calculateItemSubtotal, calculateCost, addCustomProfitTier, updateCustomTierPrice, removeCustomProfitTier, prepareCustomProfitTiersForSave, getAllProfitTiers } = useCostCalculation()
const { saving, submitting, isSaved, loadRegulations, loadPackagingConfigs, loadBomMaterials, loadPackagingConfigDetails, loadQuotationData, loadStandardCostData, saveQuotation, submitQuotation } = useQuotationData()
const { isNewCustomer, selectedCustomerId, customerOptions, customerSearchLoading, customerSelectFocused, onCustomerTypeChange, searchCustomers, onCustomerSelect } = useCustomerSearch()
const { allMaterials, materialSearchOptions, materialSearchLoading, loadAllMaterials, searchMaterials, onMaterialSelect, onPackagingMaterialSelect } = useMaterialSearch()
const { hasDraft, getDraftInfo, saveDraft, loadDraft, clearDraft, startAutoSave, stopAutoSave } = useQuotationDraft()

// 按类别搜索物料的封装函数
const searchMaterialsByCategory = (query) => searchMaterials(query, '原料') // 原料明细只搜索类别为"原料"的
const searchPackagingByCategory = (query) => searchMaterials(query, '包材') // 包材明细只搜索类别为"包材"的

// 数据列表
const regulations = ref([])
const packagingConfigs = ref([])

// computed
const vatRateOptions = computed(() => configStore.config.vat_rate_options || [0.13, 0.10])
const isEditMode = computed(() => !!route.params.id)
const pageTitle = computed(() => {
  if (route.params.id) return '编辑报价单'
  if (route.query.copyFrom) return '复制报价单'
  if (isEstimationMode.value) return '新产品成本预估'
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

// 利润滑块
const sliderProfitRate = ref(25)
const sliderPrice = computed(() => {
  if (!calculation.value) return 0
  const basePrice = form.sales_type === 'domestic' ? calculation.value.domesticPrice : calculation.value.insurancePrice
  return basePrice / (1 - sliderProfitRate.value / 100)
})
const updateSliderPrice = () => {} // 触发computed更新
const setSliderFromTier = (tier) => {
  const rate = parseInt(tier.profitPercentage) || 0
  sliderProfitRate.value = rate
}

// 自定义费用
const { addFeeDialogVisible, feeFormRef, newFee, feeRules, customFeeSummary, customFeesWithValues, showAddFeeDialog, confirmAddFee, removeCustomFee } = useCustomFees(form, calculation)

const customFeeRatePercent = computed({
  get: () => {
    if (newFee.rate === null || newFee.rate === undefined) return undefined
    return parseFloat((newFee.rate * 100).toFixed(4))
  },
  set: (val) => {
    if (val === null || val === undefined || val === '') {
      newFee.rate = null
    } else {
      newFee.rate = val / 100
    }
  }
})

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
// 智能客户搜索
const isOtherSalespersonCustomer = ref(false)
const selectedCustomerOwner = ref('')
const handleCustomerSearch = async (queryString, cb) => {
  if (!queryString || queryString.length < 2) { cb([]); return }
  await searchCustomers(queryString)
  cb(customerOptions.value)
}
const handleCustomerAutoSelect = async (item) => {
  // 检查是否为其他业务员的客户
  if (!item.is_mine && item.user_id) {
    try {
      await ElMessageBox.confirm(
        `该客户「${item.name}」属于业务员「${item.salesperson_name}」，确定要为其创建报价吗？`,
        '他人客户提示',
        { confirmButtonText: '继续使用', cancelButtonText: '取消', type: 'warning' }
      )
    } catch { return }
    isOtherSalespersonCustomer.value = true
    selectedCustomerOwner.value = item.salesperson_name
  } else {
    isOtherSalespersonCustomer.value = false
    selectedCustomerOwner.value = ''
  }
  selectedCustomerId.value = item.id
  form.customer_name = item.name
  form.customer_region = item.region || ''
  isNewCustomer.value = false
}
const handleCustomerClear = () => {
  selectedCustomerId.value = null
  form.customer_region = ''
  isNewCustomer.value = true
  isOtherSalespersonCustomer.value = false
  selectedCustomerOwner.value = ''
}
// 常用地区建议
const commonRegions = ['广东', '浙江', '江苏', '上海', '北京', '福建', '山东', '四川', '湖北', '河南', '美国', '欧洲', '东南亚', '日本', '韩国']
const suggestRegions = (queryString, cb) => {
  const results = queryString ? commonRegions.filter(r => r.includes(queryString)).map(v => ({ value: v })) : commonRegions.map(v => ({ value: v }))
  cb(results)
}
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
  // 预估模式下重置参考标准成本
  if (isEstimationMode.value) {
    referenceStandardCostId.value = null
    referenceStandardCosts.value = []
  }
}

// 预估模式：新产品型号变更
const onNewProductModelChange = async () => {
  if (!form.model_id) return
  const model = newProductModels.value.find(m => m.id === form.model_id)
  if (model) {
    form.regulation_id = model.regulation_id
    currentModelCategory.value = model.model_category
    if (materialCoefficientsCache.value[model.model_category]) {
      materialCoefficient.value = materialCoefficientsCache.value[model.model_category]
    }
    await loadReferenceStandardCosts(model.regulation_id, model.model_category)
  }
  referenceStandardCostId.value = null
  form.materials = []
  form.processes = []
  form.packaging = []
  calculation.value = null
}

// 加载参考标准成本列表
const loadReferenceStandardCosts = async (regulationId, modelCategory) => {
  referenceStandardCostsLoading.value = true
  try {
    const request = (await import('@/utils/request')).default
    const res = await request.get('/standard-costs', { params: { regulation_id: regulationId, model_category: modelCategory, page: 1, pageSize: 100 } })
    referenceStandardCosts.value = res.data || []
  } catch (error) {
    logger.error('加载参考标准成本失败:', error.message || error)
    referenceStandardCosts.value = []
  } finally {
    referenceStandardCostsLoading.value = false
  }
}

// 选择参考标准成本
const onReferenceStandardCostChange = async () => {
  if (!referenceStandardCostId.value) return
  form.reference_standard_cost_id = referenceStandardCostId.value
  try {
    const data = await loadStandardCostData(referenceStandardCostId.value)
    if (data) {
      await fillReferenceStandardCostData(data)
      ElMessage.success('已从参考标准成本复制数据，请根据新产品需求调整')
    }
  } catch (error) {
    logger.error('加载参考标准成本数据失败:', error.message || error)
    ElMessage.error('加载参考标准成本数据失败')
  }
}

// 填充参考标准成本数据（预估模式专用）
const fillReferenceStandardCostData = async (data) => {
  const { standardCost, items } = data
  const currentModelId = form.model_id
  const currentRegulationId = form.regulation_id
  
  form.sales_type = standardCost.sales_type || 'domestic'
  form.quantity = standardCost.quantity || null
  form.vat_rate = configStore.config.vat_rate || 0.13
  
  if (items?.material) {
    form.materials = items.material.items.map(item => ({
      category: 'material', material_id: item.material_id || null, item_name: item.item_name,
      usage_amount: parseFloat(item.usage_amount) || 0, unit_price: parseFloat(item.unit_price) || 0,
      subtotal: parseFloat(item.subtotal) || 0, is_changed: 0, from_standard: true, from_reference: true,
      after_overhead: item.after_overhead || false, coefficient_applied: true
    }))
  }
  if (items?.process) {
    form.processes = items.process.items.map(item => ({
      category: 'process', item_name: item.item_name,
      usage_amount: parseFloat(item.usage_amount) || 0, unit_price: parseFloat(item.unit_price) || 0,
      subtotal: parseFloat(item.subtotal) || 0, is_changed: 0, from_standard: true, from_reference: true
    }))
  }
  let cartonVolume = null
  if (items?.packaging) {
    form.packaging = items.packaging.items.map(item => ({
      category: 'packaging', material_id: item.material_id || null, item_name: item.item_name,
      usage_amount: parseFloat(item.usage_amount) || 0, unit_price: parseFloat(item.unit_price) || 0,
      carton_volume: item.carton_volume ? parseFloat(item.carton_volume) : null,
      subtotal: parseFloat(item.subtotal) || 0, is_changed: 0, from_standard: true, from_reference: true
    }))
    const cartonMaterial = items.packaging.items.find(item => item.carton_volume && item.carton_volume > 0)
    if (cartonMaterial) cartonVolume = parseFloat(cartonMaterial.carton_volume)
  }
  
  if (standardCost.pc_per_bag && standardCost.bags_per_box && standardCost.boxes_per_carton) {
    const pcsPerCarton = standardCost.pc_per_bag * standardCost.bags_per_box * standardCost.boxes_per_carton
    setShippingInfoFromConfig(pcsPerCarton, cartonVolume)
  }
  
  form.model_id = currentModelId
  form.regulation_id = currentRegulationId
  form.is_estimation = true
  
  editMode.materials = false
  editMode.processes = false
  editMode.packaging = false
  
  if (form.quantity) {
    quantityInput.value = form.quantity
    quantityUnit.value = 'pcs'
  }
  if (form.quantity && shippingInfo.pcsPerCarton) calculateShippingInfo(form, handleCalculateCost)
  handleCalculateCost()
}

// 加载新产品型号列表
const loadNewProductModels = async () => {
  try {
    const request = (await import('@/utils/request')).default
    const res = await request.get('/models')
    newProductModels.value = res.data || []
  } catch (error) {
    logger.error('加载型号列表失败:', error.message || error)
    newProductModels.value = []
  }
}

const onSalesTypeChange = () => {
  if (form.sales_type === 'domestic') {
    form.shipping_method = ''
    form.port_type = 'fob_shenzhen'
    form.port = ''
    freightCalculation.value = null
  } else {
    // 外销默认按箱
    quantityUnit.value = 'carton'
    onQuantityUnitChange(form, handleCalculateCost)
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
    
    // Set factory for CIF Shenzhen calculation
    currentFactory.value = config.factory || 'dongguan_xunan'

    const selectedConfig = packagingConfigs.value.find(c => c.id === form.packaging_config_id)
    if (selectedConfig?.model_category) {
      currentModelCategory.value = selectedConfig.model_category
      if (Object.keys(materialCoefficientsCache.value).length === 0) await loadMaterialCoefficients(currentModelCategory.value)
      else if (materialCoefficientsCache.value[selectedConfig.model_category]) materialCoefficient.value = materialCoefficientsCache.value[selectedConfig.model_category]
    }
    const pcsPerCarton = calculateTotalFromConfig(config)
    const cartonMaterial = materials.find(m => m.carton_volume && parseFloat(m.carton_volume) > 0)
    setShippingInfoFromConfig(pcsPerCarton, cartonMaterial ? parseFloat(cartonMaterial.carton_volume) : null)
    if (!cartonMaterial) {
      ElMessage.warning({ message: '当前配置缺少外箱材积数据，无法自动计算CBM和运费。请前往「包材管理」补充外箱的材积信息', duration: 8000, showClose: true })
    }
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

const toggleEditMode = (section) => { editMode[section] = !editMode[section]; if (editMode[section]) ElMessage.success(`${section === 'materials' ? '原料' : section === 'processes' ? '工序' : '包材'}名称已解锁，编辑后请锁定保存`) }
const addMaterialRow = () => form.materials.push({ category: 'material', material_id: null, item_name: '', usage_amount: null, unit_price: null, subtotal: 0, is_changed: 1, from_standard: false, after_overhead: false })
const addProcessRow = () => form.processes.push({ category: 'process', item_name: '', usage_amount: null, unit_price: null, subtotal: 0, is_changed: 1, from_standard: false })
const addPackagingRow = () => form.packaging.push({ category: 'packaging', material_id: null, item_name: '', usage_amount: null, unit_price: null, carton_volume: null, subtotal: 0, is_changed: 1, from_standard: false })
const removeMaterialRow = (index) => { form.materials.splice(index, 1); handleCalculateCost() }
const removeProcessRow = (index) => { form.processes.splice(index, 1); handleCalculateCost() }
const removePackagingRow = (index) => { form.packaging.splice(index, 1); handleCalculateCost() }
const goBack = () => router.back()

const handleCancel = async () => {
  if (!hasFormData.value) return
  try {
    await ElMessageBox.confirm('确定要取消当前报价填写吗？已填写的内容将被清除。', '取消报价', { confirmButtonText: '确定取消', cancelButtonText: '继续填写', type: 'warning' })
    resetForm()
    clearDraft()
    ElMessage.success('已清除填写内容')
  } catch { /* 用户选择继续填写 */ }
}

const resetForm = () => {
  Object.assign(form, {
    regulation_id: null, model_id: null, packaging_config_id: null,
    customer_name: '', customer_region: '', sales_type: 'domestic',
    shipping_method: '', port_type: 'fob_shenzhen', port: '',
    quantity: null, freight_total: null, include_freight_in_base: true,
    vat_rate: configStore.config.vat_rate || 0.13,
    materials: [], processes: [], packaging: [], customFees: []
  })
  calculation.value = null
  customProfitTiers.value = []
  isNewCustomer.value = true
  selectedCustomerId.value = null
  resetShippingInfo()
}

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
    if (res) { clearDraft(); stopAutoSave(); router.push('/cost/records') }
  } catch (error) { logger.error('保存失败:', error); ElMessage.error('保存失败') }
}

const handleSubmitQuotation = async () => {
  try {
    await formRef.value.validate()
    if ([...form.materials, ...form.processes, ...form.packaging].length === 0) { ElMessage.warning('请至少添加一项明细'); return }
    const res = await submitQuotation(route.params.id, prepareData())
    if (res) { clearDraft(); stopAutoSave(); router.push('/cost/records') }
  } catch (error) { logger.error('提交失败:', error); ElMessage.error('提交失败') }
}

const fillQuotationData = async (data, isCopy = false) => {
  const { quotation, items, customFees: fees } = data
  form.regulation_id = quotation.regulation_id
  form.packaging_config_id = quotation.packaging_config_id || null
  if (form.packaging_config_id) {
    const config = packagingConfigs.value.find(c => c.id === form.packaging_config_id)
    if (config) currentFactory.value = config.factory || 'dongguan_xunan'
  }
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
  if (form.packaging_config_id) {
    const config = packagingConfigs.value.find(c => c.id === form.packaging_config_id)
    if (config) currentFactory.value = config.factory || 'dongguan_xunan'
  }
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

// 草稿功能
const formatDraftTime = (isoString) => {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const getFormDataForDraft = () => ({
  form,
  extras: { modelCategory: currentModelCategory.value, quantityUnit: quantityUnit.value, quantityInput: quantityInput.value, domesticCbmPrice: domesticCbmPrice.value, customProfitTiers: customProfitTiers.value, editMode },
  hasData: hasFormData.value
})

const restoreDraft = async () => {
  const draft = loadDraft()
  if (!draft) return false
  try {
    if (draft.modelCategory) currentModelCategory.value = draft.modelCategory
    Object.assign(form, draft.form)
    if (draft.quantityUnit) quantityUnit.value = draft.quantityUnit
    if (draft.quantityInput) quantityInput.value = draft.quantityInput
    if (draft.domesticCbmPrice) domesticCbmPrice.value = draft.domesticCbmPrice
    if (draft.customProfitTiers) customProfitTiers.value = draft.customProfitTiers
    if (draft.editMode) Object.assign(editMode, draft.editMode)
    await nextTick()
    handleCalculateCost()
    ElMessage.success('草稿已恢复')
    return true
  } catch (error) {
    logger.error('恢复草稿失败:', error)
    ElMessage.error('恢复草稿失败')
    return false
  }
}

const checkAndRestoreDraft = async () => {
  if (route.params.id || route.query.copyFrom || route.query.copyFromStandardCost) return false
  const draftInfo = getDraftInfo()
  if (!draftInfo || !draftInfo.hasData) return false
  try {
    await ElMessageBox.confirm(
      `保存时间：${formatDraftTime(draftInfo.savedAt)}${draftInfo.modelCategory ? `\n产品类别：${draftInfo.modelCategory}` : ''}${draftInfo.customerName ? `\n客户：${draftInfo.customerName}` : ''}`,
      '检测到未完成的报价草稿',
      { distinguishCancelAndClose: true, confirmButtonText: '继续编辑', cancelButtonText: '新建报价', type: 'info' }
    )
    return await restoreDraft()
  } catch (action) {
    if (action === 'cancel') clearDraft()
    return false
  }
}

onMounted(async () => {
  await configStore.loadConfig()
  await loadSystemConfig()
  regulations.value = await loadRegulations()
  packagingConfigs.value = await loadPackagingConfigs()
  await loadAllMaterials()
  await loadMaterialCoefficients(currentModelCategory.value)
  form.vat_rate = configStore.config.vat_rate || 0.13
  
  // 预估模式下加载型号列表
  if (route.query.mode === 'estimation') {
    form.is_estimation = true
    await loadNewProductModels()
  }
  
  if (route.query.model_category) {
    currentModelCategory.value = route.query.model_category
    if (materialCoefficientsCache.value[route.query.model_category]) materialCoefficient.value = materialCoefficientsCache.value[route.query.model_category]
  }
  if (route.params.id) {
    const data = await loadQuotationData(route.params.id)
    if (data) await fillQuotationData(data, false)
  } else if (route.query.copyFromStandardCost) {
    const data = await loadStandardCostData(route.query.copyFromStandardCost)
    if (data) await fillStandardCostData(data)
  } else if (route.query.copyFrom) {
    const data = await loadQuotationData(route.query.copyFrom)
    if (data) await fillQuotationData(data, true)
  } else {
    await checkAndRestoreDraft()
  }
  if (!route.params.id) startAutoSave(getFormDataForDraft, 30000)
})

// 监听路由模式变化，切换时重置表单
watch(() => route.query.mode, async (newMode, oldMode) => {
  if (route.path !== '/cost/add' || route.params.id) return
  resetForm()
  referenceStandardCostId.value = null
  referenceStandardCosts.value = []
  if (newMode === 'estimation') {
    form.is_estimation = true
    await loadNewProductModels()
  } else {
    form.is_estimation = false
  }
})

onBeforeRouteLeave(async (to, from, next) => {
  stopAutoSave()
  if (isSaved.value || !hasFormData.value || route.params.id) { next(); return }
  try {
    await ElMessageBox.confirm('是否保存为草稿以便下次继续？', '您有未保存的报价数据', { distinguishCancelAndClose: true, confirmButtonText: '保存草稿', cancelButtonText: '放弃', type: 'warning' })
    const { form: f, extras } = getFormDataForDraft()
    saveDraft(f, extras)
    ElMessage.success('草稿已保存')
    next()
  } catch (action) {
    if (action === 'cancel') { clearDraft(); next() }
    else next(false)
  }
})
</script>

<style scoped>
/* ========== 页面容器 - 左右分栏布局 ========== */
.cost-page-wrapper { max-width: 1400px; margin: 0 auto; }

.cost-page-body {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  align-items: start;
}

/* 左侧表单面板 */
.cost-form-panel { min-width: 0; }

/* 右侧预览面板 */
.cost-preview-panel { position: relative; }

.cost-preview-sticky {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ========== 右侧预览区块 ========== */
.preview-section {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 14px;
}

.preview-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.preview-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

/* 成本网格 */
.preview-cost-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 6px;
}

.preview-cost-label {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.preview-cost-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

/* 自定义费用 */
.preview-fee-list { margin-top: 10px; }

.preview-fee-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #fef3c7;
  border-radius: 4px;
  font-size: 12px;
  color: #92400e;
  margin-bottom: 6px;
}

.preview-tip {
  margin-top: 8px;
  padding: 8px 10px;
  background: #fef3c7;
  border-radius: 4px;
  font-size: 12px;
  color: #92400e;
}

/* 最终成本框 */
.preview-final-box {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  color: #fff;
}

.preview-final-label {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.preview-final-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.preview-final-currency {
  font-size: 14px;
  font-weight: 500;
  margin-left: 4px;
  opacity: 0.9;
}

.preview-final-info {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 6px;
}

/* 利润滑块 */
.preview-slider { margin-bottom: 12px; }

.preview-slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

/* 利润档位列表 */
.preview-tier-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-tier-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.preview-tier-item:not(.custom):hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.preview-tier-item.custom {
  background: #fef3c7;
  border-color: #fbbf24;
}

.preview-tier-left { display: flex; align-items: center; gap: 6px; }

.preview-tier-rate {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  min-width: 36px;
}

.preview-tier-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-tier-price {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.preview-tier-profit {
  font-size: 11px;
  color: #22c55e;
  font-weight: 500;
}

/* 空状态 */
.preview-empty {
  background: #fff;
  border: 1px dashed #e4e7ed;
  border-radius: 10px;
  padding: 40px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 操作按钮 */
.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
}

.preview-actions-row {
  display: flex;
  gap: 8px;
}

.action-draft {
  flex: 1;
  height: 40px;
  border: 1px solid #dcdfe6;
  background: #f8fafc;
  color: #475569;
  font-weight: 500;
}
.action-draft:hover {
  background: #f1f5f9;
  border-color: #c0c4cc;
}

.action-submit {
  flex: 2;
  height: 40px;
  font-weight: 600;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
}
.action-submit:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.action-cancel {
  color: #94a3b8;
  font-size: 13px;
}
.action-cancel:hover {
  color: #64748b;
}

/* ========== 智能客户搜索 ========== */
.customer-suggestion {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.customer-suggestion-name {
  font-weight: 500;
  color: #303133;
}
.customer-suggestion-code {
  font-size: 12px;
  color: #909399;
}
.customer-suggestion-region {
  font-size: 12px;
  color: #67c23a;
  margin-left: auto;
}
.customer-suggestion-owner {
  font-size: 12px;
  color: #e6a23c;
  margin-left: auto;
}
.customer-suggestion.other-salesperson {
  background: #fef3c7;
  margin: -4px -8px;
  padding: 8px;
  border-radius: 4px;
}

/* ========== 移动端底部栏（仅小屏显示） ========== */
.cost-mobile-footer {
  display: none;
  position: sticky;
  bottom: 0;
  background: #fff;
  border-top: 1px solid #e4e7ed;
  padding: 12px 16px;
  z-index: 50;
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .cost-page-body { grid-template-columns: 1fr; }
  .cost-preview-panel { display: none; }
  .cost-mobile-footer { display: flex; justify-content: space-between; align-items: center; }
}

@media (max-width: 768px) {
  .cost-page-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .cost-header-right { flex-wrap: wrap; }
  .cost-section-body { padding: 12px !important; }
  .cost-section-body .el-row { margin: 0 !important; }
  .cost-section-body .el-col { padding: 0 !important; margin-bottom: 12px; }
  .cost-section-body .el-col-12, .cost-section-body .el-col-8, .cost-section-body .el-col-6, .cost-section-body .el-col-4 { 
    flex: 0 0 100% !important; max-width: 100% !important; 
  }
  .cost-form .el-form-item { margin-bottom: 16px; }
  .cost-form .el-form-item__label { float: none; text-align: left; padding: 0 0 4px 0; }
  .sales-type-group { flex-direction: column; }
  .sales-type-card { flex: none; }
  .container-type-btns { flex-wrap: wrap; }
  .freight-field { flex-wrap: wrap; }
  .freight-label { width: 100%; margin-bottom: 4px; }
}

/* ========== 原有样式保留 ========== */
.config-option { display: flex; justify-content: space-between; width: 100%; }
.config-method { color: #8492a6; font-size: 12px; }

/* 预估模式样式 */
.estimation-row { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e4e7ed; background: #fffbeb; margin: -16px -16px 16px; padding: 16px; border-radius: 8px 8px 0 0; }
.model-option { display: flex; justify-content: space-between; width: 100%; }
.model-category { color: #8492a6; font-size: 12px; }
.reference-sc-option { display: flex; align-items: center; gap: 12px; width: 100%; }
.sc-model { font-weight: 500; }
.sc-customer { color: #606266; font-size: 13px; }
.sc-price { margin-left: auto; color: #67c23a; font-size: 12px; }
.no-reference-tip { color: #909399; font-size: 12px; margin-top: 4px; }
.customer-region { float: right; color: #8492a6; font-size: 12px; }
.vat-rate-section { margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e4e7ed; }
.export-freight-section { margin-top: 20px; }
.freight-panel { border: 1px solid #e4e7ed; border-radius: 8px; overflow: hidden; }
.freight-panel-header { background: #f5f7fa; padding: 12px 16px; font-weight: 600; color: #303133; border-bottom: 1px solid #e4e7ed; }
.freight-panel-body { padding: 16px; }
.freight-field { display: flex; align-items: center; margin-bottom: 12px; }
.freight-label { width: 80px; color: #606266; font-size: 14px; flex-shrink: 0; }
.freight-unit { margin-left: 8px; color: #909399; }
.freight-value { font-weight: 600; color: #303133; }
.container-type-btns { display: flex; gap: 10px; }
.smart-packing-tip { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 6px; margin: 16px 0; }
.smart-packing-tip .el-icon { color: #1890ff; font-size: 18px; margin-top: 2px; }
.tip-content { flex: 1; }
.tip-title { font-weight: 600; color: #1890ff; margin-bottom: 4px; }
.tip-content div { color: #606266; font-size: 13px; line-height: 1.6; }
.domestic-quantity-section { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #e4e7ed; }
.quantity-hint { color: #67c23a; font-size: 12px; margin-top: 4px; }
.freight-hint { color: #909399; font-size: 12px; margin-top: 4px; }
.subtotal-row { display: flex; justify-content: flex-end; gap: 24px; padding: 8px 0; font-size: 14px; color: #606266; }
.subtotal-row strong { color: #409eff; }
.subtotal-row .after-overhead strong { color: #e6a23c; }
.subtotal-row .process-total .highlight { color: #67c23a; }
.material-option { display: flex; justify-content: space-between; width: 100%; }
.material-price { color: #8492a6; font-size: 13px; }
.help-cursor { cursor: help; }
:deep(.el-input-number) { width: 100%; }

/* 底部栏样式（移动端） */
.sticky-footer-left { display: flex; align-items: center; gap: 16px; }
.sticky-price-item { display: flex; flex-direction: column; }
.sticky-price-item.secondary .sticky-price-value { font-size: 14px; color: #606266; }
.sticky-price-label { font-size: 11px; color: #909399; }
.sticky-price-value { font-size: 16px; font-weight: 600; color: #409eff; }
.sticky-price-divider { width: 1px; height: 32px; background: #e4e7ed; }
.sticky-placeholder { font-size: 13px; color: #909399; }
.sticky-footer-right { display: flex; align-items: center; gap: 8px; }

/* ========== 新增布局样式 ========== */
.compact-required-label :deep(.el-form-item__label) {
  padding-right: 4px;
}
.compact-required-label :deep(.el-form-item__label::before) {
  margin-right: 2px !important;
}

.wide-label-item {
  display: flex !important;
  align-items: center !important;
}
.wide-label-item :deep(.el-form-item__label) {
  width: auto !important;
  margin-right: 12px !important;
  float: none !important;
  white-space: nowrap;
  text-align: left !important;
}
.wide-label-item :deep(.el-form-item__content) {
  margin-left: 0 !important;
  flex: none !important;
}

.readonly-value-box {
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 0 12px;
  height: 32px;
  line-height: 32px;
  color: #606266;
  width: 100%;
}

.freight-input-group {
  display: flex;
  align-items: center;
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
  gap: 32px;
  flex-wrap: nowrap;
}

.freight-input-group .input-item {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.freight-input-group .input-item.primary {
  flex: 0 0 auto;
}

.freight-input-group .input-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.freight-input-group .quantity-input {
  width: 120px;
}

.info-divider {
  width: 1px;
  height: 20px;
  background-color: #e2e8f0;
}

.freight-input-group .info-value {
  color: #0f172a;
  font-weight: 600;
  font-size: 15px;
}

.freight-input-group .info-value.big {
  color: #2563eb;
  font-weight: 700;
}

.freight-input-group .unit-text {
  font-size: 12px;
  color: #94a3b8;
  margin-left: 2px;
}

.mb-0 { margin-bottom: 0 !important; }

/* 智能装箱提示（内销） */
.smart-packing-tip.domestic {
  margin: 12px 0 20px 0;
  border-radius: 6px;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.smart-packing-tip.domestic .el-icon {
  color: #e6a23c;
  margin-top: 2px;
}
.smart-packing-tip.domestic .tip-title {
  color: #e6a23c;
  font-weight: 600;
  margin-bottom: 4px;
}

/* CBM过大警告样式 */
.smart-packing-tip.warning {
  margin: 12px 0 20px 0;
  border-radius: 6px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.smart-packing-tip.warning .el-icon {
  color: #f56c6c;
  margin-top: 2px;
}
.smart-packing-tip.warning .tip-title {
  color: #f56c6c;
  font-weight: 600;
  margin-bottom: 4px;
}</style>
