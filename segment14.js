let agents = [];
let segments = [];
let words = ["ART", "CODE", "MEDIA", "DESIGN", "INTERACT"]
let segmentColors = []
let idsTexture;
let segmentPositions = [
    [0, -40, 0, 60], // Segment 1 (top horizontal)
    [30, -20, Math.PI / 2, 40], // Segment 2 (top-right vertical)
    [30, 20, Math.PI / 2, 40], // Segment 3 (bottom-right vertical)
    [0, 40, 0, 60], // Segment 4 (bottom horizontal)
    [-30, 20, Math.PI / 2, 40], // Segment 5 (bottom-left vertical)
    [-30, -20, Math.PI / 2, 40], // Segment 6 (top-left vertical)
    [-15, 0, 0, 30], // Segment 7 (middle horizontal left)
    [15, 0, 0, 30], // Segment 8 (middle horizontal right)
    [0, -15, Math.PI / 2, 40], // Segment 9 (inner top vertical)
    [0, 15, Math.PI / 2, 40], // Segment 10 (inner bottom vertical)
    [20, -20, -Math.PI / 3, 40], // Segment 11 (inner top-right diagonal)
    [-20, -20, Math.PI / 3, 40], // Segment 12 (inner top-left diagonal)
    [20, 20, Math.PI / 3, 40], // Segment 13 (inner bottom-right diagonal)
    [-20, 20, -Math.PI / 3, 40]  // Segment 14 (inner bottom-left diagonal)
];

let characterMap = {
    "A": [true, true, true, false, true, true, true, true, false, false, false, false, false, false],
    "B": [false, false, true, true, true, true, true, true, false, false, false, false, false, false],
    "C": [true, false, false, true, true, true, false, false, false, false, false, false, false, false],
    "D": [true, true, true, true, false, false, false, false, true, true, false, false, false, false],
    "E": [true, false, false, true, true, true, true, false, false, false, false, false, false, false],
    "F": [true, false, false, false, true, true, true, false, false, false, false, false, false, false],
    "G": [true, false, true, true, true, true, false, false, false, false, false, false, false, false],
    "H": [false, true, true, false, true, true, true, true, false, false, false, false, false, false],
    "I": [false, false, false, false, false, false, false, false, true, true, false, false, false, false],
    "J": [false, true, true, true, false, false, false, false, false, false, false, false, false, false],
    "K": [true, false, true, false, true, true, true, false, false, false, false, false, false, false],
    "L": [false, false, false, true, true, true, false, false, false, false, false, false, false, false],
    "M": [false, true, true, false, true, true, false, false, false, false, true, true, false, false],
    "N": [false, true, true, false, true, true, false, false, false, false, false, true, true, false],
    "O": [true, true, true, true, true, true, false, false, false, false, false, false, false, false],
    "P": [true, true, false, false, true, true, true, true, false, false, false, false, false, false],
    "Q": [true, true, true, false, false, true, true, false, false, true, false, false, true, false],
    "R": [true, true, false, false, true, true, true, true, false, false, false, false, true, false],
    "S": [true, false, true, true, false, true, true, true, false, false, false, false, false, false],
    "T": [true, false, false, false, false, false, false, false, true, true, false, false, false, false],
    "U": [false, true, true, true, true, true, false, false, false, false, false, false, false, false],
    "V": [false, true, true, true, true, true, false, false, false, false, false, false, false, false],
    "W": [false, true, true, true, true, true, false, false, false, false, true, true, false, false],
    "X": [false, true, true, false, true, true, true, false, false, false, true, true, false, false],
    "Y": [false, true, true, true, false, true, true, false, false, false, false, false, false, false],
    "Z": [true, true, false, true, true, false, true, true, false, false, false, false, false, false]
};

class Segment14 {
    constructor(agent) {
        this.agent = agent;
    }

    setTarget(x, y, angle, length) {
        this.agent.setTarget(x, y, angle, length);
    }

    setTargetColor(x, y, angle, length, color) {
        this.agent.setTargetColor(x, y, angle, length, color);
    }

    update(t) {
        this.agent.update(t);
    }

    display() {
        this.agent.display();
    }

    displayShader() {
        this.agent.displayShader();
    }

    applyRepulsion(mouseX, mouseY) {
        this.agent.applyRepulsion(mouseX, mouseY);
    }
}



