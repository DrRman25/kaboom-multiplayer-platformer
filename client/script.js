import kaboom from "https://unpkg.com/kaboom@next/dist/kaboom.mjs";

const name = document.getElementById("name").value;
const spriteImage = ["bean", "mark", "bobo", "gigagantrum"][Math.floor(Math.random() * 4)];

const socket = io();
socket.emit("new player", {
    name,
    spriteImage
});

kaboom({
    background: [85, 170, 255]
});

loadSprite("bean", "sprites/bean.png");
loadSprite("mark", "sprites/mark.png");
loadSprite("bobo", "sprites/bobo.png");
loadSprite("gigagantrum", "sprites/gigagantrum.png");
loadSprite("ghosty", "sprites/ghosty.png");
loadSprite("spike", "sprites/spike.png");
loadSprite("grass", "sprites/grass.png");
loadSprite("prize", "sprites/jumpy.png");
loadSprite("apple", "sprites/apple.png");
loadSprite("portal", "sprites/portal.png");
loadSprite("coin", "sprites/coin.png");
loadSprite("steel", "sprites/steel.png");
loadSprite("bag", "sprites/bag.png");
loadSound("coin", "sounds/score.mp3");
loadSound("powerup", "sounds/powerup.mp3");
loadSound("blip", "sounds/blip.mp3");
loadSound("hit", "sounds/hit.mp3");
loadSound("portal", "sounds/portal.mp3");

setGravity(3200);

function big() {
    let timer = 0;
    let isBig = false;
    let destScale = 1;
    return {
        // Component name (ID)
        id: "big",
        // Requires scale component
        require: ["scale"],
        // Runs every frame
        update() {
            if (isBig) {
                timer -= dt();
                if (timer <= 0) {
                    this.smallify();
                }
            }
            this.scale = this.scale.lerp(vec2(destScale), dt() * 6);
        },
        // Custom methods
        isBig() {
            return isBig;
        },
        smallify() {
            destScale = 1;
            timer = 0;
            isBig = false;
        },
        biggify(time) {
            destScale = 2;
            timer = time;
            isBig = true;
        }
    };
}

function patrol(speed = 60, dir = 1) {
    return {
        id: "patrol",
        require: ["pos", "area"],
        add() {
            this.on("collide", (obj, col) => {
                if (col.isLeft() || col.isRight()) {
                    dir = -dir;
                }
            });
        },
        update() {
            this.move(speed * dir, 0);
        }
    };
}

const player = add([
    sprite(spriteImage),
    anchor("bot"),
    pos(0, 0),
    scale(1),
    z(1),
    big(),
    area(),
    body()
]);

const playerNameLabel = add([
    text(name),
    anchor("bot"),
    color(255, 0, 255),
    pos(player.pos.x, player.pos.y - player.height - 4),
    scale(0.75),
    z(1)
]);

const moveSpeed = 480;
const jumpForce = 1320;
const fallDeath = 2400;

const level = addLevel([
    "                                      $                           ",
    "                                      $                           ",
    "                                      $     $    $    $    $     $",
    "                                      $     $    $    $    $     $",
    "    0                                 $                           ",
    "   --                  $$         =   $                           ",
    "       $$     %      ====         =   $                           ",
    " %    ===                         =   $                           ",
    "                                  =                               ",
    "   ^^  > =         ^^      = >    =     ^^^^>^^^^>^^^^>^^^^>^^^^^@",
    "=================================================================="
], {
    tileWidth: 64,
    tileHeight: 64,
    tiles: {
        "=": () => [
            sprite("grass"),
            anchor("bot"),
            area(),
            body({isStatic: true}),
            offscreen({hide: true})
        ],
        "$": () => [
            sprite("coin"),
            anchor("bot"),
            pos(0, -9),
            area(),
            offscreen({hide: true}),
            "coin"
        ],
        "%": () => [
            sprite("prize"),
            anchor("bot"),
            area(),
            body({isStatic: true}),
            offscreen({hide: true}),
            "prize"
        ],
        "^": () => [
            sprite("spike"),
            anchor("bot"),
            area(),
            body({isStatic: true}),
            offscreen({hide: true}),
            "danger"
        ],
        "#": () => [
            sprite("apple"),
            anchor("bot"),
            area(),
            body(),
            offscreen({hide: true}),
            "apple"
        ],
        ">": () => [
            sprite("ghosty"),
            anchor("bot"),
            area(),
            body(),
            patrol(),
            offscreen({hide: true}),
            "enemy"
        ],
        "0": () => [
            sprite("bag"),
            anchor("bot"),
            area(),
            body({isStatic: true}),
            offscreen({hide: true})
        ],
        "-": () => [
            sprite("steel"),
            anchor("bot"),
            area(),
            body({isStatic: true}),
            offscreen({hide: true})
        ],
        "@": () => [
            sprite("portal"),
            area({scale: 0.5}),
            anchor("bot"),
            pos(0, -12),
            offscreen({hide: true}),
            "portal"
        ]
    }
});

