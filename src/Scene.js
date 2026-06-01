import { ctx, INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { TILE } from './CONFIG.js';
import { Physics } from './Physics.js';
import { TilemapRenderer } from './TilemapRenderer.js';
import { Camera } from './Camera.js';
import { Player } from './entities/Player.js';
import { Boomerang } from './entities/Boomerang.js';
import { Enemy } from './entities/Enemy.js';
import { Boss } from './entities/Boss.js';
import { ParticleSystem } from './entities/Particles.js';
import { LootDrop } from './entities/LootDrop.js';
import { Portal } from './Portal.js';
import { Door } from './Door.js';
import { DungeonEntrance } from './DungeonEntrance.js';
import { ENEMY_TEMPLATES } from './EnemyTemplates.js';
import { transitionTo, isInputBlocked } from './Transition.js';
import { STATES } from './GameStateManager.js';
import * as Input from './Input.js';
import { playerData } from './GameData.js';
import {
    setItemsDB, addItem, rollLoot, calculateStats, initInventory,
    socketCrystal, getEquippedItem
} from './Inventory.js';

const GROUND_COLORS = {
    1: '#87CEEB',
    2: '#5b8731',
    3: '#8b6914',
};

function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export class Scene {
    constructor(config) {
        this.config = config;
        this.ready = false;
        this.player = null;
        this.boomerang = null;
        this.enemies = [];
        this.totalEnemies = 0;
        this.enemiesKilled = 0;
        this.boss = null;
        this._bossDeathHandled = false;
        this.door = null;
        this.physics = null;
        this.tilemap = null;
        this.particles = null;
        this.camera = null;
        this.portals = [];
        this.dungeonEntrances = [];
        this.lootDrops = [];
        this.mapPixelW = 0;
        this.mapPixelH = 0;
        this._debugInfo = { playerX: null, playerY: null, entityCount: 0 };
    }

    load() {
        this.ready = false;
        const mapPromise = fetch(this.config.mapPath).then(r => r.json());
        const itemsPromise = fetch('data/items.json').then(r => r.json());

        Promise.all([mapPromise, itemsPromise])
            .then(([mapData, itemsData]) => {
                setItemsDB(itemsData);
                initInventory();
                this._init(mapData);
            })
            .catch(err => console.error('Failed to load scene:', err));
    }

    destroy() {
        this.ready = false;
        this.player = null;
        this.boomerang = null;
        this.enemies = [];
        this.boss = null;
        this.door = null;
        this.physics = null;
        this.tilemap = null;
        this.camera = null;
        this.portals = [];
        this.dungeonEntrances = [];
        this.lootDrops = [];
        this.particles = null;
    }

    _init(mapData) {
        this.tilemap = new TilemapRenderer();
        this.tilemap.load(mapData, null);

        this.physics = new Physics();
        this.physics.setMap(this.tilemap);
        this.physics.onDeath = () => {
            this._handleDeath();
        };

        this.camera = new Camera();
        this.particles = new ParticleSystem();

        const entities = mapData.entities || [];
        const spawn = entities.find(e => e.type === 'player_spawn');
        const sx = spawn ? spawn.x * TILE : 0;
        const sy = spawn ? spawn.y * TILE : 0;

        this.player = new Player(sx, sy);

        if (playerData.health > 0 && playerData.health <= this.player.maxHealth) {
            this.player.health = playerData.health;
        } else {
            this.player.health = this.player.maxHealth;
        }

        this.mapPixelW = this.tilemap.mapW * TILE;
        this.mapPixelH = this.tilemap.mapH * TILE;

        this.portals = [];
        this.enemies = [];
        this.boss = null;
        this._bossDeathHandled = false;
        this.door = null;
        this.enemiesKilled = 0;
        this.lootDrops = [];

        for (const e of entities) {
            if (e.type === 'portal') {
                this.portals.push(new Portal(e.x, e.y, e.target));
            } else if (e.type === 'enemy' || e.type === 'enemy_spawn') {
                const template = ENEMY_TEMPLATES[e.enemyType || 'slime'];
                if (template) {
                    this.enemies.push(new Enemy(e.x * TILE, e.y * TILE, template));
                }
            } else if (e.type === 'boss') {
                this.boss = new Boss(e.x * TILE, e.y * TILE);
            }
        }

        this.totalEnemies = this.enemies.length;

        if (this.config.dungeonEntrances) {
            for (let i = 0; i < this.config.dungeonEntrances.length; i++) {
                const de = this.config.dungeonEntrances[i];
                const entrance = new DungeonEntrance(de.x, de.y, de.dungeonID, i);
                entrance.cleared = !!de.cleared;
                this.dungeonEntrances.push(entrance);
            }
        }

        this.camera.snapTo(this.player.body.centerX, this.player.body.centerY, this.mapPixelW, this.mapPixelH);

        this.ready = true;
    }

    update(dt) {
        if (!this.ready) return;

        this.player.tick();

        const blocked = isInputBlocked();

        if (!blocked) {
            this.player.handleInput();
            if (this.config.type !== 'hub') {
                this._handleAttack();
            }
            this._handlePortals();
            this._handleDoor();
            this._handleDungeonEntrances();
            this._handleLootPickup();
        }

        this.physics.update(this.player.body);

        if (this.player.body.dead) {
            this._handleDeath();
            return;
        }

        for (const enemy of this.enemies) {
            enemy.update(this.player.body, this.tilemap);
            this.physics.update(enemy.body);
        }

        if (this.boss) {
            this.boss.update(this.player.body);
            if (!this.boss.isDead) {
                this.physics.update(this.boss.body);
            }
        }

        this._updateBoomerang();
        this._checkPlayerEnemyCollision();
        this._removeDeadEnemies();

        if (this.boss) {
            this._checkBossContactDamage();
            this._checkBossProjectiles();
            this._checkBossSlam();
            this._handleBossDeath();
        }

        if (this.player.health <= 0) {
            this._handleDeath();
            return;
        }

        this._checkRoomClear();

        this.particles.update();
        this.camera.follow(this.player.body.centerX, this.player.body.centerY);
        this.camera.clamp(this.mapPixelW, this.mapPixelH);

        for (const portal of this.portals) {
            portal.update(dt);
        }
        if (this.door) {
            this.door.update(dt);
        }
        for (const entrance of this.dungeonEntrances) {
            entrance.update(dt);
        }
        for (const loot of this.lootDrops) {
            loot.update(dt);
        }

        this._updateDebugInfo();
    }

    _handleDeath() {
        if (this.config.onPlayerDeath) {
            this.config.onPlayerDeath();
            return;
        }
        this.player.respawn();
        this.boomerang = null;
        this.player.canAttack = true;
    }

    _handleAttack() {
        if (Input.attackPressed() && this.player.canAttack && !this.boomerang) {
            const cx = this.player.body.centerX;
            const cy = this.player.body.centerY;
            this.boomerang = new Boomerang(cx, cy, this.player.facing);
            this.player.canAttack = false;

            this.particles.emit(cx, cy, 6, {
                speedMin: 0.5, speedMax: 1.5,
                lifeMin: 6, lifeMax: 12,
                size: 2,
                colors: ['#ffeb3b', '#fff', '#ff9800'],
            });
        }
    }

    _handlePortals() {
        for (const portal of this.portals) {
            if (portal.isPlayerNear(this.player.body) && Input.interactPressed()) {
                const targetState = STATES[portal.target];
                if (targetState) {
                    transitionTo(targetState);
                }
                return;
            }
        }
    }

    _handleDoor() {
        if (!this.door || !this.door.active) return;
        if (this.door.isPlayerNear(this.player.body) && Input.interactPressed()) {
            if (this.config.onRoomCleared) {
                this.config.onRoomCleared();
            }
        }
    }

    _handleDungeonEntrances() {
        for (const entrance of this.dungeonEntrances) {
            if (!entrance.cleared && entrance.isPlayerNear(this.player.body) && Input.interactPressed()) {
                if (this.config.onDungeonEnter) {
                    this.config.onDungeonEnter(entrance);
                }
                return;
            }
        }
    }

    _handleLootPickup() {
        for (let i = this.lootDrops.length - 1; i >= 0; i--) {
            const loot = this.lootDrops[i];
            if (!loot.active) continue;

            if (loot.isPlayerNear(this.player.body) && Input.interactPressed()) {
                const success = addItem(loot.itemId, 1);
                if (success) {
                    loot.active = false;
                    this.lootDrops.splice(i, 1);

                    this.particles.emit(loot.x + loot.w / 2, loot.y + loot.h / 2, 6, {
                        speedMin: 0.3, speedMax: 1.0,
                        lifeMin: 8, lifeMax: 15,
                        size: 2,
                        colors: ['#fff', '#ffeb3b', '#4caf50'],
                    });

                    playerData.inventoryMessage = 'Picked up item';
                    playerData.inventoryMessageTimer = 1.0;
                } else {
                    playerData.inventoryMessage = 'Inventory full!';
                    playerData.inventoryMessageTimer = 1.5;
                }
                return;
            }
        }
    }

    _updateBoomerang() {
        if (!this.boomerang) return;

        this.boomerang.update(this.player.body.centerX, this.player.body.centerY);

        if (!this.boomerang.active) {
            this.boomerang = null;
            this.player.canAttack = true;
            this.particles.emit(this.player.body.centerX, this.player.body.centerY, 4, {
                speedMin: 0.3, speedMax: 1.0,
                lifeMin: 5, lifeMax: 10,
                size: 2,
                colors: ['#ffeb3b', '#fff'],
            });
            return;
        }

        const bs = this.boomerang.size;
        const bx = this.boomerang.x - bs / 2;
        const by = this.boomerang.y - bs / 2;
        const dmg = this.player.damage;

        for (const enemy of this.enemies) {
            if (enemy.isDead) continue;
            if (!this.boomerang.canHit(enemy.id)) continue;

            if (aabbOverlap(bx, by, bs, bs, enemy.body.pos.x, enemy.body.pos.y, enemy.body.w, enemy.body.h)) {
                const dir = Math.sign(this.boomerang.vx) || this.player.facing;
                const killed = enemy.takeDamage(dmg, dir);
                this.boomerang.registerHit(enemy.id);

                this.particles.emit(enemy.body.centerX, enemy.body.centerY, 5, {
                    speedMin: 0.5, speedMax: 1.5,
                    lifeMin: 5, lifeMax: 10,
                    size: 2,
                    colors: ['#fff', '#ffeb3b'],
                });

                if (killed) {
                    this.enemiesKilled++;
                    this.particles.emit(enemy.body.centerX, enemy.body.centerY, 8, {
                        speedMin: 0.3, speedMax: 1.0,
                        lifeMin: 10, lifeMax: 20,
                        size: 3,
                        colors: ['#ffc107', '#ffeb3b', '#fff'],
                    });
                }
            }
        }

        if (this.boss && !this.boss.isDead && this.boomerang && this.boomerang.canHit(this.boss.id)) {
            if (aabbOverlap(bx, by, bs, bs, this.boss.body.pos.x, this.boss.body.pos.y, this.boss.body.w, this.boss.body.h)) {
                const killed = this.boss.takeDamage(dmg);
                this.boomerang.registerHit(this.boss.id);

                this.particles.emit(this.boss.body.centerX, this.boss.body.centerY, 5, {
                    speedMin: 0.5, speedMax: 1.5,
                    lifeMin: 5, lifeMax: 10,
                    size: 2,
                    colors: ['#fff', '#e040fb'],
                });

                if (killed) {
                    this.particles.emit(this.boss.body.centerX, this.boss.body.centerY, 12, {
                        speedMin: 0.5, speedMax: 2.0,
                        lifeMin: 15, lifeMax: 30,
                        size: 3,
                        colors: ['#7b1fa2', '#e040fb', '#fff', '#ffc107'],
                    });
                }
            }
        }

        if (this.boomerang) {
            this.particles.emit(this.boomerang.x, this.boomerang.y, 1, {
                speedMin: 0.1, speedMax: 0.4,
                lifeMin: 4, lifeMax: 8,
                size: 2,
                colors: ['#fff', '#ffeb3b'],
            });
        }
    }

    _checkPlayerEnemyCollision() {
        if (this.player._invincibleTimer > 0) return;

        const pb = this.player.body;
        for (const enemy of this.enemies) {
            if (enemy.isDead) continue;

            if (aabbOverlap(pb.pos.x, pb.pos.y, pb.w, pb.h, enemy.body.pos.x, enemy.body.pos.y, enemy.body.w, enemy.body.h)) {
                this.player.takeDamage(enemy.damage, enemy.body.centerX);
                break;
            }
        }
    }

    _checkBossContactDamage() {
        if (!this.boss || this.boss.isDead || this.player._invincibleTimer > 0) return;

        const pb = this.player.body;
        const bb = this.boss.body;
        if (aabbOverlap(pb.pos.x, pb.pos.y, pb.w, pb.h, bb.pos.x, bb.pos.y, bb.w, bb.h)) {
            this.player.takeDamage(this.boss.damage, bb.centerX);
        }
    }

    _checkBossProjectiles() {
        if (!this.boss || this.player._invincibleTimer > 0) return;

        const pb = this.player.body;
        for (let i = this.boss.projectiles.length - 1; i >= 0; i--) {
            const p = this.boss.projectiles[i];
            if (aabbOverlap(pb.pos.x, pb.pos.y, pb.w, pb.h, p.x - 2, p.y - 2, 4, 4)) {
                this.player.takeDamage(p.damage, p.x);
                this.particles.emit(p.x, p.y, 4, {
                    speedMin: 0.3, speedMax: 1.0,
                    lifeMin: 5, lifeMax: 10,
                    size: 2,
                    colors: ['#f44336', '#ffeb3b'],
                });
                this.boss.projectiles.splice(i, 1);
                break;
            }
        }
    }

    _checkBossSlam() {
        if (!this.boss || !this.boss.slamImpact || this.player._invincibleTimer > 0) return;

        const imp = this.boss.slamImpact;
        const dist = Math.abs(this.player.body.centerX - imp.x);
        if (dist < imp.radius) {
            this.player.takeDamage(imp.damage, imp.x);
        }

        this.particles.emit(imp.x, imp.y, 10, {
            speedMin: 0.5, speedMax: 2.0,
            lifeMin: 8, lifeMax: 16,
            size: 3,
            colors: ['#fff', '#ffeb3b', '#ff9800'],
        });
    }

    _handleBossDeath() {
        if (!this.boss || !this.boss.isDeathDone || this._bossDeathHandled) return;

        this._bossDeathHandled = true;

        const bossCX = this.boss.body.centerX;
        const bossCY = this.boss.body.centerY;
        const tileX = Math.floor(bossCX / TILE);
        const tileY = Math.floor(this.boss.body.pos.y / TILE);
        const portalTarget = this.config.bossPortalTarget || 'HUB';
        this.portals.push(new Portal(tileX + 2, tileY, portalTarget));

        const realm = playerData.realmUnlocked || 1;
        const droppedItems = rollLoot(realm);
        for (let i = 0; i < droppedItems.length; i++) {
            const offsetX = (i - (droppedItems.length - 1) / 2) * 14;
            const loot = new LootDrop(bossCX + offsetX - 4, bossCY - 4, droppedItems[i]);
            this.lootDrops.push(loot);
        }

        this.particles.emit(bossCX, bossCY, 20, {
            speedMin: 0.3, speedMax: 1.5,
            lifeMin: 15, lifeMax: 30,
            size: 4,
            colors: ['#ffc107', '#ff9800', '#fff', '#e040fb'],
        });

        if (this.config.onBossDefeated) {
            this.config.onBossDefeated();
        }
    }

    _removeDeadEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].isDead) {
                this.enemies.splice(i, 1);
            }
        }
    }

    _checkRoomClear() {
        if (this.door || this.boss) return;
        if (this.totalEnemies > 0 && this.enemiesKilled >= this.totalEnemies && this.enemies.length === 0) {
            if (this.config.roomType === 'combat') {
                const doorTileX = Math.floor(this.mapPixelW / TILE) - 2;
                const doorTileY = Math.floor(this.mapPixelH / TILE) - 3;
                this.door = new Door(doorTileX, doorTileY);
                this.door.active = true;

                this.particles.emit(doorTileX * TILE + TILE / 2, doorTileY * TILE, 8, {
                    speedMin: 0.3, speedMax: 1.0,
                    lifeMin: 10, lifeMax: 20,
                    size: 3,
                    colors: ['#ffeb3b', '#fff', '#ffc107'],
                });
            }
        }
    }

    _updateDebugInfo() {
        if (this.player) {
            this._debugInfo.playerX = this.player.body.pos.x;
            this._debugInfo.playerY = this.player.body.pos.y;
        }
        this._debugInfo.entityCount = 1 + this.enemies.length + (this.boomerang ? 1 : 0) + this.particles.count;
        this._debugInfo.enemiesKilled = this.enemiesKilled;
        this._debugInfo.lootDrops = this.lootDrops.length;
        if (this.boss) {
            this._debugInfo.bossHP = this.boss.hp;
            this._debugInfo.bossPhase = this.boss.phase;
        }
    }

    getDebugInfo() {
        return this._debugInfo;
    }

    render(c) {
        if (!this.ready) {
            c.fillStyle = '#000';
            c.fillRect(0, 0, INTERNAL_W, INTERNAL_H);
            return;
        }

        const cx = this.camera.x;
        const cy = this.camera.y;

        c.fillStyle = '#1a1a2e';
        c.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

        this._renderMap(c, cx, cy);

        for (const entrance of this.dungeonEntrances) {
            entrance.render(c, cx, cy);
        }

        for (const portal of this.portals) {
            portal.render(c, cx, cy);
        }

        if (this.door) {
            this.door.render(c, cx, cy);
        }

        for (const loot of this.lootDrops) {
            loot.render(c, cx, cy);
        }

        for (const enemy of this.enemies) {
            enemy.render(c, cx, cy);
        }

        if (this.boss) {
            this.boss.render(c, cx, cy);
        }

        this.particles.render(c, cx, cy);

        if (this.boomerang) {
            this.boomerang.render(c, cx, cy);
        }

        if (this.player) {
            this.player.render(c, cx, cy);
        }

        this._renderPrompts(c, cx, cy);
        this._renderHUD(c);
    }

    _renderMap(c, cameraX, cameraY) {
        if (this.tilemap.tileset) {
            this.tilemap.render(['background', 'ground', 'decor'], cameraX, cameraY);
            return;
        }

        const ground = this.tilemap.layers['ground'];
        const collision = this.tilemap.layers['collision'];
        if (!ground) return;

        const startCol = Math.max(0, Math.floor(cameraX / TILE));
        const startRow = Math.max(0, Math.floor(cameraY / TILE));
        const endCol = Math.min(startCol + Math.ceil(INTERNAL_W / TILE) + 1, this.tilemap.mapW);
        const endRow = Math.min(startRow + Math.ceil(INTERNAL_H / TILE) + 1, this.tilemap.mapH);

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const idx = row * this.tilemap.mapW + col;

                const bgTile = this.tilemap.layers['background']?.[idx];
                if (bgTile && bgTile > 0) {
                    const x = Math.floor(col * TILE - cameraX);
                    const y = Math.floor(row * TILE - cameraY);
                    c.fillStyle = GROUND_COLORS[bgTile] || '#555';
                    c.fillRect(x, y, TILE, TILE);
                }

                const tile = ground[idx];
                if (tile && tile > 0) {
                    const x = Math.floor(col * TILE - cameraX);
                    const y = Math.floor(row * TILE - cameraY);
                    c.fillStyle = GROUND_COLORS[tile] || '#888';
                    c.fillRect(x, y, TILE, TILE);
                }

                if (collision) {
                    const cTile = collision[idx];
                    if (cTile === 2) {
                        const x = Math.floor(col * TILE - cameraX);
                        const y = Math.floor(row * TILE - cameraY);
                        c.fillStyle = 'rgba(255, 255, 100, 0.6)';
                        c.fillRect(x, y, TILE, 2);
                    }
                }
            }
        }
    }

    _renderPrompts(c, cameraX, cameraY) {
        if (!this.player) return;
        for (const portal of this.portals) {
            if (portal.isPlayerNear(this.player.body)) {
                portal.renderPrompt(c, cameraX, cameraY);
            }
        }
        if (this.door && this.door.active && this.door.isPlayerNear(this.player.body)) {
            this.door.renderPrompt(c, cameraX, cameraY);
        }
        for (const entrance of this.dungeonEntrances) {
            if (entrance.isPlayerNear(this.player.body)) {
                entrance.renderPrompt(c, cameraX, cameraY);
            }
        }
        for (const loot of this.lootDrops) {
            if (loot.active && loot.isPlayerNear(this.player.body)) {
                loot.renderPrompt(c, cameraX, cameraY);
            }
        }
    }

    _renderHUD(c) {
        if (!this.player) return;
        const hearts = Math.ceil(this.player.maxHealth / 2);
        const heartSize = 6;
        const spacing = 2;
        const totalW = hearts * (heartSize + spacing) - spacing;
        const startX = Math.floor((INTERNAL_W - totalW) / 2);
        const startY = INTERNAL_H - heartSize - 4;

        for (let i = 0; i < hearts; i++) {
            const hx = startX + i * (heartSize + spacing);
            const hpForHeart = this.player.health - i * 2;

            if (hpForHeart >= 2) {
                c.fillStyle = '#e53935';
            } else if (hpForHeart === 1) {
                c.fillStyle = '#e53935';
                c.fillRect(hx, startY, heartSize / 2, heartSize);
                c.fillStyle = '#333';
                c.fillRect(hx + heartSize / 2, startY, heartSize / 2, heartSize);
                continue;
            } else {
                c.fillStyle = '#333';
            }
            c.fillRect(hx, startY, heartSize, heartSize);
        }

        c.save();
        c.font = '5px monospace';
        c.textAlign = 'right';
        c.fillStyle = '#ffc107';
        c.fillText('$' + playerData.coinsBank, INTERNAL_W - 4, 10);
        c.restore();
    }
}
