/**
 * 单端口网关：把七个前端工程收到一个地址下，代码仍然是各自独立的工程。
 *
 *   /home/*                  → 5280 首页
 *   /settings/project/*      → 5281 项目设置
 *   /settings/organization/* → 5282 组织设置
 *   /settings/*              → 5283 智能体功能 + 用户设置
 *   /modeling/*              → 5284 建模
 *   /knowledge/*             → 5285 知识
 *   /api-management/*        → 5286 API
 *
 * 注意：各工程需要把 vite 的 base 设成上面的前缀，路由也要带同样的 base。
 */
import http from 'node:http'
import httpProxy from 'http-proxy'

const PORT = Number(process.env.GATEWAY_PORT || 5200)

const ROUTES = [
  { prefix: '/settings/project', port: 5281 },
  { prefix: '/settings/organization', port: 5282 },
  { prefix: '/settings', port: 5283 },
  { prefix: '/home', port: 5280 },
  { prefix: '/modeling', port: 5284 },
  { prefix: '/knowledge', port: 5285 },
  { prefix: '/api-management', port: 5286 },
]

const proxy = httpProxy.createProxyServer({ ws: true, changeOrigin: true, xfwd: true })

proxy.on('error', (err, _req, res) => {
  const target = res && typeof res.writeHead === 'function'
  console.error('[gateway] proxy error:', err.message)
  if (target && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(`网关连不上后端工程：${err.message}\n先确认对应的 dev server 起着。`)
  }
})

function pick(url = '') {
  const path = url.split('?')[0]
  return ROUTES.find((r) => path === r.prefix || path.startsWith(`${r.prefix}/`))
}

const server = http.createServer((req, res) => {
  const hit = pick(req.url)
  if (!hit) {
    if (req.url === '/' || req.url === '') {
      res.writeHead(302, { Location: '/home/' })
      res.end()
      return
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('没有匹配的工程，可用前缀：/home /modeling /knowledge /api-management /settings/...')
    return
  }
  proxy.web(req, res, { target: `http://[::1]:${hit.port}` })
})

server.on('upgrade', (req, socket, head) => {
  const hit = pick(req.url)
  if (!hit) {
    socket.destroy()
    return
  }
  proxy.ws(req, socket, head, { target: `ws://[::1]:${hit.port}` })
})

server.listen(PORT, () => {
  console.log(`gateway → http://localhost:${PORT}`)
  for (const r of ROUTES) console.log(`  ${r.prefix.padEnd(24)} → ${r.port}`)
})
