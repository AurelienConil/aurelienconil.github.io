let paintShader, voronoiShader, floodShader, illumShader,
  distanceShader, distanceShowShader, blurShader,
  prev, next, sz;
let show = 'illum';
let cnv;
let currentWord = 0

let tigeHeight = 80;
let tigeWidth = 10;

let lastReset = 0; //Temps d'activation du message

let touchStartY = 0; // Gestion de la souris / touch
let deltaTouchY = 0;
const swipeThreshold = 500; // Seuil en pixels pour considérer un swipe down

//FONT for debug
let font;

function preload() {
  font = loadFont('assets/consolata.otf', font => {

    console.log("font has been loaded")

  });
}



function setup() {
  currentWord = int(random(words.length));
  targetWordFromRandom(words[currentWord]);
  //cnv = createCanvas(windowWidth, windowHeight, WEBGL);

  //Create Canva, according to Desktop / Mob
  if (windowWidth < 900) {
    cnv = createCanvas(900, 300, WEBGL);
  } else {
    cnv = createCanvas(windowWidth, 500, WEBGL);

  }


  cnv.parent('canvas-container'); // Attach the canvas to the container with ID 'canvas-container'
  pixelDensity(0.8);
  sz = min(width, height);
  paintShader = createShader(vertexShaderSrc, paintShaderSrc);
  voronoiShader = createShader(vertexShaderSrc, voronoiShaderSrc);
  floodShader = createShader(vertexShaderSrc, floodShaderSrc);
  distanceShader = createShader(vertexShaderSrc, distanceShaderSrc);
  distanceShowShader = createShader(vertexShaderSrc, distanceShowShaderSrc);
  illumShader = createShader(vertexShaderSrc, illumShaderSrc);
  blurShader = createShader(vertexShaderSrc, blurShaderSrc);
  prev = createFramebuffer({ format: FLOAT, depth: false, textureFiltering: NEAREST, antialias: false });
  next = createFramebuffer({ format: FLOAT, depth: false, textureFiltering: NEAREST, antialias: false });


}

let t = 8;
function mouseClicked() {

}

function touchStarted() {

  for (let touch of touches) {
    touchStartY = touch.y;
  }




}

function touchEnded() {
  if (deltaTouchY > swipeThreshold) {
    console.log("Swipe down détecté");
    triggerEvent("swipe down");
  }
  touchStartY = 0;

}

function touchMoved() {
  // Parmi plusieurs touches, on prend la première
  if (touches.length > 0) {
    let touchEndY = touches[0].y;
    deltaTouchY = touchStartY - touchEndY;

  } else {
    // Si plus aucune touche active, utiliser directement changedTouches (compatibilité selon support)
    // Vous pouvez éventuellement utiliser event.changedTouches si nécessaire
  }

  // Réinitialiser pour le prochain touché

}

function mouseWheel(event) {
  // event.delta positif : roulis vers le bas, négatif : roulis vers le haut
  if (event.delta > 0) {
    console.log("Mouse wheel: scroll down");
    triggerEvent("mouseWheel down");
  } else if (event.delta < 0) {
    console.log("Mouse wheel: scroll up");
    triggerEvent("mouseWheel up");
  }
  // Empêcher le scroll par défaut du navigateur
  return false;
}

function triggerEvent(eventType) {
  // Ici, vous pouvez adapter la réaction de votre sketch.
  // Par exemple, modifier la couleur de fond, lancer une animation, etc.
  console.log("Événement déclenché:", eventType);

  // Exemple : changer la couleur de fond selon l'événement
  if (eventType === "mouseWheel down" || eventType === "swipe down") {
    console.log("wheel down")
    changePrev();


  } else if (eventType === "mouseWheel up") {
    console.log("wheel up");
    changeNext();
  }
}

function changeNext() {
  currentWord += 1
  currentWord = currentWord % words.length
  console.log("current world = " + currentWord);
  targetWordFromRandom(words[currentWord]);
  lastReset = millis() * 0.0001;

}

function changePrev() {
  currentWord--;
  if (currentWord < 0) currentWord = words.length - 1;
  targetWordFromRandom(words[currentWord]);
  lastReset = millis() * 0.0001;
}

