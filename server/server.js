import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { db, auth } from './firebase.js';
import cron from 'node-cron';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { verifyToken, verifyOrganization } from './middleware.js';
import { logAudit } from './audit.js';
import { sendEmail, emailTemplates } from './notifications.js';
import organizationRoutes from './routes/organizations.js';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Razorpay webhook signature: HMAC-SHA256 of the raw request body.
function verifyRazorpaySignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Standard checkout signature: HMAC-SHA256 of "order_id|payment_id".
function verifyPaymentSignature(orderId, paymentId, signature) {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
// Webhook endpoint — mounted before express.json() so the raw body is
// available for HMAC signature verification.
app.post('/api/webhooks/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!verifyRazorpaySignature(req.body, signature, secret)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    switch (event.event) {
      case 'payment.captured': {
        const entity = event.payload?.payment?.entity;
        if (!entity?.id) break;
        // Idempotent: razorpay_payment_id is unique per payment.
        const existing = await db.collection('payments')
          .where('razorpay_payment_id', '==', entity.id)
          .limit(1)
          .get();
        if (existing.empty) {
          await db.collection('payments').add({
            razorpay_order_id: entity.order_id,
            razorpay_payment_id: entity.id,
            amount: entity.amount / 100,
            currency: entity.currency,
            status: 'completed',
            org_id: entity.notes?.org_id || null,
            member_id: entity.notes?.member_id || null,
            captured_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        }
        break;
      }
      case 'payment.failed': {
        const entity = event.payload?.payment?.entity;
        if (!entity?.id) break;
        const failed = await db.collection('payments')
          .where('razorpay_payment_id', '==', entity.id)
          .limit(1)
          .get();
        if (!failed.empty) {
          await failed.docs[0].ref.update({
            status: 'failed',
            failed_at: new Date().toISOString(),
          });
        }
        break;
      }
    }
    res.json({ status: 'processed' });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.use(express.json({ limit: '10kb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

// Register routes
organizationRoutes(app);

// Payment routes
app.post('/api/payments/create-order', verifyToken, verifyOrganization, async (req, res) => {
  try {
    const { amount, currency, receipt_email, notes } = req.body;

    if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: currency || 'INR',
      receipt_email,
      notes: { ...notes, org_id: req.orgId, user_id: req.user.uid },
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({ error: 'Order creation failed' });
  }
});

app.post('/api/payments/verify', verifyToken, verifyOrganization, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, member_id, branch_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment fields' });
    }

    // Reject forged verification payloads before touching Razorpay.
    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured') {
      return res.status(400).json({ error: 'Payment not captured' });
    }

    // The payment must belong to the order the client claims, and to this org.
    if (payment.order_id !== razorpay_order_id) {
      return res.status(400).json({ error: 'Order mismatch' });
    }
    if (payment.notes?.org_id && payment.notes.org_id !== req.orgId) {
      return res.status(403).json({ error: 'Payment belongs to another organization' });
    }

    // Idempotency: a razorpay_payment_id maps to exactly one payment doc.
    const existing = await db.collection('payments')
      .where('razorpay_payment_id', '==', razorpay_payment_id)
      .limit(1)
      .get();
    if (!existing.empty) {
      return res.json({ paymentId: existing.docs[0].id, status: 'already_recorded' });
    }

    const paymentRef = await db.collection('payments').add({
      razorpay_order_id, razorpay_payment_id,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: 'completed',
      member_id,
      org_id: req.orgId,
      branch_id,
      type: 'membership',
      created_at: new Date().toISOString(),
    });
    
    await logAudit({
      level: 'info',
      message: `Payment verified: ${paymentRef.id}`,
      user_name: req.user.email || req.user.uid,
      user_id: req.user.uid,
      action: 'payment_verified',
      org_id: req.orgId,
      branch_id,
      target_type: 'payment',
      target_id: paymentRef.id,
    });
    
    res.json({ paymentId: paymentRef.id, status: 'verified' });
  } catch (error) {
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Scheduled tasks
cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    const expiringMembers = await db.collection('members')
      .where('expiry_date', '<=', now.toISOString())
      .where('status', '==', 'Active')
      .get();
    
    const batch = db.batch();
    expiringMembers.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'Expired' });
    });
    await batch.commit();
    
    console.log(`Updated ${expiringMembers.size} expired memberships`);
  } catch (error) {
    console.error('Membership expiry check failed:', error);
  }
});

cron.schedule('0 9 * * *', async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const expiringMembers = await db.collection('members')
      .where('expiry_date', '==', tomorrow.toISOString().split('T')[0])
      .where('status', '==', 'Active')
      .get();
    
    for (const doc of expiringMembers.docs) {
      const member = doc.data();
      await sendEmail(
        member.email,
        'Membership Expiring Soon',
        emailTemplates.membershipExpiring(member.name, member.expiry_date)
      );
    }
    
    console.log(`Sent ${expiringMembers.size} expiry reminders`);
  } catch (error) {
    console.error('Expiry reminder failed:', error);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
