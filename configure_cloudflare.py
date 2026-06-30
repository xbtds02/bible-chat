#!/usr/bin/env python3
"""
Cloudflare DNS 自动配置脚本
配置 biblechat.cc 的 DNS 记录指向 GitHub Pages

使用方法：
1. 登录 Cloudflare 仪表板 → 我的个人资料 → API 令牌 → 创建令牌
2. 使用 "Zone:Edit" 模板，选择 biblechat.cc 域名
3. 复制 Token，填入下面的 CF_API_TOKEN
4. 运行脚本：python configure_cloudflare.py
导入 requests
导入 sys

# ============ 请填写以下信息 ============
CF_API_TOKEN = "cfat_WtDJo76I26kOk36IK1mY3REG7pwFGrYvCb4YK5bpec0a13a1"  # Cloudflare API Token（Zone:Edit 权限）
# ======================================

如果 不 CF_API_TOKEN:
    "错误：请先在脚本中填写 CF_API_TOKEN")
    print("获取方式：Cloudflare Dashboard → My Profile → API Tokens → Create Token")
    打印("选择 'Zone:Edit' 模板，选择 biblechat.cc 域名")
    sys.退出(1)

HEADERS = {
    "Authorization": f"Bearer {CF_API_TOKEN}",
    "Content-Type": "application/json"
}

# 1. 获取 Zone ID
r = requests.get("https://api.cloudflare.com/client/v4/zones", headers=HEADERS)
if r.status_code != 200:
    print(f"获取 Zone 失败: {r.status_code}")
    打印(r.文本)
    sys.退出(1)

zones = r.json().get("result", [])
zone_id = 无
对于 zone 在 zones 中：
    如果区域[] == "biblechat.cc":
        区域_id = 区域["id"]
        

如果 没有 zone_id：
    打印("未找到 biblechat.cc 的 Zone，请确认 Token 有权限访问该域名")
    sys.退出(1)

打印(

# 2. 检查现有 DNS 记录
r = requests.get(f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records", headers=HEADERS)
existing = r.json().get("result", [])

# 删除旧的 A 记录和 CNAME 记录（避免冲突）
for record in existing:
    if record["type"] in ["A", "CNAME"] and record["name"] in ["biblechat.cc", "www.biblechat.cc"]:
        del_r = requests.delete(
            f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{record['id']}",
            headers=HEADERS
        )
        print(f"删除旧记录 {record['type']} {record['name']}: {del_r.status_code}")

# 3. 创建新的 A 记录（GitHub Pages IP 地址）
github_ips = [
    "185.199.108.153",
    "185.199.109.153",
    "185.199.110.153",
    "185.199.111.153"
]

for ip in github_ips:
    data = {
        "type": "A",
        "name": "biblechat.cc",
        "content": ip,
        "ttl": 1,  # 自动
        "proxied": False  # 灰色云朵，GitHub Pages 要求
    }
    r = requests.post(f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records", headers=HEADERS, json=data)
    print(f"创建 A 记录 {ip}: {r.status_code}")
    if not r.json().get("success"):
        print(f"  错误: {r.json().get('errors', [])}")

# 4. 创建 www CNAME 记录
data = {
    "type": "CNAME",
    "name": "www",
    "content": "xbtds02.github.io",
    "ttl": 1,
    "proxied": False
}
r = requests.post(f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records", headers=HEADERS, json=data)
print(f"创建 CNAME www: {r.status_code}")
if not r.json().get("success"):
    print(f"  错误: {r.json().get('errors', [])}")

print("\n✅ DNS 配置完成！")
print("请等待 5-15 分钟让 DNS 生效，然后访问 https://biblechat.cc")
print("\n生效后，可以回到 Cloudflare 把 DNS 记录的代理状态（橙色云朵）打开，启用 CDN 加速。")
