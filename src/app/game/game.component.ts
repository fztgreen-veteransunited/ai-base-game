import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  type?: 'normal' | 'transition' | 'final';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

enum LifeStage {
  BIRTH = 0,
  CHILDHOOD = 1,
  ADOLESCENCE = 2,
  YOUNG_ADULT = 3,
  ADULT = 4,
  MIDDLE_AGE = 5,
  ELDERLY = 6,
  ASCENSION = 7
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
    vy: 0,
    lifeStage: LifeStage.BIRTH,
    age: 0,
    color: '#ffb3ba'
  };

  private readonly gravity = 0.5;
  private readonly friction = 0.8;
  private readonly width = 1080;
  private readonly height = 1080;

  private particles: Particle[] = [];
  private transitionEffect = false;
  private ascensionStarted = false;
  private backgroundGradient = 0;

  private platforms: Platform[] = [
    // Birth/Ground level (0-150px height)
    { x: 0, y: 1030, width: 1080, height: 50, color: '#8fbc8f', type: 'normal' },
    { x: 200, y: 950, width: 150, height: 20, color: '#98fb98', type: 'normal' },
    
    // Childhood (150-300px height)
    { x: 50, y: 850, width: 120, height: 20, color: '#ffb347', type: 'transition' },
    { x: 400, y: 780, width: 180, height: 20, color: '#ffb347', type: 'normal' },
    { x: 800, y: 730, width: 120, height: 20, color: '#ffb347', type: 'normal' },
    
    // Adolescence (300-450px height)
    { x: 100, y: 650, width: 140, height: 20, color: '#87ceeb', type: 'transition' },
    { x: 500, y: 580, width: 160, height: 20, color: '#87ceeb', type: 'normal' },
    { x: 750, y: 520, width: 140, height: 20, color: '#87ceeb', type: 'normal' },
    
    // Young Adult (450-600px height)
    { x: 80, y: 450, width: 120, height: 20, color: '#dda0dd', type: 'transition' },
    { x: 350, y: 380, width: 180, height: 20, color: '#dda0dd', type: 'normal' },
    { x: 650, y: 320, width: 150, height: 20, color: '#dda0dd', type: 'normal' },
    
    // Adult (600-750px height)
    { x: 150, y: 250, width: 140, height: 20, color: '#f0e68c', type: 'transition' },
    { x: 450, y: 180, width: 200, height: 20, color: '#f0e68c', type: 'normal' },
    { x: 800, y: 120, width: 120, height: 20, color: '#f0e68c', type: 'normal' },
    
    // Middle Age (750-900px height)  
    { x: 200, y: 80, width: 160, height: 20, color: '#cd853f', type: 'transition' },
    { x: 500, y: 40, width: 180, height: 20, color: '#cd853f', type: 'normal' },
    
    // Elderly (900-1050px height)
    { x: 300, y: 20, width: 120, height: 20, color: '#d3d3d3', type: 'transition' },
    
    // Final Ascension Platform
    { x: 450, y: 10, width: 180, height: 10, color: '#ffd700', type: 'final' }
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
        
        if (p.type === 'transition') {
          this.checkLifeStageTransition();
        }
        
        if (p.type === 'final' && !this.ascensionStarted) {
          this.startAscension();
        }
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

    this.updateLifeStage();
    this.updateParticles();
    
    if (this.ascensionStarted) {
      this.updateAscension();
    }
  }

  private isOnGround(): boolean {
    return this.platforms.some(p =>
      this.player.x < p.x + p.width &&
      this.player.x + this.player.width > p.x &&
      this.player.y + this.player.height === p.y
    );
  }

  private updateLifeStage(): void {
    const height = this.height - this.player.y;
    const previousStage = this.player.lifeStage;
    
    if (height < 150) {
      this.player.lifeStage = LifeStage.BIRTH;
      this.player.color = '#ffb3ba';
      this.backgroundGradient = 0;
    } else if (height < 300) {
      this.player.lifeStage = LifeStage.CHILDHOOD;
      this.player.color = '#ffdfba';
      this.backgroundGradient = 0.1;
    } else if (height < 450) {
      this.player.lifeStage = LifeStage.ADOLESCENCE;
      this.player.color = '#ffffba';
      this.backgroundGradient = 0.2;
    } else if (height < 600) {
      this.player.lifeStage = LifeStage.YOUNG_ADULT;
      this.player.color = '#baffba';
      this.backgroundGradient = 0.3;
    } else if (height < 750) {
      this.player.lifeStage = LifeStage.ADULT;
      this.player.color = '#baffc9';
      this.backgroundGradient = 0.4;
    } else if (height < 900) {
      this.player.lifeStage = LifeStage.MIDDLE_AGE;
      this.player.color = '#bae1ff';
      this.backgroundGradient = 0.5;
    } else if (height < 1050) {
      this.player.lifeStage = LifeStage.ELDERLY;
      this.player.color = '#c9baff';
      this.backgroundGradient = 0.6;
    }
    
    if (previousStage !== this.player.lifeStage && previousStage !== undefined) {
      this.createTransitionEffect();
    }
    
    this.player.age = Math.floor(height / 15);
  }

  private checkLifeStageTransition(): void {
    if (!this.transitionEffect) {
      this.createTransitionEffect();
    }
  }

  private createTransitionEffect(): void {
    this.transitionEffect = true;
    
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 60,
        maxLife: 60,
        color: this.player.color,
        size: Math.random() * 4 + 2
      });
    }
    
    setTimeout(() => {
      this.transitionEffect = false;
    }, 1000);
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life--;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private startAscension(): void {
    this.ascensionStarted = true;
    this.player.lifeStage = LifeStage.ASCENSION;
    this.player.color = '#ffd700';
    
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * -8 - 2,
        life: 120,
        maxLife: 120,
        color: '#ffd700',
        size: Math.random() * 6 + 3
      });
    }
  }

  private updateAscension(): void {
    this.player.y -= 2;
    this.player.x += Math.sin(Date.now() * 0.01) * 0.5;
    
    if (Math.random() < 0.3) {
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        life: 60,
        maxLife: 60,
        color: '#ffd700',
        size: Math.random() * 3 + 1
      });
    }
    
    this.backgroundGradient = Math.min(1, this.backgroundGradient + 0.01);
  }

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    
    if (this.ascensionStarted) {
      gradient.addColorStop(0, '#87ceeb');
      gradient.addColorStop(0.3, '#ffd700');
      gradient.addColorStop(1, '#ffffff');
    } else {
      const earthColor = `rgba(${135 + this.backgroundGradient * 50}, ${206 + this.backgroundGradient * 49}, ${235 + this.backgroundGradient * 20}, 1)`;
      const skyColor = `rgba(${255 - this.backgroundGradient * 100}, ${240 - this.backgroundGradient * 100}, ${220 - this.backgroundGradient * 100}, 1)`;
      
      gradient.addColorStop(0, skyColor);
      gradient.addColorStop(1, earthColor);
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawPlayer(): void {
    this.ctx.save();
    
    if (this.transitionEffect) {
      this.ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.02) * 0.3;
    }
    
    if (this.ascensionStarted) {
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 20;
    }
    
    this.ctx.fillStyle = this.player.color;
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    if (this.player.lifeStage === LifeStage.ELDERLY) {
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(this.player.x + 10, this.player.y + 5, 30, 5);
    }
    
    this.ctx.restore();
  }

  private drawParticles(): void {
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
      this.ctx.restore();
    });
  }

  private drawUI(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 200, 80);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Age: ${this.player.age}`, 20, 30);
    this.ctx.fillText(`Stage: ${LifeStage[this.player.lifeStage]}`, 20, 50);
    
    if (this.ascensionStarted) {
      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = '24px Arial';
      this.ctx.fillText('ASCENDING...', 20, 80);
    }
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    this.drawBackground();
    
    this.platforms.forEach(p => {
      this.ctx.fillStyle = p.color || '#888';
      this.ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    this.drawPlayer();
    this.drawParticles();
    this.drawUI();
  }
}
