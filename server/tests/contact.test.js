import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import http from 'node:http';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api/contact`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

describe('Storefront Unified Contact Endpoint Suite', () => {
  test('POST /api/contact rejects invalid or missing required fields with HTTP 400', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: '',
        email: 'invalid-email-format',
        subject: '',
        message: 'short',
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, 'Validation failed');
    assert.ok(body.details.fullName, 'Should report fullName error');
    assert.ok(body.details.email, 'Should report email error');
    assert.ok(body.details.subject, 'Should report subject error');
    assert.ok(body.details.message, 'Should report message error');
  });

  test('POST /api/contact accepts valid submission across collection themes and logs inquiry', async () => {
    const payload = {
      fullName: 'Meenakshi Sundaram',
      email: 'meenakshi@example.com',
      phone: '+91 9940018593',
      subject: 'Bridal Kanchipuram Silk Consultation',
      message: 'We are planning a wedding in Chennai this winter and would like to arrange a private appointment for heritage sarees.',
      collectionId: 'sarees',
    };

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.inquiryReference, 'Must return inquiry reference');
    assert.ok(body.inquiryReference.startsWith('INQ-'), 'Reference should follow INQ- format');
  });

  test('POST /api/contact accepts optional empty phone gracefully', async () => {
    const payload = {
      fullName: 'Vikram Patel',
      email: 'vikram@example.com',
      phone: '',
      subject: 'Botanical Tisane Sourcing',
      message: 'Looking for culinary partnerships and bulk supply of butterfly blue pea tisane for hospitality beverage service.',
      collectionId: 'tea',
    };

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
  });
});
