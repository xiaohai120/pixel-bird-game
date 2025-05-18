let skyBg, landBg, bird, game, pipes;
let score = 0; // 当前得分
let highScore = 0; // 最高记录
let canRevive = false; // 是否可以复活
let revived = false; // 是否已经复活过
let gameStartedInSession = sessionStorage.getItem('gameStarted') === 'true'; 

// 考虑到计时器的使用频率非常的高，所以专门封装一个函数
// 该函数返回一个对象，对象包含两个属性
// start:创建一个计时器   stop:停止计时器
// duration:计时器每隔多少毫秒执行
// callback:每隔duration毫秒执行callback函数
// thisObj:为了得到正确的this指向
let getTimer = function (duration, thisObj, callback) {
    var timer = null;
    return {
        start: function () {
            if (!timer) {
                timer = setInterval(function () {
                    callback.bind(thisObj)();
                }, duration);
            }
        },
        stop: function () {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }
    };
}

// 更新得分显示
function updateScore() {
    document.getElementById('score').textContent = `通过柱子数量: ${score}`;
}

// 更新最高记录显示
function updateHighScore() {
    document.getElementById('highScore').textContent = `最高记录: ${highScore}`;
}

// 初始化最高记录
if (!gameStartedInSession) {
    highScore = localStorage.getItem('highScore') || 0;
    sessionStorage.setItem('gameStarted', 'true');
} else {
    highScore = localStorage.getItem('highScore') || 0;
}
updateHighScore();

// 系统对象，统一管理其他对象的开始和结束
game = {
    paused: true,  // 当前游戏是否暂停
    isGmaeOver: false, // 当前游戏是否结束
    dom: document.querySelector('#game'),
    start: function () {
        skyBg.timer.start();
        landBg.timer.start();
        bird.wingTimer.start();
        pipes.produceTimer.start();
        pipes.moveTimer.start();
        gameStartedInSession = true;
    },
    stop: function () {
        skyBg.timer.stop();
        landBg.timer.stop();
        bird.wingTimer.stop();
        pipes.produceTimer.stop();
        pipes.moveTimer.stop();
    },
    // 该方法用于判断游戏是否结束
    gameOver: function () {
        // 游戏有两种情况都会导致游戏结束：1.  小鸟落地  2. 小鸟碰撞柱子
        // 1. 小鸟落地
        if (bird.top === 462) {
            console.log('小鸟碰上地面，游戏结束');
            this.endGame();
        }
        // 2. 小鸟是否碰撞到柱子（需要检测碰撞）
        // 小鸟中心点
        let bx = bird.left + (bird.width / 2);
        let by = bird.top + (bird.height / 2);
        // 柱子中心点
        for (let i = 0; i < pipes.all.length; i++) {
            let p = pipes.all[i]; // 当前的柱子
            // 获取当前柱子的中心点
            let px = p.left + (p.width / 2);
            let py = p.top + (p.height / 2);
            // 判断是否碰撞
            if (Math.abs(bx - px) < (p.width + bird.width) / 2 &&
                Math.abs(by - py) < (p.height + bird.height) / 2) {
                console.log('小鸟碰上柱子，游戏结束');
                this.endGame();
            }
        }
    },
    endGame: function () {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
            updateHighScore();
            console.log('新纪录！');
        }
        this.isGmaeOver = true;
        this.stop();
    },
    revive: function () {
        if (canRevive) {
            this.isGmaeOver = false;
            // 重置小鸟位置
            bird.setTop(150);
            bird.show();
            // 重置柱子
            pipes.all.forEach(pipe => {
                pipe.dom.remove();
            });
            pipes.all = [];
            score = 0;
            updateScore();
            this.start();
            canRevive = false;
            revived = true;
        }
    }
}

// 天空对象
skyBg = {
    left: 0,
    dom: document.querySelector('#game .sky'),
    // 该方法用于重新更新天空的 left 值
    show: function () {
        this.dom.style.left = this.left + 'px'
    }
}
// 缩短时间间隔，增加步长
skyBg.timer = getTimer(15, skyBg, function () {
    this.left -= 2;
    if (this.left === -800) {
        this.left = 0;
    }
    this.show();
})

// 大地对象
landBg = {
    left: 0,
    dom: document.querySelector('#game .land'),
    show() {
        this.dom.style.left = this.left + 'px'
    }
}
// 缩短时间间隔，增加步长
landBg.timer = getTimer(15, landBg, function () {
    this.left -= 4;
    if (this.left === -800) {
        this.left = 0;
    }
    this.show();
})

