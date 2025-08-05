import { Component, signal } from '@angular/core';
import { GameComponent } from './game/game.component';

@Component({
  selector: 'app-root',
  imports: [GameComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ai-base-game');
}
