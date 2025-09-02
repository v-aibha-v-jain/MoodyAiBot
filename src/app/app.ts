import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class App {
  modes = [
    { name: 'Normal', value: 'normal' },
    { name: 'Fun', value: 'fun' },
    { name: 'Anger', value: 'anger' },
    { name: 'Love', value: 'love' },
    { name: 'Random', value: 'random' }
  ];
  selectedMode = 'normal';
  showDropdown = false;
  conversation: string[] = [];
  chatLog: Array<{ sender: 'user' | 'bot', text: string }> = [];
  userInput = '';

  get selectedModeName() {
    return this.modes.find(m => m.value === this.selectedMode)?.name || 'Normal';
  }

  userAvatar: SafeHtml;
  botAvatar: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {
    this.userAvatar = this.sanitizer.bypassSecurityTrustHtml(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="12" r="7" fill="#1976d2"/>
        <ellipse cx="16" cy="24" rx="10" ry="6" fill="#1976d2"/>
        <circle cx="16" cy="12" r="5" fill="#fff"/>
      </svg>
    `);
    this.botAvatar = this.sanitizer.bypassSecurityTrustHtml(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="10" width="20" height="14" rx="7" fill="#444857"/>
        <rect x="10" y="14" width="12" height="6" rx="3" fill="#e0e0e0"/>
        <circle cx="12" cy="17" r="2" fill="#1976d2"/>
        <circle cx="20" cy="17" r="2" fill="#1976d2"/>
        <rect x="14" y="6" width="4" height="4" rx="2" fill="#444857"/>
      </svg>
    `);
  }

  modeThemes: Record<string, Record<string, string>> = {
    normal: {
      '--bg': '#181a20', '--container': '#23272f', '--logbg': '#181a20', '--text': '#e0e0e0', '--avatar': '#1976d2', '--botavatar': '#444857', '--bubble': '#1976d2', '--botbubble': '#23272f', '--bottext': '#e0e0e0', '--inputbg': '#2b2e35', '--accent': '#1976d2', '--accentHover': '#125ea2'
    },
    fun: {
      '--bg': '#fffbe7', '--container': '#ffe082', '--logbg': '#fffde4', '--text': '#3e2723', '--avatar': '#ffb300', '--botavatar': '#ffd54f', '--bubble': '#ffb300', '--botbubble': '#ffe082', '--bottext': '#3e2723', '--inputbg': '#fffde4', '--accent': '#ffb300', '--accentHover': '#ffa000'
    },
    anger: {
      '--bg': '#2d0909', '--container': '#5a1a1a', '--logbg': '#2d0909', '--text': '#ffb3b3', '--avatar': '#d32f2f', '--botavatar': '#b71c1c', '--bubble': '#d32f2f', '--botbubble': '#5a1a1a', '--bottext': '#ffb3b3', '--inputbg': '#3a1313', '--accent': '#d32f2f', '--accentHover': '#b71c1c'
    },
    love: {
      '--bg': '#fff0f6', '--container': '#f8bbd0', '--logbg': '#fff0f6', '--text': '#ad1457', '--avatar': '#ec407a', '--botavatar': '#f06292', '--bubble': '#ec407a', '--botbubble': '#f8bbd0', '--bottext': '#ad1457', '--inputbg': '#fff0f6', '--accent': '#ec407a', '--accentHover': '#ad1457'
    },
    random: {
      '--bg': '#e3f2fd', '--container': '#90caf9', '--logbg': '#e3f2fd', '--text': '#0d47a1', '--avatar': '#1976d2', '--botavatar': '#64b5f6', '--bubble': '#1976d2', '--botbubble': '#90caf9', '--bottext': '#0d47a1', '--inputbg': '#e3f2fd', '--accent': '#1976d2', '--accentHover': '#0d47a1'
    }
  };

  ngOnInit() {
    this.applyTheme(this.selectedMode);
  }

  applyTheme(mode: string) {
    const theme = this.modeThemes[mode] || this.modeThemes['normal'];
    for (const key in theme) {
      document.documentElement.style.setProperty(key, theme[key]);
    }
  }

  selectMode(mode: string, name: string) {
    this.selectedMode = mode;
    this.showDropdown = false;
    this.applyTheme(mode);
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  sendMessage() {
    const userMsg = this.userInput.trim();
    if (!userMsg) return;
    this.appendMessage('user', userMsg);
    this.userInput = '';
    this.sendMessageToBot(userMsg);
  }

  appendMessage(sender: 'user' | 'bot', text: string) {
    this.chatLog.push({ sender, text });
  }

  async sendMessageToBot(userMsg: string) {
    this.conversation.push(userMsg);
    try {
      const apiKey = localStorage.getItem('googleai_api_key') || '';
      const response = await fetch('https://moodyai.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: this.conversation, mode: this.selectedMode, api_key: apiKey })
      });
      const data = await response.json();
      if (data.response) {
        this.appendMessage('bot', data.response);
        this.conversation.push(data.response);
      } else {
        if ((data.error || '').toLowerCase().includes('api key') || (data.error || '').toLowerCase().includes('credit')) {
          this.showApiKeyPopup();
        }
        this.appendMessage('bot', 'Error: ' + (data.error || 'No response'));
      }
    } catch (err) {
      this.appendMessage('bot', 'Error: Could not reach server.');
    }
  }

  showApiKeyPopup() {
    alert('Your API key is invalid or out of credits. Please enter a new Google AI API key.');
  }
}
