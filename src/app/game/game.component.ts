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
  @ViewChild('gameCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  private frameId?: number;

  private player = {
    x: 100,
    y: 0,
    width: 50,
    height: 50,
    vx: 0,
    vy: 0,
    onGround: false
  };

  private gravity = 0.5;
  private moveSpeed = 5;
  private jumpStrength = 12;
  private keys: Record<string, boolean> = {};

  private platforms: Platform[] = [
    // Bottom ground covering the whole width
    { x: 0, y: 1040, width: 1080, height: 40 },
    // Example additional platform
    { x: 300, y: 800, width: 200, height: 20 }
  ];

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.gameLoop();
  }

  private gameLoop(): void {
    this.update();
    this.draw();
    this.frameId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(): void {
    if (this.keys['ArrowLeft'] || this.keys['a']) {
      this.player.vx = -this.moveSpeed;
    } else if (this.keys['ArrowRight'] || this.keys['d']) {
      this.player.vx = this.moveSpeed;
    } else {
      this.player.vx = 0;
    }

    this.player.vy += this.gravity;
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.onGround = false;

    const canvas = this.canvasRef.nativeElement;

    // Horizontal boundaries
    if (this.player.x < 0) {
      this.player.x = 0;
    }
    if (this.player.x + this.player.width > canvas.width) {
      this.player.x = canvas.width - this.player.width;
    }

    // Platform collisions
    for (const platform of this.platforms) {
      if (
        this.player.x < platform.x + platform.width &&
        this.player.x + this.player.width > platform.x &&
        this.player.y + this.player.height > platform.y &&
        this.player.y + this.player.height - this.player.vy <= platform.y
      ) {
        this.player.y = platform.y - this.player.height;
        this.player.vy = 0;
        this.player.onGround = true;
      }
    }
  }

  private draw(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Platforms
    ctx.fillStyle = '#888';
    for (const platform of this.platforms) {
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }

    // Player
    ctx.fillStyle = '#0f0';
    ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    this.keys[event.key] = true;
    if ((event.key === 'ArrowUp' || event.key === ' ') && this.player.onGround) {
      this.player.vy = -this.jumpStrength;
      this.player.onGround = false;
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    this.keys[event.key] = false;
  }
}

