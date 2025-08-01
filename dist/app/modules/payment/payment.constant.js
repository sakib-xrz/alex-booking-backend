"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEBHOOK_EVENTS = exports.PAYMENT_STATUS = void 0;
exports.PAYMENT_STATUS = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
};
exports.WEBHOOK_EVENTS = {
    PAYMENT_SUCCEEDED: 'payment_intent.succeeded',
    PAYMENT_FAILED: 'payment_intent.payment_failed',
    PAYMENT_CANCELED: 'payment_intent.canceled',
};
