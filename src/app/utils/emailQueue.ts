import sendMail from './mailer';

interface EmailJob {
  id: string;
  to: string;
  subject: string;
  body: string;
  attachmentPath?: string;
  retries: number;
  maxRetries: number;
  createdAt: Date;
}

class EmailQueue {
  private queue: EmailJob[] = [];
  private processing = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  async addEmail(
    to: string,
    subject: string,
    body: string,
    attachmentPath?: string,
  ): Promise<string> {
    const job: EmailJob = {
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

    // Start processing if not already processing
    if (!this.processing) {
      this.processQueue();
    }

    return job.id;
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(
      `Starting to process email queue. Queue size: ${this.queue.length}`,
    );

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) continue;

      try {
        await this.processEmailJob(job);
        console.log(`Successfully sent email ${job.id} to ${job.to}`);
      } catch (error) {
        console.error(`Failed to process email job ${job.id}:`, error);

        // Retry logic
        if (job.retries < job.maxRetries) {
          job.retries++;
          console.log(
            `Retrying email ${job.id} (attempt ${job.retries}/${job.maxRetries})`,
          );

          // Add back to queue after delay
          setTimeout(() => {
            this.queue.push(job);
            if (!this.processing) {
              this.processQueue();
            }
          }, this.RETRY_DELAY);
        } else {
          console.error(
            `Email ${job.id} failed after ${job.maxRetries} attempts`,
          );
        }
      }
    }

    this.processing = false;
    console.log('Email queue processing completed');
  }

  private async processEmailJob(job: EmailJob): Promise<void> {
    const timeoutPromise = new Promise(
      (_, reject) =>
        setTimeout(() => reject(new Error('Email job timeout')), 25000), // 25 seconds
    );

    const emailPromise = sendMail(
      job.to,
      job.subject,
      job.body,
      job.attachmentPath,
    );

    await Promise.race([emailPromise, timeoutPromise]);
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  isProcessing(): boolean {
    return this.processing;
  }
}

// Create a singleton instance
const emailQueue = new EmailQueue();

export default emailQueue;
