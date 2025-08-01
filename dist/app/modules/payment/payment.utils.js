"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.constructWebhookEvent = exports.centsToDollars = exports.dollarsToCents = exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = __importDefault(require("../../config"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
// Initialize Stripe
exports.stripe = new stripe_1.default(config_1.default.stripe_secret_key);
// Convert dollars to cents
const dollarsToCents = (dollars) => {
    return Math.round(dollars * 100);
};
exports.dollarsToCents = dollarsToCents;
// Convert cents to dollars
const centsToDollars = (cents) => {
    return cents / 100;
};
exports.centsToDollars = centsToDollars;
// Validate webhook signature
const constructWebhookEvent = (payload, signature) => {
    // Check if webhook secret is configured
    if (!config_1.default.stripe_webhook_secret) {
        console.error('STRIPE_WEBHOOK_SECRET is not configured');
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Webhook secret not configured');
    }
    try {
        // Ensure payload is a Buffer
        const body = typeof payload === 'string' ? Buffer.from(payload) : payload;
        console.log('Webhook verification attempt:', {
            payloadType: typeof payload,
            payloadLength: body.length,
            hasSignature: !!signature,
            signatureFormat: signature.substring(0, 20) + '...',
        });
        return exports.stripe.webhooks.constructEvent(body, signature, config_1.default.stripe_webhook_secret);
    }
    catch (error) {
        console.error('Webhook signature verification failed:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            payloadType: typeof payload,
            payloadPreview: typeof payload === 'string'
                ? payload.substring(0, 100)
                : payload.toString().substring(0, 100),
            signature: signature.substring(0, 50) + '...',
        });
        // In development, you might want to skip verification for testing
        if (config_1.default.node_env === 'development' &&
            process.env.SKIP_WEBHOOK_VERIFICATION === 'true') {
            console.warn('⚠️  DEVELOPMENT: Skipping webhook signature verification');
            try {
                return JSON.parse(payload.toString());
            }
            catch (parseError) {
                console.error('JSON parsing error:', parseError);
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid JSON payload');
            }
        }
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Invalid webhook signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.constructWebhookEvent = constructWebhookEvent;
