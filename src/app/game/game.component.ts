import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  private readonly width = 1080;
  private readonly height = 1080;

  private player = {
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    vx: 0,
    vy: 0,
    speed: 5,
    jumping: false
  };

  private gravity = 0.5;
  private platforms: Platform[] = [
    { x: 300, y: 800, width: 200, height: 20 }
  ];

  private keys: Record<string, boolean> = {};

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas rendering context not available');
    }
    this.ctx = context;
    requestAnimationFrame(() => this.gameLoop());
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    this.keys[event.key] = true;
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    this.keys[event.key] = false;
  }

  private gameLoop(): void {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  private update(): void {
    if (this.keys['ArrowLeft'] || this.keys['a']) {
      this.player.vx = -this.player.speed;
    } else if (this.keys['ArrowRight'] || this.keys['d']) {
      this.player.vx = this.player.speed;
    } else {
      this.player.vx = 0;
    }

    if ((this.keys['ArrowUp'] || this.keys['w'] || this.keys[' ']) && !this.player.jumping) {
      this.player.vy = -10;
      this.player.jumping = true;
    }

    this.player.vy += this.gravity;
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    if (this.player.y + this.player.height > this.height) {
      this.player.y = this.height - this.player.height;
      this.player.vy = 0;
      this.player.jumping = false;
    }

    for (const p of this.platforms) {
      const withinX = this.player.x < p.x + p.width && this.player.x + this.player.width > p.x;
      const hittingTop = this.player.y + this.player.height <= p.y + this.player.vy && this.player.y + this.player.height + this.player.vy >= p.y;
      if (withinX && hittingTop && this.player.vy >= 0) {
        this.player.y = p.y - this.player.height;
        this.player.vy = 0;
        this.player.jumping = false;
      }
    }
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

    this.ctx.fillStyle = 'gray';
    for (const p of this.platforms) {
      this.ctx.fillRect(p.x, p.y, p.width, p.height);
    }

    this.ctx.fillRect(0, this.height - 10, this.width, 10);
  }
}

