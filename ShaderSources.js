/**
 * Vertex shader 
 **/
const vertexShaderSrc = `
precision highp float;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
}`;

/**
 * Frag shader to draw initial regions
 **/
const paintShaderSrc = `
precision highp float;
uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
}
`;

/**
 * Frag shader to display voronoi regions
 **/
const voronoiShaderSrc = `
precision highp float;
uniform vec2 u_pixel; // Size of a pixel
uniform sampler2D u_tex; // The texture
varying vec2 vTexCoord; // Texture coordinate of the pixel

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 regionColor(float regionId) {
    float r = rand(vec2(regionId,1));
    float g = rand(vec2(regionId,2));
    float b = rand(vec2(regionId,3 ));
    return vec3 (r,g,b);
}

void main() {
    vec4 p = texture2D(u_tex, vTexCoord);
    if (p.a > 0.) {
        gl_FragColor = vec4(regionColor(p.a),1.);
    }
    else if (p.a < 0.) {
        vec2 uv = p.rg;
        vec4 pixel = texture2D(u_tex, uv);
        gl_FragColor = vec4(regionColor(pixel.a), 0.9);
    }
    else {
        gl_FragColor = vec4(1.);
    }
}
`;

/**
 * Frag shader to compute distance fields
 **/
const distanceShaderSrc = `
precision highp float;
uniform vec2 u_pixel; // Size of a pixel
uniform sampler2D u_tex; // The texture
varying vec2 vTexCoord; // Texture coordinate of the pixel

void main() {
    vec4 p = texture2D(u_tex, vTexCoord);
    if (p.a > 0.) { // Original pixel
        gl_FragColor = vec4(0.,0.,0.,p.a);
    }
    else if (p.a < 0.) { // Empty pixel visited by the jump flood.
        vec2 uv = p.rg;
        vec4 pixel = texture2D(u_tex, uv);
        float dist = length((p.rg - vTexCoord) / u_pixel); // distance in pixels
        gl_FragColor = vec4(dist, 0., 0., pixel.a);
    }
    else { // Should never happen. All pixels should have been visited by the jump flood.
        gl_FragColor = vec4(0., 0., 1., 0.);
    }
}
`;

/**
 * Displays the distance field
 **/
const distanceShowShaderSrc = `
precision highp float;
uniform sampler2D u_tex; // The texture
varying vec2 vTexCoord; // Texture coordinate of the pixel

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 regionColor(float regionId) {
    float r = rand(vec2(regionId,1.));
    float g = rand(vec2(regionId,2.));
    float b = rand(vec2(regionId,3.));
    return vec3 (r,g,b);
}

void main() {
    float maxDist = 500.;
    vec4 p = texture2D(u_tex, vTexCoord);
    vec3 basicColor = regionColor(p.a);
    float dist = p.r;
    if (mod(floor(dist),20.) != 0.) {
        float alpha = clamp((maxDist - dist) / maxDist, 0., 1.);
        gl_FragColor = vec4(basicColor, 1.0-alpha); 
    }
    else {
        gl_FragColor = vec4(0., 0., 0., 1.); 
    }
}
`;

/**
 * A debug view of the distance field
 **/
const debugShaderSrc = `
precision highp float;
uniform sampler2D u_tex; // The texture
varying vec2 vTexCoord; // Texture coordinate of the pixel

void main() {
    float maxDist = 255.;
    vec4 p = texture2D(u_tex, vTexCoord);
    if (p.a > 0.) {
        float color = p.a / 10.;
        gl_FragColor = vec4(color, color, color, 1.); 
    }
    else if (p.b != 0.0 || p.a < 0.) {
        gl_FragColor = vec4(0., 0., 1., 1.);
    }
    else {
        gl_FragColor = vec4(1., 0., 0., 1.);
    }
}
`;

/**
 * A simple blur shader
 **/
