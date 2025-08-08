import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  type?: 'normal' | 'transition' | 'final';
}

interface CharacterTexture {
  emoji: string;
  size: number;
  offsetX: number;
  offsetY: number;
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
    color: '#ffb3ba',
    texture: { emoji: '👶', size: 40, offsetX: 5, offsetY: 5 }
  };

  private readonly gravity = 0.5;
  private readonly friction = 0.8;
  private readonly width = 1080;
  private readonly height = 1080;
  private readonly jumpHeight = 14;
  private readonly maxJumpDistance = 200;

  private particles: Particle[] = [];
  private transitionEffect = false;
  private ascensionStarted = false;
  private backgroundGradient = 0;
  showRestartPrompt = false;

  private platforms: Platform[] = [];

  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.generateCompletablePlatforms();
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
      this.player.vy = -this.jumpHeight;
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
    
    if (this.player.y > this.height + 100) {
      this.showRestartPrompt = true;
      setTimeout(() => this.restartGame(), 1000);
    }

    this.updateLifeStage();
    this.updateParticles();
    
    if (this.ascensionStarted) {
      this.updateAscension();
    }
  }

  restartGame(): void {
    this.player.x = 100;
    this.player.y = 900;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.lifeStage = LifeStage.BIRTH;
    this.player.age = 0;
    this.player.color = '#ffb3ba';
    this.player.texture = { emoji: '👶', size: 40, offsetX: 5, offsetY: 5 };
    this.particles = [];
    this.transitionEffect = false;
    this.ascensionStarted = false;
    this.backgroundGradient = 0;
    this.showRestartPrompt = false;
    this.generateCompletablePlatforms();
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
      this.player.texture = { emoji: '👶', size: 40, offsetX: 5, offsetY: 5 };
      this.backgroundGradient = 0;
    } else if (height < 300) {
      this.player.lifeStage = LifeStage.CHILDHOOD;
      this.player.color = '#ffdfba';
      this.player.texture = { emoji: '🧒', size: 42, offsetX: 4, offsetY: 4 };
      this.backgroundGradient = 0.1;
    } else if (height < 450) {
      this.player.lifeStage = LifeStage.ADOLESCENCE;
      this.player.color = '#ffffba';
      this.player.texture = { emoji: '🧑', size: 44, offsetX: 3, offsetY: 3 };
      this.backgroundGradient = 0.2;
    } else if (height < 600) {
      this.player.lifeStage = LifeStage.YOUNG_ADULT;
      this.player.color = '#baffba';
      this.player.texture = { emoji: '🙋', size: 46, offsetX: 2, offsetY: 2 };
      this.backgroundGradient = 0.3;
    } else if (height < 750) {
      this.player.lifeStage = LifeStage.ADULT;
      this.player.color = '#baffc9';
      this.player.texture = { emoji: '👨', size: 48, offsetX: 1, offsetY: 1 };
      this.backgroundGradient = 0.4;
    } else if (height < 900) {
      this.player.lifeStage = LifeStage.MIDDLE_AGE;
      this.player.color = '#bae1ff';
      this.player.texture = { emoji: '👨‍🦲', size: 48, offsetX: 1, offsetY: 1 };
      this.backgroundGradient = 0.5;
    } else if (height < 1050) {
      this.player.lifeStage = LifeStage.ELDERLY;
      this.player.color = '#c9baff';
      this.player.texture = { emoji: '👴', size: 48, offsetX: 1, offsetY: 1 };
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

  private generateCompletablePlatforms(): void {
    this.platforms = [];
    
    const levels = [
      { name: 'Birth', yRange: [950, 1030], color: '#8fbc8f' },
      { name: 'Childhood', yRange: [780, 900], color: '#ffb347' },
      { name: 'Adolescence', yRange: [630, 750], color: '#87ceeb' },
      { name: 'Young Adult', yRange: [480, 600], color: '#dda0dd' },
      { name: 'Adult', yRange: [330, 450], color: '#f0e68c' },
      { name: 'Middle Age', yRange: [180, 300], color: '#cd853f' },
      { name: 'Elderly', yRange: [80, 150], color: '#d3d3d3' },
      { name: 'Ascension', yRange: [10, 60], color: '#ffd700' }
    ];

    this.platforms.push({ x: 0, y: 1030, width: 1080, height: 50, color: '#8fbc8f', type: 'normal' });
    
    let lastPlatform = { x: 100, y: 1030, width: 50 };
    
    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
      const level = levels[levelIndex];
      const isTransitionLevel = levelIndex > 0;
      const isLastLevel = levelIndex === levels.length - 1;
      
      const platformCount = isLastLevel ? 1 : Math.floor(Math.random() * 3) + 2;
      const levelPlatforms: Platform[] = [];
      
      for (let i = 0; i < platformCount; i++) {
        let attempts = 0;
        let validPlatform: Platform | null = null;
        
        while (attempts < 50 && !validPlatform) {
          const platform: Platform = {
            x: Math.random() * (this.width - 200) + 50,
            y: level.yRange[1] + Math.random() * (level.yRange[0] - level.yRange[1]),
            width: Math.random() * 100 + 120,
            height: 20,
            color: level.color,
            type: isLastLevel ? 'final' : (isTransitionLevel && i === 0 ? 'transition' : 'normal')
          };
          
          if (this.isPlatformReachable(platform, lastPlatform, levelPlatforms)) {
            validPlatform = platform;
          }
          attempts++;
        }
        
        if (validPlatform) {
          levelPlatforms.push(validPlatform);
          if (i === platformCount - 1) {
            lastPlatform = { x: validPlatform.x, y: validPlatform.y, width: validPlatform.width };
          }
        }
      }
      
      this.platforms.push(...levelPlatforms);
    }
  }
  
  private isPlatformReachable(newPlatform: Platform, lastPlatform: any, levelPlatforms: Platform[]): boolean {
    const allReferencePlatforms = [...this.platforms, ...levelPlatforms];
    
    for (const refPlatform of allReferencePlatforms) {
      const horizontalDistance = Math.abs(newPlatform.x + newPlatform.width/2 - (refPlatform.x + refPlatform.width/2));
      const verticalDistance = Math.abs(newPlatform.y - refPlatform.y);
      
      if (horizontalDistance <= this.maxJumpDistance && verticalDistance <= 150) {
        const canReachHorizontally = horizontalDistance <= this.maxJumpDistance;
        const canReachVertically = newPlatform.y <= refPlatform.y || verticalDistance <= 150;
        
        if (canReachHorizontally && canReachVertically) {
          return true;
        }
      }
    }
    
    return false;
  }

  private startAscension(): void {
    this.ascensionStarted = true;
    this.player.lifeStage = LifeStage.ASCENSION;
    this.player.color = '#ffd700';
    this.player.texture = { emoji: '😇', size: 50, offsetX: 0, offsetY: 0 };
    
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
    
    this.ctx.font = `${this.player.texture.size}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    const centerX = this.player.x + this.player.width / 2 + this.player.texture.offsetX;
    const centerY = this.player.y + this.player.height / 2 + this.player.texture.offsetY;
    this.ctx.fillText(this.player.texture.emoji, centerX, centerY);
    
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
