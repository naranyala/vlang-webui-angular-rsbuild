import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BatteryData {
  percent: number;
  status: string;
  time_left: string;
  icon: string;
  color: string;
}

declare global {
  interface Window {
    webui: {
      getBatteryInfo: () => Promise<string>;
    };
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  percent = signal(0);
  status = signal('--');
  timeLeft = signal('--');
  icon = signal('🔋');
  color = signal('#4ade80');
  lastUpdated = signal('--');
  barClass = signal('');

  private intervalId: any;

  ngOnInit() {
    this.refresh();
    this.intervalId = setInterval(() => this.refresh(), 10000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async refresh() {
    try {
      const data = await (window as any).webui.getBatteryInfo();
      const battery: BatteryData = JSON.parse(data);
      this.percent.set(battery.percent);
      this.status.set(battery.status);
      this.timeLeft.set(battery.time_left);
      this.icon.set(battery.icon);
      this.color.set(battery.color);
      this.lastUpdated.set(new Date().toLocaleTimeString());

      if (battery.percent < 30) {
        this.barClass.set('low');
      } else if (battery.percent < 60) {
        this.barClass.set('medium');
      } else {
        this.barClass.set('');
      }
    } catch (e) {
      console.error('Error:', e);
    }
  }
}