const blurShaderSrc = `
precision highp float;
uniform sampler2D u_tex; // The texture
uniform vec2 u_pixel; // Size of a pixel
varying vec2 vTexCoord; // Texture coordinate of the pixel

#define gaussian_blur mat3(1, 2, 1, 2, 4, 2, 1, 2, 1) * 0.0625

// Iterate over all pixels in 3x3 kernel area
vec4 convolute(vec2 uv, mat3 kernel) {
    vec4 color = vec4(0);
    
    float direction[3];
    direction[0] = -1.;
    direction[1] = 0.;
    direction[2] = 1.;
    for (int x = 0; x < 3; x++) {
        for (int y = 0; y < 3; y++) {
            vec2 offset = vec2(direction[x], direction[y]) * u_pixel;
            color += texture2D(u_tex, uv + offset) * kernel[x][y];
        }
    }
    return color;
}

void main() {
    gl_FragColor = convolute(vTexCoord, gaussian_blur);
}
`;

/**
 * Frag shader to jump flood one step
 **/
const floodShaderSrc = `
precision highp float;
uniform vec2 u_pixel; // Size of a pixel
uniform sampler2D u_tex; // The texture
uniform float u_step; // Jump flood step
varying vec2 vTexCoord; // Texture coordinate of the pixel
#define FAR 1e3

void main() {
    vec4 p = texture2D(u_tex, vTexCoord);
    
    if (p.a > 0.) {  
        // An original pixel
        gl_FragColor = p;
        return;
    }
    
    // An originally empty pixel
    vec2 closest_pixel = vec2(-1);
    float closest_dist = FAR; // Very far...
    if (p.a == -1.) {
        // already visited
        closest_pixel = p.rg;
        closest_dist = length((p.rg - vTexCoord) / u_pixel);
    }
    
    for (int y = -1; y <= 1; ++y) {
        for (int x = -1; x <= 1; ++x) { 
            vec2 v = vec2(x, y) * u_step; // Vector from pos to neighbor in pixel coordinates
            vec2 uv = vTexCoord + v * u_pixel; // Texture coord of neighbor
            if (uv.x < 0. || uv.x >= 1. || uv.y < 0. || uv.y >= 1.) continue;
            vec4 sample = texture2D(u_tex, uv);
            
            if (sample.a >= 1.) {  // An original pixel neighbor
                float dist = length(v);
                if (dist < closest_dist) {
                    closest_dist = dist;
                    closest_pixel = uv;
                }
            } else if (sample.a == -1.) { // A visited empty pixel neighbor
                float dist = length((sample.rg - vTexCoord) / u_pixel);
                if (dist < closest_dist) {
                    closest_dist = dist;
                    closest_pixel = sample.rg;
                }
            }
        }
    }
    if (closest_dist < FAR) p = vec4(closest_pixel, 0, -1.);
    gl_FragColor = p;
}
`;

/**
 * Frag shader to compute global illumination per pixel
 **/
