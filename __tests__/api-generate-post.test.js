const handler = require('../pages/api/generate-post').default

const mockReq = (method, body = {}, headers = {}) => ({
  method,
  body,
  headers,
  socket: {remoteAddress: Math.random().toString()}
})
const mockRes = () => {
  let status = 200, jsonData = null
  return {
    status: s => { status = s; return this },
    json: d => { jsonData = d; return { status, json: jsonData } },
    get out() { return { status, json: jsonData } }
  }
}
test('returns 400 for empty prompt', async () => {
  const req = mockReq('POST', { prompt: '' })
  const res = mockRes()
  await handler(req, res)
  expect(res.out.status).toBe(400)
})
test('returns 400 for profane prompt', async () => {
  const req = mockReq('POST', { prompt: 'shitprompt' })
  const res = mockRes()
  await handler(req, res)
  expect(res.out.status).toBe(400)
})
test('returns 429 if rate limited', async () => {
  // Hit the endpoint 4 times with the same mock IP
  const ip = '1.2.3.4'
  for(let i = 0; i < 3; i++)
    await handler(mockReq('POST', {prompt:'hello world'}, { 'x-forwarded-for': ip }), mockRes())
  const res = mockRes()
  await handler(mockReq('POST', { prompt: 'hello world' }, { 'x-forwarded-for': ip }), res)
  expect(res.out.status).toBe(429)
})
test('returns 405 for wrong method', async () => {
  const req = mockReq('GET')
  const res = mockRes()
  await handler(req, res)
  expect(res.out.status).toBe(405)
})
