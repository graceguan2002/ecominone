/**
 * Vercel Serverless Function: /api/config
 * 使用 Neon Serverless Postgres 读写集成管理系统的配置数据。
 *
 * 环境变量（在 Vercel 项目设置中配置）：
 *   DATABASE_URL - Neon Postgres 连接字符串
 *     (格式: postgresql://user:password@hostname/dbname?sslmode=require)
 *
 * 依赖：
 *   npm install @neondatabase/serverless
 *
 * API:
 *   GET    /api/config   → 读取全量配置
 *   POST   /api/config   → 写入全量配置 (body: { config: {...} })
 *   DELETE /api/config   → 删除配置（重置为默认）
 */

import { neon } from '@neondatabase/serverless';

const TABLE_NAME = 'system_config';
const CONFIG_KEY = 'integrated-system-config-v4';

// 默认配置（与前端 app.js 保持一致）
const DEFAULT_CONFIG = {
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
        desc: '外循环链路持续监控',
        list: []
    },
    'mgmt-performance': {
        url: '',
        desc: '围绕 业绩完成度、预估、授信、政策 等维度进行统一管理与跟踪。',
        list: []
    },
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
            'Hunter + 提报 发现新垂类机会',
            '跟进、验证小赛道机会是否有意义',
            '研究是否可以有机会复制'
        ]
    },
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

/**
 * 获取 Neon SQL 客户端（延迟初始化）
 */
function getSql() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL 环境变量未设置');
    }
    return neon(process.env.DATABASE_URL);
}

/**
 * 确保数据表存在（自动创建）
 */
async function ensureTable(sql) {
    await sql.query(`
        CREATE TABLE IF NOT EXISTS system_config (
            key TEXT PRIMARY KEY,
            config JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
}

/**
 * GET /api/config - 读取配置
 */
export async function GET() {
    try {
        const sql = getSql();
        await ensureTable(sql);

        // 表名是字面量常量，安全拼接
        const rows = await sql.query(
            `SELECT config FROM ${TABLE_NAME} WHERE key = $1`,
            [CONFIG_KEY]
        );

        let config = {};
        if (rows.length > 0 && rows[0].config) {
            config = rows[0].config;
        }

        // 合并默认值（确保新板块有兜底）
        const merged = {};
        for (const id of Object.keys(DEFAULT_CONFIG)) {
            merged[id] = { ...DEFAULT_CONFIG[id], ...(config[id] || {}) };
        }

        return new Response(JSON.stringify({
            success: true,
            config: merged,
            fromCache: rows.length === 0
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    } catch (err) {
        console.error('GET /api/config error:', err);
        // 降级：返回默认配置
        return new Response(JSON.stringify({
            success: false,
            error: err.message,
            config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
            fallback: true
        }), {
            status: 200, // 仍返回 200 让前端能继续工作
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

/**
 * POST /api/config - 写入配置
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const config = body.config;

        if (!config || typeof config !== 'object') {
            return new Response(JSON.stringify({
                success: false,
                error: '请提供有效的 config 对象'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const sql = getSql();
        await ensureTable(sql);

        await sql.query(
            `INSERT INTO ${TABLE_NAME} (key, config, updated_at)
             VALUES ($1, $2::jsonb, NOW())
             ON CONFLICT (key) DO UPDATE
             SET config = EXCLUDED.config, updated_at = NOW()`,
            [CONFIG_KEY, JSON.stringify(config)]
        );

        return new Response(JSON.stringify({
            success: true,
            message: '配置已保存到云端'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (err) {
        console.error('POST /api/config error:', err);
        return new Response(JSON.stringify({
            success: false,
            error: err.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

/**
 * DELETE /api/config - 删除配置（重置为默认）
 */
export async function DELETE() {
    try {
        const sql = getSql();
        await ensureTable(sql);

        await sql.query(
            `DELETE FROM ${TABLE_NAME} WHERE key = $1`,
            [CONFIG_KEY]
        );

        return new Response(JSON.stringify({
            success: true,
            message: '配置已重置'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (err) {
        console.error('DELETE /api/config error:', err);
        return new Response(JSON.stringify({
            success: false,
            error: err.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

/**
 * OPTIONS - CORS 预检
 */
export function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
