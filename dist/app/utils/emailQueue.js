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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailer_1 = __importDefault(require("./mailer"));
class EmailQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 5000;
    }
    addEmail(to, subject, body, attachmentPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const job = {
                id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                to,
                subject,
                body,
                attachmentPath,
                retries: 0,
                maxRetries: this.MAX_RETRIES,
                createdAt: new Date(),
            };
            this.queue.push(job);
            console.log(`Email job ${job.id} added to queue for ${to}`);
            if (!this.processing) {
                this.processQueue();
            }
            return job.id;
        });
    }
    processQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.processing || this.queue.length === 0) {
                return;
            }
            this.processing = true;
            console.log(`Starting to process email queue. Queue size: ${this.queue.length}`);
            while (this.queue.length > 0) {
                const job = this.queue.shift();
                if (!job)
                    continue;
                try {
                    yield this.processEmailJob(job);
                    console.log(`Successfully sent email ${job.id} to ${job.to}`);
                }
                catch (error) {
                    console.error(`Failed to process email job ${job.id}:`, error);
                    if (job.retries < job.maxRetries) {
                        job.retries++;
                        console.log(`Retrying email ${job.id} (attempt ${job.retries}/${job.maxRetries})`);
                        setTimeout(() => {
                            this.queue.push(job);
                            if (!this.processing) {
                                this.processQueue();
                            }
                        }, this.RETRY_DELAY);
                    }
                    else {
                        console.error(`Email ${job.id} failed after ${job.maxRetries} attempts`);
                    }
                }
            }
            this.processing = false;
            console.log('Email queue processing completed');
        });
    }
    processEmailJob(job) {
        return __awaiter(this, void 0, void 0, function* () {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Email job timeout')), 25000));
            const emailPromise = (0, mailer_1.default)(job.to, job.subject, job.body, job.attachmentPath);
            yield Promise.race([emailPromise, timeoutPromise]);
        });
    }
    getQueueSize() {
        return this.queue.length;
    }
    isProcessing() {
        return this.processing;
    }
}
const emailQueue = new EmailQueue();
exports.default = emailQueue;