// 小鸟对象
bird = {
    width: 33,
    height: 26,
    top: 150,
    left: 200,
    dom: document.querySelector('#game .bird'),
    wingIndex: 0, // 该属性用于记录当前小鸟的背景图片
    // 显示小鸟的方法：统一在 show 方法中显示小鸟的最终状态
    show: function () {
        // 根据图片的索引，来设置当前小鸟背景图的位置
        if (this.wingIndex === 0) {
            this.dom.style.backgroundPosition = '-8px -10px';
        } else if (this.wingIndex === 1) {
            this.dom.style.backgroundPosition = '-60px -10px';
        } else {
            this.dom.style.backgroundPosition = '-113px -10px';
        }
        // 设置小鸟的 top 值
        this.dom.style.top = this.top + 'px';
    },
    // 设置小鸟的 top 值
    setTop(newTop) {
        if (newTop < 0) {
            newTop = 0;
        }
        if (newTop > 462) {
            newTop = 462;
        }
        this.top = newTop;
    }
}
// 缩短小鸟扇动翅膀的时间间隔
bird.wingTimer = getTimer(50, bird, function () {
    // 这里面主要要做的事儿：修改 wingIndex，然后调用 show
    this.wingIndex = (this.wingIndex + 1) % 3;
    this.show();
});

// 上下的管道
pipes = {
    width: 52,
    getRandom: function (min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    },
    all: [],  // 用于存放所有的柱子
    gap: 80, // 减小上下柱子间的距离
    // 创建柱子的方法
    createPipe() {
        let minHeight = 60; // 柱子最小的高度
        maxHeight = 488 - this.gap - minHeight;
        // 接下来确定一组柱子的高度
        let h1 = this.getRandom(minHeight, maxHeight),
            h2 = 488 - this.gap - h1;
        // 接下来根据这两个高度来创建柱子
        // 上面的柱子
        let div1 = document.createElement("div");
        div1.className = "pipeup";
        div1.style.height = h1 + "px";
        div1.style.left = "800px";
        game.dom.appendChild(div1);
        this.all.push({
            dom: div1,
            height: h1,
            width: this.width,
            top: 0,
            left: 800,
            scored: false
        });
        // 下面的柱子
        let div2 = document.createElement("div");
        div2.className = "pipedown";
        div2.style.height = h2 + "px";
        div2.style.left = "800px";
        game.dom.appendChild(div2);
        this.all.push({
            dom: div2,
            height: h2,
            width: this.width,
            top: h1 + this.gap,
            left: 800,
            scored: false
        });
    },
}
// 缩短柱子生成的时间间隔，使密度翻倍（从 1200 改为 600）
pipes.produceTimer = getTimer(600, pipes, function () {
    this.createPipe();
})

// 移动柱子
pipes.moveTimer = getTimer(15, pipes, function () {
    // 因为要移动所有的柱子   && 对游戏进行积分
    for (let i = 0; i < this.all.length; i++) {
        let p = this.all[i]; // 得到当前的柱子
        p.left -= 7; // 增加柱子移动速度
        if (p.left < -p.width) {
            p.dom.remove();
            this.all.splice(i, 1);
            i--;
        } else {
            p.dom.style.left = p.left + 'px';
        }

        // 判断柱子是否过了小鸟，若过了则说明小鸟过了一根柱子
        if (p.left <= (bird.left - pipes.width) && !p.scored) {
            score++;
            updateScore();
            p.scored = true;
        }
    }
    game.gameOver(); // 每次柱子移动后，都需要判断游戏是否结束
});

// 监听鼠标移动事件
document.querySelector('#game').addEventListener('mousemove', function (e) {
    const gameRect = this.getBoundingClientRect();
    const mouseY = e.clientY - gameRect.top;
    bird.setTop(mouseY - bird.height / 2);
    bird.show();
});

document.documentElement.onkeydown = function (e) {
    if (e.key === 'Enter') {
        if (game.isGmaeOver) {
            // 清空柱子
            pipes.all.forEach(pipe => {
                pipe.dom.remove();
            });
            pipes.all = [];
            
            // 重置小鸟位置
            bird.setTop(150);
            
            // 重置分数
            score = 0;
            updateScore();
            
            // 重置游戏状态
            game.isGmaeOver = false;
            game.paused = true;
            
            // 重新开始游戏
            game.start();
        } else if (game.paused) {
            game.start();
            game.paused = !game.paused;
        } else {
            game.stop();
            game.paused = !game.paused;
        }
    } else if (e.key === 'R') {
        // 按下 R 键复活
        game.revive();
    }
}

// 当游戏页面被关闭时，清除本地存储的最高记录
window.addEventListener('beforeunload', function () {
    localStorage.removeItem('highScore');
    sessionStorage.removeItem('gameStarted');
});