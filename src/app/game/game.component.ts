import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

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
export class GameComponent implements OnInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId = 0;

  private keys = { left: false, right: false, up: false };

  private player = {
    x: 100,
    y: 900,
    width: 50,
    height: 50,
    vx: 0,
    vy: 0
  };

  private readonly gravity = 0.5;
  private readonly friction = 0.8;
  private readonly width = 1080;
  private readonly height = 1080;

  private platforms: Platform[] = [
    { x: 0, y: 1030, width: 1080, height: 50 }, // floor
    { x: 300, y: 800, width: 200, height: 20 }  // sample platform
  ];

  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.loop();
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    cancelAnimationFrame(this.animationFrameId);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowLeft' || event.key === 'a') {
      this.keys.left = true;
    }
    if (event.key === 'ArrowRight' || event.key === 'd') {
      this.keys.right = true;
    }
    if (event.key === 'ArrowUp' || event.key === ' ') {
      this.keys.up = true;
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowLeft' || event.key === 'a') {
      this.keys.left = false;
    }
    if (event.key === 'ArrowRight' || event.key === 'd') {
      this.keys.right = false;
    }
    if (event.key === 'ArrowUp' || event.key === ' ') {
      this.keys.up = false;
    }
  };

  private loop = (): void => {
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(): void {
    if (this.keys.left) {
      this.player.vx -= 0.5;
    }
    if (this.keys.right) {
      this.player.vx += 0.5;
    }
    if (this.keys.up && this.isOnGround()) {
      this.player.vy = -12;
    }

    this.player.vy += this.gravity;
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.vx *= this.friction;

    this.platforms.forEach(p => {
      if (
        this.player.x < p.x + p.width &&
        this.player.x + this.player.width > p.x &&
        this.player.y + this.player.height > p.y &&
        this.player.y + this.player.height - this.player.vy <= p.y
      ) {
        this.player.y = p.y - this.player.height;
        this.player.vy = 0;
      }
    });

    if (this.player.x < 0) {
      this.player.x = 0;
      this.player.vx = 0;
    }
    if (this.player.x + this.player.width > this.width) {
      this.player.x = this.width - this.player.width;
      this.player.vx = 0;
    }
  }

  private isOnGround(): boolean {
    return this.platforms.some(p =>
      this.player.x < p.x + p.width &&
      this.player.x + this.player.width > p.x &&
      this.player.y + this.player.height === p.y
    );
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#ddd';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

    this.ctx.fillStyle = '#888';
    this.platforms.forEach(p => {
      this.ctx.fillRect(p.x, p.y, p.width, p.height);
    });
  }
}
