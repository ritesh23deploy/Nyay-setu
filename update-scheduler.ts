import { scheduledLegalUpdates } from './legal-data';
import { storage } from '../storage';

// Default update interval in milliseconds (6 hours)
const DEFAULT_UPDATE_INTERVAL = 6 * 60 * 60 * 1000;

/**
 * Scheduler for regular legal data updates
 */
export class LegalUpdateScheduler {
  private updateInterval: number;
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastUpdateTime: Date | null = null;

  constructor(updateIntervalMs: number = DEFAULT_UPDATE_INTERVAL) {
    this.updateInterval = updateIntervalMs;
  }

  /**
   * Start the scheduler for regular updates
   */
  public start(): void {
    if (this.isRunning) {
      console.log('Update scheduler is already running');
      return;
    }

    console.log(`Starting legal update scheduler with interval of ${this.updateInterval / 1000 / 60} minutes`);
    this.isRunning = true;
    this.scheduleNextUpdate();
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('Update scheduler is not running');
      return;
    }

    console.log('Stopping legal update scheduler');
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Schedule the next update
   */
  private scheduleNextUpdate(): void {
    if (!this.isRunning) return;

    this.timer = setTimeout(async () => {
      try {
        console.log('Running scheduled legal update...');
        const result = await scheduledLegalUpdates();
        
        // Record this update if there were any changes
        if (result.sectionsAdded > 0 || result.updatesAdded > 0) {
          this.lastUpdateTime = new Date();
          console.log(`Update completed: Added ${result.sectionsAdded} sections and ${result.updatesAdded} updates`);
          
          // Add a system update notification if there were significant changes
          if (result.sectionsAdded + result.updatesAdded > 0) {
            const updateTitle = 'Legal Database Updated';
            const updateTitleHindi = 'कानूनी डेटाबेस अपडेट किया गया';
            const updateDesc = `The legal database has been updated with ${result.sectionsAdded} new sections and ${result.updatesAdded} legal updates.`;
            const updateDescHindi = `कानूनी डेटाबेस को ${result.sectionsAdded} नए अनुभागों और ${result.updatesAdded} कानूनी अपडेट के साथ अपडेट किया गया है।`;
            
            await storage.createUpdate({
              title: updateTitle,
              titleHindi: updateTitleHindi,
              description: updateDesc,
              descriptionHindi: updateDescHindi,
              date: new Date(),
              link: null
            });
            console.log('Created system update notification');
          }
        } else {
          console.log('No changes in scheduled update');
        }
      } catch (error) {
        console.error('Error in scheduled update:', error);
      } finally {
        // Schedule next update regardless of success/failure
        this.scheduleNextUpdate();
      }
    }, this.updateInterval);
  }

  /**
   * Get information about scheduler status
   */
  public getStatus(): { running: boolean; lastUpdate: Date | null; interval: number } {
    return {
      running: this.isRunning,
      lastUpdate: this.lastUpdateTime,
      interval: this.updateInterval
    };
  }

  /**
   * Update the scheduler interval
   * @param newIntervalMs New interval in milliseconds
   */
  public setUpdateInterval(newIntervalMs: number): void {
    this.updateInterval = newIntervalMs;
    console.log(`Update interval changed to ${newIntervalMs / 1000 / 60} minutes`);
    
    // Restart scheduler with new interval if it's already running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Force an immediate update
   */
  public async forceUpdate(): Promise<any> {
    console.log('Forcing immediate legal update...');
    try {
      const result = await scheduledLegalUpdates();
      this.lastUpdateTime = new Date();
      return result;
    } catch (error) {
      console.error('Error in forced update:', error);
      throw error;
    }
  }
}

// Create a singleton instance of the scheduler
export const legalUpdateScheduler = new LegalUpdateScheduler();