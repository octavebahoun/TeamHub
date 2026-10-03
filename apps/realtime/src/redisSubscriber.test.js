import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { handleRedisMessage } from './redisSubscriber.js';

function ioStub() {
  const emit = mock.fn();
  const disconnectSockets = mock.fn();
  return {
    emit,
    disconnectSockets,
    to: mock.fn(() => ({ emit })),
    in: mock.fn(() => ({ disconnectSockets })),
  };
}

describe('handleRedisMessage', () => {
  it('pushes a notification to the user room', async () => {
    const io = ioStub();
    await handleRedisMessage(
      io,
      'wine:notifications',
      JSON.stringify({ user_id: 7, type: 'task.assigned' }),
    );
    assert.equal(io.to.mock.calls[0].arguments[0], 'user:7');
    assert.equal(io.emit.mock.calls[0].arguments[0], 'notification:new');
  });

  it('disconnects a revoked user', async () => {
    const io = ioStub();
    await handleRedisMessage(io, 'wine:user:revoked', JSON.stringify({ user_id: 3 }));
    assert.equal(io.in.mock.calls[0].arguments[0], 'user:3');
    assert.equal(io.disconnectSockets.mock.calls.length, 1);
  });

  it('ignores invalid JSON', async () => {
    const io = ioStub();
    await handleRedisMessage(io, 'wine:notifications', 'not-json');
    assert.equal(io.to.mock.calls.length, 0);
  });
});
