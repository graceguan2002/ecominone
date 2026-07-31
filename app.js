/* ============== 集成管理系统 · 交互脚本 ============== */
(function () {
    'use strict';

    const STORAGE_KEY = 'integrated-system-config-v2';
    const API_BASE = '/api/config';

    // ---------- 默认配置 ----------
    // url 支持站内（page.html#hash）和站外（https://...）
    // desc 与卡片正文外显文字完全一致（点开铅笔后的预填内容）
    // list 数组：每项是卡片正文的一条要点（点开铅笔后预填，一行一条）
    const DEFAULT_CONFIG = {
        // 第1层：管理板块
        'mgmt-servicer': {
            url: 'https://lexiang.tencent.com/',
            desc: '建立清晰的服务商库，包含全量服务商的能力识别标签，是行渠联动的「人」与「业务」底座。',
            list: []
        },
        'mgmt-sab': {
            url: '',
            desc: '在服务商库基础上，建立 SAB 等级评定，人和业务的隐性管理机制。',
            list: []
        },
        'mgmt-partner': {
            url: '',
            desc: '合伙人体系作为业务协作的隐性管理机制之一，与 SAB 互补。',
            list: []
        },
        'mgmt-risk': {
            url: '',
            desc: '风控模块暂不着急，列为 P3 优先级，后续按需搭建。',
            list: []
        },
        'mgmt-performance': {
            url: '',
            desc: '围绕 业绩完成度、预估、授信、政策 等维度进行统一管理与跟踪。',
            list: []
        },

        // 第2层：行渠业务板块
        'biz-linkage': {
            url: '',
            desc: '包括有效拓客和有效运营，目标：提升服务商孵化成功率。',
            list: [
                '行业战队：由战队群和各类会议组成',
                '拓客 → 有效拓客',
                '运营 → 有效运营 → 成功行业案例',
                '拉通机制 → 主动识别更多服务商推送到战队'
            ]
        },
        'biz-unit': {
            url: '',
            desc: '重点关注 P0 可复制，同时发现 & 验证 P1、P2 机会。',
            list: [
                '复制：复制行业子类目',
                '发现：主动识别可复制机会',
                '验证：P0 / P1 / P2 验证路径'
            ]
        },
        'biz-track': {
            url: '',
            desc: '通过 Hunter + 提报机制 发现新机会，并跟进验证。',
            list: [
                '① Hunter + 提报 发现新垂类机会',
                '② 跟进、验证小赛道机会是否有意义',
                '③ 研究是否可以有机会复制'
            ]
        },

        // 第3层：底座
        'base-k-internal': {
            url: 'https://lexiang.tencent.com/',
            desc: '管理 / 行业 / 项目执行中沉淀的 SOP、方案。',
            list: []
        },
        'base-k-industry': {
            url: '',
            desc: '各行业动态、趋势、玩家图谱与最佳实践。',
            list: []
        },
        'base-k-mgmt': {
            url: '',
            desc: '管理方法论、SAB 规则、流程制度的更新记录。',
            list: []
        },
        'base-k-product': {
            url: '',
            desc: '产品迭代、平台能力、工具版本等更新汇总。',
            list: []
        },
        'base-t-lexiang': {
            url: 'https://lexiang.tencent.com/',
            desc: '腾讯乐享，知识沉淀主阵地。',
            list: []
        },
        'base-t-bbx': {
            url: '',
            desc: 'Excel 底层工具，用于数据处理与底表沉淀。',
            list: []
        },
        'base-t-mail': {
            url: '',
            desc: '邮件组，作为信息通知通路之一。',
            list: []
        },
        'base-t-group': {
            url: '',
            desc: '企业微信群、战队群等即时沟通群组。',
            list: []
        },
        'base-t-emei': {
            url: '',
            desc: '鹅妹（智能助手），用于内部咨询与知识问答。',
            list: []
        },
        'base-t-platform': {
            url: '',
            desc: '渠道业务一站式工作台，整合管理、运营、数据能力。',
            list: []
        },
        'base-o-design': {
            url: '',
            desc: '整体系统设计、模块架构与信息流转路径。',
            list: []
        },
        'base-o-owner': {
            url: '',
            desc: '明确每个模块的负责人，搭建与运营由负责人主导，gracejzguan 指导。',
            list: []
        },
        'base-o-build': {
            url: '',
            desc: '由各模块负责人 Coding 搭建系统，gracejzguan 指导。',
            list: []
        },
        'base-o-run': {
            url: '',
            desc: '系统日常运营与维护，含信息发布、用户答疑。',
            list: []
        },
        'base-o-feedback': {
            url: '',
            desc: '信息交互回收与持续优化闭环。',
            list: []
        }
    };

    // ---------- 云端 API 状态 ----------
    let cloudAvailable = null; // null=未检测, true=可用, false=不可用

    function getDefaultConfig() {
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }

    function mergeWithDefaults(parsed) {
        const merged = {};
        Object.keys(DEFAULT_CONFIG).forEach(function (id) {
            merged[id] = Object.assign({}, DEFAULT_CONFIG[id], parsed[id] || {});
        });
        return merged;
    }

    // ---------- 云端 API 调用 ----------
    async function fetchCloudConfig() {
        try {
            const resp = await fetch(API_BASE, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();
            if (data.success && data.config) {
                cloudAvailable = true;
                return mergeWithDefaults(data.config);
            }
            if (data.fallback) {
                // 云端不可用但返回了默认配置
                cloudAvailable = false;
                return data.config;
            }
            throw new Error(data.error || '未知错误');
        } catch (e) {
            console.warn('[云端] 读取失败，降级到本地:', e.message);
            cloudAvailable = false;
            return null;
        }
    }

    async function saveCloudConfig(config) {
        try {
            const resp = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: config })
            });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();
            if (data.success) {
                cloudAvailable = true;
                return true;
            }
            throw new Error(data.error || '保存失败');
        } catch (e) {
            console.warn('[云端] 保存失败，降级到本地:', e.message);
            cloudAvailable = false;
            return false;
        }
    }

    async function deleteCloudConfig() {
        try {
            const resp = await fetch(API_BASE, { method: 'DELETE' });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();
            cloudAvailable = data.success;
            return data.success;
        } catch (e) {
            console.warn('[云端] 删除失败:', e.message);
            cloudAvailable = false;
            return false;
        }
    }

    // ---------- 配置读写（云端优先 + 本地降级） ----------
    async function loadConfigAsync() {
        // 1. 优先从云端加载
        const cloudConfig = await fetchCloudConfig();
        if (cloudConfig) {
            // 同步到本地作为备份
            saveLocalConfig(cloudConfig);
            return cloudConfig;
        }
        // 2. 云端不可用，从本地加载
        return loadLocalConfig();
    }

    // 同步版本（初始化时用，返回 Promise）
    function loadConfig() {
        return loadConfigAsync();
    }

    async function saveConfigAsync(config) {
        // 同时写入云端和本地
        const cloudOk = await saveCloudConfig(config);
        const localOk = saveLocalConfig(config);
        return cloudOk || localOk;
    }

    function saveConfig(config) {
        return saveConfigAsync(config);
    }

    async function resetConfigAsync() {
        const fresh = getDefaultConfig();
        // 删除云端数据
        await deleteCloudConfig();
        // 清除本地数据
        localStorage.removeItem(STORAGE_KEY);
        return fresh;
    }

    function resetConfig() {
        return resetConfigAsync();
    }

    // ---------- 本地存储（降级备份） ----------
    function loadLocalConfig() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return mergeWithDefaults(parsed);
            }
        } catch (e) {
            console.warn('本地配置读取失败', e);
        }
        return getDefaultConfig();
    }

    function saveLocalConfig(config) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            return true;
        } catch (e) {
            console.error('本地配置保存失败', e);
            return false;
        }
    }

    // ---------- 渲染卡片内容（从 config 同步到 DOM） ----------
    function renderCard(card, item) {
        const id = card.dataset.id;
        const isMini = card.classList.contains('mini-card');

        // 1. 描述文字
        if (isMini) {
            const descEl = card.querySelector('.mini-desc');
            if (descEl && item.desc !== undefined) {
                descEl.textContent = item.desc || '';
            }
        } else {
            const descEl = card.querySelector('.card-desc');
            if (descEl && item.desc !== undefined) {
                descEl.textContent = item.desc || '';
            }
            // 2. 列表
            const listEl = card.querySelector('.card-list');
            if (listEl && item.list !== undefined) {
                listEl.innerHTML = '';
                (item.list || []).forEach(function (line) {
                    if (!line || !line.trim()) return;
                    const li = document.createElement('li');
                    li.textContent = line;
                    listEl.appendChild(li);
                });
            }
        }

        // 3. 链接标记
        if (item.url) {
            card.classList.add('has-link');
        } else {
            card.classList.remove('has-link');
        }
    }

    function applyAll(config) {
        document.querySelectorAll('[data-id]').forEach(function (el) {
            const id = el.dataset.id;
            const item = config[id];
            if (item) renderCard(el, item);
        });
    }

    // ---------- 跳转逻辑（站内 vs 站外） ----------
    function navigateTo(url) {
        if (!url) return false;
        // 站内跳转：相对路径（不含 http） 或 .html
        const isExternal = /^https?:\/\//i.test(url);
        if (isExternal) {
            window.open(url, '_blank', 'noopener');
        } else {
            // 站内：当前页直接跳转
            window.location.href = url;
        }
        return true;
    }

    // ---------- 卡片点击 ----------
    document.addEventListener('click', async function (e) {
        // 编辑按钮：阻止冒泡，打开弹窗
        if (e.target.closest('.edit-btn')) {
            e.stopPropagation();
            e.preventDefault();
            const card = e.target.closest('[data-id]');
            if (card) openEditModal(card);
            return;
        }

        // 卡片本身点击：跳转
        const card = e.target.closest('[data-id]');
        if (card) {
            const id = card.dataset.id;
            const config = await loadConfig();
            const item = config[id];
            if (item && item.url) {
                navigateTo(item.url);
                showToast('正在打开：' + (card.dataset.platform || id));
            } else {
                openEditModal(card);
                showToast('该板块尚未配置链接，请先编辑', 2000);
            }
        }
    });

    // ---------- 编辑弹窗 ----------
    const editModal = document.getElementById('editModal');
    const helpModal = document.getElementById('helpModal');
    let editingCard = null;

    async function openEditModal(card) {
        editingCard = card;
        const id = card.dataset.id;
        const config = await loadConfig();
        const item = config[id] || { url: '', desc: '', list: [] };

        document.getElementById('cardName').value = card.dataset.platform || id;
        document.getElementById('cardUrl').value = item.url || '';
        document.getElementById('cardDesc').value = item.desc || '';
        document.getElementById('cardList').value = (item.list || []).join('\n');

        // 小卡片不显示列表编辑
        const listRow = document.getElementById('listRow');
        if (listRow) {
            listRow.style.display = card.classList.contains('mini-card') ? 'none' : 'block';
        }

        editModal.classList.add('active');
        setTimeout(function () {
            document.getElementById('cardUrl').focus();
        }, 100);
    }

    function closeEditModal() {
        editModal.classList.remove('active');
        editingCard = null;
    }

    async function saveEdit() {
        if (!editingCard) return;
        const id = editingCard.dataset.id;
        const url = document.getElementById('cardUrl').value.trim();
        const desc = document.getElementById('cardDesc').value.trim();
        const listText = document.getElementById('cardList').value;

        if (url && !/^(https?:\/\/|\.|\/|[\w-]+\.html)/i.test(url)) {
            showToast('请输入正确链接：https://... 或 站内 page.html', 2500);
            return;
        }

        const list = listText
            .split('\n')
            .map(function (s) { return s.trim(); })
            .filter(function (s) { return s.length > 0; });

        const config = await loadConfig();
        config[id] = { url: url, desc: desc, list: list };
        await saveConfig(config);
        renderCard(editingCard, config[id]);
        closeEditModal();
        showToast('已保存到云端：' + editingCard.dataset.platform);
    }

    async function clearEdit() {
        if (!editingCard) return;
        const id = editingCard.dataset.id;
        const config = await loadConfig();
        config[id] = { url: '', desc: '', list: [] };
        await saveConfig(config);
        renderCard(editingCard, config[id]);
        closeEditModal();
        showToast('已清空该板块的配置');
    }

    document.getElementById('modalClose').addEventListener('click', closeEditModal);
    document.getElementById('modalSave').addEventListener('click', saveEdit);
    document.getElementById('modalClear').addEventListener('click', clearEdit);
    editModal.querySelector('.modal-mask').addEventListener('click', closeEditModal);

    document.getElementById('cardUrl').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') saveEdit();
    });

    // ---------- 帮助弹窗 ----------
    document.getElementById('helpBtn').addEventListener('click', function () {
        helpModal.classList.add('active');
    });
    document.getElementById('helpClose').addEventListener('click', function () {
        helpModal.classList.remove('active');
    });
    document.getElementById('helpOk').addEventListener('click', function () {
        helpModal.classList.remove('active');
    });
    helpModal.querySelector('.modal-mask').addEventListener('click', function () {
        helpModal.classList.remove('active');
    });

    // ---------- 重置 ----------
    document.getElementById('resetBtn').addEventListener('click', async function () {
        if (confirm('确定要恢复所有板块的默认配置吗？\n（这将清空云端和本地所有链接与说明）')) {
            const fresh = await resetConfig();
            applyAll(fresh);
            showToast('已重置为默认配置（云端+本地均已清除）');
        }
    });

    // ---------- 导出 ----------
    document.getElementById('exportBtn').addEventListener('click', async function () {
        const config = await loadConfig();
        const data = {
            exportedAt: new Date().toISOString(),
            version: '3.0',
            config: config
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.href = url;
        a.download = 'integrated-system-config-' + ts + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('配置已导出');
    });

    // ---------- Toast ----------
    let toastTimer = null;
    function showToast(message, duration) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('show');
        }, duration || 1800);
    }

    // ---------- ESC 关闭弹窗 ----------
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (editModal.classList.contains('active')) closeEditModal();
            if (helpModal.classList.contains('active')) helpModal.classList.remove('active');
        }
    });

    // ---------- 初始化 ----------
    (async function init() {
        const config = await loadConfig();
        applyAll(config);
        console.log('[集成管理系统] 框架初始化完成，共 ' + document.querySelectorAll('[data-id]').length + ' 个板块');
        if (cloudAvailable) {
            console.log('[集成管理系统] ☁️ 云端存储已连接');
        } else {
            console.log('[集成管理系统] 💾 使用本地存储（云端不可用）');
        }
    })();
})();
