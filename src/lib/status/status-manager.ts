// src/lib/status/status-manager.ts - CENTRALIZED STATUS MANAGEMENT
import { EventEmitter } from 'events';

export interface StatusUpdate {
  id: string;
  type: 'info' | 'success' | 'error' | 'progress' | 'data';
  phase: 'planning' | 'discovery' | 'enrichment' | 'email_writing' | 'complete' | 'error';
  message: string;
  timestamp: string;
  data?: any;
  progress?: number; // 0-100
  duration?: string;
}

export interface ProcessingPhase {
  phase: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  duration?: string;
  updates: StatusUpdate[];
}

export class StatusManager extends EventEmitter {
  private updates: StatusUpdate[] = [];
  private phases: Map<string, ProcessingPhase> = new Map();
  private currentPhase: string | null = null;
  private sessionId: string;
  
  constructor(sessionId?: string) {
    super();
    this.sessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.initializePhases();
  }

  private initializePhases() {
    const phaseNames = ['planning', 'discovery', 'enrichment', 'email_writing'];
    phaseNames.forEach(phase => {
      this.phases.set(phase, {
        phase,
        status: 'pending',
        updates: []
      });
    });
  }

  // Start a new phase
  startPhase(phase: string, message: string) {
    this.currentPhase = phase;
    const phaseData = this.phases.get(phase);
    if (phaseData) {
      phaseData.status = 'in_progress';
      phaseData.startTime = Date.now();
    }
    
    this.addUpdate({
      type: 'info',
      phase: phase as any,
      message,
      data: { phase, action: 'start' }
    });
  }

  // Complete a phase
  completePhase(phase: string, message: string, data?: any) {
    const phaseData = this.phases.get(phase);
    if (phaseData) {
      phaseData.status = 'completed';
      phaseData.endTime = Date.now();
      if (phaseData.startTime) {
        phaseData.duration = `${((phaseData.endTime - phaseData.startTime) / 1000).toFixed(1)}s`;
      }
    }
    
    this.addUpdate({
      type: 'success',
      phase: phase as any,
      message,
      data: { ...data, phase, action: 'complete', duration: phaseData?.duration }
    });
  }

  // Fail a phase
  failPhase(phase: string, message: string, error?: any) {
    const phaseData = this.phases.get(phase);
    if (phaseData) {
      phaseData.status = 'failed';
      phaseData.endTime = Date.now();
      if (phaseData.startTime) {
        phaseData.duration = `${((phaseData.endTime - phaseData.startTime) / 1000).toFixed(1)}s`;
      }
    }
    
    this.addUpdate({
      type: 'error',
      phase: 'error',
      message,
      data: { error: error?.message || error, phase, action: 'fail' }
    });
  }

  // Add progress update
  updateProgress(phase: string, message: string, progress?: number, data?: any) {
    this.addUpdate({
      type: 'progress',
      phase: phase as any,
      message,
      progress,
      data: { ...data, phase, action: 'progress' }
    });
  }

  // Add data update (for showing results)
  updateData(phase: string, message: string, data: any) {
    this.addUpdate({
      type: 'data',
      phase: phase as any,
      message,
      data: { ...data, phase, action: 'data' }
    });
  }

  // Add info update
  updateInfo(phase: string, message: string, data?: any) {
    this.addUpdate({
      type: 'info',
      phase: phase as any,
      message,
      data: { ...data, phase, action: 'info' }
    });
  }

  // Add success update
  updateSuccess(phase: string, message: string, data?: any) {
    this.addUpdate({
      type: 'success',
      phase: phase as any,
      message,
      data: { ...data, phase, action: 'success' }
    });
  }

  // Generic add update method
  private addUpdate(update: Omit<StatusUpdate, 'id' | 'timestamp'>) {
    const fullUpdate: StatusUpdate = {
      id: `${this.sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...update
    };
    
    this.updates.push(fullUpdate);
    
    // Add to phase updates
    const phaseData = this.phases.get(update.phase);
    if (phaseData) {
      phaseData.updates.push(fullUpdate);
    }
    
    // Emit the update for real-time consumption
    this.emit('update', fullUpdate);
    this.emit('status', this.getStatus());
    
    // Also emit specific events
    this.emit(update.type, fullUpdate);
    this.emit(`phase:${update.phase}`, fullUpdate);
  }

  // Get current status
  getStatus() {
    return {
      sessionId: this.sessionId,
      currentPhase: this.currentPhase,
      phases: Array.from(this.phases.values()),
      updates: this.updates,
      summary: this.getSummary()
    };
  }

  // Get summary for quick overview
  getSummary() {
    const totalPhases = this.phases.size;
    const completedPhases = Array.from(this.phases.values()).filter(p => p.status === 'completed').length;
    const failedPhases = Array.from(this.phases.values()).filter(p => p.status === 'failed').length;
    const inProgressPhases = Array.from(this.phases.values()).filter(p => p.status === 'in_progress').length;
    
    let overallStatus: 'pending' | 'in_progress' | 'completed' | 'failed' = 'pending';
    
    if (failedPhases > 0) {
      overallStatus = 'failed';
    } else if (completedPhases === totalPhases) {
      overallStatus = 'completed';
    } else if (inProgressPhases > 0) {
      overallStatus = 'in_progress';
    }
    
    return {
      overallStatus,
      totalPhases,
      completedPhases,
      failedPhases,
      inProgressPhases,
      progress: Math.round((completedPhases / totalPhases) * 100)
    };
  }

  // Get all updates
  getAllUpdates(): StatusUpdate[] {
    return [...this.updates];
  }

  // Get updates since a timestamp
  getUpdatesSince(timestamp: string): StatusUpdate[] {
    return this.updates.filter(update => update.timestamp > timestamp);
  }

  // Get updates for a specific phase
  getPhaseUpdates(phase: string): StatusUpdate[] {
    const phaseData = this.phases.get(phase);
    return phaseData ? [...phaseData.updates] : [];
  }

  // Clear all updates (for cleanup)
  clear() {
    this.updates = [];
    this.phases.clear();
    this.currentPhase = null;
    this.initializePhases();
  }

  // Get formatted message for display
  getDisplayMessage(update: StatusUpdate): string {
    return update.message;
  }

  // Get user-friendly status for frontend
  getUserStatus(): {
    phase: string;
    message: string;
    progress: number;
    isComplete: boolean;
    hasError: boolean;
    data?: any;
  } {
    const summary = this.getSummary();
    const lastUpdate = this.updates[this.updates.length - 1];
    
    return {
      phase: this.currentPhase || 'initializing',
      message: lastUpdate?.message || 'Starting...',
      progress: summary.progress,
      isComplete: summary.overallStatus === 'completed',
      hasError: summary.overallStatus === 'failed',
      data: lastUpdate?.data
    };
  }
}

// Singleton instance for global use
export const globalStatusManager = new StatusManager();

// Helper function to create a new status manager for a request
export function createStatusManager(sessionId?: string): StatusManager {
  return new StatusManager(sessionId);
}