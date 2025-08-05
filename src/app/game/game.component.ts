import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  speed: number;
  jumpStrength: number;
  grounded: boolean;
}

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements AfterViewInit {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  private readonly width = 1080;
  private readonly height = 1080;
  private readonly gravity = 0.8;

  private player: Player = {
    x: 50,
    y: 0,
    width: 50,
    height: 50,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpStrength: 15,
    grounded: false
  };

  // The first platform is the ground. Add more platforms to build a level.
  private platforms: Platform[] = [
    { x: 0, y: this.height - 50, width: this.width, height: 50 },
    { x: 200, y: 900, width: 200, height: 20 },
    { x: 600, y: 750, width: 300, height: 20 }
  ];

  private keys = { left: false, right: false, jump: false };

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    requestAnimationFrame(() => this.gameLoop());
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') this.keys.left = true;
    if (event.code === 'ArrowRight' || event.code === 'KeyD') this.keys.right = true;
    if (event.code === 'Space' || event.code === 'ArrowUp') this.keys.jump = true;
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') this.keys.left = false;
    if (event.code === 'ArrowRight' || event.code === 'KeyD') this.keys.right = false;
    if (event.code === 'Space' || event.code === 'ArrowUp') this.keys.jump = false;
  }

  private gameLoop(): void {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  private update(): void {
    if (this.keys.left) this.player.vx = -this.player.speed;
    else if (this.keys.right) this.player.vx = this.player.speed;
    else this.player.vx = 0;

    if (this.keys.jump && this.player.grounded) {
      this.player.vy = -this.player.jumpStrength;
      this.player.grounded = false;
    }

    this.player.vy += this.gravity;

    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    this.player.grounded = false;
    for (const platform of this.platforms) {
      if (
        this.player.x < platform.x + platform.width &&
        this.player.x + this.player.width > platform.x &&
        this.player.y < platform.y + platform.height &&
        this.player.y + this.player.height > platform.y
      ) {
        if (this.player.vy >= 0 && this.player.y + this.player.height - this.player.vy <= platform.y) {
          this.player.y = platform.y - this.player.height;
          this.player.vy = 0;
          this.player.grounded = true;
        }
      }
    }

    // keep player in bounds
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x + this.player.width > this.width) this.player.x = this.width - this.player.width;
  }

  private draw(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw player
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

    // draw platforms
    this.ctx.fillStyle = '#666';
    for (const platform of this.platforms) {
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }
  }
}

