const video = document.querySelector("video");
const worker = new Worker("/static/worker.js");

// ------------- Modify these variables if needed -------------
let threshold = 0.3; // Value above which a prediction is considered correct
let nc = 149; // Number of classes in the dataset (COCO = 80), (Pokemons = 149)
let frames = 1; // Number of frames skipped between detections (frames = 1 to detect on each frame)

// ------------ Uncomment the dataset classes used ------------
const classes = ['Abra', 'Aerodactyl', 'Alakazam', 'Arbok', 'Arcanine', 'Articuno', 'Beedrill', 'Bellsprout', 'Blastoise', 'Bulbasaur', 'Butterfree', 'Caterpie', 'Chansey', 'Charizard', 'Charmander', 'Charmeleon', 'Clefable', 'Clefairy', 'Cloyster', 'Cubone', 'Dewgong', 'Diglett', 'Ditto', 'Dodrio', 'Doduo', 'Dragonair', 'Dragonite', 'Dratini', 'Drowzee', 'Dugtrio', 'Eevee', 'Ekans', 'Electabuzz', 'Electrode', 'Exeggcute', 'Exeggutor', 'Farfetchd', 'Fearow', 'Flareon', 'Gastly', 'Gengar', 'Geodude', 'Gloom', 'Golbat', 'Goldeen', 'Golduck', 'Golem', 'Graveler', 'Grimer', 'Growlithe', 'Gyarados', 'Haunter', 'Hitmonchan', 'Hitmonlee', 'Horsea', 'Hypno', 'Ivysaur', 'Jigglypuff', 'Jolteon', 'Jynx', 'Kabuto', 'Kabutops', 'Kadabra', 'Kakuna', 'Kangaskhan', 'Kingler', 'Koffing', 'Krabby', 'Lapras', 'Lickitung', 'Machamp', 'Machoke', 'Machop', 'Magikarp', 'Magmar', 'Magnemite', 'Magneton', 'Mankey', 'Marowak', 'Meowth', 'Metapod', 'Mew', 'Mewtwo', 'Moltres', 'MrMime', 'Muk', 'Nidoking', 'Nidoqueen', 'Nidorina', 'Nidorino', 'Ninetales', 'Oddish', 'Omanyte', 'Omastar', 'Onix', 'Paras', 'Parasect', 'Persian', 'Pidgeot', 'Pidgeotto', 'Pidgey', 'Pikachu', 'Pinsir', 'Poliwag', 'Poliwhirl', 'Poliwrath', 'Ponyta', 'Porygon', 'Primeape', 'Psyduck', 'Raichu', 'Rapidash', 'Raticate', 'Rattata', 'Rhydon', 'Rhyhorn', 'Sandshrew', 'Sandslash', 'Scyther', 'Seadra', 'Seaking', 'Seel', 'Shellder', 'Slowbro', 'Slowpoke', 'Snorlax', 'Spearow', 'Squirtle', 'Starmie', 'Staryu', 'Tangela', 'Tauros', 'Tentacool', 'Tentacruel', 'Vaporeon', 'Venomoth', 'Venonat', 'Venusaur', 'Victreebel', 'Vileplume', 'Voltorb', 'Vulpix', 'Wartortle', 'Weedle', 'Weepinbell', 'Weezing', 'Wigglytuff', 'Zapdos', 'Zubat'];
//const classes = ['person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'];


let pokemon; 
let hp = "";
let attack = "";
let defense = "";
let speed = "";

let boxes = [];
let interval
let busy = false;
let isPlaying = false;

video.addEventListener("play", () => {
    const canvas = document.querySelector("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (isPlaying) {
        interval = setInterval(() => {
            context.drawImage(video,0,0);
            draw_boxes(canvas, boxes);
            const input = prepare_input(canvas);
            if (!busy) {
                console.log('post')
                video.pause();
                worker.postMessage(input);
                busy = true;
            }        
        },30*frames)
    }
});

worker.onmessage = (event) => {
    console.log('return')
    video.play();
    const output = event.data;
    const canvas = document.querySelector("canvas");
    boxes =  process_output(output, canvas.width, canvas.height);
    busy = false;
};

video.addEventListener("pause", () => {
    clearInterval(interval);
});

const playBtn = document.getElementById("play");
const pauseBtn = document.getElementById("pause");

