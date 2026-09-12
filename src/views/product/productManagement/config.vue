<template>
    <div class="config-page">
        <div class="config-shell">
            <header class="config-header">
                <div>
                    <div class="config-title">产品配置 <el-tag v-if="isCopy" type="warning" effect="plain">复制新增</el-tag></div>
                    <div class="config-subtitle">配置共用基本信息、各产品方案及前端展示内容</div>
                </div>
                <el-button :loading="saving" @click="save(true)">临时保存</el-button>
            </header>

            <nav class="config-nav">
                <button v-for="item in tabs" :key="item.name" :class="{ active: activeTab === item.name }" @click="activeTab = item.name">
                    {{ item.label }}
                </button>
            </nav>

            <main class="config-body">
                <section v-show="activeTab === 'plan'" class="plan-content">
                    <el-alert
                        v-if="hasOrders"
                        class="order-lock-tip"
                        title="该产品已有订单，仅顶部横幅副标题、保障责任和方案详情可修改"
                        type="warning"
                        :closable="false"
                        show-icon
                    />
                    <div class="basic-card">
                        <div class="section-title blue-title">基本信息</div>
                        <el-form :model="form" label-position="top" class="basic-grid">
                            <el-form-item label="产品名称" required
                                ><el-input v-model="form.name" :disabled="hasOrders" placeholder="请输入产品名称"
                            /></el-form-item>
                            <el-form-item label="产品编码" required
                                ><el-input v-model="form.code" :disabled="hasOrders" placeholder="请输入产品编码"
                            /></el-form-item>
                            <el-form-item label="业务归属" required
                                ><el-select v-model="form.businessUnit" :disabled="hasOrders" placeholder="请选择业务归属"
                                    ><el-option v-for="x in units" :key="x" :label="x" :value="x" /></el-select
                            ></el-form-item>
                        </el-form>
                    </div>

                    <div class="block-title"><b>页面展示配置</b><span>方案详情页顶部</span></div>
                    <el-form label-position="top"
                        ><el-form-item label="顶部横幅副标题"
                            ><el-input v-model="form.subtitle" type="textarea" :rows="2" placeholder="请输入顶部横幅副标题" /></el-form-item
                    ></el-form>

                    <div class="horizontal-tabs product-tabs">
                        <button
                            v-for="(product, index) in form.products"
                            :key="index"
                            :class="{ active: productIndex === index }"
                            @click="selectProduct(index)"
                        >
                            <span class="number-dot">{{ index + 1 }}</span
                            >{{ product.name || `产品${index + 1}` }}<el-icon v-if="!hasOrders" @click.stop="removeProduct(index)"><Close /></el-icon>
                        </button>
                        <button v-if="!hasOrders" class="add-tab" @click="addProduct">＋ 添加产品</button>
                    </div>

                    <template v-if="currentProduct">
                        <div class="block-title"><b>产品信息</b><span>该产品独立配置</span></div>
                        <el-form label-position="top" class="product-info-grid">
                            <el-form-item label="产品名称" required
                                ><el-input v-model="currentProduct.name" :disabled="hasOrders" placeholder="请输入产品名称"
                            /></el-form-item>
                            <el-form-item label="险种类别" required
                                ><el-select v-model="currentProduct.type" :disabled="hasOrders" placeholder="请选择险种"
                                    ><el-option label="主险" value="主险" /><el-option label="附加险" value="附加险" /></el-select
                            ></el-form-item>
                            <el-form-item label="承保公司" required>
                                <el-select
                                    v-model="currentProduct.companyId"
                                    filterable
                                    :disabled="hasOrders"
                                    :loading="companyLoading"
                                    placeholder="请选择承保公司"
                                >
                                    <el-option
                                        v-for="company in companyOptions"
                                        :key="company.companyId"
                                        :label="company.companyName"
                                        :value="company.companyId"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="是否必选"
                                ><el-checkbox v-model="currentProduct.required" :disabled="hasOrders">必选</el-checkbox></el-form-item
                            >
                        </el-form>

                        <div class="horizontal-tabs scheme-tabs">
                            <button
                                v-for="(plan, index) in currentProduct.plans"
                                :key="index"
                                :class="{ active: planIndex === index }"
                                @click="planIndex = index"
                            >
                                {{ plan.name || `方案${index + 1}` }}<el-icon v-if="!hasOrders" @click.stop="removePlan(index)"><Close /></el-icon>
                            </button>
                            <button v-if="!hasOrders" class="add-tab dashed" @click="addPlan">＋ 添加方案</button>
                        </div>

                        <template v-if="currentPlan">
                            <div class="scheme-card">
                                <label>方案名称</label><el-input v-model="currentPlan.name" :disabled="hasOrders" placeholder="请输入方案名称" />
                                <label>保费</label><el-input-number v-model="currentPlan.premium" :disabled="hasOrders" :min="0" :controls="false" />
                                <span class="unit">元/年</span>
                            </div>

                            <div class="table-title">
                                <div><b>保障责任</b><span>该方案的保障项目</span></div>
                                <el-button link type="primary" @click="currentPlan.protections.push({ name: '', amount: '' })"
                                    >＋ 添加保障项</el-button
                                >
                            </div>
                            <el-table :data="currentPlan.protections" border empty-text="暂无保障责任，请点击添加保障项">
                                <el-table-column type="index" label="序号" width="68" align="center" />
                                <el-table-column label="保障项目"
                                    ><template #default="s"><el-input v-model="s.row.name" placeholder="请输入保障项目" /></template
                                ></el-table-column>
                                <el-table-column label="保障金额" width="240"
                                    ><template #default="s"><el-input v-model="s.row.amount" placeholder="请输入金额" /></template
                                ></el-table-column>
                                <el-table-column label="操作" width="86" align="center"
                                    ><template #default="s"
                                        ><el-button link type="danger" @click="currentPlan.protections.splice(s.$index, 1)">删除</el-button></template
                                    ></el-table-column
                                >
                            </el-table>
                            <div class="block-title detail-title"><b>方案详情</b><span>支持富文本、图片和视频</span></div>
                            <Editor v-model="currentPlan.description" :height="220" :min-height="220" video-upload :video-file-size="100" />
                        </template>
                        <el-empty v-else :image-size="72" :description="hasOrders ? '暂无方案' : '暂无方案，请点击添加方案'" />
                    </template>
                    <el-empty v-else :image-size="88" :description="hasOrders ? '暂无产品' : '暂无产品，请点击添加产品'" />
                </section>

                <section v-show="activeTab === 'intro'" class="normal-section">
                    <div class="section-title">介绍页配置</div>
                    <div class="tip">配置销售端产品介绍页展示的富文本、图片及视频内容</div>
                    <Editor v-model="form.introduction" :min-height="430" />
                    <div class="block-title customer-service-title"><b>客服电话</b><span>服务热线电话</span></div>
                    <el-form :model="form" label-position="top" class="customer-service-grid">
                        <el-form-item label="客服电话号码">
                            <el-input v-model="form.customerServicePhone" placeholder="请输入客服电话" />
                        </el-form-item>
                        <el-form-item label="服务时间">
                            <el-input v-model="form.customerServiceHours" placeholder="例如：9:00-18:00" />
                        </el-form-item>
                        <el-form-item label="备注说明">
                            <el-input v-model="form.customerServiceRemark" placeholder="备注" />
                        </el-form-item>
                    </el-form>
                </section>

                <section v-show="activeTab === 'fields'" class="normal-section">
                    <InsuredFieldsConfig v-model="form.fieldGroups" :disabled="hasOrders" />
                </section>

                <section v-show="activeTab === 'read'" class="normal-section">
                    <el-alert
                        class="read-tip"
                        title="强制阅读内容将在投保流程中展示，用户必须完成阅读（滑到底部或阅读满指定时长）后方可继续投保。内容使用富文本编辑，支持字体大小、颜色、对齐等格式。"
                        type="info"
                        :closable="false"
                        show-icon
                    />

                    <section class="read-rule-card" aria-labelledby="read-rule-title">
                        <div class="read-rule-heading">
                            <div>
                                <h3 id="read-rule-title">其他协议统一阅读规则</h3>
                                <p>除首条重要提示外，下面所有协议统一使用此规则，新添加的协议也会自动继承。</p>
                            </div>
                            <el-tag type="primary" effect="light">统一设置</el-tag>
                        </div>
                        <div class="read-mode-group global-read-mode">
                            <el-checkbox
                                v-model="form.forceReadRule.requireScroll"
                                :disabled="form.forceReadRule.requireScroll && !form.forceReadRule.requireDuration"
                            >
                                强制滑到底部
                            </el-checkbox>
                            <span class="duration-option">
                                <el-checkbox
                                    v-model="form.forceReadRule.requireDuration"
                                    :disabled="form.forceReadRule.requireDuration && !form.forceReadRule.requireScroll"
                                >
                                    阅读满
                                </el-checkbox>
                                <el-input-number
                                    v-model="form.forceReadRule.seconds"
                                    :min="1"
                                    :controls="false"
                                    :disabled="!form.forceReadRule.requireDuration"
                                />
                                <span class="unit">秒</span>
                            </span>
                        </div>
                        <p class="read-rule-summary">当前规则：{{ forceReadRuleSummary }}</p>
                    </section>

                    <el-card v-for="(x, i) in form.forceRead" :key="i" shadow="never" class="read-card" :class="{ 'is-important': x.important }">
                        <template #header>
                            <div class="read-card-header">
                                <div class="read-card-name">
                                    <span class="read-index">{{ i + 1 }}</span>
                                    <b>{{ x.important ? '重要提示信息' : x.title || `阅读内容${i + 1}` }}</b>
                                    <el-tag v-if="x.important" type="danger" effect="light" size="small">重要</el-tag>
                                </div>
                                <div v-if="!x.important" class="read-card-actions">
                                    <el-button link :disabled="i <= 1" @click="moveForceRead(i, -1)"
                                        ><el-icon><ArrowUp /></el-icon>上移</el-button
                                    >
                                    <el-button link :disabled="i === form.forceRead.length - 1" @click="moveForceRead(i, 1)"
                                        ><el-icon><ArrowDown /></el-icon>下移</el-button
                                    >
                                    <el-button v-if="!x.important" link type="danger" @click="removeForceRead(i)"
                                        ><el-icon><Delete /></el-icon>删除</el-button
                                    >
                                </div>
                            </div>
                        </template>

                        <el-form :model="x" label-position="top" class="read-form">
                            <el-form-item label="内容标题" required>
                                <el-input v-model="x.title" placeholder="请输入内容标题" />
                            </el-form-item>
                            <el-form-item label="阅读内容" required class="read-content-item">
                                <Editor v-model="x.content" :min-height="180" />
                            </el-form-item>
                            <div class="read-settings-grid">
                                <el-form-item v-if="x.important" label="展示方式" class="read-mode-item">
                                    <span class="read-mode-static"><span class="read-mode-dot"></span>悬浮展示</span>
                                </el-form-item>
                                <el-form-item v-if="!x.important" label="排序" class="read-sort-item">
                                    <el-input-number v-model="x.sort" :min="2" :controls="false" />
                                </el-form-item>
                                <el-form-item :label="x.important ? '是否展示' : '是否启用'">
                                    <div class="read-switch">
                                        <el-switch v-model="x.enabled" />
                                        <span>{{ forceReadStatusText(x) }}</span>
                                    </div>
                                </el-form-item>
                            </div>
                        </el-form>
                    </el-card>

                    <button type="button" class="add-read-card" @click="addForceRead">
                        <span class="add-read-icon">＋</span>
                        <b>添加阅读内容</b>
                        <small>使用富文本编辑，自动应用上方统一阅读规则</small>
                    </button>
                </section>

                <section v-show="activeTab === 'agreement'" class="normal-section">
                    <div class="agreement-heading">
                        <div>
                            <div class="section-title">协议配置管理</div>
                            <p>统一维护投保所需的产品文件与平台正式协议</p>
                        </div>
                    </div>

                    <div class="agreement-toolbar">
                        <el-input v-model="agreementFilters.keyword" clearable placeholder="搜索名称/标题/编号" @keyup.enter="searchAgreements" />
                        <el-select v-model="agreementFilters.configType" clearable placeholder="全部配置类型">
                            <el-option label="产品文件" value="productFile" />
                            <el-option label="协议配置" value="agreement" />
                        </el-select>
                        <el-select v-model="agreementFilters.agreementType" clearable placeholder="全部协议类型">
                            <el-option v-for="item in agreementTypeOptions" :key="item" :label="item" :value="item" />
                        </el-select>
                        <div class="agreement-query-actions">
                            <el-button type="primary" @click="searchAgreements">查询</el-button>
                            <el-button @click="resetAgreementFilters">重置</el-button>
                        </div>
                        <el-button class="agreement-add-button" type="primary" @click="openAgreementDialog()">＋ 新增配置</el-button>
                    </div>

                    <div class="agreement-table-wrap">
                        <el-table :data="pagedAgreements" border empty-text="暂无符合条件的协议配置">
                            <el-table-column label="序号" width="66" align="center">
                                <template #default="s">{{ (agreementPage - 1) * agreementPageSize + s.$index + 1 }}</template>
                            </el-table-column>
                            <el-table-column label="配置类型" width="100">
                                <template #default="s">
                                    <el-tag :type="s.row.configType === 'agreement' ? 'warning' : 'primary'" effect="light">
                                        {{ agreementConfigTypeText(s.row.configType) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="name" label="名称/标题" min-width="210" show-overflow-tooltip />
                            <el-table-column label="协议类型" width="120">
                                <template #default="s"
                                    ><el-tag type="info" effect="plain">{{ s.row.agreementType }}</el-tag></template
                                >
                            </el-table-column>
                            <el-table-column label="版本号" width="90" align="center">
                                <template #default="s">{{ s.row.version || '-' }}</template>
                            </el-table-column>
                            <el-table-column label="内容类型" width="90" align="center">
                                <template #default="s">{{ agreementContentTypeText(s.row.contentType) }}</template>
                            </el-table-column>
                            <el-table-column label="是否启用" width="90" align="center">
                                <template #default="s">
                                    <span class="agreement-status" :class="{ disabled: !s.row.enabled }">
                                        <span class="agreement-status-dot"></span>{{ s.row.enabled ? '启用' : '停用' }}
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column label="排序" width="70" align="center">
                                <template #default="s">{{ s.row.sort ?? '-' }}</template>
                            </el-table-column>
                            <el-table-column prop="updatedAt" label="更新时间" width="168" />
                            <el-table-column label="操作" width="118" fixed="right" align="center">
                                <template #default="s">
                                    <el-button link type="primary" @click="openAgreementDialog(s.row)">编辑</el-button>
                                    <el-button link type="danger" @click="deleteAgreement(s.row)">删除</el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>

                    <div class="agreement-pagination">
                        <span>共 {{ filteredAgreements.length }} 条</span>
                        <el-pagination
                            v-model:current-page="agreementPage"
                            :page-size="agreementPageSize"
                            :total="filteredAgreements.length"
                            layout="prev, pager, next"
                            background
                        />
                    </div>

                    <el-dialog
                        v-model="agreementDialogVisible"
                        :title="agreementDialogTitle"
                        width="min(860px, calc(100vw - 32px))"
                        append-to-body
                        destroy-on-close
                    >
                        <div class="agreement-dialog-body">
                            <div class="config-type-grid">
                                <button
                                    type="button"
                                    class="config-type-card"
                                    :class="{ active: agreementForm.configType === 'productFile' }"
                                    @click="selectAgreementConfigType('productFile')"
                                >
                                    <span class="config-type-icon">文</span>
                                    <span><b>产品文件</b><small>投保须知、产品条款、服务协议等</small></span>
                                    <i>支持文字、链接、附件三种内容形式</i>
                                </button>
                                <button
                                    type="button"
                                    class="config-type-card"
                                    :class="{ active: agreementForm.configType === 'agreement' }"
                                    @click="selectAgreementConfigType('agreement')"
                                >
                                    <span class="config-type-icon">协</span>
                                    <span><b>协议配置</b><small>用户服务协议、隐私政策等正式协议</small></span>
                                    <i>支持版本管理和富文本正文编辑</i>
                                </button>
                            </div>

                            <el-form :model="agreementForm" label-position="top" class="agreement-form">
                                <template v-if="agreementForm.configType === 'productFile'">
                                    <div class="agreement-form-grid">
                                        <el-form-item label="协议编号">
                                            <el-input v-model="agreementForm.code" placeholder="选填，例如 AGR-2024-001" />
                                        </el-form-item>
                                        <el-form-item label="协议名称" required>
                                            <el-input v-model="agreementForm.name" placeholder="请输入协议名称" />
                                        </el-form-item>
                                    </div>

                                    <el-form-item label="内容类型" required>
                                        <el-radio-group v-model="agreementForm.contentType" class="content-type-options">
                                            <el-radio-button value="text">文字</el-radio-button>
                                            <el-radio-button value="link">链接</el-radio-button>
                                            <el-radio-button value="attachment">附件</el-radio-button>
                                        </el-radio-group>
                                    </el-form-item>

                                    <el-form-item v-if="agreementForm.contentType === 'text'" label="文件内容" required class="agreement-editor-item">
                                        <Editor v-model="agreementForm.content" :min-height="250" />
                                    </el-form-item>
                                    <el-form-item v-else-if="agreementForm.contentType === 'link'" label="链接地址" required>
                                        <div class="agreement-link-input">
                                            <el-input v-model="agreementForm.link" placeholder="请输入以 http:// 或 https:// 开头的完整地址" />
                                            <el-button @click="testAgreementLink">测试链接</el-button>
                                        </div>
                                    </el-form-item>
                                    <el-form-item v-else label="上传附件" required>
                                        <el-upload
                                            class="agreement-upload"
                                            drag
                                            :auto-upload="false"
                                            :show-file-list="false"
                                            :on-change="handleAgreementFileChange"
                                        >
                                            <div class="upload-symbol">⇧</div>
                                            <div class="upload-copy">
                                                <b>{{ agreementForm.fileName || '点击或拖拽文件到此处上传' }}</b>
                                                <small>支持 PDF、Word、Excel、图片，单个文件不超过 20MB</small>
                                            </div>
                                        </el-upload>
                                    </el-form-item>

                                    <div class="agreement-form-grid agreement-meta-grid">
                                        <el-form-item label="协议类型" required>
                                            <el-select v-model="agreementForm.agreementType" placeholder="请选择协议类型">
                                                <el-option v-for="item in productAgreementTypes" :key="item" :label="item" :value="item" />
                                            </el-select>
                                        </el-form-item>
                                        <el-form-item label="排序">
                                            <el-input-number v-model="agreementForm.sort" :min="1" :controls="false" />
                                        </el-form-item>
                                        <el-form-item label="是否启用">
                                            <div class="agreement-switch">
                                                <el-switch v-model="agreementForm.enabled" /><span>{{
                                                    agreementForm.enabled ? '启用' : '停用'
                                                }}</span>
                                            </div>
                                        </el-form-item>
                                        <el-form-item label="备注" class="agreement-remark-item">
                                            <el-input v-model="agreementForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
                                        </el-form-item>
                                    </div>
                                </template>

                                <template v-else>
                                    <div class="agreement-form-grid formal-agreement-grid">
                                        <el-form-item label="协议类型" required>
                                            <el-select v-model="agreementForm.agreementType" placeholder="请选择协议类型">
                                                <el-option v-for="item in formalAgreementTypes" :key="item" :label="item" :value="item" />
                                            </el-select>
                                        </el-form-item>
                                        <el-form-item label="协议标题" required>
                                            <el-input v-model="agreementForm.name" placeholder="请输入协议标题" />
                                        </el-form-item>
                                        <el-form-item label="协议版本号">
                                            <el-input v-model="agreementForm.version" placeholder="例如 V2.1.0" />
                                            <small class="field-tip">修改协议内容时，建议同步更新版本号</small>
                                        </el-form-item>
                                        <el-form-item label="是否启用">
                                            <div class="agreement-switch">
                                                <el-switch v-model="agreementForm.enabled" /><span>{{
                                                    agreementForm.enabled ? '启用' : '停用'
                                                }}</span>
                                            </div>
                                        </el-form-item>
                                    </div>
                                    <el-form-item label="协议内容" required class="agreement-editor-item">
                                        <Editor v-model="agreementForm.content" :min-height="320" />
                                    </el-form-item>
                                </template>
                            </el-form>
                        </div>

                        <template #footer>
                            <el-button @click="agreementDialogVisible = false">取消</el-button>
                            <el-button type="primary" @click="saveAgreementConfig">保存配置</el-button>
                        </template>
                    </el-dialog>
                </section>
            </main>

            <footer class="config-footer">
                <el-button @click="router.push('/product/list')">取消</el-button>
                <el-button type="primary" :loading="saving" @click="save(false)">{{ activeTab === 'plan' ? '保存全部配置' : '保存配置' }}</el-button>
            </footer>
        </div>
    </div>
</template>

<script setup name="ProductConfig" lang="ts">
import { ArrowDown, ArrowUp, Close, Delete } from '@element-plus/icons-vue';
import InsuredFieldsConfig from './components/InsuredFieldsConfig.vue';
import { listInsuranceCompany } from '@/api/product/insuranceCompany';
import type { InsuranceCompanyVO } from '@/api/product/insuranceCompany/types';
import { getProductConfig, saveProductConfig } from '@/api/product/productManagement';
import type { AgreementConfigItem, AgreementConfigType, ForceReadItem, ProductConfig } from '@/api/product/productManagement/types';
import type { UploadFile } from 'element-plus';

const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const tabs = [
    { name: 'plan', label: '产品方案配置' },
    { name: 'intro', label: '介绍页配置' },
    { name: 'fields', label: '投保信息配置' },
    { name: 'read', label: '强制阅读' },
    { name: 'agreement', label: '协议文件配置' }
];
const units = ['贵州本部', '重庆本部', '保定本部', '四川本部'];
const productAgreementTypes = ['投保须知', '产品条款', '服务协议', '隐私政策', '其他'];
const formalAgreementTypes = ['用户服务协议', '隐私政策', '用户协议', '会员服务协议', '其他'];
const agreementTypeOptions = [...new Set([...productAgreementTypes, ...formalAgreementTypes])];
const createEmptyAgreement = (): AgreementConfigItem => ({
    configType: 'productFile',
    code: '',
    name: '',
    agreementType: '投保须知',
    version: '',
    contentType: 'text',
    content: '',
    link: '',
    fileName: '',
    enabled: true,
    sort: 1,
    remark: '',
    updatedAt: ''
});
const tabNames = tabs.map((item) => item.name);
const activeTab = ref(tabNames.includes(String(route.query.tab)) ? String(route.query.tab) : 'plan');
const productIndex = ref(0);
const planIndex = ref(0);
const saving = ref(false);
const companyLoading = ref(false);
const companyOptions = ref<InsuranceCompanyVO[]>([]);
const agreementFilters = reactive({ keyword: '', configType: '', agreementType: '' });
const agreementQuery = reactive({ keyword: '', configType: '', agreementType: '' });
const agreementPage = ref(1);
const agreementPageSize = 10;
const agreementDialogVisible = ref(false);
const agreementDialogTitle = ref('新增配置');
const editingAgreementIndex = ref(-1);
const agreementForm = reactive<AgreementConfigItem>(createEmptyAgreement());
const isCopy = computed(() => Boolean(route.query.copy));
const form = reactive<ProductConfig>({
    hasOrders: false,
    name: '',
    code: '',
    businessUnit: '',
    subtitle: '',
    products: [],
    introduction: '',
    customerServicePhone: '',
    customerServiceHours: '',
    customerServiceRemark: '',
    fieldGroups: [],
    forceReadRule: {
        requireScroll: true,
        requireDuration: true,
        seconds: 10
    },
    forceRead: [],
    agreements: []
});
const hasOrders = computed(() => form.hasOrders && !isCopy.value);
const currentProduct = computed(() => form.products[productIndex.value]);
const currentPlan = computed(() => currentProduct.value?.plans[planIndex.value]);
const forceReadRuleSummary = computed(() => {
    const rules: string[] = [];
    if (form.forceReadRule.requireScroll) rules.push('滑到底部');
    if (form.forceReadRule.requireDuration) rules.push(`阅读满 ${form.forceReadRule.seconds} 秒`);
    return rules.join('并且');
});
const filteredAgreements = computed(() => {
    const keyword = agreementQuery.keyword.trim().toLowerCase();
    return form.agreements.filter((item) => {
        const matchesKeyword = !keyword || [item.name, item.code].some((value) => value?.toLowerCase().includes(keyword));
        const matchesConfigType = !agreementQuery.configType || item.configType === agreementQuery.configType;
        const matchesAgreementType = !agreementQuery.agreementType || item.agreementType === agreementQuery.agreementType;
        return matchesKeyword && matchesConfigType && matchesAgreementType;
    });
});
const pagedAgreements = computed(() => {
    const start = (agreementPage.value - 1) * agreementPageSize;
    return filteredAgreements.value.slice(start, start + agreementPageSize);
});
const agreementConfigTypeText = (type: AgreementConfigType) => (type === 'agreement' ? '协议配置' : '产品文件');
const agreementContentTypeText = (type?: AgreementConfigItem['contentType']) => {
    if (!type) return '-';
    return { text: '文字', link: '链接', attachment: '附件' }[type];
};
const searchAgreements = () => {
    Object.assign(agreementQuery, agreementFilters);
    agreementPage.value = 1;
};
const resetAgreementFilters = () => {
    Object.assign(agreementFilters, { keyword: '', configType: '', agreementType: '' });
    Object.assign(agreementQuery, agreementFilters);
    agreementPage.value = 1;
};
const selectAgreementConfigType = (type: AgreementConfigType) => {
    agreementForm.configType = type;
    if (type === 'productFile') {
        agreementForm.agreementType = productAgreementTypes.includes(agreementForm.agreementType) ? agreementForm.agreementType : '投保须知';
        agreementForm.contentType ||= 'text';
        agreementForm.sort ||= 1;
        return;
    }
    agreementForm.agreementType = formalAgreementTypes.includes(agreementForm.agreementType) ? agreementForm.agreementType : '用户服务协议';
};
const openAgreementDialog = (item?: AgreementConfigItem) => {
    const targetIndex = item ? form.agreements.indexOf(item) : -1;
    editingAgreementIndex.value = targetIndex;
    agreementDialogTitle.value = targetIndex >= 0 ? '编辑配置' : '新增配置';
    Object.assign(agreementForm, createEmptyAgreement(), item ? { ...item } : {});
    agreementDialogVisible.value = true;
};
const formatCurrentTime = () => {
    const date = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
const hasEditorContent = (content = '') =>
    content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, '')
        .trim().length > 0;
const saveAgreementConfig = () => {
    if (!agreementForm.name.trim() || !agreementForm.agreementType) {
        proxy?.$modal.msgWarning(agreementForm.configType === 'agreement' ? '请完整填写协议类型和协议标题' : '请完整填写协议名称和协议类型');
        return;
    }
    if (agreementForm.configType === 'agreement' && !hasEditorContent(agreementForm.content)) {
        proxy?.$modal.msgWarning('请填写协议内容');
        return;
    }
    if (agreementForm.configType === 'productFile') {
        if (agreementForm.contentType === 'text' && !hasEditorContent(agreementForm.content)) {
            proxy?.$modal.msgWarning('请填写文件内容');
            return;
        }
        if (agreementForm.contentType === 'link' && !agreementForm.link?.trim()) {
            proxy?.$modal.msgWarning('请输入链接地址');
            return;
        }
        if (agreementForm.contentType === 'attachment' && !agreementForm.fileName) {
            proxy?.$modal.msgWarning('请上传附件');
            return;
        }
    }
    const item = structuredClone({ ...agreementForm, updatedAt: formatCurrentTime() });
    if (editingAgreementIndex.value >= 0) form.agreements.splice(editingAgreementIndex.value, 1, item);
    else form.agreements.unshift({ ...item, id: Date.now() });
    agreementDialogVisible.value = false;
    agreementPage.value = 1;
    proxy?.$modal.msgSuccess(editingAgreementIndex.value >= 0 ? '配置更新成功' : '配置新增成功');
};
const deleteAgreement = (item: AgreementConfigItem) => {
    proxy?.$modal
        .confirm(`确认删除“${item.name}”吗？`)
        .then(() => {
            const index = form.agreements.indexOf(item);
            if (index >= 0) form.agreements.splice(index, 1);
            if (pagedAgreements.value.length === 0 && agreementPage.value > 1) agreementPage.value -= 1;
            proxy?.$modal.msgSuccess('删除成功');
        })
        .catch(() => undefined);
};
const handleAgreementFileChange = (uploadFile: UploadFile) => {
    if (uploadFile.raw && uploadFile.raw.size > 20 * 1024 * 1024) {
        proxy?.$modal.msgWarning('单个附件不能超过 20MB');
        return;
    }
    agreementForm.fileName = uploadFile.name;
};
const testAgreementLink = () => {
    try {
        const url = new URL(agreementForm.link || '');
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid protocol');
        proxy?.$modal.msgSuccess('链接格式有效');
    } catch {
        proxy?.$modal.msgWarning('请输入有效的 http:// 或 https:// 链接');
    }
};
const selectProduct = (index: number) => {
    productIndex.value = index;
    planIndex.value = 0;
};
const addProduct = () => {
    if (hasOrders.value) return;
    form.products.push({ name: `新产品${form.products.length + 1}`, type: '', companyId: undefined, required: false, plans: [] });
    selectProduct(form.products.length - 1);
};
const removeProduct = (index: number) => {
    if (hasOrders.value) return;
    form.products.splice(index, 1);
    productIndex.value = Math.max(0, Math.min(productIndex.value, form.products.length - 1));
    planIndex.value = 0;
};
const addPlan = () => {
    if (hasOrders.value || !currentProduct.value) return;
    currentProduct.value.plans.push({ name: `方案${currentProduct.value.plans.length + 1}`, premium: 0, description: '', protections: [] });
    planIndex.value = currentProduct.value.plans.length - 1;
};
const removePlan = (index: number) => {
    if (hasOrders.value || !currentProduct.value) return;
    currentProduct.value.plans.splice(index, 1);
    planIndex.value = Math.max(0, Math.min(planIndex.value, currentProduct.value.plans.length - 1));
};
const syncForceReadSort = () => {
    form.forceRead.forEach((item, index) => {
        item.sort = index + 1;
    });
};
const syncForceReadRule = () => {
    form.forceRead.forEach((item) => {
        if (item.important) return;
        item.requireScroll = form.forceReadRule.requireScroll;
        item.requireDuration = form.forceReadRule.requireDuration;
        item.seconds = form.forceReadRule.requireDuration ? form.forceReadRule.seconds : 0;
    });
};
watch(() => [form.forceReadRule.requireScroll, form.forceReadRule.requireDuration, form.forceReadRule.seconds], syncForceReadRule);
const moveForceRead = (index: number, offset: number) => {
    const targetIndex = index + offset;
    if (form.forceRead[index]?.important || targetIndex <= 0 || targetIndex >= form.forceRead.length) return;
    const [item] = form.forceRead.splice(index, 1);
    form.forceRead.splice(targetIndex, 0, item);
    syncForceReadSort();
};
const removeForceRead = (index: number) => {
    if (form.forceRead[index]?.important) return;
    form.forceRead.splice(index, 1);
    syncForceReadSort();
};
const addForceRead = () => {
    form.forceRead.push({
        title: '',
        content: '',
        seconds: form.forceReadRule.requireDuration ? form.forceReadRule.seconds : 0,
        enabled: true,
        requireScroll: form.forceReadRule.requireScroll,
        requireDuration: form.forceReadRule.requireDuration,
        sort: form.forceRead.length + 1,
        important: false
    });
};
const createImportantForceRead = (): ForceReadItem => ({
    title: '重要提示',
    content:
        '<p>1. 本产品由诚安达保险销售服务股份有限公司销售，承保公司以具体方案为准。</p><p>2. 投保前请仔细阅读保险条款，特别是责任免除部分。</p><p>3. 本产品保障期间为一年，到期后可续保。</p><p>4. 如有疑问，请拨打客服电话咨询。</p>',
    seconds: 0,
    enabled: true,
    requireScroll: false,
    requireDuration: false,
    sort: 1,
    important: true
});
const forceReadStatusText = (item: ForceReadItem) => {
    if (item.important) return item.enabled ? '展示' : '隐藏';
    return item.enabled ? '启用' : '停用';
};
const validateFieldsConfig = () => {
    if (!form.fieldGroups.length) return '请至少添加一个字段分类';
    const invalidGroup = form.fieldGroups.findIndex((group) => !group.name.trim() || !group.fields.length);
    if (invalidGroup >= 0) return `请完善第 ${invalidGroup + 1} 个字段分类的名称并至少添加一个字段`;
    for (let groupIndex = 0; groupIndex < form.fieldGroups.length; groupIndex += 1) {
        const group = form.fieldGroups[groupIndex];
        const invalidField = group.fields.findIndex((field) => !field.name.trim() || !field.type || !field.placeholder.trim());
        if (invalidField >= 0) return `请完善“${group.name}”中的第 ${invalidField + 1} 个字段`;
        const invalidOptions = group.fields.findIndex((field) => ['单选', '多选'].includes(field.type) && !field.options?.length);
        if (invalidOptions >= 0) return `请为“${group.fields[invalidOptions].name}”配置选项值`;
    }
    return '';
};
const validatePlanConfig = () => {
    if (!form.name || !form.code || !form.businessUnit) return '请完整填写产品名称、产品编码和业务归属';
    if (!form.products.length) return '请至少添加一个产品';
    if (!form.products.some((product) => product.required)) return '请至少将一个产品设置为必选';
    const invalidProductIndex = form.products.findIndex((product) => !product.name || !product.type || !product.companyId);
    if (invalidProductIndex >= 0) {
        selectProduct(invalidProductIndex);
        return `请完整填写第 ${invalidProductIndex + 1} 个产品的信息`;
    }
    const emptyPlanProductIndex = form.products.findIndex((product) => !product.plans.length);
    if (emptyPlanProductIndex >= 0) {
        selectProduct(emptyPlanProductIndex);
        return `请为第 ${emptyPlanProductIndex + 1} 个产品至少添加一个方案`;
    }
    for (let productOffset = 0; productOffset < form.products.length; productOffset += 1) {
        const invalidPlanIndex = form.products[productOffset].plans.findIndex((plan) => !plan.name);
        if (invalidPlanIndex >= 0) {
            selectProduct(productOffset);
            planIndex.value = invalidPlanIndex;
            return `请填写第 ${productOffset + 1} 个产品的方案名称`;
        }
    }
    return '';
};
const save = async (draft: boolean) => {
    const message = hasOrders.value
        ? ''
        : draft
          ? !form.name || !form.code || !form.businessUnit
              ? '请完整填写产品名称、产品编码和业务归属'
              : ''
          : activeTab.value === 'plan'
            ? validatePlanConfig()
            : activeTab.value === 'fields'
              ? validateFieldsConfig()
              : '';
    if (message) {
        proxy?.$modal.msgWarning(message);
        if (activeTab.value !== 'fields') activeTab.value = 'plan';
        return;
    }
    saving.value = true;
    try {
        form.productId = await saveProductConfig(form);
        proxy?.$modal.msgSuccess(draft ? '临时保存成功' : '配置保存成功');
        if (!draft && activeTab.value === 'plan') router.push('/product/list');
    } finally {
        saving.value = false;
    }
};

onMounted(async () => {
    companyLoading.value = true;
    try {
        const result = await listInsuranceCompany({ pageNum: 1, pageSize: 100, companyName: '', status: '0' });
        companyOptions.value = result.rows;
    } finally {
        companyLoading.value = false;
    }
    const sourceId = route.query.copy ? Number(route.query.copy) : route.params.id ? Number(route.params.id) : undefined;
    Object.assign(form, await getProductConfig(sourceId));
    form.agreements = form.agreements.map((item, index) => {
        const configType = item.configType || 'productFile';
        const contentType = item.contentType || (item.url ? 'link' : 'attachment');
        return {
            ...item,
            id: item.id ?? index + 1,
            configType,
            name: item.name || '',
            agreementType: item.agreementType || (configType === 'agreement' ? '用户服务协议' : '产品条款'),
            contentType: configType === 'productFile' ? contentType : undefined,
            content: item.content || '',
            link: item.link || item.url || '',
            fileName: item.fileName || '',
            enabled: item.enabled ?? true,
            sort: configType === 'productFile' ? (item.sort ?? index + 1) : undefined,
            updatedAt: item.updatedAt || ''
        };
    });
    if (!form.forceRead[0]?.important) form.forceRead.unshift(createImportantForceRead());
    if (!form.forceReadRule) {
        const legacyRule = form.forceRead.find((item) => !item.important);
        form.forceReadRule = {
            requireScroll: legacyRule?.requireScroll ?? legacyRule?.readMode !== 'duration',
            requireDuration: legacyRule?.requireDuration ?? legacyRule?.readMode === 'duration',
            seconds: legacyRule?.seconds || 10
        };
    }
    form.forceRead.forEach((item, index) => {
        item.important = index === 0;
        item.sort = index + 1;
        if (item.important) {
            item.requireScroll = false;
            item.requireDuration = false;
            return;
        }
        if (typeof item.requireScroll !== 'boolean' && typeof item.requireDuration !== 'boolean') {
            item.requireScroll = item.readMode !== 'duration';
            item.requireDuration = item.readMode === 'duration';
        }
        item.requireScroll ??= true;
        item.requireDuration ??= false;
        if (!item.requireScroll && !item.requireDuration) item.requireScroll = true;
    });
    if (!form.forceReadRule.requireScroll && !form.forceReadRule.requireDuration) form.forceReadRule.requireScroll = true;
    if (form.forceReadRule.seconds < 1) form.forceReadRule.seconds = 10;
    syncForceReadRule();
    if (isCopy.value) {
        form.productId = undefined;
        form.hasOrders = false;
        form.code = '';
        form.businessUnit = '';
    }
});
</script>

<style scoped lang="scss">
.config-page {
    min-height: calc(100vh - 84px);
    padding: 16px 20px 28px;
    background: #f3f5f8;
}
.config-shell {
    max-width: 1180px;
    margin: 0 auto;
    background: #fff;
}
.config-header {
    padding: 22px 30px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border-bottom: 1px solid #ebeef5;
}
.config-title {
    font-size: 18px;
    font-weight: 600;
    color: #222;
}
.config-title .el-tag {
    margin-left: 8px;
}
.config-subtitle {
    margin-top: 7px;
    color: #9a9a9a;
    font-size: 13px;
}
.config-nav {
    height: 56px;
    padding-left: 20px;
    display: flex;
    align-items: flex-end;
    background: #fafafa;
    border-bottom: 1px solid #e8ebf0;
}
.config-nav button {
    height: 46px;
    padding: 0 28px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #606266;
    cursor: pointer;
    font-weight: 500;
}
.config-nav button.active {
    color: #28aef0;
    border-bottom-color: #28aef0;
    background: #fff;
}
.config-body {
    padding: 24px 30px 10px;
}
.plan-content,
.normal-section {
    min-height: 650px;
}
.order-lock-tip {
    margin-bottom: 18px;
}
.section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 18px;
}
.blue-title {
    color: #268fcc;
}
.basic-card,
.scheme-card {
    padding: 20px 22px 8px;
    border: 1px solid #8fd6f7;
    border-radius: 8px;
    background: #edf9ff;
}
.basic-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 34px;
}
.basic-grid :deep(.el-form-item:nth-child(3)) {
    grid-column: 1/2;
}
.basic-grid :deep(.el-select),
.product-info-grid :deep(.el-select) {
    width: 100%;
}
.block-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e5f3fa;
    color: #208ac5;
}
.block-title span,
.table-title span {
    font-size: 12px;
    color: #aaa;
}
.horizontal-tabs {
    display: flex;
    align-items: center;
    min-height: 48px;
    padding: 0 14px;
    background: #fafafa;
    border-bottom: 1px solid #dfeaf0;
}
.horizontal-tabs button {
    height: 48px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #555;
    cursor: pointer;
}
.horizontal-tabs button.active {
    color: #159fe6;
    border-bottom-color: #29b5f4;
    font-weight: 600;
}
.number-dot {
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #b9e5f9;
    color: #168fc8;
    font-size: 12px;
}
.horizontal-tabs button.active .number-dot {
    background: #2bb5f3;
    color: #fff;
}
.horizontal-tabs .add-tab {
    color: #20a8e9;
}
.horizontal-tabs .dashed {
    height: 36px;
    margin-left: 8px;
    border: 1px dashed #25aff0;
}
.product-tabs {
    margin-top: 20px;
}
.product-info-grid {
    display: grid;
    grid-template-columns: 1.2fr 1.1fr 1.2fr 0.7fr;
    gap: 0 30px;
}
.scheme-tabs {
    margin: 2px 0 18px;
    padding-left: 0;
    background: transparent;
    border: 0;
}
.scheme-tabs button {
    height: 40px;
    background: #fafafa;
}
.scheme-tabs button.active {
    background: #25b1ef;
    color: #fff;
}
.scheme-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    margin-bottom: 22px;
}
.scheme-card label {
    font-size: 13px;
}
.scheme-card .el-input {
    width: 180px;
}
.scheme-card .el-input-number {
    width: 140px;
}
.unit {
    color: #909399;
}
.table-title,
.section-head,
.group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.table-title {
    margin: 6px 0 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e7f2f7;
    color: #218dc8;
}
.table-title b {
    margin-right: 12px;
}
.detail-title {
    margin-top: 24px;
}
.normal-section {
    max-width: 1120px;
}
.customer-service-title {
    margin-top: 24px;
}
.customer-service-grid {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr) minmax(280px, 2fr);
    gap: 0 16px;
}
.tip {
    margin: -10px 0 18px;
    color: #909399;
}
.tip.blue {
    margin: 0 0 20px;
    padding: 12px 16px;
    background: #ecf5ff;
    color: #409eff;
    border-radius: 3px;
}
.read-tip {
    margin-bottom: 18px;
}
.read-rule-card {
    margin-bottom: 18px;
    padding: 18px 20px;
    border: 1px solid #a9dcf4;
    border-radius: 8px;
    background: #f2faff;
}
.read-rule-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}
.read-rule-heading h3 {
    margin: 0 0 6px;
    color: #238ec6;
    font-size: 15px;
}
.read-rule-heading p,
.read-rule-summary {
    margin: 0;
    color: #7b8793;
    font-size: 13px;
    line-height: 1.6;
}
.global-read-mode {
    margin-top: 16px;
    padding: 14px 16px;
    border-radius: 6px;
    background: #fff;
}
.read-rule-summary {
    margin-top: 10px;
    color: #409eff;
}
.read-card {
    margin-bottom: 16px;
    overflow: hidden;
    border-color: #e4e9f0;
    border-radius: 8px;
}
.read-card :deep(.el-card__header) {
    padding: 0;
    background: #f7f9fc;
    border-bottom-color: #edf0f4;
}
.read-card :deep(.el-card__body) {
    padding: 20px 22px 6px;
}
.read-card.is-important {
    border-color: #f2dada;
}
.read-card.is-important :deep(.el-card__header) {
    background: #fff6f6;
}
.read-card-header,
.read-card-name,
.read-card-actions,
.read-switch,
.duration-option {
    display: flex;
    align-items: center;
}
.read-card-header {
    min-height: 50px;
    padding: 0 18px;
    justify-content: space-between;
    gap: 16px;
}
.read-card-name {
    min-width: 0;
    gap: 10px;
    color: #258dcc;
}
.read-card-name b {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.is-important .read-card-name {
    color: #df5757;
}
.read-index {
    width: 26px;
    height: 26px;
    flex: 0 0 26px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #59b9e7;
    color: #fff;
    font-size: 13px;
}
.is-important .read-index {
    background: #e86464;
}
.read-card-actions {
    flex: 0 0 auto;
    gap: 2px;
}
.read-card-actions .el-button + .el-button {
    margin-left: 4px;
}
.read-content-item :deep(.el-form-item__content) {
    width: 100%;
    display: block;
}
.read-settings-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0 24px;
}
.read-mode-item {
    grid-column: 1 / -1;
}
.read-mode-group {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 22px;
}
.read-mode-group .el-checkbox {
    margin-right: 0;
}
.read-mode-static {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #606266;
}
.read-mode-dot {
    width: 14px;
    height: 14px;
    display: inline-block;
    border: 4px solid #e86464;
    border-radius: 50%;
}
.duration-option {
    gap: 8px;
}
.duration-option .el-input-number {
    width: 86px;
}
.read-sort-item :deep(.el-input-number) {
    width: 100%;
}
.read-switch {
    gap: 8px;
    color: #606266;
}
.add-read-card {
    width: 100%;
    min-height: 108px;
    margin-bottom: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: 1px dashed #9ed9f5;
    border-radius: 8px;
    background: #fbfdff;
    color: #36a9df;
    cursor: pointer;
}
.add-read-card:hover {
    border-color: #36a9df;
    background: #f4fbff;
}
.add-read-icon {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #e5f5fd;
    font-size: 20px;
}
.add-read-card small {
    color: #a7adb4;
}
.agreement-heading {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
}
.agreement-heading .section-title {
    margin-bottom: 6px;
    font-size: 18px;
}
.agreement-heading p {
    margin: 0;
    color: #909399;
    font-size: 13px;
}
.agreement-toolbar {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 160px 170px auto auto;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
    padding: 16px;
    border: 1px solid #e7edf3;
    border-radius: 8px;
    background: #f8fafc;
}
.agreement-toolbar :deep(.el-select) {
    width: 100%;
}
.agreement-query-actions {
    display: flex;
    align-items: center;
}
.agreement-add-button {
    justify-self: end;
}
.agreement-table-wrap {
    width: 100%;
    overflow-x: auto;
    border-radius: 8px;
}
.agreement-table-wrap :deep(.el-table) {
    min-width: 1110px;
}
.agreement-table-wrap :deep(.el-table__header th) {
    height: 46px;
    background: #f6f8fb;
    color: #4d5967;
}
.agreement-status,
.agreement-switch {
    display: inline-flex;
    align-items: center;
    gap: 7px;
}
.agreement-status {
    color: #2f9b67;
}
.agreement-status.disabled {
    color: #909399;
}
.agreement-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
}
.agreement-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 18px;
    color: #909399;
    font-size: 13px;
}
.agreement-dialog-body {
    min-width: 0;
}
.config-type-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 22px;
}
.config-type-card {
    min-height: 126px;
    padding: 16px;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 6px 12px;
    text-align: left;
    border: 1px solid #dfe6ee;
    border-radius: 9px;
    background: #fff;
    color: #303133;
    cursor: pointer;
    transition:
        border-color 0.2s,
        background-color 0.2s;
}
.config-type-card:hover,
.config-type-card.active {
    border-color: #32ade6;
    background: #f2fbff;
}
.config-type-card.active {
    box-shadow: inset 0 0 0 1px #32ade6;
}
.config-type-icon {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    grid-row: 1 / 3;
    border-radius: 10px;
    background: #e7f6fd;
    color: #239dd5;
    font-weight: 700;
}
.config-type-card span:nth-child(2) {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.config-type-card small {
    color: #788493;
    line-height: 1.4;
}
.config-type-card i {
    grid-column: 2;
    color: #a0a8b2;
    font-size: 12px;
    font-style: normal;
}
.agreement-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 18px;
}
.agreement-form :deep(.el-select),
.agreement-form :deep(.el-input-number) {
    width: 100%;
}
.content-type-options {
    display: grid;
    grid-template-columns: repeat(3, minmax(96px, 1fr));
}
.content-type-options :deep(.el-radio-button__inner) {
    width: 100%;
}
.agreement-editor-item :deep(.el-form-item__content) {
    width: 100%;
    display: block;
}
.agreement-link-input {
    width: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
}
.agreement-upload,
.agreement-upload :deep(.el-upload),
.agreement-upload :deep(.el-upload-dragger) {
    width: 100%;
}
.agreement-upload :deep(.el-upload-dragger) {
    min-height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    border-color: #cbd7e2;
    background: #fafcfe;
}
.upload-symbol {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #e7f6fd;
    color: #249fd8;
    font-size: 24px;
}
.upload-copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
}
.upload-copy small,
.field-tip {
    color: #9aa3ad;
    font-size: 12px;
}
.agreement-meta-grid .agreement-remark-item {
    grid-column: 1 / -1;
}
.agreement-switch {
    min-height: 32px;
    color: #606266;
}
.formal-agreement-grid {
    align-items: start;
}
.field-tip {
    display: block;
    margin-top: 6px;
    line-height: 1.4;
}
.config-footer {
    padding: 18px 30px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #ebeef5;
    background: #fff;
}
@media (max-width: 767px) {
    .config-page {
        padding: 10px;
    }
    .config-nav {
        overflow-x: auto;
        padding-left: 0;
    }
    .config-nav button {
        white-space: nowrap;
        padding: 0 13px;
    }
    .config-body {
        padding: 18px 16px;
    }
    .basic-grid,
    .product-info-grid,
    .customer-service-grid {
        grid-template-columns: 1fr;
    }
    .basic-grid :deep(.el-form-item:nth-child(3)) {
        grid-column: auto;
    }
    .scheme-card {
        align-items: flex-start;
        flex-wrap: wrap;
    }
    .read-card-header {
        align-items: flex-start;
        flex-direction: column;
        padding: 12px 14px;
    }
    .read-card-actions {
        width: 100%;
        justify-content: flex-end;
    }
    .read-card :deep(.el-card__body) {
        padding: 16px 14px 2px;
    }
    .read-settings-grid {
        grid-template-columns: 1fr;
    }
    .read-mode-item {
        grid-column: auto;
    }
    .read-rule-heading {
        align-items: flex-start;
        flex-direction: column;
    }
    .global-read-mode {
        align-items: flex-start;
        flex-direction: column;
    }
    .agreement-toolbar {
        grid-template-columns: 1fr;
    }
    .agreement-query-actions,
    .agreement-add-button {
        width: 100%;
    }
    .agreement-query-actions .el-button,
    .agreement-add-button {
        flex: 1;
    }
    .config-type-grid,
    .agreement-form-grid {
        grid-template-columns: 1fr;
    }
    .agreement-meta-grid .agreement-remark-item {
        grid-column: auto;
    }
    .agreement-link-input {
        grid-template-columns: 1fr;
    }
    .agreement-pagination {
        align-items: flex-start;
        flex-direction: column;
    }
    .content-type-options {
        width: 100%;
    }
}
</style>
