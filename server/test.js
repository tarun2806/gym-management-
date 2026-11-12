import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';

describe('Backend Tests', () => {
  it('should have middleware file with required functions', () => {
    const content = readFileSync('./middleware.js', 'utf-8');
    assert.ok(content.includes('verifyToken'));
    assert.ok(content.includes('verifyOrganization'));
  });
  
  it('should have audit file with required functions', () => {
    const content = readFileSync('./audit.js', 'utf-8');
    assert.ok(content.includes('logAudit'));
    assert.ok(content.includes('verifyBranchPermission'));
  });
  
  it('should have notification file with required functions', () => {
    const content = readFileSync('./notifications.js', 'utf-8');
    assert.ok(content.includes('sendEmail'));
    assert.ok(content.includes('emailTemplates'));
  });
  
  it('should have server file with API routes', () => {
    const content = readFileSync('./server.js', 'utf-8');
    assert.ok(content.includes('/api/health'));
    assert.ok(content.includes('/api/payments'));
    assert.ok(content.includes('/api/webhooks'));
  });
  
  it('should have firebase initialization', () => {
    const content = readFileSync('./firebase.js', 'utf-8');
    assert.ok(content.includes('firebase-admin'));
    assert.ok(content.includes('FIREBASE_PRIVATE_KEY'));
  });
});