playBtn.addEventListener("click", () => {
    video.play();
    isPlaying = true;
});
pauseBtn.addEventListener("click", () => {
    video.pause();
    isPlaying = false;
});

function prepare_input(img) {  
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0, 640, 640);
    const data = context.getImageData(0,0,640,640).data;
    const red = [], green = [], blue = [];
    for (let index=0;index<data.length;index+=4) {
        red.push(data[index]/255);
        green.push(data[index+1]/255);
        blue.push(data[index+2]/255);
    }
    return [...red, ...green, ...blue];
}

function process_output(output, img_width, img_height) {
    let boxes = [];
    for (let index=0;index<8400;index++) {
        const [class_id,prob] = [...Array(nc).keys()]
            .map(col => [col, output[8400*(col+4)+index]])
            .reduce((accum, item) => item[1]>accum[1] ? item : accum,[0,0]);
        if (prob < threshold) {
            continue;
        }
        const label = classes[class_id];
        fetch("/static/stats.csv")
            .then(response => response.text())
            .then(data => {
                const lines = data.split('\n');
                let lineNumber = -1;
                const searchedValue = '"' + label + '"';
                const found = lines.some((line, index) => {
                    const columns = line.split(',');
                    if (columns[1] === searchedValue) {
                        lineNumber = index + 1;
                        const selectedLine = lines[index];
                        console.log(`${selectedLine}`);
                        const columns2 = selectedLine.split(',');
                        type = columns2[3];
                        hp = columns2[6];
                        attack = columns2[7];
                        defense = columns2[8];
                        speed = columns2[11];
                        return true;
                    }
                    return false;
                });
        });

        pokemon = label;
        document.getElementById("pokemon").textContent = "A wild " + pokemon + " appeared!!!";
        document.getElementById("hp").textContent = hp;
        document.getElementById("attack").textContent = attack;
        document.getElementById("defense").textContent = defense;
        document.getElementById("speed").textContent = speed;
        const xc = output[index];
        const yc = output[8400+index];
        const w = output[2*8400+index];
        const h = output[3*8400+index];
        const x1 = (xc-w/2)/640*img_width;
        const y1 = (yc-h/2)/640*img_height;
        const x2 = (xc+w/2)/640*img_width;
        const y2 = (yc+h/2)/640*img_height;
        boxes.push([x1,y1,x2,y2,label,prob]);
    }

    boxes = boxes.sort((box1,box2) => box2[5]-box1[5])
    const result = [];
    while (boxes.length>0) {
        result.push(boxes[0]);
        boxes = boxes.filter(box => iou(boxes[0],box)<0.7);
    }
    return result;
}
function otraFuncionQueUtilizaValores() {
    type = var1.toString();
    hp = var2.toString();
    attack = var3.toString();
    defense = var4.toString();
    speed = var5.toString();
}

function iou(box1,box2) {
    return intersection(box1,box2)/union(box1,box2);
}

function union(box1,box2) {
    const [box1_x1,box1_y1,box1_x2,box1_y2] = box1;
    const [box2_x1,box2_y1,box2_x2,box2_y2] = box2;
    const box1_area = (box1_x2-box1_x1)*(box1_y2-box1_y1)
    const box2_area = (box2_x2-box2_x1)*(box2_y2-box2_y1)
    return box1_area + box2_area - intersection(box1,box2)
}

function intersection(box1,box2) {
    const [box1_x1,box1_y1,box1_x2,box1_y2] = box1;
    const [box2_x1,box2_y1,box2_x2,box2_y2] = box2;
    const x1 = Math.max(box1_x1,box2_x1);
    const y1 = Math.max(box1_y1,box2_y1);
    const x2 = Math.min(box1_x2,box2_x2);
    const y2 = Math.min(box1_y2,box2_y2);
    return (x2-x1)*(y2-y1)
}

function draw_boxes(canvas,boxes) {
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 3;
    ctx.font = "18px serif";
    boxes.forEach(([x1,y1,x2,y2,label]) => {
        ctx.strokeRect(x1,y1,x2-x1,y2-y1);
        ctx.fillStyle = "#00ff00";
        const width = ctx.measureText(label).width;
        ctx.fillRect(x1,y1,width+10,25);
        ctx.fillStyle = "#000000";
        ctx.fillText(label, x1, y1+18);
    });
}