let flipX = false;
let frozen = false;

onKeyDown("left", () => {
    player.move(-moveSpeed, 0);
    flipX = true;
    player.flipX = true;
});
onKeyDown("right", () => {
    player.move(moveSpeed, 0);
    flipX = false;
    player.flipX = false;
});

onKeyDown("up", () => {
    if (player.isGrounded()) {
        player.jump(jumpForce);
    }
});
onKeyDown("space", () => {
    if (player.isGrounded()) {
        player.jump(jumpForce);
    }
});

onKeyPress("down", () => {
    player.gravityScale = 3;
});
onKeyRelease("down", () => {
    player.gravityScale = 1;
});

onKeyPress("f", () => {
    frozen = !frozen;
});

let coins = 0;

player.onUpdate(() => {
    camPos(player.pos);
    if (player.pos.y >= fallDeath) {
        player.pos = vec2(0, 0);
        play("hit");
    }
    playerNameLabel.pos = vec2(player.pos.x, player.pos.y - (player.height * player.scale.x) - 4);
});

player.onBeforePhysicsResolve(collision => {
    if (collision.target.is(["platform", "soft"]) && player.isJumping()) {
        collision.preventResolution();
    }
});

player.onPhysicsResolve(() => {
    camPos(player.pos);
    playerNameLabel.pos = vec2(player.pos.x, player.pos.y - (player.height * player.scale.x) - 4);
});

player.onCollide("danger", () => {
    player.pos = vec2(0, 0);
    play("hit");
});

player.onCollide("portal", () => {
    player.pos = vec2(0, 0);
    play("portal");
});

player.onGround(l => {
    if (l.is("enemy")) {
        player.jump(jumpForce * 1.5);
        destroy(l);
        addKaboom(player.pos);
        play("powerup");
    }
});

player.onCollide("enemy", (e, col) => {
    if (!col.isBottom()) {
        player.pos = vec2(0, 0);
        play("hit");
    }
});

let hasApple = false;

player.onHeadbutt(obj => {
    if (obj.is("prize") && !hasApple) {
        const apple = level.spawn("#", obj.tilePos.sub(0, 1));
        apple.jump();
        hasApple = true;
        play("blip");
    }
});

player.onCollide("apple", a => {
    destroy(a);
    player.biggify(3);
    hasApple = false;
    play("powerup");
});

let coinPitch = 0;

onUpdate(() => {
    if (coinPitch > 0) {
        coinPitch = Math.max(0, coinPitch - dt() * 100);
    }
});

player.onCollide("coin", c => {
    destroy(c);
    play("coin", {
        detune: coinPitch
    });
    coinPitch += 100;
    coins++;
    coinsLabel.text = coins;
});

const coinsLabel = add([
    text(coins),
    pos(24, 24),
    fixed()
]);

socket.on("state", gameState => {
    destroyAll("otherPlayer");
    for (let player in gameState.players) {
        const playerInfo = gameState.players[player];
        if (playerInfo.name === name) {
            continue;
        }
        add([
            sprite(playerInfo.spriteImage),
            anchor("bot"),
            pos(playerInfo.x, playerInfo.y),
            scale(playerInfo.playerScale),
            opacity(0.8),
            "otherPlayer"
        ]).flipX = playerInfo.flipX;
        add([
            text(playerInfo.name),
            anchor("bot"),
            pos(playerInfo.x, playerInfo.y - (playerInfo.height * playerInfo.playerScale) - 4),
            scale(0.75),
            "otherPlayer"
        ]);
    }
});

setInterval(() => {
    if (!frozen) {
        socket.emit("player movement", {
            x: player.pos.x,
            y: player.pos.y,
            width: player.width,
            height: player.height,
            scale: player.scale.x,
            flipX
        });
    }
}, 1000 / 60);
