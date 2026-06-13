// In-memory queue implementation
// Can be swapped to BullMQ + Redis in production

class ReviewQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.workers = 2; // Max concurrent jobs
    this.activeJobs = 0;
  }

  async add(jobData) {
    return new Promise((resolve, reject) => {
      this.queue.push({ jobData, resolve, reject });
      console.log(`Queue: Job added. Queue size: ${this.queue.length}`);
      this.process();
    });
  }

  async process() {
    if (this.activeJobs >= this.workers || this.queue.length === 0) return;

    const job = this.queue.shift();
    this.activeJobs++;

    console.log(`Queue: Processing job. Active jobs: ${this.activeJobs}`);

    try {
      const result = await job.jobData.handler();
      job.resolve(result);
    } catch (err) {
      job.reject(err);
    } finally {
      this.activeJobs--;
      console.log(`Queue: Job done. Active jobs: ${this.activeJobs}`);
      this.process(); // Process next job
    }
  }

  getStats() {
    return {
      queued: this.queue.length,
      active: this.activeJobs,
      workers: this.workers,
    };
  }
}

const reviewQueue = new ReviewQueue();
module.exports = reviewQueue;