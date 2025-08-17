"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logNetworkDiagnostics = exports.testSMTPConnectivity = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const testSMTPConnectivity = () => __awaiter(void 0, void 0, void 0, function* () {
    const results = [];
    try {
        const { stdout } = yield execAsync('timeout 10 bash -c "echo > /dev/tcp/smtp.gmail.com/587"');
        results.push({
            test: 'Gmail SMTP Port 587 connectivity',
            success: true,
            details: 'Port 587 is reachable',
        });
    }
    catch (error) {
        results.push({
            test: 'Gmail SMTP Port 587 connectivity',
            success: false,
            error: 'Port 587 connection failed',
            details: 'This could indicate firewall blocking or network restrictions',
        });
    }
    try {
        yield execAsync('timeout 10 bash -c "echo > /dev/tcp/smtp.gmail.com/465"');
        results.push({
            test: 'Gmail SMTP Port 465 connectivity',
            success: true,
            details: 'Port 465 is reachable',
        });
    }
    catch (error) {
        results.push({
            test: 'Gmail SMTP Port 465 connectivity',
            success: false,
            error: 'Port 465 connection failed',
            details: 'SSL SMTP port is also blocked',
        });
    }
    try {
        yield execAsync('timeout 10 bash -c "echo > /dev/tcp/smtp.gmail.com/25"');
        results.push({
            test: 'Gmail SMTP Port 25 connectivity',
            success: true,
            details: 'Port 25 is reachable',
        });
    }
    catch (error) {
        results.push({
            test: 'Gmail SMTP Port 25 connectivity',
            success: false,
            error: 'Port 25 connection failed',
            details: 'Standard SMTP port is blocked',
        });
    }
    try {
        const { stdout } = yield execAsync('nslookup smtp.gmail.com');
        results.push({
            test: 'DNS Resolution for smtp.gmail.com',
            success: true,
            details: 'DNS resolution successful',
        });
    }
    catch (error) {
        results.push({
            test: 'DNS Resolution for smtp.gmail.com',
            success: false,
            error: 'DNS resolution failed',
            details: 'Cannot resolve Gmail SMTP hostname',
        });
    }
    try {
        yield execAsync('timeout 10 ping -c 1 8.8.8.8');
        results.push({
            test: 'Internet connectivity',
            success: true,
            details: 'Can reach Google DNS',
        });
    }
    catch (error) {
        results.push({
            test: 'Internet connectivity',
            success: false,
            error: 'No internet connectivity',
            details: 'Cannot reach external servers',
        });
    }
    return results;
});
exports.testSMTPConnectivity = testSMTPConnectivity;
const logNetworkDiagnostics = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔍 Running network diagnostics...');
    const results = yield (0, exports.testSMTPConnectivity)();
    results.forEach((result) => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.test}: ${result.success ? result.details : result.error}`);
        if (!result.success && result.details) {
            console.log(`   📝 ${result.details}`);
        }
    });
    const failedTests = results.filter((r) => !r.success);
    if (failedTests.length > 0) {
        console.log('\n🚨 SMTP Connection Issues Detected:');
        console.log('   1. Your Digital Ocean droplet may have firewall rules blocking SMTP ports');
        console.log('   2. Your ISP/hosting provider may be blocking SMTP connections');
        console.log('   3. Consider using a dedicated email service like SendGrid, Mailgun, or AWS SES');
        console.log('   4. Check Digital Ocean firewall settings in your control panel');
    }
});
exports.logNetworkDiagnostics = logNetworkDiagnostics;
