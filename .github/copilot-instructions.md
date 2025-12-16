# Legend of the Wispguard - AI Coding Instructions

## Project Overview
Zelda-like action-adventure game built with Phaser 3, TypeScript, and Vite. Uses component-based entity architecture with state machines for character behavior.

## Core Architecture Patterns

### Component-Based Game Objects
- All game objects use composition via **components** that extend `BaseGameObjectComponent`
- Components attach themselves to game objects via dynamic property assignment: `gameObject['_ComponentName'] = this`
- Retrieve components with static getter: `ComponentName.getComponent<ComponentName>(gameObject)`
- Example components: `AnimationComponent`, `LifeComponent`, `SpeedComponent`, `DirectionComponent`, `InvulnerableComponent`

### State Machine System
- Characters (player + enemies) use `StateMachine` with states that implement the `State` interface
- All character states extend `BaseCharacterState` which holds reference to `CharacterGameObject`
- State transitions use `stateMachine.setState(STATE_NAME, ...args)` - queues if already transitioning
- States defined in `CHARACTER_STATES` constants (e.g., `IDLE_STATE`, `MOVE_STATE`, `ATTACK_STATE`, `HURT_STATE`)
- Update loop: call `stateMachine.update()` in game object's update method to process state queue and execute `onUpdate()`

### Character Hierarchy
- `CharacterGameObject` extends `Phaser.Physics.Arcade.Sprite` - base for all characters
- Contains: `_controlsComponent`, `_speedComponent`, `_directionComponent`, `_animationComponent`, `_invulnerableComponent`, `_lifeComponent`, `_stateMachine`
- Player and enemies extend `CharacterGameObject` and add their specific states to the state machine
- Animation configs map state names (e.g., `WALK_DOWN`, `IDLE_UP`) to Phaser animation keys

### Tiled Map Integration
- Levels built in Tiled editor, loaded via Phaser's Tilemap system
- Helper functions in `src/common/tiled/tiled-utils.ts` parse object layers for enemies, chests, doors, switches, pots
- Tiled objects have custom properties accessed via: `getTiledPropertyByName<T>(properties, 'propertyName')`
- Room-based gameplay: objects organized by `roomId`, only visible room's objects are enabled
- Layer naming convention: `TILED_LAYER_NAMES` constants for collision, objects, background, foreground

### Event-Driven Communication
- Global `EVENT_BUS` (Phaser EventEmitter) in `src/common/event-bus.ts`
- Events: `OPENED_CHEST`, `ENEMY_DESTROYED`, `PLAYER_DEFEATED`, `PLAYER_HEALTH_UPDATED`, `BOSS_DEFEATED`
- UI scene listens to events from game scene (e.g., health updates)
- Emit: `EVENT_BUS.emit(CUSTOM_EVENTS.EVENT_NAME, data)`

### Singleton Data Manager
- `DataManager.instance` holds persistent player data (health, room progress, chest states, unlocked doors)
- Persists between scenes - initialized once, accessed globally
- Updates trigger event bus notifications for UI synchronization

## Configuration & Constants
- All tunable values in `src/common/config.ts` (speeds, damage, durations, debug flags)
- Asset keys in `src/common/assets.ts` as const objects
- Enable debug logging: `ENABLE_LOGGING = true` in config
- Show collision zones: `DEBUG_COLLISION_ALPHA = 0.5` in config

## Development Workflow

### Commands (use `pnpm`)
- `pnpm install --frozen-lockfile` - install dependencies (uses pnpm, not npm)
- `pnpm start` - dev server at localhost:8080 with hot reload
- `pnpm build` - production build to `dist/`
- `pnpm lint` - ESLint with project config in `config/eslint.config.mjs`

### File Organization
- `src/game-objects/` - concrete game entities (Player, Spider, Wisp, Drow boss, Pot, Chest, Door, Button)
- `src/components/` - reusable behavior modules (state-machine, input, inventory, game-object components)
- `src/scenes/` - Phaser scenes (PreloadScene, GameScene, UiScene, GameOverScene)
- `src/common/` - shared utilities, types, constants, Tiled helpers
- `public/assets/` - static assets loaded via `assets.json` pack file

### Adding New Characters
1. Extend `CharacterGameObject` (see `src/game-objects/player/player.ts` or `src/game-objects/enemies/spider.ts`)
2. Create animation config mapping state names to animation keys
3. Instantiate and add states to `_stateMachine` (at minimum: Idle, Move, Hurt, Death)
4. Each state extends `BaseCharacterState` and implements `onEnter()` and/or `onUpdate()`
5. Add to scene's enemy group or player reference

### Adding New States
1. Create state class extending `BaseCharacterState` in `src/components/state-machine/states/character/`
2. Add constant to `CHARACTER_STATES` in `character-states.ts`
3. Implement `onEnter(args)` for initialization and `onUpdate()` for per-frame logic
4. Use `this._stateMachine.setState()` for transitions
5. Use `this._resetObjectVelocity()` to stop movement

## Key Phaser Patterns
- Physics bodies: check `isArcadePhysicsBody(body)` before accessing Arcade-specific properties
- Animations: use `ignoreIfPlaying: true` to prevent animation restart glitches
- Colliders: `scene.physics.add.overlap()` for non-blocking, `add.collider()` for blocking
- Depth sorting: objects in `GameScene` use y-based depth for proper layering
- Scale config: 256x224 native resolution, HEIGHT_CONTROLS_WIDTH scaling, pixelArt: true

## Common Gotchas
- State machines queue transitions during state changes - don't nest `setState()` calls
- Components store reference via `_ComponentName` - use static `getComponent()` to retrieve
- Direction uses DIRECTION constants (`UP`, `DOWN`, `LEFT`, `RIGHT`) not strings
- Tiled properties are arrays - use helper functions, don't access directly
- Game objects must call `enableObject()`/`disableObject()` for room-based visibility
- Assets preloaded via pack file (`public/assets/data/assets.json`) in PreloadScene
