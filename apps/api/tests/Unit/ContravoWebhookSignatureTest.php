<?php

use App\Support\ContravoWebhookSignature;

it('accepts a raw hex hmac of the body', function () {
    $secret = 'test-contravo-secret';
    $body = '{"event":"webhook.test"}';
    $header = hash_hmac('sha256', $body, $secret);

    expect(ContravoWebhookSignature::matches($secret, $body, $header))->toBeTrue();
});

it('accepts a sha256= prefix', function () {
    $secret = 'test-contravo-secret';
    $body = '{"event":"webhook.test"}';
    $header = 'sha256='.hash_hmac('sha256', $body, $secret);

    expect(ContravoWebhookSignature::matches($secret, $body, $header))->toBeTrue();
});

it('accepts a Stripe-like t=,v1= header', function () {
    $secret = 'test-contravo-secret';
    $body = '{"event":"webhook.test"}';
    $timestamp = '1710000000';
    $header = 't='.$timestamp.',v1='.hash_hmac('sha256', $timestamp.'.'.$body, $secret);

    expect(ContravoWebhookSignature::matches($secret, $body, $header))->toBeTrue();
});

it('accepts a whsec_ secret whose HMAC key is the decoded remainder', function () {
    $rawKey = random_bytes(32);
    $secret = 'whsec_'.base64_encode($rawKey);
    $body = '{"event":"webhook.test"}';
    $header = hash_hmac('sha256', $body, $rawKey);

    expect(ContravoWebhookSignature::matches($secret, $body, $header))->toBeTrue();
});

it('rejects a forged signature', function () {
    expect(ContravoWebhookSignature::matches('secret', '{}', 'deadbeef'))->toBeFalse();
});