function targetWordFromRandom(word) {

    //clear segments
    segments = [];
    segmentColors = [];

    for (let i = 0; i < word.length; i++) {
        let char = word[i];
        let segmentStates = characterMap[char];

        for (let j = 0; j < segmentStates.length; j++) {
            let pos = segmentPositions[j];
            let x = random(-width, width);
            let y = random(-height, height);
            let angle = random(TWO_PI);
            let length = pos[3];
            //let color = random(1) > 0.5 ? 255 : 0;

            if (segmentStates[j]) {
                let color = 255;
                let agent = new Agent(x, y, angle, length, color);
                let segment = new Segment14(agent);
                segments.push(segment);
                segment.setTarget(getPositionXSegment(pos, i,word.length), getPositionYSegment(pos, i), pos[2], length);
                segmentColors.push(1.0);

            } else {
                if (random(1) > 0) {

                    let color = 0;
                    let agent = new Agent(x, y, angle, length, color, segments.length);
                    let segment = new Segment14(agent);
                    segments.push(segment);
                    segment.setTarget(getPositionXSegment(pos, i,word.length), getPositionYSegment(pos, i), pos[2], length);
                    segmentColors.push(0.0)
                }
            }
        }
    }

    updateSegmentsColor();

}

function targetWordFromActual(word) {

    newAgents = [];

    for (let i = 0; i < word.length; i++) {
        let char = word[i];
        console.log("character is : " + char)
        let segmentStates = characterMap[char];

        for (let j = 0; j < segmentStates.length; j++) {

            let pos = segmentPositions[j];
            let x = getPositionXSegment(pos, i,word.length);
            let y = getPositionYSegment(pos, i);
            let angle = pos[2];
            let length = pos[3];
            let color = segmentStates[j] ? 255 : 0;
            let agent = new Agent(x, y, angle, length, color);
            console.log(agent.x, agent.y)
            newAgents.push(agent);

        }
    }


    //Compate newAgents with actuel segments.length
    console.log("newAgents before: " + newAgents.length);
    console.log("segments before: " + segments.length);

    //add some new segments with random pos if needed
    for (let i = segments.length; i < newAgents.length; i++) {
        let x = random(width);
        let y = random(height);
        let angle = random(TWO_PI);
        let length = 40;
        //let color = random(1) > 0.5 ? 255 : 0;
        let color = 0;
        let agent = new Agent(x, y, angle, length, color);
        let segment = new Segment14(agent);
        segments.push(segment);
    }

    // At the contrary, remove some segments if there is too much
    let elementToRemove = segments.length - newAgents.length;
    for (let i = 0; i < elementToRemove; i++) {
        segments.pop();
    }

    console.log("newAgents after: " + newAgents.length);
    console.log("segments after: " + segments.length);

    //set target for all segments
    for (let i = 0; i < newAgents.length; i++) {
        let agent = newAgents[i];
        let xvalue = random(500)
        segments[i].setTargetColor(agent.x, agent.y, agent.angle, agent.length, agent.color);
        // console.log this setTarget(agent.x, agent.y, agent.angle, agent.length);
        console.log("agent", agent.x, agent.y)
    }

    updateSegmentsColor();

}
function getPositionXSegment(pos, i,nbLetter) {

    let marginX = (8 - nbLetter) * 50;

    return pos[0] + i * 100 - 350 + marginX;
}

function getPositionYSegment(pos, i) {
    return pos[1];
}

function updateSegmentsColor() {

    segmentColors = [];
    for (let i = 0; i < segments.length; i++) {
        let color = segments[i].agent.color;
        if (color > 0) {
            segmentColors.push(1.0);
        } else {
            segmentColors.push(0.0)
        }
    }

    // Créer une texture 1D (une image d'une seule ligne) et uploader idValues dans la texture.
    idsTexture = createImage(segmentColors.length, 1);
    idsTexture.loadPixels();
    for (let i = 0; i < segments.length; i++) {
        // On encode la valeur dans le canal rouge
        let value = floor(segmentColors[i] * 255);
        idsTexture.pixels[i * 4] = value;
        idsTexture.pixels[i * 4 + 1] = value;
        idsTexture.pixels[i * 4 + 2] = value;
        idsTexture.pixels[i * 4 + 3] = 255;
    }
    idsTexture.updatePixels();

}