const illumShaderSrc = `
precision highp float;
uniform vec2 u_pixel; // Size of a pixel
uniform sampler2D u_tex; // The distance map texture
uniform float u_time; // Time in seconds
uniform float u_idsArray[140]; // Array to determine if a region is white or black
uniform sampler2D u_idsTexture; // Texture contenant les valeurs dynamique (1D stockée en 2D)
uniform float u_idsCount;        // Nombre réel de valeurs présentes (≤ 140)
varying vec2 vTexCoord; // Texture coordinate of the pixel

// constants
#define PI 3.141596
//#define RAYS_PER_PIXEL 48
#define RAYS_PER_PIXEL 5
//#define MAX_RAYMARCH_STEPS 100
#define MAX_RAYMARCH_STEPS 50
#define MAX_DIST 100.0

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

vec3 lin_to_srgb (vec3 color) {
    vec3 x = color.rgb * 12.92;
    vec3 y = 1.055 * pow(clamp(color, 0.0, 1.0), vec3(0.4166667)) - 0.055;
    vec3 clr = color;
    clr.r = (color.r < 0.0031308) ? x.r : y.r;
    clr.g = (color.g < 0.0031308) ? x.g : y.g;
    clr.b = (color.b < 0.0031308) ? x.b : y.b;
    return clr;
}

vec2 raymarch(vec2 origin, vec2 dir) {
    float current_dist = 0.0;
    for(int i = 0; i < MAX_RAYMARCH_STEPS; i++) {
        vec2 point_coords = origin + dir * current_dist;
        vec2 uv = point_coords * u_pixel;

        // early exit if we hit the edge of the screen. 
        // or if light too far to matter
        if(uv.x > 1.0 || uv.x < 0.0 || uv.y > 1.0 || uv.y < 0.0 || current_dist > MAX_DIST){
             return vec2(-1);
        }
        

        vec4 sample = texture2D(u_tex, uv); // Get distance field
        float dist_to_surface = sample.r;

        // we've hit a surface if distance field returns 0 or close to 0 (due to our distance field using a 16-bit float
        // the precision isn't enough to just check against 0).
        if(dist_to_surface < 0.001) {
            return vec2 (current_dist, sample.a); // We need the distance and the surface id
        }

        // if we don't hit a surface, continue marching along the ray.
        current_dist += dist_to_surface;
    }
    return vec2(-1);
}

void main() {
    vec3 pixel_col = vec3(0.0);

    // get fragment texture coordinates
    vec2 uv = vTexCoord;

    // get fragment pixel coordinates
    vec2 pos = uv / u_pixel;

    float rand2pi = random(uv * vec2(u_time, -u_time)) * 2.0 * PI;
    float golden_angle = PI * 0.7639320225; // magic number that gives us a good ray distribution.
    float N = 140.0; // Nombre total d'éléments dans la texture des ids

    for(int i = 0; i < RAYS_PER_PIXEL; i++) {
        // get our ray dir by taking the random angle and adding golden_angle * ray number.
        float cur_angle = rand2pi + golden_angle * float(i);
        vec2 ray_dir = normalize(vec2(cos(cur_angle), sin(cur_angle)));
        vec2 hit = raymarch(pos, ray_dir);
        float dist = hit.x;
        float id = hit.y;
        if(id > 0.) { // we hit something
            // Convention: even ids emit light
            int index = int(id - 1.0); // Utilisation d'un index entier explicite
            float u_coord = (float(index) + 0.5) / u_idsCount;
            float value = texture2D(u_idsTexture, vec2(u_coord, 0.5)).r;
            
            // Utilisation de conditions pour accéder aux éléments du tableau
            // if (index == 0) {
            //     value = u_idsArray[0];
            // } else if (index == 1) {
            //     value = u_idsArray[1];
            // } else if (index == 2) {
            //     value = u_idsArray[2];
            // } else if (index == 3) {
            //     value = u_idsArray[3];
            // } else if (index == 4) {
            //     value = u_idsArray[4];
            // }else if (index == 5) {
            //     value = u_idsArray[5];
            // }else if (index == 6) {
            //     value = u_idsArray[6];
            // }else if (index == 7) {
            //     value = u_idsArray[7];
            // }else if (index == 8) {
            //     value = u_idsArray[8];
            // }else if (index == 9) {
            //     value = u_idsArray[9];
            // }else if (index == 10) {
            //     value = u_idsArray[10];
            // }else if (index == 11) {
            //     value = u_idsArray[11];
            // }else if (index == 12) {
            //     value = u_idsArray[12];
            // } else if (index == 13) {
            //     value = u_idsArray[13];
            // } else if (index == 14) {
            //     value = u_idsArray[14];
            // }


            
            if (value > 0.0) {
           // if ( u_idsArray[3] == 1.0) {

                if (dist > 0.01) pixel_col += vec3((MAX_DIST - min(dist, MAX_DIST)) / MAX_DIST);
                else {
                    gl_FragColor = vec4(1., 1., 1., 1.);
                    return;
                }
            }
        }
    }
    gl_FragColor = vec4(lin_to_srgb(pixel_col / float(RAYS_PER_PIXEL)), 1.);
}
`;