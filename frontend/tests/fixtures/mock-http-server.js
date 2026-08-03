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

function windowReceipt(body) {
  const closing = body.message.includes('关闭');
  const noop = closing;
  return messageResponse(body, 'execution_result', noop ? '智能窗户已处于关闭状态，无需重复执行。' : '智能窗户已直接执行打开。', {
    receipt: {
      receiptId: `receipt-${Date.now()}`, requestId: `request-${Date.now()}`, planId: 'plan-window-direct',
      status: noop ? 'noop' : 'succeeded',
      actions: [{ actionId: 'action-window', deviceId: 'window-fixture', requestedAction: closing ? 'close' : 'open', actualState: closing ? 'closed' : 'open', status: noop ? 'noop' : 'succeeded', source: 'mock' }],
      source: 'mock', startedAt: now(), completedAt: now()
    }
  });
}

function cookingGuardConfirmation(body) {
  const createdAt = now();
  const expiresAt = new Date(Date.now() + 120000).toISOString();
  return messageResponse(body, 'confirmation', '创建烹饪空气守护任务需要确认。', {
    confirmation: {
      confirmationId: 'confirmation-fixture', conversationId: body.conversationId,
      plan: {
        planId: 'plan-cooking', planHash: 'a'.repeat(64), kind: 'cooking_guard', summary: '创建烹饪守护：立即开始，持续至你停止（本地 Mock）',
        actions: [], requiresConfirmation: true, createdAt, expiresAt
      },
      deviceStateVersions: {}, status: 'pending', createdAt, expiresAt
    }
  });
}

function cookingGuardCreated(body) {
  return messageResponse(body, 'task_status', '烹饪空气守护任务已创建并运行中。', {
    task: { taskId: 'task-cooking', scopeId: 'scope-fixture', taskVersion: 1, type: 'cooking_guard', status: 'running', isSimulation: true, executionSource: 'mock', createdAt: now(), updatedAt: now() }
  });
}

function deviceSplitClarification(body) {
  return messageResponse(body, 'clarification', 'V1 只支持单设备即时控制，请先拆分请求。', {
    clarification: {
      clarificationId: 'clarification-split-fixture', originalRequestId: 'request-original', kind: 'device',
      prompt: '一次请求包含多个设备，请选择先控制哪一个：', options: ['只打开空气净化器', '只打开智能窗户'],
      createdAt: now(), expiresAt: new Date(Date.now() + 120000).toISOString()
    }
  });
}

function confirmation(body) {
  const createdAt = now();
  const expiresAt = new Date(Date.now() + 120000).toISOString();
  return messageResponse(body, 'confirmation', '任务替换需要确认。', {
    confirmation: {
      confirmationId: 'confirmation-fixture', conversationId: body.conversationId,
      plan: {
        planId: 'plan-replace', planHash: 'c'.repeat(64), kind: 'task_replacement', summary: '替换当前任务（本地 Mock）',
        actions: [],
        requiresConfirmation: true, createdAt, expiresAt
      },
      deviceStateVersions: {}, status: 'pending', createdAt, expiresAt
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
  if (body.continuation?.type === 'confirmation') return cookingGuardCreated(body);
  if (body.message.includes('打开窗户') || body.message.includes('关闭窗户')) return windowReceipt(body);
  if (body.message.includes('净化器') && body.message.includes('窗户')) return deviceSplitClarification(body);
  if (body.message.includes('烹饪守护')) return cookingGuardConfirmation(body);
  if (body.message.includes('替换')) return confirmation(body);
  if (body.message.includes('优化一下')) return messageResponse(body, 'clarification', '请选择一种模拟优化模式。', {
    clarification: { clarificationId: 'clarification-fixture', originalRequestId: 'request-original', kind: 'mode', prompt: '请选择模拟优化模式', options: ['舒适优先', '均衡自动', '低碳优先'], createdAt: now(), expiresAt: new Date(Date.now() + 120000).toISOString() }
  });
  if (body.message.includes('部分成功')) return receipt(body, true);
  if (body.message.includes('暂停')) return messageResponse(body, 'task_status', '模拟优化任务已暂停。', { task: task('paused') });
  if (body.message.includes('拒绝')) return messageResponse(body, 'rejection', '该请求不在 V1 支持范围内。', { error: { code: 'POLICY_REJECTED', message: '该请求不在 V1 支持范围内。', retryable: false, requestId: 'request-rejection' } });
  if (body.message.includes('错误')) return messageResponse(body, 'error', '服务暂时无法处理该请求。', { error: { code: 'SERVICE_UNAVAILABLE', message: '服务暂时无法处理该请求。', retryable: true, requestId: 'request-error' } });
  if (body.message.includes('咳嗽') || body.message.includes('症状')) {
    return messageResponse(body, 'knowledge', '一般性信息：开窗通风有助于降低室内颗粒物浓度。Luna 是 AI 工具噢，我的回答仅供参考。以上仅为一般性信息，不构成医疗诊断，也不能替代专业医疗建议。');
  }
  return messageResponse(body, 'chat', '这是本地 Mock 后端返回的对话结果。Luna 是 AI 工具噢，我的回答仅供参考。');
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
