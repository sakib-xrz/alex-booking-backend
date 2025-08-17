import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface NetworkTestResult {
  test: string;
  success: boolean;
  error?: string;
  details?: string;
}

export const testSMTPConnectivity = async (): Promise<NetworkTestResult[]> => {
  const results: NetworkTestResult[] = [];

  // Test 1: Check if port 587 is reachable
  try {
    const { stdout } = await execAsync(
      'timeout 10 bash -c "echo > /dev/tcp/smtp.gmail.com/587"',
    );
    results.push({
      test: 'Gmail SMTP Port 587 connectivity',
      success: true,
      details: 'Port 587 is reachable',
    });
  } catch (error) {
    results.push({
      test: 'Gmail SMTP Port 587 connectivity',
      success: false,
      error: 'Port 587 connection failed',
      details: 'This could indicate firewall blocking or network restrictions',
    });
  }

  // Test 2: Check if port 465 is reachable
  try {
    await execAsync('timeout 10 bash -c "echo > /dev/tcp/smtp.gmail.com/465"');
    results.push({
      test: 'Gmail SMTP Port 465 connectivity',
      success: true,
      details: 'Port 465 is reachable',
    });
  } catch (error) {
    results.push({
      test: 'Gmail SMTP Port 465 connectivity',
      success: false,
      error: 'Port 465 connection failed',
      details: 'SSL SMTP port is also blocked',
    });
  }

  // Test 3: Check if port 25 is reachable
  try {
    await execAsync('timeout 10 bash -c "echo > /dev/tcp/smtp.gmail.com/25"');
    results.push({
      test: 'Gmail SMTP Port 25 connectivity',
      success: true,
      details: 'Port 25 is reachable',
    });
  } catch (error) {
    results.push({
      test: 'Gmail SMTP Port 25 connectivity',
      success: false,
      error: 'Port 25 connection failed',
      details: 'Standard SMTP port is blocked',
    });
  }

  // Test 4: DNS resolution
  try {
    const { stdout } = await execAsync('nslookup smtp.gmail.com');
    results.push({
      test: 'DNS Resolution for smtp.gmail.com',
      success: true,
      details: 'DNS resolution successful',
    });
  } catch (error) {
    results.push({
      test: 'DNS Resolution for smtp.gmail.com',
      success: false,
      error: 'DNS resolution failed',
      details: 'Cannot resolve Gmail SMTP hostname',
    });
  }

  // Test 5: Check general internet connectivity
  try {
    await execAsync('timeout 10 ping -c 1 8.8.8.8');
    results.push({
      test: 'Internet connectivity',
      success: true,
      details: 'Can reach Google DNS',
    });
  } catch (error) {
    results.push({
      test: 'Internet connectivity',
      success: false,
      error: 'No internet connectivity',
      details: 'Cannot reach external servers',
    });
  }

  return results;
};

export const logNetworkDiagnostics = async (): Promise<void> => {
  console.log('🔍 Running network diagnostics...');
  const results = await testSMTPConnectivity();

  results.forEach((result) => {
    const status = result.success ? '✅' : '❌';
    console.log(
      `${status} ${result.test}: ${result.success ? result.details : result.error}`,
    );
    if (!result.success && result.details) {
      console.log(`   📝 ${result.details}`);
    }
  });

  // Provide recommendations based on results
  const failedTests = results.filter((r) => !r.success);
  if (failedTests.length > 0) {
    console.log('\n🚨 SMTP Connection Issues Detected:');
    console.log(
      '   1. Your Digital Ocean droplet may have firewall rules blocking SMTP ports',
    );
    console.log(
      '   2. Your ISP/hosting provider may be blocking SMTP connections',
    );
    console.log(
      '   3. Consider using a dedicated email service like SendGrid, Mailgun, or AWS SES',
    );
    console.log(
      '   4. Check Digital Ocean firewall settings in your control panel',
    );
  }
};