function windowResized() {
  resizeCanvas(windowWidth, 400);

  // setTimeout(() => {
  //   targetWordFromRandom(currentWord);
  //   lastReset = millis() * 0.0001;
  // }, 2000)

}

function keyPressed() {
  if (key == 'S' || key == 's') save(cnv, 'myCanvas.jpg');


  if (key == 'b') {
    //put all the tiges in black
    idsArray = [0.0, 0.0, 0.0, 0.0];

  }

  if (key == 'w') {
    //put all the tiges in white
    idsArray = [1.0, 1.0, 1.0, 1.0];
  }

  if (key == 'n') {
    let word = random(words);
    console.log("new word is:" + word)
    targetWordFromRandom(word);
    lastReset = millis() * 0.0001;
  }
}

function draw() {

  background(120);
  let t = millis() * 0.0001;

  let displayOpengl = true;

  for (let segment of segments) {
    segment.update(t - lastReset);
    if (!displayOpengl) {
      segment.display();

    }
    let glMouseX = mouseX - width / 2;
    let glMouseY = mouseY - height / 2;
    segment.applyRepulsion(glMouseX, glMouseY);
  }







  if (displayOpengl) {




    noStroke();

    // Paint pixels according to the following scheme:
    // r/g: the coordinates of the closest region pixel
    // a: id of region if > 0
    //    0 if empty space, 
    //    -1 if pixel was visited during the jump flood)
    shader(paintShader);
    prev.begin();
    clear();
    noiseSeed(0.5);

    //console.log("segments: " + segments.length);
    paintShader.setUniform("u_color", [1, 1, 1, 1]);
    for (let i = 0; i < segments.length; i += 1) {
      paintShader.setUniform("u_color", [0, 0, 0, i + 1]);
      push();
      segments[i].displayShader();
      pop();
    }



    prev.end();





    // The jump flood passes
    for (let i = 12; i >= 0; i--) {
      next.begin();
      clear();
      shader(floodShader);
      floodShader.setUniform('u_tex', prev.color);
      floodShader.setUniform('u_step', 1 << i);
      floodShader.setUniform('u_pixel', [1 / width, 1 / height]);
      plane(width, height);
      next.end();
      [next, prev] = [prev, next];
    }

    // Display
    if (show == 'voronoi') {
      shader(voronoiShader);
      voronoiShader.setUniform('u_tex', prev.color);
      voronoiShader.setUniform('u_pixel', [1 / width, 1 / height]);
      plane(width, height);
    } else {
      // Compute distance field
      next.begin()
      clear();
      shader(distanceShader);
      distanceShader.setUniform('u_tex', prev.color);
      distanceShader.setUniform('u_pixel', [3 / width, 3 / height]);
      plane(width, height);
      next.end();
      // Display the distances
      prev.begin();
      clear();
      if (show == 'distance') {
        shader(distanceShowShader);
        distanceShowShader.setUniform('u_tex', next.color);
        plane(width, height);
      } else {
        shader(illumShader);
        //

        illumShader.setUniform('u_tex', next.color);
        illumShader.setUniform('u_pixel', [1 / width, 1 / height]);
        illumShader.setUniform('u_time', t);
        illumShader.setUniform("u_idsTexture", idsTexture);
        illumShader.setUniform('u_idsCount', float(segments.length));
        plane(width, height);
      }
      prev.end();

      next.begin();
      shader(blurShader);
      blurShader.setUniform('u_tex', prev.color);
      blurShader.setUniform('u_pixel', [1 / width, 1 / height]);
      plane(width, height);
      next.end();

      shader(blurShader);
      blurShader.setUniform('u_tex', next.color);
      blurShader.setUniform('u_pixel', [1 / width, 1 / height]);
      plane(width, height);
    }

    resetShader();
  }


  // Draw something without the shader
  // fill(255);
  // textFont(font);
  // textSize(20);
  // let fps = frameRate();
  // text("FFFPS: " + fps.toFixed(0), 100, 100);
  // // text("TouchY: " + touchStartY, 100, 120);
  // // text("DelatTouchY: " + deltaTouchY, 100, 150);
  //   text("width: " + width, 100, 120);
  // text("height: " + height, 100, 150);



}