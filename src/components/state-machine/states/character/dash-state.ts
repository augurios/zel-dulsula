import { PLAYER_DASH_DURATION, PLAYER_DASH_SPEED } from '../../../../common/config';
import { isArcadePhysicsBody } from '../../../../common/utils';
import { CharacterGameObject } from '../../../../game-objects/common/character-game-object';
import { BaseCharacterState } from './base-character-state';
import { CHARACTER_STATES } from './character-states';

export class DashState extends BaseCharacterState {
  #dashTimer!: Phaser.Time.TimerEvent;
  #collisionCallback!: () => void;

  constructor(gameObject: CharacterGameObject) {
    super(CHARACTER_STATES.DASH_STATE, gameObject);
  }

  public onEnter(): void {
    if (!isArcadePhysicsBody(this._gameObject.body)) {
      return;
    }

    // Determine dash direction from current input (not stored direction)
    const controls = this._gameObject.controls;
    let dashDirection = this._gameObject.direction;
    
    // Reset velocity
    this._gameObject.body.velocity.x = 0;
    this._gameObject.body.velocity.y = 0;

    // Set velocity based on input (allows diagonal movement)
    if (controls.isUpDown) {
      this._gameObject.body.velocity.y = -1;
      dashDirection = 'UP';
    } else if (controls.isDownDown) {
      this._gameObject.body.velocity.y = 1;
      dashDirection = 'DOWN';
    }

    if (controls.isLeftDown) {
      this._gameObject.body.velocity.x = -1;
      this._gameObject.setFlipX(true);
      dashDirection = 'LEFT';
    } else if (controls.isRightDown) {
      this._gameObject.body.velocity.x = 1;
      this._gameObject.setFlipX(false);
      dashDirection = 'RIGHT';
    }

    // Normalize and scale to dash speed (handles diagonals correctly)
    this._gameObject.body.velocity.normalize().scale(PLAYER_DASH_SPEED);

    // Update the character's direction to match dash direction (for animation)
    this._gameObject.direction = dashDirection;

    // Play walk animation in dash direction (reusing walk animations)
    this._gameObject.animationComponent.playAnimation(`WALK_${dashDirection}`);

    // Make player invulnerable during dash
    // this._gameObject.invulnerableComponent.isInvulnerable = true;

    // Set up collision callback for bounce-back
    this._collisionCallback = this.#handleWallCollision.bind(this);
    this._gameObject.body.onCollide = true;

    // Start dash timer
    this.#dashTimer = this._gameObject.scene.time.addEvent({
      delay: PLAYER_DASH_DURATION,
      callback: () => {
        this.#endDash();
      },
    });
  }

  public onUpdate(): void {
    if (!isArcadePhysicsBody(this._gameObject.body)) {
      return;
    }

    // Check for wall collision (blocked movement means we hit a wall)
    if (this._gameObject.body.blocked.up || this._gameObject.body.blocked.down ||
        this._gameObject.body.blocked.left || this._gameObject.body.blocked.right) {
      this.#handleWallCollision();
    }
  }

  #handleWallCollision(): void {
    if (!isArcadePhysicsBody(this._gameObject.body)) {
      return;
    }

    // Bounce back in opposite direction
    this._gameObject.body.velocity.x *= -0.5;
    this._gameObject.body.velocity.y *= -0.5;

    // End dash early
    if (this.#dashTimer) {
      this.#dashTimer.destroy();
    }
    this.#endDash();
  }

  #endDash(): void {
    // Remove invulnerability
    // this._gameObject.invulnerableComponent.isInvulnerable = false;

    // Clean up collision callback
    if (isArcadePhysicsBody(this._gameObject.body)) {
      this._gameObject.body.onCollide = false;
    }

    // Reset velocity
    this._resetObjectVelocity();

    // Transition to appropriate state based on input
    const controls = this._gameObject.controls;
    if (controls.isDownDown || controls.isUpDown || controls.isLeftDown || controls.isRightDown) {
      this._stateMachine.setState(CHARACTER_STATES.MOVE_STATE);
    } else {
      this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
    }
  }
}
