/* ============== 集成管理系统 · 交互脚本 ============== */
(function () {
    'use strict';

    const STORAGE_KEY = 'integrated-system-config-v4';
    const API_BASE = '/api/config';

    // ---------- 默认配置 ----------
    // links: [{title, url}] — 模块下的子链接列表，点击模块展开
    // desc: 卡片外显说明文字
    // list: 卡片要点列表
    const DEFAULT_CONFIG = {
        // 第1层：管理板块
        'mgmt-servicer': {
            links: [],
            desc: '建立清晰的服务商库，包含全量服务商的能力识别标签，是行渠联动的「人」与「业务」底座。',
            list: []
        },
        'mgmt-sab': {
            links: [],
            desc: '在服务商库基础上，建立 SAB 等级评定，人和业务的隐性管理机制。',
            list: []
        },
        'mgmt-partner': {
            links: [],
            desc: '合伙人体系作为业务协作的隐性管理机制之一，与 SAB 互补。',
            list: []
        },
        'mgmt-risk': {
            links: [],
            desc: '外循环链路持续监控',
            list: []
        },
        'mgmt-performance': {
            links: [],
            desc: '围绕 业绩完成度、预估、授信、政策 等维度进行统一管理与跟踪。',
            list: []
        },

        // 第2层：行渠业务板块
        'biz-linkage': {
            links: [],
            desc: '包括有效拓客和有效运营，目标：提升服务商孵化成功率。',
            list: [
                '行业战队：由战队群和各类会议组成',
                '拓客 → 有效拓客',
                '运营 → 有效运营 → 成功行业案例',
                '拉通机制 → 主动识别更多服务商推送到战队'
            ]
        },
        'biz-unit': {
            links: [],
            desc: '重点关注 P0 可复制，同时发现 & 验证 P1、P2 机会。',
            list: [
                '复制：复制行业子类目',
                '发现：主动识别可复制机会',
                '验证：P0 / P1 / P2 验证路径'
            ]
        },
        'biz-track': {
            links: [],
            desc: '通过 Hunter + 提报机制 发现新机会，并跟进验证。',
            list: [
                'Hunter + 提报 发现新垂类机会',
                '跟进、验证小赛道机会是否有意义',
                '研究是否可以有机会复制'
            ]
        },

        // 第3层：底座
        'base-k-internal': {
            links: [],
            desc: '管理 / 行业 / 项目执行中沉淀的 SOP、方案。',
            list: []
        },
        'base-k-industry': {
            links: [],
            desc: '各行业动态、趋势、玩家图谱与最佳实践。',
            list: []
        },
        'base-k-mgmt': {
            links: [],
            desc: '管理方法论、SAB 规则、流程制度的更新记录。',
            list: []
        },
        'base-k-product': {
            links: [],
            desc: '产品迭代、平台能力、工具版本等更新汇总。',
            list: []
        },
        'base-t-lexiang': {
            links: [],
            desc: '腾讯乐享，知识沉淀主阵地。',
            list: []
        },
        'base-t-bbx': {
            links: [],
            desc: 'Excel 底层工具，用于数据处理与底表沉淀。',
            list: []
        },
        'base-t-mail': {
            links: [],
            desc: '邮件组，作为信息通知通路之一。',
            list: []
        },
        'base-t-group': {
            links: [],
            desc: '企业微信群、战队群等即时沟通群组。',
            list: []
        },
        'base-t-emei': {
            links: [],
            desc: '鹅妹（智能助手），用于内部咨询与知识问答。',
            list: []
        },
        'base-t-platform': {
            links: [],
            desc: '渠道业务一站式工作台，整合管理、运营、数据能力。',
            list: []
        },
        'base-o-design': {
            links: [],
            desc: '整体系统设计、模块架构与信息流转路径。',
            list: []
        },
        'base-o-owner': {
            links: [],
            desc: '明确每个模块的负责人，搭建与运营由负责人主导，gracejzguan 指导。',
            list: []
        },
        'base-o-build': {
            links: [],
            desc: '由各模块负责人 Coding 搭建系统，gracejzguan 指导。',
            list: []
        },
        'base-o-run': {
            links: [],
            desc: '系统日常运营与维护，含信息发布、用户答疑。',
            list: []
        },
        'base-o-feedback': {
            links: [],
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
            var item = parsed[id] || {};
            // 兼容旧版 url 字段 → 转为 links 数组
            if (item.url !== undefined && !item.links) {
                item.links = item.url ? [{ title: '', url: item.url }] : [];
            }
            if (!item.links) item.links = [];
            merged[id] = Object.assign({}, DEFAULT_CONFIG[id], item);
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
            throw new Error(data.error || '未知错误');
        } catch (e) {
            console.error('[云端] 读取失败:', e.message);
            cloudAvailable = false;
            return getDefaultConfig();
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
            console.error('[云端] 保存失败:', e.message);
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
            console.error('[云端] 删除失败:', e.message);
            cloudAvailable = false;
            return false;
        }
    }

    // ---------- 配置读写（纯云端模式） ----------
    async function loadConfigAsync() {
        // 全部走云端，云端失败时返回默认配置（保证页面不空白）
        return await fetchCloudConfig();
    }

    // 同步版本（初始化时用，返回 Promise）
    function loadConfig() {
        return loadConfigAsync();
    }

    async function saveConfigAsync(config) {
        // 全部走云端
        const cloudOk = await saveCloudConfig(config);
        return { cloud: cloudOk, local: false, ok: cloudOk };
    }

    function saveConfig(config) {
        return saveConfigAsync(config);
    }

    // ---------- 本地存储已停用（统一走云端 Neon Postgres） ----------
    // 保留函数定义作为占位，避免破坏其它可能的引用
    function loadLocalConfig() {
        return getDefaultConfig();
    }
        return getDefaultConfig();
    }

    function saveLocalConfig(config) {
        // 已停用：所有数据走云端 Neon Postgres
        return true;
    }

    // ---------- 渲染卡片内容（从 config 同步到 DOM） ----------
    function renderCard(card, item) {
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
            // 2. 列表 — 不清空 HTML 模板的 list-key 等样式，仅给 li prepend 序号
            const listEl = card.querySelector('.card-list');
            if (listEl && item.list !== undefined) {
                const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];
                const listArr = item.list || [];
                const lis = listEl.querySelectorAll('li');
                const hasInlineStyle = listEl.querySelector('.list-key, .list-arrow, .list-target, strong');
                // 若 HTML 模板无内联样式 → 用 list 数据重建（支持用户编辑 list）
                if (lis.length !== listArr.length || !hasInlineStyle) {
                    listEl.innerHTML = '';
                    listArr.forEach(function (line) {
                        if (!line || !line.trim()) return;
                        const li = document.createElement('li');
                        // 把 **xxx** 还原成 <strong>xxx</strong>
                        li.innerHTML = '<span class="list-num"></span> ' + line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                        listEl.appendChild(li);
                    });
                }
                // 给每个 li prepend 序号 span（如果还没有）
                listEl.querySelectorAll('li').forEach(function (li, idx) {
                    const numEl = li.querySelector(':scope > .list-num');
                    if (numEl && numEl.textContent) return; // 已有序号
                    const num = CIRCLED[idx] || ((idx + 1) + '.');
                    if (!numEl) {
                        const span = document.createElement('span');
                        span.className = 'list-num';
                        span.textContent = num + ' ';
                        li.insertBefore(span, li.firstChild);
                    } else {
                        numEl.textContent = num + ' ';
                    }
                });
            }
        }

        // 3. 子链接展开面板
        updateCardLinks(card, item.links || []);

        // 4. 链接标记（有子链接时显示角标）
        if (item.links && item.links.length > 0) {
            card.classList.add('has-link');
        } else {
            card.classList.remove('has-link');
        }
    }

    // 更新卡片内子链接展开面板
    function updateCardLinks(card, links) {
        // 移除旧面板
        const oldPanel = card.querySelector('.card-links-panel');
        if (oldPanel) oldPanel.remove();

        if (!links || links.length === 0) return;

        var panel = document.createElement('div');
        panel.className = 'card-links-panel';
        links.forEach(function (link) {
            var a = document.createElement('a');
            a.className = 'card-link-item';
            a.href = link.url || '#';
            if (/^https?:\/\//i.test(link.url)) {
                a.target = '_blank';
                a.rel = 'noopener';
            }
            a.title = link.title || link.url || '';
            a.innerHTML = '<span class="link-icon">↗</span><span class="link-title">' + (escapeHtml(link.title) || '未命名链接') + '</span>';
            a.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!link.url) {
                    e.preventDefault();
                    showToast('该链接未配置 URL', 1500);
                }
            });
            panel.appendChild(a);
        });
        card.appendChild(panel);
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
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

    // ---------- 卡片点击：展开/收起子链接面板 ----------
    var expandedCard = null;

    document.addEventListener('click', async function (e) {
        // 编辑按钮：阻止冒泡，打开编辑弹窗
        if (e.target.closest('.edit-btn')) {
            e.stopPropagation();
            e.preventDefault();
            const card = e.target.closest('[data-id]');
            if (card) openEditModal(card);
            return;
        }

        // 子链接项点击：交给链接自身的 click handler
        if (e.target.closest('.card-link-item')) {
            return;
        }

        // 卡片本身点击（空白处）：打开编辑弹窗
        // 注：链接已默认展开显示，无需再点击展开
        const card = e.target.closest('[data-id]');
        if (card) {
            e.preventDefault();
            openEditModal(card);
        }
    });

    // 保留扩展函数作为兼容（不再使用，依赖 CSS 默认显示链接）
    function toggleCardExpand(card) {
        // 已废弃：链接面板默认显示，不再需要展开/收起
    }

    // ---------- 编辑弹窗 ----------
    const editModal = document.getElementById('editModal');
    const helpModal = document.getElementById('helpModal');
    let editingCard = null;
    let editingLinks = []; // 当前编辑中的链接列表 [{title, url}]

    async function openEditModal(card) {
        editingCard = card;
        const id = card.dataset.id;
        const config = await loadConfig();
        const item = config[id] || { links: [], desc: '', list: [] };

        document.getElementById('cardName').value = card.dataset.platform || id;
        document.getElementById('cardDesc').value = item.desc || '';
        document.getElementById('cardList').value = (item.list || []).join('\n');

        // 初始化链接列表
        editingLinks = (item.links || []).map(function (l) {
            return { title: l.title || '', url: l.url || '' };
        });
        if (editingLinks.length === 0) {
            editingLinks.push({ title: '', url: '' });
        }
        renderLinkEditor();

        // 小卡片不显示列表编辑
        const listRow = document.getElementById('listRow');
        if (listRow) {
            listRow.style.display = card.classList.contains('mini-card') ? 'none' : 'block';
        }

        editModal.classList.add('active');
    }

    function renderLinkEditor() {
        const container = document.getElementById('linkEditor');
        var html = '';
        editingLinks.forEach(function (link, i) {
            html += '<div class="link-editor-row">' +
                '<input type="text" class="link-title-input" placeholder="标题（外显名称）" value="' + escapeHtml(link.title) + '" data-idx="' + i + '">' +
                '<input type="url" class="link-url-input" placeholder="https://..." value="' + escapeHtml(link.url) + '" data-idx="' + i + '">' +
                '<button type="button" class="link-remove-btn" data-idx="' + i + '" title="删除此链接">×</button>' +
                '</div>';
        });
        html += '<button type="button" class="link-add-btn" id="linkAddBtn">+ 添加链接</button>';
        container.innerHTML = html;

        // 绑定事件
        container.querySelectorAll('.link-remove-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.dataset.idx);
                editingLinks.splice(idx, 1);
                if (editingLinks.length === 0) {
                    editingLinks.push({ title: '', url: '' });
                }
                renderLinkEditor();
            });
        });

        container.querySelectorAll('.link-title-input, .link-url-input').forEach(function (input) {
            input.addEventListener('input', function () {
                var idx = parseInt(this.dataset.idx);
                if (this.classList.contains('link-title-input')) {
                    editingLinks[idx].title = this.value;
                } else {
                    editingLinks[idx].url = this.value;
                }
            });
        });

        document.getElementById('linkAddBtn').addEventListener('click', function () {
            editingLinks.push({ title: '', url: '' });
            renderLinkEditor();
        });
    }

    function closeEditModal() {
        editModal.classList.remove('active');
        editingCard = null;
        editingLinks = [];
    }

    async function saveEdit() {
        if (!editingCard) return;
        const id = editingCard.dataset.id;
        const desc = document.getElementById('cardDesc').value.trim();
        const listText = document.getElementById('cardList').value;

        // 收集编辑面板中的链接数据
        var links = [];
        var linkTitleInputs = document.querySelectorAll('#linkEditor .link-title-input');
        var linkUrlInputs = document.querySelectorAll('#linkEditor .link-url-input');
        for (var i = 0; i < linkTitleInputs.length; i++) {
            var title = linkTitleInputs[i].value.trim();
            var url = linkUrlInputs[i].value.trim();
            if (url || title) {
                links.push({ title: title, url: url });
            }
        }

        const list = listText
            .split('\n')
            .map(function (s) { return s.trim(); })
            .filter(function (s) { return s.length > 0; });

        const config = await loadConfig();
        config[id] = { links: links, desc: desc, list: list };
        const result = await saveConfig(config);
        renderCard(editingCard, config[id]);
        closeEditModal();
        updateSyncStatus();
        if (result.cloud) {
            showToast('☁️ 已同步到云端：' + editingCard.dataset.platform);
        } else {
            showToast('💾 已保存到本地：' + editingCard.dataset.platform + '（云端未启用）');
        }
    }

    async function clearEdit() {
        if (!editingCard) return;
        const id = editingCard.dataset.id;
        const config = await loadConfig();
        config[id] = { links: [], desc: '', list: [] };
        const result = await saveConfig(config);
        renderCard(editingCard, config[id]);
        closeEditModal();
        updateSyncStatus();
        showToast(result.cloud ? '已清空并同步到云端' : '已清空（仅本地）');
    }

    document.getElementById('modalClose').addEventListener('click', closeEditModal);
    document.getElementById('modalSave').addEventListener('click', saveEdit);
    document.getElementById('modalClear').addEventListener('click', clearEdit);
    editModal.querySelector('.modal-mask').addEventListener('click', closeEditModal);

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
        updateSyncStatus();
        // 绑定状态指示器点击
        var statusEl = document.getElementById('syncStatus');
        if (statusEl) {
            statusEl.addEventListener('click', function () {
                if (cloudAvailable === true) {
                    showToast('☁️ 云端已连接 — 数据自动同步', 2000);
                } else if (cloudAvailable === false) {
                    showSyncHelp();
                } else {
                    showToast('正在检测云端状态…', 1500);
                }
            });
        }
    })();

    // ---------- 云端状态指示器 ----------
    function updateSyncStatus() {
        var el = document.getElementById('syncStatus');
        if (!el) return;
        var dot = el.querySelector('.sync-dot');
        var text = el.querySelector('.sync-text');
        el.classList.remove('is-checking', 'is-cloud', 'is-local', 'is-error');
        if (cloudAvailable === true) {
            el.classList.add('is-cloud');
            text.textContent = '☁️ 云端已连接';
            el.title = '点击查看详情';
        } else if (cloudAvailable === false) {
            el.classList.add('is-local');
            text.textContent = '💾 仅本地保存';
            el.title = '点击查看如何启用云端';
        } else {
            el.classList.add('is-checking');
            text.textContent = '检测中…';
        }
    }

    function showSyncHelp() {
        var html = '<h4>云端未启用</h4>'
            + '<p class="help-text">当前数据仅保存在<strong>浏览器本地</strong>（localStorage），清除浏览器数据后会丢失，且无法跨设备同步。</p>'
            + '<h4>如何启用云端</h4>'
            + '<ol class="help-list">'
            + '<li>登录 Vercel Dashboard，进入项目 <code>ecominone</code></li>'
            + '<li>进入 <strong>Settings → Environment Variables</strong></li>'
            + '<li>添加以下两个变量（推荐使用 <a href="https://upstash.com" target="_blank" rel="noopener">Upstash Redis</a> 免费版）：</li>'
            + '</ol>'
            + '<p class="help-text"><code>UPSTASH_REDIS_REST_URL</code> = 你的 Upstash REST URL<br><code>UPSTASH_REDIS_REST_TOKEN</code> = 你的 Upstash REST Token</p>'
            + '<ol class="help-list" start="4">'
            + '<li>保存后重新部署（Vercel 会自动触发）</li>'
            + '</ol>'
            + '<p class="help-text">配置完成后，编辑任一板块保存即可自动同步到云端，所有设备/浏览器共享同一份数据。</p>';
        showModal('云端同步说明', html);
    }

    // 通用弹窗（用于展示说明性内容）
    function showModal(title, bodyHtml) {
        var existing = document.getElementById('tempModal');
        if (existing) existing.remove();
        var wrap = document.createElement('div');
        wrap.id = 'tempModal';
        wrap.className = 'modal active';
        wrap.innerHTML = '<div class="modal-mask"></div><div class="modal-panel">'
            + '<div class="modal-head"><h3>' + title + '</h3><button class="modal-close temp-modal-close">×</button></div>'
            + '<div class="modal-body">' + bodyHtml + '</div>'
            + '<div class="modal-foot"><button class="btn-primary temp-modal-ok">知道了</button></div>'
            + '</div>';
        document.body.appendChild(wrap);
        function close() { wrap.remove(); }
        wrap.querySelector('.modal-mask').addEventListener('click', close);
        wrap.querySelector('.temp-modal-close').addEventListener('click', close);
        wrap.querySelector('.temp-modal-ok').addEventListener('click', close);
    }
})();
