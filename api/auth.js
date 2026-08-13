/**
 * Vercel Serverless Function: /api/auth
 * 企业微信扫码登录认证。
 *
 * 环境变量（在 Vercel 项目设置中配置）：
 *   WEWORK_CORP_ID  - 企业微信的 CorpID（企业ID）
 *   WEWORK_AGENT_ID - 企业微信自建应用的 AgentID
 *   WEWORK_SECRET   - 企业微信自建应用的 Secret
 *
 * API:
 *   GET /api/auth                    → 返回前端生成二维码所需的 CorpID / AgentID
 *   GET /api/auth?code=xxxx          → 用扫码得到的 code 换取用户身份
 *   GET /api/auth?action=me          → 返回当前登录态（由前端基于 session 自行维护）
 *
 * 说明：
 *   - CorpID / AgentID 会暴露在扫码链接中，非敏感，可返回前端。
 *   - Secret 仅在后端使用，绝不返回前端。
 */

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
}

function hasConfig() {
    return !!(process.env.WEWORK_CORP_ID && process.env.WEWORK_AGENT_ID && process.env.WEWORK_SECRET);
}

/**
 * 获取企业微信 access_token（带简单内存缓存）
 */
let tokenCache = { token: null, expireAt: 0 };

async function getAccessToken() {
    const now = Date.now();
    if (tokenCache.token && now < tokenCache.expireAt) {
        return tokenCache.token;
    }

    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${process.env.WEWORK_CORP_ID}&corpsecret=${process.env.WEWORK_SECRET}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (data.errcode !== 0) {
        throw new Error(`获取 access_token 失败: ${data.errmsg} (errcode ${data.errcode})`);
    }

    tokenCache = { token: data.access_token, expireAt: now + (data.expires_in - 300) * 1000 };
    return data.access_token;
}

/**
 * 用 code 换取用户身份信息
 */
async function getUserInfoByCode(code) {
    const token = await getAccessToken();

    // 1. 根据 code 获取 userid
    const infoUrl = `https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo?access_token=${token}&code=${code}`;
    const infoResp = await fetch(infoUrl);
    const infoData = await infoResp.json();

    if (infoData.errcode !== 0) {
        throw new Error(`获取用户身份失败: ${infoData.errmsg} (errcode ${infoData.errcode})`);
    }

    const userid = infoData.userid;
    if (!userid) {
        throw new Error('未获取到用户身份，请确认该成员在应用的可见范围内');
    }

    // 2. 获取用户详情（姓名、头像等）
    let name = userid;
    let avatar = '';
    try {
        const userUrl = `https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=${token}&userid=${encodeURIComponent(userid)}`;
        const userResp = await fetch(userUrl);
        const userData = await userResp.json();
        if (userData.errcode === 0) {
            name = userData.name || userid;
            avatar = userData.avatar || '';
        }
    } catch (e) {
        console.warn('获取用户详情失败，使用 userid:', e);
    }

    return { userid, name, avatar };
}

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const action = url.searchParams.get('action');

        // 返回前端生成二维码所需配置
        if (!code) {
            return json({
                success: true,
                configured: hasConfig(),
                corpId: process.env.WEWORK_CORP_ID || '',
                agentId: process.env.WEWORK_AGENT_ID || ''
            });
        }

        // 用 code 换取用户身份
        if (!hasConfig()) {
            return json({ success: false, error: '企业微信认证未配置，请联系管理员配置环境变量' }, 500);
        }

        const user = await getUserInfoByCode(code);
        return json({ success: true, user });
    } catch (err) {
        console.error('GET /api/auth error:', err);
        return json({ success: false, error: err.message }, 500);
    }
}

export function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}
