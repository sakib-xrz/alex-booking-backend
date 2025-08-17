import express from 'express';
import {
  testSMTPConnectivity,
  logNetworkDiagnostics,
} from '../../utils/networkTest';
import emailQueue from '../../utils/emailQueue';

const router = express.Router();

// Network diagnostics endpoint
router.get('/network-test', async (req, res) => {
  try {
    const results = await testSMTPConnectivity();

    res.json({
      success: true,
      message: 'Network diagnostics completed',
      data: {
        results,
        recommendations: results.some((r) => !r.success)
          ? [
              'Check Digital Ocean firewall settings',
              'Verify SMTP ports (25, 587, 465) are not blocked',
              'Consider using a dedicated email service (SendGrid, Mailgun, AWS SES)',
              'Contact your hosting provider about SMTP restrictions',
            ]
          : ['All network tests passed - SMTP should work properly'],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Network diagnostics failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Email queue status endpoint
router.get('/email-queue', (req, res) => {
  res.json({
    success: true,
    message: 'Email queue status',
    data: {
      queueSize: emailQueue.getQueueSize(),
      isProcessing: emailQueue.isProcessing(),
    },
  });
});

// Test email endpoint (for debugging)
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    // Add a simple test email to the queue
    const jobId = await emailQueue.addEmail(
      email,
      'SMTP Test Email',
      '<h1>Test Email</h1><p>If you receive this, SMTP is working!</p>',
    );

    res.json({
      success: true,
      message: 'Test email queued successfully',
      data: { jobId },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to queue test email',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
