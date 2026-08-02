import { createServer } from 'node:http';

const now = () => new Date().toISOString();
const source = () => [{ type: 'mock', observedAt: now(), referenceId: 'frontend-browser-fixture' }];
const devices = [
  ['purifier-fixture', 'air_purifier', '空气净化器', '客厅', 'on', 'supported', ['turn_on', 'turn_off']],
  ['window-fixture', 'smart_window', '智能窗户', '客厅', 'closed', 'supported', ['open', 'close']],
  ['hood-fixture', 'range_hood', '抽油烟机', '厨房', 'off', 'supported', ['turn_on', 'turn_off']],
  ['fresh-fixture', 'fresh_air', '新风系统', '全屋', 'unknown', 'not_integrated', []],
  ['humidifier-fixture', 'humidifier', '加湿器', '卧室', 'unknown', 'not_integrated', []],
  ['fan-fixture', 'circulation_fan', '循环风机', '客厅', 'unknown', 'not_integrated', []]
].map(([id, type, name, room, state, controlSupport, availableActions]) => ({
  id, type, name, aliases: [], room, connectionStatus: controlSupport === 'supported' ? 'online' : 'unavailable',
  controlSupport, availableActions, state, stateVersion: 1, observedAt: now(), source: 'mock'
}));

function task(status = 'scheduled') {
  return {
    taskId: 'task-fixture', scopeId: 'scope-fixture', taskVersion: 2, type: 'optimization', mode: 'balanced',
    status, isSimulation: true, executionSource: 'mock', scheduledFor: new Date(Date.now() + 3600000).toISOString(),
    createdAt: now(), updatedAt: now()
  };
}

function messageResponse(body, responseType, content, extra = {}) {
  return {
    contractVersion: '1.0.0', requestId: `request-${Date.now()}`, conversationId: body.conversationId,
    message: { id: `assistant-${Date.now()}`, role: 'assistant', content, status: responseType === 'error' ? 'error' : 'complete', createdAt: now() },
    responseType, sources: source(), ...extra
  };
}

function confirmation(body) {
  const createdAt = now();
  const expiresAt = new Date(Date.now() + 120000).toISOString();
  return messageResponse(body, 'confirmation', '智能窗户状态改变需要确认。', {
    confirmation: {
      confirmationId: 'confirmation-fixture', conversationId: body.conversationId,
      plan: {
        planId: 'plan-window', planHash: 'a'.repeat(64), kind: 'single_device', summary: '打开客厅智能窗户（本地 Mock）',
        actions: [{ actionId: 'action-window', deviceId: 'window-fixture', deviceType: 'smart_window', action: 'open', targetState: 'open', expectedStateVersion: 1 }],
        requiresConfirmation: true, createdAt, expiresAt
      },
      deviceStateVersions: { 'window-fixture': 1 }, status: 'pending', createdAt, expiresAt
    }
  });
}

function receipt(body, partial = false) {
  const actions = partial
    ? [
        { actionId: 'action-purifier', deviceId: 'purifier-fixture', requestedAction: 'turn_on', actualState: 'on', status: 'succeeded', source: 'mock' },
        { actionId: 'action-hood', deviceId: 'hood-fixture', requestedAction: 'turn_on', actualState: 'off', status: 'failed', errorCode: 'DEVICE_UNAVAILABLE', source: 'mock' }
      ]
    : [{ actionId: 'action-window', deviceId: 'window-fixture', requestedAction: 'open', actualState: 'open', status: 'succeeded', source: 'mock' }];
  return messageResponse(body, 'execution_result', partial ? '部分动作完成，请逐项查看结果。' : '智能窗户已在本地 Mock 中打开。', {
    receipt: {
      receiptId: `receipt-${Date.now()}`, requestId: `request-${Date.now()}`, planId: partial ? 'plan-partial' : 'plan-window',
      status: partial ? 'partial_success' : 'succeeded', actions, source: 'mock', startedAt: now(), completedAt: now()
    }
  });
}

function routeMessage(body) {
  if (body.continuation?.type === 'confirmation') return receipt(body, false);
  if (body.message.includes('打开窗户')) return confirmation(body);
  if (body.message.includes('优化一下')) return messageResponse(body, 'clarification', '请选择一种模拟优化模式。', {
    clarification: { clarificationId: 'clarification-fixture', originalRequestId: 'request-original', kind: 'mode', prompt: '请选择模拟优化模式', options: ['舒适优先', '均衡自动', '低碳优先'], createdAt: now(), expiresAt: new Date(Date.now() + 120000).toISOString() }
  });
  if (body.message.includes('部分成功')) return receipt(body, true);
  if (body.message.includes('暂停')) return messageResponse(body, 'task_status', '模拟优化任务已暂停。', { task: task('paused') });
  if (body.message.includes('拒绝')) return messageResponse(body, 'rejection', '该请求不在 V1 支持范围内。', { error: { code: 'POLICY_REJECTED', message: '该请求不在 V1 支持范围内。', retryable: false, requestId: 'request-rejection' } });
  if (body.message.includes('错误')) return messageResponse(body, 'error', '服务暂时无法处理该请求。', { error: { code: 'SERVICE_UNAVAILABLE', message: '服务暂时无法处理该请求。', retryable: true, requestId: 'request-error' } });
  return messageResponse(body, 'chat', '这是本地 Mock 后端返回的对话结果。');
}

const server = createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', request.headers.origin || '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (request.method === 'OPTIONS') return response.end();
  if (request.method === 'GET' && request.url === '/v1/health') {
    return response.end(JSON.stringify({ status: 'ok', contractVersion: '1.0.0', mode: 'local_mock' }));
  }
  if (request.method === 'GET' && request.url === '/v1/bootstrap') {
    return response.end(JSON.stringify({
      contractVersion: '1.0.0', mode: 'local_mock', devices,
      environment: { pm25: 9, co2: 580, humidity: 56, temperature: 25, score: 91, status: 'Mock 空气良好', observedAt: now(), source: 'mock', freshness: 'fresh' },
      activeTask: task(), observedAt: now()
    }));
  }
  if (request.method === 'POST' && request.url === '/v1/conversations/messages') {
    let raw = '';
    request.setEncoding('utf8');
    request.on('data', chunk => { raw += chunk; });
    request.on('end', () => {
      const body = JSON.parse(raw);
      console.log(JSON.stringify({ message: body.message, conversationId: body.conversationId, clientMessageId: body.clientMessageId, idempotencyKey: body.idempotencyKey, locale: body.locale, timezone: body.timezone, continuation: body.continuation || null }));
      const identifiersValid = body.conversationId && body.clientMessageId && body.idempotencyKey;
      const contextValid = /^[a-z]{2,3}(-[A-Z]{2})?$/.test(body.locale) && typeof body.timezone === 'string' && body.timezone.length > 0;
      const continuationValid = body.continuation?.type !== 'confirmation' || body.continuation.id === 'confirmation-fixture';
      if (!identifiersValid || !contextValid || !continuationValid) {
        response.statusCode = 400;
        response.end(JSON.stringify({ code: 'INVALID_REQUEST', message: '浏览器联调请求字段无效。', retryable: false, requestId: 'fixture-invalid' }));
        return;
      }
      response.end(JSON.stringify(routeMessage(body)));
    });
    return;
  }
  response.statusCode = 404;
  response.end(JSON.stringify({ code: 'NOT_FOUND' }));
});

server.listen(8787, '127.0.0.1', () => console.log('frontend browser fixture listening on 127.0.0.1:8787'));
